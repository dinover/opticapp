import express, { Response } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { authenticateToken, AuthRequest, getOpticsScope } from '../middleware/auth';
import { getDatabase, getRow } from '../config/database';
import { Supplier } from '../types';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/import/products - Importar armazones desde Excel
router.post('/products', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Usuario no autenticado' });
    if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo' });

    const opticsId = (user.role === 'admin' && req.body.optics_id)
      ? parseInt(req.body.optics_id)
      : getOpticsScope(user);

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
    const precioKey   = Object.keys(firstRow).find(k => k.toLowerCase().trim() === 'precio' || k.toLowerCase().trim() === 'price');

    if (!articuloKey) {
      return res.status(400).json({
        error: 'El archivo debe tener una columna "articulo" (o "artículo" o "nombre")',
        columnasEncontradas: Object.keys(firstRow),
      });
    }

    let created = 0;
    let updated = 0;
    let skipped = 0;
    let sinPrecio = 0;
    const errors: string[] = [];

    // Decisión de producto: usamos SAVEPOINTs por fila dentro de una única
    // transacción, para preservar el comportamiento actual de "una fila con
    // datos inválidos se loguea como error y no aborta el resto de la
    // importación", pero ahora con atomicidad real ante fallas de conexión/DB
    // (esas sí hacen ROLLBACK completo) y sin dejar importaciones parciales
    // colgadas si el proceso se corta a mitad de camino.
    const pool = getDatabase();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const name = String(row[articuloKey] || '').trim();
        if (!name) { skipped++; continue; }

        const quantity = cantidadKey ? parseInt(String(row[cantidadKey] || '0')) || 0 : 0;
        const rawPrice = precioKey ? parseFloat(String(row[precioKey] || '').replace(',', '.')) : NaN;
        const price    = !isNaN(rawPrice) && rawPrice > 0 ? rawPrice : 0;
        if (price === 0) sinPrecio++;

        await client.query(`SAVEPOINT sp_row`);
        try {
          // Dedupe: mismo nombre (case-insensitive) y mismo proveedor dentro
          // de la misma óptica -> se actualiza cantidad y precio en vez de
          // crear un duplicado (útil para reimportar listas de stock/precios
          // actualizadas del mismo proveedor).
          const existing = await client.query(
            `SELECT id FROM products
             WHERE optics_id = $1
               AND name ILIKE $2
               AND (supplier_id = $3 OR (supplier_id IS NULL AND $3::int IS NULL))
             LIMIT 1`,
            [opticsId, name, supplierId]
          );

          if (existing.rows.length > 0) {
            await client.query(
              `UPDATE products SET quantity = $1, price = $2 WHERE id = $3`,
              [quantity, price, existing.rows[0].id]
            );
            updated++;
          } else {
            await client.query(
              `INSERT INTO products (optics_id, supplier_id, name, quantity, price)
               VALUES ($1, $2, $3, $4, $5)`,
              [opticsId, supplierId, name, quantity, price]
            );
            created++;
          }
          await client.query(`RELEASE SAVEPOINT sp_row`);
        } catch (err) {
          await client.query(`ROLLBACK TO SAVEPOINT sp_row`);
          await client.query(`RELEASE SAVEPOINT sp_row`);
          errors.push(`Fila ${i + 2}: ${name} — error al insertar`);
        }
      }

      await client.query('COMMIT');
    } catch (txError) {
      await client.query('ROLLBACK');
      throw txError;
    } finally {
      client.release();
    }

    const parts = [`${created} armazón${created !== 1 ? 'es' : ''} creado${created !== 1 ? 's' : ''}`];
    if (updated > 0)   parts.push(`${updated} actualizado${updated !== 1 ? 's' : ''}`);
    if (skipped > 0)   parts.push(`${skipped} fila${skipped !== 1 ? 's' : ''} vacía${skipped !== 1 ? 's' : ''} omitida${skipped !== 1 ? 's' : ''}`);
    if (sinPrecio > 0) parts.push(`${sinPrecio} sin precio`);

    res.json({
      message: `Importación completada: ${parts.join(', ')}.`,
      created,
      updated,
      skipped,
      sinPrecio,
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
