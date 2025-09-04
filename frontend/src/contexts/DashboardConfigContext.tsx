import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

export interface DashboardPanel {
  id: string;
  name: string;
  enabled: boolean;
  order: number;
}

interface DashboardConfigContextType {
  panels: DashboardPanel[];
  updatePanelVisibility: (panelId: string, enabled: boolean) => void;
  updatePanelOrder: (panelId: string, newOrder: number) => void;
  resetToDefaults: () => void;
  getEnabledPanels: () => DashboardPanel[];
}

const DashboardConfigContext = createContext<DashboardConfigContextType | undefined>(undefined);

export const useDashboardConfig = () => {
  const context = useContext(DashboardConfigContext);
  if (context === undefined) {
    throw new Error('useDashboardConfig must be used within a DashboardConfigProvider');
  }
  return context;
};

interface DashboardConfigProviderProps {
  children: ReactNode;
}

const defaultPanels: DashboardPanel[] = [
  { id: 'sales-overview', name: 'Resumen de Ventas', enabled: true, order: 0 },
  { id: 'recent-sales', name: 'Ventas Recientes', enabled: true, order: 1 },
  { id: 'top-products', name: 'Productos Más Vendidos', enabled: true, order: 2 },
  { id: 'low-stock', name: 'Productos con Bajo Stock', enabled: true, order: 3 },
  { id: 'client-stats', name: 'Estadísticas de Clientes', enabled: true, order: 4 },
  { id: 'revenue-chart', name: 'Gráfico de Ingresos', enabled: true, order: 5 },
];

export const DashboardConfigProvider: React.FC<DashboardConfigProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [panels, setPanels] = useState<DashboardPanel[]>(defaultPanels);

  // Cargar configuraciones guardadas para la óptica específica
  useEffect(() => {
    if (user?.optic_id) {
      const savedConfig = localStorage.getItem(`opticapp-dashboard-config-${user.optic_id}`);
      if (savedConfig) {
        try {
          const parsedConfig = JSON.parse(savedConfig);
          setPanels(parsedConfig);
        } catch (error) {
          console.error('Error parsing saved dashboard config:', error);
          setPanels(defaultPanels);
        }
      } else {
        setPanels(defaultPanels);
      }
    }
  }, [user?.optic_id]);

  // Guardar configuraciones cuando cambien
  useEffect(() => {
    if (user?.optic_id) {
      localStorage.setItem(`opticapp-dashboard-config-${user.optic_id}`, JSON.stringify(panels));
    }
  }, [panels, user?.optic_id]);

  const updatePanelVisibility = (panelId: string, enabled: boolean) => {
    setPanels(prev => prev.map(panel => 
      panel.id === panelId ? { ...panel, enabled } : panel
    ));
  };

  const updatePanelOrder = (panelId: string, newOrder: number) => {
    setPanels(prev => {
      const updatedPanels = [...prev];
      const panelIndex = updatedPanels.findIndex(p => p.id === panelId);
      
      if (panelIndex !== -1) {
        const panel = updatedPanels[panelIndex];
        const oldOrder = panel.order;
        
        // Reordenar los otros paneles
        updatedPanels.forEach(p => {
          if (p.id !== panelId) {
            if (newOrder > oldOrder) {
              // Moviendo hacia abajo
              if (p.order > oldOrder && p.order <= newOrder) {
                p.order--;
              }
            } else {
              // Moviendo hacia arriba
              if (p.order >= newOrder && p.order < oldOrder) {
                p.order++;
              }
            }
          }
        });
        
        panel.order = newOrder;
      }
      
      return updatedPanels.sort((a, b) => a.order - b.order);
    });
  };

  const resetToDefaults = () => {
    setPanels(defaultPanels);
  };

  const getEnabledPanels = () => {
    return panels.filter(panel => panel.enabled).sort((a, b) => a.order - b.order);
  };

  return (
    <DashboardConfigContext.Provider value={{
      panels,
      updatePanelVisibility,
      updatePanelOrder,
      resetToDefaults,
      getEnabledPanels,
    }}>
      {children}
    </DashboardConfigContext.Provider>
  );
};
