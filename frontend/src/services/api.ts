import axios from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Product,
  Client,
  SaleWithDetails,
  ActivityItem,
  TopProduct,
  RegistrationRequest
} from '../types';

// API Configuration
const getApiBaseUrl = () => {
  // Check if we're in development
  if (import.meta.env.DEV) {
    return 'http://localhost:3001/api';
  }
  
  // In production, use the Railway URL
  return 'https://opticapp-production.up.railway.app/api';
};

const API_BASE_URL = getApiBaseUrl();

console.log('=== API Configuration Debug ===');
console.log('Environment:', import.meta.env.MODE);
console.log('DEV mode:', import.meta.env.DEV);
console.log('VITE_API_URL from env:', import.meta.env.VITE_API_URL);
console.log('API_BASE_URL being used:', API_BASE_URL);
console.log('Current window.location:', window.location.href);
console.log('================================');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, config.data);
    console.log('Full URL:', (config.baseURL || '') + (config.url || ''));
    console.log('Config:', config);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url, response.data);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('optic');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    console.log('Attempting login with:', credentials.username);
    const response = await api.post('/auth/login', credentials);
    console.log('Login successful:', response.data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<any> => {
    console.log('Attempting registration for:', data.username);
    const response = await api.post('/auth/register', data);
    console.log('Registration successful:', response.data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  getRegistrationRequests: async (): Promise<RegistrationRequest[]> => {
    const response = await api.get('/auth/registration-requests');
    return response.data;
  },

  approveRegistrationRequest: async (requestId: number, data: { status: 'approved' | 'rejected', admin_notes?: string }): Promise<any> => {
    const response = await api.put(`/auth/registration-requests/${requestId}`, data);
    return response.data;
  },
};

// Products endpoints
export const productsAPI = {
  getAll: async (): Promise<Product[]> => {
    const response = await api.get('/products');
    return response.data;
  },

  getById: async (id: number): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  create: async (data: FormData): Promise<Product> => {
    const response = await api.post('/products', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  update: async (id: number, data: FormData): Promise<Product> => {
    const response = await api.put(`/products/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },

  search: async (query: string): Promise<Product[]> => {
    const response = await api.get(`/products/search/${query}`);
    return response.data;
  },
};

// Clients endpoints
export const clientsAPI = {
  getAll: async (): Promise<Client[]> => {
    const response = await api.get('/clients');
    return response.data;
  },

  getById: async (id: number): Promise<Client> => {
    const response = await api.get(`/clients/${id}`);
    return response.data;
  },

  getByDni: async (dni: string): Promise<Client> => {
    const response = await api.get(`/clients/dni/${dni}`);
    return response.data;
  },

  create: async (data: Partial<Client>): Promise<Client> => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  update: async (id: number, data: Partial<Client>): Promise<Client> => {
    const response = await api.put(`/clients/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/clients/${id}`);
  },

  search: async (query: string): Promise<Client[]> => {
    const response = await api.get(`/clients/search/${query}`);
    return response.data;
  },
};

// Sales endpoints
export const salesAPI = {
  getAll: async (): Promise<SaleWithDetails[]> => {
    const response = await api.get('/sales');
    return response.data;
  },

  getById: async (id: number): Promise<SaleWithDetails> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  create: async (data: {
    client_id?: number;
    unregistered_client_name?: string;
    items: Array<{
      product_id?: number;
      unregistered_product_name?: string;
      quantity: number;
      unit_price: number;
      od_esf?: number;
      od_cil?: number;
      od_eje?: number;
      od_add?: number;
      oi_esf?: number;
      oi_cil?: number;
      oi_eje?: number;
      oi_add?: number;
      notes?: string;
    }>;
    notes?: string;
  }): Promise<SaleWithDetails> => {
    const response = await api.post('/sales', data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },

  getByClient: async (clientId: number): Promise<SaleWithDetails[]> => {
    const response = await api.get(`/sales/client/${clientId}`);
    return response.data;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<SaleWithDetails[]> => {
    const response = await api.get(`/sales/date-range/${startDate}/${endDate}`);
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/sales/stats/summary');
    return response.data;
  },

  getTopProducts: async (): Promise<TopProduct[]> => {
    const response = await api.get('/sales/stats/top-products');
    return response.data;
  },
};

// Optic endpoints
export const opticAPI = {
  getInfo: async () => {
    const response = await api.get('/optics');
    return response.data;
  },

  updateInfo: async (data: {
    name: string;
    address: string;
    phone: string;
    email: string;
  }) => {
    const response = await api.put('/optics', data);
    return response.data;
  },

  getStats: async (): Promise<any> => {
    const response = await api.get('/optics/stats');
    return response.data;
  },

  getActivity: async (): Promise<ActivityItem[]> => {
    const response = await api.get('/optics/activity');
    return response.data;
  },

  getLowStock: async (): Promise<Product[]> => {
    const response = await api.get('/optics/low-stock');
    return response.data;
  },

  getRevenue: async (period: 'week' | 'month' | 'year' = 'week'): Promise<any[]> => {
    const response = await api.get(`/optics/revenue?period=${period}`);
    return response.data;
  },

  getOutOfStock: async (): Promise<Product[]> => {
    const response = await api.get('/optics/out-of-stock');
    return response.data;
  },
};

export default api; 