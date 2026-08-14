import React, { useState, useEffect, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SortableTh, { SortOrder } from '../components/SortableTh';
import { SkeletonRows } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
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

const COLUMN_COUNT = 6;

/** Campos del proveedor por los que se puede ordenar en cliente. */
type SortField = 'name' | 'contact_name' | 'email';

const SuppliersPage: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();

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
      return av.localeCompare(bv, 'es', { sensitivity: 'base' }) * dir;
    });
  }, [suppliers, debouncedSearch, sortBy, sortOrder]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await suppliersService.getAll();
      setSuppliers(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cargar proveedores');
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
        toast.success('Proveedor actualizado');
      } else {
        await suppliersService.create(form);
        toast.success('Proveedor creado');
      }
      closeModal();
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    const ok = await confirm({
      title: 'Eliminar proveedor',
      message: `¿Seguro que querés eliminar a ${s.name}? Los armazones asociados quedarán sin proveedor.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      setDeletingId(s.id);
      await suppliersService.delete(s.id);
      toast.success('Proveedor eliminado');
      load();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const rowActionBtn: React.CSSProperties = {
    padding: '.35rem',
    borderRadius: 'var(--radius)',
    background: 'var(--surface-3)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all .15s',
    display: 'flex',
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Proveedores</h1>
            <p className="page-subtitle">{suppliers.length} proveedor{suppliers.length !== 1 ? 'es' : ''} registrado{suppliers.length !== 1 ? 's' : ''}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            Nuevo proveedor
          </button>
        </div>

        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <MagnifyingGlassIcon className="w-4 h-4" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar proveedores…"
            aria-label="Buscar proveedores"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Nombre
                  </SortableTh>
                  <SortableTh column="contact_name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Contacto
                  </SortableTh>
                  <th>Teléfono</th>
                  <SortableTh column="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Email
                  </SortableTh>
                  <th>Notas</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} columns={COLUMN_COUNT} />
                ) : visible.length > 0 ? visible.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '.9rem' }}>{s.name}</div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {s.contact_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {s.phone
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}><PhoneIcon className="w-3.5 h-3.5" />{s.phone}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>
                      {s.email
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}><EnvelopeIcon className="w-3.5 h-3.5" />{s.email}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '.8rem', maxWidth: 180 }}>
                      <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {s.notes || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => openEdit(s)}
                          style={{ ...rowActionBtn, color: 'var(--text-secondary)' }}
                          title="Editar"
                          aria-label={`Editar ${s.name}`}
                        >
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          disabled={deletingId === s.id}
                          style={{
                            ...rowActionBtn,
                            color: 'var(--danger)',
                            opacity: deletingId === s.id ? 0.5 : 1,
                            cursor: deletingId === s.id ? 'default' : 'pointer',
                          }}
                          title="Eliminar"
                          aria-label={`Eliminar ${s.name}`}
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={COLUMN_COUNT}>
                      <EmptyState
                        icon={<TruckIcon />}
                        title="No hay proveedores registrados"
                        description="Cargá tus proveedores para poder asociarlos a los armazones."
                        actionLabel="Agregar primer proveedor"
                        onAction={openCreate}
                        searchTerm={debouncedSearch}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editing ? 'Editar proveedor' : 'Nuevo proveedor'}
        maxWidth={480}
        onSubmit={handleSubmit}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : (editing ? 'Guardar cambios' : 'Crear proveedor')}
          </button>
        </>}
      >
        <div>
          <label htmlFor="supplier-name" style={{ display: 'block', marginBottom: '.375rem' }}>Nombre *</label>
          <input id="supplier-name" type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del proveedor" />
        </div>
        <div>
          <label htmlFor="supplier-contact" style={{ display: 'block', marginBottom: '.375rem' }}>Contacto</label>
          <input id="supplier-contact" type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Nombre del contacto" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="supplier-phone" style={{ display: 'block', marginBottom: '.375rem' }}>Teléfono</label>
            <input id="supplier-phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+598 99..." />
          </div>
          <div>
            <label htmlFor="supplier-email" style={{ display: 'block', marginBottom: '.375rem' }}>Email</label>
            <input id="supplier-email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="proveedor@..." />
          </div>
        </div>
        <div>
          <label htmlFor="supplier-notes" style={{ display: 'block', marginBottom: '.375rem' }}>Notas</label>
          <textarea id="supplier-notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas opcionales…" rows={2} />
        </div>
      </Modal>
    </Layout>
  );
};

export default SuppliersPage;
