import React from 'react';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { useTheme } from '../contexts/ThemeContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import LangToggle from './LangToggle';
import { Cog6ToothIcon, XMarkIcon, SunIcon, MoonIcon, CurrencyDollarIcon, LanguageIcon } from '@heroicons/react/24/outline';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const sectionLabelStyle: React.CSSProperties = {
  margin: '0 0 .75rem', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)',
};

const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.625rem .875rem', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)',
};

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const { sections, updateSection, resetSections } = useDashboardConfig();
  const { theme, toggleTheme } = useTheme();
  const { currency, toggleCurrency } = useCurrency();
  const { lang, setLang, t } = useLanguage();

  const labels: Record<keyof typeof sections, string> = {
    totalSales:    t('Total ventas', 'Total sales'),
    totalRevenue:  t('Total ingresos', 'Total revenue'),
    totalClients:  t('Total clientes', 'Total clients'),
    totalProducts: t('Total productos', 'Total products'),
    topProducts:   t('Productos más vendidos', 'Best-selling products'),
    recentSales:   t('Ventas recientes', 'Recent sales'),
  };

  const Toggle: React.FC<{ enabled: boolean; onChange: () => void }> = ({ enabled, onChange }) => (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={onChange}
      style={{
        width: 40, height: 22, borderRadius: 99,
        background: enabled ? '#4f46e5' : 'var(--surface-3)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background .2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3,
        left: enabled ? 21 : 3,
        width: 16, height: 16, borderRadius: 99,
        background: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,.2)',
        transition: 'left .2s',
        display: 'block',
      }} />
    </button>
  );

  if (!open) return null;

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: 380 }}>
        {/* Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cog6ToothIcon style={{ width: 16, height: 16, color: 'var(--text-muted)' }} />
            <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
              {t('Ajustes', 'Settings')}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label={t('Cerrar', 'Close')}
            style={{
              padding: '.3rem', borderRadius: 6,
              background: 'var(--surface-3)', border: 'none',
              cursor: 'pointer', color: 'var(--text-muted)', display: 'flex',
            }}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Idioma */}
          <div>
            <p style={sectionLabelStyle}>{t('Idioma', 'Language')}</p>
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LanguageIcon style={{ width: 16, height: 16, color: 'var(--brand)' }} />
                <span style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {lang === 'en' ? 'English' : 'Español'}
                </span>
              </div>
              <LangToggle lang={lang} onChange={setLang} label={t('Idioma', 'Language')} />
            </div>
          </div>

          {/* Apariencia */}
          <div>
            <p style={sectionLabelStyle}>{t('Apariencia', 'Appearance')}</p>
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {theme === 'dark'
                  ? <MoonIcon style={{ width: 16, height: 16, color: '#a5b4fc' }} />
                  : <SunIcon style={{ width: 16, height: 16, color: '#f59e0b' }} />}
                <span style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {theme === 'dark' ? t('Modo oscuro', 'Dark mode') : t('Modo claro', 'Light mode')}
                </span>
              </div>
              <Toggle enabled={theme === 'dark'} onChange={toggleTheme} />
            </div>
          </div>

          {/* Moneda */}
          <div>
            <p style={sectionLabelStyle}>{t('Moneda', 'Currency')}</p>
            <div style={rowStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CurrencyDollarIcon style={{ width: 16, height: 16, color: 'var(--brand)' }} />
                <span style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {currency === 'UYU' ? t('Pesos uruguayos', 'Uruguayan pesos') : t('Dólares', 'US dollars')}
                </span>
              </div>
              <Toggle enabled={currency === 'USD'} onChange={toggleCurrency} />
            </div>
          </div>

          {/* Secciones */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
              <p style={{ ...sectionLabelStyle, margin: 0 }}>
                {t('Secciones visibles del dashboard', 'Visible dashboard sections')}
              </p>
              <button
                onClick={resetSections}
                style={{ fontSize: '.75rem', fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                {t('Restablecer', 'Reset')}
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.375rem' }}>
              {(Object.keys(sections) as Array<keyof typeof sections>).map(key => (
                <div
                  key={key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '.625rem .875rem', background: 'var(--surface-2)',
                    borderRadius: 8, border: '1px solid var(--border)',
                  }}
                >
                  <span style={{ fontSize: '.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {labels[key]}
                  </span>
                  <Toggle
                    enabled={sections[key]}
                    onChange={() => updateSection(key, !sections[key])}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {t('Listo', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
