import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { pool } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { Product } from '../types';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880') // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all products for the authenticated user's optic
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE optic_id = $1 ORDER BY created_at DESC',
        [authReq.user.optic_id]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get single product
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const productId = parseInt(req.params.id);
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE id = $1 AND optic_id = $2',
        [productId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create new product
router.post('/', [
  authenticateToken,
  upload.single('image'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('brand').optional(),
  body('model').optional(),
  body('color').optional(),
  body('size').optional(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a valid number')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const authReq = req as any;
    const { name, description, brand, model, color, size, price, stock_quantity } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Handle optional fields with defaults
    const cleanBrand = brand || '';
    const cleanModel = model || '';
    const cleanColor = color || '';
    const cleanSize = size || '';
    const cleanPrice = price ? parseFloat(price) : 0;
    const cleanStockQuantity = stock_quantity ? parseInt(stock_quantity) : 0;

    try {
      const result = await client.query(
        `INSERT INTO products (optic_id, name, description, brand, model, color, size, price, stock_quantity, image_url) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [authReq.user.optic_id, name, description, cleanBrand, cleanModel, cleanColor, cleanSize, cleanPrice, cleanStockQuantity, imageUrl]
      );
      
      res.status(201).json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Update product
router.put('/:id', [
  authenticateToken,
  upload.single('image'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('brand').optional(),
  body('model').optional(),
  body('color').optional(),
  body('size').optional(),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a valid number'),
  body('stock_quantity').optional().isInt({ min: 0 }).withMessage('Stock quantity must be a valid number')
], async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await pool.connect();
    const authReq = req as any;
    const productId = parseInt(req.params.id);
    const { name, description, brand, model, color, size, price, stock_quantity } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    // Handle optional fields with defaults
    const cleanBrand = brand || '';
    const cleanModel = model || '';
    const cleanColor = color || '';
    const cleanSize = size || '';
    const cleanPrice = price ? parseFloat(price) : 0;
    const cleanStockQuantity = stock_quantity ? parseInt(stock_quantity) : 0;
    const updateImageUrl = imageUrl || req.body.image_url;

    try {
      const result = await client.query(
        `UPDATE products SET name = $1, description = $2, brand = $3, model = $4, color = $5, size = $6, 
         price = $7, stock_quantity = $8, image_url = $9, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $10 AND optic_id = $11 RETURNING *`,
        [name, description, cleanBrand, cleanModel, cleanColor, cleanSize, cleanPrice, cleanStockQuantity, updateImageUrl, productId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json(result.rows[0]);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const productId = parseInt(req.params.id);
    
    try {
      const result = await client.query(
        'DELETE FROM products WHERE id = $1 AND optic_id = $2 RETURNING *',
        [productId, authReq.user.optic_id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      
      res.json({ message: 'Product deleted successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// Search products
router.get('/search/:query', authenticateToken, async (req: Request, res: Response) => {
  try {
    const client = await pool.connect();
    const authReq = req as any;
    const query = req.params.query;
    
    try {
      const result = await client.query(
        'SELECT * FROM products WHERE optic_id = $1 AND (name ILIKE $2 OR brand ILIKE $2 OR model ILIKE $2 OR description ILIKE $2) ORDER BY created_at DESC',
        [authReq.user.optic_id, `%${query}%`]
      );
      
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router; 