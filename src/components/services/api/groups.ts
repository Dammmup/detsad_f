import axios from 'axios';
import { Group } from './types';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api`;

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
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
    
    console.log('📤 API запрос:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and rate limiting
api.interceptors.response.use(
  (response) => {
    console.log('✅ API ответ:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('❌ API ошибка:', error.response?.status, error.response?.data?.message || error.message);
    
    const originalRequest = error.config;
    
    if (error.response?.status === 401) {
      console.warn('🔒 Ошибка 401: Требуется авторизация');
      
      // Перенаправляем на страницу входа
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error('Требуется авторизация'));
    }
    
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
 * Get all groups
 * @returns {Promise<Group[]>} List of groups
 */
export const getGroups = async () => {
  try {
    console.log('Fetching groups from API...');
    
    const response = await api.get('/groups');
    
    const groups: Group[] = response.data.map((group: any) => ({
      id: group._id,
      name: group.name,
      description: group.description,
      teacher: group.teacher,
      isActive: group.isActive,
      maxStudents: group.maxStudents,
      ageGroup: group.ageGroup,
      createdBy: group.createdBy,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt
    }));
    
    console.log('Groups data:', groups);
    return groups;
  } catch (error) {
    console.error('Error in getGroups:', error);
    return handleApiError(error, 'fetching groups');
  }
};

/**
 * Get a single course (group) by ID
 * @param {string} id - Course/Group ID
 * @returns {Promise<Object>} Course/Group data
 */
export const getGroup = async (id: string) => {
  try {

    const response = await api.get(`/groups/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `fetching group ${id}`);
  }
};

/**
 * Create a new group
 * @param {Group} group - Group data to create
 * @returns {Promise<Group>} Created group
 */
export const createGroup = async (group: Group) => {
  try {
    console.log('Отправляю данные группы:', group);
    const response = await api.post('/groups', {
      name: group.name,
      description: group.description,
      teacher: group.teacher,
      isActive: group.isActive,
      maxStudents: group.maxStudents,
      ageGroup: group.ageGroup // Добавляем отсутствующее поле
    });
    console.log('Ответ сервера:', response.data);
    
    const createdGroup: Group = {
      id: response.data._id,
      name: response.data.name,
      description: response.data.description,
      teacher: response.data.teacher,
      isActive: response.data.isActive,
      ageGroup: response.data.ageGroup,
      createdBy: response.data.createdBy,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
      maxStudents: response.data.maxStudents
    };
    
    return createdGroup;
  } catch (error) {
    return handleApiError(error, 'creating group');
  }
};

/**
 * Update an existing course (group)
 * @param {string} id - Course/Group ID to update
 * @param {Object} groupData - Updated course/group data
 * @returns {Promise<Object>} Updated course/group data
 */
export const updateGroup = async (id: string, groupData: any) => {
  try {

    const response = await api.put(`/groups/${id}`, groupData);
    return response.data;
  } catch (error) {
    return handleApiError(error, `updating group ${id}`);
  }
};

/**
 * Delete a course (group)
 * @param {string} id - Course/Group ID to delete
 * @returns {Promise<Object>} Deletion result
 */
export const deleteGroup = async (id: string) => {
  try {

    const response = await api.delete(`/groups/delete/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `deleting group ${id}`);
  }
};

/**
 * Get teachers list for course/group assignment
 * @returns {Promise<Array>} List of teachers
 */
// Cache for teachers data
let cachedTeachers: any[] | null = null;

/**
 * Get list of available teachers for group assignment
 * @returns {Promise<Array>} List of teachers with id, name and email
 */
export const getTeachers = async () => {
  // Return cached data if available
  if (cachedTeachers) {
    return cachedTeachers;
  }

  try {

    // Get users with teacher role
    const response = await api.get('/users/teachers', {
      params: {
        role: 'teacher',
        fields: 'id,name,email,avatar'
      }
    });
    
    // Transform to match the expected format
    cachedTeachers = response.data.map((teacher: { _id: any; name: any; email: any; avatar: any; }) => ({
      id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      avatar: teacher.avatar
    }));
    
    return cachedTeachers;
  } catch (error) {
    // Fallback to empty array if endpoint is not available
    console.warn('Could not fetch teachers, using empty list as fallback');
    cachedTeachers = [];
    return cachedTeachers;
  }
};

