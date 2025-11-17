import api from './api';
import { UserRequest } from '../types';

export const adminService = {
  // Listar todas las solicitudes
  async getRequests(): Promise<UserRequest[]> {
    const response = await api.get('/auth/admin/requests');
    return response.data;
  },

  // Aprobar solicitud
  async approveRequest(id: number) {
    const response = await api.post(`/auth/admin/requests/${id}/approve`);
    return response.data;
  },

  // Rechazar solicitud
  async rejectRequest(id: number) {
    const response = await api.post(`/auth/admin/requests/${id}/reject`);
    return response.data;
  },
};

