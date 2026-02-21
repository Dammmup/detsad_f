import { apiClient as api } from '../utils/api';

export interface AuditLogEntry {
  _id: string;
  userId: string;
  userFullName: string;
  userRole: string;
  action: 'create' | 'update' | 'delete' | 'generate' | 'import' | 'bulk_update' | 'status_change';
  entityType: string;
  entityId: string;
  entityName: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  details?: string;
  createdAt: string;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const API_BASE_URL = '/audit-log';

const auditLogApi = {
  getAll: async (params?: AuditLogFilters): Promise<AuditLogResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const url = searchParams.toString() ? `${API_BASE_URL}?${searchParams.toString()}` : API_BASE_URL;
    const response = await api.get(url);
    return response.data;
  },

  getByEntityType: async (entityType: string, params?: AuditLogFilters): Promise<AuditLogResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const url = searchParams.toString()
      ? `${API_BASE_URL}/entity/${entityType}?${searchParams.toString()}`
      : `${API_BASE_URL}/entity/${entityType}`;
    const response = await api.get(url);
    return response.data;
  },

  getByEntity: async (entityType: string, entityId: string, params?: AuditLogFilters): Promise<AuditLogResponse> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value));
        }
      });
    }
    const url = searchParams.toString()
      ? `${API_BASE_URL}/entity/${entityType}/${entityId}?${searchParams.toString()}`
      : `${API_BASE_URL}/entity/${entityType}/${entityId}`;
    const response = await api.get(url);
    return response.data;
  },
};

export default auditLogApi;
