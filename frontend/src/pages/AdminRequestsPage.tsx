import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
} from '@heroicons/react/24/outline';

const AdminRequestsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests]           = useState<UserRequest[]>([]);
  const [users, setUsers]                 = useState<User[]>([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Reset password modal
  const [resetTarget, setResetTarget]     = useState<User | null>(null);
  const [newPassword, setNewPassword]     = useState('');
  const [showPass, setShowPass]           = useState(false);
  const [resetLoading, setResetLoading]   = useState(false);
  const [resetSuccess, setResetSuccess]   = useState('');
  const [resetError, setResetError]       = useState('');

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

  const loadRequests = loadAll;

  const openReset = (u: User) => { setResetTarget(u); setNewPassword(''); setShowPass(false); setResetSuccess(''); setResetError(''); };
  const closeReset = () => { setResetTarget(null); setNewPassword(''); setResetSuccess(''); setResetError(''); };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    try {
      setResetLoading(true);
      setResetError('');
      const res = await adminService.resetPassword(resetTarget.id, newPassword);
      setResetSuccess(res.message);
      setNewPassword('');
    } catch (err: any) {
      setResetError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setResetLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setActionLoading(id);
      await adminService.approveRequest(id);
      await loadRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al aprobar');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('¿Rechazar esta solicitud?')) return;
    try {
      setActionLoading(id);
      await adminService.rejectRequest(id);
      await loadRequests();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Error al rechazar');
    } finally {
      setActionLoading(null);
    }
  };

  const pending   = requests.filter(r => r.status === 'pending');
  const processed = requests.filter(r => r.status !== 'pending');

  return (
    <div style={{ minHeight: '100vh', background: 'var(--surface-2)' }}>
      {/* Topbar */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.388 1.16 0 1.632C18.768 14.35 15.636 18 12 18c-3.636 0-6.768-3.65-8.188-5.434a1.3 1.3 0 0 1 0-1.632C5.232 9.65 8.364 6 12 6c3.636 0 6.768 3.65 8.188 5.434z"/>
              </svg>
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-primary)' }}>OpticApp</span>
              <span style={{ marginLeft: 8, fontSize: '.75rem', fontWeight: 600, color: '#6366f1', background: '#eef2ff', padding: '1px 8px', borderRadius: 99 }}>Admin</span>
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
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Solicitudes de acceso</h1>
            <p className="page-subtitle">
              {pending.length} pendiente{pending.length !== 1 ? 's' : ''} · {processed.length} procesada{processed.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={loadRequests} style={{ fontSize: '.8rem' }}>
            <ArrowPathIcon className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1.25rem', color: '#991b1b', fontSize: '.875rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="spinner" />
          </div>
        ) : requests.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <ShieldCheckIcon style={{ width: 40, height: 40, margin: '0 auto 0.75rem' }} />
              <p>No hay solicitudes</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <div className="section-title">Pendientes</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.625rem' }}>
                  {pending.map(req => (
                    <RequestCard
                      key={req.id}
                      req={req}
                      loading={actionLoading === req.id}
                      onApprove={() => handleApprove(req.id)}
                      onReject={() => handleReject(req.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Processed */}
            {processed.length > 0 && (
              <div>
                <div className="section-title">Historial</div>
                <div className="card" style={{ overflow: 'hidden' }}>
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
                            {new Date(req.requested_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
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
            )}
          </div>
        )}

        {/* Sección usuarios */}
        {!loading && users.length > 0 && (
          <div style={{ marginTop: '2rem' }}>
            <div className="section-title">Usuarios activos</div>
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Creado</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{u.username}</div>
                        <div style={{ fontSize: '.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 99, fontSize: '.75rem', fontWeight: 600,
                          background: u.role === 'admin' ? '#eef2ff' : 'var(--surface-3)',
                          color: u.role === 'admin' ? '#4f46e5' : 'var(--text-secondary)',
                        }}>
                          {u.role === 'admin' ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openReset(u)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '.4rem .75rem', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-secondary)', fontSize: '.8rem', fontWeight: 600, cursor: 'pointer' }}
                        >
                          <KeyIcon style={{ width: 13, height: 13 }} />
                          Cambiar contraseña
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modal reset password */}
      {resetTarget && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeReset()}>
          <div className="modal-box" style={{ maxWidth: 420 }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyIcon style={{ width: 18, height: 18, color: '#4f46e5' }} />
                <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  Cambiar contraseña
                </h3>
              </div>
              <button onClick={closeReset} style={{ padding: '.3rem', borderRadius: 6, background: 'var(--surface-3)', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <form onSubmit={handleReset}>
              <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                  Establecé una nueva contraseña para <strong style={{ color: 'var(--text-primary)' }}>{resetTarget.username}</strong>.
                </p>
                <div>
                  <label style={{ display: 'block', marginBottom: '.375rem', fontSize: '.875rem', fontWeight: 600 }}>Nueva contraseña *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setResetSuccess(''); setResetError(''); }}
                      placeholder="Mínimo 6 caracteres"
                      style={{ paddingRight: '2.5rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      style={{ position: 'absolute', right: '.625rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
                    >
                      {showPass ? <EyeSlashIcon style={{ width: 16, height: 16 }} /> : <EyeIcon style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                </div>

                {resetError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '.625rem .875rem', fontSize: '.8rem', color: '#991b1b' }}>
                    <XCircleIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {resetError}
                  </div>
                )}
                {resetSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '.625rem .875rem', fontSize: '.8rem', color: '#15803d' }}>
                    <CheckCircleIcon style={{ width: 14, height: 14, flexShrink: 0 }} />
                    {resetSuccess}
                  </div>
                )}
              </div>
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '.75rem' }}>
                <button type="button" className="btn btn-ghost" onClick={closeReset}>Cerrar</button>
                <button type="submit" className="btn btn-primary" disabled={resetLoading || !newPassword}>
                  {resetLoading ? (
                    <><div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Guardando…</>
                  ) : 'Cambiar contraseña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === 'approved') return (
    <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <CheckCircleIcon style={{ width: 11, height: 11 }} /> Aprobada
    </span>
  );
  if (status === 'rejected') return (
    <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <XCircleIcon style={{ width: 11, height: 11 }} /> Rechazada
    </span>
  );
  return (
    <span className="badge badge-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <ClockIcon style={{ width: 11, height: 11 }} /> Pendiente
    </span>
  );
};

const RequestCard: React.FC<{
  req: UserRequest;
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
}> = ({ req, loading, onApprove, onReject }) => (
  <div style={{
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: 12,
    padding: '1.125rem 1.25rem',
    display: 'flex', alignItems: 'center', gap: '1rem',
    boxShadow: '0 1px 4px rgba(15,23,42,.06)',
  }}>
    {/* Avatar */}
    <div style={{
      width: 42, height: 42, borderRadius: 99, flexShrink: 0,
      background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: '.9rem', color: '#4338ca',
    }}>
      {req.username.charAt(0).toUpperCase()}
    </div>

    {/* Info */}
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

    {/* Actions */}
    <div style={{ display: 'flex', gap: '.5rem', flexShrink: 0 }}>
      <button
        onClick={onReject}
        disabled={loading}
        style={{
          padding: '.5rem .875rem',
          background: '#fef2f2', color: '#dc2626',
          border: '1px solid #fecaca', borderRadius: 8,
          fontWeight: 600, fontSize: '.8rem', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all .15s', opacity: loading ? .6 : 1,
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <XCircleIcon style={{ width: 14, height: 14 }} />
        Rechazar
      </button>
      <button
        onClick={onApprove}
        disabled={loading}
        style={{
          padding: '.5rem .875rem',
          background: loading ? '#d1fae5' : '#10b981', color: '#fff',
          border: 'none', borderRadius: 8,
          fontWeight: 600, fontSize: '.8rem', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'all .15s',
          display: 'flex', alignItems: 'center', gap: 4,
          boxShadow: loading ? 'none' : '0 2px 8px rgba(16,185,129,.3)',
        }}
      >
        {loading ? (
          <div className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
        ) : (
          <CheckCircleIcon style={{ width: 14, height: 14 }} />
        )}
        Aprobar
      </button>
    </div>
  </div>
);

export default AdminRequestsPage;
