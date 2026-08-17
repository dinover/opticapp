import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import SettingsModal from './SettingsModal';
import {
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = 'opticapp.sidebar.collapsed';
const TOPBAR_HEIGHT = 56;

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // El sidebar abre expandido por default; el estado colapsado se recuerda entre sesiones.
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
  );
  // El hover de la user pill se maneja en estado porque el estilo es inline
  const [userPillHover, setUserPillHover] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
      return next;
    });
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface-2)' }}>
      {/* ── Topbar ─────────────────────────────────────── */}
      <header
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0, zIndex: 40,
        }}
      >
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between" style={{ height: TOPBAR_HEIGHT }}>
            {/* Mobile hamburger + Logo */}
            <div className="flex items-center gap-3">
              <button
                className="sm:hidden btn btn-ghost"
                style={{ padding: '.4rem' }}
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
              <Link to="/dashboard" className="flex items-center gap-2.5" style={{ textDecoration: 'none' }}>
                <img src="/logo.png" alt="OpticApp" style={{ width: 50, height: 50, objectFit: 'contain' }} />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  OpticApp
                </span>
              </Link>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* User pill → Mi cuenta */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5"
                title="Mi cuenta"
                aria-label="Mi cuenta"
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
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
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
            position: 'sticky', top: TOPBAR_HEIGHT,
            height: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
            flexShrink: 0,
          }}
        >
          <Sidebar
            collapsed={collapsed}
            onToggleCollapse={toggleCollapsed}
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
                  aria-label="Cerrar menú"
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
