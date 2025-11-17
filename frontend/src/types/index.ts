export interface Optics {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  optics_id?: number | null;
  created_at?: string;
}

export interface Client {
  id: number;
  optics_id: number;
  name: string;
  document_id?: string;
  email?: string;
  phone?: string;
  address?: string;
  birth_date?: string;
  notes?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  optics_id: number;
  name: string;
  price?: number;
  quantity?: number;
  description?: string;
  image_url?: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface SaleProduct {
  id: number;
  sale_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
  product?: Product;
  product_name?: string;
  base_price?: number;
}

export interface SaleProductCreate {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface SaleCreate {
  client_id: number;
  sale_date?: string;
  od_esf?: number | null;
  od_cil?: number | null;
  od_eje?: number | null;
  od_add?: number | null;
  oi_esf?: number | null;
  oi_cil?: number | null;
  oi_eje?: number | null;
  oi_add?: number | null;
  notes?: string;
  products: SaleProductCreate[];
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalClients: number;
  totalProducts: number;
  monthSales: number;
  monthRevenue: number;
  topProducts: Array<{
    id: number;
    name: string;
    base_price: number;
    total_quantity_sold: number;
    total_revenue: number;
  }>;
  recentSales: Sale[];
}

export interface DashboardConfig {
  id: number;
  user_id: number;
  optics_id: number;
  sections_visible?: string;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: number;
  optics_id: number;
  client_id: number;
  user_id: number;
  sale_date: string;
  client_name?: string;
  user_name?: string;
  optics_name?: string;
  
  // OD (Ojo Derecho) - 4 campos
  od_esf?: number | null;
  od_cil?: number | null;
  od_eje?: number | null;
  od_add?: number | null;
  
  // OI (Ojo Izquierdo) - 4 campos
  oi_esf?: number | null;
  oi_cil?: number | null;
  oi_eje?: number | null;
  oi_add?: number | null;
  
  // Notas
  notes?: string;
  
  // Total
  total_price: number;
  
  // Productos
  products?: SaleProduct[];
  
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface UserRequest {
  id: number;
  username: string;
  email: string;
  optics_name: string;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  reviewed_at: string | null;
  reviewed_by: number | null;
  reviewer_username?: string | null;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserRequestCreate {
  username: string;
  email: string;
  password: string;
  optics_name: string;
}

