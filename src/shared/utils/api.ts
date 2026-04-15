import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, DelayFunction, ErrorHandler } from '../types/common';



export const API_BASE_URL =
  import.meta.env.VITE_API_URL || '';
export const API_TIMEOUT = 120000;
export const RETRY_DELAY = 2000;
export const MAX_RETRIES = 3;



export const delay: DelayFunction = (ms = RETRY_DELAY) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const inFlightGetRequests = new Map<string, Promise<any>>();

const getAuthTokenSnapshot = (): string => {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('auth_token') || '';
};

const createGetRequestKey = (
  url: string,
  config?: AxiosRequestConfig,
): string => JSON.stringify({
  url,
  params: config?.params || null,
  responseType: config?.responseType || null,
  token: getAuthTokenSnapshot(),
});

export const handleApiError: ErrorHandler = (error: any, context = '') => {
  let message = 'Произошла ошибка при выполнении запроса';
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message || error.response?.data?.error;

  if (serverMessage) {
    message = serverMessage;
  } else {
    switch (status) {
      case 400:
        message = 'Некорректный запрос. Проверьте введенные данные.';
        break;
      case 401:
        message = 'Ошибка авторизации. Пожалуйста, войдите в систему снова.';
        break;
      case 403:
        message = 'У вас недостаточно прав для выполнения этого действия.';
        break;
      case 404:
        message = 'Запрошенный ресурс не найден.';
        break;
      case 429:
        message = 'Слишком много запросов. Пожалуйста, подождите.';
        break;
      case 500:
        message = 'Ошибка на стороне сервера. Мы уже работаем над исправлением.';
        break;
      default:
        if (error.message === 'Network Error') {
          message = 'Отсутствует подключение к сети. Проверьте интернет.';
        } else if (error.code === 'ECONNABORTED') {
          message = 'Время ожидания запроса истекло. Попробуйте снова.';
        } else {
          message = error.message || 'Неизвестная ошибка';
        }
    }
  }

  console.error(`Error ${context}:`, message);

  const apiError = new Error(message) as ApiError;
  apiError.status = status;
  apiError.data = error.response?.data;

  throw apiError;
};

export const createApiInstance = (
  baseURL: string = API_BASE_URL,
): AxiosInstance => {
  const api = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });


  api.interceptors.request.use(
    (config) => {

      const token = localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }


      return config;
    },
    (error) => {
      console.error('❌ Ошибка запроса:', error);
      return Promise.reject(error);
    },
  );


  api.interceptors.response.use(
    (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;


      if (error.response?.status === 401) {
        console.warn('🔒 Ошибка 401: Требуется авторизация');

        if (typeof window !== 'undefined') {

          localStorage.removeItem('user');
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }

        return Promise.reject(new Error('Требуется авторизация'));
      }


      if (error.response?.status === 429 && !originalRequest._retry) {
        originalRequest._retry = true;
        const retryAfter = error.response.headers['retry-after'] || 2;

        console.warn(
          `⏳ Rate limited. Retrying after ${retryAfter} seconds...`,
        );

        await delay(retryAfter * 1000);
        return api(originalRequest);
      }

      console.error(
        '❌ API ошибка:',
        error.response?.status,
        error.response?.data?.message || error.message,
      );
      return Promise.reject(error);
    },
  );

  return api;
};



export class BaseApiClient {
  protected api: AxiosInstance;

  constructor(baseURL?: string) {
    this.api = createApiInstance(baseURL);
  }

  protected async get<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    const requestKey = createGetRequestKey(url, config);
    const existingRequest = inFlightGetRequests.get(requestKey);
    if (existingRequest) {
      return existingRequest as Promise<T>;
    }

    const request = this.api
      .get<T>(url, config)
      .then((response: AxiosResponse<T>) => response.data)
      .catch((error) => {
        throw this.handleError(error, `GET ${url}`);
      })
      .finally(() => {
        inFlightGetRequests.delete(requestKey);
      });

    inFlightGetRequests.set(requestKey, request);
    return request;
  }

  protected async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.post(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `POST ${url}`);
    }
  }

  protected async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.put(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `PUT ${url}`);
    }
  }

  protected async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.delete(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `DELETE ${url}`);
    }
  }

  protected async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.api.patch(
        url,
        data,
        config,
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error, `PATCH ${url}`);
    }
  }

  private handleError(error: any, context: string): ApiError {
    try {
      handleApiError(error, context);
    } catch (apiError) {
      return apiError as ApiError;
    }

    const errorObj = new Error(
      `Error ${context}: ${error.message || 'Неизвестная ошибка'}`,
    ) as ApiError;
    errorObj.status = error.response?.status;
    errorObj.data = error.response?.data;
    return errorObj;
  }

  protected async delayRequest(ms?: number): Promise<void> {
    await delay(ms);
  }
}




export const normalizeMongoObject = <T extends Record<string, any>>(
  obj: T,
): T => {
  if (obj._id && !obj.id) {
    return { ...obj, id: obj._id };
  }
  return obj;
};

export const normalizeMongoArray = <T extends Record<string, any>>(
  arr: T[] | any,
): T[] => {
  if (!arr) return [];
  if (!Array.isArray(arr)) {
    const extracted = arr.items || arr.data || [];
    return Array.isArray(extracted) ? extracted.map(normalizeMongoObject) : [];
  }
  return arr.map(normalizeMongoObject);
};

export const createQueryParams = (
  params: Record<string, any>,
): URLSearchParams => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  return searchParams;
};

export const safeApiCall = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  retryDelay: number = RETRY_DELAY,
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error: any) {
      lastError = error;


      if (
        error.status === 401 ||
        error.status === 403 ||
        error.status === 404
      ) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.warn(
          `Попытка ${attempt} неудачна, повторяем через ${retryDelay}ms...`,
        );
        await delay(retryDelay);
        retryDelay *= 2;
      }
    }
  }

  throw lastError;
};



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



export abstract class BaseCrudApiClient<
  T extends Record<string, any>,
  CreateT = Partial<T>,
  UpdateT = Partial<T>,
>
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



export const apiClient = createApiInstance();
export default apiClient;
