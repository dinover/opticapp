import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SortableTh, { SortOrder } from '../components/SortableTh';
import { SkeletonRows } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useDebounce } from '../hooks/useDebounce';
import { clientsService } from '../services/clients';
import { Client, PaginatedResponse } from '../types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const emptyForm = {
  name: '', document_id: '', email: '', phone: '',
  address: '', birth_date: '', notes: '',
};

const COLUMN_COUNT = 6;

const ClientsPage: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();

  const [clients, setClients] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('DESC');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => { loadClients(); }, [page, debouncedSearch, sortBy, sortOrder]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAll({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        sortBy,
        sortOrder,
      });
      setClients(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string, order: SortOrder) => {
    setSortBy(column);
    setSortOrder(order);
    setPage(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      if (editingClient) {
        await clientsService.update(editingClient.id, formData);
        toast.success('Cliente actualizado');
      } else {
        await clientsService.create(formData);
        toast.success('Cliente creado');
      }
      closeModal();
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al guardar cliente');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setEditingClient(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name, document_id: client.document_id || '',
      email: client.email || '', phone: client.phone || '',
      address: client.address || '', birth_date: client.birth_date || '',
      notes: client.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (client: Client) => {
    const ok = await confirm({
      title: 'Eliminar cliente',
      message: `¿Seguro que querés eliminar a ${client.name}? Se perderá su ficha de la app.`,
      confirmLabel: 'Eliminar',
      danger: true,
    });
    if (!ok) return;
    try {
      setDeletingId(client.id);
      await clientsService.delete(client.id);
      toast.success('Cliente eliminado');
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally {
      setDeletingId(null);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingClient(null);
    setFormData(emptyForm);
  };

  const avatarColor = (name: string) => {
    const colors = [
      ['#ede9fe', '#6d28d9'], ['#dbeafe', '#1d4ed8'], ['#dcfce7', '#15803d'],
      ['#fef3c7', '#b45309'], ['#fce7f3', '#be185d'],
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const rowActionBtn: React.CSSProperties = {
    padding: '.375rem',
    borderRadius: 'var(--radius)',
    background: 'var(--surface-3)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all .15s',
    display: 'flex',
  };

  const hasRows = Boolean(clients?.data && clients.data.length > 0);

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">{clients?.pagination.total ?? 0} clientes registrados</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            Nuevo cliente
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <MagnifyingGlassIcon className="w-4 h-4" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por nombre, email, teléfono…"
            aria-label="Buscar clientes"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <SortableTh column="name" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Cliente
                  </SortableTh>
                  <th>Documento</th>
                  <SortableTh column="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Contacto
                  </SortableTh>
                  <th>Nacimiento</th>
                  <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Alta
                  </SortableTh>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={5} columns={COLUMN_COUNT} />
                ) : hasRows ? clients!.data.map(client => {
                  const [bg, fg] = avatarColor(client.name);
                  return (
                    <tr key={client.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 99, background: bg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 700, fontSize: '.8rem', color: fg, flexShrink: 0,
                          }}>
                            {client.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{client.name}</p>
                            {client.address && (
                              <p style={{ fontSize: '.75rem', color: 'var(--text-muted)', margin: 0 }}>{client.address}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontFamily: 'DM Mono, monospace', fontSize: '.8rem' }}>
                        {client.document_id || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ fontSize: '.8rem' }}>
                          {client.email && <div style={{ color: 'var(--text-secondary)' }}>{client.email}</div>}
                          {client.phone && <div style={{ color: 'var(--text-muted)' }}>{client.phone}</div>}
                          {!client.email && !client.phone && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '.8rem' }}>
                        {client.birth_date
                          ? new Date(client.birth_date).toLocaleDateString('es-ES')
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString('es-ES')
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            onClick={() => handleEdit(client)}
                            style={{ ...rowActionBtn, color: 'var(--text-secondary)' }}
                            title="Editar"
                            aria-label={`Editar ${client.name}`}
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(client)}
                            disabled={deletingId === client.id}
                            style={{
                              ...rowActionBtn,
                              color: 'var(--danger)',
                              opacity: deletingId === client.id ? 0.5 : 1,
                              cursor: deletingId === client.id ? 'default' : 'pointer',
                            }}
                            title="Eliminar"
                            aria-label={`Eliminar ${client.name}`}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={COLUMN_COUNT}>
                      <EmptyState
                        icon={<UserCircleIcon />}
                        title="No hay clientes registrados"
                        description="Cargá tu primer cliente para empezar a asociarle ventas y recetas."
                        actionLabel="Nuevo cliente"
                        onAction={openCreate}
                        searchTerm={debouncedSearch}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!loading && clients && clients.pagination.totalPages > 1 && (
            <Pagination page={clients.pagination.page} totalPages={clients.pagination.totalPages} onPageChange={setPage} />
          )}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={closeModal}
        title={editingClient ? 'Editar cliente' : 'Nuevo cliente'}
        onSubmit={handleSubmit}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : (editingClient ? 'Guardar cambios' : 'Crear cliente')}
          </button>
        </>}
      >
        <div>
          <label htmlFor="client-name" style={{ display: 'block', marginBottom: '.375rem' }}>Nombre completo *</label>
          <input id="client-name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: María García" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="client-document" style={{ display: 'block', marginBottom: '.375rem' }}>Documento</label>
            <input id="client-document" type="text" value={formData.document_id} onChange={e => setFormData({ ...formData, document_id: e.target.value })} placeholder="CI / DNI" />
          </div>
          <div>
            <label htmlFor="client-birth" style={{ display: 'block', marginBottom: '.375rem' }}>Fecha de nac.</label>
            <input id="client-birth" type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
          </div>
          <div>
            <label htmlFor="client-email" style={{ display: 'block', marginBottom: '.375rem' }}>Email</label>
            <input id="client-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" />
          </div>
          <div>
            <label htmlFor="client-phone" style={{ display: 'block', marginBottom: '.375rem' }}>Teléfono</label>
            <input id="client-phone" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+598 99 123 456" />
          </div>
        </div>
        <div>
          <label htmlFor="client-address" style={{ display: 'block', marginBottom: '.375rem' }}>Dirección</label>
          <input id="client-address" type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle 123, Ciudad" />
        </div>
        <div>
          <label htmlFor="client-notes" style={{ display: 'block', marginBottom: '.375rem' }}>Notas</label>
          <textarea id="client-notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Observaciones del cliente…" rows={3} />
        </div>
      </Modal>
    </Layout>
  );
};

export default ClientsPage;
