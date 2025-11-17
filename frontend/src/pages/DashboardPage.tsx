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
} from '@heroicons/react/24/outline';

const DashboardPage: React.FC = () => {
  const { sections } = useDashboardConfig();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const statsData = await dashboardService.getStats();
      setStats(statsData);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
          <p className="text-red-800 dark:text-red-200">{error}</p>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No hay datos disponibles</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Vista general de tu negocio
            </p>
          </div>
          <DashboardSettings />
        </div>

        {/* Stats Cards */}
        {(sections.totalSales || sections.totalRevenue || sections.totalClients || sections.totalProducts) && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Ventas */}
            {sections.totalSales && (
              <DashboardCard
                title="Total Ventas"
                value={stats.totalSales.toString()}
                icon={ShoppingBagIcon}
                iconColor="bg-blue-500"
              >
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Este mes: {stats.monthSales}</p>
                </div>
              </DashboardCard>
            )}

            {/* Total Ingresos */}
            {sections.totalRevenue && (
              <DashboardCard
                title="Total Ingresos"
                value={formatCurrency(Number(stats.totalRevenue) || 0)}
                icon={CurrencyDollarIcon}
                iconColor="bg-green-500"
              >
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Este mes: {formatCurrency(Number(stats.monthRevenue) || 0)}
                  </p>
                </div>
              </DashboardCard>
            )}

            {/* Total Clientes */}
            {sections.totalClients && (
              <DashboardCard
                title="Total Clientes"
                value={stats.totalClients.toString()}
                icon={UserGroupIcon}
                iconColor="bg-purple-500"
              >
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Base de datos de clientes activos registrados en el sistema
                  </p>
                </div>
              </DashboardCard>
            )}

            {/* Total Productos */}
            {sections.totalProducts && (
              <DashboardCard
                title="Total Productos"
                value={stats.totalProducts.toString()}
                icon={CubeIcon}
                iconColor="bg-orange-500"
              >
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Catálogo completo de productos activos disponibles
                  </p>
                </div>
              </DashboardCard>
            )}
          </div>
        )}

        {/* Products más vendidos y Ventas recientes */}
        {(sections.topProducts || sections.recentSales) && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Productos más vendidos */}
            {sections.topProducts && (
              <DashboardCard
                title="Productos Más Vendidos"
                icon={ChartBarIcon}
              >
                <div className="mt-4 space-y-4">
                  {stats.topProducts && stats.topProducts.length > 0 ? (
                    stats.topProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Cantidad: {product.total_quantity_sold} |{' '}
                            {formatCurrency(Number(product.total_revenue) || 0)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(Number(product.base_price) || 0)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No hay productos vendidos aún
                    </p>
                  )}
                </div>
              </DashboardCard>
            )}

            {/* Ventas recientes */}
            {sections.recentSales && (
              <DashboardCard
                title="Ventas Recientes"
                icon={ShoppingBagIcon}
              >
                <div className="mt-4 space-y-4">
                  {stats.recentSales && stats.recentSales.length > 0 ? (
                    stats.recentSales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {sale.client_name || 'Cliente'}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(sale.sale_date).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(Number(sale.total_price) || 0)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                      No hay ventas recientes
                    </p>
                  )}
                </div>
              </DashboardCard>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

interface DashboardCardProps {
  title: string;
  value?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  children?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  icon: Icon,
  iconColor = 'bg-indigo-500',
  children,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`${iconColor} rounded-md p-3`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            {value && <p className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</p>}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

export default DashboardPage;
