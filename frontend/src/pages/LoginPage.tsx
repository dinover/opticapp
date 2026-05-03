import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await authService.login({ username, password });
      login(response.token, response.user);
      navigate(response.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8fafc',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 60% -10%, #e0e7ff 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, #ede9fe 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content wrapper - constrains and centers both panels */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: 880,
        padding: '2rem',
        gap: '3rem',
        position: 'relative',
        zIndex: 1,
      }}>

      {/* Left panel - branding */}
      <div className="hidden lg:flex" style={{
        flex: '1 1 0',
        flexDirection: 'column',
        justifyContent: 'center',
      }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(79,70,229,.35)',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.388 1.16 0 1.632C18.768 14.35 15.636 18 12 18c-3.636 0-6.768-3.65-8.188-5.434a1.3 1.3 0 0 1 0-1.632C5.232 9.65 8.364 6 12 6c3.636 0 6.768 3.65 8.188 5.434z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0f172a' }}>OpticApp</span>
          </div>

          <h1 style={{
            fontSize: '2.25rem', fontWeight: 800, color: '#0f172a',
            lineHeight: 1.15, marginBottom: '1rem',
          }}>
            Gestión de óptica<br />
            <span style={{ color: '#4f46e5' }}>simplificada.</span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', lineHeight: 1.7 }}>
            Clientes, productos, ventas y fichas ópticas en un solo lugar.
          </p>

          {/* Feature list */}
          {['Fichas técnicas de cristales', 'Control de stock y ventas', 'Dashboard con métricas clave'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1rem' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 99,
                background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#4f46e5" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '.875rem', color: '#475569' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div style={{
        flex: '0 0 auto',
        width: '100%',
        maxWidth: 400,
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(15,23,42,.08)',
      }}>
          {/* Logo mobile */}
          <div className="flex lg:hidden items-center gap-2 mb-6">
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.388 1.16 0 1.632C18.768 14.35 15.636 18 12 18c-3.636 0-6.768-3.65-8.188-5.434a1.3 1.3 0 0 1 0-1.632C5.232 9.65 8.364 6 12 6c3.636 0 6.768 3.65 8.188 5.434z"/>
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>OpticApp</span>
          </div>

          <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: '#0f172a', margin: '0 0 .375rem' }}>
            Iniciar sesión
          </h2>
          <p style={{ color: '#64748b', fontSize: '.875rem', marginBottom: '1.75rem' }}>
            Ingresá tus credenciales para continuar
          </p>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '0.75rem 1rem',
              marginBottom: '1.25rem', fontSize: '.875rem', color: '#991b1b',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '.375rem' }}>Usuario</label>
              <input
                type="text"
                required
                placeholder="Nombre de usuario"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '.375rem' }}>Contraseña</label>
              <input
                type="password"
                required
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '.75rem',
                background: loading ? '#a5b4fc' : '#4f46e5',
                color: '#fff', fontWeight: 700, fontSize: '.9rem',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '.25rem', transition: 'all .15s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(79,70,229,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.875rem', color: '#64748b' }}>
            ¿No tenés cuenta?{' '}
            <Link to="/request-user" style={{ color: '#4f46e5', fontWeight: 600, textDecoration: 'none' }}>
              Solicitá acceso
            </Link>
          </p>
      </div>
      </div>{/* end content wrapper */}
    </div>
  );
};

export default LoginPage;
