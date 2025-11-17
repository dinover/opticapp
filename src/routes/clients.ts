import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRow, getRows, runQuery } from '../config/database';
import { Client, PaginationParams, PaginatedResponse } from '../types';
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

// Listar clientes con paginación y búsqueda
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

    let baseQuery = 'SELECT * FROM clients WHERE is_active = 1';
    const baseParams: any[] = [];

    if (opticsId !== null) {
      baseQuery += ' AND optics_id = ?';
      baseParams.push(opticsId);
    }

    // Query para contar total
    let countQuery = 'SELECT COUNT(*) as count FROM clients WHERE is_active = 1';
    const countParams = [...baseParams];

    if (opticsId !== null) {
      countQuery += ' AND optics_id = ?';
    }

    // Búsqueda en nombre, email, phone, document_id
    const searchFields = ['name', 'email', 'phone', 'document_id'];
    const { query, params } = buildPaginationQuery(baseQuery, paginationParams, searchFields);
    const allParams = [...baseParams, ...params];

    // Ajustar count query con búsqueda
    if (paginationParams.search) {
      const searchConditions = searchFields.map(field => `${field} LIKE ?`).join(' OR ');
      countQuery += ` AND (${searchConditions})`;
      const searchPattern = `%${paginationParams.search}%`;
      countParams.push(...searchFields.map(() => searchPattern));
    }

    const clients = await getRows<Client>(query, allParams);
    const { total, totalPages } = await getPaginationMeta(countQuery, countParams, paginationParams.page!, paginationParams.limit!);

    const response: PaginatedResponse<Client> = createPaginatedResponse(
      clients,
      paginationParams.page!,
      paginationParams.limit!,
      total
    );

    res.json(response);
  } catch (error: any) {
    console.error('Error al listar clientes:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener un cliente por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const client = await getRow<Client>(
      'SELECT * FROM clients WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!client) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && client.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este cliente' });
    }

    res.json(client);
  } catch (error: any) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear cliente
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { name, document_id, email, phone, address, birth_date, notes, optics_id } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    const opticsId = optics_id || (await getUserOpticsId(user.id, user.role));
    
    if (opticsId === null) {
      return res.status(400).json({ error: 'No se pudo determinar la óptica. Se requiere optics_id.' });
    }

    const result = await runQuery(
      `INSERT INTO clients (optics_id, name, document_id, email, phone, address, birth_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [opticsId, name.trim(), document_id || null, email || null, phone || null, address || null, birth_date || null, notes || null]
    );

    const client = await getRow<Client>(
      'SELECT * FROM clients WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(client);
  } catch (error: any) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar cliente
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { name, document_id, email, phone, address, birth_date, notes } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre del cliente es requerido' });
    }

    const existing = await getRow<Client>(
      'SELECT * FROM clients WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este cliente' });
    }

    await runQuery(
      `UPDATE clients 
       SET name = ?, document_id = ?, email = ?, phone = ?, address = ?, birth_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name.trim(), document_id || null, email || null, phone || null, address || null, birth_date || null, notes || null, id]
    );

    const client = await getRow<Client>('SELECT * FROM clients WHERE id = ?', [id]);
    res.json(client);
  } catch (error: any) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar cliente (soft delete con log)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const existing = await getRow<Client>(
      'SELECT * FROM clients WHERE id = ? AND is_active = 1',
      [id]
    );
    
    if (!existing) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este cliente' });
    }

    // Registrar en log antes de eliminar
    await logDeletion('clients', id, user.id, existing, req.body.reason);

    // Soft delete
    await runQuery(
      'UPDATE clients SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

