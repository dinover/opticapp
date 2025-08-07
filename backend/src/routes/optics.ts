import { Router, Request, Response } from 'express';
import { pool } from '../database/init';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Get optic info
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        'SELECT * FROM optics WHERE id = $1',
        [authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Optic not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching optic:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update optic info
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const { name, address, phone, email } = req.body;
    
    try {
      const result = await client.query(
        'UPDATE optics SET name = $1, address = $2, phone = $3, email = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, address, phone, email, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Optic not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating optic:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get optic stats
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      // Get total products
      const productsResult = await client.query(
        'SELECT COUNT(*) as total_products, SUM(stock_quantity) as total_stock FROM products WHERE optic_id = $1',
        [authReq.user.optic_id]
      );
      
      // Get total clients
      const clientsResult = await client.query(
        'SELECT COUNT(*) as total_clients FROM clients WHERE optic_id = $1',
        [authReq.user.optic_id]
      );
      
      // Get total sales
      const salesResult = await client.query(
        'SELECT COUNT(*) as total_sales, SUM(total_price) as total_revenue FROM sales WHERE optic_id = $1',
        [authReq.user.optic_id]
      );
      
      // Get low stock products
      const lowStockResult = await client.query(
        'SELECT COUNT(*) as low_stock_count FROM products WHERE optic_id = $1 AND stock_quantity <= 5 AND stock_quantity > 0',
        [authReq.user.optic_id]
      );
      
      // Get out of stock products
      const outOfStockResult = await client.query(
        'SELECT COUNT(*) as out_of_stock_count FROM products WHERE optic_id = $1 AND stock_quantity = 0',
        [authReq.user.optic_id]
      );
      
      const stats = {
        total_products: parseInt(productsResult.rows[0].total_products) || 0,
        total_stock: parseInt(productsResult.rows[0].total_stock) || 0,
        total_clients: parseInt(clientsResult.rows[0].total_clients) || 0,
        total_sales: parseInt(salesResult.rows[0].total_sales) || 0,
        total_revenue: salesResult.rows[0].total_revenue ? parseFloat(salesResult.rows[0].total_revenue) : 0,
        low_stock_count: parseInt(lowStockResult.rows[0].low_stock_count) || 0,
        out_of_stock_count: parseInt(outOfStockResult.rows[0].out_of_stock_count) || 0
      };
      
      res.json(stats);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching optic stats:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get low stock products
router.get('/low-stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE optic_id = $1 AND stock_quantity <= 5 AND stock_quantity > 0 ORDER BY stock_quantity ASC',
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get out of stock products
router.get('/out-of-stock', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE optic_id = $1 AND stock_quantity = 0 ORDER BY name ASC',
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get recent activity
router.get('/activity', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        `SELECT 'sale' as type, s.id, s.total_price as amount, s.created_at, 
                c.first_name, c.last_name, p.name as product_name
         FROM sales s
         LEFT JOIN clients c ON s.client_id = c.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.optic_id = $1
         ORDER BY s.created_at DESC
         LIMIT 10`,
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 