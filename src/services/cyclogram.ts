import axios from 'axios';

const REACT_APP_API_URL = `${process.env.REACT_APP_API_URL}` || 'https://detsad-b.onrender.com';

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Интерфейс для активности в циклограмме
export interface CyclogramActivity {
  id?: string;
  name: string;
  description?: string;
  duration: number; // в минутах
  type: 'educational' | 'physical' | 'creative' | 'rest' | 'meal' | 'hygiene' | 'outdoor';
  ageGroup: string; // например: "3-4", "4-5", "5-6"
  materials?: string[];
  goals?: string[];
  methods?: string[];
}

// Интерфейс для временного слота в циклограмме
export interface CyclogramTimeSlot {
  id?: string;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  activity: CyclogramActivity;
  dayOfWeek: number; // 1-7 (понедельник-воскресенье)
  groupId?: string;
  teacherId?: string;
  notes?: string;
}

// Интерфейс для недельной циклограммы
export interface WeeklyCyclogram {
  id?: string;
  title: string;
  description?: string;
  ageGroup: string;
  groupId: string;
  teacherId: string;
  weekStartDate: string; // YYYY-MM-DD
  timeSlots: CyclogramTimeSlot[];
  status: 'draft' | 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

// Интерфейс для шаблона циклограммы
export interface CyclogramTemplate {
  id?: string;
  name: string;
  description?: string;
  ageGroup: string;
  timeSlots: Omit<CyclogramTimeSlot, 'id' | 'groupId' | 'teacherId'>[];
  isDefault: boolean;
  createdAt?: string;
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
    const token = localStorage.getItem('auth_token');
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

/**
 * Get all cyclograms
 * @param {string} groupId - Optional group ID to filter
 * @returns {Promise<WeeklyCyclogram[]>} List of cyclograms
 */
export const getCyclograms = async (groupId?: string) => {
  try {
    const params: any = {};
    if (groupId) params.groupId = groupId;
  const response = await api.get('/cyclogram', { params });
    const cyclograms: WeeklyCyclogram[] = response.data.map((item: any) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      ageGroup: item.ageGroup,
      groupId: item.groupId,
      teacherId: item.teacherId,
      weekStartDate: item.weekStartDate,
      timeSlots: item.timeSlots,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));
    return cyclograms;
  } catch (error) {
    return handleApiError(error, 'fetching cyclograms');
  }
};

/**
 * Get a single cyclogram by ID
 * @param {string} id - Cyclogram ID
 * @returns {Promise<WeeklyCyclogram>} Cyclogram data
 */
export const getCyclogram = async (id: string) => {
  try {
  const response = await api.get(`/cyclogram/${id}`);
    const cyclogram: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    return cyclogram;
  } catch (error) {
    return handleApiError(error, `fetching cyclogram ${id}`);
  }
};

/**
 * Create a new cyclogram
 * @param {WeeklyCyclogram} cyclogram - Cyclogram data to create
 * @returns {Promise<WeeklyCyclogram>} Created cyclogram
 */
export const createCyclogram = async (cyclogram: WeeklyCyclogram) => {
  try {
  const response = await api.post('/cyclogram', cyclogram);
    const created: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    return created;
  } catch (error) {
    return handleApiError(error, 'creating cyclogram');
  }
};

/**
 * Update an existing cyclogram
 * @param {string} id - Cyclogram ID
 * @param {WeeklyCyclogram} cyclogram - Updated cyclogram data
 * @returns {Promise<WeeklyCyclogram>} Updated cyclogram
 */
export const updateCyclogram = async (id: string, cyclogram: WeeklyCyclogram) => {
  try {
  const response = await api.put(`/cyclogram/${id}`, cyclogram);
    const updated: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    return updated;
  } catch (error) {
    return handleApiError(error, `updating cyclogram ${id}`);
  }
};

/**
 * Delete a cyclogram
 * @param {string} id - Cyclogram ID
 * @returns {Promise<void>}
 */
export const deleteCyclogram = async (id: string) => {
  try {
  await api.delete(`/cyclogram/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting cyclogram ${id}`);
  }
};

/**
 * Get cyclogram templates
 * @param {string} ageGroup - Optional age group to filter
 * @returns {Promise<CyclogramTemplate[]>} List of templates
 */
export const getCyclogramTemplates = async (ageGroup?: string) => {
  try {
    const params: any = {};
    if (ageGroup) params.ageGroup = ageGroup;
    
  const response = await api.get('/cyclogram/templates', { params });
    const templates: CyclogramTemplate[] = response.data.map((item: any) => ({
      id: item._id,
      name: item.name,
      description: item.description,
      ageGroup: item.ageGroup,
      timeSlots: item.timeSlots,
      isDefault: item.isDefault,
      createdAt: item.createdAt
    }));
    
    return templates;
  } catch (error) {
    return handleApiError(error, 'fetching cyclogram templates');
  }
};

/**
 * Create cyclogram from template
 * @param {string} templateId - Template ID
 * @param {object} params - Parameters for creating cyclogram
 * @returns {Promise<WeeklyCyclogram>} Created cyclogram
 */
export const createCyclogramFromTemplate = async (
 templateId: string,
  params: {
    title: string;
    groupId: string;
    teacherId: string;
    weekStartDate: string;
  }
) => {
 try {
  const response = await api.post(`/cyclogram/templates/${templateId}/create`, params);
    
    const createdCyclogram: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    };
    
    return createdCyclogram;
  } catch (error) {
    return handleApiError(error, 'creating cyclogram from template');
  }
};

/**
 * Generate mock cyclograms for testing
 */
// const generateMockCyclograms = (): WeeklyCyclogram[] => {
//   return [
//     {
//       id: '1',
//       title: 'Циклограмма для средней группы (4-5 лет) - Неделя 1',
//       description: 'Стандартная циклограмма для детей 4-5 лет согласно требованиям МОН РК',
//       ageGroup: '4-5',
//       groupId: '1',
//       teacherId: '2',
//       weekStartDate: '2025-09-08',
//       timeSlots: generateMockTimeSlots(),
//       status: 'active',
//       createdAt: '2025-09-01T00:00:00',
//       updatedAt: '2025-09-07T00:00:00'
//     },
//     {
//       id: '2',
//       title: 'Циклограмма для старшей группы (5-6 лет) - Неделя 1',
//       description: 'Циклограмма для подготовительной группы',
//       ageGroup: '5-6',
//       groupId: '2',
//       teacherId: '3',
//       weekStartDate: '2025-09-08',
//       timeSlots: generateMockTimeSlots(),
//       status: 'active',
//       createdAt: '2025-09-01T00:00:00',
//       updatedAt: '2025-09-07T00:00:00'
//     }
//   ];
// };

// Удалены функции генерации моковых данных, так как теперь используются реальные API вызовы
