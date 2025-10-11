import axios from 'axios';

const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}/` || 'https://detsad-b.onrender.com';

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Интерфейс для смены
export interface Shift {
  id?: string;
  userId: string;
  userName?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string; // regular, overtime, sick, vacation
  notes?: string;
  status?: string; // planned, completed, cancelled
  groupId?: string;
  shiftType?: string;
}

// Create axios instance with base config
const api = axios.create({
  baseURL: REACT_APP_API_URL,
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

/**
 * Get all schedules
 * @param {string} groupId - Optional group ID
 * @param {string} userId - Optional user ID
 * @returns {Promise<Shift[]>} List of schedules
 */
export const getSchedules = async (groupId?: string, userId?: string) => {
  try {
    console.log('Fetching schedules from API...');
    const params: any = {};
    if (groupId) params.groupId = groupId;
    if (userId) params.userId = userId;
    const response = await api.get('/schedule', { params });
    const schedules: Shift[] = response.data.map((schedule: any) => ({
      id: schedule._id,
      groupId: schedule.groupId,
      userId: schedule.userId,
      date: schedule.date,
      shiftType: schedule.shiftType,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      notes: schedule.notes
    }));
    console.log('Schedules data:', schedules);
    return schedules;
  } catch (error) {
    console.error('Error in getSchedules:', error);
    return handleApiError(error, 'fetching schedules');
  }
};

/**
 * Get a single shift by ID
 * @param {string} id - Shift ID
 * @returns {Promise<Shift>} Shift data
 */
export const getShift = async (id: string) => {
  try {
    const response = await api.get(`/shifts/${id}`);
    const shift: Shift = {
      id: response.data._id,
      userId: response.data.userId,
      userName: response.data.userName,
      date: response.data.date,
      startTime: response.data.startTime,
      endTime: response.data.endTime,
      type: response.data.type,
      notes: response.data.notes,
      status: response.data.status
    };
    return shift;
  } catch (error) {
    return handleApiError(error, `fetching shift ${id}`);
  }
};

/**
 * Create a new schedule record
 * @param {Shift} record - Schedule record to create
 * @returns {Promise<Shift>} Created record
 */
export const createSchedule = async (record: Shift) => {
  try {
    const response = await api.post('/schedule', {
      groupId: record.groupId,
      userId: record.userId,
      date: record.date,
      shiftType: record.shiftType,
      startTime: record.startTime,
      endTime: record.endTime,
      notes: record.notes
    });
    const createdRecord: Shift = {
      id: response.data._id,
      groupId: response.data.groupId,
      userId: response.data.userId,
      date: response.data.date,
      shiftType: response.data.shiftType,
      startTime: response.data.startTime,
      endTime: response.data.endTime,
      notes: response.data.notes,
      type: response.data.type,
    };
    return createdRecord;
  } catch (error) {
    return handleApiError(error, 'creating schedule');
  }
};

/**
 * Update an existing schedule record
 * @param {string} id - Schedule record ID
 * @param {Shift} record - Updated record data
 * @returns {Promise<Shift>} Updated record
 */
export const updateSchedule = async (id: string, record: Shift) => {
  try {
    const response = await api.put(`/schedule/${id}`, {
      groupId: record.groupId,
      userId: record.userId,
      date: record.date,
      shiftType: record.shiftType,
      startTime: record.startTime,
      endTime: record.endTime,
      notes: record.notes
    });
    const updatedRecord: Shift = {
      id: response.data._id,
      groupId: response.data.groupId,
      userId: response.data.userId,
      date: response.data.date,
      shiftType: response.data.shiftType,
      startTime: response.data.startTime,
      endTime: response.data.endTime,
      notes: response.data.notes,
      type: response.data.type,
    };
    return updatedRecord;
  } catch (error) {
    return handleApiError(error, `updating schedule ${id}`);
  }
};

/**
 * Delete a schedule record
 * @param {string} id - Schedule record ID
 * @returns {Promise<void>}
 */
export const deleteSchedule = async (id: string) => {
  try {
    await api.delete(`/schedule/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting schedule ${id}`);
  }
};

/**
 * Get shift types
 * @returns {Promise<string[]>} List of shift types
 */
export const getShiftTypes = async () => {
  try {
    
    // Моковые данные для тестирования
    const shiftTypes = [
      'regular', // Обычная смена
      'overtime', // Сверхурочная работа
      'sick', // Больничный
      'vacation' // Отпуск
    ];
    
    return shiftTypes;
  } catch (error) {
    return handleApiError(error, 'fetching shift types');
  }
};

/**
 * Generate mock shifts for testing
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} userId - Optional user ID to filter shifts
 * @returns {Shift[]} List of mock shifts
 */

