import { BaseApiClient } from '../utils/api';
import { LoginCredentials, AuthResponse, User } from '../types/common';

class AuthApiClient extends BaseApiClient {


  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Попытка входа для:', credentials.phone);

      const response = await this.post<{
        user: any;
        token: string;
      }>('/api/auth/login', credentials);

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
          shiftRate: response.user.shiftRate,
          staffId: response.user.staffId,
          staffName: response.user.staffName,
        },
        token: response.token,
      };


      this.saveAuthData(authData);

      console.log('✅ Успешный вход:', authData.user.fullName);
      return authData;
    } catch (error: any) {
      console.error('❌ Ошибка входа:', error);

      throw new Error(error.message || 'Ошибка авторизации');
    }
  }



  async logout(): Promise<void> {
    try {

      await this.post('/api/auth/logout', {});
    } catch (error) {
      console.warn('Ошибка при выходе на backend:', error);
    } finally {

      this.clearAuthData();
      console.log('🚪 Пользователь вышел из системы');
    }
  }

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


    return await this.validateToken();
  }

  async refreshToken(): Promise<boolean> {
    try {


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


      this.clearAuthData();

      return false;
    }
  }

  async validateToken(): Promise<boolean> {
    try {

      const response = await this.get('/api/auth/validate');


      if (
        response &&
        typeof response === 'object' &&
        response.valid !== undefined
      ) {
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

  private saveAuthData(authData: AuthResponse): void {

    localStorage.setItem('user', JSON.stringify(authData.user));
    if (authData.token) {
      localStorage.setItem('auth_token', authData.token);
    }
  }

  private clearAuthData(): void {

    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('phoneNumber');
  }
}


export const authApi = new AuthApiClient();



export const login = (credentials: LoginCredentials) =>
  authApi.login(credentials);
export const logout = () => authApi.logout();
export const getCurrentUser = () => authApi.getCurrentUser();
export const isAuthenticated = () => authApi.isAuthenticated();
export const refreshToken = () => authApi.refreshToken();
export const validateToken = () => authApi.validateToken();

export default authApi;
