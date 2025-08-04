import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { body, validationResult } from 'express-validator';
import { db } from '../database/init';
import { authenticateToken } from '../middleware/auth';
import { Product } from '../types';

const router = Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all products for the authenticated user's optic
router.get('/', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  
  db.all(
    'SELECT * FROM products WHERE optic_id = ? ORDER BY created_at DESC',
    [authReq.user.optic_id],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(products);
    }
  );
});

// Get single product
router.get('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const productId = parseInt(req.params.id);
  
  db.get(
    'SELECT * FROM products WHERE id = ? AND optic_id = ?',
    [productId, authReq.user.optic_id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json(product);
    }
  );
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
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

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

  db.run(
    `INSERT INTO products (optic_id, name, description, brand, model, color, size, price, stock_quantity, image_url) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [authReq.user.optic_id, name, description || '', cleanBrand, cleanModel, cleanColor, cleanSize, cleanPrice, cleanStockQuantity, imageUrl],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Failed to create product' });
      }

      db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, product) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json(product);
      });
    }
  );
});

// Update product
router.put('/:id', [
  authenticateToken,
  upload.single('image'),
  body('name').notEmpty().withMessage('Product name is required'),
  body('brand').notEmpty().withMessage('Brand is required'),
  body('model').notEmpty().withMessage('Model is required'),
  body('color').notEmpty().withMessage('Color is required'),
  body('size').notEmpty().withMessage('Size is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock_quantity').isInt({ min: 0 }).withMessage('Valid stock quantity is required')
], (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const authReq = req as any;
  const productId = parseInt(req.params.id);
  const { name, description, brand, model, color, size, price, stock_quantity } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  // First check if product exists and belongs to user's optic
  db.get(
    'SELECT * FROM products WHERE id = ? AND optic_id = ?',
    [productId, authReq.user.optic_id],
    (err, existingProduct) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!existingProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // If new image uploaded, delete old image
      if (req.file && existingProduct.image_url) {
        const oldImagePath = path.join(__dirname, '../..', existingProduct.image_url);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      const updateImageUrl = imageUrl || existingProduct.image_url;

      db.run(
        `UPDATE products SET name = ?, description = ?, brand = ?, model = ?, color = ?, size = ?, 
         price = ?, stock_quantity = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ? AND optic_id = ?`,
        [name, description, brand, model, color, size, price, stock_quantity, updateImageUrl, productId, authReq.user.optic_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to update product' });
          }

          db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json(product);
          });
        }
      );
    }
  );
});

// Delete product
router.delete('/:id', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const productId = parseInt(req.params.id);

  // First check if product exists and belongs to user's optic
  db.get(
    'SELECT * FROM products WHERE id = ? AND optic_id = ?',
    [productId, authReq.user.optic_id],
    (err, product) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Delete image file if exists
      if (product.image_url) {
        const imagePath = path.join(__dirname, '../..', product.image_url);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      db.run(
        'DELETE FROM products WHERE id = ? AND optic_id = ?',
        [productId, authReq.user.optic_id],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Failed to delete product' });
          }
          res.json({ message: 'Product deleted successfully' });
        }
      );
    }
  );
});

// Search products
router.get('/search/:query', authenticateToken, (req: Request, res: Response) => {
  const authReq = req as any;
  const query = `%${req.params.query}%`;

  db.all(
    `SELECT * FROM products WHERE optic_id = ? AND 
     (name LIKE ? OR brand LIKE ? OR model LIKE ? OR color LIKE ?) 
     ORDER BY created_at DESC`,
    [authReq.user.optic_id, query, query, query, query],
    (err, products) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(products);
    }
  );
});

export default router; 