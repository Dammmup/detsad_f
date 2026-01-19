import { apiClient } from './api';

export const exportData = async (
  endpoint: string,
  format: 'excel',
  filters?: any,
) => {
  try {
    const response = await apiClient.post(
      `/export/${endpoint}`,
      { format, filters },
      { responseType: 'blob' },
    );
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${endpoint}.${format}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (e: any) {
    console.error(`Error exporting ${endpoint}:`, e);
    alert(e?.message || 'Ошибка экспорта');
  }
};
