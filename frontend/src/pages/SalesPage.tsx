import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { salesService } from '../services/sales';
import { clientsService } from '../services/clients';
import { productsService } from '../services/products';
import { Sale, Client, Product, SaleProductCreate, PaginatedResponse } from '../types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingCartIcon,
} from '@heroicons/react/24/outline';

const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<PaginatedResponse<Sale> | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  
  // Form data
  const [formData, setFormData] = useState({
    client_id: '',
    sale_date: new Date().toISOString().split('T')[0],
    // OD (Ojo Derecho) - 4 campos
    od_esf: '',
    od_cil: '',
    od_eje: '',
    od_add: '',
    // OI (Ojo Izquierdo) - 4 campos
    oi_esf: '',
    oi_cil: '',
    oi_eje: '',
    oi_add: '',
    notes: '',
  });

  // Productos en la venta
  const [saleProducts, setSaleProducts] = useState<Array<SaleProductCreate & { product?: Product }>>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('1');
  const [selectedUnitPrice, setSelectedUnitPrice] = useState('');

  // Inline client creation
  const [newClientData, setNewClientData] = useState({
    name: '',
    document_id: '',
    email: '',
    phone: '',
    birth_date: '',
    notes: '',
  });

  // Inline product creation
  const [newProductData, setNewProductData] = useState({
    name: '',
    price: '',
    quantity: '',
    description: '',
    image_url: '',
  });

  useEffect(() => {
    loadSales();
    loadClients();
    loadProducts();
  }, [page, search]);

  const loadSales = async () => {
    try {
      setLoading(true);
      const data = await salesService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        sortBy: 'sale_date',
        sortOrder: 'DESC',
      });
      setSales(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar ventas');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const response = await clientsService.getAll({ limit: 1000 });
      setClients(response.data);
    } catch (err: any) {
      console.error('Error al cargar clientes:', err);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsService.getAll({ limit: 1000 });
      setProducts(response.data);
    } catch (err: any) {
      console.error('Error al cargar productos:', err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadSales();
  };

  const handleAddProduct = () => {
    if (!selectedProductId || !selectedQuantity || !selectedUnitPrice) {
      alert('Debes seleccionar un producto, cantidad y precio');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProductId));
    if (!product) return;

    const quantity = Number(selectedQuantity) || 1;
    const unitPrice = Number(selectedUnitPrice) || 0;

    setSaleProducts([
      ...saleProducts,
      {
        product_id: parseInt(selectedProductId),
        quantity,
        unit_price: unitPrice,
        product,
      },
    ]);

    setSelectedProductId('');
    setSelectedQuantity('1');
    setSelectedUnitPrice('');
  };

  const handleRemoveProduct = (index: number) => {
    setSaleProducts(saleProducts.filter((_, i) => i !== index));
  };

  const calculateTotal = (): number => {
    return saleProducts.reduce((sum, item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const itemTotal = quantity * unitPrice;
      return sum + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  };

  const handleCreateClientInline = async () => {
    try {
      if (!newClientData.name) {
        alert('El nombre del cliente es obligatorio');
        return;
      }

      const newClient = await clientsService.create(newClientData);
      setClients([...clients, newClient]);
      setFormData({ ...formData, client_id: newClient.id.toString() });
      setShowClientModal(false);
      setNewClientData({
        name: '',
        document_id: '',
        email: '',
        phone: '',
        birth_date: '',
        notes: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear cliente');
    }
  };

  const handleCreateProductInline = async () => {
    try {
      if (!newProductData.name) {
        alert('El nombre del producto es obligatorio');
        return;
      }

      const submitData = {
        ...newProductData,
        price: newProductData.price ? parseFloat(newProductData.price) : 0,
        quantity: newProductData.quantity ? parseInt(newProductData.quantity) : 0,
      };

      const newProduct = await productsService.create(submitData);
      setProducts([...products, newProduct]);
      setSelectedProductId(newProduct.id.toString());
      setSelectedUnitPrice(newProduct.price?.toString() || '0');
      setShowProductModal(false);
      setNewProductData({
        name: '',
        price: '',
        quantity: '',
        description: '',
        image_url: '',
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al crear producto');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id) {
      alert('Debes seleccionar o crear un cliente');
      return;
    }

    if (saleProducts.length === 0) {
      alert('Debes agregar al menos un producto a la venta');
      return;
    }

    try {
      const saleData = {
        client_id: parseInt(formData.client_id),
        sale_date: formData.sale_date,
        od_esf: formData.od_esf ? parseFloat(formData.od_esf) : null,
        od_cil: formData.od_cil ? parseFloat(formData.od_cil) : null,
        od_eje: formData.od_eje ? parseInt(formData.od_eje) : null,
        od_add: formData.od_add ? parseFloat(formData.od_add) : null,
        oi_esf: formData.oi_esf ? parseFloat(formData.oi_esf) : null,
        oi_cil: formData.oi_cil ? parseFloat(formData.oi_cil) : null,
        oi_eje: formData.oi_eje ? parseInt(formData.oi_eje) : null,
        oi_add: formData.oi_add ? parseFloat(formData.oi_add) : null,
        notes: formData.notes || undefined,
        products: saleProducts.map(sp => ({
          product_id: sp.product_id,
          quantity: sp.quantity,
          unit_price: sp.unit_price,
        })),
      };

      if (editingSale) {
        await salesService.update(editingSale.id, saleData);
      } else {
        await salesService.create(saleData);
      }
      
      setShowModal(false);
      setEditingSale(null);
      resetForm();
      loadSales();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar venta');
    }
  };

  const handleEdit = async (sale: Sale) => {
    try {
      const fullSale = await salesService.getById(sale.id);
      setEditingSale(fullSale);
      setFormData({
        client_id: fullSale.client_id.toString(),
        sale_date: fullSale.sale_date.split('T')[0],
        od_esf: fullSale.od_esf?.toString() || '',
        od_cil: fullSale.od_cil?.toString() || '',
        od_eje: fullSale.od_eje?.toString() || '',
        od_add: fullSale.od_add?.toString() || '',
        oi_esf: fullSale.oi_esf?.toString() || '',
        oi_cil: fullSale.oi_cil?.toString() || '',
        oi_eje: fullSale.oi_eje?.toString() || '',
        oi_add: fullSale.oi_add?.toString() || '',
        notes: fullSale.notes || '',
      });

      if (fullSale.products) {
        const productsWithProductInfo = await Promise.all(
          fullSale.products.map(async (sp) => {
            try {
              const product = await productsService.getById(sp.product_id);
              return {
                ...sp,
                product,
              };
            } catch {
              return sp;
            }
          })
        );
        setSaleProducts(productsWithProductInfo);
      } else {
        setSaleProducts([]);
      }

      setShowModal(true);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al cargar venta');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta venta?')) return;
    try {
      await salesService.delete(id);
      loadSales();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar venta');
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: '',
      sale_date: new Date().toISOString().split('T')[0],
      od_esf: '',
      od_cil: '',
      od_eje: '',
      od_add: '',
      oi_esf: '',
      oi_cil: '',
      oi_eje: '',
      oi_add: '',
      notes: '',
    });
    setSaleProducts([]);
    setSelectedProductId('');
    setSelectedQuantity('1');
    setSelectedUnitPrice('');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const product = products.find(p => p.id === parseInt(productId));
    if (product && product.price) {
      setSelectedUnitPrice(product.price.toString());
    } else {
      setSelectedUnitPrice('');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Ventas</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gestiona tus ventas y presupuestos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingSale(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nueva Venta
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="search-input relative block w-full pl-20 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 cursor-text"
            />
          </div>
        </form>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {sales?.data && sales.data.length > 0 ? (
                    sales.data.map((sale) => (
                      <tr key={sale.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(sale.sale_date).toLocaleDateString('es-ES')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {sale.client_name || 'Cliente'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {sale.products && sale.products.length > 0
                              ? `${sale.products.length} producto(s)`
                              : 'Sin productos'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatCurrency(Number(sale.total_price) || 0)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => handleEdit(sale)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                              title="Editar"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(sale.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors cursor-pointer"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                        No hay ventas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {sales && sales.pagination.totalPages > 1 && (
              <Pagination
                page={sales.pagination.page}
                totalPages={sales.pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* Main Modal - Sale Form */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-gray-300 dark:border-gray-600 w-full max-w-6xl shadow-lg rounded-md bg-white dark:bg-gray-800 max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {editingSale ? 'Editar Venta' : 'Nueva Venta'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingSale(null);
                      resetForm();
                    }}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Cliente */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                      Cliente *
                    </label>
                    <div className="flex space-x-2">
                      <select
                        required
                        value={formData.client_id}
                        onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                        className="flex-1 block rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
                      >
                        <option value="">Seleccionar cliente...</option>
                        {clients.map((client) => (
                          <option key={client.id} value={client.id}>
                            {client.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowClientModal(true)}
                        className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm transition-colors cursor-pointer"
                      >
                        <PlusIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Fecha */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                      Fecha de Venta *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.sale_date}
                      onChange={(e) => setFormData({ ...formData, sale_date: e.target.value })}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>

                  {/* Campos Ópticos */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-100 mb-3">Datos Ópticos (Opcional)</h4>
                    
                    {/* OD (Ojo Derecho) - Fila 1 */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-2">OD (Ojo Derecho)</label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Esf</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.od_esf}
                            onChange={(e) => setFormData({ ...formData, od_esf: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Cil</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.od_cil}
                            onChange={(e) => setFormData({ ...formData, od_cil: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Eje</label>
                          <input
                            type="number"
                            value={formData.od_eje}
                            onChange={(e) => setFormData({ ...formData, od_eje: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Add</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.od_add}
                            onChange={(e) => setFormData({ ...formData, od_add: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    {/* OI (Ojo Izquierdo) - Fila 2 */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-200 mb-2">OI (Ojo Izquierdo)</label>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Esf</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.oi_esf}
                            onChange={(e) => setFormData({ ...formData, oi_esf: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Cil</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.oi_cil}
                            onChange={(e) => setFormData({ ...formData, oi_cil: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Eje</label>
                          <input
                            type="number"
                            value={formData.oi_eje}
                            onChange={(e) => setFormData({ ...formData, oi_eje: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-300 mb-1">Add</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.oi_add}
                            onChange={(e) => setFormData({ ...formData, oi_add: e.target.value })}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-100 mb-3">Productos *</h4>
                    
                    {/* Agregar producto */}
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-4">
                      <div className="grid grid-cols-12 gap-2 mb-2">
                        <div className="col-span-5">
                          <select
                            value={selectedProductId}
                            onChange={(e) => handleProductSelect(e.target.value)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-pointer"
                          >
                            <option value="">Seleccionar producto...</option>
                            {products.map((product) => (
                              <option key={product.id} value={product.id}>
                                {product.name} - {formatCurrency(Number(product.price) || 0)}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            value={selectedQuantity}
                            onChange={(e) => setSelectedQuantity(e.target.value)}
                            placeholder="Cantidad"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                          />
                        </div>
                        <div className="col-span-3">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={selectedUnitPrice}
                            onChange={(e) => setSelectedUnitPrice(e.target.value)}
                            placeholder="Precio unitario"
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                          />
                        </div>
                        <div className="col-span-2 flex space-x-1">
                          <button
                            type="button"
                            onClick={() => setShowProductModal(true)}
                            className="flex-1 px-2 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 text-sm transition-colors cursor-pointer"
                            title="Crear producto"
                          >
                            <PlusIcon className="w-5 h-5 mx-auto" />
                          </button>
                          <button
                            type="button"
                            onClick={handleAddProduct}
                            className="flex-1 px-2 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 text-sm transition-colors cursor-pointer"
                            title="Agregar a venta"
                          >
                            <ShoppingCartIcon className="w-5 h-5 mx-auto" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Lista de productos */}
                    {saleProducts.length > 0 && (
                      <div className="space-y-2 mb-4">
                        {saleProducts.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">
                                {item.product?.name || `Producto ID: ${item.product_id}`}
                              </p>
                              <div className="flex space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                <span>Cantidad: {item.quantity}</span>
                                <span>Precio: {formatCurrency(item.unit_price)}</span>
                                <span className="font-medium">
                                  Subtotal: {formatCurrency(item.quantity * item.unit_price)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              className="ml-4 text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors cursor-pointer"
                            >
                              <XMarkIcon className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Total */}
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-medium text-gray-900 dark:text-white">Total:</span>
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notas */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100 mb-2">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingSale(null);
                        resetForm();
                      }}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors cursor-pointer"
                    >
                      {editingSale ? 'Actualizar' : 'Crear'} Venta
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Client Creation Modal */}
        {showClientModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-600 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nuevo Cliente</h3>
                  <button
                    onClick={() => setShowClientModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={newClientData.name}
                      onChange={(e) => setNewClientData({ ...newClientData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Documento</label>
                    <input
                      type="text"
                      value={newClientData.document_id}
                      onChange={(e) => setNewClientData({ ...newClientData, document_id: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Email</label>
                      <input
                        type="email"
                        value={newClientData.email}
                        onChange={(e) => setNewClientData({ ...newClientData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Teléfono</label>
                      <input
                        type="text"
                        value={newClientData.phone}
                        onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowClientModal(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateClientInline}
                      className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors cursor-pointer"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Product Creation Modal */}
        {showProductModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border border-gray-300 dark:border-gray-600 w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">Nuevo Producto</h3>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Nombre *</label>
                    <input
                      type="text"
                      required
                      value={newProductData.name}
                      onChange={(e) => setNewProductData({ ...newProductData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Precio</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newProductData.price}
                        onChange={(e) => setNewProductData({ ...newProductData, price: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Cantidad</label>
                      <input
                        type="number"
                        min="0"
                        value={newProductData.quantity}
                        onChange={(e) => setNewProductData({ ...newProductData, quantity: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Descripción</label>
                    <textarea
                      value={newProductData.description}
                      onChange={(e) => setNewProductData({ ...newProductData, description: e.target.value })}
                      rows={2}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowProductModal(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateProductInline}
                      className="px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition-colors cursor-pointer"
                    >
                      Crear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SalesPage;
