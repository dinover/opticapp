import React, { useState } from 'react';
import Layout from '../components/Layout';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/auth';
import { UserCircleIcon, KeyIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

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

  const infoRows: { label: string; value: React.ReactNode }[] = [
    { label: t('Usuario', 'Username'), value: user?.username || '—' },
    { label: 'Email', value: user?.email || '—' },
    { label: t('Rol', 'Role'), value: roleLabel || '—' },
  ];

  if (licenseLabel) {
    infoRows.push({
      label: t('Licencia', 'License'),
      value: <span className={`badge ${user?.license_type === 'active' ? 'badge-green' : 'badge-yellow'}`}>{licenseLabel}</span>,
    });
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
        <PageHeader
          eyebrow={t('Cuenta', 'Account')}
          title={t('Mi cuenta', 'My account')}
          subtitle={t('Tus datos de acceso y cambio de contraseña', 'Your login details and password change')}
        />

        <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))' }}>
          {/* Datos del usuario */}
          <section className="card" style={{ padding: '1.6rem' }}>
            <div className="profile-head">
              <span className="profile-avatar">
                {user?.username?.charAt(0).toUpperCase() || <UserCircleIcon className="w-6 h-6" />}
              </span>
              <div style={{ minWidth: 0 }}>
                <h2 className="profile-name">{user?.username}</h2>
                <p className="profile-role">{roleLabel}</p>
              </div>
            </div>

            <dl className="info-list">
              {infoRows.map(row => (
                <div key={row.label} className="info-row">
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Cambio de contraseña */}
          <section className="card" style={{ padding: '1.6rem' }}>
            <h2 className="card-heading">
              <span className="panel-icon"><KeyIcon /></span>
              {t('Cambiar contraseña', 'Change password')}
            </h2>
            <p className="card-lead">
              {t(
                'Necesitás tu contraseña actual. La nueva debe tener al menos 6 caracteres.',
                'You need your current password. The new one must be at least 6 characters.',
              )}
            </p>

            {formError && (
              <div role="alert" className="alert alert-danger" style={{ marginBottom: '1rem' }}>
                <ExclamationCircleIcon />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="field">
                <label htmlFor="current_password">{t('Contraseña actual', 'Current password')}</label>
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
              <div className="field">
                <label htmlFor="new_password">{t('Contraseña nueva', 'New password')}</label>
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
              <div className="field">
                <label htmlFor="confirm_password">{t('Confirmar contraseña nueva', 'Confirm new password')}</label>
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

              <button type="submit" className="btn btn-cta btn-block" disabled={saving} style={{ marginTop: '.25rem' }}>
                {saving ? t('Guardando…', 'Saving…') : t('Cambiar contraseña', 'Change password')}
              </button>
            </form>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
