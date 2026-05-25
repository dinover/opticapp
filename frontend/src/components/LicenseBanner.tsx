import React from 'react';
import { useAuth } from '../contexts/AuthContext';

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const LicenseBanner: React.FC = () => {
  const { user } = useAuth();

  if (!user || user.role === 'admin') return null;

  const { license_type, trial_expires_at, license_expires_at } = user;

  if (license_type === 'trial') {
    const days = daysUntil(trial_expires_at);
    if (days === null || days < 0) return null;
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
        Modo de prueba · {days === 0 ? 'Vence hoy' : `${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`}
        <span style={{ opacity: .75, fontWeight: 400 }}>— Contactá al administrador para activar tu licencia</span>
      </div>
    );
  }

  if (license_type === 'active') {
    const days = daysUntil(license_expires_at);
    if (days === null || days > 7) return null;
    if (days < 0) return null;
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
        Tu licencia vence {days === 0 ? 'hoy' : `en ${days} día${days !== 1 ? 's' : ''}`}
        <span style={{ opacity: .75, fontWeight: 400 }}>— Contactá al administrador para renovarla</span>
      </div>
    );
  }

  return null;
};

export default LicenseBanner;
