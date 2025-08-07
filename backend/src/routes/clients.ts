import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';

const router = express.Router();

interface AuthenticatedRequest extends express.Request {
  user?: any;
}

// GET / - Obtener todos los clientes del óptico
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== CLIENTS DEBUG ===');
    console.log('User:', req.user);
    console.log('Optic ID:', req.user?.optic_id);
    console.log('User ID:', req.user?.id);
    
    const result = await executeQuery(
      'SELECT * FROM clients WHERE optic_id = $1 ORDER BY created_at DESC',
      [req.user?.optic_id]
    );
    
    console.log('Query result:', result.rows.length, 'clients found');
    console.log('First client:', result.rows[0]);
    
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
    const result = await executeQuerySingle(
      'SELECT * FROM clients WHERE id = $1 AND optic_id = $2',
      [clientId, req.user?.optic_id]
    );
    
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
    const { dni, first_name, last_name, phone, email, notes } = req.body;

    // Validar que el DNI no esté duplicado
    if (dni) {
      const existingClient = await executeQuerySingle(
        'SELECT id FROM clients WHERE optic_id = $1 AND dni = $2',
        [req.user?.optic_id, dni]
      );
      
      if (existingClient) {
        return res.status(400).json({ error: 'Ya existe un cliente con ese DNI' });
      }
    }

    const result = await executeInsert(
      'INSERT INTO clients (optic_id, dni, first_name, last_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.user?.optic_id, dni, first_name, last_name, phone, email, notes]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /:id - Actualizar un cliente
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    const { dni, first_name, last_name, phone, email, notes } = req.body;

    // Verificar que el cliente existe
    const existingClient = await executeQuerySingle(
      'SELECT id FROM clients WHERE id = $1 AND optic_id = $2',
      [clientId, req.user?.optic_id]
    );
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Si se está actualizando el DNI, verificar que no esté duplicado
    if (dni) {
      const duplicateClient = await executeQuerySingle(
        'SELECT id FROM clients WHERE optic_id = $1 AND dni = $2 AND id != $3',
        [req.user?.optic_id, dni, clientId]
      );
      
      if (duplicateClient) {
        return res.status(400).json({ error: 'Ya existe otro cliente con ese DNI' });
      }
    }

    // Construir la consulta de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (dni !== undefined) {
      updateFields.push('dni = $' + paramIndex++);
      updateValues.push(dni);
    }
    if (first_name !== undefined) {
      updateFields.push('first_name = $' + paramIndex++);
      updateValues.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = $' + paramIndex++);
      updateValues.push(last_name);
    }
    if (phone !== undefined) {
      updateFields.push('phone = $' + paramIndex++);
      updateValues.push(phone);
    }
    if (email !== undefined) {
      updateFields.push('email = $' + paramIndex++);
      updateValues.push(email);
    }
    if (notes !== undefined) {
      updateFields.push('notes = $' + paramIndex++);
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron campos para actualizar' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(clientId, req.user?.optic_id);

    const query = `UPDATE clients SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND optic_id = $${paramIndex + 1}`;
    
    const result = await executeUpdate(query, updateValues);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({ message: 'Cliente actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /:id - Eliminar un cliente
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const result = await executeUpdate(
      'DELETE FROM clients WHERE id = $1 AND optic_id = $2',
      [clientId, req.user?.optic_id]
    );

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