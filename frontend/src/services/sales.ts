import api from './api';
import { Sale, SaleCreate, PaginatedResponse, PaginationParams } from '../types';

export const salesService = {
  // Listar ventas con paginación
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Sale>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/sales?${queryParams.toString()}`);
    return response.data;
  },

  // Obtener una venta por ID
  async getById(id: number): Promise<Sale> {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Crear venta
  async create(data: SaleCreate): Promise<Sale> {
    const response = await api.post('/sales', data);
    return response.data;
  },

  // Actualizar venta
  async update(id: number, data: Partial<SaleCreate>): Promise<Sale> {
    const response = await api.put(`/sales/${id}`, data);
    return response.data;
  },

  // Eliminar venta
  async delete(id: number, reason?: string): Promise<void> {
    await api.delete(`/sales/${id}`, { data: { reason } });
  },
};

