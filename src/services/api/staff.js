import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

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
    if (token) {
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
const handleApiError = (error, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Ошибка ${context}:`, errorMessage);
  
  // Create a more detailed error object
  const apiError = new Error(`Ошибка ${context}: ${errorMessage}`);
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  
  throw apiError;
};

/**
 * Get all users (staff)
 * @returns {Promise<Array>} List of users
 */
// Add delay between requests to prevent rate limiting
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all staff members with rate limiting protection
 */
export const getStaff = async () => {
  try {
    await delay(300); // Add small delay between requests
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'при получении списка пользователей');
  }
};

/**
 * Get user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object>} User data
 */
export const getStaffMember = async (id) => {
  try {
    await delay(300);
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `при получении данных пользователя (ID: ${id})`);
  }
};

/**
 * Create a new user (staff member)
 * @param {Object} userData - New user data
 * @returns {Promise<Object>} Created user
 */
export const createStaff = async (userData) => {
  try {
    await delay(500); // Slightly longer delay for write operations
    const response = await api.post('/users', userData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'при создании пользователя');
  }
};

/**
 * Update user data
 * @param {string} id - User ID
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateStaff = async (id, userData) => {
  try {
    await delay(500);
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  } catch (error) {
    return handleApiError(error, `при обновлении данных пользователя (ID: ${id})`);
  }
};

/**
 * Delete user
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
export const deleteStaff = async (id) => {
  try {
    await delay(500);
    await api.delete(`/users/${id}`);
  } catch (error) {
    return handleApiError(error, `при удалении пользователя (ID: ${id})`);
  }
};

/**
 * Get user roles
 * @returns {Promise<Array>} List of roles
 */
// Cache for roles to avoid repeated API calls
let cachedRoles = null;

// Function to clear roles cache
export const clearRolesCache = () => {
  cachedRoles = null;
};

export const getStaffRoles = async () => {
  // Temporarily disable cache for testing new roles
  // if (cachedRoles) {
  //   return cachedRoles;
  // }

  try {
    await delay(300);
    const response = await api.get('/users/roles');
    cachedRoles = response.data;
    return cachedRoles;
  } catch (error) {
    // If roles endpoint doesn't exist or fails, use default roles for kindergarten
    console.warn('Не удалось получить роли с сервера, используются роли по умолчанию');
    cachedRoles = [
      { id: 'admin', name: 'Администратор' },
      { id: 'teacher', name: 'Воспитатель' },
      { id: 'assistant', name: 'Помощник воспитателя' },
      { id: 'nurse', name: 'Медсестра' },
      { id: 'cook', name: 'Повар' },
      { id: 'cleaner', name: 'Уборщица' },
      { id: 'security', name: 'Охранник' },
      { id: 'psychologist', name: 'Психолог' },
      { id: 'music_teacher', name: 'Музыкальный руководитель' },
      { id: 'physical_teacher', name: 'Инструктор по физкультуре' }
    ];
    return cachedRoles;
  }
};
