import { BaseCrudApiClient, apiCache } from '../../utils/api';
import { Group, User, ID } from '../../types/common';

/**
 * API клиент для работы с группами
 */
class GroupsApiClient extends BaseCrudApiClient<Group> {
  protected endpoint = '/groups';
  private readonly CACHE_KEY = 'groups';
  private readonly TEACHERS_CACHE_KEY = 'teachers';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 минут

  /**
   * Получение всех групп с кэшированием
   */
  async getAll(): Promise<Group[]> {
    const cached = apiCache.get<Group[]>(this.CACHE_KEY);
    if (cached) {
      return cached;
    }

    const groups = await super.getAll();
    
    // Кэшируем результат
    apiCache.set(this.CACHE_KEY, groups, this.CACHE_DURATION);
    
    return groups;
  }

  /**
   * Создание группы с очисткой кэша
   */
  async create(groupData: Partial<Group>): Promise<Group> {
    const group = await super.create({
      name: groupData.name,
      description: groupData.description,
      teacher: groupData.teacher,
      isActive: groupData.isActive ?? true,
      maxStudents: groupData.maxStudents,
      ageGroup: groupData.ageGroup || []
    });
    
    this.clearCache();
    return group;
  }

  /**
   * Обновление группы с очисткой кэша
   */
  async update(id: ID, groupData: Partial<Group>): Promise<Group> {
    const group = await super.update(id, groupData);
    this.clearCache();
    return group;
  }

  /**
   * Удаление группы с очисткой кэша
   */
  async deleteItem(id: ID): Promise<void> {
    await super.delete(`/groups/delete/${id}`);
    this.clearCache();
  }

  /**
   * Получение учителей с кэшированием
   */
  async getTeachers(): Promise<User[]> {
    const cached = apiCache.get<User[]>(this.TEACHERS_CACHE_KEY);
    if (cached) {
      return cached;
    }

    try {
      const teachers = await this.get<User[]>('/users/teachers', {
        params: {
          role: 'teacher',
          fields: 'id,name,email,avatar'
        }
      });

      // Преобразуем формат для совместимости
      const formattedTeachers = teachers.map(teacher => ({
        ...teacher,
        id: teacher._id || teacher.id,
        name: teacher.fullName
      }));

      apiCache.set(this.TEACHERS_CACHE_KEY, formattedTeachers, this.CACHE_DURATION);
      return formattedTeachers;
    } catch (error) {
      console.warn('Could not fetch teachers, using empty list as fallback');
      return [];
    }
  }

  /**
   * Получение детей в группе
   */
  async getGroupChildren(groupId: ID): Promise<User[]> {
    const cacheKey = `group_children_${groupId}`;
    
    const cached = apiCache.get<User[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const children = await this.get<User[]>(`/users/group/${groupId}/children`);
    
    apiCache.set(cacheKey, children, this.CACHE_DURATION);
    return children;
  }

  /**
   * Получение статистики группы
   */
  async getGroupStats(groupId: ID): Promise<{
    totalChildren: number;
    activeChildren: number;
    averageAge: number;
    attendanceRate: number;
  }> {
    return this.get(`${this.endpoint}/${groupId}/stats`);
  }

  /**
   * Получение расписания группы
   */
  async getGroupSchedule(groupId: ID, startDate?: string, endDate?: string): Promise<any[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.get(`${this.endpoint}/${groupId}/schedule`, { params });
  }

  /**
   * Назначение учителя группе
   */
  async assignTeacher(groupId: ID, teacherId: ID): Promise<Group> {
    const group = await this.patch<Group>(`${this.endpoint}/${groupId}`, {
      teacher: teacherId
    });
    
    this.clearCache();
    return group;
  }

  /**
   * Добавление ребенка в группу
   */
  async addChild(groupId: ID, childId: ID): Promise<void> {
    await this.post(`${this.endpoint}/${groupId}/children`, { childId });
    this.clearGroupChildrenCache(groupId);
  }

  /**
   * Удаление ребенка из группы
   */
  async removeChild(groupId: ID, childId: ID): Promise<void> {
    await this.delete(`${this.endpoint}/${groupId}/children/${childId}`);
    this.clearGroupChildrenCache(groupId);
  }

  /**
   * Массовое добавление детей в группу
   */
  async addChildren(groupId: ID, childIds: ID[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ childId: ID; error: string }>;
  }> {
    const result = await this.post(`${this.endpoint}/${groupId}/children/bulk`, { childIds });
    this.clearGroupChildrenCache(groupId);
    return result;
  }

  /**
   * Перевод детей между группами
   */
  async transferChildren(fromGroupId: ID, toGroupId: ID, childIds: ID[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ childId: ID; error: string }>;
  }> {
    const result = await this.post('/groups/transfer-children', {
      fromGroupId,
      toGroupId,
      childIds
    });
    
    this.clearGroupChildrenCache(fromGroupId);
    this.clearGroupChildrenCache(toGroupId);
    return result;
  }

  /**
   * Активация/деактивация группы
   */
  async toggleActive(groupId: ID, isActive: boolean): Promise<Group> {
    const group = await this.patch<Group>(`${this.endpoint}/${groupId}`, { isActive });
    this.clearCache();
    return group;
  }

  /**
   * Поиск групп
   */
  async search(query: string, filters?: {
    isActive?: boolean;
    teacherId?: ID;
    ageGroup?: string;
  }): Promise<Group[]> {
    const params = {
      ...filters,
      search: query
    };

    return this.get<Group[]>(`${this.endpoint}/search`, { params });
  }

  /**
   * Получение доступных возрастных групп
   */
  async getAgeGroups(): Promise<string[]> {
    const cacheKey = 'age_groups';
    
    const cached = apiCache.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const ageGroups = await this.get<string[]>('/groups/age-groups');
    
    apiCache.set(cacheKey, ageGroups, this.CACHE_DURATION);
    return ageGroups;
  }

  /**
   * Экспорт списка групп
   */
  async export(format: 'csv' | 'excel' = 'excel'): Promise<Blob> {
    return this.get(`${this.endpoint}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  /**
   * Очистка кэша групп
   */
  clearCache(): void {
    apiCache.delete(this.CACHE_KEY);
    apiCache.delete(this.TEACHERS_CACHE_KEY);
    apiCache.delete('age_groups');
  }

  /**
   * Очистка кэша детей конкретной группы
   */
  private clearGroupChildrenCache(groupId: ID): void {
    apiCache.delete(`group_children_${groupId}`);
  }

  /**
   * Создание группы из шаблона
   */
  async createFromTemplate(templateId: ID, groupData: {
    name: string;
    teacherId: ID;
    maxStudents?: number;
  }): Promise<Group> {
    const group = await this.post<Group>('/groups/from-template', {
      templateId,
      ...groupData
    });
    
    this.clearCache();
    return group;
  }

  /**
   * Получение шаблонов групп
   */
  async getTemplates(): Promise<Array<{
    id: ID;
    name: string;
    description?: string;
    ageGroup: string;
    defaultMaxStudents: number;
  }>> {
    const cacheKey = 'group_templates';
    
    const cached = apiCache.get<Array<{
      id: ID;
      name: string;
      description?: string;
      ageGroup: string;
      defaultMaxStudents: number;
    }>>(cacheKey);
    if (cached) {
      return cached;
    }

    const templates = await this.get('/groups/templates');
    
    apiCache.set(cacheKey, templates, this.CACHE_DURATION);
    return templates;
  }
}

// Экспортируем экземпляр клиента
export const groupsApi = new GroupsApiClient();

// Экспортируем отдельные функции для обратной совместимости
export const getGroups = () => groupsApi.getAll();
export const getGroup = (id: ID) => groupsApi.getById(id);
export const createGroup = (group: Partial<Group>) => groupsApi.create(group);
export const updateGroup = (id: ID, groupData: Partial<Group>) => groupsApi.update(id, groupData);
export const deleteGroup = (id: ID) => groupsApi.deleteItem(id);
export const getTeachers = () => groupsApi.getTeachers();

export default groupsApi;