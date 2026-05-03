import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { salesService } from '../services/sales';
import { clientsService } from '../services/clients';
import { productsService } from '../services/products';
import { Sale, Client, Product, SaleProductCreate, PaginatedResponse } from '../types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  ShoppingCartIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const SalesPage: React.FC = () => {
  const [sales, setSales]     = useState<PaginatedResponse<Sale> | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [search, setSearch]   = useState('');
  const [page, setPage]       = useState(1);
  const [showModal, setShowModal]           = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingSale, setEditingSale]       = useState<Sale | null>(null);

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

  useEffect(() => { loadSales(); loadClients(); loadProducts(); }, [page, search]);

  const loadSales    = async () => { try { setLoading(true); const d = await salesService.getAll({ page, limit: 10, search: search || undefined, sortBy: 'sale_date', sortOrder: 'DESC' }); setSales(d); } catch (e: any) { setError(e.response?.data?.error || 'Error'); } finally { setLoading(false); } };
  const loadClients  = async () => { try { const r = await clientsService.getAll({ limit: 1000 }); setClients(r.data); } catch {} };
  const loadProducts = async () => { try { const r = await productsService.getAll({ limit: 1000 }); setProducts(r.data); } catch {} };

  const fmt = (n: number) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(n);
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const total = () => saleProducts.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  const handleAddProduct = () => {
    if (!selProductId || !selQty || !selPrice) { alert('Completá todos los campos del producto'); return; }
    const product = products.find(p => p.id === parseInt(selProductId));
    setSaleProducts([...saleProducts, { product_id: parseInt(selProductId), quantity: Number(selQty), unit_price: Number(selPrice), product }]);
    setSelProductId(''); setSelQty('1'); setSelPrice('');
  };

  const handleProductSelect = (id: string) => {
    setSelProductId(id);
    const p = products.find(p => p.id === parseInt(id));
    if (p?.price) setSelPrice(p.price.toString());
  };

  const handleCreateClient = async () => {
    if (!newClient.name) { alert('El nombre es obligatorio'); return; }
    try {
      const c = await clientsService.create(newClient);
      setClients([...clients, c]);
      setFormData({ ...formData, client_id: c.id.toString() });
      setShowClientModal(false);
      setNewClient({ name: '', document_id: '', email: '', phone: '', birth_date: '', notes: '' });
    } catch (e: any) { alert(e.response?.data?.error || 'Error'); }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name) { alert('El nombre es obligatorio'); return; }
    try {
      const p = await productsService.create({ ...newProduct, price: newProduct.price ? parseFloat(newProduct.price) : 0, quantity: newProduct.quantity ? parseInt(newProduct.quantity) : 0 });
      setProducts([...products, p]);
      setSelProductId(p.id.toString());
      setSelPrice(p.price?.toString() || '0');
      setShowProductModal(false);
      setNewProduct({ name: '', price: '', quantity: '', description: '' });
    } catch (e: any) { alert(e.response?.data?.error || 'Error'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.client_id) { alert('Seleccioná un cliente'); return; }
    if (saleProducts.length === 0) { alert('Agregá al menos un producto'); return; }
    try {
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
      if (editingSale) await salesService.update(editingSale.id, data);
      else await salesService.create(data);
      closeModal();
      loadSales();
    } catch (e: any) { alert(e.response?.data?.error || 'Error al guardar'); }
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
    } catch (e: any) { alert(e.response?.data?.error || 'Error'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar esta venta?')) return;
    try { await salesService.delete(id); loadSales(); }
    catch (e: any) { alert(e.response?.data?.error || 'Error'); }
  };

  const closeModal = () => {
    setShowModal(false); setEditingSale(null);
    setFormData(emptyForm); setSaleProducts([]);
    setSelProductId(''); setSelQty('1'); setSelPrice('');
  };

  const numInput = (val: string, field: string) => (
    <input
      type="number" step="0.01" value={(formData as any)[field]}
      onChange={e => setFormData({ ...formData, [field]: e.target.value })}
      placeholder="—"
      style={{ textAlign: 'center', padding: '.5rem .375rem !important', fontSize: '.8rem' }}
    />
  );

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Ventas</h1>
            <p className="page-subtitle">{sales?.pagination.total ?? 0} ventas registradas</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingSale(null); setFormData(emptyForm); setSaleProducts([]); setShowModal(true); }}>
            <PlusIcon className="w-4 h-4" />
            Nueva venta
          </button>
        </div>

        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <MagnifyingGlassIcon className="w-4 h-4" />
          <input type="text" className="search-input" placeholder="Buscar por cliente…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '.875rem' }}>{error}</div>}

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Productos</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sales?.data && sales.data.length > 0 ? sales.data.map(sale => (
                    <tr key={sale.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '.8rem', fontFamily: 'DM Mono, monospace', whiteSpace: 'nowrap' }}>
                        {fmtDate(sale.sale_date)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 99,
                            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '.75rem', color: '#1d4ed8', flexShrink: 0,
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
                      <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: '#10b981' }}>
                        {fmt(Number(sale.total_price) || 0)}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button onClick={() => handleEdit(sale)} style={{ padding: '.375rem', borderRadius: 7, background: '#eef2ff', color: '#4f46e5', border: 'none', cursor: 'pointer' }} title="Editar">
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(sale.id)} style={{ padding: '.375rem', borderRadius: 7, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Eliminar">
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5}>
                      <div className="empty-state">
                        <ChartBarIcon style={{ width: 40, height: 40, margin: '0 auto 0.75rem' }} />
                        <p>No hay ventas registradas</p>
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
              {sales && sales.pagination.totalPages > 1 && (
                <Pagination page={sales.pagination.page} totalPages={sales.pagination.totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sale Modal ─────────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: 720 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--surface)', zIndex: 1 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {editingSale ? 'Editar venta' : 'Nueva venta'}
              </h3>
              <button onClick={closeModal} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Cliente + Fecha */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'end' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Cliente *</label>
                    <div style={{ display: 'flex', gap: '.5rem' }}>
                      <select required value={formData.client_id} onChange={e => setFormData({ ...formData, client_id: e.target.value })} style={{ flex: 1 }}>
                        <option value="">Seleccionar cliente…</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      <button type="button" onClick={() => setShowClientModal(true)} style={{ padding: '.5rem .75rem', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '.8rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PlusIcon className="w-3.5 h-3.5" /> Nuevo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Fecha</label>
                    <input type="date" required value={formData.sale_date} onChange={e => setFormData({ ...formData, sale_date: e.target.value })} style={{ width: 160 }} />
                  </div>
                </div>

                {/* ── Ficha óptica ─────────────────────── */}
                <div>
                  <div className="section-title">Ficha óptica (opcional)</div>
                  <div style={{
                    background: 'var(--surface-2)', borderRadius: 10,
                    padding: '1rem', border: '1px solid var(--border)',
                  }}>
                    {/* Header row */}
                    <div className="optic-grid" style={{ marginBottom: '.5rem' }}>
                      <div />
                      {['Esf', 'Cil', 'Eje', 'Add'].map(h => (
                        <div key={h} className="col-header" style={{ textAlign: 'center', fontSize: '.65rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</div>
                      ))}
                    </div>
                    {/* OD row */}
                    <div className="optic-grid" style={{ marginBottom: '.5rem' }}>
                      <div className="eye-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: 4, padding: '2px 6px', fontSize: '.65rem', fontWeight: 700 }}>OD</span>
                      </div>
                      {['od_esf', 'od_cil', 'od_eje', 'od_add'].map(f => (
                        <input key={f} type="number" step="0.01" value={(formData as any)[f]}
                          onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                          placeholder="—"
                          style={{ textAlign: 'center', padding: '.45rem .25rem !important', fontSize: '.8rem', minHeight: '2.1rem !important' }}
                        />
                      ))}
                    </div>
                    {/* OI row */}
                    <div className="optic-grid">
                      <div className="eye-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ background: '#fae8ff', color: '#7e22ce', borderRadius: 4, padding: '2px 6px', fontSize: '.65rem', fontWeight: 700 }}>OI</span>
                      </div>
                      {['oi_esf', 'oi_cil', 'oi_eje', 'oi_add'].map(f => (
                        <input key={f} type="number" step="0.01" value={(formData as any)[f]}
                          onChange={e => setFormData({ ...formData, [f]: e.target.value })}
                          placeholder="—"
                          style={{ textAlign: 'center', padding: '.45rem .25rem !important', fontSize: '.8rem', minHeight: '2.1rem !important' }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── Productos ─────────────────────────── */}
                <div>
                  <div className="section-title">Productos *</div>

                  {/* Add product row */}
                  <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '1rem', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 80px 110px auto auto', gap: '.5rem', alignItems: 'end', marginBottom: '.75rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.25rem', fontSize: '.7rem' }}>Producto</label>
                      <select value={selProductId} onChange={e => handleProductSelect(e.target.value)}>
                        <option value="">Seleccionar…</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.25rem', fontSize: '.7rem' }}>Cantidad</label>
                      <input type="number" min="1" value={selQty} onChange={e => setSelQty(e.target.value)} placeholder="1" />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '.25rem', fontSize: '.7rem' }}>Precio unit.</label>
                      <input type="number" step="0.01" min="0" value={selPrice} onChange={e => setSelPrice(e.target.value)} placeholder="0.00" />
                    </div>
                    <button type="button" onClick={() => setShowProductModal(true)} style={{ height: 40, padding: '0 .625rem', background: '#ecfdf5', color: '#059669', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '.8rem', marginTop: 'auto' }} title="Crear producto">
                      <PlusIcon className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleAddProduct} style={{ height: 40, padding: '0 .75rem', background: '#4f46e5', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600, fontSize: '.8rem', marginTop: 'auto' }}>
                      <ShoppingCartIcon className="w-4 h-4" /> Agregar
                    </button>
                  </div>

                  {/* Product list */}
                  {saleProducts.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem', marginBottom: '.75rem' }}>
                      {saleProducts.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '.625rem .875rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text-primary)' }}>
                              {item.product?.name || `Producto #${item.product_id}`}
                            </div>
                            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>
                              {item.quantity} × {fmt(item.unit_price)}
                            </div>
                          </div>
                          <div style={{ fontWeight: 700, fontFamily: 'DM Mono, monospace', fontSize: '.875rem', color: '#4f46e5' }}>
                            {fmt(item.quantity * item.unit_price)}
                          </div>
                          <button type="button" onClick={() => setSaleProducts(saleProducts.filter((_, j) => j !== i))}
                            style={{ padding: '.25rem', background: '#fef2f2', color: '#ef4444', border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex' }}>
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Total */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 12, padding: '.75rem 0', borderTop: '2px solid var(--border)' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '.9rem' }}>Total:</span>
                    <span style={{ fontWeight: 800, fontSize: '1.375rem', color: '#10b981', fontFamily: 'DM Mono, monospace' }}>
                      {fmt(total())}
                    </span>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Notas</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Observaciones de la venta…" rows={2} />
                </div>
              </div>

              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem', background: 'var(--surface)', position: 'sticky', bottom: 0 }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingSale ? 'Guardar cambios' : 'Crear venta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Quick Client Modal ─────────────────────────── */}
      {showClientModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }} onClick={e => e.target === e.currentTarget && setShowClientModal(false)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Nuevo cliente rápido</h3>
              <button onClick={() => setShowClientModal(false)} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Nombre *</label>
                <input type="text" required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Nombre completo" /></div>
              <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Documento</label>
                <input type="text" value={newClient.document_id} onChange={e => setNewClient({ ...newClient, document_id: e.target.value })} placeholder="CI / DNI" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Email</label>
                  <input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} /></div>
                <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Teléfono</label>
                  <input type="text" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} /></div>
              </div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowClientModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreateClient}>Crear</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Product Modal ────────────────────────── */}
      {showProductModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }} onClick={e => e.target === e.currentTarget && setShowProductModal(false)}>
          <div className="modal-box" style={{ maxWidth: 400 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem' }}>Nuevo producto rápido</h3>
              <button onClick={() => setShowProductModal(false)} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', display: 'flex', color: 'var(--text-muted)' }}>
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
              <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Nombre *</label>
                <input type="text" required value={newProduct.name} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} placeholder="Nombre del producto" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
                <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Precio</label>
                  <input type="number" step="0.01" min="0" value={newProduct.price} onChange={e => setNewProduct({ ...newProduct, price: e.target.value })} placeholder="0.00" /></div>
                <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Stock</label>
                  <input type="number" min="0" value={newProduct.quantity} onChange={e => setNewProduct({ ...newProduct, quantity: e.target.value })} placeholder="0" /></div>
              </div>
              <div><label style={{ display: 'block', marginBottom: '.25rem' }}>Descripción</label>
                <textarea value={newProduct.description} onChange={e => setNewProduct({ ...newProduct, description: e.target.value })} rows={2} /></div>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
              <button className="btn btn-ghost" onClick={() => setShowProductModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleCreateProduct}>Crear</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SalesPage;
