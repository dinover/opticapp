import React from 'react';
import { X, DollarSign, Calendar, User, Package, Eye } from 'lucide-react';
import { SaleWithDetails } from '../../types';

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
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getClientName = (sale: SaleWithDetails) => {
    if (sale.client && sale.client.first_name && sale.client.last_name) {
      return `${sale.client.first_name} ${sale.client.last_name}`;
    }
    return sale.unregistered_client_name || 'Cliente no registrado';
  };

  const getProductName = (item: any) => {
    if (item.product_name) {
      return item.product_name;
    }
    return item.unregistered_product_name || 'Producto no registrado';
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
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Detalles de la Venta</h3>
                <p className="text-sm text-gray-500">Información completa de la venta #{sale.id}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Cliente</p>
                  <p className="text-gray-900">{getClientName(sale)}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Fecha</p>
                  <p className="text-gray-900">{formatDate(sale.sale_date)}</p>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Total de la Venta</span>
              </div>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(parseFloat(sale.total_amount || '0'))}
              </span>
            </div>

            {/* Products List */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Productos de la Venta</span>
              </h4>
              
                             <div className="space-y-4">
                 {sale.items && sale.items.length > 0 ? (
                   sale.items.map((item, index) => (
                     <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium text-gray-900">{getProductName(item)}</h5>
                                                 <span className="text-sm font-medium text-gray-600">
                           {formatCurrency(item.quantity * item.unit_price)}
                         </span>
                      </div>
                      
                                             <div className="space-y-3 text-sm">
                         {/* Primera fila: Cantidad y Precio unitario */}
                         <div className="grid grid-cols-2 gap-4">
                           <div className="flex justify-between">
                             <span className="text-gray-500">Cantidad:</span>
                             <span className="font-medium">{item.quantity}</span>
                           </div>
                           <div className="flex justify-between">
                             <span className="text-gray-500">Precio unitario:</span>
                             <span className="font-medium">{formatCurrency(item.unit_price)}</span>
                           </div>
                         </div>
                         
                         {/* Segunda fila: Producto y Precio catálogo (solo si existe product_name) */}
                         {item.product_name && (
                           <div className="grid grid-cols-2 gap-4">
                             <div className="flex justify-between">
                               <span className="text-gray-500">Producto:</span>
                               <span className="font-medium">{item.product_name}</span>
                             </div>
                             <div className="flex justify-between">
                               <span className="text-gray-500">Precio catálogo:</span>
                               <span className="font-medium">{formatCurrency(item.product_price || 0)}</span>
                             </div>
                           </div>
                         )}
                       </div>

                                             {/* Prescription Details */}
                       {(item.od_esf || item.od_cil || item.oi_esf || item.oi_cil) && (
                         <div className="mt-3 pt-3 border-t border-gray-200">
                           <h6 className="text-sm font-medium text-gray-700 mb-2">Receta Óptica</h6>
                           <div className="space-y-3 text-sm">
                             <div>
                               <p className="text-gray-500 font-medium mb-1">Ojo Derecho (OD)</p>
                               <div className="grid grid-cols-4 gap-2">
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">ESF:</span>
                                   <span className="font-medium">{item.od_esf || '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">CIL:</span>
                                   <span className="font-medium">{item.od_cil || '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">EJE:</span>
                                   <span className="font-medium">{item.od_eje || '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">ADD:</span>
                                   <span className="font-medium">{item.od_add || '-'}</span>
                                 </div>
                               </div>
                             </div>
                             <div>
                               <p className="text-gray-500 font-medium mb-1">Ojo Izquierdo (OI)</p>
                               <div className="grid grid-cols-4 gap-2">
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">ESF:</span>
                                   <span className="font-medium">{item.oi_esf || '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">CIL:</span>
                                   <span className="font-medium">{item.oi_cil || '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">EJE:</span>
                                   <span className="font-medium">{item.oi_eje || '-'}</span>
                                 </div>
                                 <div className="flex justify-between">
                                   <span className="text-gray-500">ADD:</span>
                                   <span className="font-medium">{item.oi_add || '-'}</span>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}

                      {/* Notes */}
                      {item.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notas:</span> {item.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No hay productos en esta venta</p>
                )}
              </div>
            </div>

            {/* Sale Notes */}
            {sale.notes && (
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">Notas de la Venta</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700">{sale.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSaleModal;
