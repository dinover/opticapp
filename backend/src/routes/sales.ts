import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { Sale, SaleWithDetails } from '../types';

const router = Router();

// Get all sales for the authenticated user's optic
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
                p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
                s.unregistered_client_name, s.unregistered_product_name
         FROM sales s
         LEFT JOIN clients c ON s.client_id = c.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.optic_id = $1
         ORDER BY s.sale_date DESC, s.created_at DESC`,
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single sale with details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const saleId = parseInt(req.params.id);
    
    try {
      const result = await client.query(
        `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
                p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
                s.unregistered_client_name, s.unregistered_product_name
         FROM sales s
         LEFT JOIN clients c ON s.client_id = c.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.id = $1 AND s.optic_id = $2`,
        [saleId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Sale not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new sale
router.post('/', [
  authenticateToken,
  body('client_id').optional().isInt({ min: 1 }).withMessage('Client ID must be a valid integer'),
  body('product_id').optional().isInt({ min: 1 }).withMessage('Product ID must be a valid integer'),
  body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  body('total_price').isFloat({ min: 0 }).withMessage('Valid total price is required'),
  body('sale_date').isISO8601().withMessage('Valid sale date is required'),
  body('notes').optional().isString().withMessage('Notes must be a string'),
  body('od_esf').optional().isString().withMessage('OD Esf must be a string'),
  body('od_cil').optional().isString().withMessage('OD Cil must be a string'),
  body('od_eje').optional().isString().withMessage('OD Eje must be a string'),
  body('od_add').optional().isString().withMessage('OD Add must be a string'),
  body('oi_esf').optional().isString().withMessage('OI Esf must be a string'),
  body('oi_cil').optional().isString().withMessage('OI Cil must be a string'),
  body('oi_eje').optional().isString().withMessage('OI Eje must be a string'),
  body('oi_add').optional().isString().withMessage('OI Add must be a string')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const authReq = req as any;
    const { 
      client_id, 
      product_id, 
      quantity, 
      total_price,
      sale_date, 
      notes,
      unregistered_client_name,
      unregistered_product_name,
      od_esf,
      od_cil,
      od_eje,
      od_add,
      oi_esf,
      oi_cil,
      oi_eje,
      oi_add
    } = req.body;

    try {
      // Validate client if provided
      if (client_id) {
        const clientResult = await client.query(
          'SELECT id FROM clients WHERE id = $1 AND optic_id = $2',
          [client_id, authReq.user.optic_id]
        );
        
        if (clientResult.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid client ID' });
        }
      }

      // Validate product if provided
      if (product_id) {
        const productResult = await client.query(
          'SELECT id, stock_quantity FROM products WHERE id = $1 AND optic_id = $2',
          [product_id, authReq.user.optic_id]
        );
        
        if (productResult.rows.length === 0) {
          return res.status(400).json({ error: 'Invalid product ID' });
        }

        // Check stock availability
        const product = productResult.rows[0];
        if (product.stock_quantity < quantity) {
          return res.status(400).json({ error: 'Insufficient stock' });
        }

        // Update stock
        await client.query(
          'UPDATE products SET stock_quantity = stock_quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [quantity, product_id]
        );
      }

      // Create sale
      const saleResult = await client.query(
        `INSERT INTO sales (optic_id, client_id, product_id, quantity, total_price, sale_date, notes,
                          unregistered_client_name, unregistered_product_name,
                          od_esf, od_cil, od_eje, od_add, oi_esf, oi_cil, oi_eje, oi_add)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`,
        [authReq.user.optic_id, client_id || null, product_id || null, quantity, total_price, sale_date, notes,
         unregistered_client_name, unregistered_product_name,
         od_esf, od_cil, od_eje, od_add, oi_esf, oi_cil, oi_eje, oi_add]
      );

      const sale = saleResult.rows[0];

      // Get sale with details
      const detailsResult = await client.query(
        `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
                p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
                s.unregistered_client_name, s.unregistered_product_name
         FROM sales s
         LEFT JOIN clients c ON s.client_id = c.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.id = $1`,
        [sale.id]
      );

      res.status(201).json(detailsResult.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get sales by client
router.get('/client/:clientId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const clientId = parseInt(req.params.clientId);
    
    try {
      const result = await client.query(
        `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
                p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
                s.unregistered_client_name, s.unregistered_product_name
         FROM sales s
         LEFT JOIN clients c ON s.client_id = c.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.optic_id = $1 AND s.client_id = $2
         ORDER BY s.sale_date DESC`,
        [authReq.user.optic_id, clientId]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching client sales:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get sales by date range
router.get('/date-range/:startDate/:endDate', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const { startDate, endDate } = req.params;
    
    try {
      const result = await client.query(
        `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
                p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
                s.unregistered_client_name, s.unregistered_product_name
         FROM sales s
         LEFT JOIN clients c ON s.client_id = c.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.optic_id = $1 AND s.sale_date BETWEEN $2 AND $3
         ORDER BY s.sale_date DESC`,
        [authReq.user.optic_id, startDate, endDate]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sales by date range:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get sales statistics
router.get('/stats/summary', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        `SELECT 
           COUNT(*) as total_sales,
           SUM(total_price) as total_revenue,
           AVG(total_price) as average_sale,
           COUNT(DISTINCT client_id) as unique_clients
         FROM sales 
         WHERE optic_id = $1`,
        [authReq.user.optic_id]
      );
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching sales stats:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get top selling products
router.get('/stats/top-products', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        `SELECT 
           p.name,
           p.brand,
           p.model,
           COUNT(s.id) as sales_count,
           SUM(s.quantity) as total_quantity,
           SUM(s.total_price) as total_revenue
         FROM sales s
         JOIN products p ON s.product_id = p.id
         WHERE s.optic_id = $1
         GROUP BY p.id, p.name, p.brand, p.model
         ORDER BY total_revenue DESC
         LIMIT 10`,
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 