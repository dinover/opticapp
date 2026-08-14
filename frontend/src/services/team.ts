import api from './api';
import { User } from '../types';

export interface TeamUserCreate {
  username: string;
  email: string;
  password: string;
}

export const teamService = {
  async getUsers(): Promise<User[]> {
    const response = await api.get('/auth/team/users');
    return response.data;
  },

  async createUser(data: TeamUserCreate): Promise<User> {
    const response = await api.post('/auth/team/users', data);
    return response.data;
  },

  async deleteUser(userId: number): Promise<{ message: string }> {
    const response = await api.delete(`/auth/team/users/${userId}`);
    return response.data;
  },
};
