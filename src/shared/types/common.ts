

import Children from '../../modules/children/services/children';

export type ID = string;

export enum UserRole {
  admin = 'admin',
  manager = 'manager',
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
  substitute = 'substitute',
  tenant = 'tenant',
  speech_therapist = 'speech_therapist',
}

export interface Group {
  _id: ID;
  id?: ID;
  name: string;
  description?: string;
  childrenCount?: number;
  teacher?: string;
  teacherId?: string;
  isActive?: boolean;
  maxStudents?: number;
  ageGroup?: string[];
  createdAt?: string;
  updatedAt?: string;
  children?: Child[];
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
  staffId?: string;
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
  paymentAmount?: number;
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

  parentName?: string;
  parentPhone?: string;
  email?: string;
  initialPassword?: string;
  salary?: number;
  salaryType?: 'shift' | 'month' | 'day';
  shiftRate?: number;


  staffId?: string;
  staffName?: string;
  tenant?: boolean;
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
  period: {
    start: string;
    end: string;
  };
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
  paidAt?: string;
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

export type StatusColor =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning';

export const STATUS_COLORS: Record<string, StatusColor> = {

  scheduled: 'default',
  completed: 'success',
  late: 'primary',
  pending_approval: 'info',
  in_progress: 'warning',
  checked_out: 'success',
  checked_in: 'warning',
  on_break: 'warning',
  overtime: 'secondary',
  absent: 'error',
  early_departure: 'warning',
  present: 'success',
  no_clock_in: 'error',
  no_clock_out: 'error',
  early_leave: 'warning',
  late_arrival: 'warning',

  active_rent: 'warning',
  overdue_rent: 'error',
  paid_rent: 'success',
  draft_rent: 'default',
  active_payment: 'warning',
  overdue_payment: 'error',
  paid_payment: 'success',
  draft_payment: 'default',

  absent_shift: 'error',
  on_break_shift: 'warning',
  overtime_shift: 'secondary',
  early_departure_shift: 'warning',
  present_shift: 'success',
};


export const STATUS_TEXT: Record<string, string> = {
  scheduled: 'Запланирована',
  completed: 'Завершена',
  checked_in: 'На работе',
  checked_out: 'Ушел',
  late: 'Опоздание',
};


export enum ShiftStatus {
  scheduled = 'scheduled',
  completed = 'completed',
  absent = 'absent',
  present = 'present',
  in_progress = 'in_progress',
  pending_approval = 'pending_approval',
  late = 'late',
  no_clock_in = 'no_clock_in',
  no_clock_out = 'no_clock_out',
  checked_in = 'checked_in',
  checked_out = 'checked_out',
  early_leave = 'early_leave',
  late_arrival = 'late_arrival',
}

export interface Shift {
  _id: ID;
  id?: ID;
  userId: string;
  staffId?: string;
  staffName?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  status: ShiftStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  alternativeStaffId?: string;
}

export interface ShiftFormData {
  userId: string;
  staffId?: string;
  staffName?: string;
  date: string;
  notes?: string;
  status?: ShiftStatus;
  alternativeStaffId?: string;
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


export const ROLE_TRANSLATIONS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  director: 'Директор',
  teacher: 'Воспитатель',
  assistant: 'Помощник воспитателя',
  psychologist: 'Психолог',
  speech_therapist: 'Логопед',
  music_teacher: 'Музыкальный руководитель',
  physical_teacher: 'Инструктор по физкультуре',
  nurse: 'Медсестра',
  doctor: 'Врач',
  cook: 'Повар',
  cleaner: 'Уборщица',
  security: 'Охранник',
  maintenance: 'Завхоз',
  staff: 'Сотрудник',
  substitute: 'Подменный сотрудник',
  intern: 'Стажер',
  tenant: 'Арендатор',
};


export const EXTERNAL_ROLES: UserRole[] = [
  UserRole.tenant,
  UserRole.speech_therapist,
];

export const STAFF_ROLES: UserRole[] = Object.values(UserRole).filter(
  (role) => !EXTERNAL_ROLES.includes(role) && role !== UserRole.admin && role !== UserRole.child && role !== UserRole.parent
);
