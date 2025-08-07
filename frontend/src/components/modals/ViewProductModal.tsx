import React from 'react';
import { X, DollarSign, TrendingDown, Calendar, Package } from 'lucide-react';
import { Product } from '../../types';
import ProductImage from '../ProductImage';

interface ViewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

const ViewProductModal: React.FC<ViewProductModalProps> = ({ isOpen, onClose, product }) => {
  if (!isOpen || !product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) return { text: 'Sin stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= 5) return { text: 'Bajo stock', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'En stock', color: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus(product.stock_quantity);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalles del Producto</h3>
                <p className="text-sm text-gray-500">Información completa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Product Image */}
          <div className="mb-6">
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="w-full h-48 object-cover rounded-lg"
              fallbackIcon={<Package className="w-16 h-16 text-gray-400" />}
            />
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">{product.name}</h4>
              {product.description && (
                <p className="text-gray-600 mb-4">{product.description}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <p className="text-gray-900">{product.brand}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <p className="text-gray-900">{product.model}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <p className="text-gray-900">{product.color}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tamaño</label>
                <p className="text-gray-900">{product.size}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Precio</span>
              </div>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(product.price)}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Stock</span>
              </div>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatus.color}`}>
                {product.stock_quantity} - {stockStatus.text}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Creado</span>
              </div>
              <span className="text-sm text-gray-600">
                {new Date(product.created_at).toLocaleDateString('es-AR')}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProductModal; 