export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  optic_id: number;
  role: 'admin' | 'user';
  is_approved: boolean;
  reset_token?: string;
  reset_token_expiry?: string;
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
  total_amount: number;
  sale_date: string;
  notes?: string;
  unregistered_client_name?: string;
  created_at: string;
  updated_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id?: number;
  unregistered_product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  od_esf?: number;
  od_cil?: number;
  od_eje?: number;
  od_add?: number;
  oi_esf?: number;
  oi_cil?: number;
  oi_eje?: number;
  oi_add?: number;
  notes?: string;
  created_at: string;
}

export interface SaleWithDetails extends Sale {
  client?: Client;
  items: SaleItem[];
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

export interface RegistrationRequest {
  id: number;
  user_id: number;
  optic_id: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
  user?: User;
  optic?: Optic;
}

export interface ApproveRegistrationRequest {
  requestId: number;
  status: 'approved' | 'rejected';
  admin_notes?: string;
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