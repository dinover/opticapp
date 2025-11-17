import api from './api';
import { Client, PaginatedResponse, PaginationParams } from '../types';

export const clientsService = {
  // Listar clientes con paginación
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Client>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/clients?${queryParams.toString()}`);
    return response.data;
  },

  // Obtener un cliente por ID
  async getById(id: number): Promise<Client> {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  // Crear cliente
  async create(data: Partial<Client>): Promise<Client> {
    const response = await api.post('/clients', data);
    return response.data;
  },

  // Actualizar cliente
  async update(id: number, data: Partial<Client>): Promise<Client> {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  // Eliminar cliente
  async delete(id: number): Promise<void> {
    await api.delete(`/clients/${id}`);
  },
};

