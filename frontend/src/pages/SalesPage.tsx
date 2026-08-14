import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SortableTh, { SortOrder } from '../components/SortableTh';
import { SkeletonRows } from '../components/Skeleton';
import SaleReceipt from '../components/SaleReceipt';
import { salesService } from '../services/sales';
import { clientsService } from '../services/clients';
import { productsService } from '../services/products';
import { Sale, Client, Product, SaleProductCreate, PaginatedResponse } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useDebounce } from '../hooks/useDebounce';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';

const TABLE_COLUMNS = 5;

const SalesPage: React.FC = () => {
  const [sales, setSales]     = useState<PaginatedResponse<Sale> | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  // Sólo `sale_date` y `total_price` son ordenables: ver comentario en el <thead>.
  const [sortBy, setSortBy]       = useState('sale_date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showModal, setShowModal]           = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingSale, setEditingSale]       = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale]       = useState<Sale | null>(null);
  const [saving, setSaving]         = useState(false);
  const [savingQuick, setSavingQuick] = useState(false);

  const emptyForm = {
    client_id: '', sale_date: new Date().toISOString().split('T')[0],
    od_esf: '', od_cil: '', od_eje: '', od_add: '',
    oi_esf: '', oi_cil: '', oi_eje: '', oi_add: '',
    notes: '',
  };
  const [formData, setFormData]       = useState(emptyForm);
  const [saleProducts, setSaleProducts] = useState<Array<SaleProductCreate & { product?: Product }>>([]);
  const [selProductId, setSelProductId] = useState('');
  const [selQty, setSelQty]             = useState('1');
  const [selPrice, setSelPrice]         = useState('');

  const [newClient, setNewClient]   = useState({ name: '', document_id: '', email: '', phone: '', birth_date: '', notes: '' });
  const [newProduct, setNewProduct] = useState({ name: '', price: '', quantity: '', description: '' });

  const toast = useToast();
  const confirm = useConfirm();
  const debouncedSearch = useDebounce(search, 350);

  useEffect(() => { loadSales(); }, [page, debouncedSearch, sortBy, sortOrder]);
  useEffect(() => { loadClients(); loadProducts(); }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      setError('');
      const d = await salesService.getAll({
        page, limit: 10,
        search: debouncedSearch || undefined,
        sortBy, sortOrder,
      });
      setSales(d);
    } catch (e: any) {
      setError(e.response?.data?.error || 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  };
  const loadClients  = async () => { try { const r = await clientsService.getAll({ limit: 1000 }); setClients(r.data); } catch {} };
  const loadProducts = async () => { try { const r = await productsService.getAll({ limit: 1000 }); setProducts(r.data); } catch {} };

  const { fmt } = useCurrency();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const total = () => saleProducts.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const handleSort = (column: string, order: SortOrder) => {
    setSortBy(column);
    setSortOrder(order);
    setPage(1);
  };

  const handleAddProduct = () => {
    if (!selProductId || !selQty || !selPrice) { toast.error('Completá todos los campos del producto'); return; }
    const product = products.find(p => p.id === parseInt(selProductId));
    setSaleProducts([...saleProducts, { product_id: parseInt(selProductId), quantity: Number(selQty), unit_price: Number(selPrice), product }]);
    setSelProductId(''); setSelQty('1'); setSelPrice('');
  };

  const handleProductSelect = (id: string) => {
    setSelProductId(id);
    const p = products.find(p => p.id === parseInt(id));
    if (p?.price) setSelPrice(p.price.toString());
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingQuick) return;
    if (!newClient.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      setSavingQuick(true);
      const c = await clientsService.create(newClient);
      setClients([...clients, c]);
      setFormData({ ...formData, client_id: c.id.toString() });
      setShowClientModal(false);
      setNewClient({ name: '', document_id: '', email: '', phone: '', birth_date: '', notes: '' });
      toast.success('Cliente creado');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo crear el cliente');
    } finally {
      setSavingQuick(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingQuick) return;
    if (!newProduct.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    try {
      setSavingQuick(true);
      const p = await productsService.create({ ...newProduct, price: newProduct.price ? parseFloat(newProduct.price) : 0, quantity: newProduct.quantity ? parseInt(newProduct.quantity) : 0 });
      setProducts([...products, p]);
      setSelProductId(p.id.toString());
      setSelPrice(p.price?.toString() || '0');
      setShowProductModal(false);
      setNewProduct({ name: '', price: '', quantity: '', description: '' });
      toast.success('Producto creado');
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo crear el producto');
    } finally {
      setSavingQuick(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Doble guardia contra el doble submit: acá crear dos veces no sólo duplica
    // la venta, también descuenta el stock dos veces.
    if (saving) return;
    if (!formData.client_id) { toast.error('Seleccioná un cliente'); return; }
    if (saleProducts.length === 0) { toast.error('Agregá al menos un producto'); return; }
    try {
      setSaving(true);
      const data = {
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
        products: saleProducts.map(({ product_id, quantity, unit_price }) => ({ product_id, quantity, unit_price })),
      };
      if (editingSale) {
        await salesService.update(editingSale.id, data);
        toast.success('Venta actualizada');
      } else {
        await salesService.create(data);
        toast.success('Venta registrada');
      }
      closeModal({ force: true });
      loadSales();
      // El stock cambió: refrescamos el catálogo para que el próximo alta vea
      // las cantidades reales.
      loadProducts();
    } catch (e: any) {
      // El backend devuelve 400 con el detalle exacto del faltante
      // ("Stock insuficiente de X: quedan 2..."). Ese texto es lo más útil
      // que le podemos dar al vendedor, así que va tal cual.
      toast.error(e.response?.data?.error || 'No se pudo guardar la venta');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (sale: Sale) => {
    try {
      const full = await salesService.getById(sale.id);
      setEditingSale(full);
      setFormData({
        client_id: full.client_id.toString(),
        sale_date: full.sale_date.split('T')[0],
        od_esf: full.od_esf?.toString() || '', od_cil: full.od_cil?.toString() || '',
        od_eje: full.od_eje?.toString() || '', od_add: full.od_add?.toString() || '',
        oi_esf: full.oi_esf?.toString() || '', oi_cil: full.oi_cil?.toString() || '',
        oi_eje: full.oi_eje?.toString() || '', oi_add: full.oi_add?.toString() || '',
        notes: full.notes || '',
      });
      if (full.products) {
        const enriched = await Promise.all(full.products.map(async sp => {
          try { const p = await productsService.getById(sp.product_id); return { ...sp, product: p }; }
          catch { return sp; }
        }));
        setSaleProducts(enriched);
      }
      setShowModal(true);
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo abrir la venta');
    }
  };

  const handleDelete = async (sale: Sale) => {
    const ok = await confirm({
      title: 'Eliminar venta',
      message: `Se va a eliminar la venta de ${sale.client_name || 'este cliente'} del ${fmtDate(sale.sale_date)} por ${fmt(Number(sale.total_price) || 0)}. El stock de sus productos vuelve al inventario.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      await salesService.delete(sale.id);
      toast.success('Venta eliminada');
      loadSales();
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.error || 'No se pudo eliminar la venta');
    }
  };

  const openNewSale = () => {
    setEditingSale(null);
    setFormData(emptyForm);
    setSaleProducts([]);
    setShowModal(true);
  };

  const closeModal = (opts?: { force?: boolean }) => {
    // Con un modal rápido encima, Escape / clic en el fondo le pertenecen a ese
    // modal: cerrar el formulario de venta acá tiraría la carga a medio hacer.
    if (!opts?.force && (showClientModal || showProductModal)) return;
    setShowModal(false); setEditingSale(null);
    setFormData(emptyForm); setSaleProducts([]);
    setSelProductId(''); setSelQty('1'); setSelPrice('');
  };

  const iconBtn = (color: string): React.CSSProperties => ({
    padding: '.375rem',
    borderRadius: 'var(--radius)',
    background: 'var(--surface-3)',
    color,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
  });

  const receiptClient = receiptSale ? clients.find(c => c.id === receiptSale.client_id) : undefined;

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Ventas</h1>
            <p className="page-subtitle">{sales?.pagination.total ?? 0} ventas registradas</p>
          </div>
          <button className="btn btn-primary" onClick={openNewSale}>
            <PlusIcon className="w-4 h-4" />
            Nueva venta
          </button>
        </div>

        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <MagnifyingGlassIcon className="w-4 h-4" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por cliente…"
            aria-label="Buscar ventas por cliente"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {error && (
          <div role="alert" style={{
            background: 'var(--surface-2)', border: '1px solid var(--danger)',
            borderRadius: 'var(--radius)', padding: '.75rem 1rem', marginBottom: '1rem',
            color: 'var(--danger)', fontSize: '.875rem',
          }}>
            {error}
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  {/* Ordenables sólo las columnas que el backend acepta sin
                      ambigüedad: la lista blanca de pagination.ts no lleva
                      prefijo de tabla y la query hace JOIN con clients y optics,
                      que tienen ambas una columna `name`. Por eso "Cliente" no
                      es ordenable: `ORDER BY name` reventaría la consulta. */}
                  <SortableTh column="sale_date" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Fecha
                  </SortableTh>
                  <th>Cliente</th>
                  <th>Productos</th>
                  <SortableTh column="total_price" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} align="right">
                    Total
                  </SortableTh>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} columns={TABLE_COLUMNS} />
                ) : sales?.data && sales.data.length > 0 ? sales.data.map(sale => (
                  <tr key={sale.id}>
                    <td className="mono" style={{ color: 'var(--text-secondary)', fontSize: '.8rem', whiteSpace: 'nowrap' }}>
                      {fmtDate(sale.sale_date)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div aria-hidden="true" style={{
                          width: 30, height: 30, borderRadius: 99,
                          background: 'var(--surface-3)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '.75rem', color: 'var(--brand)', flexShrink: 0,
                        }}>
                          {(sale.client_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '.875rem' }}>{sale.client_name || 'Cliente'}</span>
                      </div>
                    </td>
                    <td>
                      {sale.products && sale.products.length > 0 ? (
                        <span className="badge badge-blue">{sale.products.length} producto{sale.products.length > 1 ? 's' : ''}</span>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>—</span>}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {fmt(Number(sale.total_price) || 0)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          onClick={() => setReceiptSale(sale)}
                          style={iconBtn('var(--text-secondary)')}
                          aria-label={`Ver comprobante de la venta de ${sale.client_name || 'cliente'}`}
                          title="Comprobante"
                        >
                          <PrinterIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(sale)}
                          style={iconBtn('var(--brand)')}
                          aria-label={`Editar la venta de ${sale.client_name || 'cliente'}`}
                          title="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sale)}
                          style={iconBtn('var(--danger)')}
                          aria-label={`Eliminar la venta de ${sale.client_name || 'cliente'}`}
                          title="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={TABLE_COLUMNS}>
                    <EmptyState
                      icon={<ChartBarIcon />}
                      title="Todavía no hay ventas"
                      description="Registrá la primera venta para empezar a llevar el historial de tus pacientes."
                      actionLabel="Nueva venta"
                      onAction={openNewSale}
                      searchTerm={debouncedSearch}
                    />
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && sales && sales.pagination.totalPages > 1 && (
            <Pagination page={sales.pagination.page} totalPages={sales.pagination.totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>

      {/* ── Sale Modal ─────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => closeModal()}
        title={editingSale ? 'Editar venta' : 'Nueva venta'}
        maxWidth={720}
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => closeModal({ force: true })} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editingSale ? 'Guardar cambios' : 'Crear venta'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Cliente + Fecha */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label htmlFor="sale-client" style={{ display: 'block', marginBottom: '.375rem' }}>Cliente *</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <select id="sale-client" required value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })} style={{ flex: 1 }}>
                  <option value="">Seleccionar cliente…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button
                  type="button"
                  onClick={() => setShowClientModal(true)}
                  style={{
                    padding: '.5rem .75rem', background: 'var(--surface-3)', color: 'var(--success)',
                    border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600,
                    fontSize: '.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <PlusIcon className="w-3.5 h-3.5" /> Nuevo
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="sale-date" style={{ display: 'block', marginBottom: '.375rem' }}>Fecha</label>
              <input id="sale-date" type="date" required value={formData.sale_date} onChange={e => setFormData({ ...formData, sale_date: e.target.value })} style={{ width: 160 }} />
            </div>
          </div>

          {/* ── Ficha óptica ─────────────────────── */}
          <div>
            <div className="section-title">Ficha óptica (opcional)</div>
            <div style={{
              background: 'var(--surface-2)', borderRadius: 'var(--radius)',
              padding: '1rem', border: '1px solid var(--border)',
            }}>
              {/* Header row */}
              <div className="optic-grid" style={{ marginBottom: '.5rem' }}>
                <div />
                {['Esf', 'Cil', 'Eje', 'Add'].map(h => (
                  <div key={h} className="col-header">{h}</div>
                ))}
              </div>
              {/* OD row */}
              <div className="optic-grid" style={{ marginBottom: '.5rem' }}>
                <div className="eye-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: 'var(--surface-3)', color: 'var(--brand)', borderRadius: 4, padding: '2px 6px', fontSize: '.65rem', fontWeight: 700 }}>OD</span>
                </div>
                {(['od_esf', 'od_cil', 'od_eje', 'od_add'] as const).map(f => (
                  <input key={f} type="number" step="0.01" value={formData[f]}
                    onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                    placeholder="—"
                    aria-label={`Ojo derecho ${f.split('_')[1]}`}
                    style={{ textAlign: 'center', padding: '.45rem .25rem', fontSize: '.8rem', minHeight: '2.1rem' }}
                  />
                ))}
              </div>
              {/* OI row */}
              <div className="optic-grid">
                <div className="eye-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ background: 'var(--surface-3)', color: 'var(--text-secondary)', borderRadius: 4, padding: '2px 6px', fontSize: '.65rem', fontWeight: 700 }}>OI</span>
                </div>
                {(['oi_esf', 'oi_cil', 'oi_eje', 'oi_add'] as const).map(f => (
                  <input key={f} type="number" step="0.01" value={formData[f]}
                    onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                    placeholder="—"
                    aria-label={`Ojo izquierdo ${f.split('_')[1]}`}
                    style={{ textAlign: 'center', padding: '.45rem .25rem', fontSize: '.8rem', minHeight: '2.1rem' }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ── Productos ─────────────────────────── */}
          <div>
            <div className="section-title">Productos *</div>

            {/* Add product row */}
            <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: '1rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 80px 110px auto auto', gap: '.5rem', alignItems: 'end', marginBottom: '.75rem' }}>
              <div>
                <label htmlFor="sale-product" style={{ display: 'block', marginBottom: '.25rem', fontSize: '.7rem' }}>Producto</label>
                <select id="sale-product" value={selProductId} onChange={e => handleProductSelect(e.target.value)}>
                  <option value="">Seleccionar…</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.quantity !== undefined && p.quantity !== null ? ` (stock: ${p.quantity})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="sale-qty" style={{ display: 'block', marginBottom: '.25rem', fontSize: '.7rem' }}>Cantidad</label>
                <input id="sale-qty" type="number" min="1" value={selQty} onChange={e => setSelQty(e.target.value)} placeholder="1" />
              </div>
              <div>
                <label htmlFor="sale-unit-price" style={{ display: 'block', marginBottom: '.25rem', fontSize: '.7rem' }}>Precio unit.</label>
                <input id="sale-unit-price" type="number" step="0.01" min="0" value={selPrice} onChange={e => setSelPrice(e.target.value)} placeholder="0.00" />
              </div>
              <button
                type="button"
                onClick={() => setShowProductModal(true)}
                style={{ height: 40, padding: '0 .625rem', background: 'var(--surface-3)', color: 'var(--success)', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '.8rem', marginTop: 'auto' }}
                aria-label="Crear un producto nuevo"
                title="Crear producto"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleAddProduct}
                style={{ height: 40, padding: '0 .75rem', background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '.8rem', marginTop: 'auto' }}
              >
                <ShoppingCartIcon className="w-4 h-4" /> Agregar
              </button>
            </div>

            {/* Product list */}
            {saleProducts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem', marginBottom: '.75rem' }}>
                {saleProducts.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '.625rem .875rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text-primary)' }}>
                        {item.product?.name || `Producto #${item.product_id}`}
                      </div>
                      <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                        {item.quantity} × {fmt(item.unit_price)}
                      </div>
                    </div>
                    <div className="mono" style={{ fontWeight: 700, fontSize: '.875rem', color: 'var(--brand)' }}>
                      {fmt(item.quantity * item.unit_price)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setSaleProducts(saleProducts.filter((_, j) => j !== i))}
                      style={{ padding: '.25rem', background: 'var(--surface-3)', color: 'var(--danger)', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex' }}
                      aria-label={`Quitar ${item.product?.name || 'producto'} de la venta`}
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '.75rem 0', borderTop: '2px solid var(--border)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '.9rem' }}>Total:</span>
              <span className="mono" style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--success)' }}>
                {fmt(total())}
              </span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label htmlFor="sale-notes" style={{ display: 'block', marginBottom: '.375rem' }}>Notas</label>
            <textarea id="sale-notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Observaciones de la venta…" rows={2} />
          </div>
        </div>
      </Modal>

      {/* ── Quick Client Modal ─────────────────────────── */}
      <Modal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Nuevo cliente rápido"
        maxWidth={400}
        onSubmit={handleCreateClient}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowClientModal(false)} disabled={savingQuick}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingQuick}>{savingQuick ? 'Creando…' : 'Crear'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label htmlFor="qc-name" style={{ display: 'block', marginBottom: '.25rem' }}>Nombre *</label>
            <input id="qc-name" type="text" required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Nombre completo" />
          </div>
          <div>
            <label htmlFor="qc-doc" style={{ display: 'block', marginBottom: '.25rem' }}>Documento</label>
            <input id="qc-doc" type="text" value={newClient.document_id} onChange={e => setNewClient({ ...newClient, document_id: e.target.value })} placeholder="CI / DNI" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div>
              <label htmlFor="qc-email" style={{ display: 'block', marginBottom: '.25rem' }}>Email</label>
              <input id="qc-email" type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
            </div>
            <div>
              <label htmlFor="qc-phone" style={{ display: 'block', marginBottom: '.25rem' }}>Teléfono</label>
              <input id="qc-phone" type="text" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      {/* ── Quick Product Modal ────────────────────────── */}
      <Modal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        title="Nuevo producto rápido"
        maxWidth={400}
        onSubmit={handleCreateProduct}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)} disabled={savingQuick}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={savingQuick}>{savingQuick ? 'Creando…' : 'Crear'}</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label htmlFor="qp-name" style={{ display: 'block', marginBottom: '.25rem' }}>Nombre *</label>
            <input id="qp-name" type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nombre del producto" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
            <div>
              <label htmlFor="qp-price" style={{ display: 'block', marginBottom: '.25rem' }}>Precio</label>
              <input id="qp-price" type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="qp-stock" style={{ display: 'block', marginBottom: '.25rem' }}>Stock</label>
              <input id="qp-stock" type="number" min="0" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} placeholder="0" />
            </div>
          </div>
          <div>
            <label htmlFor="qp-desc" style={{ display: 'block', marginBottom: '.25rem' }}>Descripción</label>
            <textarea id="qp-desc" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={2} />
          </div>
        </div>
      </Modal>

      {/* ── Comprobante imprimible ─────────────────────── */}
      <SaleReceipt
        open={receiptSale !== null}
        onClose={() => setReceiptSale(null)}
        sale={receiptSale}
        client={receiptClient}
      />
    </Layout>
  );
};

export default SalesPage;
