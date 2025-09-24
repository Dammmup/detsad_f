// ===== УТИЛИТЫ ДЛЯ ЭКСПОРТА ДОКУМЕНТОВ =====

import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import {
  Document,
  DocumentTemplate,
  ExportDocumentsParams,
  ExportTemplatesParams
} from '../types/documents';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// Интерфейс для конфигурации экспорта
export interface ExportConfig {
  filename: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  includeDate?: boolean;
  includeWeekdays?: boolean;
  dateColumn?: number; // Индекс колонки с датами для добавления дней недели
}

// Утилиты для работы с датами
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const getWeekday = (date: Date): string => {
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return weekdays[date.getDay()];
};

export const formatDateWithWeekday = (dateString: string): string => {
  const date = new Date(dateString);
  const formattedDate = formatDate(date);
  const weekday = getWeekday(date);
  return `${formattedDate} (${weekday})`;
};

// Основная функция экспорта
export const exportToExcel = (config: ExportConfig): void => {
  const {
    filename,
    sheetName,
    title,
    subtitle,
    headers,
    data,
    includeDate = true,
    includeWeekdays = false,
    dateColumn
  } = config;

  // Создаем новую книгу
  const workbook = XLSX.utils.book_new();
  
  // Подготавливаем данные для листа
  const worksheetData: any[][] = [];
  
  // Добавляем заголовок документа
  if (includeDate) {
    const currentDate = formatDate(new Date());
    worksheetData.push([`${title} - ${currentDate}`]);
    worksheetData.push([]); // Пустая строка
  } else {
    worksheetData.push([title]);
    worksheetData.push([]); // Пустая строка
  }
  
  // Добавляем подзаголовок если есть
  if (subtitle) {
    worksheetData.push([subtitle]);
    worksheetData.push([]); // Пустая строка
  }
  
  // Добавляем заголовки колонок
  worksheetData.push(headers);
  
  // Обрабатываем данные
  const processedData = data.map(row => {
    if (includeWeekdays && dateColumn !== undefined && row[dateColumn]) {
      const newRow = [...row];
      newRow[dateColumn] = formatDateWithWeekday(row[dateColumn]);
      return newRow;
    }
    return row;
  });
  
  // Добавляем данные
  worksheetData.push(...processedData);
  
  // Добавляем информацию о формировании документа
  worksheetData.push([]);
  worksheetData.push([`Документ сформирован: ${formatDate(new Date())} в ${new Date().toLocaleTimeString('ru-RU')}`]);
  
  // Создаем лист
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Настраиваем ширину колонок
  const columnWidths = headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...processedData.map(row => String(row[index] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  
  worksheet['!cols'] = columnWidths;
  
  // Добавляем лист в книгу
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Генерируем файл и скачиваем
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const timestamp = new Date().toISOString().slice(0, 10);
  const fullFilename = `${filename}_${timestamp}.xlsx`;
  
  saveAs(blob, fullFilename);
};

// Специализированные функции экспорта для каждого раздела

// 1. Экспорт списка документов
export const exportDocumentsList = async (documents: Document[], params?: ExportDocumentsParams): Promise<void> => {
  const headers = [
    'Название документа',
    'Тип',
    'Категория',
    'Файл',
    'Размер файла',
    'Дата загрузки',
    'Загрузчик',
    'Связанный объект',
    'Статус',
    'Теги',
    'Версия',
    'Срок действия'
  ];
  
  const data = documents.map(doc => [
    doc.title || '',
    doc.type || '',
    doc.category || '',
    doc.fileName || '',
    doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : '',
    doc.uploadDate ? formatDate(new Date(doc.uploadDate)) : '',
    doc.uploader?.fullName || '',
    doc.relatedId ? `${doc.relatedType}: ${doc.relatedId}` : '',
    doc.status || '',
    doc.tags?.join(', ') || '',
    doc.version || '',
    doc.expiryDate ? formatDate(new Date(doc.expiryDate)) : ''
  ]);
  
  const config: ExportConfig = {
    filename: params?.type ? `Список_документов_${params.type}` : 'Список_документов',
    sheetName: 'Документы',
    title: params?.type ? `Список документов типа "${params.type}"` : 'Список документов',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 2. Экспорт списка шаблонов документов
export const exportDocumentTemplatesList = async (templates: DocumentTemplate[], params?: ExportTemplatesParams): Promise<void> => {
  const headers = [
    'Название шаблона',
    'Тип',
    'Категория',
    'Файл',
    'Размер файла',
    'Версия',
    'Активен',
    'Теги',
    'Использован раз',
    'Дата создания',
    'Дата обновления'
  ];
  
  const data = templates.map(template => [
    template.name || '',
    template.type || '',
    template.category || '',
    template.fileName || '',
    template.fileSize ? `${(template.fileSize / 1024).toFixed(2)} KB` : '',
    template.version || '',
    template.isActive ? 'Да' : 'Нет',
    template.tags?.join(', ') || '',
    template.usageCount || 0,
    template.createdAt ? formatDate(new Date(template.createdAt)) : '',
    template.updatedAt ? formatDate(new Date(template.updatedAt)) : ''
  ]);
  
  const config: ExportConfig = {
    filename: params?.type ? `Список_шаблонов_${params.type}` : 'Список_шаблонов',
    sheetName: 'Шаблоны',
    title: params?.type ? `Список шаблонов типа "${params.type}"` : 'Список шаблонов',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 3. Экспорт документов сотрудников
export const exportStaffDocuments = async (documents: Document[], params?: ExportDocumentsParams): Promise<void> => {
  const headers = [
    'ФИО сотрудника',
    'Должность',
    'Название документа',
    'Тип',
    'Категория',
    'Файл',
    'Размер файла',
    'Дата загрузки',
    'Статус',
    'Теги',
    'Срок действия'
  ];
  
  const data = documents.map(doc => [
    doc.uploader?.fullName || '',
    '', // Удаляем поле role, так как его нет в типе
    doc.title || '',
    doc.type || '',
    doc.category || '',
    doc.fileName || '',
    doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : '',
    doc.uploadDate ? formatDate(new Date(doc.uploadDate)) : '',
    doc.status || '',
    doc.tags?.join(', ') || '',
    doc.expiryDate ? formatDate(new Date(doc.expiryDate)) : ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Документы_сотрудников',
    sheetName: 'Документы сотрудников',
    title: 'Документы сотрудников',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 4. Экспорт документов детей
export const exportChildrenDocuments = async (documents: Document[], params?: ExportDocumentsParams): Promise<void> => {
  const headers = [
    'ФИО ребенка',
    'Группа',
    'Возраст',
    'Название документа',
    'Тип',
    'Категория',
    'Файл',
    'Размер файла',
    'Дата загрузки',
    'Статус',
    'Теги',
    'Срок действия'
  ];
  
  const data = documents.map(doc => [
    doc.relatedId || '',
    doc.relatedType || '',
    '', // Возраст будет добавлен позже
    doc.title || '',
    doc.type || '',
    doc.category || '',
    doc.fileName || '',
    doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : '',
    doc.uploadDate ? formatDate(new Date(doc.uploadDate)) : '',
    doc.status || '',
    doc.tags?.join(', ') || '',
    doc.expiryDate ? formatDate(new Date(doc.expiryDate)) : ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Документы_детей',
    sheetName: 'Документы детей',
    title: 'Документы детей',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 5. Экспорт отчетов по зарплатам
export const exportSalaryReports = async (reports: any[], params?: ExportDocumentsParams): Promise<void> => {
  const headers = [
    'ФИО сотрудника',
    'Должность',
    'Начисления',
    'Премии',
    'Штрафы',
    'Итого к выплате',
    'Период',
    'Статус',
    'Дата формирования'
  ];
  
  const data = reports.map(report => [
    report.staffName || '',
    report.position || '',
    report.accruals ? `${report.accruals} тг` : '0 тг',
    report.bonuses ? `${report.bonuses} тг` : '0 тг',
    report.penalties ? `${report.penalties} тг` : '0 тг',
    report.total ? `${report.total} тг` : '0 тг',
    report.period || '',
    report.status || '',
    report.createdAt ? formatDate(new Date(report.createdAt)) : ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Отчеты_по_зарплатам',
    sheetName: 'Отчеты по зарплатам',
    title: 'Отчеты по зарплатам',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 6. Экспорт отчетов по посещаемости
export const exportAttendanceReports = async (reports: any[], params?: ExportDocumentsParams): Promise<void> => {
  const headers = [
    'ФИО сотрудника',
    'Должность',
    'Всего дней',
    'Присутствие',
    'Опоздания',
    'Отсутствия',
    'Ранний уход',
    'Больничный',
    'Отпуск',
    'Период',
    'Дата формирования'
  ];
  
  const data = reports.map(report => [
    report.staffName || '',
    report.position || '',
    report.totalDays || 0,
    report.presentDays || 0,
    report.lateDays || 0,
    report.absentDays || 0,
    report.earlyLeaveDays || 0,
    report.sickDays || 0,
    report.vacationDays || 0,
    report.period || '',
    report.createdAt ? formatDate(new Date(report.createdAt)) : ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Отчеты_по_посещаемости',
    sheetName: 'Отчеты по посещаемости',
    title: 'Отчеты по посещаемости',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 7. Экспорт списков детей
export const exportChildrenLists = async (children: any[], params?: ExportDocumentsParams): Promise<void> => {
  const headers = [
    'ФИО ребенка',
    'Дата рождения',
    'Возраст',
    'Группа',
    'ФИО родителя',
    'Телефон родителя',
    'Дата поступления',
    'Статус'
  ];
  
  const data = children.map(child => [
    child.fullName || '',
    child.birthday ? formatDate(new Date(child.birthday)) : '',
    child.age || '',
    child.groupName || '',
    child.parentName || '',
    child.parentPhone || '',
    child.createdAt ? formatDate(new Date(child.createdAt)) : '',
    child.status || 'Активен'
  ]);
  
  const config: ExportConfig = {
    filename: 'Списки_детей',
    sheetName: 'Списки детей',
    title: 'Списки детей',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// Утилита для получения периода (месяц/год)
export const getCurrentPeriod = (): string => {
  const now = new Date();
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

// Утилита для получения диапазона дат текущего месяца
export const getCurrentMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

export default {
  // Основные функции
  exportToExcel,
  exportDocumentsList,
  exportDocumentTemplatesList,
  exportStaffDocuments,
  exportChildrenDocuments,
  exportSalaryReports,
  exportAttendanceReports,
  exportChildrenLists,
  
  // Утилиты
  formatDate,
  getWeekday,
  formatDateWithWeekday,
  getCurrentPeriod,
  getCurrentMonthRange
};