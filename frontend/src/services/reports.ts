import api from './api';

export const reportsService = {
  async downloadProducts(supplierId?: string): Promise<void> {
    const params = supplierId ? `?supplier_id=${supplierId}` : '?supplier_id=all';
    const response = await api.get(`/reports/products${params}`, { responseType: 'blob' });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;

    const disposition = response.headers['content-disposition'] || '';
    const match = disposition.match(/filename="?([^"]+)"?/);
    link.download = match ? match[1] : 'armazones.xlsx';

    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
