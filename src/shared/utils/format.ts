

import { StatusColor, STATUS_COLORS, STATUS_TEXT } from '../types/common';
import { TIMEZONE } from './timezone';



// Таймзона по умолчанию - Алматы (Казахстан)
const ALMATY_TIMEZONE = TIMEZONE;

// Получить текущую дату в таймзоне Алматы
export const getAlmatyDate = (): Date => {
  const now = new Date();
  const almatyTime = now.toLocaleString('en-US', { timeZone: ALMATY_TIMEZONE });
  return new Date(almatyTime);
};

// Получить строку даты в формате YYYY-MM-DD для таймзоны Алматы
export const getAlmatyDateString = (): string => {
  return new Date().toLocaleDateString('sv-SE', { timeZone: ALMATY_TIMEZONE });
};

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', {
    timeZone: ALMATY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleTimeString('ru-RU', {
    timeZone: ALMATY_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('ru-RU', {
    timeZone: ALMATY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getWeekday = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return weekdays[dateObj.getDay()];
};

export const getFullWeekday = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('ru-RU', { timeZone: ALMATY_TIMEZONE, weekday: 'long' });
};

export const formatDateWithWeekday = (date: Date | string): string => {
  const formattedDate = formatDate(date);
  const weekday = getWeekday(date);
  return `${formattedDate} (${weekday})`;
};

export const getCurrentPeriod = (): string => {
  const now = getAlmatyDate();
  const monthNames = [
    'Январь',
    'Февраль',
    'Март',
    'Апрель',
    'Май',
    'Июнь',
    'Июль',
    'Август',
    'Сентябрь',
    'Октябрь',
    'Ноябрь',
    'Декабрь',
  ];
  return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
};

export const getCurrentMonthRange = (): {
  startDate: string;
  endDate: string;
} => {
  const dateStr = getAlmatyDateString();
  const [year, month] = dateStr.split('-');
  
  const lastDay = new Date(Date.UTC(parseInt(year), parseInt(month), 0)).getUTCDate();
  
  return {
    startDate: `${year}-${month}-01`,
    endDate: `${year}-${month}-${lastDay.toString().padStart(2, '0')}`,
  };
};



export const parseTimeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatMinutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

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

export const getCurrentTime = (): string => {
  const now = getAlmatyDate();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};



export const getStatusColor = (status: string): StatusColor => {
  return STATUS_COLORS[status] || 'default';
};

export const getStatusText = (status: string): string => {
  return STATUS_TEXT[status] || status;
};



export const formatNumber = (num: number): string => {
  return num.toLocaleString('ru-RU');
};

export const formatCurrency = (
  amount: number,
  currency: string = 'тенге',
): string => {
  return `${formatNumber(amount)} ${currency}`;
};

export const formatPercentage = (
  value: number,
  decimals: number = 1,
): string => {
  return `${value.toFixed(decimals)}%`;
};



export const formatPhoneNumber = (phone: string): string => {

  const cleaned = phone.replace(/\D/g, '');


  let formatted = cleaned;
  if (formatted.startsWith('8') && formatted.length === 11) {
    formatted = '7' + formatted.slice(1);
  }


  if (formatted.startsWith('7') && formatted.length === 11) {
    formatted = '+' + formatted;
  }


  if (formatted.startsWith('+7') && formatted.length === 12) {
    return formatted.replace(
      /(\+7)(\d{3})(\d{3})(\d{2})(\d{2})/,
      '$1 ($2) $3-$4-$5',
    );
  }

  return phone;
};



export const formatFullName = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

export const getInitials = (fullName: string): string => {
  return fullName
    .split(' ')
    .map((name) => name.charAt(0).toUpperCase())
    .join('');
};

export const formatShortName = (fullName: string): string => {
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) return fullName;

  const lastName = parts[0];
  const firstInitial = parts[1].charAt(0).toUpperCase();
  const middleInitial =
    parts.length > 2 ? parts[2].charAt(0).toUpperCase() : '';

  return middleInitial
    ? `${lastName} ${firstInitial}.${middleInitial}.`
    : `${lastName} ${firstInitial}.`;
};



export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';

  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};



export const formatAddress = (address: string): string => {
  return address
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join(', ');
};



export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = getAlmatyDate();

  return dateObj.toDateString() === today.toDateString();
};

export const isYesterday = (date: Date | string): boolean => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const yesterday = getAlmatyDate();
  yesterday.setDate(yesterday.getDate() - 1);

  return dateObj.toDateString() === yesterday.toDateString();
};

export const getRelativeTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = getAlmatyDate();
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

export const calculateAge = (birthDate: Date | string): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
  const today = getAlmatyDate();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};



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

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .toLowerCase();
};
