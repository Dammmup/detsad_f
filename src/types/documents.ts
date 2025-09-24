// ===== ТИПЫ ДЛЯ ДОКУМЕНТОВ =====

// Базовые типы
export type DocumentType = 'contract' | 'certificate' | 'report' | 'policy' | 'other';
export type DocumentCategory = 'staff' | 'children' | 'financial' | 'administrative' | 'other';
export type DocumentStatus = 'active' | 'archived';
export type TemplateType = 'contract' | 'certificate' | 'report' | 'policy' | 'other';
export type TemplateCategory = 'staff' | 'children' | 'financial' | 'administrative' | 'other';

// ===== ИНТЕРФЕЙСЫ =====

// Документ
export interface Document {
  id: string;
  _id?: string; // для совместимости с MongoDB
  title: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadDate: string; // ISODateString
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  status: DocumentStatus;
  tags: string[];
  version: string;
  expiryDate?: string; // ISODateString
  createdAt: string; // ISODateString
  updatedAt: string; // ISODateString
}

// Шаблон документа
export interface DocumentTemplate {
  id: string;
  _id?: string; // для совместимости с MongoDB
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
  createdAt: string; // ISODateString
  updatedAt: string; // ISODateString
}

// ===== ПАРАМЕТРЫ API =====

// Параметры для получения списка документов
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

// Параметры для получения списка шаблонов
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

// Параметры для создания документа
export interface CreateDocumentData {
  title: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  file: File;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  tags?: string[];
  expiryDate?: string; // ISODateString
}

// Параметры для создания шаблона
export interface CreateTemplateData {
  name: string;
  description?: string;
  type: TemplateType;
  category: TemplateCategory;
  file: File;
  tags?: string[];
}

// Параметры для обновления документа
export interface UpdateDocumentData {
  title?: string;
  description?: string;
  type?: DocumentType;
  category?: DocumentCategory;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  tags?: string[];
  expiryDate?: string; // ISODateString
  status?: DocumentStatus;
}

// Параметры для обновления шаблона
export interface UpdateTemplateData {
  name?: string;
  description?: string;
  type?: TemplateType;
  category?: TemplateCategory;
  isActive?: boolean;
  tags?: string[];
}

// Параметры для экспорта документов
export interface ExportDocumentsParams {
  format: 'pdf' | 'excel' | 'csv';
  type?: DocumentType;
  category?: DocumentCategory;
  status?: DocumentStatus;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  startDate?: string; // ISODateString
  endDate?: string; // ISODateString
  search?: string;
}

// Параметры для экспорта шаблонов
export interface ExportTemplatesParams {
  format: 'pdf' | 'excel' | 'csv';
  type?: TemplateType;
  category?: TemplateCategory;
  isActive?: boolean;
  search?: string;
}

// Параметры для отправки отчета по email
export interface SendReportByEmailParams {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  recipients: string[];
  subject?: string;
  message?: string;
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
}

// Параметры для планирования отчета
export interface ScheduleReportParams {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
  startDate?: string; // ISODateString
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ТИПЫ =====

// Результат экспорта
export interface ExportResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Результат отправки по email
export interface SendEmailResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// Результат планирования отчета
export interface ScheduleReportResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

// ===== УТИЛИТЫ =====

// Маппинг типов документов на русский текст
export const DOCUMENT_TYPE_TEXT: Record<DocumentType, string> = {
  contract: 'Договор',
  certificate: 'Справка',
  report: 'Отчет',
  policy: 'Политика',
  other: 'Другое'
};

// Маппинг категорий документов на русский текст
export const DOCUMENT_CATEGORY_TEXT: Record<DocumentCategory, string> = {
  staff: 'Сотрудники',
  children: 'Дети',
  financial: 'Финансы',
  administrative: 'Администрация',
  other: 'Другое'
};

// Маппинг статусов документов на русский текст
export const DOCUMENT_STATUS_TEXT: Record<DocumentStatus, string> = {
  active: 'Активен',
  archived: 'Архивирован'
};

// Маппинг типов шаблонов на русский текст
export const TEMPLATE_TYPE_TEXT: Record<TemplateType, string> = {
  contract: 'Договор',
  certificate: 'Справка',
  report: 'Отчет',
  policy: 'Политика',
  other: 'Другое'
};

// Маппинг категорий шаблонов на русский текст
export const TEMPLATE_CATEGORY_TEXT: Record<TemplateCategory, string> = {
  staff: 'Сотрудники',
  children: 'Дети',
  financial: 'Финансы',
  administrative: 'Администрация',
  other: 'Другое'
};