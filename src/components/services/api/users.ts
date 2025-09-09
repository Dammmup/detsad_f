import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api` || 'http://localhost:8080/api';

interface IFine {
  amount: number;
  reason: string;
  date: Date;
  type: 'late' | 'other';
  approved: boolean;
  createdBy: string;
  notes?: string;
}

// Интерфейс для пользователя (сотрудника)
export interface User {
  id?: string;
  _id?: string;
  fullName: string;
  role: string;
  phone: string;
  email?: string;
  active: boolean;
  type: 'adult' | 'child';
  isVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
  personalCode?: string; // Персональный код для входа
  // --- поля для детей ---
  birthday?: string;
  parentPhone?: string;
  notes?: string;
  iin?: string;
  groupId?: string;
  parentName?: string;
  salary?: number;
  fines?: IFine[];
  totalFines?: number;
}

// Интерфейс для API ошибки
interface ApiError extends Error {
  status?: number;
  data?: any;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 2;
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      return api(originalRequest);
    }
    return Promise.reject(error);
  }
);

const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);
  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  throw apiError;
};

/**
 * Get all users (staff members)
 * @returns {Promise<User[]>} List of users
 */
export const getUsers = async () => {
  try {
    console.log('Fetching users from API...');
    
    const response = await api.get('/users');
    const users: User[] = response.data.map((user: any) => ({
      id: user._id,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      email: user.email || '',
      active: user.active,
      type: user.type,
      isVerified: user.isVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      iin: user.iin,
      groupId: user.groupId,
      parentPhone: user.parentPhone,
      parentName: user.parentName,
      birthday: user.birthday,
      notes: user.notes,
      salary: user.salary,
      fines: user.fines,
      totalFines: user.totalFines,
    }));
    
    console.log('Users data:', users);
    return users;
  } catch (error) {
    console.error('Error in getUsers:', error);
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
    // Отправляем весь объект user, чтобы все поля попали на backend
    console.log('Отправляем на backend:', user);
    const response = await api.post('/users', user);
    
    const createdUser: User = {
      id: response.data._id,
      fullName: response.data.fullName,
      role: response.data.role,
      phone: response.data.phone,
      email: response.data.email || '',
      active: response.data.active,
      type: response.data.type,
      isVerified: response.data.isVerified,
      lastLogin: response.data.lastLogin,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
      iin: response.data.iin,
      groupId: response.data.groupId,
      parentPhone: response.data.parentPhone,
      parentName: response.data.parentName,
      birthday: response.data.birthday,
      notes: response.data.notes,
      salary: response.data.salary,
      fines: response.data.fines,
      totalFines: response.data.totalFines,
      personalCode: response.data.personalCode,
    };
    
    return createdUser;
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
      fullName: response.data.fullName,
      role: response.data.role,
      phone: response.data.phone,
      email: response.data.email || '',
      active: response.data.active,
      type: response.data.type,
      isVerified: response.data.isVerified,
      lastLogin: response.data.lastLogin,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
      iin: response.data.iin,
      groupId: response.data.groupId,
      parentPhone: response.data.parentPhone,
      parentName: response.data.parentName,
      birthday: response.data.birthday,
      notes: response.data.notes,
      salary: response.data.salary,
      fines: response.data.fines,
      totalFines: response.data.totalFines,
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

// Получение одного пользователя по ID
export const getUser = async (id: string) => {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    handleApiError(error, 'getUser');
  }
};

// Кэш для ролей пользователей
let rolesCache: any = null;
let rolesCacheTimestamp = 0;
const ROLES_CACHE_DURATION = 5 * 60 * 1000; // 5 минут

// Очистка кэша ролей
export const clearRolesCache = () => {
  rolesCache = null;
  rolesCacheTimestamp = 0;
};

// Получение списка ролей пользователей
export const getUserRoles = async () => {
  try {
    // Возвращаем кэшированные данные, если они актуальны
    const now = Date.now();
    if (rolesCache && (now - rolesCacheTimestamp) < ROLES_CACHE_DURATION) {
      return rolesCache;
    }
    
    await delay(300);
    const response = await api.get('/roles');
    
    // Обновляем кэш
    rolesCache = response.data;
    rolesCacheTimestamp = now;
    
    return response.data;
  } catch (error) {
    handleApiError(error, 'getUserRoles');
    return [];
  }
};
