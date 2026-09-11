import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import { useLanguage } from '../contexts/LanguageContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import LangToggle from '../components/LangToggle';
import PageHeader from '../components/PageHeader';
import DataTable, { Column } from '../components/DataTable';
import { adminService } from '../services/admin';
import { UserRequest, User } from '../types';
import {
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  CalendarDaysIcon,
  TrashIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(d: string | null | undefined, locale: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}

type RequestAction = 'approve' | 'reject';

const AdminRequestsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();
  const { t, lang, setLang, locale } = useLanguage();

  const [requests, setRequests] = useState<UserRequest[]>([]);
  const [users, setUsers]       = useState<User[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Una sola solicitud / un solo usuario en curso a la vez: evita el doble
  // clic que procesaría la misma acción dos veces.
  const [busyReq, setBusyReq]     = useState<{ id: number; action: RequestAction } | null>(null);
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  // Modal editar usuario
  const [editTarget, setEditTarget]     = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [showPass, setShowPass]         = useState(false);
  const [saving, setSaving]             = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      setError('');
      const [reqs, usrs] = await Promise.all([adminService.getRequests(), adminService.getUsers()]);
      setRequests(reqs);
      setUsers(usrs);
    } catch (err: any) {
      setError(err.response?.data?.error || t('Error al cargar datos', 'Could not load data'));
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (u: User) => {
    setEditTarget(u);
    setEditUsername(u.username);
    setEditPassword('');
    setShowPass(false);
  };
  // Estable: Modal re-ejecuta su efecto de foco cuando cambia onClose, y con
  // una función nueva por render el foco saltaría al primer campo al tipear.
  const closeEdit = useCallback(() => { setEditTarget(null); setSaving(false); }, []);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || saving) return;
    const usernameChanged = editUsername.trim() !== editTarget.username;
    if (!usernameChanged && !editPassword) {
      toast.info(t('No hay cambios para guardar', 'There are no changes to save'));
      return;
    }
    try {
      setSaving(true);
      const data: { username?: string; password?: string } = {};
      if (usernameChanged) data.username = editUsername.trim();
      if (editPassword) data.password = editPassword;
      const res = await adminService.updateUser(editTarget.id, data);
      toast.success(res.message || t('Usuario actualizado', 'User updated'));
      closeEdit();
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al actualizar usuario', 'Could not update the user'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    // Se cierra el modal de edición antes de confirmar para no anidar dos
    // diálogos (dos trampas de foco compitiendo).
    closeEdit();
    if (!(await confirm({
      title: t('Eliminar usuario', 'Delete user'),
      message: t(
        `¿Seguro que querés eliminar a ${u.username}? Pierde el acceso a OpticApp de forma permanente y la acción no se puede deshacer.`,
        `Are you sure you want to delete ${u.username}? They permanently lose access to OpticApp and this can’t be undone.`,
      ),
      confirmLabel: t('Eliminar', 'Delete'),
      danger: true,
    }))) return;

    try {
      setBusyUserId(u.id);
      const res = await adminService.deleteUser(u.id);
      toast.success(res.message || t(`Usuario ${u.username} eliminado`, `User ${u.username} deleted`));
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al eliminar usuario', 'Could not delete the user'));
    } finally {
      setBusyUserId(null);
    }
  };

  const handleApprove = async (req: UserRequest) => {
    if (busyReq) return;
    try {
      setBusyReq({ id: req.id, action: 'approve' });
      const res: any = await adminService.approveRequest(req.id);
      toast.success(res?.message || t(`Solicitud de ${req.username} aprobada`, `${req.username}’s request approved`));
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al aprobar', 'Could not approve'));
    } finally {
      setBusyReq(null);
    }
  };

  const handleReject = async (req: UserRequest) => {
    if (busyReq) return;
    if (!(await confirm({
      title: t('Rechazar solicitud', 'Reject request'),
      message: t(
        `¿Seguro que querés rechazar la solicitud de ${req.username}? Se desactiva su cuenta y se le envía un email avisándole.`,
        `Are you sure you want to reject ${req.username}’s request? Their account is deactivated and they get an email letting them know.`,
      ),
      confirmLabel: t('Rechazar', 'Reject'),
      danger: true,
    }))) return;

    try {
      setBusyReq({ id: req.id, action: 'reject' });
      const res: any = await adminService.rejectRequest(req.id);
      toast.success(res?.message || t(`Solicitud de ${req.username} rechazada`, `${req.username}’s request rejected`));
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al rechazar', 'Could not reject'));
    } finally {
      setBusyReq(null);
    }
  };

  const handleExtend = async (u: User) => {
    if (busyUserId) return;
    try {
      setBusyUserId(u.id);
      const res = await adminService.extendLicense(u.id);
      toast.success(res.message || t(`Licencia de ${u.username} extendida un mes`, `${u.username}’s license extended by one month`));
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || t('Error al extender licencia', 'Could not extend the license'));
    } finally {
      setBusyUserId(null);
    }
  };

  const pending   = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  const expiryOf = (u: User) => (u.license_type === 'trial' ? u.trial_expires_at : u.license_expires_at);

  // Usuarios con licencia próxima a vencer (≤ 7 días) o vencida
  const expiringUsers = nonAdminUsers.filter(u => {
    const days = daysUntil(expiryOf(u));
    return days !== null && days <= 7;
  });
  const expiringCount = expiringUsers.length;

  const who = (name: string, email?: string | null) => (
    <div style={{ minWidth: 0 }}>
      <p className="who-name" style={{ fontSize: '.875rem' }}>{name}</p>
      {email && <p className="who-sub">{email}</p>}
    </div>
  );

  const historyColumns: Column<UserRequest>[] = [
    { key: 'user', header: t('Usuario', 'User'), mobile: 'primary', render: r => who(r.username, r.email) },
    { key: 'optics', header: t('Óptica', 'Store'), render: r => <span className="cell-secondary">{r.optics_name}</span> },
    { key: 'requested', header: t('Solicitado', 'Requested'), render: r => <span className="cell-muted">{formatDate(r.requested_at, locale)}</span> },
    { key: 'reviewer', header: t('Revisado por', 'Reviewed by'), render: r => <span className="cell-secondary">{r.reviewer_username || '—'}</span> },
    { key: 'status', header: t('Estado', 'Status'), render: r => <StatusBadge status={r.status} /> },
  ];

  const userColumns: Column<User>[] = [
    { key: 'user', header: t('Usuario', 'User'), mobile: 'primary', render: u => who(u.username, u.email) },
    { key: 'license', header: t('Licencia', 'License'), render: u => <LicenseTypeBadge type={u.license_type} /> },
    {
      key: 'expiry',
      header: t('Vencimiento', 'Expires'),
      render: u => {
        const days = daysUntil(expiryOf(u));
        const isExpired = days !== null && days < 0;
        const isUrgent = days !== null && days >= 0 && days <= 3;
        const tone = isExpired ? 'var(--danger-text)' : isUrgent ? 'var(--warning-text)' : undefined;
        return (
          <div>
            <div style={{ fontSize: '.85rem', fontWeight: 650, color: tone || 'var(--text-primary)' }}>
              {formatDate(expiryOf(u), locale)}
            </div>
            {days !== null && (
              <div style={{ fontSize: '.72rem', color: tone || 'var(--text-muted)', fontWeight: tone ? 650 : 400 }}>
                {isExpired
                  ? t('Vencida', 'Expired')
                  : days === 0 ? t('Vence hoy', 'Expires today') : t(`${days}d restantes`, `${days}d left`)}
              </div>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="topbar max-w-5xl mx-auto">
          <div className="topbar-side">
            <span className="brand">
              <img src="/logo.png" alt="OpticApp" />
              <span>OpticApp</span>
            </span>
            <span className="badge badge-violet">Admin</span>
          </div>
          <div className="topbar-side">
            <LangToggle lang={lang} onChange={setLang} label={t('Idioma', 'Language')} />
            <span className="user-pill hidden sm:inline-flex" style={{ cursor: 'default' }}>
              <span className="avatar grad sm">{user?.username?.charAt(0).toUpperCase()}</span>
              <span>{user?.username}</span>
            </span>
            <button onClick={logout} className="btn btn-ghost btn-sm">
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              {t('Salir', 'Log out')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-7 fade-in">

        {/* Alerta de licencias por vencer */}
        {!loading && expiringCount > 0 && (
          <div role="status" className="notice" style={{ marginBottom: '1.25rem' }}>
            <ClockIcon aria-hidden="true" />
            <div>
              <p className="notice-title">
                {t(
                  `${expiringCount} usuario${expiringCount !== 1 ? 's' : ''} con licencia próxima a vencer`,
                  `${expiringCount} user${expiringCount !== 1 ? 's' : ''} with a license about to expire`,
                )}
              </p>
              <p className="notice-text">
                {expiringUsers.map(u => {
                  const days = daysUntil(expiryOf(u));
                  const status = days !== null && days < 0
                    ? t('vencida', 'expired')
                    : days === 0 ? t('vence hoy', 'expires today') : `${days}d`;
                  return `${u.username} (${status})`;
                }).join(' · ')}
              </p>
            </div>
          </div>
        )}

        <PageHeader
          eyebrow={t('Administración', 'Administration')}
          title={t('Solicitudes de acceso', 'Access requests')}
          subtitle={t(
            `${pending.length} pendiente${pending.length !== 1 ? 's' : ''} · ${processed.length} procesada${processed.length !== 1 ? 's' : ''}`,
            `${pending.length} pending · ${processed.length} processed`,
          )}
          actions={
            <button className="btn btn-ghost" onClick={loadAll} disabled={loading}>
              <ArrowPathIcon className="w-4 h-4" />
              {t('Actualizar', 'Refresh')}
            </button>
          }
        />

        {error && (
          <div role="alert" className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <ExclamationCircleIcon />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <DataTable rows={[]} columns={historyColumns} rowKey={r => r.id} loading skeletonRows={4} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Pendientes */}
            <section>
              <div className="section-title">{t('Pendientes', 'Pending')}</div>
              {pending.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                  {pending.map(req => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      busy={busyReq?.id === req.id ? busyReq.action : null}
                      blocked={busyReq !== null}
                      onApprove={() => handleApprove(req)}
                      onReject={() => handleReject(req)}
                    />
                  ))}
                </div>
              ) : (
                <div className="card">
                  <EmptyState
                    icon={<ShieldCheckIcon />}
                    title={t('No hay solicitudes pendientes', 'No pending requests')}
                    description={t(
                      'Todo al día: ya revisaste cada pedido de acceso que llegó.',
                      'All caught up: you’ve reviewed every access request that came in.',
                    )}
                  />
                </div>
              )}
            </section>

            {/* Historial */}
            {processed.length > 0 && (
              <section>
                <div className="section-title">{t('Historial', 'History')}</div>
                <DataTable rows={processed} columns={historyColumns} rowKey={r => r.id} />
              </section>
            )}

            {/* Usuarios con licencias */}
            {nonAdminUsers.length > 0 && (
              <section>
                <div className="section-title">{t('Usuarios y licencias', 'Users and licenses')}</div>
                <DataTable
                  rows={nonAdminUsers}
                  columns={userColumns}
                  rowKey={u => u.id}
                  actionsLabel={t('Acciones', 'Actions')}
                  actions={u => {
                    const busy = busyUserId === u.id;
                    return (
                      <>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleExtend(u)}
                          disabled={busy}
                          aria-label={t(`Extender un mes la licencia de ${u.username}`, `Extend ${u.username}’s license by one month`)}
                        >
                          <CalendarDaysIcon style={{ width: 13, height: 13 }} aria-hidden="true" />
                          {busy ? t('Aplicando…', 'Applying…') : t('+1 mes', '+1 month')}
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(u)}
                          disabled={busy}
                          aria-label={t(`Editar usuario ${u.username}`, `Edit user ${u.username}`)}
                        >
                          <KeyIcon style={{ width: 13, height: 13 }} aria-hidden="true" />
                          {t('Editar', 'Edit')}
                        </button>
                      </>
                    );
                  }}
                />
              </section>
            )}
          </div>
        )}
      </main>

      {/* Modal editar usuario */}
      <Modal
        open={editTarget !== null}
        onClose={closeEdit}
        title={t('Editar usuario', 'Edit user')}
        maxWidth={440}
        onSubmit={handleEdit}
        footer={
          <>
            {editTarget && editTarget.role !== 'admin' && (
              <button
                type="button"
                className="btn btn-danger-solid"
                onClick={() => handleDelete(editTarget)}
                disabled={saving}
                aria-label={t(`Eliminar usuario ${editTarget.username}`, `Delete user ${editTarget.username}`)}
                style={{ marginRight: 'auto' }}
              >
                <TrashIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
                {t('Eliminar usuario', 'Delete user')}
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={closeEdit} disabled={saving}>{t('Cancelar', 'Cancel')}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? t('Guardando…', 'Saving…') : t('Guardar cambios', 'Save changes')}
            </button>
          </>
        }
      >
        <div className="field">
          <label htmlFor="edit-username">{t('Nombre de usuario', 'Username')}</label>
          <input
            id="edit-username"
            type="text"
            required
            minLength={3}
            value={editUsername}
            onChange={e => setEditUsername(e.target.value.replace(/\s/g, ''))}
            placeholder={t('Sin espacios', 'No spaces')}
          />
          <p className="hint">{t('Los espacios se eliminan automáticamente.', 'Spaces are removed automatically.')}</p>
        </div>

        <div className="field">
          <label htmlFor="edit-password">
            {t('Nueva contraseña', 'New password')} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>({t('opcional', 'optional')})</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="edit-password"
              type={showPass ? 'text' : 'password'}
              minLength={6}
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder={t('Dejar vacío para no cambiar', 'Leave empty to keep it')}
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? t('Ocultar contraseña', 'Hide password') : t('Mostrar contraseña', 'Show password')}
              style={{ position: 'absolute', right: '.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              {showPass
                ? <EyeSlashIcon style={{ width: 16, height: 16 }} aria-hidden="true" />
                : <EyeIcon style={{ width: 16, height: 16 }} aria-hidden="true" />}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const { t } = useLanguage();
  if (status === 'approved') return (
    <span className="badge badge-green" style={{ gap: 4 }}>
      <CheckCircleIcon style={{ width: 11, height: 11 }} aria-hidden="true" /> {t('Aprobada', 'Approved')}
    </span>
  );
  if (status === 'rejected') return (
    <span className="badge badge-red" style={{ gap: 4 }}>
      <XCircleIcon style={{ width: 11, height: 11 }} aria-hidden="true" /> {t('Rechazada', 'Rejected')}
    </span>
  );
  return (
    <span className="badge badge-yellow" style={{ gap: 4 }}>
      <ClockIcon style={{ width: 11, height: 11 }} aria-hidden="true" /> {t('Pendiente', 'Pending')}
    </span>
  );
};

const LicenseTypeBadge: React.FC<{ type?: 'trial' | 'active' }> = ({ type }) => {
  const { t } = useLanguage();
  return type === 'active'
    ? <span className="badge badge-green">{t('Activa', 'Active')}</span>
    : <span className="badge badge-yellow">{t('Prueba', 'Trial')}</span>;
};

const RequestCard: React.FC<{
  req: UserRequest;
  /** Acción en curso sobre ESTA solicitud, si la hay. */
  busy: RequestAction | null;
  /** Hay una acción en curso en la página: bloquea el resto de las tarjetas. */
  blocked: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ req, busy, blocked, onApprove, onReject }) => {
  const { t, locale } = useLanguage();
  return (
    <article className="request-card">
      <span className="avatar grad" aria-hidden="true">{req.username.charAt(0).toUpperCase()}</span>

      <div className="request-main">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span className="who-name">{req.username}</span>
          <span className="who-sub">{req.email}</span>
        </div>
        <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
          {t('Óptica', 'Store')}: <strong style={{ color: 'var(--text-primary)' }}>{req.optics_name}</strong>
          <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
          <span className="cell-muted">{formatDate(req.requested_at, locale)}</span>
        </div>
      </div>

      <div className="request-actions">
        <button
          type="button"
          className="btn btn-sm btn-reject"
          onClick={onReject}
          disabled={blocked}
          aria-label={t(`Rechazar solicitud de ${req.username}`, `Reject ${req.username}’s request`)}
        >
          <XCircleIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
          {busy === 'reject' ? t('Rechazando…', 'Rejecting…') : t('Rechazar', 'Reject')}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-approve"
          onClick={onApprove}
          disabled={blocked}
          aria-label={t(
            `Aprobar solicitud de ${req.username} y darle un mes de licencia`,
            `Approve ${req.username}’s request and grant one month of license`,
          )}
        >
          <CheckCircleIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
          {busy === 'approve' ? t('Aprobando…', 'Approving…') : t('Aprobar (+1 mes)', 'Approve (+1 month)')}
        </button>
      </div>
    </article>
  );
};

export default AdminRequestsPage;
