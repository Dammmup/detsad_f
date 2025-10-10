import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, DelayFunction, ErrorHandler } from '../types/common';

// ===== КОНФИГУРАЦИЯ API =====

export const API_BASE_URL = process.env.API_URL || 'https://detsad-b.onrender.com';
export const API_TIMEOUT = 10000; // 10 секунд
export const RETRY_DELAY = 2000; // 2 секунды
export const MAX_RETRIES = 3;

// ===== УТИЛИТЫ =====

/**
 * Функция задержки для предотвращения rate limiting
 */
export const delay: DelayFunction = (ms = RETRY_DELAY) => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Обработчик API ошибок
 */
export const handleApiError: ErrorHandler = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);
  
  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;
  
  throw apiError;
};

/**
 * Создание экземпляра axios с базовой конфигурацией
 */
export const createApiInstance = (baseURL: string = API_BASE_URL): AxiosInstance => {
  const api = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true, // Включаем отправку credentials (включая cookies) с каждым запросом
  });

  // Request interceptor
  api.interceptors.request.use(
    (config) => {
      // При использовании httpOnly cookie токен автоматически отправляется с запросом
      // Не нужно добавлять токен из localStorage в заголовок Authorization
      
      console.log('📤 API запрос:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error) => {
      console.error('❌ Ошибка запроса:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor для обработки ошибок и retry логики
  api.interceptors.response.use(
    (response) => {
      console.log('✅ API ответ:', response.status, response.config.url);
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      // Обработка 401 ошибки (неавторизован)
      if (error.response?.status === 401) {
        console.warn('🔒 Ошибка 401: Требуется авторизация');
        
        if (typeof window !== 'undefined') {
          // Удаляем только пользовательские данные из localStorage
          // Токен в httpOnly cookie удаляется на сервере при logout
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        
        return Promise.reject(new Error('Требуется авторизация'));
      }
      
      // Обработка 429 ошибки (Too Many Requests) с retry
      if (error.response?.status === 429 && !originalRequest._retry) {
        originalRequest._retry = true;
        const retryAfter = error.response.headers['retry-after'] || 2;
        
        console.warn(`⏳ Rate limited. Retrying after ${retryAfter} seconds...`);
        
        await delay(retryAfter * 1000);
        return api(originalRequest);
      }
      
      console.error('❌ API ошибка:', error.response?.status, error.response?.data?.message || error.message);
      return Promise.reject(error);
    }
  );

  return api;
};

// ===== БАЗОВЫЙ API КЛИЕНТ =====

export class BaseApiClient {
  protected api: AxiosInstance;

  constructor(baseURL?: string) {
    this.api = createApiInstance(baseURL);
  }

  /**
   * GET запрос
   */
  protected async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.get(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `GET ${url}`);
    }
  }

  /**
   * POST запрос
   */
  protected async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `POST ${url}`);
    }
  }

  /**
   * PUT запрос
   */
  protected async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `PUT ${url}`);
    }
  }

  /**
   * DELETE запрос
   */
  protected async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `DELETE ${url}`);
    }
  }

  /**
   * PATCH запрос
   */
  protected async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `PATCH ${url}`);
    }
  }

  /**
   * Обработка ошибок
   */
  private handleError(error: any, context: string): ApiError {
    return handleApiError(error, context);
  }

  /**
   * Добавление задержки между запросами
   */
  protected async delayRequest(ms?: number): Promise<void> {
    await delay(ms);
  }
}

// ===== КЭШИРОВАНИЕ =====

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

export class ApiCache {
  private cache = new Map<string, CacheItem<any>>();

  /**
   * Получение данных из кэша
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    const now = Date.now();
    if (now - item.timestamp > item.expiresIn) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Сохранение данных в кэш
   */
  set<T>(key: string, data: T, expiresIn: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn
    });
  }

  /**
   * Удаление данных из кэша
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Очистка всего кэша
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Получение размера кэша
   */
  size(): number {
    return this.cache.size;
  }
}

// Глобальный экземпляр кэша
export const apiCache = new ApiCache();

// ===== УТИЛИТЫ ДЛЯ РАБОТЫ С ДАННЫМИ =====

/**
 * Преобразование MongoDB объекта в стандартный формат
 */
export const normalizeMongoObject = <T extends Record<string, any>>(obj: T): T => {
  if (obj._id && !obj.id) {
    return { ...obj, id: obj._id };
  }
  return obj;
};

/**
 * Преобразование массива MongoDB объектов
 */
export const normalizeMongoArray = <T extends Record<string, any>>(arr: T[]): T[] => {
  return arr.map(normalizeMongoObject);
};

/**
 * Создание параметров запроса из объекта
 */
export const createQueryParams = (params: Record<string, any>): URLSearchParams => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams;
};

/**
 * Безопасное выполнение API запроса с retry
 */
export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  retryDelay: number = RETRY_DELAY
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;
      
      // Не повторяем запрос для определенных ошибок
      if (error.status === 401 || error.status === 403 || error.status === 404) {
        throw error;
      }
      
      if (attempt < maxRetries) {
        console.warn(`Попытка ${attempt} неудачна, повторяем через ${retryDelay}ms...`);
        await delay(retryDelay);
        retryDelay *= 2; // Экспоненциальная задержка
      }
    }
  }
  
  throw lastError;
};

// ===== ТИПЫ ДЛЯ РАСШИРЕННЫХ API КЛИЕНТОВ =====

export interface CrudApiClient<T, CreateT = Partial<T>, UpdateT = Partial<T>> {
  getAll(params?: any): Promise<T[]>;
  getById(id: string): Promise<T>;
  create(data: CreateT): Promise<T>;
  update(id: string, data: UpdateT): Promise<T>;
  deleteItem(id: string): Promise<void>;
}

export interface PaginatedApiClient<T> {
  getPaginated(params?: any): Promise<{
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }>;
}

// ===== БАЗОВЫЙ CRUD КЛИЕНТ =====

export abstract class BaseCrudApiClient<T extends Record<string, any>, CreateT = Partial<T>, UpdateT = Partial<T>>
  extends BaseApiClient
  implements CrudApiClient<T, CreateT, UpdateT> {
  
  protected abstract endpoint: string;

  async getAll(params?: any): Promise<T[]> {
    const queryParams = params ? `?${createQueryParams(params)}` : '';
    const data = await this.get<T[]>(`${this.endpoint}${queryParams}`);
    return normalizeMongoArray(data) as T[];
  }

  async getById(id: string): Promise<T> {
    const data = await this.get<T>(`${this.endpoint}/${id}`);
    return normalizeMongoObject(data) as T;
  }

  async create(data: CreateT): Promise<T> {
    const result = await this.post<T>(this.endpoint, data);
    return normalizeMongoObject(result) as T;
  }

  async update(id: string, data: UpdateT): Promise<T> {
    const result = await this.put<T>(`${this.endpoint}/${id}`, data);
    return normalizeMongoObject(result) as T;
  }

  async deleteItem(id: string): Promise<void> {
    await super.delete(`${this.endpoint}/${id}`);
  }
}

// ===== ЭКСПОРТ ОСНОВНОГО API КЛИЕНТА =====

export const apiClient = createApiInstance();
export default apiClient;