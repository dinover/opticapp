import express from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { executeQuery, executeQuerySingle } from '../database/query';

const router = express.Router();

// GET /stats - Obtener estadísticas del óptico
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const statsResult = await executeQuerySingle(`
      SELECT 
        COUNT(DISTINCT s.id) as total_sales,
        COUNT(DISTINCT c.id) as total_clients,
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(AVG(s.total_amount), 0) as average_sale
      FROM sales s
      LEFT JOIN clients c ON s.optic_id = c.optic_id AND c.deleted_at IS NULL
      LEFT JOIN products p ON s.optic_id = p.optic_id AND p.deleted_at IS NULL
      WHERE s.optic_id = $1 
        AND s.deleted_at IS NULL
    `, [req.user?.optic_id]);

    res.json({
      total_sales: parseInt(statsResult.total_sales) || 0,
      total_clients: parseInt(statsResult.total_clients) || 0,
      total_products: parseInt(statsResult.total_products) || 0,
      total_revenue: parseFloat(statsResult.total_revenue) || 0,
      average_sale: parseFloat(statsResult.average_sale) || 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /activity - Obtener actividad reciente
router.get('/activity', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await executeQuery(`
      SELECT 
        'sale' as type,
        CONCAT('Venta #', s.id) as description,
        s.total_amount as amount,
        s.created_at
      FROM sales s
      WHERE s.optic_id = $1 
        AND s.deleted_at IS NULL
      ORDER BY s.created_at DESC
      LIMIT 10
    `, [req.user?.optic_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activity:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /low-stock - Obtener productos con stock bajo
router.get('/low-stock', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await executeQuery(`
      SELECT * FROM products 
      WHERE optic_id = $1 AND stock_quantity <= 5
      ORDER BY stock_quantity ASC
    `, [req.user?.optic_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// GET /revenue - Obtener datos de ingresos por período
router.get('/revenue', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const { period = 'week' } = req.query;
    let dateFilter = '';
    let groupBy = '';
    let dateFormat = '';

    switch (period) {
      case 'week':
        dateFilter = 'AND s.sale_date >= CURRENT_DATE - INTERVAL \'7 days\'';
        groupBy = 'DATE(s.sale_date)';
        dateFormat = 'DD/MM';
        break;
      case 'month':
        dateFilter = 'AND s.sale_date >= CURRENT_DATE - INTERVAL \'30 days\'';
        groupBy = 'DATE(s.sale_date)';
        dateFormat = 'DD/MM';
        break;
      case 'year':
        dateFilter = 'AND s.sale_date >= CURRENT_DATE - INTERVAL \'12 months\'';
        groupBy = 'DATE_TRUNC(\'month\', s.sale_date)';
        dateFormat = 'MMM YYYY';
        break;
      default:
        dateFilter = 'AND s.sale_date >= CURRENT_DATE - INTERVAL \'7 days\'';
        groupBy = 'DATE(s.sale_date)';
        dateFormat = 'DD/MM';
    }

    const result = await executeQuery(`
      SELECT 
        ${groupBy} as date,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(s.id) as sales_count
      FROM sales s
      WHERE s.optic_id = $1 
        AND s.deleted_at IS NULL 
        ${dateFilter}
      GROUP BY ${groupBy}
      ORDER BY date ASC
    `, [req.user?.optic_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router; 