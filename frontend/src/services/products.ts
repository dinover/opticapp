import api from './api';
import { Product, PaginatedResponse, PaginationParams } from '../types';

export const productsService = {
  // Listar productos con paginación
  async getAll(params?: PaginationParams): Promise<PaginatedResponse<Product>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response.data;
  },

  // Obtener un producto por ID
  async getById(id: number): Promise<Product> {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  // Crear producto
  async create(data: Partial<Product>): Promise<Product> {
    const response = await api.post('/products', data);
    return response.data;
  },

  // Actualizar producto
  async update(id: number, data: Partial<Product>): Promise<Product> {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  // Eliminar producto
  async delete(id: number, reason?: string): Promise<void> {
    await api.delete(`/products/${id}`, { data: { reason } });
  },
};

