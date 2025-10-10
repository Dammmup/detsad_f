// ===== ОБЩИЕ ТИПЫ И ИНТЕРФЕЙСЫ =====

// Базовые типы
export type ID = string;
export type DateString = string; // YYYY-MM-DD
export type TimeString = string; // HH:MM
export type ISODateString = string; // ISO 8601

// Статусы
export type UserRole = 'admin' | 'manager' | 'staff' | 'teacher' | 'assistant' | 'cook' | 'cleaner' | 'security' | 'nurse' | 'child';
export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'confirmed';
export type ShiftType = 'full' | 'day_off' | 'vacation' | 'sick_leave' | 'overtime';
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early-leave' | 'sick' | 'vacation';
export type ExportFormat = 'pdf' | 'excel' | 'csv';
export type DocumentType = 'contract' | 'certificate' | 'report' | 'policy' | 'other';
export type DocumentCategory = 'staff' | 'children' | 'financial' | 'administrative' | 'other';
export type DocumentStatus = 'active' | 'archived';
export type TemplateType = 'contract' | 'certificate' | 'report' | 'policy' | 'other';
export type TemplateCategory = 'staff' | 'children' | 'financial' | 'administrative' | 'other';

// ===== ДОКУМЕНТЫ =====

export interface Document {
  id: ID;
  _id?: ID; // для совместимости с MongoDB
  title: string;
  description?: string;
  type: DocumentType;
  category: DocumentCategory;
  fileName: string;
  fileSize: number;
  filePath: string;
  uploadDate: DateString;
  uploader: {
    id: ID;
    fullName: string;
    email: string;
  };
  relatedId?: ID;
  relatedType?: 'staff' | 'child' | 'group';
  status: DocumentStatus;
  tags: string[];
  version: string;
  expiryDate?: DateString;
  createdAt: DateString;
  updatedAt: DateString;
}

export interface DocumentTemplate {
  id: ID;
  _id?: ID; // для совместимости с MongoDB
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
  createdAt: DateString;
  updatedAt: DateString;
}

// ===== ПАРАМЕТРЫ API =====

// Параметры для получения списка документов
export type GetDocumentsParams = any;

// Параметры для получения списка шаблонов
export type GetTemplatesParams = any;

// Параметры для создания документа
export type CreateDocumentData = any;

// Параметры для создания шаблона
export type CreateTemplateData = any;

// Параметры для обновления документа
export type UpdateDocumentData = any;

// Параметры для обновления шаблона
export type UpdateTemplateData = any;

// Параметры для экспорта документов
export type ExportDocumentsParams = any;

// Параметры для экспорта шаблонов
export type ExportTemplatesParams = any;

// ===== API ИНТЕРФЕЙСЫ =====

// Базовый интерфейс для API ошибок
export interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Базовый интерфейс для API ответов
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Интерфейс для пагинации
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== ПОЛЬЗОВАТЕЛИ =====

// Интерфейс для ребенка (Child)
export interface Child {
  id: ID;
  _id?: ID;
  fullName: string;
  birthday?: DateString;
  groupId?: ID;
  parentName?: string;
  parentPhone?: string;
  iin?: string;
  notes?: string;
  active: boolean;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface Fine {
  amount: number;
  reason: string;
  date: DateString;
  type: 'late' | 'other';
  approved: boolean;
  createdBy: ID;
  notes?: string;
}

export interface User {
  id: ID;
  _id?: ID; // для совместимости с MongoDB
  fullName: string;
  role?: UserRole;
  phone?: string;
  email?: string;
  active: boolean;
  isVerified?: boolean;
  lastLogin?: ISODateString;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
  
  // Поля для детей
  iin?: string;
  groupId?: ID;
  parentPhone?: string;
  parentName?: string;
  birthday?: DateString;
  notes?: string;
  
  // Поля для сотрудников
  salary?: number;
  shiftRate?: number;
  salaryType?: 'day' | 'month' | 'shift';
  penaltyType?: 'fixed' | 'percent' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes';
  penaltyAmount?: number;
  initialPassword?: string;
  avatarUrl?: string;
  fines?: Fine[];
  totalFines?: number;
  permissions?: string[];
  username?: string;
}

// ===== ГРУППЫ =====

export interface Group {
  id: ID;
  _id?: ID;
  name: string;
  description?: string;
  teacher: { id?: ID; _id?: ID } | ID;
  isActive: boolean;
  maxStudents?: number;
  ageGroup: string[];
  createdBy?: ID;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

// ===== СМЕНЫ =====

export interface Shift {
  id: ID;
  _id?: ID;
  staffId: ID;
  staffName?: string; // для совместимости
  date: DateString;
  startTime: TimeString;
  endTime: TimeString;
  type: ShiftType;
  status: ShiftStatus;
  notes?: string;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
  createdBy?: ID;
  groupId?: ID;
  shiftType?: string; // для совместимости
  userId?: ID; // для совместимости
  userName?: string; // для совместимости
}

export interface ShiftFormData {
  staffId: ID;
 staffName?: string; // для совместимости
  date: DateString;
  startTime: TimeString;
  endTime: TimeString;
  type: ShiftType;
  notes: string;
}

// ===== ПОСЕЩАЕМОСТЬ =====

export interface Location {
  address?: string;
  checkIn?: string;
  checkOut?: string;
}

// Посещаемость сотрудников
export interface StaffAttendanceRecord {
  _id?: ID;
  id?: ID;
  staffId: ID;
  staffName?: string;
  groupId?: ID;
  date: DateString;
  shiftType: 'full' | 'overtime';
  startTime: TimeString;
  endTime: TimeString;
  actualStart?: TimeString;
  actualEnd?: TimeString;
  breakTime?: number;
  status: ShiftStatus | 'late';
  lateMinutes?: number;
  overtimeMinutes?: number;
  earlyLeaveMinutes?: number;
  location?: Location;
  notes?: string;
  markedBy: ID;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
  workHours?: number;
  userId?: ID; // для совместимости
  userName?: string; // для совместимости
  checkIn?: TimeString; // для совместимости
  checkOut?: TimeString; // для совместимости
}

// Посещаемость детей
export interface ChildAttendanceRecord {
  _id?: ID;
  id?: ID;
  childId: ID;
  childName?: string;
  groupId: ID;
  date: DateString;
  status: AttendanceStatus;
  checkInTime?: TimeString;
  checkOutTime?: TimeString;
  notes?: string;
  markedBy?: ID;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

// Общий интерфейс для посещаемости (для совместимости)
export interface AttendanceRecord {
  id?: ID;
  userId: ID;
  userName?: string;
  date: DateString;
  checkIn?: TimeString;
  checkOut?: TimeString;
  status: AttendanceStatus;
  workHours?: number;
  notes?: string;
  location?: Location;
}

// ===== СТАТИСТИКА =====

export interface StaffAttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  totalEarlyLeaveMinutes: number;
  averageWorkHours: number;
}

export interface ChildAttendanceStats {
  total: number;
  byStatus: {
    present?: number;
    absent?: number;
    late?: number;
    sick?: number;
    vacation?: number;
  };
  attendanceRate: number;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
  totalWorkHours: number;
  averageWorkHoursPerDay: number;
  earlyLeaveDays: number;
  sickDays: number;
  vacationDays: number;
  punctualityRate: number;
}

export interface ScheduleStats {
  totalShifts: number;
  regularShifts: number;
  overtimeShifts: number;
  cancelledShifts: number;
  totalScheduledHours: number;
  totalWorkedHours: number;
  efficiencyRate: number;
  sickLeaves: number;
  vacationDays: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
}

// ===== ФИЛЬТРЫ =====

export interface BaseFilters {
  startDate?: DateString;
  endDate?: DateString;
  _sort?: string;
  _order?: 'asc' | 'desc';
}

export interface StaffAttendanceFilters extends BaseFilters {
  staffId?: ID;
  groupId?: ID;
  date?: DateString;
  status?: string;
  shiftType?: string;
}

export interface ChildAttendanceFilters extends BaseFilters {
  childId?: ID;
  groupId?: ID;
  date?: DateString;
  status?: string;
}

export interface ShiftFilters extends BaseFilters {
  staffId?: ID;
  status?: ShiftStatus;
}

export interface UserFilters extends BaseFilters {
  role?: UserRole;
  active?: boolean;
  groupId?: ID;
}

// ===== МАССОВЫЕ ОПЕРАЦИИ =====

export interface BulkSaveResult<T = any> {
  success: number;
  errorCount: number;
  errors: Array<{
    record: any;
    error: string;
  }>;
  records: T[];
}

export interface BulkAttendanceResponse {
  success: number;
  errorCount: number;
  results: ChildAttendanceRecord[];
  errors: Array<{
    record: any;
    error: string;
  }>;
}

// ===== ОТЧЕТЫ =====

export interface Report {
  id?: ID;
  title: string;
  type: 'attendance' | 'schedule' | 'staff' | 'salary' | 'children' | 'custom';
  description?: string;
  dateRange: {
    startDate: DateString;
    endDate: DateString;
  };
  filters?: {
    userId?: ID;
    groupId?: ID;
    department?: string;
    status?: string;
  };
  data?: any;
  format?: ExportFormat;
  status?: 'generating' | 'completed' | 'failed' | 'scheduled';
  filePath?: string;
  fileSize?: number;
  generatedAt?: ISODateString;
  scheduledFor?: ISODateString;
  emailRecipients?: string[];
  createdBy?: ID;
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

// ===== ЦИКЛОГРАММА =====

export interface CyclogramActivity {
  id?: ID;
  name: string;
  description?: string;
  duration: number; // в минутах
  type: 'educational' | 'physical' | 'creative' | 'rest' | 'meal' | 'hygiene' | 'outdoor';
  ageGroup: string;
  materials?: string[];
  goals?: string[];
  methods?: string[];
}

export interface CyclogramTimeSlot {
  id?: ID;
  startTime: TimeString;
  endTime: TimeString;
  activity: CyclogramActivity;
  dayOfWeek: number; // 1-7 (понедельник-воскресенье)
  groupId?: ID;
  teacherId?: ID;
  notes?: string;
}

export interface WeeklyCyclogram {
  id?: ID;
  title: string;
  description?: string;
  ageGroup: string;
  groupId: ID;
  teacherId: ID;
  weekStartDate: DateString;
  timeSlots: CyclogramTimeSlot[];
  status: 'draft' | 'active' | 'archived';
  createdAt?: ISODateString;
  updatedAt?: ISODateString;
}

export interface CyclogramTemplate {
  id?: ID;
  name: string;
  description?: string;
  ageGroup: string;
  timeSlots: Omit<CyclogramTimeSlot, 'id' | 'groupId' | 'teacherId'>[];
  isDefault: boolean;
  createdAt?: ISODateString;
}

// ===== НАСТРОЙКИ =====

export interface KindergartenSettings {
  id?: ID;
  name: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  workingHours: {
    start: TimeString;
    end: TimeString;
  };
  workingDays: string[];
  timezone: string;
  language: string;
  currency: string;
}

export interface NotificationSettings {
  id?: ID;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lateArrivalAlert: boolean;
  absenceAlert: boolean;
  overtimeAlert: boolean;
  reportReminders: boolean;
}

export interface SecuritySettings {
  id?: ID;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  sessionTimeout: number; // в минутах
  twoFactorAuth: boolean;
  ipWhitelist: string[];
  maxLoginAttempts: number;
}

export interface GeolocationSettings {
  id?: ID;
  enabled: boolean;
  radius: number; // в метрах
  strictMode: boolean;
  allowedDevices: string[];
}

// ===== АВТОРИЗАЦИЯ =====

export interface LoginCredentials {
  phone: string; // Используем телефон вместо email для логина
  password: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number; // время жизни кода в секундах
}

export interface AuthResponse {
  user: {
    id: ID;
    email: string;
    fullName: string;
    role: UserRole;
  };
  token?: string; // Токен теперь хранится в httpOnly cookie, но оставляем для совместимости
}

// ===== ЭКСПОРТ =====

export interface ExportConfig {
  filename: string;
  sheetName: string;
  title: string;
  subtitle?: string;
  headers: string[];
  data: any[][];
  includeDate?: boolean;
  includeWeekdays?: boolean;
  dateColumn?: number;
}

// ===== УТИЛИТЫ =====

// Тип для функций обработки ошибок
export type ErrorHandler = (error: any, context?: string) => never;

// Тип для функций задержки
export type DelayFunction = (ms?: number) => Promise<void>;

// Общие константы
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_TIMEOUT = 10000;
export const RETRY_DELAY = 2000;
export const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Статусы для UI
export type StatusColor = 'success' | 'warning' | 'error' | 'info' | 'default';

// Маппинг статусов на цвета
export const STATUS_COLORS: Record<string, StatusColor> = {
  completed: 'success',
  in_progress: 'info',
  late: 'warning',
  no_show: 'error',
  cancelled: 'error',
  present: 'success',
  absent: 'error',
  sick: 'warning',
  vacation: 'info'
};

// Маппинг статусов на русский текст
export const STATUS_TEXT: Record<string, string> = {
  scheduled: 'Запланировано',
  in_progress: 'В процессе',
  completed: 'Завершено',
  cancelled: 'Отменено',
  no_show: 'Не явился',
  late: 'Опоздание',
  confirmed: 'Подтверждено',
  present: 'Присутствует',
  absent: 'Отсутствует',
  sick: 'Болеет',
  vacation: 'Отпуск',
  'early-leave': 'Ранний уход'
};

// Маппинг типов смен на русский текст
export const SHIFT_TYPES: Record<ShiftType, string> = {
  full: 'Полная',
  day_off: 'Выходной',
  vacation: 'Отпуск',
  sick_leave: 'Больничный',
  overtime: 'Сверхурочная'
};