import axios from 'axios';

let baseUrl = process.env.REACT_APP_API_URL || 'https://detsad-b.onrender.com';
// Добавляем '' к базовому URL, если его нет
if (!baseUrl.endsWith('')) {
  baseUrl = baseUrl.replace(/\/$/, '') + '';
}
const REACT_APP_API_URL = baseUrl;

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
  yandexApiKey?: string; // API key for Yandex services
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
export const api = axios.create({
  baseURL: REACT_APP_API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  }
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
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
      workingHours: {
        start: response.data.workingHours?.start || '08:00',
        end: response.data.workingHours?.end || '18:00'
      },
      workingDays: response.data.workingDays || [],
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
      workingHours: {
        start: response.data.workingHours?.start || '08:00',
        end: response.data.workingHours?.end || '18:00'
      },
      workingDays: response.data.workingDays || [],
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
      emailNotifications: response.data.emailNotifications ?? true,
      smsNotifications: response.data.smsNotifications ?? false,
      pushNotifications: response.data.pushNotifications ?? true,
      lateArrivalAlert: response.data.lateArrivalAlert ?? true,
      absenceAlert: response.data.absenceAlert ?? true,
      overtimeAlert: response.data.overtimeAlert ?? true,
      reportReminders: response.data.reportReminders ?? true
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
      emailNotifications: response.data.emailNotifications ?? true,
      smsNotifications: response.data.smsNotifications ?? false,
      pushNotifications: response.data.pushNotifications ?? true,
      lateArrivalAlert: response.data.lateArrivalAlert ?? true,
      absenceAlert: response.data.absenceAlert ?? true,
      overtimeAlert: response.data.overtimeAlert ?? true,
      reportReminders: response.data.reportReminders ?? true
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
  const response = await api.get('/settings/security');
    
    const settings: SecuritySettings = {
      id: response.data._id,
      passwordPolicy: {
        minLength: response.data.passwordPolicy?.minLength ?? 8,
        requireUppercase: response.data.passwordPolicy?.requireUppercase ?? true,
        requireLowercase: response.data.passwordPolicy?.requireLowercase ?? true,
        requireNumbers: response.data.passwordPolicy?.requireNumbers ?? true,
        requireSpecialChars: response.data.passwordPolicy?.requireSpecialChars ?? false
      },
      sessionTimeout: response.data.sessionTimeout ?? 60,
      twoFactorAuth: response.data.twoFactorAuth ?? false,
      ipWhitelist: response.data.ipWhitelist || [],
      maxLoginAttempts: response.data.maxLoginAttempts ?? 5
    };
    
    return settings;
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
  const response = await api.put('/settings/security', settings);
    
    const updatedSettings: SecuritySettings = {
      id: response.data._id,
      passwordPolicy: {
        minLength: response.data.passwordPolicy?.minLength ?? 8,
        requireUppercase: response.data.passwordPolicy?.requireUppercase ?? true,
        requireLowercase: response.data.passwordPolicy?.requireLowercase ?? true,
        requireNumbers: response.data.passwordPolicy?.requireNumbers ?? true,
        requireSpecialChars: response.data.passwordPolicy?.requireSpecialChars ?? false
      },
      sessionTimeout: response.data.sessionTimeout ?? 60,
      twoFactorAuth: response.data.twoFactorAuth ?? false,
      ipWhitelist: response.data.ipWhitelist || [],
      maxLoginAttempts: response.data.maxLoginAttempts ?? 5
    };
    
    return updatedSettings;
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
  const response = await api.get('/settings/geolocation');
    
    const settings: GeolocationSettings = {
      id: response.data._id,
      enabled: response.data.enabled ?? false,
      radius: response.data.radius ?? 100,
      coordinates: {
        latitude: response.data.coordinates?.latitude ?? 0,
        longitude: response.data.coordinates?.longitude ?? 0
      },
      yandexApiKey: response.data.yandexApiKey,
      strictMode: response.data.strictMode ?? false,
      allowedDevices: response.data.allowedDevices || []
    };
    
    return settings;
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
  const response = await api.put('/settings/geolocation', {
      ...settings
    });
    
    const updatedSettings: GeolocationSettings = {
      id: response.data._id,
      enabled: response.data.enabled ?? false,
      radius: response.data.radius ?? 100,
      coordinates: {
        latitude: response.data.coordinates?.latitude ?? 0,
        longitude: response.data.coordinates?.longitude ?? 0
      },
      yandexApiKey: response.data.yandexApiKey,
      strictMode: response.data.strictMode ?? false,
      allowedDevices: response.data.allowedDevices || []
    };
    
    return updatedSettings;
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
  const response = await api.get('/users');
    
    const users: User[] = response.data.map((user: any) => ({
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.active,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      permissions: [] // В реальном приложении здесь будут реальные разрешения
    }));
    
    return users;
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
  const response = await api.post('/users', user);
    
    const newUser: User = {
      id: response.data._id,
      username: response.data.username,
      email: response.data.email,
      fullName: response.data.fullName,
      role: response.data.role,
      isActive: response.data.active,
      lastLogin: response.data.lastLogin,
      createdAt: response.data.createdAt,
      permissions: []
    };
    
    return newUser;
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
  const response = await api.put(`/users/${id}`, user);
    
    const updatedUser: User = {
      id: response.data._id,
      username: response.data.username,
      email: response.data.email,
      fullName: response.data.fullName,
      role: response.data.role,
      isActive: response.data.active,
      lastLogin: response.data.lastLogin,
      createdAt: response.data.createdAt,
      permissions: []
    };
    
    return updatedUser;
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
  await api.delete(`/users/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting user ${id}`);
  }
};
