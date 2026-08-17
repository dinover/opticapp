import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowUpTrayIcon,
  DocumentChartBarIcon,
  SunIcon,
  MoonIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { currency, toggleCurrency } = useCurrency();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // El hover de la user pill se maneja en estado porque el estilo es inline
  const [userPillHover, setUserPillHover] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard',   icon: HomeIcon },
    { path: '/clients',   label: 'Clientes',    icon: UserGroupIcon },
    { path: '/products',  label: 'Productos',   icon: ShoppingBagIcon },
    { path: '/sales',     label: 'Ventas',      icon: ChartBarIcon },
    { path: '/suppliers', label: 'Proveedores', icon: TruckIcon },
    { path: '/import',    label: 'Importar',    icon: ArrowUpTrayIcon },
    { path: '/reports',   label: 'Reportes',    icon: DocumentChartBarIcon },
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
                <img src="/logo.png" alt="OpticApp" style={{ width: 30, height: 30, objectFit: 'contain' }} />
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
                {user?.role === 'owner' && (
                  <Link to="/team" className={`nav-link ${isActive('/team') ? 'active' : ''}`}>
                    <UserGroupIcon className="w-4 h-4" />
                    Equipo
                  </Link>
                )}
              </nav>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* User pill → Mi cuenta */}
              <Link
                to="/profile"
                className="hidden sm:flex items-center gap-2.5"
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
                <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {user?.username}
                </span>
              </Link>

              {/* Currency toggle */}
              <button
                onClick={toggleCurrency}
                className="btn btn-ghost"
                style={{ padding: '.35rem .6rem', fontSize: '.75rem', fontWeight: 700, fontFamily: 'DM Mono, monospace', minWidth: 52 }}
                title={currency === 'UYU' ? 'Cambiar a dólares' : 'Cambiar a pesos'}
              >
                {currency === 'UYU' ? '$ UYU' : 'USD'}
              </button>

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="btn btn-ghost"
                style={{ padding: '.4rem' }}
                title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              >
                {theme === 'dark'
                  ? <SunIcon className="w-4 h-4" />
                  : <MoonIcon className="w-4 h-4" />}
              </button>

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
                aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={mobileOpen}
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
            {[
              ...navItems,
              ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheckIcon }] : []),
              ...(user?.role === 'owner' ? [{ path: '/team', label: 'Equipo', icon: UserGroupIcon }] : []),
              { path: '/profile', label: 'Mi cuenta', icon: UserCircleIcon },
            ].map(item => {
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
