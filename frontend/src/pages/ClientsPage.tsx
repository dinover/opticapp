import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import SortableTh, { SortOrder } from '../components/SortableTh';
import { SkeletonRows } from '../components/Skeleton';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t, locale } = useLanguage();

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
      toast.error(err.response?.data?.error || t('Error al cargar clientes', 'Could not load clients'));
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
        toast.success(t('Cliente actualizado', 'Client updated'));
      } else {
        await clientsService.create(formData);
        toast.success(t('Cliente creado', 'Client created'));
      }
      closeModal();
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al guardar cliente', 'Could not save client'));
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
      title: t('Eliminar cliente', 'Delete client'),
      message: t(
        `¿Seguro que querés eliminar a ${client.name}? Se perderá su ficha de la app.`,
        `Are you sure you want to delete ${client.name}? Their record will be removed from the app.`,
      ),
      confirmLabel: t('Eliminar', 'Delete'),
      danger: true,
    });
    if (!ok) return;
    try {
      setDeletingId(client.id);
      await clientsService.delete(client.id);
      toast.success(t('Cliente eliminado', 'Client deleted'));
      loadClients();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al eliminar', 'Could not delete'));
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
  const total = clients?.pagination.total ?? 0;

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('Clientes', 'Clients')}</h1>
            <p className="page-subtitle">{t(
              `${total} cliente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`,
              `${total} registered client${total !== 1 ? 's' : ''}`,
            )}</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <PlusIcon className="w-4 h-4" />
            {t('Nuevo cliente', 'New client')}
          </button>
        </div>

        {/* Search */}
        <div className="search-wrap" style={{ maxWidth: 360, marginBottom: '1.25rem' }}>
          <MagnifyingGlassIcon className="w-4 h-4" />
          <input
            type="text"
            className="search-input"
            placeholder={t('Buscar por nombre, email, teléfono…', 'Search by name, email, phone…')}
            aria-label={t('Buscar clientes', 'Search clients')}
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
                    {t('Cliente', 'Client')}
                  </SortableTh>
                  <th>{t('Documento', 'ID')}</th>
                  <SortableTh column="email" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    {t('Contacto', 'Contact')}
                  </SortableTh>
                  <th>{t('Nacimiento', 'Birthday')}</th>
                  <SortableTh column="created_at" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    {t('Alta', 'Added')}
                  </SortableTh>
                  <th style={{ textAlign: 'right' }}>{t('Acciones', 'Actions')}</th>
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
                          ? new Date(client.birth_date).toLocaleDateString(locale)
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>
                        {client.created_at
                          ? new Date(client.created_at).toLocaleDateString(locale)
                          : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                          <button
                            onClick={() => handleEdit(client)}
                            style={{ ...rowActionBtn, color: 'var(--text-secondary)' }}
                            title={t('Editar', 'Edit')}
                            aria-label={t(`Editar ${client.name}`, `Edit ${client.name}`)}
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
                            title={t('Eliminar', 'Delete')}
                            aria-label={t(`Eliminar ${client.name}`, `Delete ${client.name}`)}
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
                        title={t('No hay clientes registrados', 'No registered clients')}
                        description={t(
                          'Cargá tu primer cliente para empezar a asociarle ventas y recetas.',
                          'Add your first client to start linking sales and prescriptions to them.',
                        )}
                        actionLabel={t('Nuevo cliente', 'New client')}
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
        title={editingClient ? t('Editar cliente', 'Edit client') : t('Nuevo cliente', 'New client')}
        onSubmit={handleSubmit}
        footer={<>
          <button type="button" className="btn btn-ghost" onClick={closeModal}>{t('Cancelar', 'Cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? t('Guardando…', 'Saving…') : (editingClient ? t('Guardar cambios', 'Save changes') : t('Crear cliente', 'Create client'))}
          </button>
        </>}
      >
        <div>
          <label htmlFor="client-name" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Nombre completo *', 'Full name *')}</label>
          <input id="client-name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t('Ej: María García', 'E.g. Mary Johnson')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label htmlFor="client-document" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Documento', 'ID number')}</label>
            <input id="client-document" type="text" value={formData.document_id} onChange={e => setFormData({ ...formData, document_id: e.target.value })} placeholder={t('CI / DNI', 'ID / Passport')} />
          </div>
          <div>
            <label htmlFor="client-birth" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Fecha de nac.', 'Date of birth')}</label>
            <input id="client-birth" type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
          </div>
          <div>
            <label htmlFor="client-email" style={{ display: 'block', marginBottom: '.375rem' }}>Email</label>
            <input id="client-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder={t('email@ejemplo.com', 'email@example.com')} />
          </div>
          <div>
            <label htmlFor="client-phone" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Teléfono', 'Phone')}</label>
            <input id="client-phone" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+598 99 123 456" />
          </div>
        </div>
        <div>
          <label htmlFor="client-address" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Dirección', 'Address')}</label>
          <input id="client-address" type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder={t('Calle 123, Ciudad', '123 Main St, City')} />
        </div>
        <div>
          <label htmlFor="client-notes" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Notas', 'Notes')}</label>
          <textarea id="client-notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder={t('Observaciones del cliente…', 'Notes about the client…')} rows={3} />
        </div>
      </Modal>
    </Layout>
  );
};

export default ClientsPage;
