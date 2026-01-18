import { apiClient } from '../../../shared/utils/api';

export interface GenerateDocumentParams {
  template: string;
  userId?: string;
  date: string;
  extra?: Record<string, any>;
  format?: 'docx' | 'xlsx' | 'pdf';
  entries?: Array<any>;
  filename?: string;
}

export const generateAndDownloadDocument = async (
  params: GenerateDocumentParams,
) => {
  const response = await apiClient.post('/documents/generate', params, {
    responseType: 'blob',
  });
  const format = params.format || 'docx';
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', params.filename || `document.${format}`);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
};
