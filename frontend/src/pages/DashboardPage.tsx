import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import DashboardSettings from '../components/DashboardSettings';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { dashboardService } from '../services/dashboard';
import { DashboardStats } from '../types';
import {
  ShoppingBagIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CubeIcon,
  ChartBarIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';
import { useCurrency } from '../contexts/CurrencyContext';
import { ArrowTrendingUpIcon } from '@heroicons/react/24/solid';

const DashboardPage: React.FC = () => {
  const { sections } = useDashboardConfig();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await dashboardService.getStats();
      setStats(s);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const { fmt } = useCurrency();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

  if (loading) return (
    <Layout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" />
      </div>
    </Layout>
  );

  if (error) return (
    <Layout>
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca',
        borderRadius: 12, padding: '1rem 1.25rem', color: '#991b1b', fontSize: '.875rem',
      }}>{error}</div>
    </Layout>
  );

  if (!stats) return <Layout><div className="empty-state"><p>No hay datos disponibles</p></div></Layout>;

  const statCards = [
    sections.totalSales && {
      label: 'Total Ventas', value: stats.totalSales.toLocaleString(),
      sub: `${stats.monthSales} este mes`,
      icon: ShoppingBagIcon, color: '#6366f1', bg: '#eef2ff',
    },
    sections.totalRevenue && {
      label: 'Total Ingresos', value: fmt(Number(stats.totalRevenue) || 0),
      sub: `${fmt(Number(stats.monthRevenue) || 0)} este mes`,
      icon: CurrencyDollarIcon, color: '#10b981', bg: '#ecfdf5',
    },
    sections.totalClients && {
      label: 'Clientes', value: stats.totalClients.toLocaleString(),
      sub: 'clientes activos',
      icon: UserGroupIcon, color: '#8b5cf6', bg: '#f5f3ff',
    },
    sections.totalProducts && {
      label: 'Productos', value: stats.totalProducts.toLocaleString(),
      sub: 'en catálogo',
      icon: CubeIcon, color: '#f59e0b', bg: '#fffbeb',
    },
  ].filter(Boolean) as any[];

  return (
    <Layout>
      <div className="fade-in">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Resumen de tu negocio</p>
          </div>
          <DashboardSettings />
        </div>

        {/* Stat cards */}
        {statCards.length > 0 && (
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
                      width: 40, height: 40, borderRadius: 10,
                      background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
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
        {(sections.topProducts || sections.recentSales) && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="lg:grid-cols-2 sm:grid-cols-1">
            {/* Top products */}
            {sections.topProducts && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <ChartBarIcon style={{ width: 16, height: 16, color: '#6366f1' }} />
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
                        background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '.7rem', color: '#6366f1', flexShrink: 0,
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
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p>Sin ventas registradas aún</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recent sales */}
            {sections.recentSales && (
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CalendarDaysIcon style={{ width: 16, height: 16, color: '#10b981' }} />
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
                        background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        fontWeight: 800, fontSize: '.75rem', color: '#065f46',
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
                      <span style={{ fontWeight: 700, fontSize: '.875rem', color: '#10b981', fontFamily: 'DM Mono, monospace', flexShrink: 0 }}>
                        {fmt(Number(sale.total_price) || 0)}
                      </span>
                    </div>
                  )) : (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p>Sin ventas recientes</p>
                    </div>
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
