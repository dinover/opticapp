import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminService } from '../services/admin';
import { UserRequest } from '../types';
import {
  ShieldCheckIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const AdminRequestsPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [requests, setRequests]       = useState<UserRequest[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => { loadRequests(); }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getRequests();
      setRequests(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
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
      </main>
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
