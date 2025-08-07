import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { executeQuery } from '../database/query';

const router = express.Router();

// Interfaz para requests autenticados
interface AuthenticatedRequest extends express.Request {
  user: {
    id: number;
    username: string;
    email: string;
    optic_id: number;
    role: string;
    is_approved: boolean;
    created_at: string;
    updated_at: string;
  };
}

// GET /stats - Obtener estadísticas del óptico
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== STATS ROUTE DEBUG ===');
    console.log('User optic_id:', req.user.optic_id);
    console.log('User object:', req.user);

    // Obtener estadísticas de productos
    console.log('Executing products query...');
    const productsResult = await executeQuery(`
      SELECT COUNT(*) as total_products FROM products WHERE optic_id = $1
    `, [req.user.optic_id]);
    console.log('Products result:', productsResult);

    // Obtener estadísticas de clientes
    console.log('Executing clients query...');
    const clientsResult = await executeQuery(`
      SELECT COUNT(*) as total_clients FROM clients WHERE optic_id = $1
    `, [req.user.optic_id]);
    console.log('Clients result:', clientsResult);

    // Obtener estadísticas de ventas
    console.log('Executing sales query...');
    const salesResult = await executeQuery(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_revenue
      FROM sales WHERE optic_id = $1
    `, [req.user.optic_id]);
    console.log('Sales result:', salesResult);

    const stats = {
      total_products: parseInt(productsResult.rows[0].total_products),
      total_clients: parseInt(clientsResult.rows[0].total_clients),
      total_sales: parseInt(salesResult.rows[0].total_sales),
      total_revenue: salesResult.rows[0].total_revenue ? parseFloat(salesResult.rows[0].total_revenue) : 0
    };

    console.log('Final stats:', stats);
    console.log('=== STATS ROUTE SUCCESS ===');
    res.json(stats);
  } catch (error) {
    console.error('=== STATS ROUTE ERROR ===');
    console.error('Error fetching stats:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /activity - Obtener actividad reciente
router.get('/activity', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    console.log('=== ACTIVITY ROUTE DEBUG ===');
    console.log('User optic_id for activity:', req.user.optic_id);
    console.log('User object:', req.user);

    console.log('Executing activity query...');
    const result = await executeQuery(`
      SELECT 
        s.id,
        COALESCE(c.first_name || ' ' || c.last_name, s.unregistered_client_name) as client_name,
        s.sale_date,
        s.total_amount as total_price,
        s.created_at
      FROM sales s
      LEFT JOIN clients c ON s.client_id = c.id
      WHERE s.optic_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [req.user.optic_id]);
    console.log('Activity query result:', result);

    const activity = result.rows.map(row => ({
      id: row.id,
      client_name: row.client_name || 'Cliente no registrado',
      sale_date: row.sale_date,
      total_price: parseFloat(row.total_price || '0'),
      created_at: row.created_at
    }));

    console.log('Activity items:', activity.length);
    console.log('Activity data:', activity);
    console.log('=== ACTIVITY ROUTE SUCCESS ===');
    res.json(activity);
  } catch (error) {
    console.error('=== ACTIVITY ROUTE ERROR ===');
    console.error('Error fetching activity:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /low-stock - Obtener productos con bajo stock
router.get('/low-stock', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        id,
        name,
        stock_quantity,
        price
      FROM products 
      WHERE optic_id = $1 AND stock_quantity <= 5
      ORDER BY stock_quantity ASC
      LIMIT 10
    `, [req.user.optic_id]);

    const lowStockProducts = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      stock_quantity: parseInt(row.stock_quantity),
      price: parseFloat(row.price)
    }));

    res.json(lowStockProducts);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 