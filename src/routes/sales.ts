import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRow, getRows, runQuery } from '../config/database';
import { Sale, SaleCreate, SaleProduct, SaleProductCreate, Product, PaginationParams, PaginatedResponse } from '../types';
import { buildPaginationQuery, getPaginationMeta, createPaginatedResponse } from '../utils/pagination';
import { logDeletion } from '../utils/deletion-log';

const router = express.Router();

// Obtener óptica del usuario autenticado
async function getUserOpticsId(userId: number, userRole: string): Promise<number | null> {
  if (userRole === 'admin') {
    return null; // Admin puede ver todas las ópticas
  }
  const user = await getRow<{ optics_id: number | null }>(
    'SELECT optics_id FROM users WHERE id = ?',
    [userId]
  );
  return user?.optics_id || null;
}

// Función auxiliar para calcular total de una venta
function calculateTotal(products: SaleProductCreate[]): number {
  return products.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const itemTotal = quantity * unitPrice;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);
}

// Listar ventas con paginación y búsqueda
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    const paginationParams: PaginationParams = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      sortBy: req.query.sortBy as string,
      sortOrder: (req.query.sortOrder as 'ASC' | 'DESC') || 'DESC',
    };

    let baseQuery = `
      SELECT s.*, c.name as client_name, u.username as user_name, o.name as optics_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN optics o ON s.optics_id = o.id
      WHERE s.is_active = 1
    `;
    const baseParams: any[] = [];

    if (opticsId !== null) {
      baseQuery += ' AND s.optics_id = ?';
      baseParams.push(opticsId);
    }

    // Query para contar total
    let countQuery = `
      SELECT COUNT(*) as count
      FROM sales s
      WHERE s.is_active = 1
    `;
    const countParams = [...baseParams];

    if (opticsId !== null) {
      countQuery += ' AND s.optics_id = ?';
    }

    // Búsqueda en nombre del cliente
    const searchFields = ['c.name'];
    const { query, params } = buildPaginationQuery(baseQuery, paginationParams, searchFields);
    const allParams = [...baseParams, ...params];

    // Ajustar count query con búsqueda
    if (paginationParams.search) {
      countQuery += ` AND EXISTS (
        SELECT 1 FROM clients c WHERE c.id = s.client_id AND c.name LIKE ?
      )`;
      const searchPattern = `%${paginationParams.search}%`;
      countParams.push(searchPattern);
    }

    const sales = await getRows<any>(query, allParams);

    // Obtener productos para cada venta
    for (const sale of sales) {
      const products = await getRows<SaleProduct>(
        `SELECT sp.*, p.name as product_name, p.price as base_price
         FROM sale_products sp
         LEFT JOIN products p ON sp.product_id = p.id
         WHERE sp.sale_id = ?`,
        [sale.id]
      );
      sale.products = products;
    }

    const { total, totalPages } = await getPaginationMeta(countQuery, countParams, paginationParams.page!, paginationParams.limit!);

    const response: PaginatedResponse<Sale> = createPaginatedResponse(
      sales,
      paginationParams.page!,
      paginationParams.limit!,
      total
    );

    res.json(response);
  } catch (error: any) {
    console.error('Error al listar ventas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una venta por ID con productos
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const sale = await getRow<any>(
      `SELECT s.*, c.name as client_name, u.username as user_name, o.name as optics_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN optics o ON s.optics_id = o.id
       WHERE s.id = ? AND s.is_active = 1`,
      [id]
    );

    if (!sale) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && sale.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a esta venta' });
    }

    // Obtener productos de la venta
    const products = await getRows<SaleProduct>(
      `SELECT sp.*, p.name as product_name, p.price as base_price
       FROM sale_products sp
       LEFT JOIN products p ON sp.product_id = p.id
       WHERE sp.sale_id = ?`,
      [id]
    );

    sale.products = products;

    res.json(sale);
  } catch (error: any) {
    console.error('Error al obtener venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear venta con productos
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      client_id,
      sale_date,
      od_esf,
      od_cil,
      od_eje,
      od_add,
      oi_esf,
      oi_cil,
      oi_eje,
      oi_add,
      notes,
      products,
      optics_id, // Puede venir del body aunque no esté en el tipo
    } = req.body as SaleCreate & { optics_id?: number };

    if (!client_id) {
      return res.status(400).json({ error: 'El cliente es requerido' });
    }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Debe agregar al menos un producto a la venta' });
    }

    const opticsId = optics_id || (await getUserOpticsId(user.id, user.role));
    
    if (opticsId === null) {
      return res.status(400).json({ error: 'No se pudo determinar la óptica. Se requiere optics_id.' });
    }

    // Verificar que el cliente pertenece a la óptica
    const client = await getRow<{ optics_id: number }>(
      'SELECT optics_id FROM clients WHERE id = ? AND is_active = 1',
      [client_id]
    );

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    if (client.optics_id !== opticsId) {
      return res.status(403).json({ error: 'El cliente no pertenece a esta óptica' });
    }

    // Validar productos
    for (const product of products) {
      const productExists = await getRow<Product>(
        'SELECT * FROM products WHERE id = ? AND optics_id = ? AND is_active = 1',
        [product.product_id, opticsId]
      );

      if (!productExists) {
        return res.status(404).json({ error: `Producto con ID ${product.product_id} no encontrado` });
      }

      const quantity = Number(product.quantity) || 0;
      const unitPrice = Number(product.unit_price) || 0;

      if (quantity <= 0) {
        return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
      }

      if (isNaN(unitPrice) || unitPrice < 0) {
        return res.status(400).json({ error: 'El precio unitario debe ser un número válido mayor o igual a 0' });
      }
    }

    // Calcular total
    const totalPrice = calculateTotal(products);

    if (isNaN(totalPrice) || totalPrice < 0) {
      return res.status(400).json({ error: 'Error al calcular el total de la venta' });
    }

    // Crear la venta
    const saleResult = await runQuery(
      `INSERT INTO sales (
        optics_id, client_id, user_id, sale_date,
        od_esf, od_cil, od_eje, od_add,
        oi_esf, oi_cil, oi_eje, oi_add,
        notes, total_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id`,
      [
        opticsId,
        client_id,
        user.id,
        sale_date || new Date().toISOString(),
        od_esf || null,
        od_cil || null,
        od_eje || null,
        od_add || null,
        oi_esf || null,
        oi_cil || null,
        oi_eje || null,
        oi_add || null,
        notes || null,
        totalPrice,
      ]
    );

    const saleId = saleResult.lastID;

    // Crear productos de la venta
    for (const product of products) {
      const quantity = Number(product.quantity) || 0;
      const unitPrice = Number(product.unit_price) || 0;
      const productTotal = quantity * unitPrice;

      await runQuery(
        `INSERT INTO sale_products (sale_id, product_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?)`,
        [saleId, product.product_id, quantity, unitPrice, productTotal]
      );
    }

    // Obtener la venta completa con relaciones
    const sale = await getRow<any>(
      `SELECT s.*, c.name as client_name, u.username as user_name, o.name as optics_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN optics o ON s.optics_id = o.id
       WHERE s.id = ?`,
      [saleId]
    );

    // Obtener productos
    const saleProducts = await getRows<SaleProduct>(
      `SELECT sp.*, p.name as product_name, p.price as base_price
       FROM sale_products sp
       LEFT JOIN products p ON sp.product_id = p.id
       WHERE sp.sale_id = ?`,
      [saleId]
    );

    sale.products = saleProducts;

    res.status(201).json(sale);
  } catch (error: any) {
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar venta con productos
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const {
      sale_date,
      od_esf,
      od_cil,
      od_eje,
      od_add,
      oi_esf,
      oi_cil,
      oi_eje,
      oi_add,
      notes,
      products,
    } = req.body;

    const existing = await getRow<Sale>(
      'SELECT * FROM sales WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a esta venta' });
    }

    let totalPrice = existing.total_price;

    // Si hay productos, actualizarlos
    if (products && Array.isArray(products) && products.length > 0) {
      // Validar productos
      for (const product of products) {
        const productExists = await getRow<Product>(
          'SELECT * FROM products WHERE id = ? AND optics_id = ? AND is_active = 1',
          [product.product_id, existing.optics_id]
        );

        if (!productExists) {
          return res.status(404).json({ error: `Producto con ID ${product.product_id} no encontrado` });
        }

        const quantity = Number(product.quantity) || 0;
        const unitPrice = Number(product.unit_price) || 0;

        if (quantity <= 0) {
          return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' });
        }

        if (isNaN(unitPrice) || unitPrice < 0) {
          return res.status(400).json({ error: 'El precio unitario debe ser un número válido mayor o igual a 0' });
        }
      }

      // Eliminar productos existentes
      await runQuery('DELETE FROM sale_products WHERE sale_id = ?', [id]);

      // Insertar nuevos productos
      totalPrice = 0;
      for (const product of products) {
        const quantity = Number(product.quantity) || 0;
        const unitPrice = Number(product.unit_price) || 0;
        const productTotal = quantity * unitPrice;

        await runQuery(
          `INSERT INTO sale_products (sale_id, product_id, quantity, unit_price, total_price)
           VALUES (?, ?, ?, ?, ?)`,
          [id, product.product_id, quantity, unitPrice, productTotal]
        );

        totalPrice += productTotal;
      }

      if (isNaN(totalPrice) || totalPrice < 0) {
        return res.status(400).json({ error: 'Error al calcular el total de la venta' });
      }
    }

    // Actualizar la venta
    await runQuery(
      `UPDATE sales 
       SET sale_date = ?,
           od_esf = ?, od_cil = ?, od_eje = ?, od_add = ?,
           oi_esf = ?, oi_cil = ?, oi_eje = ?, oi_add = ?,
           notes = ?, total_price = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        sale_date || existing.sale_date,
        od_esf ?? existing.od_esf,
        od_cil ?? existing.od_cil,
        od_eje ?? existing.od_eje,
        od_add ?? existing.od_add,
        oi_esf ?? existing.oi_esf,
        oi_cil ?? existing.oi_cil,
        oi_eje ?? existing.oi_eje,
        oi_add ?? existing.oi_add,
        notes ?? existing.notes,
        totalPrice,
        id,
      ]
    );

    // Obtener la venta completa
    const sale = await getRow<any>(
      `SELECT s.*, c.name as client_name, u.username as user_name, o.name as optics_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN users u ON s.user_id = u.id
       LEFT JOIN optics o ON s.optics_id = o.id
       WHERE s.id = ?`,
      [id]
    );

    // Obtener productos
    const saleProducts = await getRows<SaleProduct>(
      `SELECT sp.*, p.name as product_name, p.price as base_price
       FROM sale_products sp
       LEFT JOIN products p ON sp.product_id = p.id
       WHERE sp.sale_id = ?`,
      [id]
    );

    sale.products = saleProducts;

    res.json(sale);
  } catch (error: any) {
    console.error('Error al actualizar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar venta (soft delete con log)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const existing = await getRow<Sale>(
      'SELECT * FROM sales WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a esta venta' });
    }

    // Obtener productos para el log
    const products = await getRows<SaleProduct>(
      'SELECT * FROM sale_products WHERE sale_id = ?',
      [id]
    );

    const saleData = { ...existing, products };

    // Registrar en log antes de eliminar
    await logDeletion('sales', id, user.id, saleData, req.body.reason);

    // Soft delete
    await runQuery(
      'UPDATE sales SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
