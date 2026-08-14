import express, { Request, Response } from 'express';
import { PoolClient } from 'pg';
import { authenticateToken, AuthRequest, getOpticsScope } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createSaleSchema, updateSaleSchema } from '../schemas';
import { getRow, getRows, runQuery, getDatabase } from '../config/database';
import { Sale, SaleCreate, SaleProduct, SaleProductCreate, Product, PaginationParams, PaginatedResponse } from '../types';
import { buildPaginationQuery, getPaginationMeta, createPaginatedResponse } from '../utils/pagination';
import { logDeletion } from '../utils/deletion-log';

const router = express.Router();

// Función auxiliar para calcular total de una venta
function calculateTotal(products: SaleProductCreate[]): number {
  return products.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const itemTotal = quantity * unitPrice;
    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
  }, 0);
}

/* ─────────────────────────────────────────────────────────────────────────────
 * POLÍTICA DE STOCK (decisión de producto, no sólo técnica)
 *
 * 1. El stock se mueve SIEMPRE dentro de la misma transacción que crea, edita o
 *    borra la venta. Si no, existiría una ventana en la que la venta ya está
 *    registrada pero el stock todavía no bajó (o al revés), y el inventario
 *    quedaría permanentemente desfasado ante cualquier error.
 *
 * 2. Nunca se permite stock negativo. El descuento se hace con un UPDATE
 *    condicional (`WHERE COALESCE(quantity,0) >= $1`): la comprobación y la
 *    resta ocurren en la misma sentencia, así que dos ventas simultáneas del
 *    mismo armazón no pueden "pasar" las dos — la segunda no encuentra fila.
 *    Un SELECT previo seguido de un UPDATE tendría esa carrera.
 *
 * 3. Si no alcanza, se aborta la venta ENTERA (ROLLBACK) y se devuelve un 400
 *    nombrando el producto y el stock disponible. Es preferible frenar al
 *    vendedor con un mensaje accionable ("quedan 2, estás vendiendo 3") a
 *    dejarlo vender aire: el número negativo se arrastra por todo el sistema y
 *    después nadie sabe cuál era el stock real.
 *
 * 4. Un producto con `quantity` NULL se trata como 0. La alternativa (tratarlo
 *    como "sin control de stock") permitiría vender infinito con sólo dejar el
 *    campo vacío, que es justo el agujero que este ticket viene a cerrar.
 *
 * 5. Editar una venta devuelve primero al stock lo que tenía la versión vieja y
 *    después descuenta la nueva; borrarla (soft delete) devuelve todo. Así el
 *    stock siempre refleja la suma de las ventas activas.
 * ────────────────────────────────────────────────────────────────────────────*/

/** Error de negocio: se traduce a 400 con el mensaje tal cual para el usuario. */
class InsufficientStockError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientStockError';
  }
}

/** Suma las cantidades por producto: una misma referencia puede venir repetida. */
function groupQuantitiesByProduct(lines: Array<{ product_id: number; quantity: number }>): Map<number, number> {
  const totals = new Map<number, number>();
  for (const line of lines) {
    const quantity = Number(line.quantity) || 0;
    if (quantity <= 0) continue;
    totals.set(line.product_id, (totals.get(line.product_id) || 0) + quantity);
  }
  return totals;
}

/** Descuenta stock sin permitir negativos. Lanza InsufficientStockError si no alcanza. */
async function decreaseStock(
  client: PoolClient,
  lines: Array<{ product_id: number; quantity: number }>
): Promise<void> {
  for (const [productId, quantity] of groupQuantitiesByProduct(lines)) {
    const updated = await client.query(
      `UPDATE products
       SET quantity = COALESCE(quantity, 0) - $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND COALESCE(quantity, 0) >= $1
       RETURNING id`,
      [quantity, productId]
    );

    if (updated.rowCount === 0) {
      // No alcanzaba el stock: buscamos nombre y disponible para el mensaje.
      const info = await client.query(
        'SELECT name, COALESCE(quantity, 0) AS quantity FROM products WHERE id = $1',
        [productId]
      );
      const name = info.rows[0]?.name || `#${productId}`;
      const available = Number(info.rows[0]?.quantity) || 0;
      throw new InsufficientStockError(
        `Stock insuficiente de "${name}": ${available === 1 ? 'queda 1 unidad' : `quedan ${available} unidades`} y estás vendiendo ${quantity}`
      );
    }
  }
}

/** Devuelve stock al inventario (venta editada o eliminada). */
async function restoreStock(
  client: PoolClient,
  lines: Array<{ product_id: number; quantity: number }>
): Promise<void> {
  for (const [productId, quantity] of groupQuantitiesByProduct(lines)) {
    await client.query(
      `UPDATE products
       SET quantity = COALESCE(quantity, 0) + $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, productId]
    );
  }
}

// Listar ventas con paginación y búsqueda
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const opticsId = getOpticsScope(user);
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
        SELECT 1 FROM clients c WHERE c.id = s.client_id AND c.name ILIKE ?
      )`;
      const searchPattern = `%${paginationParams.search}%`;
      countParams.push(searchPattern);
    }

    const sales = await getRows<any>(query, allParams);

    // Obtener productos de todas las ventas de la página en una sola query (evita N+1)
    if (sales.length > 0) {
      const saleIds = sales.map((sale) => sale.id);
      const allProducts = await getRows<SaleProduct & { sale_id: number }>(
        `SELECT sp.*, p.name as product_name, p.price as base_price
         FROM sale_products sp
         LEFT JOIN products p ON sp.product_id = p.id
         WHERE sp.sale_id = ANY(?)`,
        [saleIds]
      );

      const productsBySaleId = new Map<number, SaleProduct[]>();
      for (const product of allProducts) {
        const list = productsBySaleId.get(product.sale_id) || [];
        list.push(product);
        productsBySaleId.set(product.sale_id, list);
      }

      for (const sale of sales) {
        sale.products = productsBySaleId.get(sale.id) || [];
      }
    } else {
      for (const sale of sales) {
        sale.products = [];
      }
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

    const opticsId = getOpticsScope(user);
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
router.post('/', authenticateToken, validateBody(createSaleSchema), async (req: AuthRequest, res: Response) => {
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

    const opticsId = (user.role === 'admin' && optics_id)
      ? optics_id
      : getOpticsScope(user);

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

    // Crear la venta y sus productos dentro de una transacción
    const pool = getDatabase();
    const dbClient = await pool.connect();
    let saleId: number;
    try {
      await dbClient.query('BEGIN');

      const saleResult = await dbClient.query(
        `INSERT INTO sales (
          optics_id, client_id, user_id, sale_date,
          od_esf, od_cil, od_eje, od_add,
          oi_esf, oi_cil, oi_eje, oi_add,
          notes, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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

      saleId = saleResult.rows[0].id;

      // Crear productos de la venta
      for (const product of products) {
        const quantity = Number(product.quantity) || 0;
        const unitPrice = Number(product.unit_price) || 0;
        const productTotal = quantity * unitPrice;

        await dbClient.query(
          `INSERT INTO sale_products (sale_id, product_id, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5)`,
          [saleId, product.product_id, quantity, unitPrice, productTotal]
        );
      }

      // Descontar stock dentro de la misma transacción (ver POLÍTICA DE STOCK).
      await decreaseStock(dbClient, products);

      await dbClient.query('COMMIT');
    } catch (err) {
      await dbClient.query('ROLLBACK');
      throw err;
    } finally {
      dbClient.release();
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
    if (error instanceof InsufficientStockError) {
      return res.status(400).json({ error: error.message });
    }
    console.error('Error al crear venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar venta con productos
router.put('/:id', authenticateToken, validateBody(updateSaleSchema), async (req: AuthRequest, res: Response) => {
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

    const opticsId = getOpticsScope(user);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a esta venta' });
    }

    let totalPrice = existing.total_price;

    // Si hay productos, validarlos antes de tocar la base
    if (products && Array.isArray(products) && products.length > 0) {
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

      totalPrice = 0;
      for (const product of products) {
        const quantity = Number(product.quantity) || 0;
        const unitPrice = Number(product.unit_price) || 0;
        totalPrice += quantity * unitPrice;
      }

      if (isNaN(totalPrice) || totalPrice < 0) {
        return res.status(400).json({ error: 'Error al calcular el total de la venta' });
      }
    }

    // Actualizar la venta y sus productos dentro de una transacción
    const pool = getDatabase();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (products && Array.isArray(products) && products.length > 0) {
        // Devolver al stock lo que tenía la versión vieja de la venta antes de
        // borrar sus líneas: si no, el stock quedaría descontado dos veces.
        const previous = await client.query<{ product_id: number; quantity: number }>(
          'SELECT product_id, quantity FROM sale_products WHERE sale_id = $1',
          [id]
        );
        await restoreStock(client, previous.rows);

        // Eliminar productos existentes
        await client.query('DELETE FROM sale_products WHERE sale_id = $1', [id]);

        // Insertar nuevos productos
        for (const product of products) {
          const quantity = Number(product.quantity) || 0;
          const unitPrice = Number(product.unit_price) || 0;
          const productTotal = quantity * unitPrice;

          await client.query(
            `INSERT INTO sale_products (sale_id, product_id, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, product.product_id, quantity, unitPrice, productTotal]
          );
        }

        // Descontar el stock de la nueva composición de la venta.
        await decreaseStock(client, products);
      }

      // Actualizar la venta
      await client.query(
        `UPDATE sales
         SET sale_date = $1,
             od_esf = $2, od_cil = $3, od_eje = $4, od_add = $5,
             oi_esf = $6, oi_cil = $7, oi_eje = $8, oi_add = $9,
             notes = $10, total_price = $11,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $12`,
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

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

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
    if (error instanceof InsufficientStockError) {
      return res.status(400).json({ error: error.message });
    }
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

    const opticsId = getOpticsScope(user);
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

    // Soft delete + devolución de stock en una sola transacción: si el stock
    // volviera sin que la venta se marque inactiva (o al revés), el inventario
    // quedaría inflado o la mercadería perdida.
    const pool = getDatabase();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Releemos las líneas dentro de la transacción para no devolver stock de
      // una venta que otro request ya dio de baja en el medio.
      const lines = await client.query<{ product_id: number; quantity: number }>(
        `SELECT sp.product_id, sp.quantity
         FROM sale_products sp
         JOIN sales s ON s.id = sp.sale_id
         WHERE sp.sale_id = $1 AND s.is_active = 1
         FOR UPDATE OF s`,
        [id]
      );

      await restoreStock(client, lines.rows);

      await client.query(
        'UPDATE sales SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND is_active = 1',
        [id]
      );

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    res.json({ message: 'Venta eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar venta:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
