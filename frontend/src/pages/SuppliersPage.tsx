import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import DataTable, { Column } from '../components/DataTable';
import { SortOrder } from '../components/SortableTh';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useDebounce } from '../hooks/useDebounce';
import { suppliersService } from '../services/suppliers';
import { Supplier } from '../types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  PhoneIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline';

const emptyForm = { name: '', contact_name: '', phone: '', email: '', notes: '' };

/** Campos del proveedor por los que se puede ordenar en cliente. */
type SortField = 'name' | 'contact_name' | 'email';

const dash = <span className="cell-muted">—</span>;
const withIcon: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5 };

const SuppliersPage: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const { t, locale } = useLanguage();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [sortBy, setSortBy] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('ASC');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => { load(); }, []);

  // El endpoint de proveedores devuelve la lista completa (sin paginar), así que
  // filtrar y ordenar se hace en cliente sobre el array ya cargado.
  const visible = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const rows = q
      ? suppliers.filter(s =>
          s.name.toLowerCase().includes(q) ||
          (s.contact_name || '').toLowerCase().includes(q) ||
          (s.email || '').toLowerCase().includes(q)
        )
      : [...suppliers];

    const dir = sortOrder === 'ASC' ? 1 : -1;
    return rows.sort((a, b) => {
      const av = (a[sortBy] || '').toString();
      const bv = (b[sortBy] || '').toString();
      // Los vacíos van siempre al final, sin importar la dirección.
      if (!av && !bv) return 0;
      if (!av) return 1;
      if (!bv) return -1;
      return av.localeCompare(bv, locale, { sensitivity: 'base' }) * dir;
    });
  }, [suppliers, debouncedSearch, sortBy, sortOrder, locale]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await suppliersService.getAll();
      setSuppliers(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al cargar proveedores', 'Could not load suppliers'));
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string, order: SortOrder) => {
    setSortBy(column as SortField);
    setSortOrder(order);
  };

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({ name: s.name, contact_name: s.contact_name || '', phone: s.phone || '', email: s.email || '', notes: s.notes || '' });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); setForm(emptyForm); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editing) {
        await suppliersService.update(editing.id, form);
        toast.success(t('Proveedor actualizado', 'Supplier updated'));
      } else {
        await suppliersService.create(form);
        toast.success(t('Proveedor creado', 'Supplier created'));
      }
      closeModal();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al guardar', 'Could not save'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    const ok = await confirm({
      title: t('Eliminar proveedor', 'Delete supplier'),
      message: t(
        `¿Seguro que querés eliminar a ${s.name}? Los armazones asociados quedarán sin proveedor.`,
        `Are you sure you want to delete ${s.name}? Its frames will be left without a supplier.`,
      ),
      confirmLabel: t('Eliminar', 'Delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      setDeletingId(s.id);
      await suppliersService.delete(s.id);
      toast.success(t('Proveedor eliminado', 'Supplier deleted'));
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al eliminar', 'Could not delete'));
    } finally {
      setDeletingId(null);
    }
  };

  const n = suppliers.length;

  const columns: Column<Supplier>[] = [
    {
      key: 'name',
      header: t('Nombre', 'Name'),
      sortKey: 'name',
      mobile: 'primary',
      render: s => (
        <div className="who">
          <span className="avatar sm" style={{ '--tone': 'var(--warning)' } as React.CSSProperties}>
            <TruckIcon style={{ width: 15, height: 15 }} />
          </span>
          <span className="who-name">{s.name}</span>
        </div>
      ),
    },
    {
      key: 'contact',
      header: t('Contacto', 'Contact'),
      sortKey: 'contact_name',
      mobile: 'secondary',
      render: s => (s.contact_name ? <span className="cell-secondary">{s.contact_name}</span> : dash),
    },
    {
      key: 'phone',
      header: t('Teléfono', 'Phone'),
      render: s => (s.phone
        ? <span className="cell-secondary" style={withIcon}><PhoneIcon className="w-3.5 h-3.5" />{s.phone}</span>
        : dash),
    },
    {
      key: 'email',
      header: 'Email',
      sortKey: 'email',
      render: s => (s.email
        ? <span className="cell-secondary" style={withIcon}><EnvelopeIcon className="w-3.5 h-3.5" />{s.email}</span>
        : dash),
    },
    {
      key: 'notes',
      header: t('Notas', 'Notes'),
      render: s => (
        <span className="cell-muted" style={{ fontSize: '.8rem', maxWidth: 200, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
          {s.notes || '—'}
        </span>
      ),
    },
  ];

  return (
    <Layout>
      <div className="fade-in">
        <PageHeader
          eyebrow={t('Compras', 'Purchasing')}
          title={t('Proveedores', 'Suppliers')}
          subtitle={t(
            `${n} proveedor${n !== 1 ? 'es' : ''} registrado${n !== 1 ? 's' : ''}`,
            `${n} registered supplier${n !== 1 ? 's' : ''}`,
          )}
          actions={
            <button className="btn btn-cta" onClick={openCreate}>
              <PlusIcon className="w-4 h-4" />
              {t('Nuevo proveedor', 'New supplier')}
            </button>
          }
        />

        <div className="toolbar">
          <div className="search-wrap" style={{ maxWidth: 360, flex: 1 }}>
            <MagnifyingGlassIcon className="w-4 h-4" />
            <input
              type="text"
              className="search-input"
              placeholder={t('Buscar proveedores…', 'Search suppliers…')}
              aria-label={t('Buscar proveedores', 'Search suppliers')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <DataTable
          rows={visible}
          columns={columns}
          rowKey={s => s.id}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actionsLabel={t('Acciones', 'Actions')}
          actions={s => (
            <>
              <button
                className="btn-icon sm"
                onClick={() => openEdit(s)}
                title={t('Editar', 'Edit')}
                aria-label={t(`Editar ${s.name}`, `Edit ${s.name}`)}
              >
                <PencilIcon />
              </button>
              <button
                className="btn-icon sm is-danger"
                onClick={() => handleDelete(s)}
                disabled={deletingId === s.id}
                title={t('Eliminar', 'Delete')}
                aria-label={t(`Eliminar ${s.name}`, `Delete ${s.name}`)}
              >
                <TrashIcon />
              </button>
            </>
          )}
          empty={
            <EmptyState
              icon={<TruckIcon />}
              title={t('No hay proveedores registrados', 'No registered suppliers')}
              description={t(
                'Cargá tus proveedores para poder asociarlos a los armazones.',
                'Add your suppliers so you can link them to your frames.',
              )}
              actionLabel={t('Agregar primer proveedor', 'Add your first supplier')}
              onAction={openCreate}
              searchTerm={debouncedSearch}
            />
          }
        />
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editing ? t('Editar proveedor', 'Edit supplier') : t('Nuevo proveedor', 'New supplier')}
        maxWidth={480}
        onSubmit={handleSubmit}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('Cancelar', 'Cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('Guardando…', 'Saving…') : (editing ? t('Guardar cambios', 'Save changes') : t('Crear proveedor', 'Create supplier'))}
          </button>
        </>}
      >
        <div className="field">
          <label htmlFor="supplier-name">{t('Nombre *', 'Name *')}</label>
          <input id="supplier-name" type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('Nombre del proveedor', 'Supplier name')} />
        </div>
        <div className="field">
          <label htmlFor="supplier-contact">{t('Contacto', 'Contact')}</label>
          <input id="supplier-contact" type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder={t('Nombre del contacto', 'Contact name')} />
        </div>
        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="supplier-phone">{t('Teléfono', 'Phone')}</label>
            <input id="supplier-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+598 99..." />
          </div>
          <div className="field">
            <label htmlFor="supplier-email">Email</label>
            <input id="supplier-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder={t('proveedor@...', 'supplier@...')} />
          </div>
        </div>
        <div className="field">
          <label htmlFor="supplier-notes">{t('Notas', 'Notes')}</label>
          <textarea id="supplier-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t('Notas opcionales…', 'Optional notes…')} rows={2} />
        </div>
      </Modal>
    </Layout>
  );
};

export default SuppliersPage;
