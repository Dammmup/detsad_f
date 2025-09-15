import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Интерфейсы для экспорта
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

// 1. Экспорт списка детей
export const exportChildrenList = async (children: any[], groupName?: string): Promise<void> => {
  const headers = [
    'ФИО ребенка',
    'Дата рождения',
    'Группа',
    'ФИО родителя',
    'Телефон',
    'Адрес',
    'Дата поступления',
    'Статус'
  ];
  
  const data = children.map(child => [
    child.fullName || '',
    child.birthDate ? formatDate(new Date(child.birthDate)) : '',
    child.groupName || '',
    child.parentName || '',
    child.parentPhone || '',
    child.address || '',
    child.enrollmentDate ? formatDate(new Date(child.enrollmentDate)) : '',
    child.status || 'Активный'
  ]);
  
  const config: ExportConfig = {
    filename: groupName ? `Список_детей_${groupName}` : 'Список_детей',
    sheetName: 'Список детей',
    title: groupName ? `Список детей группы "${groupName}"` : 'Список детей',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 2. Экспорт списка сотрудников
export const exportStaffList = async (staff: any[]): Promise<void> => {
  const headers = [
    'ФИО сотрудника',
    'Должность',
    'Группа',
    'Телефон',
    'Email',
    'Дата трудоустройства',
    'Статус',
    'Зарплата'
  ];
  
  const data = staff.map(member => [
    member.fullName || '',
    member.position || member.role || '',
    member.groupName || '',
    member.phone || '',
    member.email || '',
    member.hireDate ? formatDate(new Date(member.hireDate)) : '',
    member.status || 'Активный',
    member.salary ? `${member.salary} тенге` : ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Список_сотрудников',
    sheetName: 'Сотрудники',
    title: 'Список сотрудников',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 3. Экспорт расписания/смен
export const exportSchedule = async (scheduleData: any[], period?: string): Promise<void> => {
  const headers = [
    'Дата',
    'Сотрудник',
    'Группа',
    'Тип смены',
    'Время начала',
    'Время окончания',
    'Статус',
    'Примечания'
  ];
  
  const data = scheduleData.map(item => [
    item.date || '',
    item.staffName || '',
    item.groupName || '',
    item.shiftType || '',
    item.startTime || '',
    item.endTime || '',
    item.status || '',
    item.notes || ''
  ]);
  
  const config: ExportConfig = {
    filename: period ? `Расписание_${period}` : 'Расписание',
    sheetName: 'Расписание',
    title: period ? `Расписание смен - ${period}` : 'Расписание смен',
    headers,
    data,
    includeDate: true,
    includeWeekdays: true,
    dateColumn: 0
  };
  
  exportToExcel(config);
};

// 4. Экспорт табеля посещаемости детей
export const exportChildrenAttendance = async (
  attendanceData: any[], 
  groupName: string, 
  period: string
): Promise<void> => {
  const headers = [
    'ФИО ребенка',
    'Дата',
    'Статус',
    'Время прихода',
    'Время ухода',
    'Примечания'
  ];
  
  const data = attendanceData.map(record => [
    record.childName || '',
    record.date || '',
    record.status === 'present' ? 'Присутствовал' :
    record.status === 'absent' ? 'Отсутствовал' :
    record.status === 'late' ? 'Опоздал' :
    record.status === 'sick' ? 'Болел' :
    record.status === 'vacation' ? 'Отпуск' : record.status || '',
    record.checkInTime || '',
    record.checkOutTime || '',
    record.notes || ''
  ]);
  
  const config: ExportConfig = {
    filename: `Табель_посещаемости_${groupName}_${period}`,
    sheetName: 'Табель посещаемости',
    title: `Табель посещаемости группы "${groupName}"`,
    subtitle: `Период: ${period}`,
    headers,
    data,
    includeDate: true,
    includeWeekdays: true,
    dateColumn: 1
  };
  
  exportToExcel(config);
};

// 5. Экспорт табеля рабочего времени сотрудников
export const exportStaffAttendance = async (
  attendanceData: any[], 
  period: string
): Promise<void> => {
  const headers = [
    'ФИО сотрудника',
    'Дата',
    'Тип смены',
    'Плановое время',
    'Фактическое время',
    'Опоздание (мин)',
    'Сверхурочные (мин)',
    'Статус',
    'Примечания'
  ];
  
  const data = attendanceData.map(record => [
    record.staffName || '',
    record.date || '',
    record.shiftType || '',
    `${record.scheduledStart || ''} - ${record.scheduledEnd || ''}`,
    `${record.actualStart || ''} - ${record.actualEnd || ''}`,
    record.lateMinutes || 0,
    record.overtimeMinutes || 0,
    record.status === 'completed' ? 'Завершено' :
    record.status === 'in_progress' ? 'В процессе' :
    record.status === 'late' ? 'Опоздание' :
    record.status === 'no_show' ? 'Не явился' : record.status || '',
    record.notes || ''
  ]);
  
  const config: ExportConfig = {
    filename: `Табель_рабочего_времени_${period}`,
    sheetName: 'Табель рабочего времени',
    title: 'Табель учета рабочего времени сотрудников',
    subtitle: `Период: ${period}`,
    headers,
    data,
    includeDate: true,
    includeWeekdays: true,
    dateColumn: 1
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
