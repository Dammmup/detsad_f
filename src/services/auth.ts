import { BaseApiClient } from '../utils/api';
import {
  LoginCredentials,
 AuthResponse,
  User,
} from '../types/common';

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
      console.log('🔐 Попытка входа для:', credentials.phone);
      
      const response = await this.post<{
        user: any;
        token: string;
      }>('/auth/login', credentials);
      
      const authData: AuthResponse = {
              success: true,
              user: {
                _id: response.user._id || response.user.id || '',
                id: response.user.id || response.user._id || '',
                phone: response.user.phone || '',
                fullName: response.user.fullName || response.user.name || '',
                role: response.user.role || 'staff',
                avatar: response.user.avatar,
                active: response.user.active || response.user.isActive || false,
                lastLogin: response.user.lastLogin,
                createdAt: response.user.createdAt || new Date().toISOString(),
                updatedAt: response.user.updatedAt || new Date().toISOString(),
                uniqNumber: response.user.uniqNumber,
                notes: response.user.notes,
                iin: response.user.iin,
                groupId: response.user.groupId,
                birthday: response.user.birthday,
                photo: response.user.photo,
                parentName: response.user.parentName,
                parentPhone: response.user.parentPhone,
                email: response.user.email,
                initialPassword: response.user.initialPassword,
                salary: response.user.salary,
                salaryType: response.user.salaryType,
                penaltyType: response.user.penaltyType,
                penaltyAmount: response.user.penaltyAmount,
                shiftRate: response.user.shiftRate,
                staffId: response.user.staffId,
                staffName: response.user.staffName
              },
              token: response.token // Токен теперь передается в ответе
            };
      
      // Сохраняем пользователя и токен
      this.saveAuthData(authData);
      
      console.log('✅ Успешный вход:', authData.user.fullName);
      return authData;
      
    } catch (error: any) {
      console.error('❌ Ошибка входа:', error);
      
    
      
      throw new Error(error.message || 'Ошибка авторизации');
    }
  }


  // ===== УПРАВЛЕНИЕ СЕССИЕЙ =====

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    try {
      // Уведомляем backend о выходе (опционально)
      await this.post('/auth/logout', {});
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


  async isAuthenticated(): Promise<boolean> {
    const user = this.getCurrentUser();
    
    if (!user) {
      return false;
    }
    
    // Проверяем валидность токена на сервере
    return await this.validateToken();
  }

  /**
   * Обновление токена
   * Токен обновляется при истечении срока действия, требуя повторной аутентификации
   */
  async refreshToken(): Promise<boolean> {
    try {
      // При использовании токенов в заголовке Authorization обновление не требуется
      // Токен валиден в течение 24 часов, после чего нужно перезайти
      const token = this.getToken();
      if (!token) {
        return false;
      }
      
      const isValid = await this.validateToken();
      
      if (isValid) {
        console.log('🔄 Токен действителен');
        return true;
      } else {
        return false;
      }
      
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      
      // Если не удалось проверить токен, очищаем данные
      this.clearAuthData();
      
      return false;
    }
  }

  /**
   * Валидация токена с backend
   * Токен отправляется в заголовке Authorization с каждым запросом
   */
  async validateToken(): Promise<boolean> {
    try {
      // Делаем запрос на валидацию токена, который передается в заголовке Authorization
      const response = await this.get('/auth/validate');
      
      // Проверяем, что ответ валиден
      if (response && typeof response === 'object' && response.valid !== undefined) {
        return response.valid;
      }
      
      return true;
      
    } catch (error) {
      console.warn('Токен недействителен:', error);
      return false;
    }
  }


  private getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  /**
   * Сохранение данных авторизации
   */
 private saveAuthData(authData: AuthResponse): void {
    // Сохраняем пользователя и токен
    localStorage.setItem('user', JSON.stringify(authData.user));
    if (authData.token) {
      localStorage.setItem('auth_token', authData.token);
    }
  }

  /**
   * Очистка данных авторизации
   */
 private clearAuthData(): void {
    // Удаляем данные аутентификации из localStorage
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('phoneNumber');
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
