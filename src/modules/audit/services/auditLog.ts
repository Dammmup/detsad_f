import apiClient from '../../../shared/utils/api';

export type AuditAction =
  | 'create'
  | 'update'
  | 'delete'
  | 'generate'
  | 'import'
  | 'bulk_update'
  | 'status_change'
  | string;

export interface AuditChange {
  field?: string;
  oldValue?: unknown;
  newValue?: unknown;
}

export interface AuditLogItem {
  _id: string;
  userId?: string;
  userFullName?: string;
  userRole?: string;
  action: AuditAction;
  entityType: string;
  entityId?: string;
  entityName?: string;
  changes?: AuditChange[];
  details?: string;
  createdAt: string;
}

export interface AuditLogFilters {
  entityType?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogResponse {
  items: AuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuditUserOption {
  userId: string;
  userFullName: string;
  userRole?: string;
}

export interface AuditLogMeta {
  entityTypes: string[];
  actions: string[];
  users: AuditUserOption[];
}

const compactParams = (params: AuditLogFilters) => {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
};

export const getAuditLogs = async (params: AuditLogFilters): Promise<AuditLogResponse> => {
  const response = await apiClient.get<AuditLogResponse>('/audit-log', {
    params: compactParams(params),
  });
  return response.data;
};

export const getAuditLogMeta = async (): Promise<AuditLogMeta> => {
  const response = await apiClient.get<AuditLogMeta>('/audit-log/meta');
  return response.data;
};
