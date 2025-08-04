import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { Sale, SaleWithDetails } from '../types';

const router = Router();

// Get all sales for the authenticated user's optic
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
            p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
            s.unregistered_client_name, s.unregistered_product_name
     FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     LEFT JOIN products p ON s.product_id = p.id
     WHERE s.optic_id = ?
     ORDER BY s.sale_date DESC, s.created_at DESC`,
    [authReq.user.optic_id],
    (err, sales) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(sales);
    }
  );
});

// Get single sale with details
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const saleId = parseInt(req.params.id);
  
  db.get(
    `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
            p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
            s.unregistered_client_name, s.unregistered_product_name
     FROM sales s
     LEFT JOIN clients c ON s.client_id = c.id
     LEFT JOIN products p ON s.product_id = p.id
     WHERE s.id = ? AND s.optic_id = ?`,
    [saleId, authReq.user.optic_id],
    (err, sale) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!sale) {
        return res.status(404).json({ error: 'Sale not found' });
      }
      res.json(sale);
    }
  );
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
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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

  // Start transaction
  db.serialize(() => {
    // Check if client exists and belongs to user's optic (if provided)
    if (client_id) {
      db.get(
        'SELECT id FROM clients WHERE id = ? AND optic_id = ?',
        [client_id, authReq.user.optic_id],
        (err, client) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!client) {
            return res.status(404).json({ error: 'Client not found' });
          }
          createSale();
        }
      );
    } else {
      createSale();
    }
  });

  function createSale() {
    // Check if product exists and has enough stock (if provided)
    if (product_id) {
      db.get(
        'SELECT id, price, stock_quantity FROM products WHERE id = ? AND optic_id = ?',
        [product_id, authReq.user.optic_id],
        (err, product: any) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }
          if (product.stock_quantity < quantity) {
            return res.status(400).json({ 
              error: `Insufficient stock. Available: ${product.stock_quantity}, Requested: ${quantity}` 
            });
          }
          insertSale();
        }
      );
    } else {
      insertSale();
    }
  }

  function insertSale() {
    // Create sale record
    db.run(
      `INSERT INTO sales (optic_id, client_id, product_id, quantity, total_price, sale_date, notes, 
                         unregistered_client_name, unregistered_product_name,
                         od_esf, od_cil, od_eje, od_add, oi_esf, oi_cil, oi_eje, oi_add) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [authReq.user.optic_id, client_id || null, product_id || null, quantity, total_price, sale_date, notes,
       unregistered_client_name, unregistered_product_name,
       od_esf, od_cil, od_eje, od_add, oi_esf, oi_cil, oi_eje, oi_add],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to create sale' });
        }

        const saleId = this.lastID;

        // Update product stock if product was selected
        if (product_id) {
          db.run(
            'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [quantity, product_id],
            function(err) {
              if (err) {
                return res.status(500).json({ error: 'Failed to update stock' });
              }
              returnSaleWithDetails(saleId);
            }
          );
        } else {
          returnSaleWithDetails(saleId);
        }
      }
    );
  }

  function returnSaleWithDetails(saleId: number) {
    // Get the created sale with details
    db.get(
      `SELECT s.*, c.dni, c.first_name, c.last_name, c.phone, c.email,
              p.name as product_name, p.brand, p.model, p.color, p.size, p.price,
              s.unregistered_client_name, s.unregistered_product_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       LEFT JOIN products p ON s.product_id = p.id
       WHERE s.id = ?`,
      [saleId],
      (err, sale) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json(sale);
      }
    );
  }
});

// Get sales by client
router.get('/client/:clientId', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const clientId = parseInt(req.params.clientId);
  
  db.all(
    `SELECT s.*, p.name as product_name, p.brand, p.model, p.color, p.size, p.price
     FROM sales s
     JOIN products p ON s.product_id = p.id
     WHERE s.optic_id = ? AND s.client_id = ?
     ORDER BY s.sale_date DESC`,
    [authReq.user.optic_id, clientId],
    (err, sales) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(sales);
    }
  );
});

// Get sales by date range
router.get('/date-range/:startDate/:endDate', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const { startDate, endDate } = req.params;
  
  db.all(
    `SELECT s.*, c.dni, c.first_name, c.last_name,
            p.name as product_name, p.brand, p.model
     FROM sales s
     JOIN clients c ON s.client_id = c.id
     JOIN products p ON s.product_id = p.id
     WHERE s.optic_id = ? AND s.sale_date BETWEEN ? AND ?
     ORDER BY s.sale_date DESC`,
    [authReq.user.optic_id, startDate, endDate],
    (err, sales) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(sales);
    }
  );
});

// Get sales statistics
router.get('/stats/summary', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.get(
    `SELECT 
       COUNT(*) as total_sales,
       SUM(total_price) as total_revenue,
       AVG(total_price) as avg_sale_value,
       MIN(sale_date) as first_sale_date,
       MAX(sale_date) as last_sale_date
     FROM sales 
     WHERE optic_id = ?`,
    [authReq.user.optic_id],
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(stats);
    }
  );
});

// Get top selling products
router.get('/stats/top-products', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    `SELECT 
       p.name, p.brand, p.model,
       SUM(s.quantity) as total_sold,
       SUM(s.total_price) as total_revenue,
       COUNT(s.id) as sale_count
     FROM sales s
     JOIN products p ON s.product_id = p.id
     WHERE s.optic_id = ?
     GROUP BY s.product_id
     ORDER BY total_sold DESC
     LIMIT 10`,
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