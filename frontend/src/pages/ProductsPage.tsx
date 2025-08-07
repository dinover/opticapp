import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Eye, 
  Edit,
  Trash2,
  AlertTriangle,
  SortAsc,
  SortDesc
} from 'lucide-react';
import { productsAPI } from '../services/api';
import { Product } from '../types';
import AddProductModal from '../components/modals/AddProductModal';
import EditProductModal from '../components/modals/EditProductModal';
import ViewProductModal from '../components/modals/ViewProductModal';
import ProductImage from '../components/ProductImage';
import Pagination from '../components/Pagination';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'brand' | 'price' | 'stock_quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await productsAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchProducts();
      return;
    }

    try {
      setLoading(true);
      const data = await productsAPI.search(searchTerm);
      setProducts(data);
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: 'name' | 'brand' | 'price' | 'stock_quantity') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];

    if (sortBy === 'price' || sortBy === 'stock_quantity') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Sin stock', color: 'text-red-600 bg-red-50' };
    if (quantity <= 5) return { text: 'Bajo stock', color: 'text-yellow-600 bg-yellow-50' };
    return { text: 'En stock', color: 'text-green-600 bg-green-50' };
  };

  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteModal(true);
  };

  // Pagination functions
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona el inventario de gafas</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Agregar Producto</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar productos por nombre, marca o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSearch}
              className="btn-primary"
            >
              Buscar
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                fetchProducts();
              }}
              className="btn-outline"
            >
              Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
                  >
                    <span>Producto</span>
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  <button
                    onClick={() => handleSort('brand')}
                    className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
                  >
                    <span>Marca</span>
                    {sortBy === 'brand' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Modelo</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Color</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Tamaño</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
                  >
                    <span>Precio</span>
                    {sortBy === 'price' && (
                      sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                    )}
                  </button>
                </th>
                                 <th className="text-left py-3 px-4 font-semibold text-gray-900">
                   <button
                     onClick={() => handleSort('stock_quantity')}
                     className="flex items-center space-x-1 hover:text-primary-600 transition-colors"
                   >
                     <span>Stock</span>
                     {sortBy === 'stock_quantity' && (
                       sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                     )}
                   </button>
                 </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-900">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                currentProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity);
                  return (
                    <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <ProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            {product.description && (
                              <p className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-900">{product.brand}</td>
                      <td className="py-4 px-4 text-gray-900">{product.model}</td>
                      <td className="py-4 px-4 text-gray-900">{product.color}</td>
                      <td className="py-4 px-4 text-gray-900">{product.size}</td>
                      <td className="py-4 px-4 text-gray-900 font-medium">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {product.stock_quantity} - {stockStatus.text}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleViewProduct(product)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProduct(product)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <p>Total de productos: {products.length}</p>
        <p>Productos con bajo stock: {products.filter(p => p.stock_quantity <= 5).length}</p>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchProducts}
      />

      {/* View Product Modal */}
      <ViewProductModal
        isOpen={showViewModal}
        onClose={() => {
          setShowViewModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={fetchProducts}
        product={selectedProduct}
      />

      {/* Delete Product Modal */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        totalItems={products.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default ProductsPage; 