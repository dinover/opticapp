import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import LangToggle from './LangToggle';
import LicenseBanner from './LicenseBanner';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'opticapp.sidebar.collapsed';
const TOPBAR_HEIGHT = 56;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // El sidebar abre expandido por default; el estado comprimido se recuerda entre sesiones.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  );
  // El hover de la user pill se maneja en estado porque el estilo es inline
  const [userPillHover, setUserPillHover] = useState(false);

  // Alto real de la cabecera fija (topbar + banner de licencia, si hay). El
  // sidebar se pega debajo y ocupa el resto de la pantalla; con un alto fijo
  // de 56px, el banner empujaba "Ajustes" fuera de la vista.
  const headerRef = useRef<HTMLElement>(null);
  const [headerHeight, setHeaderHeight] = useState(TOPBAR_HEIGHT);
  useLayoutEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const update = () => setHeaderHeight(el.offsetHeight);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  const collapseLabel = collapsed ? t('Expandir menú', 'Expand sidebar') : t('Comprimir menú', 'Collapse sidebar');

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      {/* ── Cabecera fija: banner de licencia + topbar ───── */}
      <header
        ref={headerRef}
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 40,
        }}
      >
        <LicenseBanner />
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height: TOPBAR_HEIGHT }}>
            {/* Mobile hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                className="sm:hidden btn btn-ghost"
                style={{ padding: '.4rem' }}
                onClick={() => setMobileOpen(true)}
                aria-label={t('Abrir menú', 'Open menu')}
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <Link to="/dashboard" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
                <img src="/logo.png" alt="OpticApp" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                {/* En celular no entra junto al selector de idioma: queda solo el logo. */}
                <span className="hidden sm:inline" style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  OpticApp
                </span>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <LangToggle lang={lang} onChange={setLang} label={t('Idioma', 'Language')} />

              {/* User pill → Mi cuenta */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5"
                title={t('Mi cuenta', 'My account')}
                aria-label={t('Mi cuenta', 'My account')}
                onMouseEnter={() => setUserPillHover(true)}
                onMouseLeave={() => setUserPillHover(false)}
                onFocus={() => setUserPillHover(true)}
                onBlur={() => setUserPillHover(false)}
                style={{
                  background: 'var(--surface-3)',
                  borderRadius: 99, padding: '4px 12px 4px 4px',
                  textDecoration: 'none',
                  transition: 'box-shadow .15s, opacity .15s',
                  boxShadow: userPillHover ? 'var(--shadow-sm)' : 'none',
                  opacity: userPillHover ? 0.85 : 1,
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 99,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '.75rem',
                }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline" style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {user?.username}
                </span>
              </Link>

              <button
                onClick={logout}
                className="btn btn-ghost"
                style={{ padding: '.4rem .75rem', fontSize: '.8rem' }}
                title={t('Cerrar sesión', 'Log out')}
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">{t('Salir', 'Log out')}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex items-start">
        {/* ── Sidebar de escritorio ──────────────────────── */}
        <aside
          className="hidden sm:block"
          style={{
            width: collapsed ? 68 : 220,
            transition: 'width .2s',
            borderRight: '1px solid var(--border)',
            background: 'var(--surface)',
            position: 'sticky', top: headerHeight,
            height: `calc(100vh - ${headerHeight}px)`,
            flexShrink: 0,
          }}
        >
          {/* Comprimir / expandir: sobre el borde, siempre a la vista. */}
          <button
            type="button"
            className="sidebar-toggle"
            onClick={toggleCollapsed}
            aria-label={collapseLabel}
            aria-expanded={!collapsed}
            title={collapseLabel}
          >
            {collapsed ? <ChevronDoubleRightIcon /> : <ChevronDoubleLeftIcon />}
          </button>
          <Sidebar
            collapsed={collapsed}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </aside>

        {/* ── Drawer mobile ──────────────────────────────── */}
        {mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,.6)', zIndex: 59 }}
            />
            <div style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
              background: 'var(--surface)', zIndex: 60, boxShadow: 'var(--shadow-lg)',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0 1rem', height: TOPBAR_HEIGHT, borderBottom: '1px solid var(--border)', flexShrink: 0,
              }}>
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="OpticApp" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                  <span style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--text-primary)' }}>OpticApp</span>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '.4rem' }}
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('Cerrar menú', 'Close menu')}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <Sidebar
                  collapsed={false}
                  onNavigate={() => setMobileOpen(false)}
                  onOpenSettings={() => { setMobileOpen(false); setSettingsOpen(true); }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Content ──────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 fade-in" style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Layout;
