import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { SkeletonLine } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import { suppliersService } from '../services/suppliers';
import { reportsService, SalesReport, TopProductsReport } from '../services/reports';
import { Supplier } from '../types';
import {
  ArrowDownTrayIcon,
  CheckIcon,
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
  const { t } = useLanguage();
  const [previewing, setPreviewing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handlePreview = async () => {
    if (!onPreview || previewing) return;
    try {
      setPreviewing(true);
      await onPreview();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al generar el reporte', 'Could not generate the report'));
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
      toast.success(t('Reporte descargado', 'Report downloaded'));
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al generar el reporte', 'Could not generate the report'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="card" style={{ padding: '1.6rem' }}>
      <div className="report-head">
        <div className="report-icon">{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="report-title">{title}</h2>
          <p className="report-desc">{description}</p>
        </div>
      </div>

      {children && <div className="report-filters">{children}</div>}

      <div className="report-actions">
        {onPreview && (
          <button
            className="btn btn-ghost"
            onClick={handlePreview}
            disabled={previewing}
            aria-busy={previewing}
          >
            {previewing ? (
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} aria-hidden="true" />
            ) : (
              <EyeIcon className="w-4 h-4" aria-hidden="true" />
            )}
            {t('Ver reporte', 'View report')}
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={handleDownload}
          disabled={downloading}
          aria-busy={downloading}
        >
          {downloading ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff' }} aria-hidden="true" />
              {t('Generando…', 'Generating…')}
            </>
          ) : downloaded ? (
            <>
              <CheckIcon className="w-4 h-4" aria-hidden="true" />
              {t('Descargado', 'Downloaded')}
            </>
          ) : (
            <>
              <ArrowDownTrayIcon className="w-4 h-4" aria-hidden="true" />
              {t('Descargar Excel', 'Download Excel')}
            </>
          )}
        </button>
      </div>

      {preview && <div className="report-preview">{preview}</div>}
    </section>
  );
};

const StatTile: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="stat-tile">
    <p className="stat-tile-label">{label}</p>
    <p className="stat-tile-value">{value}</p>
  </div>
);

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { fmt } = useCurrency();
  const { t, lang } = useLanguage();

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
        toast.error(err.response?.data?.error || t('No pudimos cargar la lista de proveedores', 'We couldn’t load the suppliers list'));
      })
      .finally(() => setLoadingSuppliers(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Las vistas previas traen textos armados por el backend en el idioma del
  // momento (etiquetas de período, "Sin proveedor"): al cambiar de idioma se descartan.
  useEffect(() => {
    setSalesReport(null);
    setTopReport(null);
  }, [lang]);

  const noSuppliers = !loadingSuppliers && suppliers.length === 0;
  const allSuppliersLabel = t('Todos los proveedores', 'All suppliers');
  const noSupplierLabel = t('Sin proveedor (óptica)', 'No supplier (store)');
  const selectedSupplierLabel = supplierId === 'all'
    ? allSuppliersLabel
    : supplierId === 'none'
      ? noSupplierLabel
      : suppliers.find(s => String(s.id) === supplierId)?.name || '';

  const maxPeriodRevenue = salesReport ? Math.max(1, ...salesReport.periods.map(p => p.revenue)) : 1;
  const noSalesInRange = (
    <p className="cell-muted" style={{ margin: 0, fontSize: '.85rem', textAlign: 'center' }}>
      {t('No hay ventas en ese rango de fechas.', 'There are no sales in that date range.')}
    </p>
  );

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: 680, margin: '0 auto' }}>
        <PageHeader
          eyebrow={t('Análisis', 'Insights')}
          title={t('Reportes', 'Reports')}
          subtitle={t('Mirá o descargá información de tu óptica en Excel', 'View or download your store’s data in Excel')}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Ventas por período */}
          <ReportCard
            icon={<ChartBarIcon />}
            title={t('Ventas por período', 'Sales by period')}
            description={t(
              'Facturación y cantidad de ventas agrupadas por día, semana o mes.',
              'Revenue and number of sales grouped by day, week or month.',
            )}
            onPreview={async () => setSalesReport(await reportsService.getSales(salesFrom, salesTo, groupBy))}
            onDownload={() => reportsService.downloadSales(salesFrom, salesTo, groupBy)}
            preview={salesReport && (
              salesReport.periods.length === 0 ? noSalesInRange : (
                <>
                  <div className="stat-tiles">
                    <StatTile label={t('Facturado', 'Revenue')} value={fmt(salesReport.totalRevenue)} />
                    <StatTile label={t('Ventas', 'Sales')} value={String(salesReport.totalSales)} />
                    <StatTile label={t('Ticket prom.', 'Avg. ticket')} value={fmt(salesReport.avgTicket)} />
                  </div>
                  <div className="period-list">
                    {salesReport.periods.map(p => (
                      <div key={p.label} className="period-row">
                        <span className="period-label">{p.label}</span>
                        <div className="period-track">
                          <div className="period-fill" style={{ width: `${Math.max(4, (p.revenue / maxPeriodRevenue) * 100)}%` }} />
                        </div>
                        <span className="period-value">{fmt(p.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )
            )}
          >
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="sales-from">{t('Desde', 'From')}</label>
                <input id="sales-from" type="date" value={salesFrom} max={salesTo} onChange={e => { setSalesFrom(e.target.value); setSalesReport(null); }} />
              </div>
              <div className="field">
                <label htmlFor="sales-to">{t('Hasta', 'To')}</label>
                <input id="sales-to" type="date" value={salesTo} min={salesFrom} max={today()} onChange={e => { setSalesTo(e.target.value); setSalesReport(null); }} />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="sales-group">{t('Agrupar por', 'Group by')}</label>
                <select
                  id="sales-group"
                  value={groupBy}
                  onChange={e => { setGroupBy(e.target.value as 'day' | 'week' | 'month'); setSalesReport(null); }}
                >
                  <option value="day">{t('Día', 'Day')}</option>
                  <option value="week">{t('Semana', 'Week')}</option>
                  <option value="month">{t('Mes', 'Month')}</option>
                </select>
              </div>
            </div>
          </ReportCard>

          {/* Ranking de productos */}
          <ReportCard
            icon={<TrophyIcon />}
            title={t('Ranking de productos vendidos', 'Best-selling products ranking')}
            description={t(
              'Los armazones más vendidos en el período, con unidades y % de la facturación.',
              'The best-selling frames in the period, with units and % of revenue.',
            )}
            onPreview={async () => setTopReport(await reportsService.getTopProducts(topFrom, topTo))}
            onDownload={() => reportsService.downloadTopProducts(topFrom, topTo)}
            preview={topReport && (
              topReport.products.length === 0 ? noSalesInRange : (
                <div className="table-scroll">
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>{t('Artículo', 'Item')}</th>
                        <th>{t('Proveedor', 'Supplier')}</th>
                        <th style={{ textAlign: 'right' }}>{t('Unidades', 'Units')}</th>
                        <th style={{ textAlign: 'right' }}>{t('Facturación', 'Revenue')}</th>
                        <th style={{ textAlign: 'right' }}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topReport.products.map(p => (
                        <tr key={p.id}>
                          <td><span className="rank">{p.rank}</span></td>
                          <td className="cell-strong">{p.name}</td>
                          <td className="cell-secondary">{p.supplierName}</td>
                          <td style={{ textAlign: 'right' }}>{p.quantitySold}</td>
                          <td style={{ textAlign: 'right' }}><span className="amount">{fmt(p.revenue)}</span></td>
                          <td className="cell-muted" style={{ textAlign: 'right' }}>{(p.revenueShare * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          >
            <div className="form-grid-2">
              <div className="field">
                <label htmlFor="top-from">{t('Desde', 'From')}</label>
                <input id="top-from" type="date" value={topFrom} max={topTo} onChange={e => { setTopFrom(e.target.value); setTopReport(null); }} />
              </div>
              <div className="field">
                <label htmlFor="top-to">{t('Hasta', 'To')}</label>
                <input id="top-to" type="date" value={topTo} min={topFrom} max={today()} onChange={e => { setTopTo(e.target.value); setTopReport(null); }} />
              </div>
            </div>
          </ReportCard>

          {/* Armazones disponibles */}
          <ReportCard
            icon={<TableCellsIcon />}
            title={t('Armazones disponibles', 'Available frames')}
            description={t('Stock actual con precio, cantidad y proveedor.', 'Current stock with price, quantity and supplier.')}
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
                title={t('Todavía no cargaste proveedores', 'You haven’t added suppliers yet')}
                description={t(
                  'Sin proveedores no hay nada por lo que filtrar, pero igual podés descargar el listado completo.',
                  'Without suppliers there’s nothing to filter by, but you can still download the full list.',
                )}
                actionLabel={t('Cargar proveedores', 'Add suppliers')}
                onAction={() => navigate('/suppliers')}
              />
            ) : (
              <div className="field">
                <label htmlFor="report-supplier">{t('Filtrar por proveedor', 'Filter by supplier')}</label>
                <select
                  id="report-supplier"
                  value={supplierId}
                  onChange={e => setSupplierId(e.target.value)}
                >
                  <option value="all">{allSuppliersLabel}</option>
                  <option value="none">{noSupplierLabel}</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                  ))}
                </select>
                <p className="hint">{selectedSupplierLabel}</p>
              </div>
            )}
          </ReportCard>

        </div>
      </div>
    </Layout>
  );
};

export default ReportsPage;
