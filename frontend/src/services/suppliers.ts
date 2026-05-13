import api from './api';
import { Supplier } from '../types';

export const suppliersService = {
  async getAll(): Promise<Supplier[]> {
    const response = await api.get('/suppliers');
    return response.data;
  },

  async getById(id: number): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  async create(data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  async update(id: number, data: Partial<Supplier>): Promise<Supplier> {
    const response = await api.put(`/suppliers/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  },
};
