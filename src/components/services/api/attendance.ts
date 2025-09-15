import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Интерфейс для записи посещаемости
export interface AttendanceRecord {
  id?: string;
  userId: string;
  userName?: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'early-leave' | 'sick' | 'vacation';
  workHours?: number;
  notes?: string;
  location?: {
    latitude?: number;
    longitude?: number;
    address?: string;
  };
}

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 429 (Too Many Requests), wait and retry
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 2; // Default to 2 seconds
      
      console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);
  
  // Create a more detailed error object
  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  
  throw apiError;
};

// Add delay between requests to prevent rate limiting
const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get attendance records for a specific date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} userId - Optional user ID to filter records
 * @returns {Promise<AttendanceRecord[]>} List of attendance records
 */
export const getAttendanceRecords = async (startDate: string, endDate: string, userId?: string) => {
  try {
    console.log('Fetching attendance records from API...');
    
    const params: any = { startDate, endDate };
    if (userId) params.userId = userId;
    
    const response = await api.get('/attendance', { params });
    
    const records: AttendanceRecord[] = response.data.map((record: any) => ({
      id: record._id,
      userId: record.userId,
      userName: record.userName || 'Unknown User',
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      workHours: record.workHours,
      notes: record.notes,
      location: record.location
    }));
    
    console.log('Attendance records data:', records);
    return records;
  } catch (error) {
    console.error('Error in getAttendanceRecords:', error);
    return handleApiError(error, 'fetching attendance records');
  }
};

/**
 * Get a single attendance record by ID
 * @param {string} id - Attendance record ID
 * @returns {Promise<AttendanceRecord>} Attendance record data
 */
export const getAttendanceRecord = async (id: string) => {
  try {
    const response = await api.get(`/time-tracking/${id}`);
    
    const record: AttendanceRecord = {
      id: response.data._id,
      userId: response.data.userId,
      userName: response.data.userName || 'Unknown User',
      date: response.data.date,
      checkIn: response.data.checkIn,
      checkOut: response.data.checkOut,
      status: response.data.status,
      workHours: response.data.workHours,
      notes: response.data.notes,
      location: response.data.location
    };
    
    return record;
  } catch (error) {
    return handleApiError(error, `fetching attendance record ${id}`);
  }
};

/**
 * Create a new attendance record
 * @param {AttendanceRecord} record - Attendance record to create
 * @returns {Promise<AttendanceRecord>} Created attendance record
 */
export const createAttendanceRecord = async (record: AttendanceRecord) => {
  try {
    const response = await api.post('/attendance', {
      userId: record.userId,
      date: record.date,
      status: record.status,
      notes: record.notes
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'creating attendance record');
  }
};

/**
 * Update an existing attendance record
 * @param {string} id - Attendance record ID
 * @param {AttendanceRecord} record - Updated attendance record data
 * @returns {Promise<AttendanceRecord>} Updated attendance record
 */
export const updateAttendanceRecord = async (id: string, record: AttendanceRecord) => {
  try {
    const response = await api.put(`/time-tracking/${id}`, {
      userId: record.userId,
      date: record.date,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      notes: record.notes,
      location: record.location
    });
    
    const updatedRecord: AttendanceRecord = {
      id: response.data._id,
      userId: response.data.userId,
      userName: response.data.userName || 'Unknown User',
      date: response.data.date,
      checkIn: response.data.checkIn,
      checkOut: response.data.checkOut,
      status: response.data.status,
      workHours: response.data.workHours,
      notes: response.data.notes,
      location: response.data.location
    };
    
    return updatedRecord;
  } catch (error) {
    return handleApiError(error, `updating attendance record ${id}`);
  }
};

/**
 * Delete an attendance record
 * @param {string} id - Attendance record ID
 * @returns {Promise<void>}
 */
export const deleteAttendanceRecord = async (userId: string, date?: string) => {
  try {
    await api.delete('/attendance', { data: { userId, date } });
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting attendance record for user ${userId} on ${date}`);
  }
};

/**
 * Check in a user
 * @param {string} userId - User ID
 * @param {object} location - Location data (optional)
 * @returns {Promise<AttendanceRecord>} Updated attendance record
 */
export const checkIn = async (userId: string, location?: { latitude: number, longitude: number }) => {
  try {
    await delay(300);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.post('/attendance/check-in', { userId, location });
    
    // Получаем текущую дату и время
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    // Определяем статус (вовремя или опоздание)
    const hour = now.getHours();
    const minutes = now.getMinutes();
    const status = (hour > 8 || (hour === 8 && minutes > 15)) ? 'late' : 'present';
    
    // Моковый адрес на основе координат
    let address = 'Неизвестное местоположение';
    if (location) {
      address = 'ул. Достык 13, Астана'; // В реальном приложении здесь будет геокодирование
    }
    
    // Моковые данные для тестирования
    const mockRecord: AttendanceRecord = {
      id: Math.random().toString(36).substring(2, 15),
      userId,
      userName: 'Сотрудник', // В реальном приложении здесь будет имя пользователя
      date,
      checkIn: time,
      status,
      location: location ? {
        ...location,
        address
      } : undefined
    };
    
    return mockRecord;
  } catch (error) {
    return handleApiError(error, 'checking in');
  }
};

/**
 * Check out a user
 * @param {string} userId - User ID
 * @param {string} date - Date in YYYY-MM-DD format
 * @param {object} location - Location data (optional)
 * @returns {Promise<AttendanceRecord>} Updated attendance record
 */
export const checkOut = async (userId: string, date: string, location?: { latitude: number, longitude: number }) => {
  try {
    await delay(300);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.post('/attendance/check-out', { userId, date, location });
    
    // Получаем текущее время
    const now = new Date();
    const time = now.toTimeString().split(' ')[0].substring(0, 5); // HH:MM
    
    // Определяем статус (ранний уход или нормальный)
    const hour = now.getHours();
    const status = (hour < 17) ? 'early-leave' : 'present';
    
    // Моковый адрес на основе координат
    let address = 'Неизвестное местоположение';
    if (location) {
      address = 'ул. Достык 13, Астана'; // В реальном приложении здесь будет геокодирование
    }
    
    // Моковые данные для тестирования
    // В реальном приложении здесь будет обновление существующей записи
    const mockRecord: AttendanceRecord = {
      id: Math.random().toString(36).substring(2, 15),
      userId,
      userName: 'Сотрудник', // В реальном приложении здесь будет имя пользователя
      date,
      checkIn: '08:00', // Предполагаем, что сотрудник уже отметился утром
      checkOut: time,
      status,
      workHours: 8, // Примерное количество часов
      location: location ? {
        ...location,
        address
      } : undefined
    };
    
    return mockRecord;
  } catch (error) {
    return handleApiError(error, 'checking out');
  }
};

/**
 * Get attendance statistics for a specific date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} userId - Optional user ID to filter statistics
 * @returns {Promise<object>} Attendance statistics
 */
export const getAttendanceStatistics = async (startDate: string, endDate: string, userId?: string) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.get('/attendance/statistics', { params: { startDate, endDate, userId } });
    
    // Получаем записи посещаемости
    const records = await getAttendanceRecords(startDate, endDate, userId);
    
    // Вычисляем статистику
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const earlyLeaveDays = records.filter(r => r.status === 'early-leave').length;
    const sickDays = records.filter(r => r.status === 'sick').length;
    const vacationDays = records.filter(r => r.status === 'vacation').length;
    
    // Вычисляем общее количество рабочих часов
    const totalWorkHours = records.reduce((sum, record) => {
      return sum + (record.workHours || 0);
    }, 0);
    
    // Моковые данные для тестирования
    const statistics = {
      totalDays,
      presentDays,
      lateDays,
      absentDays,
      earlyLeaveDays,
      sickDays,
      vacationDays,
      totalWorkHours,
      attendanceRate: totalDays > 0 ? (presentDays / totalDays) * 100 : 0,
      punctualityRate: totalDays > 0 ? ((presentDays - lateDays) / totalDays) * 100 : 0
    };
    
    return statistics;
  } catch (error) {
    return handleApiError(error, 'fetching attendance statistics');
  }
};

/**
 * Generate mock attendance records for testing
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} userId - Optional user ID to filter records
 * @returns {AttendanceRecord[]} List of mock attendance records
 */

