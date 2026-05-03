import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Pagination from '../components/Pagination';
import { clientsService } from '../services/clients';
import { Client, PaginatedResponse } from '../types';
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<PaginatedResponse<Client> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '', document_id: '', email: '', phone: '',
    address: '', birth_date: '', notes: '',
  });

  useEffect(() => { loadClients(); }, [page, search]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const data = await clientsService.getAll({ page, limit: 10, search: search || undefined, sortBy: 'created_at', sortOrder: 'DESC' });
      setClients(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClient) await clientsService.update(editingClient.id, formData);
      else await clientsService.create(formData);
      closeModal();
      loadClients();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar cliente');
    }
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

  const handleDelete = async (id: number) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try { await clientsService.delete(id); loadClients(); }
    catch (err: any) { alert(err.response?.data?.error || 'Error al eliminar'); }
  };

  const closeModal = () => { setShowModal(false); setEditingClient(null); setFormData({ name: '', document_id: '', email: '', phone: '', address: '', birth_date: '', notes: '' }); };

  const avatarColor = (name: string) => {
    const colors = [
      ['#ede9fe', '#6d28d9'], ['#dbeafe', '#1d4ed8'], ['#dcfce7', '#15803d'],
      ['#fef3c7', '#b45309'], ['#fce7f3', '#be185d'],
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Clientes</h1>
            <p className="page-subtitle">{clients?.pagination.total ?? 0} clientes registrados</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditingClient(null); setShowModal(true); }}>
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
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem', color: '#991b1b', fontSize: '.875rem' }}>
            {error}
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
              <div className="spinner" />
            </div>
          ) : (
            <>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Documento</th>
                    <th>Contacto</th>
                    <th>Nacimiento</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {clients?.data && clients.data.length > 0 ? clients.data.map(client => {
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
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                            <button
                              onClick={() => handleEdit(client)}
                              style={{ padding: '.375rem', borderRadius: 7, background: '#eef2ff', color: '#4f46e5', border: 'none', cursor: 'pointer', transition: 'all .15s' }}
                              title="Editar"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(client.id)}
                              style={{ padding: '.375rem', borderRadius: 7, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer', transition: 'all .15s' }}
                              title="Eliminar"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty-state">
                          <UserCircleIcon style={{ width: 40, height: 40, margin: '0 auto 0.75rem' }} />
                          <p>No hay clientes registrados</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {clients && clients.pagination.totalPages > 1 && (
                <Pagination page={clients.pagination.page} totalPages={clients.pagination.totalPages} onPageChange={setPage} />
              )}
            </>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {editingClient ? 'Editar cliente' : 'Nuevo cliente'}
              </h3>
              <button onClick={closeModal} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Nombre completo *</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej: María García" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Documento</label>
                    <input type="text" value={formData.document_id} onChange={e => setFormData({ ...formData, document_id: e.target.value })} placeholder="CI / DNI" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Fecha de nac.</label>
                    <input type="date" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Email</label>
                    <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="email@ejemplo.com" />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Teléfono</label>
                    <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+598 99 123 456" />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Dirección</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} placeholder="Calle 123, Ciudad" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Notas</label>
                  <textarea value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Observaciones del cliente…" rows={3} />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary">
                  {editingClient ? 'Guardar cambios' : 'Crear cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ClientsPage;
