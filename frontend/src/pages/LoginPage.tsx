import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckIcon, ExclamationCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth';
import LangToggle from '../components/LangToggle';
import AuthBackdrop from '../components/AuthBackdrop';
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
    <div
      className="auth-screen"
      style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', background: 'var(--canvas)',
      }}
    >
      <AuthBackdrop />
      <LangToggle
        lang={lang}
        onChange={setLang}
        label={AUTH_COPY[lang].langLabel}
        style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 2 }}
      />

      <div
        className="auth-wrap"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '100%', maxWidth: 980, padding: '2rem', gap: '4.5rem',
          position: 'relative', zIndex: 1,
        }}
      >
        {/* Panel de marca (escritorio) */}
        <div className="hidden lg:flex" style={{ flex: '1 1 0', flexDirection: 'column' }}>
          <Link to="/" className="brand" style={{ marginBottom: '2.75rem', width: 'fit-content' }}>
            <img src="/logo.png" alt="OpticApp" />
            <span>OpticApp</span>
          </Link>
          <h1 className="auth-hero-title">
            {t.heroLine1}<br />
            <span className="grad-text">{t.heroLine2}</span>
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.7, maxWidth: 400 }}>
            {t.heroSub}
          </p>
          <ul className="auth-features">
            {t.features.map(f => (
              <li key={f}><span className="check-dot"><CheckIcon /></span>{f}</li>
            ))}
          </ul>
        </div>

        {/* Formulario */}
        <div className="auth-card auth-card-glass" style={{ flex: '0 0 auto', width: '100%', maxWidth: 410, padding: '2.5rem' }}>
          <div className="lg:hidden" style={{ marginBottom: '1.5rem' }}>
            <Link to="/" className="brand" style={{ width: 'fit-content' }}>
              <img src="/logo.png" alt="OpticApp" />
              <span>OpticApp</span>
            </Link>
          </div>

          <h2 className="auth-title">{t.title}</h2>
          <p className="auth-sub">{t.sub}</p>

          {error !== null && (
            <div role="alert" className={`alert ${licenseExpired ? 'alert-warning' : 'alert-danger'}`} style={{ marginBottom: '1.25rem' }}>
              <ExclamationCircleIcon />
              <div>
                <div className="alert-title">{licenseExpired ? t.licenseExpired : errorText}</div>
                {licenseExpired && <p>{errorText}</p>}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="field">
              <label htmlFor="login-username">{t.username}</label>
              <input
                id="login-username"
                type="text"
                required
                autoComplete="username"
                placeholder={t.usernamePh}
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="login-password">{t.password}</label>
              <input
                id="login-password"
                type="password"
                required
                autoComplete="current-password"
                placeholder={t.passwordPh}
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-cta btn-block" style={{ marginTop: '.35rem', padding: '.82rem' }}>
              {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff' }} />}
              {loading ? t.submitting : t.submit}
              {!loading && <ArrowRightIcon className="w-4 h-4" />}
            </button>
          </form>

          <p className="auth-footnote">
            {t.noAccount}{' '}
            <Link to="/request-user">{t.createOne}</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
