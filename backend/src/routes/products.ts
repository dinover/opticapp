import express from 'express';
import { body, validationResult } from 'express-validator';
import { upload, deleteImage } from '../config/cloudinary';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Extender el tipo Request para incluir user
interface AuthenticatedRequest extends express.Request {
  user: {
    id: number;
    username: string;
    optic_id: number;
    role: string;
    is_approved: boolean;
  };
}

// Middleware para verificar errores de validación
const handleValidationErrors = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Get all products for the authenticated user's optic
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const result = await executeQuery('SELECT * FROM products WHERE optic_id = $1 ORDER BY created_at DESC', [req.user.optic_id]);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const result = await executeQuerySingle('SELECT * FROM products WHERE id = $1 AND optic_id = $2', [req.params.id, req.user.optic_id]);
    
    if (!result) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create product
router.post('/', authenticateToken, upload.single('image'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional(),
  body('brand').optional(),
  body('model').optional(),
  body('color').optional(),
  body('size').optional(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a valid number')
], async (req: AuthenticatedRequest, res: express.Response) => {
  handleValidationErrors(req, res, async () => {
    try {
      const result = await executeInsert(
        `INSERT INTO products (optic_id, name, description, brand, model, color, size, price, stock_quantity, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [req.user.optic_id, req.body.name, req.body.description, req.body.brand, req.body.model, req.body.color, req.body.size, req.body.price, req.body.stock_quantity, req.file ? req.file.path : null]
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });
});

// Update product
router.put('/:id', authenticateToken, upload.single('image'), [
  body('name').notEmpty().withMessage('Name is required'),
  body('description').optional(),
  body('brand').optional(),
  body('model').optional(),
  body('color').optional(),
  body('size').optional(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a valid number')
], async (req: AuthenticatedRequest, res: express.Response) => {
  handleValidationErrors(req, res, async () => {
    try {
      const result = await executeQuery(
        `UPDATE products SET name = $1, description = $2, brand = $3, model = $4, color = $5, size = $6, 
         price = $7, stock_quantity = $8, image_url = $9, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $10 AND optic_id = $11 RETURNING *`,
        [req.body.name, req.body.description, req.body.brand, req.body.model, req.body.color, req.body.size, req.body.price, req.body.stock_quantity, req.file ? req.file.path : req.body.image_url, req.params.id, req.user.optic_id]
      );
      
      if (result.rowCount === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ error: 'Database error' });
    }
  });
});

// Delete product
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const result = await executeQuery('DELETE FROM products WHERE id = $1 AND optic_id = $2 RETURNING *', [req.params.id, req.user.optic_id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Search products
router.get('/search/:query', authenticateToken, async (req: AuthenticatedRequest, res: express.Response) => {
  try {
    const result = await executeQuery('SELECT * FROM products WHERE optic_id = $1 AND (name ILIKE $2 OR brand ILIKE $2 OR model ILIKE $2 OR description ILIKE $2) ORDER BY created_at DESC', [req.user.optic_id, `%${req.params.query}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 