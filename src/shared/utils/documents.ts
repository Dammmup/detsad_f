

import {
  Document,
  DocumentTemplate,
  DocumentType,
  DocumentCategory,
  DocumentStatus,
  TemplateType,
  TemplateCategory,
} from '../types/documents';
import { formatFileSize, formatDate, formatDateWithWeekday, getAlmatyDate } from './format';




export interface DocumentFilters {
  type?: string;
  category?: string;
  status?: string;
  relatedId?: string;
  relatedType?: 'staff' | 'child' | 'group';
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}


export interface TemplateFilters {
  type?: string;
  category?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}





export const getDocumentTypeIcon = (type: DocumentType): string => {
  switch (type) {
    case 'contract':
      return '📋';
    case 'certificate':
      return '📜';
    case 'report':
      return '📊';
    case 'policy':
      return '📖';
    case 'other':
      return '📄';
    default:
      return '📄';
  }
};


export const getDocumentTypeText = (type: DocumentType): string => {
  switch (type) {
    case 'contract':
      return 'Договор';
    case 'certificate':
      return 'Справка';
    case 'report':
      return 'Отчет';
    case 'policy':
      return 'Политика';
    case 'other':
      return 'Другое';
    default:
      return type;
  }
};


export const getDocumentCategoryText = (category: DocumentCategory): string => {
  switch (category) {
    case 'staff':
      return 'Сотрудники';
    case 'children':
      return 'Дети';
    case 'financial':
      return 'Финансы';
    case 'administrative':
      return 'Администрация';
    case 'other':
      return 'Другое';
    default:
      return category;
  }
};


export const getDocumentStatusText = (status: DocumentStatus): string => {
  switch (status) {
    case 'active':
      return 'Активен';
    case 'archived':
      return 'Архивирован';
    default:
      return status;
  }
};


export const getDocumentStatusColor = (
  status: DocumentStatus,
): 'success' | 'warning' | 'default' | 'error' => {
  switch (status) {
    case 'active':
      return 'success';
    case 'archived':
      return 'default';
    default:
      return 'default';
  }
};




export const getTemplateTypeText = (type: TemplateType): string => {
  switch (type) {
    case 'contract':
      return 'Договор';
    case 'certificate':
      return 'Справка';
    case 'report':
      return 'Отчет';
    case 'policy':
      return 'Политика';
    case 'other':
      return 'Другое';
    default:
      return type;
  }
};


export const getTemplateCategoryText = (category: TemplateCategory): string => {
  switch (category) {
    case 'staff':
      return 'Сотрудники';
    case 'children':
      return 'Дети';
    case 'financial':
      return 'Финансы';
    case 'administrative':
      return 'Администрация';
    case 'other':
      return 'Другое';
    default:
      return category;
  }
};


export const getTemplateActiveColor = (
  isActive: boolean,
): 'success' | 'default' | 'error' => {
  return isActive ? 'success' : 'default';
};




export const filterDocuments = (
  documents: Document[],
  filters: DocumentFilters,
): Document[] => {
  let filtered = [...documents];


  if (filters.type) {
    filtered = filtered.filter((doc) => doc.type === filters.type);
  }


  if (filters.category) {
    filtered = filtered.filter((doc) => doc.category === filters.category);
  }


  if (filters.status) {
    filtered = filtered.filter((doc) => doc.status === filters.status);
  }


  if (filters.relatedId && filters.relatedType) {
    filtered = filtered.filter(
      (doc) =>
        doc.relatedId === filters.relatedId &&
        doc.relatedType === filters.relatedType,
    );
  }


  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (doc) =>
        doc.title.toLowerCase().includes(searchLower) ||
        (doc.description &&
          doc.description.toLowerCase().includes(searchLower)) ||
        doc.fileName.toLowerCase().includes(searchLower) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }


  if (filters.sort) {
    filtered.sort((a, b) => {
      let aValue: any = (a as any)[filters.sort as keyof Document];
      let bValue: any = (b as any)[filters.sort as keyof Document];


      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();


      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (filters.order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  return filtered;
};


export const filterTemplates = (
  templates: DocumentTemplate[],
  filters: TemplateFilters,
): DocumentTemplate[] => {
  let filtered = [...templates];


  if (filters.type) {
    filtered = filtered.filter((template) => template.type === filters.type);
  }


  if (filters.category) {
    filtered = filtered.filter(
      (template) => template.category === filters.category,
    );
  }


  if (filters.isActive !== undefined) {
    filtered = filtered.filter(
      (template) => template.isActive === filters.isActive,
    );
  }


  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (template) =>
        template.name.toLowerCase().includes(searchLower) ||
        (template.description &&
          template.description.toLowerCase().includes(searchLower)) ||
        template.fileName.toLowerCase().includes(searchLower) ||
        template.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
    );
  }


  if (filters.sort) {
    filtered.sort((a, b) => {
      let aValue: any = (a as any)[filters.sort as keyof DocumentTemplate];
      let bValue: any = (b as any)[filters.sort as keyof DocumentTemplate];


      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();


      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();

      if (filters.order === 'desc') {
        return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });
  }

  return filtered;
};




export const paginateArray = <T>(
  array: T[],
  page: number,
  limit: number,
): T[] => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return array.slice(startIndex, endIndex);
};




export const validateDocument = (
  document: Partial<Document>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];


  if (!document.title) {
    errors.push('Поле "title" обязательно');
  }

  if (!document.type) {
    errors.push('Поле "type" обязательно');
  } else if (
    !['contract', 'certificate', 'report', 'policy', 'other'].includes(
      document.type,
    )
  ) {
    errors.push('Недопустимый тип документа');
  }

  if (!document.category) {
    errors.push('Поле "category" обязательно');
  } else if (
    !['staff', 'children', 'financial', 'administrative', 'other'].includes(
      document.category,
    )
  ) {
    errors.push('Недопустимая категория документа');
  }

  if (!document.fileName) {
    errors.push('Поле "fileName" обязательно');
  }

  if (document.fileSize === undefined || document.fileSize === null) {
    errors.push('Поле "fileSize" обязательно');
  } else if (document.fileSize < 0) {
    errors.push('Размер файла не может быть отрицательным');
  }

  if (!document.filePath) {
    errors.push('Поле "filePath" обязательно');
  }

  if (!document.uploader) {
    errors.push('Поле "uploader" обязательно');
  }

  if (!document.status) {
    errors.push('Поле "status" обязательно');
  } else if (!['active', 'archived'].includes(document.status)) {
    errors.push('Недопустимый статус документа');
  }


  if (document.expiryDate) {
    const expiryDate = new Date(document.expiryDate);
    const uploadDate = document.uploadDate
      ? new Date(document.uploadDate)
      : getAlmatyDate();

    if (expiryDate < uploadDate) {
      errors.push('Дата истечения срока должна быть позже даты загрузки');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};


export const validateDocumentTemplate = (
  template: Partial<DocumentTemplate>,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];


  if (!template.name) {
    errors.push('Поле "name" обязательно');
  }

  if (!template.type) {
    errors.push('Поле "type" обязательно');
  } else if (
    !['contract', 'certificate', 'report', 'policy', 'other'].includes(
      template.type,
    )
  ) {
    errors.push('Недопустимый тип шаблона');
  }

  if (!template.category) {
    errors.push('Поле "category" обязательно');
  } else if (
    !['staff', 'children', 'financial', 'administrative', 'other'].includes(
      template.category,
    )
  ) {
    errors.push('Недопустимая категория шаблона');
  }

  if (!template.fileName) {
    errors.push('Поле "fileName" обязательно');
  }

  if (template.fileSize === undefined || template.fileSize === null) {
    errors.push('Поле "fileSize" обязательно');
  } else if (template.fileSize < 0) {
    errors.push('Размер файла не может быть отрицательным');
  }

  if (!template.filePath) {
    errors.push('Поле "filePath" обязательно');
  }

  if (!template.version) {
    errors.push('Поле "version" обязательно');
  }

  if (template.isActive === undefined || template.isActive === null) {
    errors.push('Поле "isActive" обязательно');
  }


  if (template.version) {
    const versionRegex = /^\d+\.\d+$/;
    if (!versionRegex.test(template.version)) {
      errors.push('Недопустимый формат версии (должен быть в формате X.Y)');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};




export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};


export const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    txt: 'text/plain',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
  };

  return mimeTypes[extension] || 'application/octet-stream';
};


