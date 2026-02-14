import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiError, DelayFunction, ErrorHandler } from '../types/common';



export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'https://api.detsad.pro';
export const API_TIMEOUT = 120000;
export const RETRY_DELAY = 2000;
export const MAX_RETRIES = 3;



export const delay: DelayFunction = (ms = RETRY_DELAY) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const handleApiError: ErrorHandler = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);

  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
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
    try {
      const response: AxiosResponse<T> = await this.api.get(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error, `GET ${url}`);
    }
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
  arr: T[],
): T[] => {
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
