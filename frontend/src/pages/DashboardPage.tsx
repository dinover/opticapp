import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import EmptyState from '../components/EmptyState';
import { SkeletonStats, SkeletonLine } from '../components/Skeleton';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { useToast } from '../contexts/ToastContext';
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
} from '@heroicons/react/24/outline';
import { useCurrency } from '../contexts/CurrencyContext';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

/** Tinte translúcido del color de acento: funciona en tema claro y oscuro. */
const tint = (color: string, pct = 14) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const ONBOARDING_HIDDEN_KEY = 'opticapp.onboarding.compact.hidden';

interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  to: string;
  actionLabel: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  /** `null` = no tenemos el dato para saber si está hecho (paso solo sugerido). */
  done: boolean | null;
  secondary?: { to: string; label: string };
}

const DashboardPage: React.FC = () => {
  const { sections } = useDashboardConfig();
  const navigate = useNavigate();
  const toast = useToast();
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
      const msg = err.response?.data?.error || 'Error al cargar estadísticas';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const { fmt } = useCurrency();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  const pageHeader = (
    <div className="page-header">
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen de tu negocio</p>
      </div>
    </div>
  );

  if (loading) return (
    <Layout>
      <div className="fade-in">
        {pageHeader}
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}
          className="sm:grid-cols-2 lg:grid-cols-4"
        >
          <SkeletonStats count={4} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="lg:grid-cols-2 sm:grid-cols-1">
          {[0, 1].map(i => (
            <div key={i} className="card" style={{ overflow: 'hidden' }} aria-hidden="true">
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                <SkeletonLine width="45%" height={14} />
              </div>
              <div style={{ padding: '1rem 1.5rem', display: 'grid', gap: '1.125rem' }}>
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
      <div
        role="alert"
        style={{
          background: tint('var(--danger)', 10),
          border: '1px solid var(--danger)',
          borderRadius: 'var(--radius)',
          padding: '1rem 1.25rem',
          color: 'var(--danger)',
          fontSize: '.875rem',
        }}
      >
        {error}
      </div>
    </Layout>
  );

  if (!stats) return (
    <Layout>
      <EmptyState
        icon={<ChartBarIcon />}
        title="No hay datos disponibles"
        description="No pudimos armar el resumen de tu negocio. Probá recargar en unos segundos."
        actionLabel="Reintentar"
        onAction={loadData}
      />
    </Layout>
  );

  const steps: OnboardingStep[] = [
    {
      key: 'suppliers',
      title: 'Cargá tus proveedores',
      description: 'Empezá por las ópticas y distribuidoras que te venden los armazones.',
      to: '/suppliers',
      actionLabel: 'Ir a proveedores',
      icon: TruckIcon,
      done: supplierCount === null ? null : supplierCount > 0,
    },
    {
      key: 'products',
      title: 'Cargá tu catálogo de armazones',
      description: 'Importá el Excel del proveedor y se crean todos los artículos de una.',
      to: '/import',
      actionLabel: 'Importar Excel',
      icon: ArrowUpTrayIcon,
      done: stats.totalProducts > 0,
      secondary: { to: '/products', label: 'o cargalos a mano' },
    },
    {
      key: 'clients',
      title: 'Registrá tus clientes',
      description: 'Guardá sus datos y su receta para tenerlos a mano en cada venta.',
      to: '/clients',
      actionLabel: 'Ir a clientes',
      icon: UserPlusIcon,
      done: stats.totalClients > 0,
    },
    {
      key: 'sales',
      title: 'Registrá tu primera venta',
      description: 'Al cargar ventas el dashboard empieza a mostrar ingresos y ranking de productos.',
      to: '/sales',
      actionLabel: 'Ir a ventas',
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
    <section
      className="card"
      aria-labelledby="onboarding-title"
      style={{ padding: '1.75rem', marginBottom: '1.5rem' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: 48, height: 48, borderRadius: 'var(--radius)', flexShrink: 0,
          background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <ShoppingBagIcon style={{ width: 24, height: 24, color: '#ffffff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 id="onboarding-title" style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Primeros pasos
          </h2>
          <p style={{ margin: '.25rem 0 0', fontSize: '.875rem', color: 'var(--text-secondary)' }}>
            Tu óptica todavía no tiene datos cargados. Seguí estos pasos y el dashboard se llena solo.
          </p>
          <p style={{ margin: '.5rem 0 0', fontSize: '.75rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.03em' }}>
            {completedCount} de {steps.length} completados
          </p>
        </div>
      </div>

      <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '.75rem' }}>
        {steps.map((step, i) => {
          const done = step.done === true;
          const isNext = !done && step.key === nextStepKey;
          const Icon = step.icon;
          return (
            <li
              key={step.key}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '.875rem',
                padding: '1rem 1.125rem',
                borderRadius: 'var(--radius)',
                border: `1px solid ${isNext ? 'var(--brand)' : 'var(--border)'}`,
                background: isNext ? tint('var(--brand)', 8) : 'var(--surface)',
                boxShadow: isNext ? 'var(--shadow-sm)' : 'none',
                opacity: done ? 0.65 : 1,
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 32, height: 32, borderRadius: 999, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? tint('var(--success)', 16) : tint('var(--brand)', 12),
                  color: done ? 'var(--success)' : 'var(--brand)',
                  fontWeight: 800, fontSize: '.8rem',
                }}
              >
                {done ? <CheckCircleIcon style={{ width: 20, height: 20 }} /> : <Icon style={{ width: 18, height: 18 }} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  margin: 0, fontWeight: 700, fontSize: '.925rem', color: 'var(--text-primary)',
                  display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
                }}>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 800, fontSize: '.8rem' }}>{i + 1}.</span>
                  {step.title}
                  {done && (
                    <span style={{
                      fontSize: '.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.04em',
                      color: 'var(--success)', background: tint('var(--success)', 14),
                      borderRadius: 999, padding: '.125rem .5rem',
                    }}>
                      Hecho
                    </span>
                  )}
                </p>
                <p style={{ margin: '.25rem 0 0', fontSize: '.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {step.description}
                </p>
                {!done && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap', marginTop: '.75rem' }}>
                    <Link className={isNext ? 'btn btn-primary' : 'btn btn-ghost'} to={step.to}>
                      {step.actionLabel}
                      <ArrowRightIcon style={{ width: 14, height: 14 }} />
                    </Link>
                    {step.secondary && (
                      <Link
                        to={step.secondary.to}
                        style={{ fontSize: '.8rem', color: 'var(--text-secondary)', textDecoration: 'underline' }}
                      >
                        {step.secondary.label}
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {supplierCount === null && (
        <p style={{ margin: '1rem 0 0', fontSize: '.75rem', color: 'var(--text-muted)' }}>
          No pudimos verificar si ya cargaste proveedores; si ya los tenés, seguí con el paso 2.
        </p>
      )}
    </section>
  );

  const compactChecklist = (
    <section
      className="card"
      aria-label="Pasos pendientes de configuración"
      style={{
        padding: '.875rem 1.125rem', marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '.875rem', flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
        Te faltan {pendingSteps.length} {pendingSteps.length === 1 ? 'paso' : 'pasos'} para terminar de configurar tu óptica:
      </span>
      <span style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap', flex: 1 }}>
        {pendingSteps.map(step => (
          <Link
            key={step.key}
            to={step.to}
            style={{
              fontSize: '.78rem', fontWeight: 600, color: 'var(--brand)',
              background: tint('var(--brand)', 10), borderRadius: 999, padding: '.25rem .625rem',
              textDecoration: 'none',
            }}
          >
            {step.title}
          </Link>
        ))}
      </span>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={hideCompact}
        aria-label="Ocultar los pasos pendientes"
        style={{ padding: '.25rem', flexShrink: 0 }}
      >
        <XMarkIcon style={{ width: 16, height: 16 }} />
      </button>
    </section>
  );

  const statCards = [
    sections.totalSales && {
      label: 'Total Ventas', value: stats.totalSales.toLocaleString(),
      sub: `${stats.monthSales} este mes`,
      icon: ShoppingBagIcon, color: 'var(--brand-light)',
    },
    sections.totalRevenue && {
      label: 'Total Ingresos', value: fmt(Number(stats.totalRevenue) || 0),
      sub: `${fmt(Number(stats.monthRevenue) || 0)} este mes`,
      icon: CurrencyDollarIcon, color: 'var(--success)',
    },
    sections.totalClients && {
      label: 'Clientes', value: stats.totalClients.toLocaleString(),
      sub: 'clientes activos',
      icon: UserGroupIcon, color: 'var(--brand)',
    },
    sections.totalProducts && {
      label: 'Productos', value: stats.totalProducts.toLocaleString(),
      sub: 'en catálogo',
      icon: CubeIcon, color: 'var(--warning)',
    },
  ].filter(Boolean) as any[];

  return (
    <Layout>
      <div className="fade-in">
        {/* Header */}
        {pageHeader}

        {/* Onboarding: panel completo para una óptica recién creada, tira compacta mientras
            quede algo pendiente, y nada cuando ya está todo configurado. */}
        {isNewOptics
          ? onboardingPanel
          : pendingSteps.length > 0 && !compactHidden
            ? compactChecklist
            : null}

        {/* Stat cards — se ocultan mientras la óptica está vacía: mostrar cuatro ceros
            no aporta nada y le saca protagonismo al panel de primeros pasos. */}
        {!isNewOptics && statCards.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(statCards.length, 4)}, 1fr)`,
            gap: '1rem',
            marginBottom: '1.5rem',
          }} className="sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="stat-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontSize: '.75rem', fontWeight: 700, letterSpacing: '.04em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                        {card.label}
                      </p>
                      <p style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--text-primary)', margin: '.375rem 0 .25rem', lineHeight: 1 }}>
                        {card.value}
                      </p>
                      <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <ArrowTrendingUpIcon style={{ width: 12, height: 12, color: card.color }} />
                        {card.sub}
                      </p>
                    </div>
                    <div style={{
                      width: 40, height: 40, borderRadius: 'var(--radius)',
                      background: tint(card.color), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon style={{ width: 20, height: 20, color: card.color }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom row */}
        {!isNewOptics && (sections.topProducts || sections.recentSales) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="lg:grid-cols-2 sm:grid-cols-1">
            {/* Top products */}
            {sections.topProducts && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChartBarIcon style={{ width: 16, height: 16, color: 'var(--brand-light)' }} />
                  <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)' }}>Productos más vendidos</span>
                </div>
                <div style={{ padding: '0.75rem' }}>
                  {stats.topProducts && stats.topProducts.length > 0 ? stats.topProducts.map((p, i) => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '.625rem .75rem', borderRadius: 8,
                      transition: 'background .1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 24, height: 24, borderRadius: 6,
                        background: tint('var(--brand-light)', 12), display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '.7rem', color: 'var(--brand-light)', flexShrink: 0,
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </p>
                        <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          {p.total_quantity_sold} unidades vendidas
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text-primary)', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                        {fmt(Number(p.total_revenue) || 0)}
                      </span>
                    </div>
                  )) : (
                    <EmptyState
                      icon={<ChartBarIcon />}
                      title="Todavía no hay ranking de productos"
                      description={
                        stats.totalProducts === 0
                          ? 'Cargá tu catálogo de armazones y el ranking se arma con las ventas.'
                          : 'En cuanto registres ventas vas a ver acá los armazones que más salen.'
                      }
                      actionLabel={stats.totalProducts === 0 ? 'Importar catálogo' : 'Registrar una venta'}
                      onAction={() => navigate(stats.totalProducts === 0 ? '/import' : '/sales')}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Recent sales */}
            {sections.recentSales && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDaysIcon style={{ width: 16, height: 16, color: 'var(--success)' }} />
                  <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)' }}>Ventas recientes</span>
                </div>
                <div style={{ padding: '0.75rem' }}>
                  {stats.recentSales && stats.recentSales.length > 0 ? stats.recentSales.map(sale => (
                    <div key={sale.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '.625rem .75rem', borderRadius: 8,
                      transition: 'background .1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 34, height: 34, borderRadius: 99,
                        background: tint('var(--success)', 18),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontWeight: 800, fontSize: '.75rem', color: 'var(--success)',
                      }}>
                        {(sale.client_name || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 600, fontSize: '.85rem', color: 'var(--text-primary)', margin: 0 }}>
                          {sale.client_name || 'Cliente'}
                        </p>
                        <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>
                          {fmtDate(sale.sale_date)}
                        </p>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--success)', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                        {fmt(Number(sale.total_price) || 0)}
                      </span>
                    </div>
                  )) : (
                    <EmptyState
                      icon={<CalendarDaysIcon />}
                      title="Todavía no hay ventas recientes"
                      description={
                        stats.totalClients === 0
                          ? 'Registrá primero un cliente y después vas a poder cargar la venta.'
                          : 'Cuando cargues una venta va a aparecer acá, con el cliente y el importe.'
                      }
                      actionLabel={stats.totalClients === 0 ? 'Cargar un cliente' : 'Registrar una venta'}
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
