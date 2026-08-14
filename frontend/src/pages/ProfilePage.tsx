import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/auth';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrador del sistema',
  owner: 'Dueño de óptica',
  user: 'Empleado',
};

const emptyForm = { current_password: '', new_password: '', confirm_password: '' };

const formatDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
};

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const set = (field: keyof typeof emptyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (form.new_password.length < 6) {
      const msg = 'La contraseña nueva debe tener al menos 6 caracteres';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (form.new_password !== form.confirm_password) {
      const msg = 'La contraseña nueva y su confirmación no coinciden';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (form.new_password === form.current_password) {
      const msg = 'La contraseña nueva debe ser distinta de la actual';
      setFormError(msg);
      toast.error(msg);
      return;
    }

    try {
      setSaving(true);
      const data = await authService.changePassword({
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setForm(emptyForm);
      toast.success(data?.message || 'Contraseña actualizada correctamente');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const licenseLabel = user?.license_type === 'active'
    ? 'Licencia activa'
    : user?.license_type === 'trial'
      ? 'Período de prueba'
      : null;

  const licenseExpiry = user?.license_type === 'active'
    ? formatDate(user?.license_expires_at)
    : user?.license_type === 'trial'
      ? formatDate(user?.trial_expires_at)
      : null;

  const infoRows: { label: string; value: string }[] = [
    { label: 'Usuario', value: user?.username || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: 'Rol', value: user?.role ? (ROLE_LABELS[user.role] || user.role) : '—' },
  ];

  if (licenseLabel) {
    infoRows.push({ label: 'Licencia', value: licenseLabel });
  }
  if (licenseExpiry) {
    infoRows.push({
      label: user?.license_type === 'trial' ? 'Prueba vence el' : 'Licencia vence el',
      value: licenseExpiry,
    });
  }

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">Mi cuenta</h1>
            <p className="page-subtitle">Tus datos de acceso y cambio de contraseña</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          {/* Datos del usuario */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
              <div style={{
                width: 44, height: 44, borderRadius: 99,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
              }}>
                {user?.username?.charAt(0).toUpperCase() || <UserCircleIcon className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="section-title" style={{ margin: 0 }}>{user?.username}</h2>
                <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                  {user?.role ? (ROLE_LABELS[user.role] || user.role) : ''}
                </p>
              </div>
            </div>

            <dl style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
              {infoRows.map(row => (
                <div
                  key={row.label}
                  style={{
                    display: 'flex', justifyContent: 'space-between', gap: '1rem',
                    paddingBottom: '.75rem', borderBottom: '1px solid var(--border)',
                  }}
                >
                  <dt style={{ fontSize: '.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                    {row.label}
                  </dt>
                  <dd style={{ margin: 0, fontSize: '.85rem', color: 'var(--text-primary)', textAlign: 'right', wordBreak: 'break-word' }}>
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Cambio de contraseña */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '.375rem' }}>
              <KeyIcon className="w-5 h-5" style={{ color: 'var(--brand)' }} />
              <h2 className="section-title" style={{ margin: 0 }}>Cambiar contraseña</h2>
            </div>
            <p style={{ fontSize: '.825rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>
              Necesitás tu contraseña actual. La nueva debe tener al menos 6 caracteres.
            </p>

            {formError && (
              <div
                role="alert"
                style={{
                  background: 'var(--surface-3)',
                  border: '1px solid var(--danger)',
                  color: 'var(--danger)',
                  borderRadius: 'var(--radius)',
                  padding: '.75rem 1rem',
                  marginBottom: '1rem',
                  fontSize: '.825rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label htmlFor="current_password" style={{ display: 'block', marginBottom: '.375rem' }}>
                  Contraseña actual
                </label>
                <input
                  id="current_password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.current_password}
                  onChange={e => set('current_password', e.target.value)}
                  placeholder="Tu contraseña actual"
                />
              </div>
              <div>
                <label htmlFor="new_password" style={{ display: 'block', marginBottom: '.375rem' }}>
                  Contraseña nueva
                </label>
                <input
                  id="new_password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.new_password}
                  onChange={e => set('new_password', e.target.value)}
                  placeholder="Mín. 6 caracteres"
                />
              </div>
              <div>
                <label htmlFor="confirm_password" style={{ display: 'block', marginBottom: '.375rem' }}>
                  Confirmar contraseña nueva
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={e => set('confirm_password', e.target.value)}
                  placeholder="Repetir contraseña nueva"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ justifyContent: 'center', marginTop: '.25rem' }}
              >
                {saving ? 'Guardando…' : 'Cambiar contraseña'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
