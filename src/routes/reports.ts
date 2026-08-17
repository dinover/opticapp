import express, { Response } from 'express';
import * as XLSX from 'xlsx';
import { authenticateToken, AuthRequest, getOpticsScope } from '../middleware/auth';
import { getRow, getRows } from '../config/database';

const router = express.Router();

// GET /api/reports/products?supplier_id=X — Descargar Excel de armazones disponibles
router.get('/products', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const opticsId = getOpticsScope(user);
    const supplierIdParam = req.query.supplier_id as string | undefined;

    let query = `
      SELECT p.id, p.name, p.quantity, p.price, p.description,
             s.name AS supplier_name
      FROM products p
      LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.is_active = 1
      WHERE p.is_active = 1
    `;
    const params: any[] = [];

    if (opticsId !== null) {
      query += ' AND p.optics_id = ?';
      params.push(opticsId);
    }

    if (supplierIdParam && supplierIdParam !== 'all') {
      if (supplierIdParam === 'none') {
        query += ' AND p.supplier_id IS NULL';
      } else {
        query += ' AND p.supplier_id = ?';
        params.push(parseInt(supplierIdParam));
      }
    }

    query += ' ORDER BY s.name ASC NULLS LAST, p.name ASC';

    const products = await getRows<any>(query, params);

    // Construir Excel
    const data = products.map(p => ({
      'Artículo': p.name,
      'Cantidad': p.quantity ?? 0,
      'Precio': p.price ?? 0,
      'Descripción': p.description || '',
      'Proveedor': p.supplier_name || 'Óptica (sin proveedor)',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    // Ajustar anchos de columna
    worksheet['!cols'] = [
      { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 30 }, { wch: 30 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Armazones');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    const filename = supplierIdParam && supplierIdParam !== 'all'
      ? `armazones_proveedor_${supplierIdParam}.xlsx`
      : 'armazones_todos.xlsx';

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar reporte:', error);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

type GroupBy = 'day' | 'week' | 'month';

/** Rango por defecto cuando no se pasan fechas: últimos 30 días, incluyendo hoy. */
function resolveDateRange(fromParam: unknown, toParam: unknown): { from: string; toExclusive: string } {
  const to = typeof toParam === 'string' && toParam ? new Date(toParam) : new Date();
  const from = typeof fromParam === 'string' && fromParam
    ? new Date(fromParam)
    : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);

  // "to" es inclusivo para quien arma el request (filtra hasta ese día), pero la
  // query necesita un límite exclusivo para no perderse las ventas de ese día.
  const toExclusive = new Date(to);
  toExclusive.setDate(toExclusive.getDate() + 1);

  return { from: from.toISOString().slice(0, 10), toExclusive: toExclusive.toISOString().slice(0, 10) };
}

const GROUP_LABELS: Record<GroupBy, string> = { day: 'Día', week: 'Semana', month: 'Mes' };

function formatPeriodLabel(period: string, groupBy: GroupBy): string {
  const d = new Date(period);
  if (groupBy === 'month') return d.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  if (groupBy === 'week') return `Semana del ${d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit' })}`;
  return d.toLocaleDateString('es-UY', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// GET /api/reports/sales?from=&to=&group_by=day|week|month&format=json|xlsx
// Ventas agregadas por período: format=json para verlo en pantalla (default), format=xlsx para descargarlo.
router.get('/sales', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const opticsId = getOpticsScope(user);
    const groupBy: GroupBy = ['day', 'week', 'month'].includes(req.query.group_by as string)
      ? (req.query.group_by as GroupBy)
      : 'day';
    const { from, toExclusive } = resolveDateRange(req.query.from, req.query.to);
    const wantsXlsx = req.query.format === 'xlsx';

    let query = `
      SELECT date_trunc(?, sale_date) AS period,
             COUNT(*) AS sales_count,
             COALESCE(SUM(total_price), 0) AS revenue
      FROM sales
      WHERE is_active = 1 AND sale_date >= ? AND sale_date < ?
    `;
    const params: any[] = [groupBy, from, toExclusive];

    if (opticsId !== null) {
      query += ' AND optics_id = ?';
      params.push(opticsId);
    }

    query += ' GROUP BY period ORDER BY period ASC';

    const rows = await getRows<{ period: string; sales_count: string; revenue: string }>(query, params);

    const periods = rows.map(r => ({
      label: formatPeriodLabel(r.period, groupBy),
      salesCount: Number(r.sales_count),
      revenue: Number(r.revenue),
    }));

    if (!wantsXlsx) {
      const totalRevenue = periods.reduce((sum, p) => sum + p.revenue, 0);
      const totalSales = periods.reduce((sum, p) => sum + p.salesCount, 0);
      return res.json({
        groupBy,
        periods,
        totalRevenue,
        totalSales,
        avgTicket: totalSales > 0 ? totalRevenue / totalSales : 0,
      });
    }

    const data = periods.map(p => ({
      [GROUP_LABELS[groupBy]]: p.label,
      'Cantidad de ventas': p.salesCount,
      'Facturación': p.revenue,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 16 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas por período');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ventas_${groupBy}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar reporte de ventas:', error);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

// GET /api/reports/top-products?from=&to=&limit=&format=json|xlsx
// Ranking de productos vendidos: format=json para verlo en pantalla (default), format=xlsx para descargarlo.
router.get('/top-products', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const opticsId = getOpticsScope(user);
    const { from, toExclusive } = resolveDateRange(req.query.from, req.query.to);
    const limitParam = parseInt(req.query.limit as string);
    const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 20;
    const wantsXlsx = req.query.format === 'xlsx';

    let query = `
      SELECT p.id, p.name,
             s.name AS supplier_name,
             COALESCE(SUM(sp.quantity), 0) AS quantity_sold,
             COALESCE(SUM(sp.total_price), 0) AS revenue
      FROM sale_products sp
      JOIN sales sa ON sa.id = sp.sale_id AND sa.is_active = 1 AND sa.sale_date >= ? AND sa.sale_date < ?
      JOIN products p ON p.id = sp.product_id
      LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.is_active = 1
      WHERE 1=1
    `;
    const params: any[] = [from, toExclusive];

    if (opticsId !== null) {
      query += ' AND p.optics_id = ?';
      params.push(opticsId);
    }

    query += ' GROUP BY p.id, p.name, s.name ORDER BY quantity_sold DESC LIMIT ?';
    params.push(limit);

    const rows = await getRows<any>(query, params);
    const totalRevenue = rows.reduce((sum, r) => sum + Number(r.revenue), 0);

    const products = rows.map((r, i) => ({
      rank: i + 1,
      id: r.id,
      name: r.name,
      supplierName: r.supplier_name || 'Sin proveedor',
      quantitySold: Number(r.quantity_sold),
      revenue: Number(r.revenue),
      revenueShare: totalRevenue > 0 ? Number(r.revenue) / totalRevenue : 0,
    }));

    if (!wantsXlsx) {
      return res.json({ totalRevenue, products });
    }

    const data = products.map(p => ({
      '#': p.rank,
      'Artículo': p.name,
      'Proveedor': p.supplierName,
      'Unidades vendidas': p.quantitySold,
      'Facturación': p.revenue,
      '% del total': `${(p.revenueShare * 100).toFixed(1)}%`,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    worksheet['!cols'] = [{ wch: 4 }, { wch: 36 }, { wch: 26 }, { wch: 16 }, { wch: 14 }, { wch: 12 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ranking productos');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ranking_productos.xlsx"');
    res.send(buffer);
  } catch (error) {
    console.error('Error al generar ranking de productos:', error);
    res.status(500).json({ error: 'Error al generar el reporte' });
  }
});

export default router;
