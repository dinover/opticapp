import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import LangToggle from '../components/LangToggle';
import { AUTH_COPY } from '../i18n/auth';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  // Mensaje del servidor, ya traducido por el interceptor de api.ts ('' = sin mensaje).
  const [error, setError] = useState<string | null>(null);
  const [licenseExpired, setLicenseExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { lang, setLang } = useLanguage();
  const t = AUTH_COPY[lang].login;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLicenseExpired(false);
    setLoading(true);
    try {
      const response = await authService.login({ username, password });
      login(response.token, response.user);
      navigate(response.user.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err: any) {
      const data = err.response?.data;
      setLicenseExpired(Boolean(data?.license_expired));
      setError(data?.error || '');
    } finally {
      setLoading(false);
    }
  };

  const errorText = error || t.fallbackError;

  return (
    <div className="auth-screen" style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--surface-2)',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <LangToggle
        lang={lang}
        onChange={setLang}
        label={AUTH_COPY[lang].langLabel}
        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 2 }}
      />

      {/* Background decoration: tinte de marca translúcido, funciona en claro y oscuro */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 80% 60% at 60% -10%, rgba(79,70,229,.14) 0%, transparent 70%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Content wrapper - constrains and centers both panels */}
      <div className="auth-wrap" style={{
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
          <Link to="/" style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: '3rem',
            textDecoration: 'none', width: 'fit-content',
          }}>
            <img src="/logo.png" alt="OpticApp" style={{ width: 50, height: 50, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)' }}>OpticApp</span>
          </Link>

          <h1 style={{
            fontSize: '2.25rem', fontWeight: 800, color: 'var(--text-primary)',
            lineHeight: 1.15, marginBottom: '1rem',
          }}>
            {t.heroLine1}<br />
            <span style={{ color: 'var(--brand)' }}>{t.heroLine2}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7 }}>
            {t.heroSub}
          </p>

          {/* Feature list */}
          {t.features.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: '1rem' }}>
              <div style={{
                width: 20, height: 20, borderRadius: 99,
                background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="var(--brand)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '.875rem', color: 'var(--text-secondary)' }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="auth-card" style={{
        flex: '0 0 auto',
        width: '100%',
        maxWidth: 400,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        padding: '2.5rem',
        boxShadow: 'var(--shadow-lg)',
      }}>
          {/* Logo mobile */}
          <Link to="/" className="flex lg:hidden items-center gap-2 mb-6" style={{ textDecoration: 'none', width: 'fit-content' }}>
            <img src="/logo.png" alt="OpticApp" style={{ width: 50, height: 50, objectFit: 'contain' }} />
            <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>OpticApp</span>
          </Link>

          <h2 style={{ fontWeight: 800, fontSize: '1.375rem', color: 'var(--text-primary)', margin: '0 0 .375rem' }}>
            {t.title}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: '1.75rem' }}>
            {t.sub}
          </p>

          {error !== null && (
            <div role="alert" style={{
              background: 'var(--surface-2)',
              border: `1px solid ${licenseExpired ? 'var(--warning)' : 'var(--danger)'}`,
              borderRadius: 10, padding: '0.875rem 1rem',
              marginBottom: '1.25rem', fontSize: '.875rem',
              color: licenseExpired ? 'var(--warning)' : 'var(--danger)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, marginBottom: licenseExpired ? 4 : 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {licenseExpired ? t.licenseExpired : errorText}
              </div>
              {licenseExpired && (
                <p style={{ margin: 0, fontSize: '.8rem', color: 'var(--text-secondary)' }}>{errorText}</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '.375rem' }}>{t.username}</label>
              <input
                type="text"
                required
                placeholder={t.usernamePh}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '.375rem' }}>{t.password}</label>
              <input
                type="password"
                required
                placeholder={t.passwordPh}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '.75rem',
                background: 'var(--brand)',
                opacity: loading ? .6 : 1,
                color: '#fff', fontWeight: 700, fontSize: '.9rem',
                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '.25rem', transition: 'all .15s',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(79,70,229,.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
              {loading ? t.submitting : t.submit}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '.875rem', color: 'var(--text-secondary)' }}>
            {t.noAccount}{' '}
            <Link to="/request-user" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>
              {t.createOne}
            </Link>
          </p>
      </div>
      </div>{/* end content wrapper */}
    </div>
  );
};

export default LoginPage;
