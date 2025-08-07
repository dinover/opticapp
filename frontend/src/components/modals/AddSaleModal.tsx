import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Client, Product } from '../../types';
import { salesAPI } from '../../services/api';

interface SaleItem {
  product_id?: number | string;
  unregistered_product_name?: string;
  quantity: number;
  unit_price: number;
  od_esf?: number;
  od_cil?: number;
  od_eje?: number;
  od_add?: number;
  oi_esf?: number;
  oi_cil?: number;
  oi_eje?: number;
  oi_add?: number;
  notes?: string;
}

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
  clients: Client[];
  products: Product[];
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({
  isOpen,
  onClose,
  onSaleCreated,
  clients,
  products
}) => {
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [unregisteredClientName, setUnregisteredClientName] = useState('');
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const addProductItem = () => {
    setSaleItems([...saleItems, {
      product_id: '',
      unregistered_product_name: '',
      quantity: 1,
      unit_price: 0
    }]);
  };

  const updateItem = (index: number, field: keyof SaleItem, value: any) => {
    const updatedItems = [...saleItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setSaleItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (saleItems.length === 0) {
      alert('Debe agregar al menos un producto a la venta');
      return;
    }

    if (!selectedClient && !unregisteredClientName) {
      alert('Debe seleccionar un cliente o ingresar un nombre');
      return;
    }

    // Validar que cada item tenga producto y precio
    for (const item of saleItems) {
      if (!item.product_id && !item.unregistered_product_name) {
        alert('Cada producto debe tener un nombre o ser seleccionado del catálogo');
        return;
      }
      if (item.unit_price <= 0) {
        alert('Cada producto debe tener un precio válido');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await salesAPI.create({
        client_id: selectedClient !== 'unregistered' ? parseInt(selectedClient) : undefined,
        unregistered_client_name: selectedClient === 'unregistered' ? unregisteredClientName : undefined,
        items: saleItems.map(item => ({
          ...item,
          product_id: typeof item.product_id === 'number' ? item.product_id : undefined,
          unregistered_product_name: typeof item.product_id === 'string' && item.product_id !== '' ? item.unregistered_product_name : undefined
        })),
        notes
      });

      alert('Venta creada exitosamente');
      onSaleCreated();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error al crear la venta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedClient('');
    setUnregisteredClientName('');
    setSaleItems([]);
    setNotes('');
  };

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => total + (item.quantity * item.unit_price), 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nueva Venta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del cliente */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h3>
              
              <div className="space-y-4">
                {/* Cliente registrado */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      setSelectedClient(e.target.value);
                      if (e.target.value !== 'unregistered') setUnregisteredClientName('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Seleccionar cliente...</option>
                    <option value="unregistered">Cliente no registrado</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id.toString()}>
                        {client.first_name} {client.last_name} - {client.dni}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cliente no registrado - solo mostrar si se selecciona "Cliente no registrado" */}
                {selectedClient === 'unregistered' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del Cliente No Registrado
                    </label>
                    <input
                      type="text"
                      value={unregisteredClientName}
                      onChange={(e) => setUnregisteredClientName(e.target.value)}
                      placeholder="Nombre del cliente"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Lista de productos */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Productos de la Venta</h3>
                <button
                  type="button"
                  onClick={addProductItem}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Agregar Producto</span>
                </button>
              </div>

              <div className="space-y-4">
                {saleItems.map((item, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Producto {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Producto registrado */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Producto
                        </label>
                        <select
                          value={item.product_id?.toString() || ''}
                          onChange={(e) => {
                            const productId = e.target.value;
                            console.log('Selected product ID:', productId); // Debug
                            
                            if (productId === 'unregistered') {
                              updateItem(index, 'product_id', 'unregistered');
                              updateItem(index, 'unregistered_product_name', '');
                              updateItem(index, 'unit_price', 0);
                            } else if (productId) {
                              const product = products.find(p => p.id === parseInt(productId));
                              updateItem(index, 'product_id', parseInt(productId));
                              updateItem(index, 'unregistered_product_name', '');
                              if (product) {
                                updateItem(index, 'unit_price', product.price);
                              }
                            } else {
                              updateItem(index, 'product_id', '');
                              updateItem(index, 'unregistered_product_name', '');
                              updateItem(index, 'unit_price', 0);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                          <option value="">Seleccionar producto...</option>
                          <option value="unregistered">Producto no registrado</option>
                          {products.map((product) => (
                            <option key={product.id} value={product.id}>
                              {product.name} - {formatCurrency(product.price)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Producto no registrado - solo mostrar si se selecciona "Producto no registrado" */}
                      {item.product_id === 'unregistered' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nombre del Producto No Registrado
                          </label>
                          <input
                            type="text"
                            value={item.unregistered_product_name || ''}
                            onChange={(e) => {
                              updateItem(index, 'unregistered_product_name', e.target.value);
                            }}
                            placeholder="Nombre del producto"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                      )}

                      {/* Cantidad */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cantidad
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      {/* Precio unitario */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Precio Unitario
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      {/* Subtotal */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subtotal
                        </label>
                        <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                          {formatCurrency(item.quantity * item.unit_price)}
                        </div>
                      </div>
                    </div>

                    {/* Graduaciones */}
                    <div className="mt-4">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                          Graduación (Opcional)
                        </summary>
                        <div className="mt-3 space-y-4">
                          {/* Ojo Derecho */}
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-700">Ojo Derecho (OD)</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600">Esfera</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={item.od_esf || ''}
                                  onChange={(e) => updateItem(index, 'od_esf', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Cilindro</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={item.od_cil || ''}
                                  onChange={(e) => updateItem(index, 'od_cil', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Eje</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={item.od_eje || ''}
                                  onChange={(e) => updateItem(index, 'od_eje', e.target.value ? parseInt(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Adición</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={item.od_add || ''}
                                  onChange={(e) => updateItem(index, 'od_add', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Ojo Izquierdo */}
                          <div className="space-y-3">
                            <h5 className="font-medium text-gray-700">Ojo Izquierdo (OI)</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-gray-600">Esfera</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={item.oi_esf || ''}
                                  onChange={(e) => updateItem(index, 'oi_esf', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Cilindro</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={item.oi_cil || ''}
                                  onChange={(e) => updateItem(index, 'oi_cil', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Eje</label>
                                <input
                                  type="number"
                                  min="0"
                                  max="180"
                                  value={item.oi_eje || ''}
                                  onChange={(e) => updateItem(index, 'oi_eje', e.target.value ? parseInt(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-600">Adición</label>
                                <input
                                  type="number"
                                  step="0.25"
                                  value={item.oi_add || ''}
                                  onChange={(e) => updateItem(index, 'oi_add', e.target.value ? parseFloat(e.target.value) : undefined)}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </details>
                    </div>

                    {/* Notas del producto */}
                    <div className="mt-3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notas del Producto
                      </label>
                      <textarea
                        value={item.notes || ''}
                        onChange={(e) => updateItem(index, 'notes', e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        placeholder="Notas adicionales..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notas de la venta */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notas de la Venta
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Notas adicionales..."
              />
            </div>

            {/* Total y botones */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-gray-900">Total de la Venta</span>
                <span className="text-xl font-bold text-gray-900">
                  {formatCurrency(getTotalAmount())}
                </span>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || saleItems.length === 0}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Creando...' : 'Crear Venta'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSaleModal; 