import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

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
    checkIn?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    checkOut?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  notes?: string;
  markedBy: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StaffAttendanceFilters {
  staffId?: string;
  groupId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  shiftType?: string;
}

export interface StaffAttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  totalEarlyLeaveMinutes: number;
  averageWorkHours: number;
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

// Get staff attendance records
export const getStaffAttendance = async (filters: StaffAttendanceFilters = {}): Promise<StaffAttendanceRecord[]> => {
  try {
    const response = await axios.get(`${API_URL}/staff-attendance`, {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching staff attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения посещаемости сотрудников');
  }
};

// Save single staff attendance record
export const saveStaffAttendance = async (record: Partial<StaffAttendanceRecord>): Promise<StaffAttendanceRecord> => {
  try {
    const response = await axios.post(`${API_URL}/staff-attendance`, record);
    return response.data;
  } catch (error: any) {
    console.error('Error saving staff attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка сохранения посещаемости сотрудника');
  }
};

// Bulk save staff attendance records
export const bulkSaveStaffAttendance = async (records: Partial<StaffAttendanceRecord>[]): Promise<BulkSaveResult> => {
  try {
    const response = await axios.post(`${API_URL}/staff-attendance/bulk`, { records });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk saving staff attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка массового сохранения посещаемости');
  }
};

// Check-in
export const checkIn = async (location?: { latitude: number; longitude: number; address?: string }): Promise<{ message: string; attendance: StaffAttendanceRecord; lateMinutes: number }> => {
  try {
    const response = await axios.post(`${API_URL}/staff-attendance/check-in`, { location });
    return response.data;
  } catch (error: any) {
    console.error('Error during check-in:', error);
    throw new Error(error.response?.data?.error || 'Ошибка отметки прихода');
  }
};

// Check-out
export const checkOut = async (location?: { latitude: number; longitude: number; address?: string }): Promise<{
  message: string;
  attendance: StaffAttendanceRecord;
  overtimeMinutes: number;
  earlyLeaveMinutes: number;
  workHours: number;
}> => {
  try {
    const response = await axios.post(`${API_URL}/staff-attendance/check-out`, { location });
    return response.data;
  } catch (error: any) {
    console.error('Error during check-out:', error);
    throw new Error(error.response?.data?.error || 'Ошибка отметки ухода');
  }
};

// Get attendance statistics
export const getStaffAttendanceStats = async (filters: StaffAttendanceFilters = {}): Promise<StaffAttendanceStats> => {
  try {
    const response = await axios.get(`${API_URL}/staff-attendance/stats`, {
      params: filters
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения статистики');
  }
};

// Delete attendance record
export const deleteStaffAttendance = async (id: string): Promise<void> => {
  try {
    await axios.delete(`${API_URL}/staff-attendance/${id}`);
  } catch (error: any) {
    console.error('Error deleting staff attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка удаления записи');
  }
};

// Debug function to check database status
export const debugStaffAttendance = async (): Promise<any> => {
  try {
    const response = await axios.get(`${API_URL}/staff-attendance/debug`);
    console.log('🔍 Staff attendance debug info:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Debug error:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения debug информации');
  }
};

// Helper functions for time calculations
export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}ч ${mins}м`;
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

// Helper to get current time in HH:MM format
export const getCurrentTime = (): string => {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
};

// Helper to check if user can check in/out today
export const canCheckIn = (record?: StaffAttendanceRecord): boolean => {
  // Разрешаем отметку прихода, если нет записи или если запись существует, но еще не отмечен приход
  return !record || !record.actualStart;
};

export const canCheckOut = (record?: StaffAttendanceRecord): boolean => {
  // Разрешаем отметку ухода, если есть запись и отмечен приход, но еще не отмечен уход
  return record ? !!record.actualStart && !record.actualEnd : false;
};

// Helper to get status color for UI
export const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'info';
    case 'late':
      return 'warning';
    case 'no_show':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

// Helper to get status text in Russian
export const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'scheduled': 'Запланировано',
    'in_progress': 'В процессе',
    'completed': 'Завершено',
    'cancelled': 'Отменено',
    'no_show': 'Не явился',
    'late': 'Опоздание'
  };
  return statusMap[status] || status;
};

// Helper to get shift type text in Russian
export const getShiftTypeText = (shiftType: string): string => {
  const shiftMap: { [key: string]: string } = {
    '': 'Утренняя',
  
    'full': 'Полная',
    'overtime': 'Сверхурочная'
  };
  return shiftMap[shiftType] || shiftType;
};
