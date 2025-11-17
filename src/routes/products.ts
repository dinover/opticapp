import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRow, getRows, runQuery } from '../config/database';
import { Product, PaginationParams, PaginatedResponse } from '../types';
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

// Listar productos con paginación y búsqueda
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

    let baseQuery = 'SELECT * FROM products WHERE is_active = 1';
    const baseParams: any[] = [];

    if (opticsId !== null) {
      baseQuery += ' AND optics_id = ?';
      baseParams.push(opticsId);
    }

    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as count FROM products WHERE is_active = 1';
    const countParams = [...baseParams];

    if (opticsId !== null) {
      countQuery += ' AND optics_id = ?';
    }

    // Búsqueda en nombre y descripción
    const searchFields = ['name', 'description'];
    const { query, params } = buildPaginationQuery(baseQuery, paginationParams, searchFields);
    const allParams = [...baseParams, ...params];

    // Ajustar count query con búsqueda
    if (paginationParams.search) {
      const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
      countQuery += ` AND (${searchConditions})`;
      const searchPattern = `%${paginationParams.search}%`;
      countParams.push(...searchFields.map(() => searchPattern));
    }

    const products = await getRows<Product>(query, allParams);
    const { total, totalPages } = await getPaginationMeta(countQuery, countParams, paginationParams.page!, paginationParams.limit!);

    const response: PaginatedResponse<Product> = createPaginatedResponse(
      products,
      paginationParams.page!,
      paginationParams.limit!,
      total
    );

    res.json(response);
  } catch (error: any) {
    console.error('Error al listar productos:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener un producto por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const product = await getRow<Product>(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!product) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && product.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este producto' });
    }

    res.json(product);
  } catch (error: any) {
    console.error('Error al obtener producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear producto
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { name, price, quantity, description, image_url, optics_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es requerido' });
    }

    const opticsId = optics_id || (await getUserOpticsId(user.id, user.role));
    
    if (opticsId === null) {
      return res.status(400).json({ error: 'No se pudo determinar la óptica. Se requiere optics_id.' });
    }

    const productPrice = price ? parseFloat(price) : 0;
    const productQuantity = quantity ? parseInt(quantity) : 0;

    if (isNaN(productPrice) || productPrice < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número válido mayor o igual a 0' });
    }

    if (isNaN(productQuantity) || productQuantity < 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número válido mayor o igual a 0' });
    }

    const result = await runQuery(
      `INSERT INTO products (optics_id, name, price, quantity, description, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [opticsId, name.trim(), productPrice, productQuantity, description || null, image_url || null]
    );

    const product = await getRow<Product>(
      'SELECT * FROM products WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(product);
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar producto
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { name, price, quantity, description, image_url } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del producto es requerido' });
    }

    const existing = await getRow<Product>(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este producto' });
    }

    const productPrice = price !== undefined ? parseFloat(price) : existing.price || 0;
    const productQuantity = quantity !== undefined ? parseInt(quantity) : existing.quantity || 0;

    if (isNaN(productPrice) || productPrice < 0) {
      return res.status(400).json({ error: 'El precio debe ser un número válido mayor o igual a 0' });
    }

    if (isNaN(productQuantity) || productQuantity < 0) {
      return res.status(400).json({ error: 'La cantidad debe ser un número válido mayor o igual a 0' });
    }

    await runQuery(
      `UPDATE products 
       SET name = ?, price = ?, quantity = ?, description = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name.trim(), productPrice, productQuantity, description || null, image_url || null, id]
    );

    const product = await getRow<Product>('SELECT * FROM products WHERE id = ?', [id]);
    res.json(product);
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar producto (soft delete con log)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const existing = await getRow<Product>(
      'SELECT * FROM products WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este producto' });
    }

    // Registrar en log antes de eliminar
    await logDeletion('products', id, user.id, existing, req.body.reason);

    // Soft delete
    await runQuery(
      'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

