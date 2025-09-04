import React, { useState } from 'react';
import { X, Settings, Moon, Sun, Eye, EyeOff, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useDashboardConfig } from '../../contexts/DashboardConfigContext';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { panels, updatePanelVisibility, updatePanelOrder, resetToDefaults } = useDashboardConfig();
  const [activeTab, setActiveTab] = useState<'theme' | 'dashboard'>('theme');

  const handlePanelToggle = (panelId: string, enabled: boolean) => {
    updatePanelVisibility(panelId, enabled);
    toast.success(`${enabled ? 'Activado' : 'Desactivado'} panel correctamente`);
  };

  const movePanel = (panelId: string, direction: 'up' | 'down') => {
    const panel = panels.find(p => p.id === panelId);
    if (!panel) return;

    const currentOrder = panel.order;
    const newOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;

    if (newOrder >= 0 && newOrder < panels.length) {
      updatePanelOrder(panelId, newOrder);
      toast.success('Panel reordenado correctamente');
    }
  };

  const handleResetDefaults = () => {
    resetToDefaults();
    toast.success('Configuración restaurada a valores por defecto');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Configuración</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza tu experiencia</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('theme')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'theme'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tema
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {activeTab === 'theme' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {isDarkMode ? (
                      <Moon className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Sun className="w-5 h-5 text-yellow-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">Modo Oscuro</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {isDarkMode ? 'Activado' : 'Desactivado'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleDarkMode}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDarkMode ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDarkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'dashboard' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Paneles del Dashboard</h4>
                  <button
                    onClick={handleResetDefaults}
                    className="flex items-center space-x-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restaurar</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {panels.map((panel) => (
                    <div
                      key={panel.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handlePanelToggle(panel.id, !panel.enabled)}
                          className={`p-1 rounded ${
                            panel.enabled
                              ? 'text-green-600 hover:text-green-700'
                              : 'text-gray-400 hover:text-gray-600'
                          }`}
                        >
                          {panel.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <span className="font-medium text-gray-900 dark:text-white">{panel.name}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => movePanel(panel.id, 'up')}
                          disabled={panel.order === 0}
                          className={`p-1 rounded ${
                            panel.order === 0
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => movePanel(panel.id, 'down')}
                          disabled={panel.order === panels.length - 1}
                          className={`p-1 rounded ${
                            panel.order === panels.length - 1
                              ? 'text-gray-300 cursor-not-allowed'
                              : 'text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>• Usa el ícono del ojo para mostrar/ocultar paneles</p>
                  <p>• Usa las flechas para reordenar los paneles</p>
                  <p>• Los cambios se guardan automáticamente</p>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
