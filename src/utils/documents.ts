// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ДОКУМЕНТАМИ =====

import { 
  Document, 
  DocumentTemplate, 
  DocumentType, 
  DocumentCategory, 
  DocumentStatus,
  TemplateType,
  TemplateCategory
} from '../types/documents';

// ===== ТИПЫ И ИНТЕРФЕЙСЫ =====

// Интерфейс для фильтров документов
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

// Интерфейс для фильтров шаблонов
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

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ДОКУМЕНТАМИ =====

// Форматирование размера файла
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Форматирование даты
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Форматирование даты с днем недели
export const formatDateWithWeekday = (dateString: string): string => {
  const date = new Date(dateString);
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const weekday = weekdays[date.getDay()];
  const formattedDate = formatDate(dateString);
  return `${formattedDate} (${weekday})`;
};

// Получение иконки для типа документа
export const getDocumentTypeIcon = (type: DocumentType): string => {
  switch (type) {
    case 'contract': return '📋';
    case 'certificate': return '📜';
    case 'report': return '📊';
    case 'policy': return '📖';
    case 'other': return '📄';
    default: return '📄';
  }
};

// Получение текста для типа документа
export const getDocumentTypeText = (type: DocumentType): string => {
  switch (type) {
    case 'contract': return 'Договор';
    case 'certificate': return 'Справка';
    case 'report': return 'Отчет';
    case 'policy': return 'Политика';
    case 'other': return 'Другое';
    default: return type;
  }
};

// Получение текста для категории документа
export const getDocumentCategoryText = (category: DocumentCategory): string => {
  switch (category) {
    case 'staff': return 'Сотрудники';
    case 'children': return 'Дети';
    case 'financial': return 'Финансы';
    case 'administrative': return 'Администрация';
    case 'other': return 'Другое';
    default: return category;
  }
};

// Получение текста для статуса документа
export const getDocumentStatusText = (status: DocumentStatus): string => {
  switch (status) {
    case 'active': return 'Активен';
    case 'archived': return 'Архивирован';
    default: return status;
  }
};

// Получение цвета для статуса документа
export const getDocumentStatusColor = (status: DocumentStatus): 'success' | 'warning' | 'default' | 'error' => {
  switch (status) {
    case 'active': return 'success';
    case 'archived': return 'default';
    default: return 'default';
  }
};

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ШАБЛОНАМИ =====

// Получение текста для типа шаблона
export const getTemplateTypeText = (type: TemplateType): string => {
  switch (type) {
    case 'contract': return 'Договор';
    case 'certificate': return 'Справка';
    case 'report': return 'Отчет';
    case 'policy': return 'Политика';
    case 'other': return 'Другое';
    default: return type;
  }
};

// Получение текста для категории шаблона
export const getTemplateCategoryText = (category: TemplateCategory): string => {
  switch (category) {
    case 'staff': return 'Сотрудники';
    case 'children': return 'Дети';
    case 'financial': return 'Финансы';
    case 'administrative': return 'Администрация';
    case 'other': return 'Другое';
    default: return category;
  }
};

// Получение цвета для активности шаблона
export const getTemplateActiveColor = (isActive: boolean): 'success' | 'default' | 'error' => {
  return isActive ? 'success' : 'default';
};

// ===== ФИЛЬТРАЦИЯ И СОРТИРОВКА =====

// Фильтрация документов
export const filterDocuments = (documents: Document[], filters: DocumentFilters): Document[] => {
  let filtered = [...documents];
  
  // Фильтр по типу
  if (filters.type) {
    filtered = filtered.filter(doc => doc.type === filters.type);
  }
  
  // Фильтр по категории
  if (filters.category) {
    filtered = filtered.filter(doc => doc.category === filters.category);
  }
  
  // Фильтр по статусу
  if (filters.status) {
    filtered = filtered.filter(doc => doc.status === filters.status);
  }
  
  // Фильтр по связанному объекту
  if (filters.relatedId && filters.relatedType) {
    filtered = filtered.filter(doc =>
      doc.relatedId === filters.relatedId && doc.relatedType === filters.relatedType
    );
  }
  
  // Поиск по тексту
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(doc =>
      doc.title.toLowerCase().includes(searchLower) ||
      (doc.description && doc.description.toLowerCase().includes(searchLower)) ||
      doc.fileName.toLowerCase().includes(searchLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Сортировка
  if (filters.sort) {
    filtered.sort((a, b) => {
      let aValue: any = (a as any)[filters.sort as keyof Document];
      let bValue: any = (b as any)[filters.sort as keyof Document];
      
      // Преобразование дат в числа для сравнения
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      // Преобразование строк в нижний регистр для сравнения
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

// Фильтрация шаблонов
export const filterTemplates = (templates: DocumentTemplate[], filters: TemplateFilters): DocumentTemplate[] => {
  let filtered = [...templates];
  
  // Фильтр по типу
  if (filters.type) {
    filtered = filtered.filter(template => template.type === filters.type);
  }
  
  // Фильтр по категории
  if (filters.category) {
    filtered = filtered.filter(template => template.category === filters.category);
  }
  
  // Фильтр по активности
  if (filters.isActive !== undefined) {
    filtered = filtered.filter(template => template.isActive === filters.isActive);
  }
  
  // Поиск по тексту
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(template =>
      template.name.toLowerCase().includes(searchLower) ||
      (template.description && template.description.toLowerCase().includes(searchLower)) ||
      template.fileName.toLowerCase().includes(searchLower) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  // Сортировка
  if (filters.sort) {
    filtered.sort((a, b) => {
      let aValue: any = (a as any)[filters.sort as keyof DocumentTemplate];
      let bValue: any = (b as any)[filters.sort as keyof DocumentTemplate];
      
      // Преобразование дат в числа для сравнения
      if (aValue instanceof Date) aValue = aValue.getTime();
      if (bValue instanceof Date) bValue = bValue.getTime();
      
      // Преобразование строк в нижний регистр для сравнения
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

// ===== ПАГИНАЦИЯ =====

// Пагинация массива
export const paginateArray = <T>(array: T[], page: number, limit: number): T[] => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return array.slice(startIndex, endIndex);
};

// ===== ВАЛИДАЦИЯ =====

// Валидация данных документа
export const validateDocument = (document: Partial<Document>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Проверка обязательных полей
  if (!document.title) {
    errors.push('Поле "title" обязательно');
  }
  
  if (!document.type) {
    errors.push('Поле "type" обязательно');
  } else if (!['contract', 'certificate', 'report', 'policy', 'other'].includes(document.type)) {
    errors.push('Недопустимый тип документа');
  }
  
  if (!document.category) {
    errors.push('Поле "category" обязательно');
  } else if (!['staff', 'children', 'financial', 'administrative', 'other'].includes(document.category)) {
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
  
  // Проверка даты истечения срока
  if (document.expiryDate) {
    const expiryDate = new Date(document.expiryDate);
    const uploadDate = document.uploadDate ? new Date(document.uploadDate) : new Date();
    
    if (expiryDate < uploadDate) {
      errors.push('Дата истечения срока должна быть позже даты загрузки');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Валидация данных шаблона документа
export const validateDocumentTemplate = (template: Partial<DocumentTemplate>): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Проверка обязательных полей
  if (!template.name) {
    errors.push('Поле "name" обязательно');
  }
  
  if (!template.type) {
    errors.push('Поле "type" обязательно');
  } else if (!['contract', 'certificate', 'report', 'policy', 'other'].includes(template.type)) {
    errors.push('Недопустимый тип шаблона');
  }
  
  if (!template.category) {
    errors.push('Поле "category" обязательно');
  } else if (!['staff', 'children', 'financial', 'administrative', 'other'].includes(template.category)) {
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
  
  // Проверка версии
  if (template.version) {
    const versionRegex = /^\d+\.\d+$/;
    if (!versionRegex.test(template.version)) {
      errors.push('Недопустимый формат версии (должен быть в формате X.Y)');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ФАЙЛАМИ =====

// Получение расширения файла
export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

// Получение MIME-типа по расширению файла
export const getMimeType = (extension: string): string => {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'csv': 'text/csv',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

// ===== ЭКСПОРТ =====

