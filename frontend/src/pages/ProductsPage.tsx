import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SortableTh, { SortOrder } from '../components/SortableTh';
import { SkeletonRows, SkeletonCards } from '../components/Skeleton';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 12;

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: '', price: '', quantity: '', description: '', image_url: '' });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => (localStorage.getItem('products_view') as 'grid' | 'list') || 'grid');

  const debouncedSearch = useDebounce(search, 350);
  const toast = useToast();
  const confirm = useConfirm();
  const { t, locale } = useLanguage();
  const { fmt } = useCurrency();

  useEffect(() => { loadProducts(); }, [page, debouncedSearch, sortBy, sortOrder]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productsService.getAll({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });
      setProducts(data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || t('Error al cargar productos', 'Could not load products'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { ...formData, price: formData.price ? parseFloat(formData.price) : 0, quantity: formData.quantity ? parseInt(formData.quantity) : 0 };
      if (editingProduct) {
        await productsService.update(editingProduct.id, data);
        toast.success(t('Producto actualizado', 'Product updated'));
      } else {
        await productsService.create(data);
        toast.success(t('Producto creado', 'Product created'));
      }
      closeModal();
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al guardar', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({ name: p.name, price: p.price?.toString() || '', quantity: p.quantity?.toString() || '', description: p.description || '', image_url: p.image_url || '' });
    setShowModal(true);
  };

  const handleDelete = async (product: Product) => {
    const ok = await confirm({
      title: t('Eliminar producto', 'Delete product'),
      message: t(
        `¿Seguro que querés eliminar ${product.name}? Esta acción no se puede deshacer.`,
        `Are you sure you want to delete ${product.name}? This can’t be undone.`,
      ),
      confirmLabel: t('Eliminar', 'Delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      await productsService.delete(product.id);
      toast.success(t('Producto eliminado', 'Product deleted'));
      loadProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al eliminar', 'Could not delete'));
    }
  };

  const openCreate = () => { setEditingProduct(null); setShowModal(true); };

  const closeModal = () => { setShowModal(false); setEditingProduct(null); setFormData({ name: '', price: '', quantity: '', description: '', image_url: '' }); };

  const switchView = (mode: 'grid' | 'list') => { setViewMode(mode); localStorage.setItem('products_view', mode); };

  const handleSort = (column: string, order: SortOrder) => {
    setSortBy(column);
    setSortOrder(order);
    setPage(1);
  };

  const iconBtnStyle = (tone: 'brand' | 'danger'): React.CSSProperties => ({
    padding: '.35rem',
    borderRadius: 7,
    background: 'var(--surface-3)',
    color: tone === 'brand' ? 'var(--brand)' : 'var(--danger)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
  });

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '.35rem',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    background: active ? 'var(--surface)' : 'transparent',
    color: active ? 'var(--brand)' : 'var(--text-muted)',
    boxShadow: active ? 'var(--shadow-sm)' : 'none',
    transition: 'all .15s',
  });

  const items = products?.data ?? [];
  const isEmpty = !loading && items.length === 0;
  const total = products?.pagination.total ?? 0;

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('Productos', 'Products')}</h1>
            <p className="page-subtitle">{t(
              `${total} producto${total !== 1 ? 's' : ''} en catálogo`,
              `${total} product${total !== 1 ? 's' : ''} in catalog`,
            )}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            {t('Nuevo producto', 'New product')}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="search-wrap" style={{ maxWidth: 360, flex: 1 }}>
            <MagnifyingGlassIcon className="w-4 h-4" />
            <input
              type="text"
              className="search-input"
              placeholder={t('Buscar productos…', 'Search products…')}
              aria-label={t('Buscar productos', 'Search products')}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>

          {viewMode === 'grid' && (
            <select
              aria-label={t('Ordenar productos', 'Sort products')}
              value={`${sortBy}:${sortOrder}`}
              onChange={e => {
                const [column, order] = e.target.value.split(':');
                handleSort(column, order as SortOrder);
              }}
              style={{ width: 'auto', minWidth: 190 }}
            >
              <option value="created_at:DESC">{t('Más recientes', 'Newest')}</option>
              <option value="created_at:ASC">{t('Más antiguos', 'Oldest')}</option>
              <option value="name:ASC">{t('Nombre (A–Z)', 'Name (A–Z)')}</option>
              <option value="name:DESC">{t('Nombre (Z–A)', 'Name (Z–A)')}</option>
              <option value="price:DESC">{t('Precio (mayor)', 'Price (highest)')}</option>
              <option value="price:ASC">{t('Precio (menor)', 'Price (lowest)')}</option>
              <option value="quantity:DESC">{t('Stock (mayor)', 'Stock (highest)')}</option>
              <option value="quantity:ASC">{t('Stock (menor)', 'Stock (lowest)')}</option>
            </select>
          )}

          <div style={{ display: 'flex', gap: 2, background: 'var(--surface-3)', borderRadius: 8, padding: 3 }}>
            <button
              onClick={() => switchView('grid')}
              aria-label={t('Ver como cuadrícula', 'Grid view')}
              aria-pressed={viewMode === 'grid'}
              title={t('Vista cuadrícula', 'Grid view')}
              style={toggleStyle(viewMode === 'grid')}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => switchView('list')}
              aria-label={t('Ver como lista', 'List view')}
              aria-pressed={viewMode === 'list'}
              title={t('Vista lista', 'List view')}
              style={toggleStyle(viewMode === 'list')}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--danger)',
              borderRadius: 'var(--radius)',
              padding: '.75rem 1rem',
              marginBottom: '1rem',
              color: 'var(--danger)',
              fontSize: '.875rem',
            }}
          >
            {error}
          </div>
        )}

        {isEmpty ? (
          <div className="card">
            <EmptyState
              icon={<CubeIcon />}
              title={t('No hay productos en el catálogo', 'No products in the catalog')}
              description={t('Cargá tu primer armazón o accesorio para empezar a vender.', 'Add your first frame or accessory to start selling.')}
              actionLabel={t('Nuevo producto', 'New product')}
              onAction={openCreate}
              searchTerm={debouncedSearch}
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {loading ? (
              <SkeletonCards count={PAGE_SIZE} height={280} />
            ) : (
              items.map(product => (
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
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--brand)', fontFamily: 'DM Mono, monospace' }}>
                          {fmt(Number(product.price) || 0)}
                        </div>
                        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          Stock: {product.quantity ?? 0}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => handleEdit(product)} style={iconBtnStyle('brand')} aria-label={t(`Editar ${product.name}`, `Edit ${product.name}`)} title={t('Editar', 'Edit')}>
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(product)} style={iconBtnStyle('danger')} aria-label={t(`Eliminar ${product.name}`, `Delete ${product.name}`)} title={t('Eliminar', 'Delete')}>
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="card" style={{ overflow: 'hidden', marginBottom: '1.5rem' }}>
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('Producto', 'Product')}</SortableTh>
                    <th>{t('Descripción', 'Description')}</th>
                    <SortableTh column="price" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('Precio', 'Price')}</SortableTh>
                    <SortableTh column="quantity" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>Stock</SortableTh>
                    <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>{t('Alta', 'Added')}</SortableTh>
                    <th aria-label={t('Acciones', 'Actions')} />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonRows rows={6} columns={6} />
                  ) : (
                    items.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                            {product.image_url ? (
                              <img
                                src={getDirectImageUrl(product.image_url)}
                                alt={product.name}
                                crossOrigin="anonymous"
                                style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div style={{ width: 40, height: 40, borderRadius: 8, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <PhotoIcon style={{ width: 18, height: 18, color: 'var(--text-muted)' }} />
                              </div>
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{product.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '.8rem', maxWidth: 220 }}>
                          <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                            {product.description || '—'}
                          </span>
                        </td>
                        <td style={{ fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--brand)', whiteSpace: 'nowrap' }}>
                          {fmt(Number(product.price) || 0)}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: '.78rem', fontWeight: 600,
                            background: 'var(--surface-3)',
                            color: (product.quantity ?? 0) > 0 ? 'var(--success)' : 'var(--danger)',
                          }}>
                            {product.quantity ?? 0}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '.8rem', whiteSpace: 'nowrap' }}>
                          {product.created_at ? new Date(product.created_at).toLocaleDateString(locale) : '—'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                            <button onClick={() => handleEdit(product)} style={iconBtnStyle('brand')} aria-label={t(`Editar ${product.name}`, `Edit ${product.name}`)} title={t('Editar', 'Edit')}>
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(product)} style={iconBtnStyle('danger')} aria-label={t(`Eliminar ${product.name}`, `Delete ${product.name}`)} title={t('Eliminar', 'Delete')}>
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !isEmpty && products && products.pagination.totalPages > 1 && (
          <Pagination page={products.pagination.page} totalPages={products.pagination.totalPages} onPageChange={setPage} />
        )}
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingProduct ? t('Editar producto', 'Edit product') : t('Nuevo producto', 'New product')}
        maxWidth={500}
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('Cancelar', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('Guardando…', 'Saving…') : editingProduct ? t('Guardar cambios', 'Save changes') : t('Crear producto', 'Create product')}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="product-name" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Nombre *', 'Name *')}</label>
          <input id="product-name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t('Nombre del producto', 'Product name')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="product-price" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Precio', 'Price')}</label>
            <input id="product-price" type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
          </div>
          <div>
            <label htmlFor="product-quantity" style={{ display: 'block', marginBottom: '.375rem' }}>Stock</label>
            <input id="product-quantity" type="number" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" />
          </div>
        </div>
        <div>
          <label htmlFor="product-description" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Descripción', 'Description')}</label>
          <textarea id="product-description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('Descripción opcional…', 'Optional description…')} rows={2} />
        </div>
        <div>
          <label htmlFor="product-image" style={{ display: 'block', marginBottom: '.375rem' }}>{t('URL de imagen', 'Image URL')}</label>
          <input id="product-image" type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder={t('https://... o Google Drive', 'https://... or Google Drive')} />
          <p style={{ fontSize: '.72rem', color: 'var(--text-muted)', margin: '.375rem 0 0' }}>
            {t(
              'Acepta URLs directas o links de Google Drive compartidos como público',
              'Accepts direct URLs or Google Drive links shared publicly',
            )}
          </p>
          {formData.image_url && (
            <img
              src={getDirectImageUrl(formData.image_url)}
              alt={formData.name ? t(`Vista previa de ${formData.name}`, `Preview of ${formData.name}`) : t('Vista previa de la imagen', 'Image preview')}
              crossOrigin="anonymous"
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginTop: '.5rem', border: '1px solid var(--border)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default ProductsPage;
