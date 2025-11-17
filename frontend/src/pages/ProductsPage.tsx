import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { productsService } from '../services/products';
import { Product, PaginatedResponse } from '../types';
import { getDirectImageUrl } from '../utils/imageUtils';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    description: '',
    image_url: '',
  });

  useEffect(() => {
    loadProducts();
  }, [page, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll({
        page,
        limit: 10,
        search: search || undefined,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      });
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadProducts();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        quantity: formData.quantity ? parseInt(formData.quantity) : 0,
      };

      if (editingProduct) {
        await productsService.update(editingProduct.id, submitData);
      } else {
        await productsService.create(submitData);
      }
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar producto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price?.toString() || '0',
      quantity: product.quantity?.toString() || '0',
      description: product.description || '',
      image_url: product.image_url || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    try {
      await productsService.delete(id);
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar producto');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      quantity: '',
      description: '',
      image_url: '',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Productos</h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Gestiona tu catálogo de productos
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors cursor-pointer"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Nuevo Producto
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

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products?.data && products.data.length > 0 ? (
                products.data.map((product) => (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow"
                  >
                    {product.image_url ? (
                      <>
                        <img
                          src={getDirectImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-48 object-cover"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const currentSrc = img.src;
                            // Si falla con thumbnail, intentar con uc?export=view
                            if (currentSrc.includes('thumbnail') && product.image_url) {
                              const fileId = product.image_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                              if (fileId) {
                                img.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
                                return;
                              }
                            }
                            // Si todo falla, mostrar placeholder
                            img.style.display = 'none';
                            const placeholder = img.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.remove('hidden');
                          }}
                          onLoad={(e) => {
                            // Ocultar placeholder si la imagen carga correctamente
                            const placeholder = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.classList.add('hidden');
                          }}
                        />
                        <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center hidden">
                          <PhotoIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <PhotoIcon className="w-16 h-16 text-gray-400 dark:text-gray-500" />
                      </div>
                    )}
                    <div className="p-5">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        {product.name}
                      </h3>
                      <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                        {formatCurrency(Number(product.price) || 0)}
                      </p>
                      {product.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Stock: {product.quantity || 0}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 transition-colors cursor-pointer"
                            title="Eliminar"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                  No hay productos registrados
                </div>
              )}
            </div>

            {/* Pagination */}
            {products && products.pagination.totalPages > 1 && (
              <Pagination
                page={products.pagination.page}
                totalPages={products.pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border border-gray-300 dark:border-gray-600 w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
                      Nombre del Producto *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Cantidad</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">Descripción</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-100">
                      URL de Imagen (Google Drive o URL directa)
                    </label>
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="https://drive.google.com/file/d/ID/view?usp=sharing o https://ejemplo.com/imagen.jpg"
                      className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-indigo-500 dark:focus:border-indigo-400 focus:ring-indigo-500 dark:focus:ring-indigo-400 cursor-text"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">
                      Puedes usar una URL de Google Drive compartida (público) o una URL directa de imagen
                    </p>
                    {formData.image_url && (
                      <div className="mt-2">
                        <img
                          src={getDirectImageUrl(formData.image_url)}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded border border-gray-300 dark:border-gray-600"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            const currentSrc = img.src;
                            // Si falla con thumbnail, intentar con uc?export=view
                            if (currentSrc.includes('thumbnail')) {
                              const fileId = formData.image_url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1];
                              if (fileId) {
                                img.src = `https://drive.google.com/uc?export=view&id=${fileId}`;
                                return;
                              }
                            }
                            // Si todo falla, ocultar imagen
                            img.style.display = 'none';
                            const parent = img.parentElement;
                            if (parent) {
                              const errorMsg = document.createElement('p');
                              errorMsg.className = 'text-xs text-red-500 dark:text-red-400 mt-1';
                              errorMsg.textContent = 'No se pudo cargar la imagen. Verifica que el archivo esté público.';
                              parent.appendChild(errorMsg);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingProduct(null);
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
                      Guardar
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProductsPage;

