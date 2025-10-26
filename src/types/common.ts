// Common types for the application

export type ID = string;

export enum UserRole {
  admin = 'admin',
  teacher = 'teacher',
  assistant = 'assistant',
  nurse = 'nurse',
  cook = 'cook',
  cleaner = 'cleaner',
  security = 'security',
  psychologist = 'psychologist',
  music_teacher = 'music_teacher',
  physical_teacher = 'physical_teacher',
  staff = 'staff',
  parent = 'parent',
  child = 'child',
  substitute = 'substitute'
}

export interface Group {
  _id: ID;
  id?: ID;
  name: string;
  description?: string;
  childrenCount?: number;
  teacher?: string; // Добавляем поле для учителя
  isActive?: boolean; // Добавляем поле для статуса активности
  maxStudents?: number; // Добавляем поле для максимального количества студентов
  ageGroup?: string[]; // Добавляем поле для возрастной группы
  createdAt?: string;
  updatedAt?: string;
}

export interface Child {
  _id: ID;
 id?: ID;
  fullName: string;
  iin?: string;
  birthday?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  staffId?: string; // Добавляем staffId как альтернативное поле для userId
  groupId?: Group | string;
 active?: boolean;
 gender?: string;
 clinic?: string;
 bloodGroup?: string;
  rhesus?: string;
  disability?: string;
  dispensary?: string;
  diagnosis?: string;
  allergy?: string;
  infections?: string;
  hospitalizations?: string;
  incapacity?: string;
  checkups?: string;
  notes?: string;
  photo?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  _id: ID;
  id?: ID;
  phone: string;
  fullName: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  uniqNumber?: string;
  notes?: string;
  iin?: string;
  groupId?: string;
  birthday?: string;
  photo?: string;
  // Поля для детей (наследуются от интерфейса Child)
  parentName?: string;
  parentPhone?: string;
  email?: string; // Добавляем email
  initialPassword?: string; // Добавляем начальный пароль
  salary?: number; // Добавляем зарплату
  salaryType?: 'shift' | 'month' | 'day'; // Добавляем тип зарплаты
  penaltyType?: 'fixed' | 'percent' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes'; // Добавляем тип штрафа
  penaltyAmount?: number; // Добавляем сумму штрафа
  shiftRate?: number; // Добавляем ставку за смену
  // Добавляем поля, которые могут отсутствовать в User, но есть в других интерфейсах
  staffId?: string;
  staffName?: string;
}

export interface IRent {
  _id: ID;
  id?: ID;
  tenantId: User | string;
  period: string;
  amount: number;
  total: number;
  status: 'active' | 'overdue' | 'paid' | 'draft';
  latePenalties?: number;
  absencePenalties?: number;
  penalties?: number;
  latePenaltyRate?: number;
  accruals?: number;
  paidAmount?: number;
  paymentDate?: string;
  createdAt: string;
 updatedAt: string;
}

export interface IChildPayment {
  _id: ID;
  id?: ID;
  childId?: Child | string;
  userId?: User | string;
  period: string;
  amount: number;
  total: number;
  status: 'active' | 'overdue' | 'paid' | 'draft';
  latePenalties?: number;
  absencePenalties?: number;
  penalties?: number;
  latePenaltyRate?: number;
  accruals?: number;
  deductions?: number;
  comments?: string;
  paidAmount?: number;
  paymentDate?: string;
  paidAt?: string; // Дата оплаты
  createdAt: string;
  updatedAt: string;
}

export interface IAttendance {
  _id: ID;
  id?: ID;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'early_departure';
  notes?: string;
 createdAt: string;
 updatedAt: string;
}

// Добавляем недостающие типы
export interface LoginCredentials {
  phone: string;
  password: string;
}

export interface OTPResponse {
  success: boolean;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  user: User;
 token: string;
}

export interface ApiError {
  message: string;
  status?: number;
 data?: any;
  details?: any;
}

export type DelayFunction = (ms?: number) => Promise<void>;

export type ErrorHandler = (error: any, context?: string) => void;

export type StatusColor = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';


export const STATUS_COLORS: Record<string, StatusColor> = {
  // Статусы для смен
  'scheduled': 'default',
  'completed': 'success',
  'cancelled': 'error',
  'no_show': 'warning',
  'confirmed': 'info',
  'late': 'primary',
  // Статусы для посещений
  'checked_in': 'success',
  'checked_out': 'info',
  'on_break': 'warning',
  'overtime': 'secondary',
  'absent': 'error',
  'early_departure': 'warning',
  'present': 'success',
  // Статусы аренды и оплаты детей
  'active_rent': 'warning',
  'overdue_rent': 'error',
  'paid_rent': 'success',
  'draft_rent': 'default',
  'active_payment': 'warning',
  'overdue_payment': 'error',
  'paid_payment': 'success',
  'draft_payment': 'default',
  // Добавляем недостающие статусы
  'absent_shift': 'error',
  'checked_in_shift': 'success',
  'checked_out_shift': 'info',
  'on_break_shift': 'warning',
  'overtime_shift': 'secondary',
  'early_departure_shift': 'warning',
  'present_shift': 'success'
};


// Обновляем STATUS_TEXT
export const STATUS_TEXT: Record<string, string> = {
  // Статусы для смен
  'scheduled': 'Запланирована',
  'completed': 'Завершена',
  'cancelled': 'Отменена',
  'no_show': 'Не явка',
  'confirmed': 'Подтверждена',
  // Статусы для посещений
  'checked_in': 'Прибыл',
  'checked_out': 'Ушёл',
  'absent': 'Отсутствует',
  // Статусы аренды и оплаты детей
  'active_rent': 'Активна',
  'overdue_rent': 'Просрочена',
  'paid_rent': 'Оплачена',
  'draft_rent': 'Черновик',
  'active_payment': 'Активна',
  'overdue_payment': 'Просрочена',
  'paid_payment' : 'Оплачена',
  'draft_payment': 'Черновик',
  'paid' : 'Оплачено',
  'active' : 'Активно',

  // Добавляем недостающие статусы
  'absent_shift': 'Отсутствует',
  'checked_in_shift': 'Прибыл',
  'checked_out_shift': 'Ушёл'
};



export enum ShiftStatus {
  scheduled = 'scheduled',
  completed = 'completed',
  cancelled = 'cancelled',
  no_show = 'no_show',
  confirmed = 'confirmed',
  absent = 'absent',
  checked_in = 'checked_in',
  checked_out = 'checked_out'
}

export interface Shift {
  _id: ID;
  id?: ID;
  userId: string;
  staffId?: string; // Добавляем staffId как альтернативное поле для userId
  staffName?: string; // Добавляем staffName для отображения
  date: string;
  startTime: string;
  endTime: string;
  breakTime?: number;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  alternativeStaffId?: string; // Альтернативный сотрудник для отметки посещаемости
}

export interface ShiftFormData {
  userId: string;
  staffId?: string;
  staffName?: string;
  date: string;
  startTime: string;
  endTime: string;
  breakTime?: number;
  notes?: string;
  status?: ShiftStatus;
  alternativeStaffId?: string; // Альтернативный сотрудник для отметки посещаемости
}

export interface ShiftFilters {
  userId?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: ShiftStatus;
}



export interface UserFilters {
  role?: string;
  groupId?: string;
  active?: boolean;
  search?: string;
}