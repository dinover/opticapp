import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { executeQuery, executeQuerySingle, executeInsert, executeUpdate } from '../database/query';

const router = express.Router();

// GET / - Obtener todas las ventas del óptico
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        s.id,
        s.client_id,
        s.unregistered_client_name,
        s.total_amount,
        s.sale_date,
        s.notes,
        s.created_at,
        c.first_name,
        c.last_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.optic_id = $1
      ORDER BY s.created_at DESC
    `, [req.user?.optic_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /:id - Obtener una venta específica con sus items
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const saleId = parseInt(req.params.id);

    const saleResult = await executeQuerySingle(`
      SELECT 
        s.id,
        s.client_id,
        s.unregistered_client_name,
        s.total_amount,
        s.sale_date,
        s.notes,
        s.created_at,
        c.first_name,
        c.last_name
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.id = $1 AND s.optic_id = $2
    `, [saleId, req.user?.optic_id]);

    if (!saleResult) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const itemsResult = await executeQuery(`
      SELECT 
        si.id,
        si.product_id,
        si.unregistered_product_name,
        si.quantity,
        si.unit_price,
        si.od_esf,
        si.od_cil,
        si.od_eje,
        si.od_add,
        si.oi_esf,
        si.oi_cil,
        si.oi_eje,
        si.oi_add,
        si.notes,
        p.name as product_name,
        p.price as product_price
      FROM sale_items si
      LEFT JOIN products p ON si.product_id = p.id
      WHERE si.sale_id = $1
    `, [saleId]);

    const sale = {
      ...saleResult,
      items: itemsResult.rows
    };

    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// POST / - Crear una nueva venta
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { client_id, unregistered_client_name, items, notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }

    // Calcular el total de la venta
    const totalAmount = items.reduce((total: number, item: any) => {
      return total + (item.quantity * item.unit_price);
    }, 0);

    // Crear la venta
    const saleResult = await executeInsert(`
      INSERT INTO sales (optic_id, client_id, unregistered_client_name, total_amount, sale_date, notes, created_at)
      VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, CURRENT_TIMESTAMP)
      RETURNING id
    `, [req.user?.optic_id, client_id || null, unregistered_client_name || null, totalAmount, notes || null]);

    const saleId = saleResult.id;

    // Crear los items de la venta
    for (const item of items) {
      // Convertir product_id a número si es un string numérico
      const productId = item.product_id && item.product_id !== 'unregistered' ? parseInt(item.product_id) : null;
      
      await executeInsert(`
        INSERT INTO sale_items (
          sale_id, product_id, unregistered_product_name, quantity, unit_price,
          od_esf, od_cil, od_eje, od_add, oi_esf, oi_cil, oi_eje, oi_add, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      `, [
        saleId, productId, item.unregistered_product_name || null,
        item.quantity, item.unit_price,
        item.od_esf || null, item.od_cil || null, item.od_eje || null, item.od_add || null,
        item.oi_esf || null, item.oi_cil || null, item.oi_eje || null, item.oi_add || null,
        item.notes || null
      ]);

      // Actualizar stock si es un producto registrado
      if (productId) {
        await executeUpdate(`
          UPDATE products 
          SET stock_quantity = stock_quantity - $1
          WHERE id = $2 AND optic_id = $3
        `, [item.quantity, productId, req.user?.optic_id]);
      }
    }

    res.status(201).json({ 
      message: 'Venta creada exitosamente',
      sale_id: saleId 
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// DELETE /:id - Eliminar una venta
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const saleId = parseInt(req.params.id);

    // Verificar que la venta existe y pertenece al óptico
    const saleResult = await executeQuerySingle(`
      SELECT id FROM sales WHERE id = $1 AND optic_id = $2
    `, [saleId, req.user?.optic_id]);

    if (!saleResult) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    // Obtener los items para restaurar stock
    const itemsResult = await executeQuery(`
      SELECT product_id, quantity FROM sale_items WHERE sale_id = $1
    `, [saleId]);

    // Restaurar stock de productos registrados
    for (const item of itemsResult.rows) {
      if (item.product_id) {
        await executeUpdate(`
          UPDATE products 
          SET stock_quantity = stock_quantity + $1
          WHERE id = $2 AND optic_id = $3
        `, [item.quantity, item.product_id, req.user?.optic_id]);
      }
    }

    // Eliminar los items de la venta
    await executeUpdate(`
      DELETE FROM sale_items WHERE sale_id = $1
    `, [saleId]);

    // Eliminar la venta
    await executeUpdate(`
      DELETE FROM sales WHERE id = $1
    `, [saleId]);

    res.json({ message: 'Venta eliminada exitosamente' });
  } catch (error) {
    console.error('Error deleting sale:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 