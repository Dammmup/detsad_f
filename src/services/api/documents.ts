import { apiClient } from '../../utils/api';

// Типы для документов
export interface Document {
  id: string;
  title: string;
  description?: string;
  type: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadDate: string;
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  status: 'active' | 'archived';
  tags: string[];
  version: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Типы для шаблонов документов
export interface DocumentTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  fileName: string;
  fileSize: number;
  filePath: string;
  version: string;
  isActive: boolean;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

// Параметры для получения списка документов
export interface GetDocumentsParams {
  type?: string;
  category?: string;
  status?: string;
  relatedId?: string;
  relatedType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// Параметры для получения списка шаблонов
export interface GetTemplatesParams {
  type?: string;
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

// Создание документа
export interface CreateDocumentData {
  title: string;
  description?: string;
  type: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  file: File;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  tags?: string[];
  expiryDate?: string;
}

// Создание шаблона документа
export interface CreateTemplateData {
  name: string;
  description?: string;
  type: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  file: File;
  tags?: string[];
}

// ========== DOCUMENTS API ==========

// Получение списка документов
export const getDocuments = async (params?: GetDocumentsParams) => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
  const response = await apiClient.get(`/api/documents?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};

// Получение конкретного документа
export const getDocument = async (id: string) => {
  try {
  const response = await apiClient.get(`/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};

// Создание документа
export const createDocument = async (data: CreateDocumentData) => {
  try {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('title', data.title);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('category', data.category);
    if (data.relatedId) formData.append('relatedId', data.relatedId);
    if (data.relatedType) formData.append('relatedType', data.relatedType);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    if (data.expiryDate) formData.append('expiryDate', data.expiryDate);
    
  const response = await apiClient.post('/api/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating document:', error);
    throw error;
  }
};

// Обновление документа
export const updateDocument = async (id: string, data: Partial<Document>) => {
  try {
  const response = await apiClient.put(`/api/documents/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

// Удаление документа
export const deleteDocument = async (id: string) => {
  try {
  const response = await apiClient.delete(`/api/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

// Скачивание документа
export const downloadDocument = async (id: string) => {
  try {
  const response = await apiClient.get(`/api/documents/${id}/download`, {
      responseType: 'blob',
    });
    
    // Создание ссылки для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'document.pdf');
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};

// ========== TEMPLATES API ==========

// Получение списка шаблонов
export const getDocumentTemplates = async (params?: GetTemplatesParams) => {
  try {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    
  const response = await apiClient.get(`/api/documents/templates?${queryParams.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document templates:', error);
    throw error;
  }
};

// Получение конкретного шаблона
export const getDocumentTemplate = async (id: string) => {
  try {
  const response = await apiClient.get(`/api/documents/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document template:', error);
    throw error;
  }
};

// Создание шаблона документа
export const createDocumentTemplate = async (data: CreateTemplateData) => {
  try {
    const formData = new FormData();
    formData.append('file', data.file);
    formData.append('name', data.name);
    if (data.description) formData.append('description', data.description);
    formData.append('type', data.type);
    formData.append('category', data.category);
    if (data.tags) formData.append('tags', JSON.stringify(data.tags));
    
  const response = await apiClient.post('/api/documents/templates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating document template:', error);
    throw error;
  }
};

// Обновление шаблона документа
export const updateDocumentTemplate = async (id: string, data: Partial<DocumentTemplate>) => {
  try {
  const response = await apiClient.put(`/api/documents/templates/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating document template:', error);
    throw error;
  }
};

// Удаление шаблона документа
export const deleteDocumentTemplate = async (id: string) => {
  try {
  const response = await apiClient.delete(`/api/documents/templates/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document template:', error);
    throw error;
  }
};

// Скачивание шаблона документа
export const downloadDocumentTemplate = async (id: string) => {
  try {
  const response = await apiClient.get(`/api/documents/templates/${id}/download`, {
      responseType: 'blob',
    });
    
    // Создание ссылки для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', response.headers['content-disposition']?.split('filename=')[1] || 'template.pdf');
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error downloading document template:', error);
    throw error;
  }
};

// Экспорт документов
export const exportDocuments = async (format: 'pdf' | 'excel' | 'csv', params?: GetDocumentsParams) => {
  try {
  const response = await apiClient.post('/api/documents/export', {
      format,
      ...params
    }, {
      responseType: 'blob',
    });
    
    // Создание ссылки для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `documents_export.${format === 'excel' ? 'xlsx' : format}`);
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error exporting documents:', error);
    throw error;
  }
};

// Экспорт шаблонов
export const exportDocumentTemplates = async (format: 'pdf' | 'excel' | 'csv', params?: GetTemplatesParams) => {
  try {
  const response = await apiClient.post('/api/documents/templates/export', {
      format,
      ...params
    }, {
      responseType: 'blob',
    });
    
    // Создание ссылки для скачивания
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `templates_export.${format === 'excel' ? 'xlsx' : format}`);
    document.body.appendChild(link);
    link.click();
    
    // Очистка
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return response.data;
  } catch (error) {
    console.error('Error exporting document templates:', error);
    throw error;
  }
};

export default {
  // Documents
  getDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  downloadDocument,
  
  // Templates
  getDocumentTemplates,
  getDocumentTemplate,
  createDocumentTemplate,
  updateDocumentTemplate,
  deleteDocumentTemplate,
  downloadDocumentTemplate,
  
  // Export
  exportDocuments,
  exportDocumentTemplates
};