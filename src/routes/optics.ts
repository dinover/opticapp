import express, { Request, Response } from 'express';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { getRow, getRows, runQuery } from '../config/database';
import { Optics } from '../types';

const router = express.Router();

// Listar todas las ópticas (solo admin)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const optics = await getRows<Optics>(
      'SELECT * FROM optics WHERE is_active = 1 ORDER BY name'
    );
    res.json(optics);
  } catch (error: any) {
    console.error('Error al listar ópticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener una óptica por ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user;

    const optics = await getRow<Optics>(
      'SELECT * FROM optics WHERE id = ? AND is_active = 1',
      [id]
    );

    if (!optics) {
      return res.status(404).json({ error: 'Óptica no encontrada' });
    }

    // Solo admin puede ver cualquier óptica, usuarios solo la suya
    if (user?.role !== 'admin' && user && user.id && user.optics_id !== id) {
      const userOptics = await getRow<Optics>(
        'SELECT optics_id FROM users WHERE id = ?',
        [user.id]
      );
      if (userOptics?.optics_id !== id) {
        return res.status(403).json({ error: 'No tienes acceso a esta óptica' });
      }
    }

    res.json(optics);
  } catch (error: any) {
    console.error('Error al obtener óptica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Crear óptica (solo admin)
router.post('/', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, address, phone, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'El nombre de la óptica es requerido' });
    }

    const result = await runQuery(
      `INSERT INTO optics (name, address, phone, email)
       VALUES (?, ?, ?, ?)`,
      [name, address || null, phone || null, email || null]
    );

    const optics = await getRow<Optics>(
      'SELECT * FROM optics WHERE id = ?',
      [result.lastID]
    );

    res.status(201).json(optics);
  } catch (error: any) {
    console.error('Error al crear óptica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar óptica (solo admin)
router.put('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, address, phone, email } = req.body;

    const existing = await getRow<Optics>('SELECT id FROM optics WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Óptica no encontrada' });
    }

    await runQuery(
      `UPDATE optics 
       SET name = ?, address = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [name, address || null, phone || null, email || null, id]
    );

    const optics = await getRow<Optics>('SELECT * FROM optics WHERE id = ?', [id]);
    res.json(optics);
  } catch (error: any) {
    console.error('Error al actualizar óptica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Eliminar óptica (soft delete - solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const existing = await getRow<Optics>('SELECT id FROM optics WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'Óptica no encontrada' });
    }

    await runQuery(
      'UPDATE optics SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    res.json({ message: 'Óptica eliminada correctamente' });
  } catch (error: any) {
    console.error('Error al eliminar óptica:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

