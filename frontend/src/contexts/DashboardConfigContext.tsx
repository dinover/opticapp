import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DashboardSections {
  totalSales: boolean;
  totalRevenue: boolean;
  totalClients: boolean;
  totalProducts: boolean;
  topProducts: boolean;
  recentSales: boolean;
}

interface DashboardConfigContextType {
  sections: DashboardSections;
  updateSection: (section: keyof DashboardSections, visible: boolean) => void;
  resetSections: () => void;
}

const defaultSections: DashboardSections = {
  totalSales: true,
  totalRevenue: true,
  totalClients: true,
  totalProducts: true,
  topProducts: true,
  recentSales: true,
};

const DashboardConfigContext = createContext<DashboardConfigContextType | undefined>(undefined);

export const DashboardConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [sections, setSections] = useState<DashboardSections>(() => {
    // Cargar desde localStorage
    const saved = localStorage.getItem('dashboardSections');
    if (saved) {
      try {
        return { ...defaultSections, ...JSON.parse(saved) };
      } catch {
        return defaultSections;
      }
    }
    return defaultSections;
  });

  useEffect(() => {
    // Guardar en localStorage cuando cambie
    localStorage.setItem('dashboardSections', JSON.stringify(sections));
  }, [sections]);

  const updateSection = (section: keyof DashboardSections, visible: boolean) => {
    setSections(prev => ({ ...prev, [section]: visible }));
  };

  const resetSections = () => {
    setSections(defaultSections);
  };

  return (
    <DashboardConfigContext.Provider value={{ sections, updateSection, resetSections }}>
      {children}
    </DashboardConfigContext.Provider>
  );
};

export const useDashboardConfig = () => {
  const context = useContext(DashboardConfigContext);
  if (!context) {
    throw new Error('useDashboardConfig must be used within a DashboardConfigProvider');
  }
  return context;
};

