import React, { useState } from 'react';
import { useDashboardConfig } from '../contexts/DashboardConfigContext';
import { useTheme } from '../contexts/ThemeContext';
import { Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

interface DashboardSettingsProps {
  className?: string;
}

const DashboardSettings: React.FC<DashboardSettingsProps> = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { sections, updateSection, resetSections } = useDashboardConfig();
  const { theme, toggleTheme } = useTheme();

  const sectionLabels: Record<keyof typeof sections, string> = {
    totalSales: 'Total Ventas',
    totalRevenue: 'Total Ingresos',
    totalClients: 'Total Clientes',
    totalProducts: 'Total Productos',
    topProducts: 'Productos Más Vendidos',
    recentSales: 'Ventas Recientes',
  };

  const Switch: React.FC<{ enabled: boolean; onChange: () => void; label: string }> = ({
    enabled,
    onChange,
    label,
  }) => {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-100">{label}</span>
        <button
          type="button"
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
            enabled ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          onClick={onChange}
          role="switch"
          aria-checked={enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors ${className}`}
        title="Configuración del Dashboard"
      >
        <Cog6ToothIcon className="h-5 w-5 mr-2" />
        Configuración
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 my-8">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Configuración del Dashboard
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              {/* Modo Oscuro/Claro */}
              <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Apariencia
                </h4>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    {theme === 'dark' ? (
                      <MoonIcon className="h-5 w-5 text-gray-700 dark:text-gray-100 mr-2" />
                    ) : (
                      <SunIcon className="h-5 w-5 text-gray-700 dark:text-gray-100 mr-2" />
                    )}
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-100">
                      Modo Oscuro
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                      theme === 'dark' ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    onClick={toggleTheme}
                    role="switch"
                    aria-checked={theme === 'dark'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Secciones del Dashboard */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Secciones Visibles
                  </h4>
                  <button
                    onClick={resetSections}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                  >
                    Restablecer
                  </button>
                </div>
                <div className="space-y-1">
                  {(Object.keys(sections) as Array<keyof typeof sections>).map((section) => (
                    <Switch
                      key={section}
                      enabled={sections[section]}
                      onChange={() => updateSection(section, !sections[section])}
                      label={sectionLabels[section]}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardSettings;

