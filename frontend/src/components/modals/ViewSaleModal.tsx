import React from 'react';
import { X, ShoppingCart, Users, Package, DollarSign, Calendar, FileText } from 'lucide-react';
import { Sale, SaleWithDetails } from '../../types';

interface ViewSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleWithDetails | null;
}

const ViewSaleModal: React.FC<ViewSaleModalProps> = ({ isOpen, onClose, sale }) => {
  if (!isOpen || !sale) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalles de la Venta</h3>
                <p className="text-sm text-gray-500">Venta #{sale.id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sale Details */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Fecha</span>
                </div>
                <span className="text-sm text-gray-900">{formatDate(sale.sale_date)}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Total</span>
                </div>
                <span className="text-lg font-semibold text-green-600">
                  {formatCurrency(sale.total_price)}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <ShoppingCart className="w-5 h-5 text-purple-600" />
                  <span className="text-sm font-medium text-gray-700">Cantidad</span>
                </div>
                <span className="text-lg font-semibold text-purple-600">{sale.quantity}</span>
              </div>
            </div>

            {/* Client Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-gray-900">Cliente</h4>
              </div>
              {sale.unregistered_client_name ? (
                <p className="text-gray-900 font-medium">{sale.unregistered_client_name}</p>
              ) : (
                <p className="text-gray-500 italic">Cliente no registrado</p>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-3">
                <Package className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-gray-900">Producto</h4>
              </div>
              {sale.unregistered_product_name ? (
                <p className="text-gray-900 font-medium">{sale.unregistered_product_name}</p>
              ) : (
                <p className="text-gray-500 italic">Producto no registrado</p>
              )}
            </div>

            {/* Notes */}
            {sale.notes && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-medium text-gray-900">Notas</h4>
                </div>
                <p className="text-gray-900">{sale.notes}</p>
              </div>
            )}

            {/* Prescription Fields */}
            {(sale.od_esf || sale.od_cil || sale.od_eje || sale.od_add || 
              sale.oi_esf || sale.oi_cil || sale.oi_eje || sale.oi_add) && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Prescripción Óptica</h4>
                <div className="grid grid-cols-2 gap-4">
                  {/* Ojo Derecho (OD) */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ojo Derecho (OD)</h5>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Esf:</span>
                        <p className="font-medium">{sale.od_esf || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Cil:</span>
                        <p className="font-medium">{sale.od_cil || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Eje:</span>
                        <p className="font-medium">{sale.od_eje || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Add:</span>
                        <p className="font-medium">{sale.od_add || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Ojo Izquierdo (OI) */}
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Ojo Izquierdo (OI)</h5>
                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Esf:</span>
                        <p className="font-medium">{sale.oi_esf || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Cil:</span>
                        <p className="font-medium">{sale.oi_cil || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Eje:</span>
                        <p className="font-medium">{sale.oi_eje || '-'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Add:</span>
                        <p className="font-medium">{sale.oi_add || '-'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
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

export default ViewSaleModal; 