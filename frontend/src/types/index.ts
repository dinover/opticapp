export interface User {
  id: number;
  username: string;
  email: string;
  optic_id: number;
  role: 'admin' | 'user';
  is_approved: boolean;
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
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  price: number;
  stock_quantity: number;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  optic_id: number;
  first_name: string;
  last_name: string;
  dni: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Nuevos tipos para el sistema de ventas mejorado
export interface SaleItem {
  id: number;
  sale_id: number;
  product_id?: number;
  unregistered_product_name?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  od_esf?: number; // Ojo derecho - Esfera
  od_cil?: number; // Ojo derecho - Cilindro
  od_eje?: number; // Ojo derecho - Eje
  od_add?: number; // Ojo derecho - Adición
  oi_esf?: number; // Ojo izquierdo - Esfera
  oi_cil?: number; // Ojo izquierdo - Cilindro
  oi_eje?: number; // Ojo izquierdo - Eje
  oi_add?: number; // Ojo izquierdo - Adición
  notes?: string;
  created_at: string;
  // Campos del producto (vienen del JOIN)
  product_name?: string;
  product_price?: number;
  brand?: string;
  model?: string;
  color?: string;
}

export interface Sale {
  id: number;
  optic_id: number;
  client_id?: number;
  product_id?: number;
  quantity?: number;
  total_amount: string;
  sale_date: string;
  notes?: string;
  unregistered_client_name?: string;
  unregistered_product_name?: string;
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
  // Campos del cliente (vienen del JOIN)
  first_name?: string;
  last_name?: string;
}

export interface SaleWithDetails extends Sale {
  client?: Client;
  items: SaleItem[];
}

export interface CartItem {
  product?: Product;
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
  username: string;
  email: string;
  optic_name: string;
  optic_address: string;
  optic_phone: string;
  optic_email: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ApproveRegistrationRequest {
  requestId: number;
  approved: boolean;
  notes?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  optic: Optic;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface OpticStats {
  total_products: number;
  total_clients: number;
  total_sales: number;
  total_revenue: number;
}

export interface ActivityItem {
  id: number;
  type: 'sale' | 'client' | 'product';
  description: string;
  client_name: string;
  amount?: number;
  created_at: string;
}

export interface TopProduct {
  name: string;
  brand: string;
  model: string;
  total_sold: number;
  total_revenue: number;
  sale_count: number;
} 