import api from './api';
import { LoginRequest, AuthResponse, UserRequestCreate } from '../types';

export const authService = {
  // Solicitar creación de usuario
  async requestUser(data: UserRequestCreate) {
    const response = await api.post('/auth/request-user', data);
    return response.data;
  },

  // Verificar estado de solicitud
  async getRequestStatus(username: string) {
    const response = await api.get(`/auth/request-status/${username}`);
    return response.data;
  },

  // Login
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  // Obtener perfil del usuario autenticado
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

