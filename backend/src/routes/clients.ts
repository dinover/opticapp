import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';
import { authenticateToken } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const router = Router();

// Get all clients for the authenticated user's optic
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await executeQuery(
      'SELECT * FROM clients WHERE optic_id = ? ORDER BY created_at DESC',
      [req.user?.optic_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single client
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const result = await executeQuerySingle(
      'SELECT * FROM clients WHERE id = ? AND optic_id = ?',
      [clientId, req.user?.optic_id]
    );
    
    if (!result) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new client
router.post('/', [
  authenticateToken,
  body('dni').notEmpty().withMessage('DNI is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { dni, first_name, last_name, phone, email, notes } = req.body;
    
    // Check if DNI already exists
    const existingResult = await executeQuerySingle(
      'SELECT id FROM clients WHERE optic_id = ? AND dni = ?',
      [req.user?.optic_id, dni]
    );
    
    if (existingResult) {
      return res.status(400).json({ error: 'Client with this DNI already exists' });
    }

    const result = await executeInsert(
      'INSERT INTO clients (optic_id, dni, first_name, last_name, phone, email, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user?.optic_id, dni, first_name, last_name, phone, email, notes]
    );
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update client
router.put('/:id', [
  authenticateToken,
  body('dni').optional().notEmpty().withMessage('DNI cannot be empty'),
  body('first_name').optional().notEmpty().withMessage('First name cannot be empty'),
  body('last_name').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const clientId = parseInt(req.params.id);
    const { dni, first_name, last_name, phone, email, notes } = req.body;
    
    // Check if client exists and belongs to user's optic
    const existingClient = await executeQuerySingle(
      'SELECT id FROM clients WHERE id = ? AND optic_id = ?',
      [clientId, req.user?.optic_id]
    );
    
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // If DNI is being updated, check for duplicates
    if (dni) {
      const duplicateResult = await executeQuerySingle(
        'SELECT id FROM clients WHERE optic_id = ? AND dni = ? AND id != ?',
        [req.user?.optic_id, dni, clientId]
      );
      
      if (duplicateResult) {
        return res.status(400).json({ error: 'Client with this DNI already exists' });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (dni !== undefined) {
      updateFields.push('dni = ?');
      updateValues.push(dni);
      paramIndex++;
    }
    if (first_name !== undefined) {
      updateFields.push('first_name = ?');
      updateValues.push(first_name);
      paramIndex++;
    }
    if (last_name !== undefined) {
      updateFields.push('last_name = ?');
      updateValues.push(last_name);
      paramIndex++;
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?');
      updateValues.push(phone);
      paramIndex++;
    }
    if (email !== undefined) {
      updateFields.push('email = ?');
      updateValues.push(email);
      paramIndex++;
    }
    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateValues.push(notes);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateValues.push(clientId, req.user?.optic_id);

    const result = await executeUpdate(
      `UPDATE clients SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND optic_id = ?`,
      updateValues
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get updated client
    const updatedClient = await executeQuerySingle(
      'SELECT * FROM clients WHERE id = ? AND optic_id = ?',
      [clientId, req.user?.optic_id]
    );

    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const clientId = parseInt(req.params.id);
    
    const result = await executeUpdate(
      'DELETE FROM clients WHERE id = ? AND optic_id = ?',
      [clientId, req.user?.optic_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Client not found' });
    }

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Search clients
router.get('/search/:query', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = req.params.query;
    const searchTerm = `%${query}%`;
    
    const result = await executeQuery(
      'SELECT * FROM clients WHERE optic_id = ? AND (first_name LIKE ? OR last_name LIKE ? OR dni LIKE ? OR email LIKE ?) ORDER BY created_at DESC',
      [req.user?.optic_id, searchTerm, searchTerm, searchTerm, searchTerm]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 