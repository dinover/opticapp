import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import DataTable, { Column } from '../components/DataTable';
import { SortOrder } from '../components/SortableTh';
import SaleReceipt from '../components/SaleReceipt';
import { salesService } from '../services/sales';
import { clientsService } from '../services/clients';
import { productsService } from '../services/products';
import { Sale, Client, Product, SaleProductCreate, PaginatedResponse } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

/**
 * Columnas de la ficha óptica. `es` es además el sufijo del aria-label en español
 * ("Ojo derecho esf"), que usan los tests E2E: no cambiar sin actualizarlos.
 */
const RX_FIELDS = [
  { key: 'esf', es: 'esf', en: 'sph', headEs: 'Esf', headEn: 'Sph' },
  { key: 'cil', es: 'cil', en: 'cyl', headEs: 'Cil', headEn: 'Cyl' },
  { key: 'eje', es: 'eje', en: 'axis', headEs: 'Eje', headEn: 'Axis' },
  { key: 'add', es: 'add', en: 'add', headEs: 'Add', headEn: 'Add' },
] as const;

const SalesPage: React.FC = () => {
  const [sales, setSales]     = useState<PaginatedResponse<Sale> | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  // Sólo `sale_date` y `total_price` son ordenables: ver comentario en `columns`.
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
  const { t, locale } = useLanguage();
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
      setError(e.response?.data?.error || t('No se pudieron cargar las ventas', 'Could not load sales'));
    } finally {
      setLoading(false);
    }
  };
  const loadClients  = async () => { try { const r = await clientsService.getAll({ limit: 1000 }); setClients(r.data); } catch {} };
  const loadProducts = async () => { try { const r = await productsService.getAll({ limit: 1000 }); setProducts(r.data); } catch {} };

  const { fmt } = useCurrency();
  const fmtDate = (d: string) => new Date(d).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const total = () => saleProducts.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const handleSort = (column: string, order: SortOrder) => {
    setSortBy(column);
    setSortOrder(order);
    setPage(1);
  };

  const handleAddProduct = () => {
    if (!selProductId || !selQty || !selPrice) { toast.error(t('Completá todos los campos del producto', 'Fill in all the product fields')); return; }
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
    if (!newClient.name.trim()) { toast.error(t('El nombre es obligatorio', 'Name is required')); return; }
    try {
      setSavingQuick(true);
      const c = await clientsService.create(newClient);
      setClients([...clients, c]);
      setFormData({ ...formData, client_id: c.id.toString() });
      setShowClientModal(false);
      setNewClient({ name: '', document_id: '', email: '', phone: '', birth_date: '', notes: '' });
      toast.success(t('Cliente creado', 'Client created'));
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('No se pudo crear el cliente', 'Could not create the client'));
    } finally {
      setSavingQuick(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingQuick) return;
    if (!newProduct.name.trim()) { toast.error(t('El nombre es obligatorio', 'Name is required')); return; }
    try {
      setSavingQuick(true);
      const p = await productsService.create({ ...newProduct, price: newProduct.price ? parseFloat(newProduct.price) : 0, quantity: newProduct.quantity ? parseInt(newProduct.quantity) : 0 });
      setProducts([...products, p]);
      setSelProductId(p.id.toString());
      setSelPrice(p.price?.toString() || '0');
      setShowProductModal(false);
      setNewProduct({ name: '', price: '', quantity: '', description: '' });
      toast.success(t('Producto creado', 'Product created'));
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('No se pudo crear el producto', 'Could not create the product'));
    } finally {
      setSavingQuick(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Doble guardia contra el doble submit: acá crear dos veces no sólo duplica
    // la venta, también descuenta el stock dos veces.
    if (saving) return;
    if (!formData.client_id) { toast.error(t('Seleccioná un cliente', 'Select a client')); return; }
    if (saleProducts.length === 0) { toast.error(t('Agregá al menos un producto', 'Add at least one product')); return; }
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
        toast.success(t('Venta actualizada', 'Sale updated'));
      } else {
        await salesService.create(data);
        toast.success(t('Venta registrada', 'Sale recorded'));
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
      toast.error(e.response?.data?.error || t('No se pudo guardar la venta', 'Could not save the sale'));
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
      toast.error(e.response?.data?.error || t('No se pudo abrir la venta', 'Could not open the sale'));
    }
  };

  const handleDelete = async (sale: Sale) => {
    const clientName = sale.client_name || t('este cliente', 'this client');
    const amount = fmt(Number(sale.total_price) || 0);
    const ok = await confirm({
      title: t('Eliminar venta', 'Delete sale'),
      message: t(
        `Se va a eliminar la venta de ${clientName} del ${fmtDate(sale.sale_date)} por ${amount}. El stock de sus productos vuelve al inventario.`,
        `The sale to ${clientName} on ${fmtDate(sale.sale_date)} for ${amount} will be deleted. Its products go back into stock.`,
      ),
      confirmLabel: t('Eliminar', 'Delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await salesService.delete(sale.id);
      toast.success(t('Venta eliminada', 'Sale deleted'));
      loadSales();
      loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.error || t('No se pudo eliminar la venta', 'Could not delete the sale'));
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

  const receiptClient = receiptSale ? clients.find(c => c.id === receiptSale.client_id) : undefined;
  const totalSales = sales?.pagination.total ?? 0;

  // Ordenables sólo las columnas que el backend acepta sin ambigüedad: la lista
  // blanca de pagination.ts no lleva prefijo de tabla y la query hace JOIN con
  // clients y optics, que tienen ambas una columna `name`. Por eso "Cliente" no
  // es ordenable: `ORDER BY name` reventaría la consulta.
  const columns: Column<Sale>[] = [
    {
      key: 'date',
      header: t('Fecha', 'Date'),
      sortKey: 'sale_date',
      mobile: 'secondary',
      render: s => <span className="mono cell-secondary" style={{ fontSize: '.8rem', whiteSpace: 'nowrap' }}>{fmtDate(s.sale_date)}</span>,
    },
    {
      key: 'client',
      header: t('Cliente', 'Client'),
      mobile: 'primary',
      render: s => (
        <div className="who">
          <span className="avatar sm" aria-hidden="true">{(s.client_name || 'C').charAt(0).toUpperCase()}</span>
          <span className="who-name">{s.client_name || t('Cliente', 'Client')}</span>
        </div>
      ),
    },
    {
      key: 'products',
      header: t('Productos', 'Products'),
      render: s => {
        const count = s.products?.length ?? 0;
        return count > 0 ? (
          <span className="badge badge-violet">
            {t(`${count} producto${count > 1 ? 's' : ''}`, `${count} product${count > 1 ? 's' : ''}`)}
          </span>
        ) : <span className="cell-muted">—</span>;
      },
    },
    {
      key: 'total',
      header: 'Total',
      sortKey: 'total_price',
      align: 'right',
      render: s => <span className="amount is-success">{fmt(Number(s.total_price) || 0)}</span>,
    },
  ];

  const eyeRow = (side: 'od' | 'oi') => {
    const eye = side === 'od' ? t('Ojo derecho', 'Right eye') : t('Ojo izquierdo', 'Left eye');
    return (
      <div className="optic-grid">
        <div className="eye-label">
          <span className={`eye-tag${side === 'od' ? ' od' : ''}`}>{side === 'od' ? 'OD' : t('OI', 'OS')}</span>
        </div>
        {RX_FIELDS.map(f => {
          const key = `${side}_${f.key}` as keyof typeof formData;
          return (
            <input
              key={key}
              type="number"
              step="0.01"
              value={formData[key]}
              onChange={e => setFormData({ ...formData, [key]: e.target.value })}
              placeholder="—"
              aria-label={t(`${eye} ${f.es}`, `${eye} ${f.en}`)}
            />
          );
        })}
      </div>
    );
  };

  return (
    <Layout>
      <div className="fade-in">
        <PageHeader
          eyebrow={t('Mostrador', 'Front desk')}
          title={t('Ventas', 'Sales')}
          subtitle={t(
            `${totalSales} venta${totalSales !== 1 ? 's' : ''} registrada${totalSales !== 1 ? 's' : ''}`,
            `${totalSales} recorded sale${totalSales !== 1 ? 's' : ''}`,
          )}
          actions={
            <button className="btn btn-cta" onClick={openNewSale}>
              <PlusIcon className="w-4 h-4" />
              {t('Nueva venta', 'New sale')}
            </button>
          }
        />

        <div className="toolbar">
          <div className="search-wrap" style={{ maxWidth: 360, flex: 1 }}>
            <MagnifyingGlassIcon className="w-4 h-4" />
            <input
              type="text"
              className="search-input"
              placeholder={t('Buscar por cliente…', 'Search by client…')}
              aria-label={t('Buscar ventas por cliente', 'Search sales by client')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <ExclamationCircleIcon />
            <span>{error}</span>
          </div>
        )}

        <DataTable
          rows={sales?.data ?? []}
          columns={columns}
          rowKey={s => s.id}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actionsLabel={t('Acciones', 'Actions')}
          actions={sale => {
            const who = sale.client_name || t('cliente', 'client');
            return (
              <>
                <button
                  className="btn-icon sm"
                  onClick={() => setReceiptSale(sale)}
                  aria-label={t(`Ver comprobante de la venta de ${who}`, `View receipt for the sale to ${who}`)}
                  title={t('Comprobante', 'Receipt')}
                >
                  <PrinterIcon />
                </button>
                <button
                  className="btn-icon sm"
                  onClick={() => handleEdit(sale)}
                  aria-label={t(`Editar la venta de ${who}`, `Edit the sale to ${who}`)}
                  title={t('Editar', 'Edit')}
                >
                  <PencilIcon />
                </button>
                <button
                  className="btn-icon sm is-danger"
                  onClick={() => handleDelete(sale)}
                  aria-label={t(`Eliminar la venta de ${who}`, `Delete the sale to ${who}`)}
                  title={t('Eliminar', 'Delete')}
                >
                  <TrashIcon />
                </button>
              </>
            );
          }}
          empty={
            <EmptyState
              icon={<ChartBarIcon />}
              title={t('Todavía no hay ventas', 'No sales yet')}
              description={t(
                'Registrá la primera venta para empezar a llevar el historial de tus pacientes.',
                'Record your first sale to start building your patients’ history.',
              )}
              actionLabel={t('Nueva venta', 'New sale')}
              onAction={openNewSale}
              searchTerm={debouncedSearch}
            />
          }
          footer={!loading && sales && sales.pagination.totalPages > 1 && (
            <Pagination page={sales.pagination.page} totalPages={sales.pagination.totalPages} onPageChange={setPage} />
          )}
        />
      </div>

      {/* ── Sale Modal ─────────────────────────────────── */}
      <Modal
        open={showModal}
        onClose={() => closeModal()}
        title={editingSale ? t('Editar venta', 'Edit sale') : t('Nueva venta', 'New sale')}
        maxWidth={720}
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => closeModal({ force: true })} disabled={saving}>
              {t('Cancelar', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-cta" disabled={saving}>
              {saving ? t('Guardando…', 'Saving…') : editingSale ? t('Guardar cambios', 'Save changes') : t('Crear venta', 'Create sale')}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>

          {/* Cliente + Fecha */}
          <div className="sale-head-grid">
            <div className="field">
              <label htmlFor="sale-client">{t('Cliente *', 'Client *')}</label>
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <select id="sale-client" required value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })} style={{ flex: 1 }}>
                  <option value="">{t('Seleccionar cliente…', 'Select client…')}</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button type="button" className="quick-add" onClick={() => setShowClientModal(true)}>
                  <PlusIcon className="w-3.5 h-3.5" /> {t('Nuevo', 'New')}
                </button>
              </div>
            </div>
            <div className="field">
              <label htmlFor="sale-date">{t('Fecha', 'Date')}</label>
              <input id="sale-date" type="date" required value={formData.sale_date} onChange={e => setFormData({ ...formData, sale_date: e.target.value })} style={{ width: 160 }} />
            </div>
          </div>

          {/* ── Ficha óptica ─────────────────────── */}
          <div>
            <div className="section-title">{t('Ficha óptica (opcional)', 'Prescription (optional)')}</div>
            <div className="rx-box">
              <div className="optic-grid">
                <div />
                {RX_FIELDS.map(f => (
                  <div key={f.key} className="col-header">{t(f.headEs, f.headEn)}</div>
                ))}
              </div>
              {eyeRow('od')}
              {eyeRow('oi')}
            </div>
          </div>

          {/* ── Productos ─────────────────────────── */}
          <div>
            <div className="section-title">{t('Productos *', 'Products *')}</div>

            <div className="sale-add-row add-row-box">
              <div className="field">
                <label htmlFor="sale-product">{t('Producto', 'Product')}</label>
                <select id="sale-product" value={selProductId} onChange={e => handleProductSelect(e.target.value)}>
                  <option value="">{t('Seleccionar…', 'Select…')}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}{p.quantity !== undefined && p.quantity !== null ? ` (stock: ${p.quantity})` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="sale-qty">{t('Cantidad', 'Quantity')}</label>
                <input id="sale-qty" type="number" min="1" value={selQty} onChange={e => setSelQty(e.target.value)} placeholder="1" />
              </div>
              <div className="field">
                <label htmlFor="sale-unit-price">{t('Precio unit.', 'Unit price')}</label>
                <input id="sale-unit-price" type="number" step="0.01" min="0" value={selPrice} onChange={e => setSelPrice(e.target.value)} placeholder="0.00" />
              </div>
              <button
                type="button"
                className="quick-add"
                onClick={() => setShowProductModal(true)}
                aria-label={t('Crear un producto nuevo', 'Create a new product')}
                title={t('Crear producto', 'Create product')}
                style={{ marginTop: 'auto', height: 40 }}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
              <button type="button" className="btn btn-primary btn-add" onClick={handleAddProduct}>
                <ShoppingCartIcon className="w-4 h-4" /> {t('Agregar', 'Add')}
              </button>
            </div>

            {saleProducts.length > 0 && (
              <div className="line-items">
                {saleProducts.map((item, i) => (
                  <div key={i} className="line-item">
                    <div className="line-item-main">
                      <div className="line-item-name">
                        {item.product?.name || t(`Producto #${item.product_id}`, `Product #${item.product_id}`)}
                      </div>
                      <div className="line-item-sub">{item.quantity} × {fmt(item.unit_price)}</div>
                    </div>
                    <div className="amount is-brand">{fmt(item.quantity * item.unit_price)}</div>
                    <button
                      type="button"
                      className="btn-icon sm is-danger"
                      onClick={() => setSaleProducts(saleProducts.filter((_, j) => j !== i))}
                      aria-label={t(
                        `Quitar ${item.product?.name || 'producto'} de la venta`,
                        `Remove ${item.product?.name || 'product'} from the sale`,
                      )}
                    >
                      <XMarkIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="sale-total">
              <span className="sale-total-label">Total:</span>
              <span className="sale-total-value">{fmt(total())}</span>
            </div>
          </div>

          {/* Notas */}
          <div className="field">
            <label htmlFor="sale-notes">{t('Notas', 'Notes')}</label>
            <textarea id="sale-notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder={t('Observaciones de la venta…', 'Notes about the sale…')} rows={2} />
          </div>
        </div>
      </Modal>

      {/* ── Quick Client Modal ─────────────────────────── */}
      <Modal
        open={showClientModal}
        onClose={() => setShowClientModal(false)}
        title={t('Nuevo cliente rápido', 'Quick new client')}
        maxWidth={400}
        onSubmit={handleCreateClient}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowClientModal(false)} disabled={savingQuick}>{t('Cancelar', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={savingQuick}>{savingQuick ? t('Creando…', 'Creating…') : t('Crear', 'Create')}</button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="qc-name">{t('Nombre *', 'Name *')}</label>
          <input id="qc-name" type="text" required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder={t('Nombre completo', 'Full name')} />
        </div>
        <div className="field">
          <label htmlFor="qc-doc">{t('Documento', 'ID number')}</label>
          <input id="qc-doc" type="text" value={newClient.document_id} onChange={e => setNewClient({ ...newClient, document_id: e.target.value })} placeholder={t('CI / DNI', 'ID / Passport')} />
        </div>
        <div className="form-grid-2 tight">
          <div className="field">
            <label htmlFor="qc-email">Email</label>
            <input id="qc-email" type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="qc-phone">{t('Teléfono', 'Phone')}</label>
            <input id="qc-phone" type="text" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} />
          </div>
        </div>
      </Modal>

      {/* ── Quick Product Modal ────────────────────────── */}
      <Modal
        open={showProductModal}
        onClose={() => setShowProductModal(false)}
        title={t('Nuevo producto rápido', 'Quick new product')}
        maxWidth={400}
        onSubmit={handleCreateProduct}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => setShowProductModal(false)} disabled={savingQuick}>{t('Cancelar', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={savingQuick}>{savingQuick ? t('Creando…', 'Creating…') : t('Crear', 'Create')}</button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="qp-name">{t('Nombre *', 'Name *')}</label>
          <input id="qp-name" type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder={t('Nombre del producto', 'Product name')} />
        </div>
        <div className="form-grid-2 tight">
          <div className="field">
            <label htmlFor="qp-price">{t('Precio', 'Price')}</label>
            <input id="qp-price" type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="field">
            <label htmlFor="qp-stock">Stock</label>
            <input id="qp-stock" type="number" min="0" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} placeholder="0" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="qp-desc">{t('Descripción', 'Description')}</label>
          <textarea id="qp-desc" value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={2} />
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
