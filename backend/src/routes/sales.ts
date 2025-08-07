import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';
import { authenticateToken } from '../middleware/auth';

interface AuthenticatedRequest extends Request {
  user?: any;
}

const router = Router();

// Get all sales for the authenticated user's optic
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await executeQuery(`
      SELECT s.*, 
             c.first_name as client_first_name, 
             c.last_name as client_last_name,
             c.dni as client_dni
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.optic_id = ?
      ORDER BY s.sale_date DESC
    `, [req.user?.optic_id]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single sale
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const saleId = parseInt(req.params.id);
    
    const result = await executeQuerySingle(`
      SELECT s.*, 
             c.first_name as client_first_name, 
             c.last_name as client_last_name,
             c.dni as client_dni
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.id = ? AND s.optic_id = ?
    `, [saleId, req.user?.optic_id]);
    
    if (!result) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new sale
router.post('/', [
  authenticateToken,
  body('client_id').optional().isInt().withMessage('Client ID must be an integer'),
  body('unregistered_client_name').optional().isString().withMessage('Unregistered client name must be a string'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.product_id').optional().isInt().withMessage('Product ID must be an integer'),
  body('items.*.unregistered_product_name').optional().isString().withMessage('Unregistered product name must be a string'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be positive'),
  body('items.*.od_esf').optional().isFloat().withMessage('OD Esfera must be a number'),
  body('items.*.od_cil').optional().isFloat().withMessage('OD Cilindro must be a number'),
  body('items.*.od_eje').optional().isInt({ min: 0, max: 180 }).withMessage('OD Eje must be between 0 and 180'),
  body('items.*.od_add').optional().isFloat().withMessage('OD Adición must be a number'),
  body('items.*.oi_esf').optional().isFloat().withMessage('OI Esfera must be a number'),
  body('items.*.oi_cil').optional().isFloat().withMessage('OI Cilindro must be a number'),
  body('items.*.oi_eje').optional().isInt({ min: 0, max: 180 }).withMessage('OI Eje must be between 0 and 180'),
  body('items.*.oi_add').optional().isFloat().withMessage('OI Adición must be a number'),
  body('items.*.notes').optional().isString().withMessage('Notes must be a string'),
  body('notes').optional().isString().withMessage('Sale notes must be a string')
], async (req: AuthenticatedRequest, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { client_id, unregistered_client_name, items, notes } = req.body;
    
    // Validate that either client_id or unregistered_client_name is provided
    if (!client_id && !unregistered_client_name) {
      return res.status(400).json({ error: 'Either client_id or unregistered_client_name is required' });
    }

    // Validate that each item has either product_id or unregistered_product_name
    for (const item of items) {
      if (!item.product_id && !item.unregistered_product_name) {
        return res.status(400).json({ error: 'Each item must have either product_id or unregistered_product_name' });
      }
    }

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unit_price);
    }, 0);

    // Create the sale
    const sale = await executeInsert(`
      INSERT INTO sales (optic_id, client_id, unregistered_client_name, total_amount, notes, sale_date)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [req.user?.optic_id, client_id || null, unregistered_client_name || null, totalAmount, notes || null]);

    // Create sale items
    for (const item of items) {
      await executeInsert(`
        INSERT INTO sale_items (
          sale_id, product_id, unregistered_product_name, quantity, unit_price, total_price,
          od_esf, od_cil, od_eje, od_add, oi_esf, oi_cil, oi_eje, oi_add, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sale.id,
        item.product_id || null,
        item.unregistered_product_name || null,
        item.quantity,
        item.unit_price,
        item.quantity * item.unit_price,
        item.od_esf || null,
        item.od_cil || null,
        item.od_eje || null,
        item.od_add || null,
        item.oi_esf || null,
        item.oi_cil || null,
        item.oi_eje || null,
        item.oi_add || null,
        item.notes || null
      ]);

      // Update product stock if it's a registered product
      if (item.product_id) {
        await executeUpdate(`
          UPDATE products 
          SET stock_quantity = stock_quantity - ? 
          WHERE id = ? AND optic_id = ?
        `, [item.quantity, item.product_id, req.user?.optic_id]);
      }
    }

    // Get the complete sale with items
    const completeSale = await executeQuerySingle(`
      SELECT s.*, 
             c.first_name as client_first_name, 
             c.last_name as client_last_name,
             c.dni as client_dni
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.id = ?
    `, [sale.id]);

    const saleItems = await executeQuery(`
      SELECT si.*, p.name as product_name, p.brand, p.model, p.color
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = ?
    `, [sale.id]);

    res.status(201).json({
      ...completeSale,
      items: saleItems.rows
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete sale
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const saleId = parseInt(req.params.id);
    
    // Get sale items to restore stock
    const items = await executeQuery(`
      SELECT product_id, quantity FROM sale_items WHERE sale_id = ?
    `, [saleId]);
    
    // Restore product stock
    for (const item of items.rows) {
      if (item.product_id) {
        await executeUpdate(`
          UPDATE products 
          SET stock_quantity = stock_quantity + ? 
          WHERE id = ? AND optic_id = ?
        `, [item.quantity, item.product_id, req.user?.optic_id]);
      }
    }
    
    // Delete sale items (cascade)
    await executeUpdate('DELETE FROM sale_items WHERE sale_id = ?', [saleId]);
    
    // Delete sale
    const result = await executeUpdate(`
      DELETE FROM sales WHERE id = ? AND optic_id = ?
    `, [saleId, req.user?.optic_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 