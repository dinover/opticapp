import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';
import { cloudinary, upload } from '../config/cloudinary';

const router = express.Router();

// GET / - Obtener todos los productos del óptico
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await executeQuery(`
      SELECT * FROM products 
      WHERE optic_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
    `, [req.user?.optic_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /:id - Obtener un producto específico
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    
    const result = await executeQuerySingle(`
      SELECT * FROM products 
      WHERE id = $1 AND optic_id = $2 AND deleted_at IS NULL
    `, [productId, req.user?.optic_id]);

    if (!result) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST / - Crear un nuevo producto
router.post('/', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, description, price, stock_quantity, brand, model, color, size } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    const imageUrl = req.file ? req.file.path : null;

    const result = await executeInsert(`
      INSERT INTO products (
        optic_id, name, description, price, stock_quantity, 
        brand, model, color, size, image_url, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      req.user?.optic_id, name, description || null, parseFloat(price), 
      parseInt(stock_quantity) || 0, brand || null, model || null, 
      color || null, size || null, imageUrl
    ]);

    res.status(201).json({ 
      message: 'Producto creado exitosamente',
      product_id: result.id 
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// PUT /:id - Actualizar un producto
router.put('/:id', authenticateToken, upload.single('image'), async (req: AuthenticatedRequest, res) => {
  try {
    const productId = parseInt(req.params.id);
    const { name, description, price, stock_quantity, brand, model, color, size } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Nombre y precio son requeridos' });
    }

    // Verificar que el producto existe y pertenece al óptico
    const existingProduct = await executeQuerySingle(`
      SELECT image_url FROM products WHERE id = $1 AND optic_id = $2
    `, [productId, req.user?.optic_id]);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Si hay una nueva imagen, eliminar la anterior de Cloudinary
    let imageUrl = existingProduct.image_url;
    if (req.file) {
      if (existingProduct.image_url) {
        try {
          await cloudinary.uploader.destroy(existingProduct.image_url);
        } catch (error) {
          console.error('Error deleting old image:', error);
        }
      }
      imageUrl = req.file.path;
    }

    const result = await executeUpdate(`
      UPDATE products SET 
        name = $1, description = $2, price = $3, stock_quantity = $4,
        brand = $5, model = $6, color = $7, size = $8, image_url = $9, updated_at = CURRENT_TIMESTAMP
      WHERE id = $10 AND optic_id = $11 AND deleted_at IS NULL
    `, [
      name, description || null, parseFloat(price), parseInt(stock_quantity) || 0,
      brand || null, model || null, color || null, size || null, imageUrl,
      productId, req.user?.optic_id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /:id - Eliminar un producto (eliminación lógica)
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const productId = parseInt(req.params.id);

    // Verificar que el producto existe y pertenece al óptico
    const existingProduct = await executeQuerySingle(`
      SELECT image_url FROM products WHERE id = $1 AND optic_id = $2 AND deleted_at IS NULL
    `, [productId, req.user?.optic_id]);

    if (!existingProduct) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    // Eliminar imagen de Cloudinary si existe
    if (existingProduct.image_url) {
      try {
        await cloudinary.uploader.destroy(existingProduct.image_url);
      } catch (error) {
        console.error('Error deleting image from Cloudinary:', error);
      }
    }

    const result = await executeUpdate(`
      UPDATE products SET deleted_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND optic_id = $2 AND deleted_at IS NULL
    `, [productId, req.user?.optic_id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 