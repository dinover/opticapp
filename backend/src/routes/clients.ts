import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';

const router = express.Router();

// GET / - Obtener todos los clientes del óptico
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await executeQuery(`
      SELECT * FROM clients 
      WHERE optic_id = $1 
      ORDER BY created_at DESC
    `, [req.user?.optic_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /:id - Obtener un cliente específico
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const result = await executeQuerySingle(`
      SELECT * FROM clients 
      WHERE id = $1 AND optic_id = $2
    `, [clientId, req.user?.optic_id]);

    if (!result) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST / - Crear un nuevo cliente
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { first_name, last_name, email, phone, dni, notes } = req.body;

    // Permitir crear cliente con solo nombre o solo DNI
    if (!first_name && !last_name && !dni) {
      return res.status(400).json({ error: 'Debe proporcionar al menos nombre y apellido, o DNI' });
    }

    const result = await executeInsert(`
      INSERT INTO clients (
        optic_id, first_name, last_name, email, phone, dni, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      req.user?.optic_id, first_name || null, last_name || null, email || null, 
      phone || null, dni || null, notes || null
    ]);

    res.status(201).json({ 
      message: 'Cliente creado exitosamente',
      client_id: result.id 
    });
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /:id - Actualizar un cliente
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { first_name, last_name, email, phone, dni, notes } = req.body;

    // Permitir actualizar cliente con solo nombre o solo DNI
    if (!first_name && !last_name && !dni) {
      return res.status(400).json({ error: 'Debe proporcionar al menos nombre y apellido, o DNI' });
    }

    const result = await executeUpdate(`
      UPDATE clients SET 
        first_name = $1, last_name = $2, email = $3, phone = $4, 
        dni = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND optic_id = $8
    `, [
      first_name || null, last_name || null, email || null, phone || null, 
      dni || null, notes || null, clientId, req.user?.optic_id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Obtener los datos actualizados del cliente
    const updatedClient = await executeQuerySingle(`
      SELECT * FROM clients 
      WHERE id = $1 AND optic_id = $2
    `, [clientId, req.user?.optic_id]);

    res.json({ 
      message: 'Cliente actualizado exitosamente',
      client: updatedClient
    });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /:id - Eliminar un cliente
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);

    const result = await executeUpdate(`
      DELETE FROM clients WHERE id = $1 AND optic_id = $2
    `, [clientId, req.user?.optic_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 