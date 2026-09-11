import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '../services/auth';
import { CheckCircleIcon, GiftIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import LangToggle from '../components/LangToggle';
import AuthBackdrop from '../components/AuthBackdrop';
import { AUTH_COPY, type RegisterErrorKey } from '../i18n/auth';
import { useLanguage } from '../contexts/LanguageContext';

/** Error de validación propio (se traduce por clave) o mensaje del servidor (ya traducido por api.ts). */
type FormError = { key: RegisterErrorKey } | { server: string } | null;

const screenStyle: React.CSSProperties = {
  minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'var(--canvas)', padding: '2rem', position: 'relative', overflow: 'hidden',
};

const RequestUserPage: React.FC = () => {
  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '', optics_name: '',
  });
  const [error, setError]     = useState<FormError>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { lang, setLang } = useLanguage();
  const t = AUTH_COPY[lang].register;

  const set = (field: string, value: string) => setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) { setError({ key: 'mismatch' }); return; }
    if (formData.password.length < 6) { setError({ key: 'short' }); return; }
    setLoading(true);
    try {
      await authService.requestUser({
        username: formData.username, email: formData.email,
        password: formData.password, optics_name: formData.optics_name,
      });
      setSuccess(true);
    } catch (err: any) {
      const message = err.response?.data?.error;
      setError(message ? { server: message } : { key: 'fallback' });
    } finally {
      setLoading(false);
    }
  };

  const errorText = !error ? '' : 'server' in error ? error.server : t.errors[error.key];

  const langToggle = (
    <LangToggle
      lang={lang}
      onChange={setLang}
      label={AUTH_COPY[lang].langLabel}
      style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 2 }}
    />
  );

  if (success) return (
    <div className="auth-screen" style={screenStyle}>
      <AuthBackdrop />
      {langToggle}
      <div className="auth-card auth-card-glass" style={{ maxWidth: 440, padding: '2.5rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div className="status-icon" style={{ background: 'color-mix(in srgb, var(--success) 12%, transparent)', color: 'var(--success-text)' }}>
          <CheckCircleIcon style={{ width: 32, height: 32 }} />
        </div>
        <h2 className="auth-title">{t.successTitle}</h2>
        <p className="auth-sub" style={{ marginBottom: '1.75rem' }}>
          {t.successBefore} <strong style={{ color: 'var(--text-primary)' }}>{t.successStrong}</strong> {t.successAfter}
        </p>
        <Link to="/login" className="btn btn-cta">{t.successCta}</Link>
      </div>
    </div>
  );

  return (
    <div className="auth-screen" style={screenStyle}>
      <AuthBackdrop />
      {langToggle}

      <div className="auth-card auth-card-glass" style={{ width: '100%', maxWidth: 470, padding: '2.5rem', position: 'relative', zIndex: 1 }}>
        <Link to="/" className="brand" style={{ marginBottom: '1.75rem', width: 'fit-content' }}>
          <img src="/logo.png" alt="OpticApp" />
          <span>OpticApp</span>
        </Link>

        <h2 className="auth-title">{t.title}</h2>
        <p className="auth-sub" style={{ marginBottom: '1rem' }}>{t.sub}</p>

        {/* Aviso de la prueba gratis: la cuenta nace en modo trial (ver TRIAL_DAYS en el backend) */}
        <div className="trial-callout">
          <GiftIcon />
          <span><strong>{t.trialStrong}</strong> {t.trialRest}</span>
        </div>

        {error && (
          <div role="alert" className="alert alert-danger" style={{ marginBottom: '1.25rem' }}>
            <ExclamationCircleIcon />
            <span>{errorText}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="field">
            <label htmlFor="register-username">{t.username}</label>
            <input id="register-username" type="text" required autoComplete="username" value={formData.username} onChange={e => set('username', e.target.value)} placeholder={t.usernamePh} />
          </div>
          <div className="field">
            <label htmlFor="register-email">{t.email}</label>
            <input id="register-email" type="email" required autoComplete="email" value={formData.email} onChange={e => set('email', e.target.value)} placeholder={t.emailPh} />
          </div>
          <div className="field">
            <label htmlFor="register-optics">{t.opticsName}</label>
            <input id="register-optics" type="text" required value={formData.optics_name} onChange={e => set('optics_name', e.target.value)} placeholder={t.opticsNamePh} />
          </div>
          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="register-password">{t.password}</label>
              <input id="register-password" type="password" required autoComplete="new-password" value={formData.password} onChange={e => set('password', e.target.value)} placeholder={t.passwordPh} />
            </div>
            <div className="field">
              <label htmlFor="register-confirm">{t.confirm}</label>
              <input id="register-confirm" type="password" required autoComplete="new-password" value={formData.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder={t.confirmPh} />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-cta btn-block" style={{ marginTop: '.35rem', padding: '.82rem' }}>
            {loading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff' }} />}
            {loading ? t.submitting : t.submit}
          </button>
        </form>

        <p className="auth-footnote">
          {t.haveAccount}{' '}
          <Link to="/login">{t.login}</Link>
        </p>
      </div>
    </div>
  );
};

export default RequestUserPage;
