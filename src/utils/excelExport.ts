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
    'Пол',
    'Дата рождения',
    'Группа',
    'ФИО родителя',
    'Телефон родителя',
    'Дата поступления',
    'ИИН',
    'Статус',
    'Примечание',
  ];

  let male = 0, female = 0, active = 0, inactive = 0;
  const data = children.map(child => {
    const g = groups.find(g => g.id === child.groupId);
    const status = child.active === false ? 'Неактивен' : 'Активен';
    if (child.active === false) inactive++; else active++;
    if (child.gender === 'м' || child.gender === 'муж' || child.gender === 'male') male++;
    if (child.gender === 'ж' || child.gender === 'жен' || child.gender === 'female') female++;
    return [
      child.fullName || '',
      child.gender || '',
      child.birthday ? formatDate(new Date(child.birthday)) : '',
      g?.name || '',
      child.parentName || '',
      child.parentPhone || '',
      child.createdAt ? formatDate(new Date(child.createdAt)) : '',
      child.iin || '',
      status,
      (child.allergy ? 'Аллергия: '+child.allergy+'; ' : '') + (child.diagnosis ? 'Диагноз: '+child.diagnosis : '')
    ];
  });
  // Итоговая строка
  data.push([
    `Итого детей: ${children.length}`,
    `Мужчин: ${male}`,
    `Женщин: ${female}`,
    '', '', '', '', '',
    `Активных: ${active}`,
    `Неактивных: ${inactive}`
  ]);

  // Верхняя легенда
  const legend = ['В поле "Примечание" отображаются аллергии и diagnosis, в "Статус" — активность, даты — в формате ДД.ММ.ГГГГ'];

  exportToExcel({
    filename: groupName ? `Список_детей_${groupName}` : 'Список_детей',
    sheetName: 'Список детей',
    title: groupName ? `Список детей группы "${groupName}"` : 'Список детей',
    subtitle: legend.join(' '),
    headers,
    data,
    includeDate: true
  });
};

// 2. Экспорт списка сотрудников
export const exportStaffList = async (staff: any[]): Promise<void> => {
  const groups = await getGroups();
  const roleLabels: { [key: string]: string } = {
    admin: 'Администратор',
    teacher: 'Воспитатель',
    assistant: 'Ассистент',
    nurse: 'Медсестра',
    cook: 'Повар',
    cleaner: 'Уборщица',
    security: 'Охрана',
    psychologist: 'Психолог',
    music_teacher: 'Музыкальный работник',
    physical_teacher: 'Физрук',
    staff: 'Персонал',
    parent: 'Родитель',
    child: 'Ребёнок'
  };
  let total = 0, active = 0, inactive = 0;
  const roleCount: { [role: string]: number } = {};
  const headers = [
    'ФИО сотрудника',
    'Должность',
    'Группа',
    'Телефон',
    'Email',
    'Дата трудоустройства',
    'Статус',
    'Зарплата',
    'Комментарий'
  ];
  const data = staff.map(member => {
    total++;
    if (member.active === false) inactive++; else active++;
    const roleLabel = roleLabels[member.role] || member.position || member.role || '';
    if (roleLabels[member.role]) {roleCount[roleLabel]=(roleCount[roleLabel]||0)+1;}
    else if (roleLabel) {roleCount[roleLabel]=(roleCount[roleLabel]||0)+1;}
    const group = groups.find(g => g.id === member.groupId)?.name || '';
    const status = member.active === false ? 'Неактивен': 'Активен';
    return [
      member.fullName || '',
      roleLabel,
      group,
      member.phone || '',
      member.email || '',
      member.createdAt ? formatDate(new Date(member.createdAt)) : '',
      status,
      member.salary ? `${member.salary} тенге` : '',
      member.notes || ''
    ];
  });
  data.push([
    `Итого сотрудников: ${total}`,
    '', '', '', '', '',
    `Активных: ${active}`,
    '',
    `Неактивных: ${inactive}`
  ]);
  Object.keys(roleCount).forEach(role => {
    data.push([`Всего: ${role}`, roleCount[role],'','','','','','','']);
  });
  const legend = ['Должность — читаемое название, статус — по активности, зарплата в тенге, комментарии — любые notes'];
  exportToExcel({
    filename: 'Список_сотрудников',
    sheetName: 'Сотрудники',
    title: 'Список сотрудников',
    subtitle: legend.join(' '),
    headers,
    data,
    includeDate: true
  });
};

// 3. Экспорт расписания/смен
export const exportSchedule = async (scheduleData: any[], period?: string): Promise<void> => {
  const headers = [
    'Дата',
    'Сотрудник',
    'Должность',
    'Группа',
    'Тип смены',
    'Время начала',
    'Время окончания',
    'Длительность (ч:м)',
    'Статус',
    'Примечания'
  ];
  // Статусы для подсчета итогов
  let scheduled=0, completed=0, inprogress=0, absent=0, other=0;
  // Перевод ролей
  const roleLabels: { [key: string]: string } = {
    admin: 'Администратор', teacher: 'Воспитатель', assistant: 'Ассистент', nurse: 'Медсестра', cook: 'Повар', cleaner: 'Уборщица', security: 'Охрана', psychologist: 'Психолог', music_teacher: 'Музыкальный работник', physical_teacher: 'Физрук', staff: 'Персонал', parent: 'Родитель', child: 'Ребёнок'
  };
  const data = scheduleData.map(item => {
    let status=item.status;
    if(status==='scheduled') scheduled++;
    else if(status==='completed') completed++;
    else if(status==='in_progress') inprogress++;
    else if(status==='absent') absent++;
    else other++;
    let durationLabel = '';
    if(item.startTime&&item.endTime){
      const [sh,sm]=item.startTime.split(':').map(Number);
      const [eh,em]=item.endTime.split(':').map(Number);
      if(!isNaN(sh)&&!isNaN(sm)&&!isNaN(eh)&&!isNaN(em)){
        let mins = (eh*60+em)-(sh*60+sm);
        if (mins<0) mins+=24*60;
        durationLabel = `${Math.floor(mins/60)}:${String(mins%60).padStart(2,'0')}`
      }
    }
    return [
      item.date ? formatDate(new Date(item.date)) : '',
      item.staffName || '',
      roleLabels[item.role] || item.role || '',
      item.groupName || '',
      item.shiftType || '',
      item.startTime || '',
      item.endTime || '',
      durationLabel,
      item.status || '',
      item.notes || ''
    ];
  });
  data.push([
    'ИТОГО:', '', '', '', '', '', '', '', '', ''
  ]);
  data.push([
    `Всего: ${scheduleData.length}`,`Запланировано: ${scheduled}`,`Завершено: ${completed}`,`В процессе: ${inprogress}`,`Отсутствует: ${absent}`,`Прочее: ${other}` ,'','','','']
  );
  const legend = ['Статус: scheduled — запланирована, completed — завершена, in_progress — в процессе, absent — отсутствует, Прочее — любые нестандартные. Длительность считается difference по времени старта/финиша.'];
  exportToExcel({
    filename: period ? `Расписание_${period}` : 'Расписание',
    sheetName: 'Расписание',
    title: period ? `Расписание смен - ${period}` : 'Расписание смен',
    subtitle: legend.join(' '),
    headers,
    data,
    includeDate: true,
    includeWeekdays: true,
    dateColumn: 0
  });
};

// 4. Экспорт табеля посещаемости детей

export const exportChildrenAttendance = async (
  attendanceData: any[],
  groupName: string,
  period: string,
  filteredChildren: any[]
): Promise<void> => {
  // 1. Достаём имена детей из filteredChildren
  // 2. Уникальные даты из attendanceData
  const allDates = Array.from(
    new Set(attendanceData.map(r => r.date))
  ).sort();
  // 3. Заголовки
  const headers = [
    "ФИО ребенка",
    'Группа',
    ...allDates.map(dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const weekday = date.toLocaleDateString("ru-RU", { weekday: "short" });
      return `${date.getDate()}.${date.getMonth() + 1} (${weekday})`;
    }),
    'Явок (+)', 'Пропусков (-)', 'Опозданий (О)', 'Болезней (Б)', 'Отпусков (ОТ)'
  ];
  // Итоги по группе
  let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalSick = 0, totalVacation = 0;
  // 4. Формируем строки только для детей из filteredChildren
  const data= filteredChildren.map(child => {
    const childId = child._id || child.id;
    const row: (string | null)[] = [child.fullName || '', child.groupName||''];
    let plus=0,minus=0,late=0,sick=0,vac=0;
    allDates.forEach(date => {
      const record = attendanceData.find(r => r.childId === childId && r.date === date);
      if (record) {
        if (record.status === "present") { row.push("+"); plus++; totalPresent++; }
        else if (record.status === "absent") { row.push("-"); minus++; totalAbsent++; }
        else if (record.status === "late") { row.push("О"); late++; totalLate++; }
        else if (record.status === "sick") { row.push("Б"); sick++; totalSick++; }
        else if (record.status === "vacation") { row.push("ОТ"); vac++; totalVacation++; }
        else row.push("");
      } else {
        row.push("");
      }
    });
    row.push(String(plus),String(minus),String(late),String(sick),String(vac));
    return row;
  });
  // Итоговая строка по группе
  data.push([
    `Итого по группе:`, groupName,
    ...Array(allDates.length).fill(''),
    String(totalPresent), String(totalAbsent), String(totalLate), String(totalSick), String(totalVacation)
  ]);
  const legend = ['+: явка, -: отсутствие, О: опоздание, Б: болезнь, ОТ: отпуск. В конце таблицы показаны итоги по каждому виду.'];
  exportToExcel({
    filename: `Табель_посещаемости_${groupName}_${period}`,
    sheetName: "Табель посещаемости",
    title: `Табель посещаемости группы "${groupName}"`,
    subtitle: `Период: ${period}. ${legend.join(' ')}`,
    headers,
    data,
    includeDate: false,
    includeWeekdays: false,
  });
};


// 5. Экспорт табеля рабочего времени сотрудников
export const exportStaffAttendance = async (
  attendanceData: any[],
  period: string
): Promise<void> => {
  // Легенда статусов
  const legend = [
    '✓ — явка', 'Н — неявка', 'ОП — опоздание', 'Б — больничный', 'О — отпуск', 'П — запланировано', 'X — отменено', '? — неизвестно'
  ];

  // Переводы статусов
  const statusTranslations: { [key: string]: string } = {
    completed: '✓',
    absent: 'Н',
    no_show: 'Н',
    sick: 'Б',
    vacation: 'О',
    late: 'ОП',
    scheduled: 'П',
    cancelled: 'X',
  };

  const allDates = Array.from(new Set(attendanceData.map(r => r.date.split('T')[0]))).sort();

  const headers = [
    "ФИО сотрудника",
    'Группа',
    ...allDates.map(dateStr => {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      const weekday = date.toLocaleDateString("ru-RU", { weekday: "short" });
      return `${date.getDate()}.${date.getMonth() + 1} (${weekday})`;
    }),
    'Явок', 'Пропусков', 'Опозданий', 'Больничных', 'Отпусков', 'Итого часов'
  ];

  const staffVisits = new Map<string, any[]>();
  attendanceData.forEach(item => {
    const staffId = item.staffId._id || item.staffId;
    if (!staffVisits.has(staffId)) {
      staffVisits.set(staffId, []);
    }
    staffVisits.get(staffId)!.push(item);
  });

  const dataRows: any[][] = [];
  let totalCame = 0, totalAbsent = 0, totalLate = 0, totalSick = 0, totalVacation = 0, grandTotalMinutes = 0;

  staffVisits.forEach((records, staffId) => {
    const staffInfo = records[0];
    const staffName = staffInfo.staffName || (staffInfo.staffId && typeof staffInfo.staffId === 'object' ? staffInfo.staffId.fullName : '');
    const row: any[] = [staffName, staffInfo.groupName || ''];
    let came = 0, absent = 0, late = 0, sick = 0, vacation = 0, totalMinutes = 0;

    allDates.forEach(date => {
      const record = records.find(r => r.date.split('T')[0] === date);
      if (record) {
        const status = statusTranslations[record.status] || '?';
        row.push(status);
        if (status === '✓') came++;
        else if (status === 'Н') absent++;
        else if (status === 'ОП') late++;
        else if (status === 'Б') sick++;
        else if (status === 'О') vacation++;

        let durationMins = record.workDuration || record.duration || 0;
        if (record.actualStart && record.actualEnd) {
            const start = new Date(record.actualStart).getTime();
            const end = new Date(record.actualEnd).getTime();
            if (start && end && end > start) {
              durationMins = Math.floor((end - start) / 60000);
            }
        }
        totalMinutes += durationMins;
      } else {
        row.push('');
      }
    });

    row.push(came, absent, late, sick, vacation, (totalMinutes / 60).toFixed(1));
    dataRows.push(row);

    totalCame += came;
    totalAbsent += absent;
    totalLate += late;
    totalSick += sick;
    totalVacation += vacation;
    grandTotalMinutes += totalMinutes;
  });

  const summaryRow = [
    'Итого', '', 
    ...Array(allDates.length).fill(''), 
    totalCame, totalAbsent, totalLate, totalSick, totalVacation, 
    (grandTotalMinutes / 60).toFixed(1)
  ];
  dataRows.push(summaryRow);

  exportToExcel({
    filename: `Табель_рабочего_времени_${period}`,
    sheetName: 'Табель',
    title: 'Табель учета рабочего времени сотрудников',
    subtitle: `Период: ${period}\nЛегенда: ${legend.join(', ')}`,
    headers: headers,
    data: dataRows,
    includeDate: false
  });
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

export const exportChildPayments = async (payments: any[], children: any[], groups: any[]): Promise<void> => {
  const headers = [
    'Ребенок',
    'Группа',
    'Период',
    'Сумма',
    'Всего',
    'Надбавки',
    'Вычеты',
    'Статус',
    'Комментарии'
  ];

  const data = payments.map(payment => {
    const child = children.find(c => c._id === (typeof payment.childId === 'string' ? payment.childId : payment.childId?._id));
    const group = child ? groups.find(g => g._id === (typeof child.groupId === 'object' ? child.groupId?._id : child.groupId)) : undefined;

    return [
      child ? child.fullName : 'Неизвестный ребенок',
      group ? group.name : 'Группа не указана',
      `${payment.period.start} - ${payment.period.end}`,
      payment.amount,
      payment.total,
      payment.accruals || 0,
      payment.deductions || 0,
      payment.status === 'paid' ? 'Оплачено' :
      payment.status === 'overdue' ? 'Просрочено' :
      payment.status === 'active' ? 'Активно' : 'Черновик',
      payment.comments || ''
    ];
  });

  exportToExcel({
    filename: 'Оплаты_за_посещение_детей',
    sheetName: 'Оплаты',
    title: 'Оплаты за посещение детей',
    headers,
    data,
    includeDate: true
  });
};
