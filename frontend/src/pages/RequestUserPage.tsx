import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const RequestUserPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', optics_name: '',
  });
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    if (formData.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return; }
    setLoading(true);
    try {
      await authService.requestUser({
        username: formData.username, email: formData.email,
        password: formData.password, optics_name: formData.optics_name,
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem' }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: 99, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
          <CheckCircleIcon style={{ width: 32, height: 32, color: '#16a34a' }} />
        </div>
        <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f172a', margin: '0 0 .75rem' }}>
          ¡Solicitud enviada!
        </h2>
        <p style={{ color: '#64748b', lineHeight: 1.7, margin: '0 0 1.75rem', fontSize: '.9rem' }}>
          Un administrador revisará tu solicitud y te notificará cuando sea aprobada. Podés verificar el estado en cualquier momento.
        </p>
        <Link to="/login" style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: '.75rem 1.5rem', background: '#4f46e5', color: '#fff',
          fontWeight: 700, borderRadius: 10, textDecoration: 'none', fontSize: '.9rem',
        }}>
          Volver al login
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* BG decoration */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 80% 60% at 60% -10%, #e0e7ff 0%, transparent 70%)' }} />

      <div style={{ width: '100%', maxWidth: 460, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '2.5rem', boxShadow: '0 8px 32px rgba(15,23,42,.08)', position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.388 1.16 0 1.632C18.768 14.35 15.636 18 12 18c-3.636 0-6.768-3.65-8.188-5.434a1.3 1.3 0 0 1 0-1.632C5.232 9.65 8.364 6 12 6c3.636 0 6.768 3.65 8.188 5.434z"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, color: '#0f172a' }}>OpticApp</span>
        </div>

        <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f172a', margin: '0 0 .375rem' }}>Solicitar acceso</h2>
        <p style={{ color: '#64748b', fontSize: '.875rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
          Completá el formulario y un administrador revisará tu solicitud.
        </p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '.75rem 1rem', marginBottom: '1.25rem', fontSize: '.875rem', color: '#991b1b', display: 'flex', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '.375rem' }}>Nombre de usuario</label>
            <input type="text" required value={formData.username} onChange={e => set('username', e.target.value)} placeholder="tunombredeusuario" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '.375rem' }}>Email</label>
            <input type="email" required value={formData.email} onChange={e => set('email', e.target.value)} placeholder="tu@email.com" />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '.375rem' }}>Nombre de la óptica</label>
            <input type="text" required value={formData.optics_name} onChange={e => set('optics_name', e.target.value)} placeholder="Ej: Óptica Central" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '.375rem' }}>Contraseña</label>
              <input type="password" required value={formData.password} onChange={e => set('password', e.target.value)} placeholder="Mín. 6 caracteres" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '.375rem' }}>Confirmar</label>
              <input type="password" required value={formData.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repetir contraseña" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '.75rem',
              background: loading ? '#a5b4fc' : '#4f46e5',
              color: '#fff', fontWeight: 700, fontSize: '.9rem',
              border: 'none', borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '.25rem', transition: 'all .15s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(79,70,229,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
            {loading ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.875rem', color: '#64748b' }}>
          ¿Ya tenés cuenta?{' '}
          <Link to="/login" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
};

export default RequestUserPage;
