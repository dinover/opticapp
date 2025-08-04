import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { Client } from '../types';

const router = Router();

// Get all clients for the authenticated user's optic
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    'SELECT * FROM clients WHERE optic_id = ? ORDER BY last_name, first_name',
    [authReq.user.optic_id],
    (err, clients) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(clients);
    }
  );
});

// Get single client
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const clientId = parseInt(req.params.id);
  
  db.get(
    'SELECT * FROM clients WHERE id = ? AND optic_id = ?',
    [clientId, authReq.user.optic_id],
    (err, client) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    }
  );
});

// Create new client
router.post('/', [
  authenticateToken,
  body('dni').notEmpty().withMessage('DNI is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().notEmpty().withMessage('Phone number is required if provided')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const authReq = req as any;
  const { dni, first_name, last_name, phone, email, notes } = req.body;

  // Check if DNI already exists for this optic
  db.get(
    'SELECT id FROM clients WHERE optic_id = ? AND dni = ?',
    [authReq.user.optic_id, dni],
    (err, existingClient) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingClient) {
        return res.status(400).json({ error: 'Client with this DNI already exists' });
      }

      db.run(
        `INSERT INTO clients (optic_id, dni, first_name, last_name, phone, email, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [authReq.user.optic_id, dni, first_name, last_name, phone, email, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to create client' });
          }

          db.get('SELECT * FROM clients WHERE id = ?', [this.lastID], (err, client) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json(client);
          });
        }
      );
    }
  );
});

// Update client
router.put('/:id', [
  authenticateToken,
  body('dni').notEmpty().withMessage('DNI is required'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().withMessage('Valid email required'),
  body('phone').optional().notEmpty().withMessage('Phone number is required if provided')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const authReq = req as any;
  const clientId = parseInt(req.params.id);
  const { dni, first_name, last_name, phone, email, notes } = req.body;

  // Check if DNI already exists for another client in this optic
  db.get(
    'SELECT id FROM clients WHERE optic_id = ? AND dni = ? AND id != ?',
    [authReq.user.optic_id, dni, clientId],
    (err, existingClient) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (existingClient) {
        return res.status(400).json({ error: 'Client with this DNI already exists' });
      }

      db.run(
        `UPDATE clients SET dni = ?, first_name = ?, last_name = ?, phone = ?, email = ?, notes = ?, 
         updated_at = CURRENT_TIMESTAMP WHERE id = ? AND optic_id = ?`,
        [dni, first_name, last_name, phone, email, notes, clientId, authReq.user.optic_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update client' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Client not found' });
          }

          db.get('SELECT * FROM clients WHERE id = ?', [clientId], (err, client) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json(client);
          });
        }
      );
    }
  );
});

// Delete client
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const clientId = parseInt(req.params.id);

  // Check if client has any sales
  db.get(
    'SELECT COUNT(*) as count FROM sales WHERE client_id = ?',
    [clientId],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (result.count > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete client with existing sales. Consider archiving instead.' 
        });
      }

      db.run(
        'DELETE FROM clients WHERE id = ? AND optic_id = ?',
        [clientId, authReq.user.optic_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete client' });
          }
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Client not found' });
          }
          res.json({ message: 'Client deleted successfully' });
        }
      );
    }
  );
});

// Search clients
router.get('/search/:query', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const query = `%${req.params.query}%`;

  db.all(
    `SELECT * FROM clients WHERE optic_id = ? AND 
     (dni LIKE ? OR first_name LIKE ? OR last_name LIKE ? OR email LIKE ?) 
     ORDER BY last_name, first_name`,
    [authReq.user.optic_id, query, query, query, query],
    (err, clients) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(clients);
    }
  );
});

// Get client by DNI
router.get('/dni/:dni', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const dni = req.params.dni;

  db.get(
    'SELECT * FROM clients WHERE optic_id = ? AND dni = ?',
    [authReq.user.optic_id, dni],
    (err, client) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!client) {
        return res.status(404).json({ error: 'Client not found' });
      }
      res.json(client);
    }
  );
});

export default router; 