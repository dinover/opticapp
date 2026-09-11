import React, { useState, useEffect, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Skeleton';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { t, locale } = useLanguage();

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
      setError(err.response?.data?.error || t('Error al cargar el equipo', 'Could not load the team'));
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
      const name = created?.username || formData.username;
      toast.success(t(`Usuario ${name} creado`, `User ${name} created`));
      closeModal();
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al crear usuario', 'Could not create the user'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (busyId) return;
    if (!(await confirm({
      title: t('Desactivar usuario', 'Deactivate user'),
      message: t(
        `¿Seguro que querés desactivar a ${u.username}? Pierde el acceso a OpticApp de inmediato y deja de aparecer en tu equipo.`,
        `Are you sure you want to deactivate ${u.username}? They lose access to OpticApp immediately and stop showing up on your team.`,
      ),
      confirmLabel: t('Desactivar', 'Deactivate'),
      danger: true,
    }))) return;

    try {
      setBusyId(u.id);
      const res = await teamService.deleteUser(u.id);
      toast.success(res.message || t(`Usuario ${u.username} desactivado`, `User ${u.username} deactivated`));
      await loadUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al desactivar', 'Could not deactivate'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('Equipo', 'Team')}</h1>
            <p className="page-subtitle">{t(
              `${users.length} empleado${users.length !== 1 ? 's' : ''} en tu óptica`,
              `${users.length} employee${users.length !== 1 ? 's' : ''} in your store`,
            )}</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <PlusIcon className="w-4 h-4" />
            {t('Nuevo empleado', 'New employee')}
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
                  <th>{t('Usuario', 'User')}</th>
                  <th>Email</th>
                  <th>{t('Activo desde', 'Active since')}</th>
                  <th style={{ textAlign: 'right' }}>{t('Acciones', 'Actions')}</th>
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
                      {u.created_at ? new Date(u.created_at).toLocaleDateString(locale) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={busyId === u.id}
                          aria-label={t(`Desactivar usuario ${u.username}`, `Deactivate user ${u.username}`)}
                          title={t(`Desactivar usuario ${u.username}`, `Deactivate user ${u.username}`)}
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
                        title={t('Todavía no agregaste empleados', 'You haven’t added employees yet')}
                        description={t(
                          'Sumá a la gente que atiende en tu óptica para que pueda usar OpticApp con su propio usuario.',
                          'Add the people who work at your store so they can use OpticApp with their own login.',
                        )}
                        actionLabel={t('Agregar el primer usuario', 'Add the first user')}
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
        title={t('Nuevo empleado', 'New employee')}
        maxWidth={480}
        onSubmit={handleSubmit}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={closeModal} disabled={saving}>{t('Cancelar', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('Creando…', 'Creating…') : t('Crear empleado', 'Create employee')}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="team-username" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Usuario *', 'Username *')}</label>
          <input
            id="team-username"
            type="text"
            required
            value={formData.username}
            onChange={e => setFormData({ ...formData, username: e.target.value })}
            placeholder={t('Ej: juan.perez', 'E.g. john.smith')}
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
            placeholder={t('email@ejemplo.com', 'email@example.com')}
          />
        </div>
        <div>
          <label htmlFor="team-password" style={{ display: 'block', marginBottom: '.375rem' }}>{t('Contraseña *', 'Password *')}</label>
          <input
            id="team-password"
            type="password"
            required
            minLength={6}
            value={formData.password}
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            placeholder={t('Mínimo 6 caracteres', 'At least 6 characters')}
          />
        </div>
      </Modal>
    </Layout>
  );
};

export default TeamPage;
