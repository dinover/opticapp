import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/init';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get all clients for the authenticated user's optic
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        'SELECT * FROM clients WHERE optic_id = $1 ORDER BY created_at DESC',
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single client
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const clientId = parseInt(req.params.id);
    
    try {
      const result = await client.query(
        'SELECT * FROM clients WHERE id = $1 AND optic_id = $2',
        [clientId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
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
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const authReq = req as any;
    const { dni, first_name, last_name, phone, email, notes } = req.body;
    
    try {
      // Check if DNI already exists
      const existingResult = await client.query(
        'SELECT id FROM clients WHERE optic_id = $1 AND dni = $2',
        [authReq.user.optic_id, dni]
      );
      
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Client with this DNI already exists' });
      }

      const result = await client.query(
        'INSERT INTO clients (optic_id, dni, first_name, last_name, phone, email, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [authReq.user.optic_id, dni, first_name, last_name, phone, email, notes]
      );
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update client
router.put('/:id', [
  authenticateToken,
  body('dni').notEmpty().withMessage('DNI is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('phone').optional().isString().withMessage('Phone must be a string'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const authReq = req as any;
    const clientId = parseInt(req.params.id);
    const { dni, first_name, last_name, phone, email, notes } = req.body;
    
    try {
      // Check if DNI already exists for another client
      const existingResult = await client.query(
        'SELECT id FROM clients WHERE optic_id = $1 AND dni = $2 AND id != $3',
        [authReq.user.optic_id, dni, clientId]
      );
      
      if (existingResult.rows.length > 0) {
        return res.status(400).json({ error: 'Client with this DNI already exists' });
      }

      const result = await client.query(
        'UPDATE clients SET dni = $1, first_name = $2, last_name = $3, phone = $4, email = $5, notes = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND optic_id = $8 RETURNING *',
        [dni, first_name, last_name, phone, email, notes, clientId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete client
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const clientId = parseInt(req.params.id);
    
    try {
      const result = await client.query(
        'DELETE FROM clients WHERE id = $1 AND optic_id = $2 RETURNING *',
        [clientId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json({ message: 'Client deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Search clients
router.get('/search/:query', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const query = req.params.query;
    
    try {
      const result = await client.query(
        'SELECT * FROM clients WHERE optic_id = $1 AND (first_name ILIKE $2 OR last_name ILIKE $2 OR dni ILIKE $2 OR email ILIKE $2) ORDER BY created_at DESC',
        [authReq.user.optic_id, `%${query}%`]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching clients:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get client by DNI
router.get('/dni/:dni', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const dni = req.params.dni;
    
    try {
      const result = await client.query(
        'SELECT * FROM clients WHERE optic_id = $1 AND dni = $2',
        [authReq.user.optic_id, dni]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Client not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching client by DNI:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 