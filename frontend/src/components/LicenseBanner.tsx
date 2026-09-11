import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const LicenseBanner: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  if (!user || user.role === 'admin') return null;

  const { license_type, trial_expires_at, license_expires_at } = user;

  if (license_type === 'trial') {
    const days = daysUntil(trial_expires_at);
    if (days === null || days < 0) return null;
    const remaining = days === 0
      ? t('Vence hoy', 'Ends today')
      : t(`${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`, `${days} day${days !== 1 ? 's' : ''} left`);
    return (
      <div style={{
        background: days <= 2 ? 'linear-gradient(90deg, #dc2626, #b91c1c)' : 'linear-gradient(90deg, #d97706, #b45309)',
        color: '#fff',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 15 }}>⏳</span>
        {t('Modo de prueba', 'Trial mode')} · {remaining}
        <span className="hidden sm:inline" style={{ opacity: .75, fontWeight: 400 }}>
          — {t('Contactá al administrador para activar tu licencia', 'Contact the administrator to activate your license')}
        </span>
      </div>
    );
  }

  if (license_type === 'active') {
    const days = daysUntil(license_expires_at);
    if (days === null || days > 7) return null;
    if (days < 0) return null;
    const when = days === 0
      ? t('Tu licencia vence hoy', 'Your license expires today')
      : t(`Tu licencia vence en ${days} día${days !== 1 ? 's' : ''}`, `Your license expires in ${days} day${days !== 1 ? 's' : ''}`);
    return (
      <div style={{
        background: days <= 2 ? 'linear-gradient(90deg, #dc2626, #b91c1c)' : 'linear-gradient(90deg, #2563eb, #1d4ed8)',
        color: '#fff',
        padding: '10px 20px',
        textAlign: 'center',
        fontSize: '13px',
        fontWeight: 600,
        letterSpacing: '.01em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}>
        <span style={{ fontSize: 15 }}>📅</span>
        {when}
        <span className="hidden sm:inline" style={{ opacity: .75, fontWeight: 400 }}>
          — {t('Contactá al administrador para renovarla', 'Contact the administrator to renew it')}
        </span>
      </div>
    );
  }

  return null;
};

export default LicenseBanner;
