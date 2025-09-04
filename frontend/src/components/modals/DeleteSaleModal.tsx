import React from 'react';
import { X, AlertTriangle, DollarSign } from 'lucide-react';
import { Sale } from '../../types';
import { salesAPI } from '../../services/api';
import toast from 'react-hot-toast';

interface DeleteSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sale: Sale | null;
}

const DeleteSaleModal: React.FC<DeleteSaleModalProps> = ({ isOpen, onClose, onSuccess, sale }) => {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!sale) return;

    setIsDeleting(true);
    try {
      await salesAPI.delete(sale.id);
      toast.success('Venta eliminada exitosamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al eliminar la venta';
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (!isOpen || !sale) return null;

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
                <h3 className="text-lg font-semibold text-gray-900">Eliminar Venta</h3>
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
              <DollarSign className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-gray-900">Venta #{sale.id}</p>
                <p className="text-sm text-gray-600">{formatCurrency(parseFloat(sale.total_amount || '0'))}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-2">
              <p>¿Estás seguro de que deseas eliminar esta venta?</p>
              <p className="font-medium text-red-600">
                Esta acción no se puede deshacer. La venta será marcada como eliminada y no aparecerá en las listas.
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
              {isDeleting ? 'Eliminando...' : 'Eliminar Venta'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteSaleModal;
