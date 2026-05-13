import api from './api';
import { UserRequest, User } from '../types';

export const adminService = {
  async getRequests(): Promise<UserRequest[]> {
    const response = await api.get('/auth/admin/requests');
    return response.data;
  },

  async approveRequest(id: number) {
    const response = await api.post(`/auth/admin/requests/${id}/approve`);
    return response.data;
  },

  async rejectRequest(id: number) {
    const response = await api.post(`/auth/admin/requests/${id}/reject`);
    return response.data;
  },

  async getUsers(): Promise<User[]> {
    const response = await api.get('/auth/admin/users');
    return response.data;
  },

  async resetPassword(userId: number, password: string): Promise<{ message: string }> {
    const response = await api.put(`/auth/admin/users/${userId}/reset-password`, { password });
    return response.data;
  },
};

