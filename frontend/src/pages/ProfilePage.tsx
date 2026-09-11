import React, { useState } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/auth';
import { UserCircleIcon, KeyIcon } from '@heroicons/react/24/outline';

const emptyForm = { current_password: '', new_password: '', confirm_password: '' };

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { t, locale } = useLanguage();

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const roleLabels: Record<string, string> = {
    admin: t('Administrador del sistema', 'System administrator'),
    owner: t('Dueño de óptica', 'Store owner'),
    user: t('Empleado', 'Employee'),
  };

  const formatDate = (value?: string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const set = (field: keyof typeof emptyForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (formError) setFormError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (form.new_password.length < 6) {
      const msg = t('La contraseña nueva debe tener al menos 6 caracteres', 'The new password must be at least 6 characters');
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (form.new_password !== form.confirm_password) {
      const msg = t('La contraseña nueva y su confirmación no coinciden', 'The new password and its confirmation don’t match');
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (form.new_password === form.current_password) {
      const msg = t('La contraseña nueva debe ser distinta de la actual', 'The new password must be different from the current one');
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
      toast.success(data?.message || t('Contraseña actualizada correctamente', 'Password updated successfully'));
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('No se pudo cambiar la contraseña', 'Could not change the password'));
    } finally {
      setSaving(false);
    }
  };

  const licenseLabel = user?.license_type === 'active'
    ? t('Licencia activa', 'Active license')
    : user?.license_type === 'trial'
      ? t('Período de prueba', 'Trial period')
      : null;

  const licenseExpiry = user?.license_type === 'active'
    ? formatDate(user?.license_expires_at)
    : user?.license_type === 'trial'
      ? formatDate(user?.trial_expires_at)
      : null;

  const roleLabel = user?.role ? (roleLabels[user.role] || user.role) : '';

  const infoRows: { label: string; value: string }[] = [
    { label: t('Usuario', 'Username'), value: user?.username || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: t('Rol', 'Role'), value: roleLabel || '—' },
  ];

  if (licenseLabel) {
    infoRows.push({ label: t('Licencia', 'License'), value: licenseLabel });
  }
  if (licenseExpiry) {
    infoRows.push({
      label: user?.license_type === 'trial' ? t('Prueba vence el', 'Trial ends on') : t('Licencia vence el', 'License expires on'),
      value: licenseExpiry,
    });
  }

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">{t('Mi cuenta', 'My account')}</h1>
            <p className="page-subtitle">{t('Tus datos de acceso y cambio de contraseña', 'Your login details and password change')}</p>
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
                  {roleLabel}
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
              <h2 className="section-title" style={{ margin: 0 }}>{t('Cambiar contraseña', 'Change password')}</h2>
            </div>
            <p style={{ fontSize: '.825rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem' }}>
              {t(
                'Necesitás tu contraseña actual. La nueva debe tener al menos 6 caracteres.',
                'You need your current password. The new one must be at least 6 characters.',
              )}
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
                  {t('Contraseña actual', 'Current password')}
                </label>
                <input
                  id="current_password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={form.current_password}
                  onChange={e => set('current_password', e.target.value)}
                  placeholder={t('Tu contraseña actual', 'Your current password')}
                />
              </div>
              <div>
                <label htmlFor="new_password" style={{ display: 'block', marginBottom: '.375rem' }}>
                  {t('Contraseña nueva', 'New password')}
                </label>
                <input
                  id="new_password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.new_password}
                  onChange={e => set('new_password', e.target.value)}
                  placeholder={t('Mín. 6 caracteres', 'Min. 6 characters')}
                />
              </div>
              <div>
                <label htmlFor="confirm_password" style={{ display: 'block', marginBottom: '.375rem' }}>
                  {t('Confirmar contraseña nueva', 'Confirm new password')}
                </label>
                <input
                  id="confirm_password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={form.confirm_password}
                  onChange={e => set('confirm_password', e.target.value)}
                  placeholder={t('Repetir contraseña nueva', 'Repeat new password')}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                style={{ justifyContent: 'center', marginTop: '.25rem' }}
              >
                {saving ? t('Guardando…', 'Saving…') : t('Cambiar contraseña', 'Change password')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
