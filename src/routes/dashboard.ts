import express, { Request, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRow, getRows, runQuery } from '../config/database';
import { DashboardConfig } from '../types';

const router = express.Router();

// Obtener óptica del usuario autenticado
async function getUserOpticsId(userId: number, userRole: string): Promise<number | null> {
  if (userRole === 'admin') {
    return null; // Admin puede ver todas las ópticas
  }
  const user = await getRow<{ optics_id: number | null }>(
    'SELECT optics_id FROM users WHERE id = ?',
    [userId]
  );
  return user?.optics_id || null;
}

// Obtener estadísticas del dashboard
router.get('/stats', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);

    // Total de ventas
    const salesCondition = opticsId !== null ? 'AND s.optics_id = ?' : '';
    const salesParams: any[] = opticsId !== null ? [opticsId] : [];
    const totalSalesResult = await getRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM sales s WHERE s.is_active = 1 ${salesCondition}`,
      salesParams
    );
    const totalSales = totalSalesResult?.count || 0;

    // Total de ingresos
    const totalRevenueResult = await getRow<{ total: number }>(
      `SELECT COALESCE(SUM(s.total_price), 0) as total FROM sales s WHERE s.is_active = 1 ${salesCondition}`,
      salesParams
    );
    const totalRevenue = totalRevenueResult?.total || 0;

    // Total de clientes
    const clientsCondition = opticsId !== null ? 'AND c.optics_id = ?' : '';
    const clientsParams: any[] = opticsId !== null ? [opticsId] : [];
    const totalClientsResult = await getRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM clients c WHERE c.is_active = 1 ${clientsCondition}`,
      clientsParams
    );
    const totalClients = totalClientsResult?.count || 0;

    // Total de productos
    const productsCondition = opticsId !== null ? 'AND p.optics_id = ?' : '';
    const productsParams: any[] = opticsId !== null ? [opticsId] : [];
    const totalProductsResult = await getRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM products p WHERE p.is_active = 1 ${productsCondition}`,
      productsParams
    );
    const totalProducts = totalProductsResult?.count || 0;

    // Ventas del mes actual
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth() devuelve 0-11, necesitamos 1-12
    const monthStartStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
    // Calcular el primer día del próximo mes para el rango
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    const monthEndStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    // Usar rango de fechas: desde el inicio del mes actual hasta antes del inicio del próximo mes
    // PostgreSQL usa ::date para convertir a fecha y comparar correctamente
    const monthSalesParams: any[] = opticsId !== null 
      ? [opticsId, monthStartStr, monthEndStr] 
      : [monthStartStr, monthEndStr];
    
    const monthSalesResult = await getRow<{ count: number }>(
      `SELECT COUNT(*) as count 
       FROM sales s 
       WHERE s.is_active = 1 
         ${salesCondition}
         AND s.sale_date::date >= ?::date 
         AND s.sale_date::date < ?::date`,
      monthSalesParams
    );
    const monthSales = monthSalesResult?.count || 0;

    // Ingresos del mes actual
    const monthRevenueResult = await getRow<{ total: number }>(
      `SELECT COALESCE(SUM(s.total_price), 0) as total 
       FROM sales s 
       WHERE s.is_active = 1 
         ${salesCondition}
         AND s.sale_date::date >= ?::date 
         AND s.sale_date::date < ?::date`,
      monthSalesParams
    );
    const monthRevenue = monthRevenueResult?.total || 0;

    // Productos más vendidos
    const topProductsQuery = opticsId !== null
      ? `SELECT 
          p.id,
          p.name,
          p.price as base_price,
          COALESCE(SUM(sp.quantity), 0) as total_quantity_sold,
          COALESCE(SUM(sp.total_price), 0) as total_revenue
        FROM products p
        LEFT JOIN sale_products sp ON p.id = sp.product_id
        LEFT JOIN sales s ON sp.sale_id = s.id AND s.is_active = 1
        WHERE p.optics_id = ? AND p.is_active = 1
        GROUP BY p.id, p.name, p.price
        ORDER BY total_quantity_sold DESC
        LIMIT 5`
      : `SELECT 
          p.id,
          p.name,
          p.price as base_price,
          COALESCE(SUM(sp.quantity), 0) as total_quantity_sold,
          COALESCE(SUM(sp.total_price), 0) as total_revenue
        FROM products p
        LEFT JOIN sale_products sp ON p.id = sp.product_id
        LEFT JOIN sales s ON sp.sale_id = s.id AND s.is_active = 1
        WHERE p.is_active = 1
        GROUP BY p.id, p.name, p.price
        ORDER BY total_quantity_sold DESC
        LIMIT 5`;

    const topProducts = await getRows<any>(
      topProductsQuery,
      opticsId !== null ? [opticsId] : []
    );

    // Ventas recientes (últimas 5)
    const recentSales = await getRows<any>(
      `SELECT s.*, c.name as client_name
       FROM sales s
       LEFT JOIN clients c ON s.client_id = c.id
       WHERE s.is_active = 1 ${salesCondition}
       ORDER BY s.sale_date DESC
       LIMIT 5`,
      salesParams
    );

    res.json({
      totalSales,
      totalRevenue: Number(totalRevenue) || 0,
      totalClients,
      totalProducts,
      monthSales,
      monthRevenue: Number(monthRevenue) || 0,
      topProducts,
      recentSales,
    });
  } catch (error: any) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener configuración del dashboard
router.get('/config', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const opticsId = await getUserOpticsId(user.id, user.role);
    
    if (opticsId === null) {
      return res.status(400).json({ error: 'No se pudo determinar la óptica' });
    }

    const config = await getRow<DashboardConfig>(
      'SELECT * FROM dashboard_config WHERE user_id = ? AND optics_id = ?',
      [user.id, opticsId]
    );

    if (!config) {
      // Crear configuración por defecto
      const defaultConfig = {
        user_id: user.id,
        optics_id: opticsId,
        sections_visible: JSON.stringify({
          totalSales: true,
          totalRevenue: true,
          totalClients: true,
          totalProducts: true,
          monthSales: true,
          monthRevenue: true,
          topProducts: true,
          recentSales: true,
        }),
      };

      const result = await runQuery(
        `INSERT INTO dashboard_config (user_id, optics_id, sections_visible)
         VALUES (?, ?, ?)`,
        [defaultConfig.user_id, defaultConfig.optics_id, defaultConfig.sections_visible]
      );

      const newConfig = await getRow<DashboardConfig>(
        'SELECT * FROM dashboard_config WHERE id = ?',
        [result.lastID]
      );

      return res.json(newConfig);
    }

    res.json(config);
  } catch (error: any) {
    console.error('Error al obtener configuración del dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Actualizar configuración del dashboard
router.put('/config', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const { sections_visible } = req.body;

    const opticsId = await getUserOpticsId(user.id, user.role);
    
    if (opticsId === null) {
      return res.status(400).json({ error: 'No se pudo determinar la óptica' });
    }

    const existing = await getRow<DashboardConfig>(
      'SELECT * FROM dashboard_config WHERE user_id = ? AND optics_id = ?',
      [user.id, opticsId]
    );

    const sectionsVisibleStr = typeof sections_visible === 'string' 
      ? sections_visible 
      : JSON.stringify(sections_visible);

    if (existing) {
      await runQuery(
        `UPDATE dashboard_config 
         SET sections_visible = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND optics_id = ?`,
        [sectionsVisibleStr, user.id, opticsId]
      );
    } else {
      await runQuery(
        `INSERT INTO dashboard_config (user_id, optics_id, sections_visible)
         VALUES (?, ?, ?)`,
        [user.id, opticsId, sectionsVisibleStr]
      );
    }

    const config = await getRow<DashboardConfig>(
      'SELECT * FROM dashboard_config WHERE user_id = ? AND optics_id = ?',
      [user.id, opticsId]
    );

    res.json(config);
  } catch (error: any) {
    console.error('Error al actualizar configuración del dashboard:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

