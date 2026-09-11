import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import { SkeletonStats, SkeletonLine } from '../components/Skeleton';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboard';
import { suppliersService } from '../services/suppliers';
import { DashboardStats } from '../types';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CubeIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  TruckIcon,
  ArrowUpTrayIcon,
  UserPlusIcon,
  ShoppingCartIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  XMarkIcon,
  SparklesIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';
import { useCurrency } from '../contexts/CurrencyContext';

const ONBOARDING_HIDDEN_KEY = 'opticapp.onboarding.compact.hidden';

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  to: string;
  actionLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  /** `null` = no tenemos el dato para saber si está hecho (paso solo sugerido). */
  done: boolean | null;
  secondary?: { to: string; label: string };
}

const DashboardPage: React.FC = () => {
  const { sections } = useDashboardConfig();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // `null` mientras no lo sepamos: /dashboard/stats NO devuelve cantidad de proveedores.
  const [supplierCount, setSupplierCount] = useState<number | null>(null);
  const [compactHidden, setCompactHidden] = useState(
    () => localStorage.getItem(ONBOARDING_HIDDEN_KEY) === '1'
  );

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const s = await dashboardService.getStats();
      setStats(s);

      // Solo pedimos proveedores si todavía queda algún paso de onboarding pendiente,
      // así una óptica en marcha no paga un request extra en cada carga del dashboard.
      if (s.totalProducts === 0 || s.totalClients === 0 || s.totalSales === 0) {
        try {
          const list = await suppliersService.getAll();
          setSupplierCount(list.length);
        } catch {
          setSupplierCount(null); // sin dato: el paso queda como sugerencia, sin estado
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || t('Error al cargar estadísticas', 'Could not load statistics');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const { fmt } = useCurrency();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
  const fmtInt = (n: number) => Math.round(n).toLocaleString(locale);

  const today = new Date().toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const pageHeader = (
    <PageHeader
      eyebrow={today}
      title="Dashboard"
      subtitle={user?.username
        ? t(`Hola, ${user.username}. Este es el resumen de tu negocio.`, `Hi, ${user.username}. Here’s your business at a glance.`)
        : t('Resumen de tu negocio', 'Your business at a glance')}
    />
  );

  if (loading) return (
    <Layout>
      <div className="fade-in">
        {pageHeader}
        <div className="stats-grid">
          <SkeletonStats count={4} />
        </div>
        <div className="panels-grid">
          {[0, 1].map(i => (
            <div key={i} className="card" style={{ overflow: 'hidden' }} aria-hidden="true">
              <div className="panel-head">
                <SkeletonLine width="45%" height={14} />
              </div>
              <div style={{ padding: '1rem 1.35rem', display: 'grid', gap: '1.125rem' }}>
                {[0, 1, 2, 3, 4].map(r => (
                  <SkeletonLine key={r} width={r % 2 === 0 ? '85%' : '65%'} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      {pageHeader}
      <div role="alert" className="alert alert-danger">
        <ExclamationCircleIcon />
        <span>{error}</span>
      </div>
    </Layout>
  );

  if (!stats) return (
    <Layout>
      <EmptyState
        icon={<ChartBarIcon />}
        title={t('No hay datos disponibles', 'No data available')}
        description={t(
          'No pudimos armar el resumen de tu negocio. Probá recargar en unos segundos.',
          'We couldn’t build your business summary. Try reloading in a few seconds.',
        )}
        actionLabel={t('Reintentar', 'Try again')}
        onAction={loadData}
      />
    </Layout>
  );

  const steps: OnboardingStep[] = [
    {
      key: 'suppliers',
      title: t('Cargá tus proveedores', 'Add your suppliers'),
      description: t(
        'Empezá por las ópticas y distribuidoras que te venden los armazones.',
        'Start with the labs and distributors that sell you your frames.',
      ),
      to: '/suppliers',
      actionLabel: t('Ir a proveedores', 'Go to suppliers'),
      icon: TruckIcon,
      done: supplierCount === null ? null : supplierCount > 0,
    },
    {
      key: 'products',
      title: t('Cargá tu catálogo de armazones', 'Load your frames catalog'),
      description: t(
        'Importá el Excel del proveedor y se crean todos los artículos de una.',
        'Import your supplier’s Excel file and every item is created at once.',
      ),
      to: '/import',
      actionLabel: t('Importar Excel', 'Import Excel'),
      icon: ArrowUpTrayIcon,
      done: stats.totalProducts > 0,
      secondary: { to: '/products', label: t('o cargalos a mano', 'or add them manually') },
    },
    {
      key: 'clients',
      title: t('Registrá tus clientes', 'Register your clients'),
      description: t(
        'Guardá sus datos y su receta para tenerlos a mano en cada venta.',
        'Save their details and prescription to have them at hand on every sale.',
      ),
      to: '/clients',
      actionLabel: t('Ir a clientes', 'Go to clients'),
      icon: UserPlusIcon,
      done: stats.totalClients > 0,
    },
    {
      key: 'sales',
      title: t('Registrá tu primera venta', 'Record your first sale'),
      description: t(
        'Al cargar ventas el dashboard empieza a mostrar ingresos y ranking de productos.',
        'Once you record sales, the dashboard starts showing revenue and product rankings.',
      ),
      to: '/sales',
      actionLabel: t('Ir a ventas', 'Go to sales'),
      icon: ShoppingCartIcon,
      done: stats.totalSales > 0,
    },
  ];

  const isNewOptics = stats.totalProducts === 0 && stats.totalClients === 0 && stats.totalSales === 0;
  const pendingSteps = steps.filter(s => s.done !== true);
  const completedCount = steps.filter(s => s.done === true).length;
  // El primer paso pendiente es el que destacamos; los que no tienen dato (proveedores)
  // no bloquean: si no sabemos, igual lo proponemos primero por ser el orden natural.
  const nextStepKey = pendingSteps[0]?.key;

  const hideCompact = () => {
    setCompactHidden(true);
    localStorage.setItem(ONBOARDING_HIDDEN_KEY, '1');
  };

  const onboardingPanel = (
    <section className="panel" aria-labelledby="onboarding-title" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
      <div className="onboarding-head">
        <div className="onboarding-mark"><SparklesIcon /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="onboarding-title" className="onboarding-title">{t('Primeros pasos', 'Getting started')}</h2>
          <p className="onboarding-text">
            {t(
              'Tu óptica todavía no tiene datos cargados. Seguí estos pasos y el dashboard se llena solo.',
              'Your store has no data yet. Follow these steps and the dashboard fills itself in.',
            )}
          </p>
          <div className="onboarding-progress" aria-hidden="true">
            <span style={{ width: `${(completedCount / steps.length) * 100}%` }} />
          </div>
          <p className="onboarding-count">
            {t(`${completedCount} de ${steps.length} completados`, `${completedCount} of ${steps.length} completed`)}
          </p>
        </div>
      </div>

      <ol className="steps">
        {steps.map((step, i) => {
          const done = step.done === true;
          const isNext = !done && step.key === nextStepKey;
          const Icon = step.icon;
          return (
            <li key={step.key} className={`step${isNext ? ' is-next' : ''}${done ? ' is-done' : ''}`}>
              <div className="step-icon" aria-hidden="true">
                {done ? <CheckCircleIcon /> : <Icon />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="step-title">
                  <span className="step-index">{i + 1}.</span>
                  {step.title}
                  {done && <span className="badge badge-green">{t('Hecho', 'Done')}</span>}
                </p>
                <p className="step-desc">{step.description}</p>
                {!done && (
                  <div className="step-actions">
                    <Link className={isNext ? 'btn btn-cta btn-sm' : 'btn btn-ghost btn-sm'} to={step.to}>
                      {step.actionLabel}
                      <ArrowRightIcon className="w-3.5 h-3.5" />
                    </Link>
                    {step.secondary && (
                      <Link to={step.secondary.to} className="text-link">{step.secondary.label}</Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {supplierCount === null && (
        <p className="hint" style={{ marginTop: '1rem' }}>
          {t(
            'No pudimos verificar si ya cargaste proveedores; si ya los tenés, seguí con el paso 2.',
            'We couldn’t check whether you already added suppliers; if you did, continue with step 2.',
          )}
        </p>
      )}
    </section>
  );

  const pendingCount = pendingSteps.length;
  const compactChecklist = (
    <section className="card pending-strip" aria-label={t('Pasos pendientes de configuración', 'Pending setup steps')}>
      <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        {t(
          `Te ${pendingCount === 1 ? 'falta' : 'faltan'} ${pendingCount} ${pendingCount === 1 ? 'paso' : 'pasos'} para terminar de configurar tu óptica:`,
          `${pendingCount} ${pendingCount === 1 ? 'step' : 'steps'} left to finish setting up your store:`,
        )}
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', flex: 1 }}>
        {pendingSteps.map(step => (
          <Link key={step.key} to={step.to} className="pending-link">{step.title}</Link>
        ))}
      </span>
      <button
        type="button"
        className="btn-icon sm"
        onClick={hideCompact}
        aria-label={t('Ocultar los pasos pendientes', 'Hide pending steps')}
      >
        <XMarkIcon />
      </button>
    </section>
  );

  const trend = <ArrowTrendingUpIcon />;

  return (
    <Layout>
      <div className="fade-in">
        {pageHeader}

        {/* Onboarding: panel completo para una óptica recién creada, tira compacta mientras
            quede algo pendiente, y nada cuando ya está todo configurado. */}
        {isNewOptics
          ? onboardingPanel
          : pendingSteps.length > 0 && !compactHidden
            ? compactChecklist
            : null}

        {/* Indicadores — se ocultan mientras la óptica está vacía: mostrar cuatro ceros
            no aporta nada y le saca protagonismo al panel de primeros pasos. */}
        {!isNewOptics && (sections.totalSales || sections.totalRevenue || sections.totalClients || sections.totalProducts) && (
          <div className="stats-grid">
            {sections.totalSales && (
              <StatCard
                label={t('Total ventas', 'Total sales')}
                value={fmtInt(stats.totalSales)}
                countTo={stats.totalSales}
                format={fmtInt}
                sub={<>{trend}{t(`${stats.monthSales} este mes`, `${stats.monthSales} this month`)}</>}
                subTone="success"
                icon={ShoppingBagIcon}
              />
            )}
            {sections.totalRevenue && (
              <StatCard
                label={t('Total ingresos', 'Total revenue')}
                value={fmt(Number(stats.totalRevenue) || 0)}
                countTo={Number(stats.totalRevenue) || 0}
                format={fmt}
                sub={<>{trend}{t(`${fmt(Number(stats.monthRevenue) || 0)} este mes`, `${fmt(Number(stats.monthRevenue) || 0)} this month`)}</>}
                subTone="success"
                icon={CurrencyDollarIcon}
                tone="success"
              />
            )}
            {sections.totalClients && (
              <StatCard
                label={t('Clientes', 'Clients')}
                value={fmtInt(stats.totalClients)}
                countTo={stats.totalClients}
                format={fmtInt}
                sub={t('clientes activos', 'active clients')}
                icon={UserGroupIcon}
                tone="indigo"
              />
            )}
            {sections.totalProducts && (
              <StatCard
                label={t('Productos', 'Products')}
                value={fmtInt(stats.totalProducts)}
                countTo={stats.totalProducts}
                format={fmtInt}
                sub={t('en catálogo', 'in catalog')}
                icon={CubeIcon}
                tone="warning"
              />
            )}
          </div>
        )}

        {/* Paneles */}
        {!isNewOptics && (sections.topProducts || sections.recentSales) && (
          <div className="panels-grid">
            {sections.topProducts && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="panel-head">
                  <span className="panel-icon"><ChartBarIcon /></span>
                  <h2 className="panel-title">{t('Productos más vendidos', 'Best-selling products')}</h2>
                </div>
                <div className="list">
                  {stats.topProducts && stats.topProducts.length > 0 ? stats.topProducts.map((p, i) => (
                    <div key={p.id} className="list-row">
                      <span className="rank">{i + 1}</span>
                      <div className="list-main">
                        <p className="list-title">{p.name}</p>
                        <p className="list-sub">{t(`${p.total_quantity_sold} unidades vendidas`, `${p.total_quantity_sold} units sold`)}</p>
                      </div>
                      <span className="amount">{fmt(Number(p.total_revenue) || 0)}</span>
                    </div>
                  )) : (
                    <EmptyState
                      icon={<ChartBarIcon />}
                      title={t('Todavía no hay ranking de productos', 'No product ranking yet')}
                      description={
                        stats.totalProducts === 0
                          ? t('Cargá tu catálogo de armazones y el ranking se arma con las ventas.', 'Load your frames catalog and the ranking builds up with your sales.')
                          : t('En cuanto registres ventas vas a ver acá los armazones que más salen.', 'As soon as you record sales you’ll see your best-selling frames here.')
                      }
                      actionLabel={stats.totalProducts === 0 ? t('Importar catálogo', 'Import catalog') : t('Registrar una venta', 'Record a sale')}
                      onAction={() => navigate(stats.totalProducts === 0 ? '/import' : '/sales')}
                    />
                  )}
                </div>
              </div>
            )}

            {sections.recentSales && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div className="panel-head">
                  <span className="panel-icon" style={{ background: 'color-mix(in srgb, var(--success) 13%, transparent)', color: 'var(--success-text)' }}>
                    <CalendarDaysIcon />
                  </span>
                  <h2 className="panel-title">{t('Ventas recientes', 'Recent sales')}</h2>
                </div>
                <div className="list">
                  {stats.recentSales && stats.recentSales.length > 0 ? stats.recentSales.map(sale => (
                    <div key={sale.id} className="list-row">
                      <span className="avatar" style={{ '--tone': 'var(--success)' } as React.CSSProperties}>
                        {(sale.client_name || 'C').charAt(0).toUpperCase()}
                      </span>
                      <div className="list-main">
                        <p className="list-title">{sale.client_name || t('Cliente', 'Client')}</p>
                        <p className="list-sub">{fmtDate(sale.sale_date)}</p>
                      </div>
                      <span className="amount is-success">{fmt(Number(sale.total_price) || 0)}</span>
                    </div>
                  )) : (
                    <EmptyState
                      icon={<CalendarDaysIcon />}
                      title={t('Todavía no hay ventas recientes', 'No recent sales yet')}
                      description={
                        stats.totalClients === 0
                          ? t('Registrá primero un cliente y después vas a poder cargar la venta.', 'Register a client first, then you’ll be able to record the sale.')
                          : t('Cuando cargues una venta va a aparecer acá, con el cliente y el importe.', 'When you record a sale it will show up here, with the client and the amount.')
                      }
                      actionLabel={stats.totalClients === 0 ? t('Cargar un cliente', 'Add a client') : t('Registrar una venta', 'Record a sale')}
                      onAction={() => navigate(stats.totalClients === 0 ? '/clients' : '/sales')}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
