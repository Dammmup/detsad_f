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
                isActive: response.user.isActive || response.user.active || false,
                lastLogin: response.user.lastLogin,
                createdAt: response.user.createdAt || new Date().toISOString(),
                updatedAt: response.user.updatedAt || new Date().toISOString(),
                uniqNumber: response.user.uniqNumber,
                notes: response.user.notes,
                active: response.user.active || response.user.isActive || false,
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
              token: '' // Токен теперь хранится в httpOnly cookie
            };
      
      // Сохраняем только пользователя, токен хранится в cookie
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
   * При использовании httpOnly cookie проверяем только наличие пользователя
   * и делаем запрос на валидацию на сервер
   */
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
   * При использовании httpOnly cookie обновление происходит автоматически на сервере
   * через механизм обновления сессии
   */
  async refreshToken(): Promise<boolean> {
    try {
      // Просто проверяем валидность токена, обновление происходит на сервере
      const isValid = await this.validateToken();
      
      if (isValid) {
        console.log('🔄 Токен действителен (обновление не требуется при httpOnly cookie)');
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
   * При использовании httpOnly cookie токен автоматически отправляется с каждым запросом
   */
  async validateToken(): Promise<boolean> {
    try {
      // Просто делаем запрос на валидацию, токен будет автоматически отправлен в cookie
      await this.get('/auth/validate');
      return true;
      
    } catch (error) {
      console.warn('Токен недействителен:', error);
      return false;
    }
  }


  private getToken(): string | null {
    return null; // Токен хранится в httpOnly cookie, недоступен из JavaScript
  }

  /**
   * Сохранение данных авторизации
   */
 private saveAuthData(authData: AuthResponse): void {
    // Сохраняем только пользователя, токен хранится в httpOnly cookie
    localStorage.setItem('user', JSON.stringify(authData.user));
  }

  /**
   * Очистка данных авторизации
   */
 private clearAuthData(): void {
    // Удаляем только пользователя из localStorage, токен в httpOnly cookie удаляется на сервере
    localStorage.removeItem('user');
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
