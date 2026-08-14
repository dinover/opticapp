import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { suppliersService } from '../services/suppliers';
import { reportsService } from '../services/reports';
import { Supplier } from '../types';
import {
  ArrowDownTrayIcon,
  TableCellsIcon,
  TruckIcon,
} from '@heroicons/react/24/outline';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierId, setSupplierId] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    suppliersService.getAll()
      .then(setSuppliers)
      .catch((err: any) => {
        toast.error(err.response?.data?.error || 'No pudimos cargar la lista de proveedores');
      })
      .finally(() => setLoadingSuppliers(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = async () => {
    if (generating) return;
    try {
      setGenerating(true);
      setDownloaded(false);
      await reportsService.downloadProducts(supplierId);
      setDownloaded(true);
      toast.success('Reporte descargado');
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setGenerating(false);
    }
  };

  const selectedLabel = supplierId === 'all'
    ? 'Todos los proveedores'
    : supplierId === 'none'
      ? 'Sin proveedor (óptica)'
      : suppliers.find(s => String(s.id) === supplierId)?.name || '';

  const noSuppliers = !loadingSuppliers && suppliers.length === 0;

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
              <TableCellsIcon style={{ width: 30, height: 30, color: 'var(--brand)' }} />
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
              {loadingSuppliers ? (
                <>
                  <SkeletonLine width="45%" height={12} />
                  <div style={{ height: '.5rem' }} />
                  <SkeletonLine height={38} />
                </>
              ) : noSuppliers ? (
                <EmptyState
                  icon={<TruckIcon />}
                  title="Todavía no cargaste proveedores"
                  description="Sin proveedores no hay nada por lo que filtrar, pero igual podés descargar el listado completo."
                  actionLabel="Cargar proveedores"
                  onAction={() => navigate('/suppliers')}
                />
              ) : (
                <>
                  <label
                    htmlFor="report-supplier"
                    style={{ display: 'block', textAlign: 'left', fontWeight: 600, marginBottom: '.5rem', fontSize: '.875rem', color: 'var(--text-primary)' }}
                  >
                    Filtrar por proveedor
                  </label>
                  <select
                    id="report-supplier"
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
                </>
              )}
            </div>

            <div style={{ width: '100%', maxWidth: 380, background: 'var(--surface-3)', borderRadius: 'var(--radius)', padding: '.875rem 1rem', textAlign: 'left', fontSize: '.85rem', color: 'var(--text-secondary)' }}>
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
              disabled={generating}
              aria-busy={generating}
              style={{ minWidth: 220, padding: '.625rem 1.5rem', fontSize: '.95rem' }}
            >
              {generating ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
                  Generando…
                </>
              ) : downloaded ? (
                <>
                  ✓ Descargado
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
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
