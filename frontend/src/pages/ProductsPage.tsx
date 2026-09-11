import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import DataTable, { Column } from '../components/DataTable';
import { SortOrder } from '../components/SortableTh';
import { SkeletonCards } from '../components/Skeleton';
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
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const PAGE_SIZE = 12;

/** Miniatura con respaldo: si la imagen no carga, muestra el ícono en su lugar. */
const Thumb: React.FC<{ product: Product }> = ({ product }) => {
  const [broken, setBroken] = useState(false);
  if (!product.image_url || broken) {
    return <div className="thumb-placeholder"><PhotoIcon /></div>;
  }
  return (
    <img
      className="thumb"
      src={getDirectImageUrl(product.image_url)}
      alt={product.name}
      crossOrigin="anonymous"
      onError={() => setBroken(true)}
    />
  );
};

const ProductMedia: React.FC<{ product: Product }> = ({ product }) => {
  const [broken, setBroken] = useState(false);
  return (
    <div className="product-media">
      {product.image_url && !broken ? (
        <img
          src={getDirectImageUrl(product.image_url)}
          alt={product.name}
          crossOrigin="anonymous"
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="product-placeholder"><PhotoIcon /></div>
      )}
    </div>
  );
};

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

  const items = products?.data ?? [];
  const isEmpty = !loading && items.length === 0;
  const total = products?.pagination.total ?? 0;

  const rowActions = (product: Product) => (
    <>
      <button className="btn-icon sm" onClick={() => handleEdit(product)} aria-label={t(`Editar ${product.name}`, `Edit ${product.name}`)} title={t('Editar', 'Edit')}>
        <PencilIcon />
      </button>
      <button className="btn-icon sm is-danger" onClick={() => handleDelete(product)} aria-label={t(`Eliminar ${product.name}`, `Delete ${product.name}`)} title={t('Eliminar', 'Delete')}>
        <TrashIcon />
      </button>
    </>
  );

  const stockBadge = (p: Product) => {
    const qty = p.quantity ?? 0;
    return <span className={`badge ${qty > 0 ? 'badge-green' : 'badge-red'}`}>{qty}</span>;
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: t('Producto', 'Product'),
      sortKey: 'name',
      mobile: 'primary',
      render: p => (
        <div className="who">
          <Thumb product={p} />
          <span className="who-name">{p.name}</span>
        </div>
      ),
    },
    {
      key: 'description',
      header: t('Descripción', 'Description'),
      mobile: 'hidden',
      render: p => (
        <span className="cell-muted" style={{ fontSize: '.8rem', maxWidth: 240, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
          {p.description || '—'}
        </span>
      ),
    },
    {
      key: 'price',
      header: t('Precio', 'Price'),
      sortKey: 'price',
      render: p => <span className="amount is-brand">{fmt(Number(p.price) || 0)}</span>,
    },
    {
      key: 'stock',
      header: 'Stock',
      sortKey: 'quantity',
      render: stockBadge,
    },
    {
      key: 'created',
      header: t('Alta', 'Added'),
      sortKey: 'created_at',
      render: p => <span className="cell-muted" style={{ whiteSpace: 'nowrap' }}>{p.created_at ? new Date(p.created_at).toLocaleDateString(locale) : '—'}</span>,
    },
  ];

  const emptyState = (
    <EmptyState
      icon={<CubeIcon />}
      title={t('No hay productos en el catálogo', 'No products in the catalog')}
      description={t('Cargá tu primer armazón o accesorio para empezar a vender.', 'Add your first frame or accessory to start selling.')}
      actionLabel={t('Nuevo producto', 'New product')}
      onAction={openCreate}
      searchTerm={debouncedSearch}
    />
  );

  const pagination = !loading && !isEmpty && products && products.pagination.totalPages > 1 && (
    <Pagination page={products.pagination.page} totalPages={products.pagination.totalPages} onPageChange={setPage} />
  );

  return (
    <Layout>
      <div className="fade-in">
        <PageHeader
          eyebrow={t('Catálogo', 'Catalog')}
          title={t('Productos', 'Products')}
          subtitle={t(
            `${total} producto${total !== 1 ? 's' : ''} en catálogo`,
            `${total} product${total !== 1 ? 's' : ''} in catalog`,
          )}
          actions={
            <button className="btn btn-cta" onClick={openCreate}>
              <PlusIcon className="w-4 h-4" />
              {t('Nuevo producto', 'New product')}
            </button>
          }
        />

        <div className="toolbar">
          <div className="search-wrap" style={{ maxWidth: 360, flex: 1, minWidth: 200 }}>
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

          <div className="segmented" role="group" aria-label={t('Vista', 'View')}>
            <button
              type="button"
              onClick={() => switchView('grid')}
              aria-label={t('Ver como cuadrícula', 'Grid view')}
              aria-pressed={viewMode === 'grid'}
              title={t('Vista cuadrícula', 'Grid view')}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => switchView('list')}
              aria-label={t('Ver como lista', 'List view')}
              aria-pressed={viewMode === 'list'}
              title={t('Vista lista', 'List view')}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div role="alert" className="alert alert-danger" style={{ marginBottom: '1rem' }}>
            <ExclamationCircleIcon />
            <span>{error}</span>
          </div>
        )}

        {viewMode === 'grid' ? (
          isEmpty ? (
            <div className="card">{emptyState}</div>
          ) : (
            <>
              <div className="product-grid">
                {loading ? (
                  <SkeletonCards count={PAGE_SIZE} height={280} />
                ) : (
                  items.map(product => (
                    <article key={product.id} className="product-card">
                      <ProductMedia product={product} />
                      <div className="product-body">
                        <h3 className="product-name">{product.name}</h3>
                        {product.description && <p className="product-desc">{product.description}</p>}
                        <div className="product-foot">
                          <div>
                            <div className="product-price">{fmt(Number(product.price) || 0)}</div>
                            <div style={{ marginTop: 4 }}>
                              <span className={`badge ${(product.quantity ?? 0) > 0 ? 'badge-green' : 'badge-red'}`}>
                                Stock: {product.quantity ?? 0}
                              </span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 4 }}>{rowActions(product)}</div>
                        </div>
                      </div>
                    </article>
                  ))
                )}
              </div>
              {pagination}
            </>
          )
        ) : (
          <DataTable
            rows={items}
            columns={columns}
            rowKey={p => p.id}
            loading={loading}
            skeletonRows={6}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            actionsLabel={t('Acciones', 'Actions')}
            actions={rowActions}
            empty={emptyState}
            footer={pagination}
          />
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
        <div className="field">
          <label htmlFor="product-name">{t('Nombre *', 'Name *')}</label>
          <input id="product-name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t('Nombre del producto', 'Product name')} />
        </div>
        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="product-price">{t('Precio', 'Price')}</label>
            <input id="product-price" type="number" step="0.01" min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} placeholder="0.00" />
          </div>
          <div className="field">
            <label htmlFor="product-quantity">Stock</label>
            <input id="product-quantity" type="number" min="0" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: e.target.value })} placeholder="0" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="product-description">{t('Descripción', 'Description')}</label>
          <textarea id="product-description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder={t('Descripción opcional…', 'Optional description…')} rows={2} />
        </div>
        <div className="field">
          <label htmlFor="product-image">{t('URL de imagen', 'Image URL')}</label>
          <input id="product-image" type="url" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} placeholder={t('https://... o Google Drive', 'https://... or Google Drive')} />
          <p className="hint">
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
              style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-sm)', marginTop: '.5rem', border: '1px solid var(--border)' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          )}
        </div>
      </Modal>
    </Layout>
  );
};

export default ProductsPage;
