import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { suppliersService } from '../services/suppliers';
import { reportsService, SalesReport, TopProductsReport } from '../services/reports';
import { Supplier } from '../types';
import {
  ArrowDownTrayIcon,
  EyeIcon,
  TableCellsIcon,
  TruckIcon,
  ChartBarIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

/** YYYY-MM-DD, para precargar los date pickers. */
const toDateInput = (d: Date) => d.toISOString().slice(0, 10);
const today = () => toDateInput(new Date());
const daysAgo = (n: number) => toDateInput(new Date(Date.now() - n * 24 * 60 * 60 * 1000));

const fieldLabelStyle: React.CSSProperties = {
  display: 'block', textAlign: 'left', fontWeight: 600, marginBottom: '.375rem', fontSize: '.8rem', color: 'var(--text-primary)',
};

/** Card base para cada reporte: ícono, título, descripción, filtros y acciones (ver / descargar). */
const ReportCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  onPreview?: () => Promise<void>;
  onDownload: () => Promise<void>;
  preview?: React.ReactNode;
}> = ({ icon, title, description, children, onPreview, onDownload, preview }) => {
  const toast = useToast();
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handlePreview = async () => {
    if (!onPreview || previewing) return;
    try {
      setPreviewing(true);
      await onPreview();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownload = async () => {
    if (downloading) return;
    try {
      setDownloading(true);
      setDownloaded(false);
      await onDownload();
      setDownloaded(true);
      toast.success('Reporte descargado');
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al generar el reporte');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="card" style={{ padding: '1.75rem' }}>
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12, flexShrink: 0,
          background: 'linear-gradient(135deg, #eef2ff, #ddd6fe)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{ margin: '0 0 .25rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
            {title}
          </h2>
          <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-secondary)' }}>
            {description}
          </p>
        </div>
      </div>

      {children && (
        <div style={{ marginTop: '1.25rem' }}>{children}</div>
      )}

      <div style={{ display: 'flex', gap: '.625rem', marginTop: '1.25rem' }}>
        {onPreview && (
          <button
            className="btn btn-ghost"
            onClick={handlePreview}
            disabled={previewing}
            aria-busy={previewing}
            style={{ flex: 1, justifyContent: 'center', padding: '.625rem 1rem', fontSize: '.9rem' }}
          >
            {previewing ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
            ) : (
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
            )}
            Ver reporte
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          aria-busy={downloading}
          style={{ flex: 1, justifyContent: 'center', padding: '.625rem 1rem', fontSize: '.9rem' }}
        >
          {downloading ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
              Generando…
            </>
          ) : downloaded ? (
            '✓ Descargado'
          ) : (
            <>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
              Descargar Excel
            </>
          )}
        </button>
      </div>

      {preview && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          {preview}
        </div>
      )}
    </div>
  );
};

const StatTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 10, padding: '.75rem .875rem', minWidth: 0 }}>
    <p style={{ margin: 0, fontSize: '.7rem', fontWeight: 700, letterSpacing: '.03em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
      {label}
    </p>
    <p style={{ margin: '.25rem 0 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {value}
    </p>
  </div>
);

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { fmt } = useCurrency();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingSuppliers, setLoadingSuppliers] = useState(true);
  const [supplierId, setSupplierId] = useState<string>('all');

  const [salesFrom, setSalesFrom] = useState(daysAgo(30));
  const [salesTo, setSalesTo] = useState(today());
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);

  const [topFrom, setTopFrom] = useState(daysAgo(30));
  const [topTo, setTopTo] = useState(today());
  const [topReport, setTopReport] = useState<TopProductsReport | null>(null);

  useEffect(() => {
    suppliersService.getAll()
      .then(setSuppliers)
      .catch((err: any) => {
        toast.error(err.response?.data?.error || 'No pudimos cargar la lista de proveedores');
      })
      .finally(() => setLoadingSuppliers(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const noSuppliers = !loadingSuppliers && suppliers.length === 0;
  const selectedSupplierLabel = supplierId === 'all'
    ? 'Todos los proveedores'
    : supplierId === 'none'
      ? 'Sin proveedor (óptica)'
      : suppliers.find(s => String(s.id) === supplierId)?.name || '';

  const maxPeriodRevenue = salesReport ? Math.max(1, ...salesReport.periods.map(p => p.revenue)) : 1;

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="page-header">
          <div>
            <h1 className="page-title">Reportes</h1>
            <p className="page-subtitle">Mirá o descargá información de tu óptica en Excel</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Ventas por período */}
          <ReportCard
            icon={<ChartBarIcon style={{ width: 22, height: 22, color: 'var(--brand)' }} />}
            title="Ventas por período"
            description="Facturación y cantidad de ventas agrupadas por día, semana o mes."
            onPreview={async () => setSalesReport(await reportsService.getSales(salesFrom, salesTo, groupBy))}
            onDownload={() => reportsService.downloadSales(salesFrom, salesTo, groupBy)}
            preview={salesReport && (
              salesReport.periods.length === 0 ? (
                <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No hay ventas en ese rango de fechas.
                </p>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '.625rem', marginBottom: '1rem' }}>
                    <StatTile label="Facturado" value={fmt(salesReport.totalRevenue)} />
                    <StatTile label="Ventas" value={String(salesReport.totalSales)} />
                    <StatTile label="Ticket prom." value={fmt(salesReport.avgTicket)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                    {salesReport.periods.map(p => (
                      <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                        <span style={{ width: 110, flexShrink: 0, fontSize: '.78rem', color: 'var(--text-secondary)' }}>
                          {p.label}
                        </span>
                        <div style={{ flex: 1, background: 'var(--surface-2)', borderRadius: 6, overflow: 'hidden', height: 20 }}>
                          <div style={{
                            width: `${Math.max(4, (p.revenue / maxPeriodRevenue) * 100)}%`, height: '100%',
                            background: 'var(--brand)', opacity: .8, borderRadius: 6,
                          }} />
                        </div>
                        <span style={{ width: 90, flexShrink: 0, textAlign: 'right', fontSize: '.8rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace' }}>
                          {fmt(p.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div>
                <label htmlFor="sales-from" style={fieldLabelStyle}>Desde</label>
                <input id="sales-from" type="date" value={salesFrom} max={salesTo} onChange={e => { setSalesFrom(e.target.value); setSalesReport(null); }} />
              </div>
              <div>
                <label htmlFor="sales-to" style={fieldLabelStyle}>Hasta</label>
                <input id="sales-to" type="date" value={salesTo} min={salesFrom} max={today()} onChange={e => { setSalesTo(e.target.value); setSalesReport(null); }} />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="sales-group" style={fieldLabelStyle}>Agrupar por</label>
                <select
                  id="sales-group"
                  value={groupBy}
                  onChange={e => { setGroupBy(e.target.value as 'day' | 'week' | 'month'); setSalesReport(null); }}
                >
                  <option value="day">Día</option>
                  <option value="week">Semana</option>
                  <option value="month">Mes</option>
                </select>
              </div>
            </div>
          </ReportCard>

          {/* Ranking de productos */}
          <ReportCard
            icon={<TrophyIcon style={{ width: 22, height: 22, color: 'var(--brand)' }} />}
            title="Ranking de productos vendidos"
            description="Los armazones más vendidos en el período, con unidades y % de la facturación."
            onPreview={async () => setTopReport(await reportsService.getTopProducts(topFrom, topTo))}
            onDownload={() => reportsService.downloadTopProducts(topFrom, topTo)}
            preview={topReport && (
              topReport.products.length === 0 ? (
                <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No hay ventas en ese rango de fechas.
                </p>
              ) : (
                <div className="table-scroll">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Artículo</th>
                        <th>Proveedor</th>
                        <th style={{ textAlign: 'right' }}>Unidades</th>
                        <th style={{ textAlign: 'right' }}>Facturación</th>
                        <th style={{ textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topReport.products.map(p => (
                        <tr key={p.id}>
                          <td style={{ color: 'var(--text-muted)' }}>{p.rank}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{p.supplierName}</td>
                          <td style={{ textAlign: 'right' }}>{p.quantitySold}</td>
                          <td style={{ textAlign: 'right', fontFamily: 'DM Mono, monospace' }}>{fmt(p.revenue)}</td>
                          <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{(p.revenueShare * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div>
                <label htmlFor="top-from" style={fieldLabelStyle}>Desde</label>
                <input id="top-from" type="date" value={topFrom} max={topTo} onChange={e => { setTopFrom(e.target.value); setTopReport(null); }} />
              </div>
              <div>
                <label htmlFor="top-to" style={fieldLabelStyle}>Hasta</label>
                <input id="top-to" type="date" value={topTo} min={topFrom} max={today()} onChange={e => { setTopTo(e.target.value); setTopReport(null); }} />
              </div>
            </div>
          </ReportCard>

          {/* Armazones disponibles */}
          <ReportCard
            icon={<TableCellsIcon style={{ width: 22, height: 22, color: 'var(--brand)' }} />}
            title="Armazones disponibles"
            description="Stock actual con precio, cantidad y proveedor."
            onDownload={() => reportsService.downloadProducts(supplierId)}
          >
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
              <div>
                <label htmlFor="report-supplier" style={fieldLabelStyle}>
                  Filtrar por proveedor
                </label>
                <select
                  id="report-supplier"
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                >
                  <option value="all">Todos los proveedores</option>
                  <option value="none">Sin proveedor (óptica)</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
                <p style={{ margin: '.5rem 0 0', fontSize: '.75rem', color: 'var(--text-muted)' }}>
                  {selectedSupplierLabel}
                </p>
              </div>
            )}
          </ReportCard>

        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
