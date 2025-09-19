// Общие типы и интерфейсы для всего приложения

// Интерфейсы для пользователей
export interface User {
  id: string;
  _id?: string;
  fullName: string;
  role?: string;
  phone?: string;
  email?: string;
  active?: boolean;
  type: 'adult' | 'child';
  isVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  iin?: string;
  groupId?: string;
  parentPhone?: string;
  parentName?: string;
  birthday?: string;
  notes?: string;
  salary?: number;
  initialPassword?: string;
  fines?: Array<{
    amount: number;
    reason: string;
    date: string;
    type: 'late' | 'other';
    approved: boolean;
    createdBy: string;
    notes?: string;
  }>;
  totalFines?: number;
  personalCode?: string;
  avatarUrl?: string;
}

// Интерфейсы для групп
export interface Group {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  teacher: {id?: string, _id?: string} | string;
  isActive: boolean;
  maxStudents?: number;
  ageGroup: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Интерфейсы для смен
export interface Shift {
  id: string;
  _id?: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'full' | 'day_off' | 'vacation' | 'sick_leave';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'confirmed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Интерфейсы для посещаемости
export interface StaffAttendanceRecord {
  _id?: string;
  staffId: string;
  groupId?: string;
  date: string;
  shiftType:  'full' | 'overtime';
  startTime: string;
  endTime: string;
  actualStart?: string;
  actualEnd?: string;
  breakTime?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'late';
  lateMinutes?: number;
  overtimeMinutes?: number;
  earlyLeaveMinutes?: number;
  location?: {
    checkIn?: string;
    checkOut?: string;
  };
  notes?: string;
  markedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

// Интерфейсы для статистики
export interface StaffAttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  totalEarlyLeaveMinutes: number;
  averageWorkHours: number;
}

// Интерфейсы для фильтров
export interface StaffAttendanceFilters {
  staffId?: string;
  groupId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  shiftType?: string;
}

export interface ShiftFilters {
  staffId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  _sort?: string;
  _order?: 'asc' | 'desc';
}

export interface BulkSaveResult {
  success: number;
  errorCount: number;
  errors: Array<{
    record: any;
    error: string;
  }>;
  records: StaffAttendanceRecord[];
}