import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { getGroups } from '../services/groups';
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
  // Проверяем, что дата корректна
  if (isNaN(date.getTime())) {
    return ''; // Возвращаем пустую строку для некорректных дат
  }
  
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

export const getWeekday = (date: Date): string => {
  // Проверяем, что дата корректна
  if (isNaN(date.getTime())) {
    return ''; // Возвращаем пустую строку для некорректных дат
  }
  
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return weekdays[date.getDay()];
};

export const formatDateWithWeekday = (dateString: string): string => {
  // Проверяем, что dateString не пустая строка
  if (!dateString) {
    return ''; // Возвращаем пустую строку вместо "Invalid Date"
  }
  
  const date = new Date(dateString);
  
  // Проверяем, что дата корректна
  if (isNaN(date.getTime())) {
    return ''; // Возвращаем пустую строку для некорректных дат
  }
  
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
  } = config;
  
  // Создаем новую книгу
  const workbook = XLSX.utils.book_new();
  
  // Подготавливаем данные для листа
  const worksheetData: any[][] = [];
  
  // Добавляем заголовок документа
  let fullTitle = title;
  if (includeDate) {
    const currentDate = new Date();
    // Проверяем, что дата корректна
    if (!isNaN(currentDate.getTime())) {
      fullTitle += ` - ${formatDate(currentDate)}`;
    }
  }
  worksheetData.push([fullTitle]);
  worksheetData.push([]); // Пустая строка
  const titleRowCount = worksheetData.length;
  
  // Добавляем подзаголовок если есть
  if (subtitle) {
    worksheetData.push([subtitle]);
    worksheetData.push([]); // Пустая строка
  }
  const subtitleRowCount = subtitle ? 2 : 0;
  
  // Добавляем заголовки колонок и данные
  worksheetData.push(headers);
  worksheetData.push(...data);
  
  // Создаем лист
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Стилизация и ширина колонок
  const columnWidths = headers.map((header, index) => {
    const maxLength = Math.max(
      header.length,
      ...data.map(row => String(row[index] || '').length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, 10), 50) };
  });
  worksheet['!cols'] = columnWidths;
  
  // Стилизация заголовка таблицы
  const headerStyle = {
    font: { bold: true },
    fill: { fgColor: { rgb: "FFD3D3D3" } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" }
    }
  };
  
  const headerRowIndex = titleRowCount + subtitleRowCount;
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
  for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
    const address = XLSX.utils.encode_cell({ r: headerRowIndex, c: C });
    if (!worksheet[address]) continue;
    worksheet[address].s = headerStyle;
  }
  
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
  const groups = await getGroups();

  const headers = [
    'ФИО ребенка',
    'Дата рождения',
    'Группа',
    'ФИО родителя',
    'Телефон родителя',
    'Дата поступления',
    'ИИН'
  ];
  
  const data = children.map(child => [
    child.fullName || '',
    child.birthday ? formatDate(new Date(child.birthday)) : '',
    groups.find(g => g.id === child.groupId)?.name || '',
    child.parentName || '',
    child.parentPhone || '',
    child.createdAt ? formatDate(new Date(child.createdAt)) : '',
    child.iin || '',
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
  const groups = await getGroups();

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
    groups.find(g => g.id === member.groupId)?.name || '',
    member.phone || '',
    member.email || '',
    member.createdAt ? formatDate(new Date(member.createdAt)) : '',
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
    item.date ? formatDate(new Date(item.date)) : '',
    item.staffName || '',
    item.groupName || '',
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
  period: string,
  filteredChildren: any[]// <- добавляем параметр
): Promise<void> => {
  // 1. Достаём имена детей из filteredChildren

  // 2. Уникальные даты из attendanceData
  const allDates = Array.from(
    new Set(attendanceData.map(r => r.date))
  ).sort();

  // 3. Заголовки
  const headers = [
    "ФИО ребенка",
    ...allDates.map(dateStr => {
      const date = new Date(dateStr);
      // Проверяем, что дата корректна
      if (isNaN(date.getTime())) {
        return dateStr; // Возвращаем исходную строку если дата некорректна
      }
      const weekday = date.toLocaleDateString("ru-RU", { weekday: "short" });
      return `${date.getDate()}.${date.getMonth() + 1} (${weekday})`;
    }),
  ];

  // 4. Формируем строки только для детей из filteredChildren
  const data= filteredChildren.map(child => {
    const childId = child._id || child.id;
    const row: (string | null)[] = [child.fullName || ''];

    allDates.forEach(date => {
      const record = attendanceData.find(r => r.childId === childId && r.date === date);
      if (record) {
        if (record.status === "present") row.push("+");
        else if (record.status === "absent") row.push("-");
        else if (record.status === "late") row.push("О");
        else if (record.status === "sick") row.push("Б");
        else if (record.status === "vacation") row.push("ОТ");
        else row.push("");
      } else {
        row.push("");
      }
    });

    return row;
  });

  // 5. Конфиг
  const config: ExportConfig = {
    filename: `Табель_посещаемости_${groupName}_${period}`,
    sheetName: "Табель посещаемости",
    title: `Табель посещаемости группы "${groupName}"`,
    subtitle: `Период: ${period}`,
    headers,
    data,
    includeDate: false,
    includeWeekdays: false,
  };

  exportToExcel(config);
};


// 5. Экспорт табеля рабочего времени сотрудников
export const exportStaffAttendance = async (
  attendanceData: any[],
  period: string
): Promise<void> => {
  // Словарь для перевода статусов
  const statusTranslations: { [key: string]: string } = {
    checked_in: '✓', // Пришел
    checked_out: '✓', // Ушел (считаем как присутствие)
    completed: '✓', // Завершено (считаем как присутствие)
    absent: 'Н', // Неявка
    no_show: 'Н', // Неявка
    sick: 'Б', // Больничный
    vacation: 'О', // Отпуск
    late: 'ОП', // Опоздание
    scheduled: 'П', // Запланировано
    cancelled: 'X', // Отменено
  };
  
  // 1. Получаем уникальные даты и сортируем их
  const dates = Array.from(new Set(attendanceData.map(r => r.date))).sort();
  
  // 2. Группируем данные по сотрудникам
  const dataByStaff: { [staffName: string]: { [date: string]: string } } = {};
  attendanceData.forEach(record => {
    const staffName = record.staffName;
    // Пропускаем записи без имени сотрудника
    if (!staffName) return;
    
    if (!dataByStaff[staffName]) {
      dataByStaff[staffName] = {};
    }
    const statusKey = record.originalStatus || record.status;
    dataByStaff[staffName][record.date] = statusTranslations[statusKey] || '?';
  });
  
  // 3. Формируем заголовки (Даты)
  const headers = ['ФИО Сотрудника', ...dates.map(d => {
    // Проверяем, что дата корректна
    if (!d) return '';
    const date = new Date(d);
    if (isNaN(date.getTime())) return d; // Возвращаем исходную строку если дата некорректна
    return formatDateWithWeekday(d);
  }).filter(h => h !== '')];
  
  // 4. Формируем строки для таблицы (Сотрудники)
  const data = Object.keys(dataByStaff).sort().map(staffName => {
    const row: string[] = [staffName];
    dates.forEach(date => {
      // Проверяем, что дата корректна
      if (!date) {
        row.push(''); // Добавляем пустую строку для некорректных дат
        return;
      }
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        row.push(''); // Добавляем пустую строку для некорректных дат
        return;
      }
      row.push(dataByStaff[staffName][date] || ''); // Добавляем статус или пустую строку
    });
    return row;
  });
  
  // 5. Конфигурация для экспорта
  const config: ExportConfig = {
    filename: `Табель_посещаемости_сотрудников_${period}`,
    sheetName: 'Табель',
    title: 'Табель учета рабочего времени сотрудников',
    subtitle: `Период: ${period}`,
    headers,
    data,
    includeDate: false, // Дата уже включена в заголовок
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
  
  // Получаем первый день месяца
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Получаем последний день месяца
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// 6. Экспорт списка документов
export const exportDocumentsList = async (documents: any[]): Promise<void> => {
  const headers = [
    'Название документа',
    'Тип',
    'Категория',
    'Связанный объект',
    'Статус',
    'Дата загрузки',
    'Загрузчик',
    'Размер файла',
    'Теги'
  ];
  
  const data = documents.map(doc => [
    doc.title || '',
    doc.type === 'contract' ? 'Договор' :
    doc.type === 'certificate' ? 'Справка' :
    doc.type === 'report' ? 'Отчет' :
    doc.type === 'policy' ? 'Политика' : 'Другое',
    doc.category === 'staff' ? 'Сотрудники' :
    doc.category === 'children' ? 'Дети' :
    doc.category === 'financial' ? 'Финансы' :
    doc.category === 'administrative' ? 'Администрация' : 'Другое',
    doc.relatedType === 'staff' ? `Сотрудник: ${doc.relatedId?.fullName || ''}` :
    doc.relatedType === 'child' ? `Ребенок: ${doc.relatedId?.fullName || ''}` :
    doc.relatedType === 'group' ? `Группа: ${doc.relatedId?.name || ''}` : '',
    doc.status === 'active' ? 'Активен' : 'Архивирован',
    doc.uploadDate ? formatDate(new Date(doc.uploadDate)) : '',
    doc.uploader?.fullName || '',
    doc.fileSize ? `${(doc.fileSize / 1024).toFixed(2)} KB` : '',
    doc.tags?.join(', ') || ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Список_документов',
    sheetName: 'Документы',
    title: 'Список документов',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};

// 7. Экспорт списка шаблонов документов
export const exportDocumentTemplatesList = async (templates: any[]): Promise<void> => {
  const headers = [
    'Название шаблона',
    'Тип',
    'Категория',
    'Версия',
    'Статус',
    'Дата создания',
    'Использован раз',
    'Размер файла',
    'Теги'
  ];
  
  const data = templates.map(template => [
    template.name || '',
    template.type === 'contract' ? 'Договор' :
    template.type === 'certificate' ? 'Справка' :
    template.type === 'report' ? 'Отчет' :
    template.type === 'policy' ? 'Политика' : 'Другое',
    template.category === 'staff' ? 'Сотрудники' :
    template.category === 'children' ? 'Дети' :
    template.category === 'financial' ? 'Финансы' :
    template.category === 'administrative' ? 'Администрация' : 'Другое',
    template.version || '1.0',
    template.isActive ? 'Активен' : 'Неактивен',
    template.createdAt ? formatDate(new Date(template.createdAt)) : '',
    template.usageCount || 0,
    template.fileSize ? `${(template.fileSize / 1024).toFixed(2)} KB` : '',
    template.tags?.join(', ') || ''
  ]);
  
  const config: ExportConfig = {
    filename: 'Список_шаблонов_документов',
    sheetName: 'Шаблоны документов',
    title: 'Список шаблонов документов',
    headers,
    data,
    includeDate: true
  };
  
  exportToExcel(config);
};
