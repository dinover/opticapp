import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsMobile } from '../hooks/useMediaQuery';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import LangToggle from './LangToggle';
import LicenseBanner, { LicenseChip } from './LicenseBanner';
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
const TOPBAR_HEIGHT = 60;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // El sidebar abre expandido por default; el estado comprimido se recuerda entre sesiones.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  );

  // Alto real de la cabecera fija (franja de licencia + topbar + chip en
  // celular). El sidebar se pega debajo y ocupa el resto de la pantalla.
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
    <div className="app-shell">
      {/* ── Cabecera fija ───────────────────────────── */}
      <header ref={headerRef} className="app-header">
        <LicenseBanner />
        <div className="topbar">
          <div className="topbar-side">
            {/* El contenedor lleva sm:hidden: .btn-icon define su propio display y pisaría la utilidad. */}
            <span className="sm:hidden">
              <button
                className="btn-icon"
                onClick={() => setMobileOpen(true)}
                aria-label={t('Abrir menú', 'Open menu')}
              >
                <Bars3Icon />
              </button>
            </span>
            <Link to="/dashboard" className="brand">
              <img src="/logo.png" alt="OpticApp" />
              {/* En celular no entra junto al selector de idioma: queda solo el logo. */}
              <span className="hidden sm:inline">OpticApp</span>
            </Link>
          </div>

          <div className="topbar-side">
            {!isMobile && <LicenseChip />}
            <LangToggle lang={lang} onChange={setLang} label={t('Idioma', 'Language')} />

            <Link
              to="/profile"
              className="user-pill"
              title={t('Mi cuenta', 'My account')}
              aria-label={t('Mi cuenta', 'My account')}
            >
              <span className="avatar grad">{user?.username?.charAt(0).toUpperCase()}</span>
              <span className="hidden sm:inline">{user?.username}</span>
            </Link>

            <button
              onClick={logout}
              className="btn btn-ghost btn-sm"
              title={t('Cerrar sesión', 'Log out')}
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t('Salir', 'Log out')}</span>
            </button>
          </div>
        </div>
        {isMobile && <LicenseChip asRow />}
      </header>

      <div className="app-body">
        {/* ── Sidebar de escritorio ──────────────────────── */}
        <aside
          className="app-aside hidden sm:block"
          style={{
            width: collapsed ? 68 : 224,
            position: 'sticky', top: headerHeight,
            height: `calc(100vh - ${headerHeight}px)`,
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
            <div className="drawer-backdrop" onClick={() => setMobileOpen(false)} />
            <div className="drawer">
              <div className="drawer-head">
                <div className="brand">
                  <img src="/logo.png" alt="OpticApp" />
                  <span>OpticApp</span>
                </div>
                <button
                  className="btn-icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label={t('Cerrar menú', 'Close menu')}
                >
                  <XMarkIcon />
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
        <main className="app-main max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 fade-in">
          {children}
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
};

export default Layout;
