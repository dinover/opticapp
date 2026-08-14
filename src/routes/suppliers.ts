import express, { Response } from 'express';
import { authenticateToken, AuthRequest, getOpticsScope } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createSupplierSchema, updateSupplierSchema } from '../schemas';
import { getRow, getRows, runQuery } from '../config/database';
import { Supplier } from '../types';
import { logDeletion } from '../utils/deletion-log';

const router = express.Router();

// Listar proveedores
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const opticsId = getOpticsScope(user);
    let query = 'SELECT * FROM suppliers WHERE is_active = 1';
    const params: any[] = [];

    if (opticsId !== null) {
      query += ' AND optics_id = ?';
      params.push(opticsId);
    }

    query += ' ORDER BY name ASC';
    const suppliers = await getRows<Supplier>(query, params);
    res.json(suppliers);
  } catch (error) {
    console.error('Error al listar proveedores:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener proveedor por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const id = parseInt(req.params.id);
    const supplier = await getRow<Supplier>('SELECT * FROM suppliers WHERE id = ? AND is_active = 1', [id]);
    if (!supplier) return res.status(404).json({ error: 'Proveedor no encontrado' });

    const opticsId = getOpticsScope(user);
    if (opticsId !== null && supplier.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este proveedor' });
    }

    res.json(supplier);
  } catch (error) {
    console.error('Error al obtener proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear proveedor
router.post('/', authenticateToken, validateBody(createSupplierSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const { name, contact_name, phone, email, notes, optics_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre del proveedor es requerido' });

    const opticsId = (user.role === 'admin' && optics_id) ? optics_id : getOpticsScope(user);
    if (opticsId === null) return res.status(400).json({ error: 'No se pudo determinar la óptica' });

    const result = await runQuery(
      `INSERT INTO suppliers (optics_id, name, contact_name, phone, email, notes)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [opticsId, name.trim(), contact_name || null, phone || null, email || null, notes || null]
    );

    const supplier = await getRow<Supplier>('SELECT * FROM suppliers WHERE id = ?', [result.lastID]);
    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar proveedor
router.put('/:id', authenticateToken, validateBody(updateSupplierSchema), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const id = parseInt(req.params.id);
    const { name, contact_name, phone, email, notes } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre del proveedor es requerido' });

    const existing = await getRow<Supplier>('SELECT * FROM suppliers WHERE id = ? AND is_active = 1', [id]);
    if (!existing) return res.status(404).json({ error: 'Proveedor no encontrado' });

    const opticsId = getOpticsScope(user);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este proveedor' });
    }

    await runQuery(
      `UPDATE suppliers SET name = ?, contact_name = ?, phone = ?, email = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [name.trim(), contact_name || null, phone || null, email || null, notes || null, id]
    );

    const supplier = await getRow<Supplier>('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.json(supplier);
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar proveedor (soft delete)
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const id = parseInt(req.params.id);
    const existing = await getRow<Supplier>('SELECT * FROM suppliers WHERE id = ? AND is_active = 1', [id]);
    if (!existing) return res.status(404).json({ error: 'Proveedor no encontrado' });

    const opticsId = getOpticsScope(user);
    if (opticsId !== null && existing.optics_id !== opticsId) {
      return res.status(403).json({ error: 'No tienes acceso a este proveedor' });
    }

    await logDeletion('suppliers', id, user.id, existing, req.body.reason);
    await runQuery('UPDATE suppliers SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);

    res.json({ message: 'Proveedor eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
