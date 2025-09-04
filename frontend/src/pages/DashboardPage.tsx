import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  AlertTriangle,
  Activity
} from 'lucide-react';
import { opticAPI } from '../services/api';
import { OpticStats, ActivityItem, Product } from '../types';
import { useNavigate } from 'react-router-dom';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import RevenueChart from '../components/RevenueChart';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<OpticStats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { getEnabledPanels } = useDashboardConfig();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsData, activityData, lowStockData] = await Promise.all([
          opticAPI.getStats(),
          opticAPI.getActivity(),
          opticAPI.getLowStock(),
        ]);

        setStats(statsData);
        setActivity(activityData);
        setLowStockProducts(lowStockData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const formatCurrency = (amount: number | null | undefined) => {
    // Handle null, undefined, NaN, and invalid numbers
    if (amount === null || amount === undefined || isNaN(amount) || !isFinite(amount)) {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
      }).format(0);
    }
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4 text-green-500" />;
      case 'client':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'product':
        return <Package className="w-4 h-4 text-purple-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'sale':
        return 'bg-green-100 border-green-300';
      case 'client':
        return 'bg-blue-100 border-blue-300';
      case 'product':
        return 'bg-purple-100 border-purple-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const enabledPanels = getEnabledPanels();

  const renderPanel = (panelId: string) => {
    switch (panelId) {
      case 'sales-overview':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Productos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_products || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Clientes</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_clients || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <ShoppingCart className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ventas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.total_sales || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Ingresos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(stats?.total_revenue)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'recent-sales':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
              <button
                onClick={() => navigate('/sales')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Ver todas
              </button>
            </div>
            <div className="space-y-3">
              {activity.slice(0, 5).map((item, index) => (
                <div key={index} className={`flex items-center p-3 rounded-lg border ${getActivityColor(item.type)}`}>
                  {getActivityIcon(item.type)}
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{item.client_name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'low-stock':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Stock Bajo</h3>
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product.id} className="flex items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <Package className="w-4 h-4 text-red-500" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-red-600 dark:text-red-400">Stock: {product.stock_quantity} unidades</p>
                  </div>
                </div>
              ))}
              {lowStockProducts.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No hay productos con stock bajo</p>
              )}
            </div>
          </div>
        );

      case 'client-stats':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estadísticas de Clientes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats?.total_clients || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Clientes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.total_clients || 0}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Nuevos este mes</p>
              </div>
            </div>
          </div>
        );

      case 'top-products':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Productos Más Vendidos</h3>
            <div className="space-y-3">
              {lowStockProducts.slice(0, 3).map((product) => (
                <div key={product.id} className="flex items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                  <Package className="w-4 h-4 text-gray-500" />
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Stock: {product.stock_quantity} unidades</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'revenue-chart':
        return <RevenueChart />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Resumen general de tu óptica</p>
        </div>
      </div>

      {/* Dynamic Panels */}
      <div className="space-y-6">
        {enabledPanels.map((panel) => (
          <div key={panel.id}>
            {renderPanel(panel.id)}
          </div>
        ))}
      </div>

      {enabledPanels.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No hay paneles configurados</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Configura los paneles en Configuración</p>
        </div>
      )}
    </div>
  );
};

export default DashboardPage; 