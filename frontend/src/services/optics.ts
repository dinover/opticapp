import api from './api';
import { Optics } from '../types';

export const opticsService = {
  // Listar todas las ópticas (admin)
  async getAll(): Promise<Optics[]> {
    const response = await api.get('/optics');
    return response.data;
  },

  // Obtener una óptica por ID
  async getById(id: number): Promise<Optics> {
    const response = await api.get(`/optics/${id}`);
    return response.data;
  },

  // Crear óptica (admin)
  async create(data: Partial<Optics>): Promise<Optics> {
    const response = await api.post('/optics', data);
    return response.data;
  },

  // Actualizar óptica (admin)
  async update(id: number, data: Partial<Optics>): Promise<Optics> {
    const response = await api.put(`/optics/${id}`, data);
    return response.data;
  },

  // Eliminar óptica (admin)
  async delete(id: number): Promise<void> {
    await api.delete(`/optics/${id}`);
  },
};

