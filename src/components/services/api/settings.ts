import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}` || 'http://localhost:8080/api';

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Интерфейс для настроек детского сада
export interface KindergartenSettings {
  id?: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  director: string;
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: string[];
  timezone: string;
  language: string;
  currency: string;
}

// Интерфейс для настроек уведомлений
export interface NotificationSettings {
  id?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  lateArrivalAlert: boolean;
  absenceAlert: boolean;
  overtimeAlert: boolean;
  reportReminders: boolean;
}

// Интерфейс для настроек безопасности
export interface SecuritySettings {
  id?: string;
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

// Интерфейс для настроек геолокации
export interface GeolocationSettings {
  id?: string;
  enabled: boolean;
  radius: number; // в метрах
  coordinates: {
    latitude: number;
    longitude: number;
  };
  strictMode: boolean;
  allowedDevices: string[];
}

// Интерфейс для пользователя
export interface User {
  id?: string;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  permissions: string[];
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
 * Get kindergarten settings
 * @returns {Promise<KindergartenSettings>} Kindergarten settings
 */
export const getKindergartenSettings = async () => {
  try {
    console.log('Fetching kindergarten settings from API...');
    
    const response = await api.get('/settings/kindergarten');
    
    const settings: KindergartenSettings = {
      id: response.data._id,
      name: response.data.name,
      address: response.data.address,
      phone: response.data.phone,
      email: response.data.email,
      director: response.data.director,
      workingHours: response.data.workingHours,
      workingDays: response.data.workingDays,
      timezone: response.data.timezone,
      language: response.data.language,
      currency: response.data.currency
    };
    
    console.log('Kindergarten settings data:', settings);
    return settings;
  } catch (error) {
    console.error('Error in getKindergartenSettings:', error);
    return handleApiError(error, 'fetching kindergarten settings');
  }
};

/**
 * Update kindergarten settings
 * @param {KindergartenSettings} settings - Updated settings
 * @returns {Promise<KindergartenSettings>} Updated settings
 */
export const updateKindergartenSettings = async (settings: KindergartenSettings) => {
  try {
    const response = await api.put('/settings/kindergarten', {
      name: settings.name,
      address: settings.address,
      phone: settings.phone,
      email: settings.email,
      director: settings.director,
      workingHours: settings.workingHours,
      workingDays: settings.workingDays,
      timezone: settings.timezone,
      language: settings.language,
      currency: settings.currency
    });
    
    const updatedSettings: KindergartenSettings = {
      id: response.data._id,
      name: response.data.name,
      address: response.data.address,
      phone: response.data.phone,
      email: response.data.email,
      director: response.data.director,
      workingHours: response.data.workingHours,
      workingDays: response.data.workingDays,
      timezone: response.data.timezone,
      language: response.data.language,
      currency: response.data.currency
    };
    
    return updatedSettings;
  } catch (error) {
    return handleApiError(error, 'updating kindergarten settings');
  }
};

/**
 * Get notification settings
 * @returns {Promise<NotificationSettings>} Notification settings
 */
export const getNotificationSettings = async () => {
  try {
    const response = await api.get('/settings/notifications');
    
    const settings: NotificationSettings = {
      id: response.data._id,
      emailNotifications: response.data.emailNotifications,
      smsNotifications: response.data.smsNotifications,
      pushNotifications: response.data.pushNotifications,
      lateArrivalAlert: response.data.lateArrivalAlert,
      absenceAlert: response.data.absenceAlert,
      overtimeAlert: response.data.overtimeAlert,
      reportReminders: response.data.reportReminders
    };
    
    return settings;
  } catch (error) {
    return handleApiError(error, 'fetching notification settings');
  }
};

/**
 * Update notification settings
 * @param {NotificationSettings} settings - Updated settings
 * @returns {Promise<NotificationSettings>} Updated settings
 */
export const updateNotificationSettings = async (settings: NotificationSettings) => {
  try {
    const response = await api.put('/settings/notifications', settings);
    
    const updatedSettings: NotificationSettings = {
      id: response.data._id,
      emailNotifications: response.data.emailNotifications,
      smsNotifications: response.data.smsNotifications,
      pushNotifications: response.data.pushNotifications,
      lateArrivalAlert: response.data.lateArrivalAlert,
      absenceAlert: response.data.absenceAlert,
      overtimeAlert: response.data.overtimeAlert,
      reportReminders: response.data.reportReminders
    };
    
    return updatedSettings;
  } catch (error) {
    return handleApiError(error, 'updating notification settings');
  }
};

/**
 * Get security settings
 * @returns {Promise<SecuritySettings>} Security settings
 */
export const getSecuritySettings = async () => {
  try {
    await delay(300);
    
    // Моковые данные для тестирования
    const mockSettings: SecuritySettings = {
      id: '1',
      passwordPolicy: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false
      },
      sessionTimeout: 60, // 1 час
      twoFactorAuth: false,
      ipWhitelist: [],
      maxLoginAttempts: 5
    };
    
    return mockSettings;
  } catch (error) {
    return handleApiError(error, 'fetching security settings');
  }
};

/**
 * Update security settings
 * @param {SecuritySettings} settings - Updated settings
 * @returns {Promise<SecuritySettings>} Updated settings
 */
export const updateSecuritySettings = async (settings: SecuritySettings) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.put('/settings/security', settings);
    
    // Моковые данные для тестирования
    const mockSettings: SecuritySettings = {
      ...settings,
      id: settings.id || '1'
    };
    
    return mockSettings;
  } catch (error) {
    return handleApiError(error, 'updating security settings');
  }
};

/**
 * Get geolocation settings
 * @returns {Promise<GeolocationSettings>} Geolocation settings
 */
export const getGeolocationSettings = async () => {
  try {
    await delay(300);
    
    // Моковые данные для тестирования
    const mockSettings: GeolocationSettings = {
      id: '1',
      enabled: true,
      radius: 100, // 100 метров
      coordinates: {
        latitude: 51.1605,
        longitude: 71.4704
      },
      strictMode: false,
      allowedDevices: []
    };
    
    return mockSettings;
  } catch (error) {
    return handleApiError(error, 'fetching geolocation settings');
  }
};

/**
 * Update geolocation settings
 * @param {GeolocationSettings} settings - Updated settings
 * @returns {Promise<GeolocationSettings>} Updated settings
 */
export const updateGeolocationSettings = async (settings: GeolocationSettings) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.put('/settings/geolocation', settings);
    
    // Моковые данные для тестирования
    const mockSettings: GeolocationSettings = {
      ...settings,
      id: settings.id || '1'
    };
    
    return mockSettings;
  } catch (error) {
    return handleApiError(error, 'updating geolocation settings');
  }
};

/**
 * Get all users
 * @returns {Promise<User[]>} List of users
 */
export const getAllUsers = async () => {
  try {
    await delay(300);
    
    // Моковые данные для тестирования
    const mockUsers: User[] = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@solnyshko.kz',
        fullName: 'Администратор Системы',
        role: 'admin',
        isActive: true,
        lastLogin: '2025-09-07T10:30:00',
        createdAt: '2025-01-01T00:00:00',
        permissions: ['all']
      },
      {
        id: '2',
        username: 'manager1',
        email: 'manager@solnyshko.kz',
        fullName: 'Иванова Анна Петровна',
        role: 'manager',
        isActive: true,
        lastLogin: '2025-09-07T09:15:00',
        createdAt: '2025-01-15T00:00:00',
        permissions: ['staff_management', 'reports', 'schedule']
      },
      {
        id: '3',
        username: 'staff1',
        email: 'staff1@solnyshko.kz',
        fullName: 'Петрова Мария Ивановна',
        role: 'staff',
        isActive: true,
        lastLogin: '2025-09-07T08:00:00',
        createdAt: '2025-02-01T00:00:00',
        permissions: ['attendance', 'schedule_view']
      }
    ];
    
    return mockUsers;
  } catch (error) {
    return handleApiError(error, 'fetching users');
  }
};

/**
 * Create a new user
 * @param {User} user - User data to create
 * @returns {Promise<User>} Created user
 */
export const createUser = async (user: User) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.post('/settings/users', user);
    
    // Моковые данные для тестирования
    const mockUser: User = {
      ...user,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString()
    };
    
    return mockUser;
  } catch (error) {
    return handleApiError(error, 'creating user');
  }
};

/**
 * Update an existing user
 * @param {string} id - User ID
 * @param {User} user - Updated user data
 * @returns {Promise<User>} Updated user
 */
export const updateUser = async (id: string, user: User) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.put(`/settings/users/${id}`, user);
    
    // Моковые данные для тестирования
    const mockUser: User = {
      ...user,
      id
    };
    
    return mockUser;
  } catch (error) {
    return handleApiError(error, `updating user ${id}`);
  }
};

/**
 * Delete a user
 * @param {string} id - User ID
 * @returns {Promise<void>}
 */
export const deleteUser = async (id: string) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.delete(`/settings/users/${id}`);
    
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting user ${id}`);
  }
};
