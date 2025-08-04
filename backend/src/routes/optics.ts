import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Get optic information
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.get(
    'SELECT * FROM optics WHERE id = ?',
    [authReq.user.optic_id],
    (err, optic) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!optic) {
        return res.status(404).json({ error: 'Optic not found' });
      }
      res.json(optic);
    }
  );
});

// Update optic information (admin only)
router.put('/', [
  authenticateToken,
  requireAdmin,
  body('name').notEmpty().withMessage('Optic name is required'),
  body('address').notEmpty().withMessage('Optic address is required'),
  body('phone').notEmpty().withMessage('Optic phone is required'),
  body('email').isEmail().withMessage('Valid optic email required')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const authReq = req as any;
  const { name, address, phone, email } = req.body;

  db.run(
    `UPDATE optics SET name = ?, address = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, address, phone, email, authReq.user.optic_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to update optic' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Optic not found' });
      }

      db.get('SELECT * FROM optics WHERE id = ?', [authReq.user.optic_id], (err, optic) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.json(optic);
      });
    }
  );
});

// Get optic statistics
router.get('/stats', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.get(
    `SELECT 
       (SELECT COUNT(*) FROM products WHERE optic_id = ?) as total_products,
       (SELECT COUNT(*) FROM clients WHERE optic_id = ?) as total_clients,
       (SELECT COUNT(*) FROM sales WHERE optic_id = ?) as total_sales,
       (SELECT SUM(total_price) FROM sales WHERE optic_id = ?) as total_revenue,
       (SELECT COUNT(*) FROM products WHERE optic_id = ? AND stock_quantity = 0) as out_of_stock_products,
       (SELECT COUNT(*) FROM products WHERE optic_id = ? AND stock_quantity <= 5) as low_stock_products`,
    [authReq.user.optic_id, authReq.user.optic_id, authReq.user.optic_id, 
     authReq.user.optic_id, authReq.user.optic_id, authReq.user.optic_id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(stats);
    }
  );
});

// Get recent activity
router.get('/activity', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    `SELECT 'sale' as type, s.created_at, s.total_price as amount,
            c.first_name || ' ' || c.last_name as client_name,
            p.name as product_name
     FROM sales s
     JOIN clients c ON s.client_id = c.id
     JOIN products p ON s.product_id = p.id
     WHERE s.optic_id = ?
     UNION ALL
     SELECT 'client' as type, c.created_at, NULL as amount,
            c.first_name || ' ' || c.last_name as client_name,
            'New client registered' as product_name
     FROM clients c
     WHERE c.optic_id = ?
     UNION ALL
     SELECT 'product' as type, p.created_at, p.price as amount,
            'New product added' as client_name,
            p.name as product_name
     FROM products p
     WHERE p.optic_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [authReq.user.optic_id, authReq.user.optic_id, authReq.user.optic_id],
    (err, activity) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(activity);
    }
  );
});

// Get low stock products
router.get('/low-stock', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    `SELECT * FROM products 
     WHERE optic_id = ? AND stock_quantity <= 5
     ORDER BY stock_quantity ASC`,
    [authReq.user.optic_id],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(products);
    }
  );
});

// Get out of stock products
router.get('/out-of-stock', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    `SELECT * FROM products 
     WHERE optic_id = ? AND stock_quantity = 0
     ORDER BY updated_at DESC`,
    [authReq.user.optic_id],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(products);
    }
  );
});

export default router; 