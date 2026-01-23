import { apiClient } from '../../../shared/utils/api';


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


export interface GetDocumentsParams {
  type?: 'contract' | 'certificate' | 'report' | 'policy' | 'other';
  category?: 'staff' | 'children' | 'financial' | 'administrative' | 'other';
  status?: 'active' | 'archived';
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  search?: string;
  page?: number;
  limit?: number;
}


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

    const response = await apiClient.get(
      `/documents?${queryParams.toString()}`,
    );

    const documents = response.data;
    if (Array.isArray(documents)) {
      return documents.map((doc) => ({ ...doc, id: doc._id }));
    }
    return documents;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
};


export const getDocument = async (id: string) => {
  try {
    const response = await apiClient.get(`/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
};


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

    const response = await apiClient.post('/documents', formData, {
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


export const updateDocument = async (id: string, data: Partial<Document>) => {
  try {
    const response = await apiClient.put(`/documents/${id}`, data);
    return response.data;
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};


export const deleteDocument = async (id: string) => {
  try {
    const response = await apiClient.delete(`/documents/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};


export const downloadDocument = async (id: string) => {
  try {
    const response = await apiClient.get(`/documents/${id}/download`, {
      responseType: 'blob',
    });


    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      response.headers['content-disposition']?.split('filename=')[1] ||
      'document.pdf',
    );
    document.body.appendChild(link);
    link.click();


    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};


export const exportDocuments = async (
  format: | 'excel',
  params?: GetDocumentsParams,
) => {
  try {
    const response = await apiClient.post(
      '/documents/export',
      {
        format,
        ...params,
      },
      {
        responseType: 'blob',
      },
    );


    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `documents_export.${format === 'excel' ? 'xlsx' : format}`,
    );
    document.body.appendChild(link);
    link.click();


    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);

    return response.data;
  } catch (error) {
    console.error('Error exporting documents:', error);
    throw error;
  }
};
