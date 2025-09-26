import { BaseApiClient } from '../../utils/api';
import {
  LoginCredentials,
  OTPResponse,
  AuthResponse,
  User,
} from '../../types/common';

/**
 * API клиент для авторизации
 */
class AuthApiClient extends BaseApiClient {


  // ===== КЛАССИЧЕСКАЯ АВТОРИЗАЦИЯ =====

  /**
   * Вход пользователя с email и паролем
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Попытка входа для:', credentials.email);
      
      const response = await this.post<{
        user: any;
        token?: string;
      }>('/auth/login', credentials);
      
      const authData: AuthResponse = {
        user: {
          id: response.user.id || response.user._id,
          email: response.user.email,
          fullName: response.user.fullName || response.user.name,
          role: response.user.role || 'staff'
        },
        token: response.token
      };
      
      this.saveAuthData(authData);
      
      console.log('✅ Успешный вход:', authData.user.fullName);
      return authData;
      
    } catch (error: any) {
      console.error('❌ Ошибка входа:', error);
      
      // Если backend не настроен, создаем мок-авторизацию для разработки
      if (error.code === 'ECONNREFUSED' || error.status === 404) {
        console.warn('🔧 Backend недоступен, используем мок-авторизацию для разработки');
        return this.createMockAuth(credentials);
      }
      
      throw new Error(error.message || 'Ошибка авторизации');
    }
  }


  // ===== УПРАВЛЕНИЕ СЕССИЕЙ =====

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        // Уведомляем backend о выходе (опционально)
        await this.post('/auth/logout', {});
      }
    } catch (error) {
      console.warn('Ошибка при выходе на backend:', error);
    } finally {
      // Очищаем локальные данные в любом случае
      this.clearAuthData();
      console.log('🚪 Пользователь вышел из системы');
    }
  }

  /**
   * Получение текущего пользователя
   */
  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return null;
      }
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Ошибка получения текущего пользователя:', error);
      return null;
    }
  }

  /**
   * Проверка авторизации
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    
    return !!(token && user);
  }

  /**
   * Обновление токена
   */
  async refreshToken(): Promise<string | null> {
    try {
      const currentToken = this.getToken();
      
      if (!currentToken) {
        return null;
      }
      
      const response = await this.post<{ token: string }>('/auth/refresh', {});
      
      const newToken = response.token;
      localStorage.setItem('token', newToken);
      
      console.log('🔄 Токен обновлен');
      return newToken;
      
    } catch (error) {
      console.error('Ошибка обновления токена:', error);
      
      // Если не удалось обновить токен, очищаем данные
      this.clearAuthData();
      
      return null;
    }
  }

  /**
   * Валидация токена с backend
   */
  async validateToken(): Promise<boolean> {
    try {
      const token = this.getToken();
      
      if (!token) {
        return false;
      }
      
  await this.get('/api/auth/validate');
      return true;
      
    } catch (error) {
      console.warn('Токен недействителен:', error);
      return false;
    }
  }

  // ===== ПРИВАТНЫЕ МЕТОДЫ =====

  /**
   * Получение токена из localStorage
   */
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Сохранение данных авторизации
   */
  private saveAuthData(authData: AuthResponse): void {
    if (authData.token) {
      localStorage.setItem('token', authData.token);
    }
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  /**
   * Очистка данных авторизации
   */
  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('phoneNumber');
  }

  /**



  /**
   * Создание мок авторизации для разработки
   */
  private createMockAuth(credentials: LoginCredentials): AuthResponse {
    const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
    
    const authData: AuthResponse = {
      token: mockToken,
      user: {
        id: 'mock-user-1',
        email: credentials.email,
        fullName: credentials.email.split('@')[0] || 'Тестовый пользователь',
        role: credentials.email.includes('admin') ? 'admin' : 'staff'
      }
    };
    
    this.saveAuthData(authData);
    
    console.log('🧪 Создана мок-авторизация:', authData.user);
    return authData;
  }
}

// Экспортируем экземпляр клиента
export const authApi = new AuthApiClient();

// Экспортируем отдельные функции для обратной совместимости

export const login = (credentials: LoginCredentials) => authApi.login(credentials);
export const logout = () => authApi.logout();
export const getCurrentUser = () => authApi.getCurrentUser();
export const isAuthenticated = () => authApi.isAuthenticated();
export const refreshToken = () => authApi.refreshToken();
export const validateToken = () => authApi.validateToken();

export default authApi;