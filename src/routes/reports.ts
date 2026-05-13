import express, { Response } from 'express';
import * as XLSX from 'xlsx';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRow, getRows } from '../config/database';

const router = express.Router();

async function getUserOpticsId(userId: number, userRole: string): Promise<number | null> {
  if (userRole === 'admin') return null;
  const user = await getRow<{ optics_id: number | null }>('SELECT optics_id FROM users WHERE id = ?', [userId]);
  return user?.optics_id || null;
}

// GET /api/reports/products?supplier_id=X — Descargar Excel de armazones disponibles
router.get('/products', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });

    const opticsId = await getUserOpticsId(user.id, user.role);
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

export default router;
