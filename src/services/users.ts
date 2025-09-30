import { BaseCrudApiClient, apiCache } from '../utils/api';
import { User, UserFilters, ID } from '../types/common';

/**
 * API клиент для работы с пользователями
 */
class UsersApiClient extends BaseCrudApiClient<User> {
  protected endpoint = '/users';
  private readonly CACHE_KEY = 'users';
  private readonly ROLES_CACHE_KEY = 'user_roles';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут
  // ...existing code...

  /**
   * Получить настройки зарплаты и штрафов сотрудника
   */
  async getPayrollSettings(id: ID): Promise<Pick<User, 'salary' | 'shiftRate' | 'salaryType' | 'penaltyType' | 'penaltyAmount'>> {
    return this.get(`${this.endpoint}/${id}`);
  }

  /**
   * Обновить настройки зарплаты и штрафов сотрудника
   */
 async updatePayrollSettings(id: ID, data: Partial<Pick<User, 'salary' | 'shiftRate' | 'salaryType' | 'penaltyType' | 'penaltyAmount'>>): Promise<User> {
    return this.put(`${this.endpoint}/${id}/payroll-settings`, data);
  }

  /**
   * Получение всех пользователей с кэшированием
   */
  async getAll(filters?: UserFilters, includePasswords = false): Promise<User[]> {
    const cacheKey = `${this.CACHE_KEY}_${JSON.stringify(filters)}_${includePasswords}`;
    
    // Проверяем кэш
    const cached = apiCache.get<User[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const params: any = { ...filters };
    if (includePasswords) {
      params.includePasswords = true;
    }

    const users = await super.getAll(params);
    
    // Кэшируем результат
    apiCache.set(cacheKey, users, this.CACHE_DURATION);
    
    return users;
  }

  /**
   * Создание пользователя с очисткой кэша
   */
  async create(userData: Partial<User>): Promise<User> {
    const user = await super.create(userData);
    this.clearCache();
    return user;
  }

  /**
   * Обновление пользователя с очисткой кэша
   */
  async update(id: ID, userData: Partial<User>): Promise<User> {
    const user = await super.update(id, userData);
    this.clearCache();
    return user;
  }

  /**
   * Удаление пользователя с очисткой кэша
   */
  async deleteItem(id: ID): Promise<void> {
    await super.deleteItem(id);
    this.clearCache();
  }

  /**
   * Получение детей по группе
   */
  async getChildrenByGroup(groupId: ID): Promise<User[]> {
    const cacheKey = `children_group_${groupId}`;
    
    const cached = apiCache.get<User[]>(cacheKey);
    if (cached) {
      return cached;
    }

  const children = await this.get<User[]>(`/users/group/${groupId}/children`);
    
    apiCache.set(cacheKey, children, this.CACHE_DURATION);
    return children;
  }

  /**
   * Получение ролей пользователей с кэшированием
   */
  async getRoles(): Promise<string[]> {
    const cached = apiCache.get<string[]>(this.ROLES_CACHE_KEY);
    if (cached) {
      return cached;
    }

    await this.delayRequest(300);
  const roles = await this.get<string[]>('/roles');
    
    apiCache.set(this.ROLES_CACHE_KEY, roles, this.CACHE_DURATION);
    return roles;
  }

  /**
   * Получение учителей с кэшированием
   */
  async getTeachers(): Promise<User[]> {
    const cacheKey = 'teachers';
    
    const cached = apiCache.get<User[]>(cacheKey);
    if (cached) {
      return cached;
    }

  const teachers = await this.get<User[]>('/users/teachers', {
      params: {
        role: 'teacher',
        fields: 'id,name,email,avatar'
      }
    });

    apiCache.set(cacheKey, teachers, this.CACHE_DURATION);
    return teachers;
  }

  /**
   * Очистка кэша пользователей
   */
  clearCache(): void {
    // Очищаем все кэши, связанные с пользователями
    const keysToDelete = [
      this.CACHE_KEY,
      this.ROLES_CACHE_KEY,
      'teachers'
    ];

    keysToDelete.forEach(key => {
      apiCache.delete(key);
    });

    // Очищаем кэши с фильтрами (более сложная логика)
    // В реальном приложении можно использовать более продвинутую систему тегов
  }

  /**
   * Поиск пользователей
   */
  async search(query: string, filters?: UserFilters): Promise<User[]> {
    const params = {
      ...filters,
      search: query
    };

    return this.get<User[]>(`${this.endpoint}/search`, { params });
  }

  /**
   * Получение статистики пользователей
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
    byType: Record<string, number>;
  }> {
  return this.get('/users/stats');
  }

  /**
   * Массовое обновление пользователей
   */
  async bulkUpdate(updates: Array<{ id: ID; data: Partial<User> }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: ID; error: string }>;
  }> {
  const result = await this.post('/users/bulk-update', { updates });
    this.clearCache();
    return result;
  }

  /**
   * Экспорт пользователей
   */
  async export(filters?: UserFilters, format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    const params = { ...filters, format };
    
  return this.get('/users/export', {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Импорт пользователей
   */
  async import(file: File): Promise<{
    success: number;
    failed: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

  const result = await this.post('/users/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    this.clearCache();
    return result;
  }

  /**
   * Активация/деактивация пользователя
   */
  async toggleActive(id: ID, active: boolean): Promise<User> {
    const user = await this.patch<User>(`${this.endpoint}/${id}`, { active });
    this.clearCache();
    return user;
  }

  /**
   * Сброс пароля пользователя
   */
  async resetPassword(id: ID): Promise<{ temporaryPassword: string }> {
    return this.post(`${this.endpoint}/${id}/reset-password`);
  }

}

// Экспортируем экземпляр клиента
export const usersApi = new UsersApiClient();

// Экспортируем отдельные функции для обратной совместимости
export const getUsers = (includePasswords = false) => usersApi.getAll({}, includePasswords);
export const createUser = (user: Partial<User>) => usersApi.create(user);
export const updateUser = (id: ID, user: Partial<User>) => usersApi.update(id, user);
export const deleteUser = (id: ID) => usersApi.deleteItem(id);
export const getUser = (id: ID) => usersApi.getById(id);
export const getUserRoles = () => usersApi.getRoles();
export const getChildrenByGroup = (groupId: ID) => usersApi.getChildrenByGroup(groupId);
export const clearRolesCache = () => usersApi.clearCache();

export default usersApi;