// ===== УТИЛИТЫ ДЛЯ ФОРМАТИРОВАНИЯ =====

import { StatusColor, STATUS_COLORS, STATUS_TEXT } from '../types/common';

// ===== ФОРМАТИРОВАНИЕ ДАТА И ВРЕМЕНИ =====

/**
 * Форматирование даты в русском формате
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

/**
 * Форматирование времени в формате HH:MM
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Форматирование даты и времени
 */
export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('ru-RU', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Получение дня недели
 */
export const getWeekday = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return weekdays[dateObj.getDay()];
};

/**
 * Получение полного названия дня недели
 */
export const getFullWeekday = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', { weekday: 'long' });
};

/**
 * Форматирование даты с днем недели
 */
export const formatDateWithWeekday = (date: Date | string): string => {
  const formattedDate = formatDate(date);
  const weekday = getWeekday(date);
  return `${formattedDate} (${weekday})`;
};

/**
 * Получение текущего периода (месяц/год)
 */
export const getCurrentPeriod = (): string => {
  const now = new Date();
  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

/**
 * Получение диапазона дат текущего месяца
 */
export const getCurrentMonthRange = (): { startDate: string; endDate: string } => {
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

// ===== ФОРМАТИРОВАНИЕ ВРЕМЕНИ В МИНУТАХ =====

/**
 * Преобразование времени в минуты
 */
export const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Преобразование минут в время
 */
export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Форматирование минут в читаемый вид
 */
export const formatMinutesToReadable = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}м`;
  } else if (mins === 0) {
    return `${hours}ч`;
  } else {
    return `${hours}ч ${mins}м`;
  }
};

/**
 * Получение текущего времени в формате HH:MM
 */
export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// ===== ФОРМАТИРОВАНИЕ СТАТУСОВ =====

/**
 * Получение цвета статуса для UI
 */
export const getStatusColor = (status: string): StatusColor => {
  return STATUS_COLORS[status] || 'default';
};

/**
 * Получение текста статуса на русском языке
 */
export const getStatusText = (status: string): string => {
  return STATUS_TEXT[status] || status;
};


// ===== ФОРМАТИРОВАНИЕ ЧИСЕЛ И ВАЛЮТ =====

/**
 * Форматирование числа с разделителями тысяч
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ru-RU');
};

/**
 * Форматирование валюты
 */
export const formatCurrency = (amount: number, currency: string = 'тенге'): string => {
  return `${formatNumber(amount)} ${currency}`;
};

/**
 * Форматирование процентов
 */
export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// ===== ФОРМАТИРОВАНИЕ ТЕЛЕФОНОВ =====

/**
 * Форматирование номера телефона
 */
export const formatPhoneNumber = (phone: string): string => {
  // Удаляем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '');
  
  // Если номер начинается с 8, заменяем на +7
  let formatted = cleaned;
  if (formatted.startsWith('8') && formatted.length === 11) {
    formatted = '7' + formatted.slice(1);
  }
  
  // Добавляем + если номер начинается с 7
  if (formatted.startsWith('7') && formatted.length === 11) {
    formatted = '+' + formatted;
  }
  
  // Форматируем как +7 (XXX) XXX-XX-XX
  if (formatted.startsWith('+7') && formatted.length === 12) {
    return formatted.replace(/(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/, '$1 ($2) $3-$4-$5');
  }
  
  return phone; // Возвращаем исходный номер если не удалось отформатировать
};

// ===== ФОРМАТИРОВАНИЕ ИМЕН =====

/**
 * Форматирование ФИО (первая буква заглавная)
 */
export const formatFullName = (name: string): string => {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Получение инициалов из ФИО
 */
export const getInitials = (fullName: string): string => {
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('');
};

/**
 * Сокращение ФИО до Фамилия И.О.
 */
export const formatShortName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;
  
  const lastName = parts[0];
  const firstInitial = parts[1].charAt(0).toUpperCase();
  const middleInitial = parts.length > 2 ? parts[2].charAt(0).toUpperCase() : '';
  
  return middleInitial 
    ? `${lastName} ${firstInitial}.${middleInitial}.`
    : `${lastName} ${firstInitial}.`;
};

// ===== ФОРМАТИРОВАНИЕ РАЗМЕРОВ ФАЙЛОВ =====

/**
 * Форматирование размера файла
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

// ===== ФОРМАТИРОВАНИЕ АДРЕСОВ =====

/**
 * Форматирование адреса
 */
export const formatAddress = (address: string): string => {
  return address
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .join(', ');
};

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ДАТАМИ =====

/**
 * Проверка, является ли дата сегодняшней
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Проверка, является ли дата вчерашней
 */
export const isYesterday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Получение относительного времени (например, "2 часа назад")
 */
export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMinutes < 1) {
    return 'только что';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} мин назад`;
  } else if (diffHours < 24) {
    return `${diffHours} ч назад`;
  } else if (diffDays < 7) {
    return `${diffDays} дн назад`;
  } else {
    return formatDate(dateObj);
  }
};

/**
 * Получение возраста по дате рождения
 */
export const calculateAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = new Date();
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

// ===== ФОРМАТИРОВАНИЕ ДЛЯ ЭКСПОРТА =====

/**
 * Форматирование данных для экспорта в Excel
 */
export const formatForExport = (value: any): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Да' : 'Нет';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  if (value instanceof Date) {
    return formatDateTime(value);
  }
  
  return String(value);
};

/**
 * Очистка строки для безопасного использования в именах файлов
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
};