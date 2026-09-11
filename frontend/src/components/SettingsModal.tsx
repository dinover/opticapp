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

/** Interruptor accesible (role="switch"); el estilo sale de .switch en index.css. */
const Switch: React.FC<{ enabled: boolean; onChange: () => void; label: string }> = ({ enabled, onChange, label }) => (
  <button type="button" role="switch" aria-checked={enabled} aria-label={label} onClick={onChange} className="switch" />
);

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

  if (!open) return null;

  const themeLabel = theme === 'dark' ? t('Modo oscuro', 'Dark mode') : t('Modo claro', 'Light mode');
  const currencyLabel = currency === 'UYU' ? t('Pesos uruguayos', 'Uruguayan pesos') : t('Dólares', 'US dollars');

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: 400 }} role="dialog" aria-modal="true" aria-label={t('Ajustes', 'Settings')}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Cog6ToothIcon className="w-4 h-4" style={{ color: 'var(--accent-text)' }} />
            {t('Ajustes', 'Settings')}
          </h3>
          <button type="button" onClick={onClose} className="modal-close" aria-label={t('Cerrar', 'Close')}>
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body">
          <div className="settings-section">
            <p className="settings-label">{t('Idioma', 'Language')}</p>
            <div className="settings-row">
              <span className="settings-row-label"><LanguageIcon />{lang === 'en' ? 'English' : 'Español'}</span>
              <LangToggle lang={lang} onChange={setLang} label={t('Idioma', 'Language')} />
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-label">{t('Apariencia', 'Appearance')}</p>
            <div className="settings-row">
              <span className="settings-row-label">{theme === 'dark' ? <MoonIcon /> : <SunIcon />}{themeLabel}</span>
              <Switch enabled={theme === 'dark'} onChange={toggleTheme} label={t('Modo oscuro', 'Dark mode')} />
            </div>
          </div>

          <div className="settings-section">
            <p className="settings-label">{t('Moneda', 'Currency')}</p>
            <div className="settings-row">
              <span className="settings-row-label"><CurrencyDollarIcon />{currencyLabel}</span>
              <Switch enabled={currency === 'USD'} onChange={toggleCurrency} label={t('Mostrar en dólares', 'Show in US dollars')} />
            </div>
          </div>

          <div className="settings-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '.75rem' }}>
              <p className="settings-label">{t('Secciones visibles del dashboard', 'Visible dashboard sections')}</p>
              <button type="button" className="link-btn" onClick={resetSections}>{t('Restablecer', 'Reset')}</button>
            </div>
            {(Object.keys(sections) as Array<keyof typeof sections>).map(key => (
              <div key={key} className="settings-row">
                <span className="settings-row-label" style={{ fontWeight: 550 }}>{labels[key]}</span>
                <Switch enabled={sections[key]} onChange={() => updateSection(key, !sections[key])} label={labels[key]} />
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-primary btn-block">
            {t('Listo', 'Done')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
