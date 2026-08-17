import api from './api';

export interface SalesPeriod {
  label: string;
  salesCount: number;
  revenue: number;
}

export interface SalesReport {
  groupBy: 'day' | 'week' | 'month';
  periods: SalesPeriod[];
  totalRevenue: number;
  totalSales: number;
  avgTicket: number;
}

export interface TopProduct {
  rank: number;
  id: number;
  name: string;
  supplierName: string;
  quantitySold: number;
  revenue: number;
  revenueShare: number;
}

export interface TopProductsReport {
  totalRevenue: number;
  products: TopProduct[];
}

async function downloadBlob(url: string, fallbackFilename: string): Promise<void> {
  const response = await api.get(url, { responseType: 'blob' });

  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = blobUrl;

  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  link.download = match ? match[1] : fallbackFilename;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
}

export const reportsService = {
  async downloadProducts(supplierId?: string): Promise<void> {
    const params = supplierId ? `?supplier_id=${supplierId}` : '?supplier_id=all';
    await downloadBlob(`/reports/products${params}`, 'armazones.xlsx');
  },

  async getSales(from: string, to: string, groupBy: 'day' | 'week' | 'month'): Promise<SalesReport> {
    const params = new URLSearchParams({ from, to, group_by: groupBy });
    const response = await api.get(`/reports/sales?${params}`);
    return response.data;
  },

  async downloadSales(from: string, to: string, groupBy: 'day' | 'week' | 'month'): Promise<void> {
    const params = new URLSearchParams({ from, to, group_by: groupBy, format: 'xlsx' });
    await downloadBlob(`/reports/sales?${params}`, 'ventas.xlsx');
  },

  async getTopProducts(from: string, to: string): Promise<TopProductsReport> {
    const params = new URLSearchParams({ from, to });
    const response = await api.get(`/reports/top-products?${params}`);
    return response.data;
  },

  async downloadTopProducts(from: string, to: string): Promise<void> {
    const params = new URLSearchParams({ from, to, format: 'xlsx' });
    await downloadBlob(`/reports/top-products?${params}`, 'ranking_productos.xlsx');
  },
};
