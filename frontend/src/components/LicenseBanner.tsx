import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Estado de licencia que vale la pena mostrar, o null. */
function useLicenseNotice() {
  const { user } = useAuth();
  const { t } = useLanguage();
  if (!user || user.role === 'admin') return null;

  if (user.license_type === 'trial') {
    const days = daysUntil(user.trial_expires_at);
    if (days === null || days < 0) return null;
    const remaining = days === 0
      ? t('Vence hoy', 'Ends today')
      : t(`${days} día${days !== 1 ? 's' : ''} restante${days !== 1 ? 's' : ''}`, `${days} day${days !== 1 ? 's' : ''} left`);
    return {
      kind: 'trial' as const,
      days,
      label: `${t('Modo de prueba', 'Trial mode')} · ${remaining}`,
      hint: t('Contactá al administrador para activar tu licencia', 'Contact the administrator to activate your license'),
    };
  }

  if (user.license_type === 'active') {
    const days = daysUntil(user.license_expires_at);
    if (days === null || days < 0 || days > 7) return null;
    return {
      kind: 'active' as const,
      days,
      label: days === 0
        ? t('Tu licencia vence hoy', 'Your license expires today')
        : t(`Tu licencia vence en ${days} día${days !== 1 ? 's' : ''}`, `Your license expires in ${days} day${days !== 1 ? 's' : ''}`),
      hint: t('Contactá al administrador para renovarla', 'Contact the administrator to renew it'),
    };
  }

  return null;
}

/** Los últimos 2 días el aviso se vuelve una franja roja a lo ancho, imposible de ignorar. */
const LicenseBanner: React.FC = () => {
  const notice = useLicenseNotice();
  if (!notice || notice.days > 2) return null;
  return (
    <div className="license-strip" role="status">
      <span aria-hidden="true">{notice.kind === 'trial' ? '⏳' : '📅'}</span>
      <span>{notice.label}</span>
      <span className="hint-text hidden sm:inline">— {notice.hint}</span>
    </div>
  );
};

/**
 * El resto del tiempo, un chip discreto en la barra superior. En celular no
 * entra en la barra: con `asRow` va en una fila propia debajo de ella.
 */
export const LicenseChip: React.FC<{ asRow?: boolean }> = ({ asRow = false }) => {
  const notice = useLicenseNotice();
  if (!notice || notice.days <= 2) return null;
  const chip = (
    <span className={`license-chip${notice.kind === 'active' ? ' is-active' : ''}`} title={notice.hint} role="status">
      <span className="dot" aria-hidden="true" />
      {notice.label}
    </span>
  );
  return asRow ? <div className="license-chip-row">{chip}</div> : chip;
};

export default LicenseBanner;
