import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, ShoppingCart, Users, Package, DollarSign } from 'lucide-react';
import { salesAPI, clientsAPI, productsAPI } from '../../services/api';
import { Client, Product } from '../../types';
import toast from 'react-hot-toast';

const saleSchema = z.object({
  client_id: z.any().optional(),
  product_id: z.any().optional(),
  quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  total_price: z.number().min(0, 'El precio total debe ser mayor a 0'),
  notes: z.string().optional(),
  // Campos de prescripción óptica
  od_esf: z.string().optional(),
  od_cil: z.string().optional(),
  od_eje: z.string().optional(),
  od_add: z.string().optional(),
  oi_esf: z.string().optional(),
  oi_cil: z.string().optional(),
  oi_eje: z.string().optional(),
  oi_add: z.string().optional(),
});

type SaleFormData = z.infer<typeof saleSchema>;

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [useUnregisteredClient, setUseUnregisteredClient] = useState(false);
  const [useUnregisteredProduct, setUseUnregisteredProduct] = useState(false);
  const [unregisteredClientName, setUnregisteredClientName] = useState('');
  const [unregisteredProductName, setUnregisteredProductName] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<SaleFormData>({
    resolver: zodResolver(saleSchema),
    mode: 'onSubmit',
  });

  const quantity = watch('quantity');
  const productId = watch('product_id');

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (productId && products.length > 0) {
      const product = products.find(p => p.id === productId);
      if (product) {
        setSelectedProduct(product);
        const total = product.price * (quantity || 1);
        setValue('total_price', total);
      }
    } else {
      setSelectedProduct(null);
    }
  }, [productId, quantity, products, setValue]);

  const fetchClients = async () => {
    try {
      const data = await clientsAPI.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await productsAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    `${client.first_name} ${client.last_name}`.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.dni.includes(clientSearchTerm)
  );

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.brand.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
    product.model.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const onSubmit = async (data: SaleFormData) => {
    try {
      setLoading(true);
      
      // Prepare sale data based on selections
      const saleData: any = {
        quantity: data.quantity,
        total_price: data.total_price,
        sale_date: new Date().toISOString(),
        notes: data.notes || undefined,
        od_esf: data.od_esf || undefined,
        od_cil: data.od_cil || undefined,
        od_eje: data.od_eje || undefined,
        od_add: data.od_add || undefined,
        oi_esf: data.oi_esf || undefined,
        oi_cil: data.oi_cil || undefined,
        oi_eje: data.oi_eje || undefined,
        oi_add: data.oi_add || undefined,
      };

      // Add client_id only if using registered client and it's a valid number
      if (!useUnregisteredClient && data.client_id && typeof data.client_id === 'number' && !isNaN(data.client_id) && data.client_id > 0) {
        saleData.client_id = data.client_id;
      } else if (useUnregisteredClient && unregisteredClientName.trim()) {
        saleData.unregistered_client_name = unregisteredClientName.trim();
      }

      // Add product_id only if using registered product and it's a valid number
      if (!useUnregisteredProduct && data.product_id && typeof data.product_id === 'number' && !isNaN(data.product_id) && data.product_id > 0) {
        saleData.product_id = data.product_id;
      } else if (useUnregisteredProduct && unregisteredProductName.trim()) {
        saleData.unregistered_product_name = unregisteredProductName.trim();
      }
      
      await salesAPI.create(saleData);
      
      toast.success('Venta registrada exitosamente');
      reset();
      setSelectedProduct(null);
      setClientSearchTerm('');
      setProductSearchTerm('');
      setUseUnregisteredClient(false);
      setUseUnregisteredProduct(false);
      setUnregisteredClientName('');
      setUnregisteredProductName('');
      onSuccess();
      onClose();
    } catch (error: any) {
      const message = error.response?.data?.error || 'Error al registrar la venta';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedProduct(null);
    setClientSearchTerm('');
    setProductSearchTerm('');
    setUseUnregisteredClient(false);
    setUseUnregisteredProduct(false);
    setUnregisteredClientName('');
    setUnregisteredProductName('');
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Registrar Nueva Venta</h3>
                <p className="text-sm text-gray-500">Selecciona el cliente y producto</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                         {/* Client Selection */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Cliente
               </label>
               
               {/* Client Type Selection */}
               <div className="flex items-center space-x-4 mb-3">
                 <label className="flex items-center">
                   <input
                     type="radio"
                     checked={!useUnregisteredClient}
                     onChange={() => setUseUnregisteredClient(false)}
                     className="mr-2"
                   />
                   <span className="text-sm">Cliente registrado</span>
                 </label>
                 <label className="flex items-center">
                   <input
                     type="radio"
                     checked={useUnregisteredClient}
                     onChange={() => setUseUnregisteredClient(true)}
                     className="mr-2"
                   />
                   <span className="text-sm">Cliente no registrado</span>
                 </label>
               </div>

               {!useUnregisteredClient ? (
                 <>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Users className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                       type="text"
                       placeholder="Buscar cliente por nombre o DNI..."
                       value={clientSearchTerm}
                       onChange={(e) => setClientSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     />
                   </div>
                   <select
                     {...register('client_id', { 
                       valueAsNumber: true,
                       setValueAs: (value) => value === '' ? undefined : Number(value)
                     })}
                     className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   >
                     <option value="">Selecciona un cliente</option>
                     {filteredClients.map((client) => (
                       <option key={client.id} value={client.id}>
                         {client.first_name} {client.last_name} - DNI: {client.dni}
                       </option>
                     ))}
                   </select>
                 </>
               ) : (
                 <input
                   type="text"
                   placeholder="Nombre del cliente no registrado..."
                   value={unregisteredClientName}
                   onChange={(e) => setUnregisteredClientName(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                 />
               )}
             </div>

                         {/* Product Selection */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Producto
               </label>
               
               {/* Product Type Selection */}
               <div className="flex items-center space-x-4 mb-3">
                 <label className="flex items-center">
                   <input
                     type="radio"
                     checked={!useUnregisteredProduct}
                     onChange={() => setUseUnregisteredProduct(false)}
                     className="mr-2"
                   />
                   <span className="text-sm">Producto registrado</span>
                 </label>
                 <label className="flex items-center">
                   <input
                     type="radio"
                     checked={useUnregisteredProduct}
                     onChange={() => setUseUnregisteredProduct(true)}
                     className="mr-2"
                   />
                   <span className="text-sm">Producto no registrado</span>
                 </label>
               </div>

               {!useUnregisteredProduct ? (
                 <>
                   <div className="relative">
                     <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                       <Package className="h-5 w-5 text-gray-400" />
                     </div>
                     <input
                       type="text"
                       placeholder="Buscar producto por nombre, marca o modelo..."
                       value={productSearchTerm}
                       onChange={(e) => setProductSearchTerm(e.target.value)}
                       className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     />
                   </div>
                   <select
                     {...register('product_id', { 
                       valueAsNumber: true,
                       setValueAs: (value) => value === '' ? undefined : Number(value)
                     })}
                     className="w-full mt-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   >
                     <option value="">Selecciona un producto</option>
                     {filteredProducts.map((product) => (
                       <option key={product.id} value={product.id}>
                         {product.name} - {product.brand} {product.model} - Stock: {product.stock_quantity}
                       </option>
                     ))}
                   </select>
                 </>
               ) : (
                 <input
                   type="text"
                   placeholder="Descripción del producto no registrado..."
                   value={unregisteredProductName}
                   onChange={(e) => setUnregisteredProductName(e.target.value)}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                 />
               )}
             </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  {selectedProduct.image_url ? (
                    <img
                      src={selectedProduct.image_url}
                      alt={selectedProduct.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{selectedProduct.name}</h4>
                    <p className="text-sm text-gray-600">
                      {selectedProduct.brand} - {selectedProduct.model} ({selectedProduct.color})
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock disponible: {selectedProduct.stock_quantity}
                    </p>
                    <p className="text-lg font-semibold text-primary-600">
                      {formatCurrency(selectedProduct.price)}
                    </p>
                  </div>
                </div>
              </div>
            )}

                         {/* Quantity and Total */}
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Cantidad *
                 </label>
                 <input
                   {...register('quantity', { valueAsNumber: true })}
                   type="number"
                   min="1"
                   max={selectedProduct?.stock_quantity || 1}
                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                   placeholder="1"
                 />
                 {errors.quantity && (
                   <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                 )}
               </div>

               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Precio Total *
                 </label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <DollarSign className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                     {...register('total_price', { valueAsNumber: true })}
                     type="number"
                     step="0.01"
                     min="0"
                     className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                     placeholder="0.00"
                   />
                 </div>
                 {errors.total_price && (
                   <p className="mt-1 text-sm text-red-600">{errors.total_price.message}</p>
                 )}
               </div>
             </div>

             {/* Notes */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 Notas
               </label>
               <textarea
                 {...register('notes')}
                 rows={3}
                 className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                 placeholder="Notas adicionales sobre la venta..."
               />
             </div>

             {/* Prescripción Óptica */}
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-3">
                 Prescripción Óptica (Opcional)
               </label>
               
               {/* Ojo Derecho (OD) */}
               <div className="mb-4">
                 <h4 className="text-sm font-medium text-gray-700 mb-2">Ojo Derecho (OD)</h4>
                 <div className="grid grid-cols-4 gap-2">
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Esf</label>
                     <input
                       {...register('od_esf')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Cil</label>
                     <input
                       {...register('od_cil')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Eje</label>
                     <input
                       {...register('od_eje')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Add</label>
                     <input
                       {...register('od_add')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                 </div>
               </div>

               {/* Ojo Izquierdo (OI) */}
               <div>
                 <h4 className="text-sm font-medium text-gray-700 mb-2">Ojo Izquierdo (OI)</h4>
                 <div className="grid grid-cols-4 gap-2">
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Esf</label>
                     <input
                       {...register('oi_esf')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Cil</label>
                     <input
                       {...register('oi_cil')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Eje</label>
                     <input
                       {...register('oi_eje')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0"
                     />
                   </div>
                   <div>
                     <label className="block text-xs text-gray-600 mb-1">Add</label>
                     <input
                       {...register('oi_add')}
                       type="text"
                       className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                       placeholder="0.00"
                     />
                   </div>
                 </div>
               </div>
             </div>



            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                className="btn-outline"
                disabled={loading}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registrando...</span>
                  </div>
                ) : (
                  'Registrar Venta'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddSaleModal; 