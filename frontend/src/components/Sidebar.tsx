import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  HomeIcon,
  UserGroupIcon,
  ShoppingBagIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  TruckIcon,
  ArrowUpTrayIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  /** Icon-only mode. Se ignora en el drawer mobile, que siempre va expandido.
   *  El botón para comprimir/expandir vive en Layout, sobre el borde del sidebar. */
  collapsed: boolean;
  /** Se dispara al navegar; el drawer mobile lo usa para cerrarse. */
  onNavigate?: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onNavigate, onOpenSettings }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard',                       icon: HomeIcon },
    { path: '/clients',   label: t('Clientes', 'Clients'),          icon: UserGroupIcon },
    { path: '/products',  label: t('Productos', 'Products'),        icon: ShoppingBagIcon },
    { path: '/sales',     label: t('Ventas', 'Sales'),              icon: ChartBarIcon },
    { path: '/suppliers', label: t('Proveedores', 'Suppliers'),     icon: TruckIcon },
    { path: '/import',    label: t('Importar', 'Import'),           icon: ArrowUpTrayIcon },
    { path: '/reports',   label: t('Reportes', 'Reports'),          icon: DocumentChartBarIcon },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheckIcon }] : []),
    ...(user?.role === 'owner' ? [{ path: '/team', label: t('Equipo', 'Team'), icon: UserGroupIcon }] : []),
  ];

  const itemLayout: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: collapsed ? 0 : '.625rem',
    justifyContent: collapsed ? 'center' : 'flex-start',
    padding: collapsed ? '.625rem' : '.625rem .75rem',
    width: '100%',
    marginBottom: 2,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  const settingsLabel = t('Ajustes', 'Settings');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '.75rem .5rem' }}>
        {navItems.map(item => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`nav-link ${active ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={itemLayout}
            >
              <Icon className="w-4 h-4" style={{ flexShrink: 0 }} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid var(--border)', padding: '.5rem' }}>
        <button
          type="button"
          onClick={onOpenSettings}
          title={collapsed ? settingsLabel : undefined}
          className="nav-link"
          style={{ ...itemLayout, marginBottom: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Cog6ToothIcon className="w-4 h-4" style={{ flexShrink: 0 }} />
          {!collapsed && <span>{settingsLabel}</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
