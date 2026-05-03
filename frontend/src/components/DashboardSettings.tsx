import React, { useState } from 'react';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { useTheme } from '../contexts/ThemeContext';
import { Cog6ToothIcon, XMarkIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const DashboardSettings: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { sections, updateSection, resetSections } = useDashboardConfig();
  const { theme, toggleTheme } = useTheme();

  const labels: Record<keyof typeof sections, string> = {
    totalSales:    'Total ventas',
    totalRevenue:  'Total ingresos',
    totalClients:  'Total clientes',
    totalProducts: 'Total productos',
    topProducts:   'Productos más vendidos',
    recentSales:   'Ventas recientes',
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`btn btn-ghost ${className}`}
        style={{ fontSize: '.8rem' }}
      >
        <Cog6ToothIcon className="w-4 h-4" />
        Configuración
      </button>

      {isOpen && (
        <div
          className="modal-overlay"
          onClick={e => e.target === e.currentTarget && setIsOpen(false)}
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
                  Configuración
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
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
              {/* Apariencia */}
              <div>
                <p style={{ margin: '0 0 .75rem', fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Apariencia
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.625rem .875rem', background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {theme === 'dark'
                      ? <MoonIcon style={{ width: 16, height: 16, color: '#a5b4fc' }} />
                      : <SunIcon style={{ width: 16, height: 16, color: '#f59e0b' }} />}
                    <span style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Modo {theme === 'dark' ? 'oscuro' : 'claro'}
                    </span>
                  </div>
                  <Toggle enabled={theme === 'dark'} onChange={toggleTheme} />
                </div>
              </div>

              {/* Secciones */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
                  <p style={{ margin: 0, fontSize: '.7rem', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Secciones visibles
                  </p>
                  <button
                    onClick={resetSections}
                    style={{ fontSize: '.75rem', fontWeight: 600, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Restablecer
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
                onClick={() => setIsOpen(false)}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardSettings;
