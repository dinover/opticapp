import axios from 'axios';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  Product,
  Client,
  SaleWithDetails,
  ActivityItem,
  TopProduct
} from '../types';

// Temporary hardcoded URL while debugging environment variable
const API_BASE_URL = 'https://opticapp-production.up.railway.app/api';

// Debug: Log the API URL to see what's being used
console.log('API_BASE_URL:', API_BASE_URL);
console.log('VITE_API_URL env var:', import.meta.env.VITE_API_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
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
    product_id?: number;
    quantity: number;
    total_price: number;
    sale_date: string;
    notes?: string;
    od_esf?: string;
    od_cil?: string;
    od_eje?: string;
    od_add?: string;
    oi_esf?: string;
    oi_cil?: string;
    oi_eje?: string;
    oi_add?: string;
  }): Promise<SaleWithDetails> => {
    const response = await api.post('/sales', data);
    return response.data;
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

  getOutOfStock: async (): Promise<Product[]> => {
    const response = await api.get('/optics/out-of-stock');
    return response.data;
  },
};

export default api; 