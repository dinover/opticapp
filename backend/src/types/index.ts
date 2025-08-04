export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  optic_id: number;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface Optic {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  optic_id: number;
  name: string;
  description?: string;
  brand: string;
  model: string;
  color: string;
  size: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  optic_id: number;
  dni: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  optic_id: number;
  client_id?: number;
  product_id?: number;
  quantity: number;
  total_price: number;
  sale_date: string;
  notes?: string;
  unregistered_client_name?: string;
  unregistered_product_name?: string;
  // Campos de prescripción óptica
  od_esf?: string;
  od_cil?: string;
  od_eje?: string;
  od_add?: string;
  oi_esf?: string;
  oi_cil?: string;
  oi_eje?: string;
  oi_add?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleWithDetails extends Sale {
  client: Client;
  product: Product;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  optic_name: string;
  optic_address: string;
  optic_phone: string;
  optic_email: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
  optic: Optic;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
} 