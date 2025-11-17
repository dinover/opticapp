import api from './api';
import { DashboardStats, DashboardConfig } from '../types';

export const dashboardService = {
  // Obtener estadísticas
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  // Obtener configuración
  async getConfig(): Promise<DashboardConfig> {
    const response = await api.get('/dashboard/config');
    return response.data;
  },

  // Actualizar configuración
  async updateConfig(sections_visible: any): Promise<DashboardConfig> {
    const response = await api.put('/dashboard/config', { sections_visible });
    return response.data;
  },
};

