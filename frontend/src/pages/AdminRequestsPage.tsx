import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { SkeletonRows } from '../components/Skeleton';
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
} from '@heroicons/react/24/outline';

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatDate(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

type RequestAction = 'approve' | 'reject';

const AdminRequestsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const toast = useToast();
  const confirm = useConfirm();

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
      setError(err.response?.data?.error || 'Error al cargar datos');
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
      toast.info('No hay cambios para guardar');
      return;
    }
    try {
      setSaving(true);
      const data: { username?: string; password?: string } = {};
      if (usernameChanged) data.username = editUsername.trim();
      if (editPassword) data.password = editPassword;
      const res = await adminService.updateUser(editTarget.id, data);
      toast.success(res.message || 'Usuario actualizado');
      closeEdit();
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al actualizar usuario');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    // Se cierra el modal de edición antes de confirmar para no anidar dos
    // diálogos (dos trampas de foco compitiendo).
    closeEdit();
    if (!(await confirm({
      title: 'Eliminar usuario',
      message: `¿Seguro que querés eliminar a ${u.username}? Pierde el acceso a OpticApp de forma permanente y la acción no se puede deshacer.`,
      confirmLabel: 'Eliminar',
      danger: true,
    }))) return;

    try {
      setBusyUserId(u.id);
      const res = await adminService.deleteUser(u.id);
      toast.success(res.message || `Usuario ${u.username} eliminado`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al eliminar usuario');
    } finally {
      setBusyUserId(null);
    }
  };

  const handleApprove = async (req: UserRequest) => {
    if (busyReq) return;
    try {
      setBusyReq({ id: req.id, action: 'approve' });
      const res: any = await adminService.approveRequest(req.id);
      toast.success(res?.message || `Solicitud de ${req.username} aprobada`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al aprobar');
    } finally {
      setBusyReq(null);
    }
  };

  const handleReject = async (req: UserRequest) => {
    if (busyReq) return;
    if (!(await confirm({
      title: 'Rechazar solicitud',
      message: `¿Seguro que querés rechazar la solicitud de ${req.username}? Se desactiva su cuenta y se le envía un email avisándole.`,
      confirmLabel: 'Rechazar',
      danger: true,
    }))) return;

    try {
      setBusyReq({ id: req.id, action: 'reject' });
      const res: any = await adminService.rejectRequest(req.id);
      toast.success(res?.message || `Solicitud de ${req.username} rechazada`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al rechazar');
    } finally {
      setBusyReq(null);
    }
  };

  const handleExtend = async (u: User) => {
    if (busyUserId) return;
    try {
      setBusyUserId(u.id);
      const res = await adminService.extendLicense(u.id);
      toast.success(res.message || `Licencia de ${u.username} extendida un mes`);
      await loadAll();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al extender licencia');
    } finally {
      setBusyUserId(null);
    }
  };

  const pending   = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  // Usuarios con licencia próxima a vencer (≤ 7 días) o vencida
  const expiringUsers = nonAdminUsers.filter(u => {
    const expiry = u.license_type === 'trial' ? u.trial_expires_at : u.license_expires_at;
    const days = daysUntil(expiry);
    return days !== null && days <= 7;
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      {/* Topbar */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="OpticApp" style={{ width: 30, height: 30, objectFit: 'contain' }} />
            <div>
              <span style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-primary)' }}>OpticApp</span>
              <span className="badge badge-blue" style={{ marginLeft: 8 }}>Admin</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>{user?.username}</span>
            <button onClick={logout} className="btn btn-ghost" style={{ fontSize: '.8rem', padding: '.4rem .75rem' }}>
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              Salir
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 fade-in">

        {/* Alerta de licencias por vencer */}
        {!loading && expiringUsers.length > 0 && (
          <div
            role="status"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--warning)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
              padding: '.875rem 1.125rem',
              marginBottom: '1.25rem',
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}
          >
            <ClockIcon style={{ width: 18, height: 18, flexShrink: 0, color: 'var(--warning)' }} aria-hidden="true" />
            <div>
              <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '.875rem', color: 'var(--text-primary)' }}>
                {expiringUsers.length} usuario{expiringUsers.length !== 1 ? 's' : ''} con licencia próxima a vencer
              </p>
              <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                {expiringUsers.map(u => {
                  const expiry = u.license_type === 'trial' ? u.trial_expires_at : u.license_expires_at;
                  const days = daysUntil(expiry);
                  return `${u.username} (${days !== null && days < 0 ? 'vencida' : days === 0 ? 'vence hoy' : `${days}d`})`;
                }).join(' · ')}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Solicitudes de acceso</h1>
            <p className="page-subtitle">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {processed.length} procesada{processed.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={loadAll} disabled={loading} style={{ fontSize: '.8rem' }}>
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
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
              padding: '.75rem 1rem',
              marginBottom: '1.25rem',
              color: 'var(--danger)',
              fontSize: '.875rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        {loading ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="table-scroll">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Óptica</th>
                    <th>Solicitado</th>
                    <th>Revisado por</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonRows rows={4} columns={5} />
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Pendientes */}
            <div>
              <div className="section-title">Pendientes</div>
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
                    title="No hay solicitudes pendientes"
                    description="Todo al día: ya revisaste cada pedido de acceso que llegó."
                  />
                </div>
              )}
            </div>

            {/* Historial */}
            {processed.length > 0 && (
              <div>
                <div className="section-title">Historial</div>
                <div className="card" style={{ overflow: 'hidden' }}>
                  <div className="table-scroll">
                    <table className="tbl">
                      <thead>
                        <tr>
                          <th>Usuario</th>
                          <th>Óptica</th>
                          <th>Solicitado</th>
                          <th>Revisado por</th>
                          <th>Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {processed.map(req => (
                          <tr key={req.id}>
                            <td>
                              <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{req.username}</div>
                              <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{req.email}</div>
                            </td>
                            <td style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>{req.optics_name}</td>
                            <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                              {formatDate(req.requested_at)}
                            </td>
                            <td style={{ fontSize: '.8rem', color: 'var(--text-secondary)' }}>
                              {req.reviewer_username || '—'}
                            </td>
                            <td>
                              <StatusBadge status={req.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sección usuarios con licencias */}
        {!loading && nonAdminUsers.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div className="section-title">Usuarios y licencias</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <div className="table-scroll">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Licencia</th>
                      <th>Vencimiento</th>
                      <th style={{ textAlign: 'right' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nonAdminUsers.map(u => {
                      const expiry = u.license_type === 'trial' ? u.trial_expires_at : u.license_expires_at;
                      const days = daysUntil(expiry);
                      const isExpired = days !== null && days < 0;
                      const isUrgent = days !== null && days >= 0 && days <= 3;
                      const rowColor = isExpired ? 'var(--danger)' : isUrgent ? 'var(--warning)' : null;
                      const busy = busyUserId === u.id;

                      return (
                        <tr key={u.id}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{u.username}</div>
                            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                          </td>
                          <td>
                            <LicenseTypeBadge type={u.license_type} />
                          </td>
                          <td>
                            <div style={{ fontSize: '.85rem', fontWeight: 600, color: rowColor || 'var(--text-primary)' }}>
                              {formatDate(expiry)}
                            </div>
                            {days !== null && (
                              <div style={{ fontSize: '.72rem', color: rowColor || 'var(--text-muted)', fontWeight: rowColor ? 600 : 400 }}>
                                {isExpired ? 'Vencida' : days === 0 ? 'Vence hoy' : `${days}d restantes`}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => handleExtend(u)}
                                disabled={busy}
                                aria-label={`Extender un mes la licencia de ${u.username}`}
                                style={{ fontSize: '.78rem', padding: '.4rem .75rem' }}
                              >
                                <CalendarDaysIcon style={{ width: 13, height: 13 }} aria-hidden="true" />
                                {busy ? 'Aplicando…' : '+1 mes'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => openEdit(u)}
                                disabled={busy}
                                aria-label={`Editar usuario ${u.username}`}
                                style={{ fontSize: '.78rem', padding: '.4rem .75rem' }}
                              >
                                <KeyIcon style={{ width: 13, height: 13 }} aria-hidden="true" />
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal editar usuario */}
      <Modal
        open={editTarget !== null}
        onClose={closeEdit}
        title="Editar usuario"
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
                aria-label={`Eliminar usuario ${editTarget.username}`}
                style={{ marginRight: 'auto' }}
              >
                <TrashIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
                Eliminar usuario
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={closeEdit} disabled={saving}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </>
        }
      >
        <div>
          <label htmlFor="edit-username" style={{ display: 'block', marginBottom: '.375rem', fontSize: '.875rem', fontWeight: 600 }}>
            Nombre de usuario
          </label>
          <input
            id="edit-username"
            type="text"
            required
            minLength={3}
            value={editUsername}
            onChange={e => setEditUsername(e.target.value.replace(/\s/g, ''))}
            placeholder="Sin espacios"
          />
          <p style={{ margin: '.25rem 0 0', fontSize: '.75rem', color: 'var(--text-muted)' }}>
            Los espacios se eliminan automáticamente.
          </p>
        </div>

        <div>
          <label htmlFor="edit-password" style={{ display: 'block', marginBottom: '.375rem', fontSize: '.875rem', fontWeight: 600 }}>
            Nueva contraseña <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="edit-password"
              type={showPass ? 'text' : 'password'}
              minLength={6}
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
              placeholder="Dejar vacío para no cambiar"
              style={{ paddingRight: '2.5rem' }}
            />
            <button
              type="button"
              onClick={() => setShowPass(v => !v)}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
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
  if (status === 'approved') return (
    <span className="badge badge-green" style={{ gap: 4 }}>
      <CheckCircleIcon style={{ width: 11, height: 11 }} aria-hidden="true" /> Aprobada
    </span>
  );
  if (status === 'rejected') return (
    <span className="badge badge-red" style={{ gap: 4 }}>
      <XCircleIcon style={{ width: 11, height: 11 }} aria-hidden="true" /> Rechazada
    </span>
  );
  return (
    <span className="badge badge-yellow" style={{ gap: 4 }}>
      <ClockIcon style={{ width: 11, height: 11 }} aria-hidden="true" /> Pendiente
    </span>
  );
};

const LicenseTypeBadge: React.FC<{ type?: 'trial' | 'active' }> = ({ type }) => (
  type === 'active'
    ? <span className="badge badge-green">Activa</span>
    : <span className="badge badge-yellow">Prueba</span>
);

const RequestCard: React.FC<{
  req: UserRequest;
  /** Acción en curso sobre ESTA solicitud, si la hay. */
  busy: RequestAction | null;
  /** Hay una acción en curso en la página: bloquea el resto de las tarjetas. */
  blocked: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ req, busy, blocked, onApprove, onReject }) => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: '1.125rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
    boxShadow: 'var(--shadow-sm)',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 99, flexShrink: 0,
      background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '.9rem', color: '#4338ca',
    }} aria-hidden="true">
      {req.username.charAt(0).toUpperCase()}
    </div>

    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text-primary)' }}>{req.username}</span>
        <span style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{req.email}</span>
      </div>
      <div style={{ fontSize: '.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
        Óptica: <strong style={{ color: 'var(--text-primary)' }}>{req.optics_name}</strong>
        <span style={{ margin: '0 6px', color: 'var(--text-muted)' }}>·</span>
        <span style={{ color: 'var(--text-muted)' }}>
          {new Date(req.requested_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
      <button
        type="button"
        onClick={onReject}
        disabled={blocked}
        aria-label={`Rechazar solicitud de ${req.username}`}
        style={{
          padding: '.5rem .875rem',
          background: 'var(--surface)', color: 'var(--danger)',
          border: '1px solid var(--danger)', borderRadius: 'var(--radius)',
          fontWeight: 600, fontSize: '.8rem',
          transition: 'all .15s', opacity: blocked ? .6 : 1,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <XCircleIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
        {busy === 'reject' ? 'Rechazando…' : 'Rechazar'}
      </button>
      <button
        type="button"
        onClick={onApprove}
        disabled={blocked}
        aria-label={`Aprobar solicitud de ${req.username} y darle un mes de licencia`}
        style={{
          padding: '.5rem .875rem',
          background: 'var(--success)', color: '#fff',
          border: 'none', borderRadius: 'var(--radius)',
          fontWeight: 600, fontSize: '.8rem',
          transition: 'all .15s', opacity: blocked ? .6 : 1,
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: blocked ? 'none' : 'var(--shadow-sm)',
        }}
      >
        <CheckCircleIcon style={{ width: 14, height: 14 }} aria-hidden="true" />
        {busy === 'approve' ? 'Aprobando…' : 'Aprobar (+1 mes)'}
      </button>
    </div>
  </div>
);

export default AdminRequestsPage;
