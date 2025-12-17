


export type DocumentType =
  | 'contract'
  | 'certificate'
  | 'report'
  | 'policy'
  | 'other';
export type DocumentCategory =
  | 'staff'
  | 'children'
  | 'financial'
  | 'administrative'
  | 'other';
export type DocumentStatus = 'active' | 'archived';
export type TemplateType =
  | 'contract'
  | 'certificate'
  | 'report'
  | 'policy'
  | 'other';
export type TemplateCategory =
  | 'staff'
  | 'children'
  | 'financial'
  | 'administrative'
  | 'other';




export interface Document {
  id?: string;
  _id?: string;
  title: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadDate?: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  status: DocumentStatus;
  tags: string[];
  version: string;
  expiryDate?: string;
  createdAt?: string;
  updatedAt?: string;
}


export interface DocumentTemplate {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  type: TemplateType;
  category: TemplateCategory;
  fileName: string;
  fileSize: number;
  filePath: string;
  version: string;
  isActive: boolean;
  tags: string[];
  usageCount: number;
  createdAt?: string;
  updatedAt?: string;
}




export interface GetDocumentsParams {
  type?: DocumentType;
  category?: DocumentCategory;
  status?: DocumentStatus;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}


export interface GetTemplatesParams {
  type?: TemplateType;
  category?: TemplateCategory;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}


export interface CreateDocumentData {
  title: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  file: File;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  tags?: string[];
  expiryDate?: string;
}


export interface CreateTemplateData {
  name: string;
  description?: string;
  type: TemplateType;
  category: TemplateCategory;
  file: File;
  tags?: string[];
}


export interface UpdateDocumentData {
  title?: string;
  description?: string;
  type?: DocumentType;
  category?: DocumentCategory;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  tags?: string[];
  expiryDate?: string;
  status?: DocumentStatus;
}


export interface UpdateTemplateData {
  name?: string;
  description?: string;
  type?: TemplateType;
  category?: TemplateCategory;
  isActive?: boolean;
  tags?: string[];
}


export interface ExportDocumentsParams {
  format: 'pdf' | 'excel' | 'csv';
  type?: DocumentType;
  category?: DocumentCategory;
  status?: DocumentStatus;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  startDate?: string;
  endDate?: string;
  search?: string;
}


export interface ExportTemplatesParams {
  format: 'pdf' | 'excel' | 'csv';
  type?: TemplateType;
  category?: TemplateCategory;
  isActive?: boolean;
  search?: string;
}


export interface SendReportByEmailParams {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  recipients: string[];
  subject?: string;
  message?: string;
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
}


export interface ScheduleReportParams {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
  startDate?: string;
}




export interface ExportResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}


export interface SendEmailResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}


export interface ScheduleReportResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}




export const DOCUMENT_TYPE_TEXT: Record<DocumentType, string> = {
  contract: 'Договор',
  certificate: 'Справка',
  report: 'Отчет',
  policy: 'Политика',
  other: 'Другое',
};


export const DOCUMENT_CATEGORY_TEXT: Record<DocumentCategory, string> = {
  staff: 'Сотрудники',
  children: 'Дети',
  financial: 'Финансы',
  administrative: 'Администрация',
  other: 'Другое',
};


export const DOCUMENT_STATUS_TEXT: Record<DocumentStatus, string> = {
  active: 'Активен',
  archived: 'Архивирован',
};


export const TEMPLATE_TYPE_TEXT: Record<TemplateType, string> = {
  contract: 'Договор',
  certificate: 'Справка',
  report: 'Отчет',
  policy: 'Политика',
  other: 'Другое',
};


export const TEMPLATE_CATEGORY_TEXT: Record<TemplateCategory, string> = {
  staff: 'Сотрудники',
  children: 'Дети',
  financial: 'Финансы',
  administrative: 'Администрация',
  other: 'Другое',
};
