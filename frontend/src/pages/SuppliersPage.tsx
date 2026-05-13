import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
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

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q ? suppliers.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.contact_name || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      ) : suppliers
    );
  }, [search, suppliers]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await suppliersService.getAll();
      setSuppliers(data);
    } catch {
      // silenciar
    } finally {
      setLoading(false);
    }
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
      if (editing) await suppliersService.update(editing.id, form);
      else await suppliersService.create(form);
      closeModal();
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Supplier) => {
    if (!confirm(`¿Eliminar proveedor "${s.name}"? Los armazones asociados quedarán sin proveedor.`)) return;
    try {
      await suppliersService.delete(s.id);
      load();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al eliminar');
    }
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
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Nombre', 'Contacto', 'Teléfono', 'Email', 'Notas', ''].map(h => (
                    <th key={h} style={{ padding: '.75rem 1rem', textAlign: 'left', fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '.875rem 1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '.9rem' }}>{s.name}</div>
                    </td>
                    <td style={{ padding: '.875rem 1rem', color: 'var(--text-secondary)', fontSize: '.875rem' }}>
                      {s.contact_name || <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '.875rem 1rem', fontSize: '.875rem' }}>
                      {s.phone
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}><PhoneIcon className="w-3.5 h-3.5" />{s.phone}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '.875rem 1rem', fontSize: '.875rem' }}>
                      {s.email
                        ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-secondary)' }}><EnvelopeIcon className="w-3.5 h-3.5" />{s.email}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ padding: '.875rem 1rem', color: 'var(--text-muted)', fontSize: '.8rem', maxWidth: 180 }}>
                      <span style={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
                        {s.notes || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '.875rem 1rem' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        <button onClick={() => openEdit(s)} style={{ padding: '.35rem', borderRadius: 7, background: '#eef2ff', color: '#4f46e5', border: 'none', cursor: 'pointer' }} title="Editar">
                          <PencilIcon className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(s)} style={{ padding: '.35rem', borderRadius: 7, background: '#fef2f2', color: '#ef4444', border: 'none', cursor: 'pointer' }} title="Eliminar">
                          <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card">
            <div className="empty-state">
              <TruckIcon style={{ width: 40, height: 40, margin: '0 auto 0.75rem' }} />
              <p>{search ? 'No hay resultados para tu búsqueda' : 'No hay proveedores registrados'}</p>
              {!search && (
                <button className="btn btn-primary" style={{ marginTop: '.75rem' }} onClick={openCreate}>
                  <PlusIcon className="w-4 h-4" />
                  Agregar primer proveedor
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-box" style={{ maxWidth: 480 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
              </h3>
              <button onClick={closeModal} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Nombre *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nombre del proveedor" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Contacto</label>
                  <input type="text" value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} placeholder="Nombre del contacto" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Teléfono</label>
                    <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+598 99..." />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '.375rem' }}>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="proveedor@..." />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem' }}>Notas</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notas opcionales…" rows={2} />
                </div>
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SuppliersPage;
