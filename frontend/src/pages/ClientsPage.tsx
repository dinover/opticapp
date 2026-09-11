import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import DataTable, { Column } from '../components/DataTable';
import { SortOrder } from '../components/SortableTh';
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

/** Tonos de avatar derivados del nombre: mismo cliente, mismo color siempre. */
const AVATAR_TONES = ['var(--violet)', '#3b82f6', 'var(--success)', 'var(--warning)', '#ec4899'];
const avatarTone = (name: string) => AVATAR_TONES[name.charCodeAt(0) % AVATAR_TONES.length];

const dash = <span className="cell-muted">—</span>;

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

  const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString(locale) : dash);
  const total = clients?.pagination.total ?? 0;

  const columns: Column<Client>[] = [
    {
      key: 'name',
      header: t('Cliente', 'Client'),
      sortKey: 'name',
      mobile: 'primary',
      render: c => (
        <div className="who">
          <span className="avatar" style={{ '--tone': avatarTone(c.name) } as React.CSSProperties}>
            {c.name.charAt(0).toUpperCase()}
          </span>
          <div style={{ minWidth: 0 }}>
            <p className="who-name">{c.name}</p>
            {c.address && <p className="who-sub">{c.address}</p>}
          </div>
        </div>
      ),
    },
    {
      key: 'document',
      header: t('Documento', 'ID'),
      render: c => (c.document_id ? <span className="mono cell-secondary">{c.document_id}</span> : dash),
    },
    {
      key: 'contact',
      header: t('Contacto', 'Contact'),
      sortKey: 'email',
      render: c => (
        <div style={{ fontSize: '.8rem' }}>
          {c.email && <div className="cell-secondary">{c.email}</div>}
          {c.phone && <div className="cell-muted">{c.phone}</div>}
          {!c.email && !c.phone && dash}
        </div>
      ),
    },
    {
      key: 'birth',
      header: t('Nacimiento', 'Birthday'),
      render: c => <span className="cell-secondary">{fmtDate(c.birth_date)}</span>,
    },
    {
      key: 'created',
      header: t('Alta', 'Added'),
      sortKey: 'created_at',
      render: c => <span className="cell-muted">{fmtDate(c.created_at)}</span>,
    },
  ];

  return (
    <Layout>
      <div className="fade-in">
        <PageHeader
          eyebrow={t('Tu cartera', 'Your clients')}
          title={t('Clientes', 'Clients')}
          subtitle={t(
            `${total} cliente${total !== 1 ? 's' : ''} registrado${total !== 1 ? 's' : ''}`,
            `${total} registered client${total !== 1 ? 's' : ''}`,
          )}
          actions={
            <button className="btn btn-cta" onClick={openCreate}>
              <PlusIcon className="w-4 h-4" />
              {t('Nuevo cliente', 'New client')}
            </button>
          }
        />

        <div className="toolbar">
          <div className="search-wrap" style={{ maxWidth: 360, flex: 1 }}>
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
        </div>

        <DataTable
          rows={clients?.data ?? []}
          columns={columns}
          rowKey={c => c.id}
          loading={loading}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          actionsLabel={t('Acciones', 'Actions')}
          actions={client => (
            <>
              <button
                className="btn-icon sm"
                onClick={() => handleEdit(client)}
                title={t('Editar', 'Edit')}
                aria-label={t(`Editar ${client.name}`, `Edit ${client.name}`)}
              >
                <PencilIcon />
              </button>
              <button
                className="btn-icon sm is-danger"
                onClick={() => handleDelete(client)}
                disabled={deletingId === client.id}
                title={t('Eliminar', 'Delete')}
                aria-label={t(`Eliminar ${client.name}`, `Delete ${client.name}`)}
              >
                <TrashIcon />
              </button>
            </>
          )}
          empty={
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
          }
          footer={!loading && clients && clients.pagination.totalPages > 1 && (
            <Pagination page={clients.pagination.page} totalPages={clients.pagination.totalPages} onPageChange={setPage} />
          )}
        />
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
        <div className="field">
          <label htmlFor="client-name">{t('Nombre completo *', 'Full name *')}</label>
          <input id="client-name" type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder={t('Ej: María García', 'E.g. Mary Johnson')} />
        </div>
        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="client-document">{t('Documento', 'ID number')}</label>
            <input id="client-document" type="text" value={formData.document_id} onChange={e => setFormData({ ...formData, document_id: e.target.value })} placeholder={t('CI / DNI', 'ID / Passport')} />
          </div>
          <div className="field">
            <label htmlFor="client-birth">{t('Fecha de nac.', 'Date of birth')}</label>
            <input id="client-birth" type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="client-email">Email</label>
            <input id="client-email" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder={t('email@ejemplo.com', 'email@example.com')} />
          </div>
          <div className="field">
            <label htmlFor="client-phone">{t('Teléfono', 'Phone')}</label>
            <input id="client-phone" type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+598 99 123 456" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="client-address">{t('Dirección', 'Address')}</label>
          <input id="client-address" type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder={t('Calle 123, Ciudad', '123 Main St, City')} />
        </div>
        <div className="field">
          <label htmlFor="client-notes">{t('Notas', 'Notes')}</label>
          <textarea id="client-notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder={t('Observaciones del cliente…', 'Notes about the client…')} rows={3} />
        </div>
      </Modal>
    </Layout>
  );
};

export default ClientsPage;
