import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { productsService } from '../services/products';
import { Product, PaginatedResponse } from '../types';
import { getDirectImageUrl } from '../utils/imageUtils';
import { useCurrency } from '../contexts/CurrencyContext';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PhotoIcon,
  CubeIcon,
} from '@heroicons/react/24/outline';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '', image_url: '' });

  useEffect(() => { loadProducts(); }, [page, search]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll({ page, limit: 12, search: search || undefined, sortBy: 'created_at', sortOrder: 'DESC' });
      setProducts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = { ...formData, price: formData.price ? parseFloat(formData.price) : 0, quantity: formData.quantity ? parseInt(formData.quantity) : 0 };
      if (editingProduct) await productsService.update(editingProduct.id, data);
      else await productsService.create(data);
      closeModal();
      loadProducts();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar');
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ name: p.name, price: p.price?.toString() || '', quantity: p.quantity?.toString() || '', description: p.description || '', image_url: p.image_url || '' });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este producto?')) return;
    try { await productsService.delete(id); loadProducts(); }
    catch (err: any) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  const closeModal = () => { setShowModal(false); setEditingProduct(null); setFormData({ name: '', price: '', quantity: '', description: '', image_url: '' }); };

  const { fmt } = useCurrency();

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Productos</h1>
            <p className="page-subtitle">{products?.pagination.total ?? 0} productos en catálogo</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingProduct(null); setShowModal(true); }}>
            <PlusIcon className="w-4 h-4" />
            Nuevo producto
          </button>
        </div>

        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <MagnifyingGlassIcon className="w-4 h-4" />
          <input type="text" className="search-input" placeholder="Buscar productos…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '.875rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : products?.data && products.data.length > 0 ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {products.data.map(product => (
                <div key={product.id} className="product-card">
                  {product.image_url ? (
                    <img
                      src={getDirectImageUrl(product.image_url)}
                      alt={product.name}
                      style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }}
                      crossOrigin="anonymous"
                      onError={e => {
                        const img = e.target as HTMLImageElement;
                        img.style.display = 'none';
                        const ph = img.nextElementSibling as HTMLElement;
                        if (ph) ph.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    width: '100%', height: 160,
                    background: 'var(--surface-3)',
                    display: product.image_url ? 'none' : 'flex',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <PhotoIcon style={{ width: 36, height: 36, color: 'var(--text-muted)' }} />
                  </div>
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)', margin: '0 0 .25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.name}
                    </h3>
                    {product.description && (
                      <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: '0 0 .75rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {product.description}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#4f46e5', fontFamily: 'DM Mono, monospace' }}>
                          {fmt(Number(product.price) || 0)}
                        </div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Stock: {product.quantity ?? 0}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleEdit(product)} style={{ padding: '.35rem', borderRadius: 7, background: '#eef2ff', color: '#4f46e5', border: 'none', cursor: 'pointer' }} title="Editar">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} style={{ padding: '.35rem', borderRadius: 7, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Eliminar">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {products.pagination.totalPages > 1 && (
              <Pagination page={products.pagination.page} totalPages={products.pagination.totalPages} onPageChange={setPage} />
            )}
          </>
        ) : (
          <div className="card">
            <div className="empty-state">
              <CubeIcon style={{ width: 40, height: 40, margin: '0 auto 0.75rem' }} />
              <p>No hay productos en el catálogo</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h3>
              <button onClick={closeModal} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Nombre *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Nombre del producto" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Precio</label>
                    <input type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Stock</label>
                    <input type="number" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Descripción</label>
                  <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Descripción opcional…" rows={2} />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>URL de imagen</label>
                  <input type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder="https://... o Google Drive" />
                  <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: '.375rem 0 0' }}>
                    Acepta URLs directas o links de Google Drive compartidos como público
                  </p>
                  {formData.image_url && (
                    <img
                      src={getDirectImageUrl(formData.image_url)}
                      alt="Preview"
                      crossOrigin="anonymous"
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: '.5rem', border: '1px solid var(--border)' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ProductsPage;
