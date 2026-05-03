import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: HomeIcon },
    { path: '/clients',   label: 'Clientes',   icon: UserGroupIcon },
    { path: '/products',  label: 'Productos',  icon: ShoppingBagIcon },
    { path: '/sales',     label: 'Ventas',     icon: ChartBarIcon },
  ];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2.5">
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="3"/><path d="M20.188 10.934c.388.472.388 1.16 0 1.632C18.768 14.35 15.636 18 12 18c-3.636 0-6.768-3.65-8.188-5.434a1.3 1.3 0 0 1 0-1.632C5.232 9.65 8.364 6 12 6c3.636 0 6.768 3.65 8.188 5.434z"/>
                  </svg>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  OpticApp
                </span>
              </div>

              {/* Desktop nav */}
              <nav className="hidden sm:flex items-center gap-1">
                {navItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                {user?.role === 'admin' && (
                  <Link to="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`}>
                    <ShieldCheckIcon className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* User pill */}
              <div className="hidden sm:flex items-center gap-2.5" style={{
                background: 'var(--surface-3)',
                borderRadius: 99, padding: '4px 12px 4px 4px',
              }}>
                <div style={{
                  width: 26, height: 26, borderRadius: 99,
                  background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontWeight: 700, fontSize: '.75rem',
                }}>
                  {user?.username?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {user?.username}
                </span>
              </div>

              <button
                onClick={logout}
                className="btn btn-ghost"
                style={{ padding: '.4rem .75rem', fontSize: '.8rem' }}
                title="Cerrar sesión"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>

              {/* Mobile hamburger */}
              <button
                className="sm:hidden btn btn-ghost"
                style={{ padding: '.4rem' }}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen
                  ? <XMarkIcon className="w-5 h-5" />
                  : <Bars3Icon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
            padding: '0.5rem 1rem 1rem',
          }}>
            {[...navItems, ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheckIcon }] : [])].map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  style={{ display: 'flex', marginBottom: '.25rem' }}
                  onClick={() => setMobileOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Content ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;
