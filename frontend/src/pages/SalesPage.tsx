import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Search, 
  Eye, 
  TrendingUp,
  DollarSign,
  Calendar,
  Users
} from 'lucide-react';
import { salesAPI } from '../services/api';
import { SaleWithDetails } from '../types';
import AddSaleModal from '../components/modals/AddSaleModal';
import ViewSaleModal from '../components/modals/ViewSaleModal';

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<SaleWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleWithDetails | null>(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await salesAPI.getAll();
      console.log('Sales data received:', data);
      console.log('Sample sale:', data[0]);
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSales();
      return;
    }

    // For now, we'll filter client-side since the API doesn't support search yet
    const filtered = sales.filter(sale => 
      sale.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.dni.includes(searchTerm)
    );
    setSales(filtered);
  };

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

  const getTotalRevenue = () => {
    const total = sales.reduce((total, sale) => {
      const price = sale.total_price;
      console.log('Sale ID:', sale.id, 'Price:', price, 'Type:', typeof price);
      
      // Handle null, undefined, NaN, and invalid numbers
      if (price === null || price === undefined || isNaN(price) || !isFinite(price)) {
        console.log('Invalid price for sale:', sale.id, 'skipping...');
        return total;
      }
      
      // Convert string to number if needed
      const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
      console.log('Converted price:', numericPrice);
      
      // Validate the converted number
      if (isNaN(numericPrice) || !isFinite(numericPrice)) {
        console.log('Invalid converted price for sale:', sale.id, 'skipping...');
        return total;
      }
      
      return total + numericPrice;
    }, 0);
    console.log('Total revenue calculated:', total);
    return total;
  };

  const getAverageSale = () => {
    if (sales.length === 0) return 0;
    const totalRevenue = getTotalRevenue();
    console.log('Total revenue for average:', totalRevenue, 'Sales count:', sales.length);
    
    // Handle division by zero and invalid results
    if (totalRevenue === 0) {
      console.log('Total revenue is 0, returning 0');
      return 0;
    }
    
    if (isNaN(totalRevenue) || !isFinite(totalRevenue)) {
      console.log('Invalid total revenue, returning 0');
      return 0;
    }
    
    const average = totalRevenue / sales.length;
    console.log('Average calculated:', average);
    return average;
  };

  const getUniqueClients = () => {
    const uniqueClientIds = new Set(sales.map(sale => sale.client_id));
    return uniqueClientIds.size;
  };

  const handleViewSale = (sale: SaleWithDetails) => {
    setSelectedSale(sale);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600">Gestiona las ventas y fichas de clientes</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Venta</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Ventas</p>
              <p className="text-2xl font-bold text-gray-900">{sales.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getTotalRevenue())}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getAverageSale())}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Clientes Únicos</p>
              <p className="text-2xl font-bold text-gray-900">{getUniqueClients()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar ventas por cliente o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">Todas las fechas</option>
              <option value="today">Hoy</option>
              <option value="week">Esta semana</option>
              <option value="month">Este mes</option>
            </select>
            <button
              onClick={handleSearch}
              className="btn-primary"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setDateFilter('all');
                fetchSales();
              }}
              className="btn-outline"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
                         <thead>
               <tr className="border-b border-gray-200">
                 <th className="text-left py-3 px-4 font-semibold text-gray-900">Venta #</th>
                 <th className="text-left py-3 px-4 font-semibold text-gray-900">Cliente</th>
                 <th className="text-left py-3 px-4 font-semibold text-gray-900">Producto</th>
                 <th className="text-left py-3 px-4 font-semibold text-gray-900">Cantidad</th>
                 <th className="text-left py-3 px-4 font-semibold text-gray-900">Total</th>
                 <th className="text-left py-3 px-4 font-semibold text-gray-900">Fecha</th>
                 <th className="text-right py-3 px-4 font-semibold text-gray-900">Acciones</th>
               </tr>
             </thead>
            <tbody>
                             {sales.length === 0 ? (
                 <tr>
                   <td colSpan={7} className="text-center py-8 text-gray-500">
                     <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                     <p>No se encontraron ventas</p>
                   </td>
                 </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-mono text-gray-900">#{sale.id}</span>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        {sale.first_name && sale.last_name ? (
                          <>
                            <p className="font-medium text-gray-900">
                              {sale.first_name} {sale.last_name}
                            </p>
                            <p className="text-sm text-gray-500">DNI: {sale.dni}</p>
                          </>
                        ) : sale.unregistered_client_name ? (
                          <p className="font-medium text-gray-900">{sale.unregistered_client_name}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Cliente no registrado</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div>
                        {sale.product_name ? (
                          <>
                            <p className="font-medium text-gray-900">{sale.product_name}</p>
                            <p className="text-sm text-gray-500">
                              {sale.brand} - {sale.model} ({sale.color})
                            </p>
                          </>
                        ) : sale.unregistered_product_name ? (
                          <p className="font-medium text-gray-900">{sale.unregistered_product_name}</p>
                        ) : (
                          <p className="text-sm text-gray-500 italic">Producto no registrado</p>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {sale.quantity}
                      </span>
                    </td>
                                         <td className="py-4 px-4">
                       <p className="font-medium text-gray-900">
                         {formatCurrency(sale.total_price)}
                       </p>
                     </td>
                     <td className="py-4 px-4">
                       <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-gray-400" />
                         <span className="text-sm text-gray-600">
                           {formatDate(sale.sale_date)}
                         </span>
                       </div>
                     </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleViewSale(sale)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>Total de ventas: {sales.length}</p>
        <p>Ingresos totales: {formatCurrency(getTotalRevenue())}</p>
      </div>

      {/* Add Sale Modal */}
      <AddSaleModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchSales}
      />

      {/* View Sale Modal */}
      <ViewSaleModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
      />
    </div>
  );
};

export default SalesPage; 