import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { suppliersService } from '../services/suppliers';
import { reportsService } from '../services/reports';
import { Supplier } from '../types';
import {
  ArrowDownTrayIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [supplierId, setSupplierId] = useState<string>('all');
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    suppliersService.getAll().then(setSuppliers).catch(() => {});
  }, []);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      setDownloaded(false);
      await reportsService.downloadProducts(supplierId);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  const selectedLabel = supplierId === 'all'
    ? 'Todos los proveedores'
    : supplierId === 'none'
      ? 'Sin proveedor (óptica)'
      : suppliers.find(s => String(s.id) === supplierId)?.name || '';

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Reportes</h1>
            <p className="page-subtitle">Descargá listados de armazones disponibles</p>
          </div>
        </div>

        <div className="card" style={{ padding: '2rem 2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem', textAlign: 'center' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'linear-gradient(135deg, #eef2ff, #ddd6fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TableCellsIcon style={{ width: 30, height: 30, color: '#4f46e5' }} />
            </div>

            <div>
              <h2 style={{ margin: '0 0 .375rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Armazones disponibles
              </h2>
              <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                Exporta el stock de armazones con precio, cantidad y proveedor en formato Excel.
              </p>
            </div>

            <div style={{ width: '100%', maxWidth: 380 }}>
              <label style={{ display: 'block', textAlign: 'left', fontWeight: 600, marginBottom: '.5rem', fontSize: '.875rem', color: 'var(--text-primary)' }}>
                Filtrar por proveedor
              </label>
              <select
                value={supplierId}
                onChange={e => { setSupplierId(e.target.value); setDownloaded(false); }}
                style={{ width: '100%' }}
              >
                <option value="all">Todos los proveedores</option>
                <option value="none">Sin proveedor (óptica)</option>
                {suppliers.map(s => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>

            <div style={{ width: '100%', maxWidth: 380, background: 'var(--surface-3)', borderRadius: 10, padding: '.875rem 1rem', textAlign: 'left', fontSize: '.85rem', color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--text-primary)' }}>Contenido del archivo:</strong>
              <ul style={{ margin: '.5rem 0 0', padding: '0 0 0 1.25rem', lineHeight: 1.8 }}>
                <li>Artículo (nombre del armazón)</li>
                <li>Cantidad en stock</li>
                <li>Precio</li>
                <li>Descripción</li>
                <li>Proveedor</li>
              </ul>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleDownload}
              disabled={downloading}
              style={{ minWidth: 220, padding: '.625rem 1.5rem', fontSize: '.95rem' }}
            >
              {downloading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Generando…
                </>
              ) : downloaded ? (
                <>
                  ✓ Descargado
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Descargar Excel · {selectedLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
