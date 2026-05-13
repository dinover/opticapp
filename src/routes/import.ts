import express, { Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { getRow, getRows, runQuery } from '../config/database';
import { Supplier } from '../types';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function getUserOpticsId(userId: number, userRole: string): Promise<number | null> {
  if (userRole === 'admin') return null;
  const user = await getRow<{ optics_id: number | null }>('SELECT optics_id FROM users WHERE id = ?', [userId]);
  return user?.optics_id || null;
}

// POST /api/import/products - Importar armazones desde Excel
router.post('/products', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const opticsId = req.body.optics_id
      ? parseInt(req.body.optics_id)
      : await getUserOpticsId(user.id, user.role);

    if (!opticsId) return res.status(400).json({ error: 'No se pudo determinar la óptica' });

    const supplierId = req.body.supplier_id ? parseInt(req.body.supplier_id) : null;

    // Validar proveedor si se proporcionó
    if (supplierId) {
      const supplier = await getRow<Supplier>(
        'SELECT id FROM suppliers WHERE id = ? AND optics_id = ? AND is_active = 1',
        [supplierId, opticsId]
      );
      if (!supplier) return res.status(404).json({ error: 'Proveedor no encontrado' });
    }

    // Parsear Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length === 0) return res.status(400).json({ error: 'El archivo está vacío o no tiene datos' });

    // Detectar columnas (case-insensitive)
    const firstRow = rows[0];
    const headers = Object.keys(firstRow).map(k => k.toLowerCase().trim());
    const articuloKey = Object.keys(firstRow).find(k => k.toLowerCase().trim() === 'articulo' || k.toLowerCase().trim() === 'artículo' || k.toLowerCase().trim() === 'nombre');
    const cantidadKey = Object.keys(firstRow).find(k => k.toLowerCase().trim() === 'cantidad' || k.toLowerCase().trim() === 'stock' || k.toLowerCase().trim() === 'qty');

    if (!articuloKey) {
      return res.status(400).json({
        error: 'El archivo debe tener una columna "articulo" (o "artículo" o "nombre")',
        columnasEncontradas: Object.keys(firstRow),
      });
    }

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row[articuloKey] || '').trim();
      if (!name) { skipped++; continue; }

      const quantity = cantidadKey ? parseInt(String(row[cantidadKey] || '0')) || 0 : 0;

      try {
        await runQuery(
          `INSERT INTO products (optics_id, supplier_id, name, quantity, price)
           VALUES (?, ?, ?, ?, 0)`,
          [opticsId, supplierId, name, quantity]
        );
        created++;
      } catch (err) {
        errors.push(`Fila ${i + 2}: ${name} — error al insertar`);
      }
    }

    res.json({
      message: `Importación completada: ${created} armazones creados, ${skipped} filas vacías omitidas`,
      created,
      skipped,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error('Error al importar productos:', error);
    if (error.message?.includes('password')) {
      return res.status(400).json({ error: 'El archivo Excel está protegido con contraseña' });
    }
    res.status(500).json({ error: 'Error al procesar el archivo. Verifica que sea un archivo Excel válido (.xlsx o .xls)' });
  }
});

export default router;
