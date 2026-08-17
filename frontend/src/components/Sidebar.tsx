import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  /** Icon-only mode. Se ignora en el drawer mobile, que siempre va expandido. */
  collapsed: boolean;
  /** Si no se pasa, no se muestra el botón de colapsar (caso del drawer mobile). */
  onToggleCollapse?: () => void;
  /** Se dispara al navegar; el drawer mobile lo usa para cerrarse. */
  onNavigate?: () => void;
  onOpenSettings: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse, onNavigate, onOpenSettings }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard',   icon: HomeIcon },
    { path: '/clients',   label: 'Clientes',    icon: UserGroupIcon },
    { path: '/products',  label: 'Productos',   icon: ShoppingBagIcon },
    { path: '/sales',     label: 'Ventas',      icon: ChartBarIcon },
    { path: '/suppliers', label: 'Proveedores', icon: TruckIcon },
    { path: '/import',    label: 'Importar',    icon: ArrowUpTrayIcon },
    { path: '/reports',   label: 'Reportes',    icon: DocumentChartBarIcon },
    ...(user?.role === 'admin' ? [{ path: '/admin', label: 'Admin', icon: ShieldCheckIcon }] : []),
    ...(user?.role === 'owner' ? [{ path: '/team', label: 'Equipo', icon: UserGroupIcon }] : []),
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
          title={collapsed ? 'Ajustes' : undefined}
          className="nav-link"
          style={{ ...itemLayout, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Cog6ToothIcon className="w-4 h-4" style={{ flexShrink: 0 }} />
          {!collapsed && <span>Ajustes</span>}
        </button>

        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
            className="nav-link"
            style={{ ...itemLayout, marginBottom: 0, border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--text-muted)' }}
          >
            {collapsed
              ? <ChevronDoubleRightIcon className="w-4 h-4" style={{ flexShrink: 0 }} />
              : <ChevronDoubleLeftIcon className="w-4 h-4" style={{ flexShrink: 0 }} />}
            {!collapsed && <span>Colapsar</span>}
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
