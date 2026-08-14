import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { teamService } from '../services/team';
import { User } from '../types';
import {
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';

const TeamPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [saving, setSaving]   = useState(false);
  const [busyId, setBusyId]   = useState<number | null>(null);

  useEffect(() => { if (user?.role === 'owner') loadUsers(); }, [user]);

  // Estable: Modal re-ejecuta su efecto de foco cuando cambia onClose, y con
  // una función nueva por render el foco saltaría al primer campo al tipear.
  const closeModal = useCallback(() => {
    setShowModal(false);
    setSaving(false);
    setFormData({ username: '', email: '', password: '' });
  }, []);

  if (user && user.role !== 'owner') {
    return <Navigate to="/dashboard" replace />;
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await teamService.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar el equipo');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    try {
      setSaving(true);
      const created = await teamService.createUser(formData);
      toast.success(`Usuario ${created?.username || formData.username} creado`);
      closeModal();
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (busyId) return;
    if (!(await confirm({
      title: 'Desactivar usuario',
      message: `¿Seguro que querés desactivar a ${u.username}? Pierde el acceso a OpticApp de inmediato y deja de aparecer en tu equipo.`,
      confirmLabel: 'Desactivar',
      danger: true,
    }))) return;

    try {
      setBusyId(u.id);
      const res = await teamService.deleteUser(u.id);
      toast.success(res.message || `Usuario ${u.username} desactivado`);
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al desactivar');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Equipo</h1>
            <p className="page-subtitle">{users.length} empleados en tu óptica</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <PlusIcon className="w-4 h-4" />
            Nuevo empleado
          </button>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--danger)',
              borderRadius: 'var(--radius)',
              padding: '0.75rem 1rem',
              marginBottom: '1rem',
              color: 'var(--danger)',
              fontSize: '.875rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <div className="card" style={{ overflow: 'hidden' }}>
          <div className="table-scroll">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Activo desde</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <SkeletonRows rows={4} columns={4} />
                ) : users.length > 0 ? users.map(u => (
                  <tr key={u.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.username}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '.8rem' }}>
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES') : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id}
                          aria-label={`Desactivar usuario ${u.username}`}
                          title={`Desactivar usuario ${u.username}`}
                          style={{
                            display: 'flex', alignItems: 'center',
                            padding: '.375rem',
                            borderRadius: 'var(--radius)',
                            background: 'var(--surface-3)',
                            color: 'var(--danger)',
                            border: 'none',
                            opacity: busyId === u.id ? .5 : 1,
                            transition: 'all .15s',
                          }}
                        >
                          <TrashIcon className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4}>
                      <EmptyState
                        icon={<UserGroupIcon />}
                        title="Todavía no agregaste empleados"
                        description="Sumá a la gente que atiende en tu óptica para que pueda usar OpticApp con su propio usuario."
                        actionLabel="Agregar el primer usuario"
                        onAction={() => setShowModal(true)}
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
        title="Nuevo empleado"
        maxWidth={480}
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear empleado'}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="team-username" style={{ display: 'block', marginBottom: '.375rem' }}>Usuario *</label>
          <input
            id="team-username"
            type="text"
            required
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            placeholder="Ej: juan.perez"
          />
        </div>
        <div>
          <label htmlFor="team-email" style={{ display: 'block', marginBottom: '.375rem' }}>Email *</label>
          <input
            id="team-email"
            type="email"
            required
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@ejemplo.com"
          />
        </div>
        <div>
          <label htmlFor="team-password" style={{ display: 'block', marginBottom: '.375rem' }}>Contraseña *</label>
          <input
            id="team-password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            placeholder="Mínimo 6 caracteres"
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default TeamPage;
