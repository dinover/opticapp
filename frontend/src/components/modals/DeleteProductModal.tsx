import React from 'react';
import { X, AlertTriangle, Package } from 'lucide-react';
import { Product } from '../../types';
import { productsAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface DeleteProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product: Product | null;
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({ isOpen, onClose, onSuccess, product }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!product) return;

    setIsDeleting(true);
    try {
      await productsAPI.delete(product.id);
      toast.success('Producto eliminado exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al eliminar el producto';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-red-600 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Producto</h3>
                <p className="text-sm text-gray-500">Confirmar eliminación</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg mb-4">
              <Package className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">{product.name}</p>
                <p className="text-sm text-gray-600">Producto #{product.id}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>¿Estás seguro de que deseas eliminar este producto?</p>
              <p className="font-medium text-red-600">
                Esta acción no se puede deshacer. El producto será marcado como eliminado y no aparecerá en las listas.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
              disabled={isDeleting}
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar Producto'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductModal;
