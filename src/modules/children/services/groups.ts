import { BaseCrudApiClient } from '../../../shared/utils/api';
import { Group, User, ID } from '../../../shared/types/common';

class GroupsApiClient extends BaseCrudApiClient<Group> {
  protected endpoint = '/groups';

  async getAll(): Promise<Group[]> {
    const groups = await super.getAll();
    return groups;
  }

  async create(groupData: Partial<Group>): Promise<Group> {
    const payload: any = {
      name: groupData.name,
      description: groupData.description,
      teacher: groupData.teacher,
      isActive: groupData.isActive ?? true,
      maxStudents: groupData.maxStudents,
      ageGroup: Array.isArray(groupData.ageGroup)
        ? groupData.ageGroup[0] || ''
        : (groupData.ageGroup as any as string) || '',
    };
    if (!payload.teacher) {
      delete payload.teacher;
    }
    const group = await super.create(payload);
    return group;
  }

  async update(id: ID, groupData: Partial<Group>): Promise<Group> {
    const payload: any = {
      ...groupData,
      ageGroup: Array.isArray(groupData.ageGroup)
        ? groupData.ageGroup[0] || ''
        : (groupData.ageGroup as any as string) || '',
    };
    if (!payload.teacher) {
      delete payload.teacher;
    }
    const group = await this.put<Group>(`${this.endpoint}/${id}`, payload);
    return group;
  }

  async deleteItem(id: ID): Promise<void> {
    await this.delete(`${this.endpoint}/${id}`);
  }

  async getTeachers(): Promise<User[]> {
    try {
      const teachers = await this.get<User[]>('/users/teachers', {
        params: {
          role: 'teacher',
          fields: 'id,name,email,avatar',
        },
      });

      const formattedTeachers = teachers.map((teacher) => ({
        ...teacher,
        id: teacher._id || teacher.id,
        name: teacher.fullName,
      }));

      return formattedTeachers;
    } catch (error) {
      console.warn('Could not fetch teachers, using empty list as fallback');
      return [];
    }
  }

  async getGroupChildren(groupId: ID): Promise<User[]> {
    const children = await this.get<User[]>(`/users/group/${groupId}/children`);
    return children;
  }

  async getGroupStats(groupId: ID): Promise<{
    totalChildren: number;
    activeChildren: number;
    averageAge: number;
    attendanceRate: number;
  }> {
    return this.get(`${this.endpoint}/${groupId}/stats`);
  }

  async getGroupSchedule(
    groupId: ID,
    startDate?: string,
    endDate?: string,
  ): Promise<any[]> {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return this.get(`${this.endpoint}/${groupId}/schedule`, { params });
  }

  async assignTeacher(groupId: ID, teacherId: ID): Promise<Group> {
    const group = await this.patch<Group>(`${this.endpoint}/${groupId}`, {
      teacher: teacherId,
    });
    return group;
  }

  async addChild(groupId: ID, childId: ID): Promise<void> {
    await this.post(`${this.endpoint}/${groupId}/children`, { childId });
  }

  async removeChild(groupId: ID, childId: ID): Promise<void> {
    await this.delete(`${this.endpoint}/${groupId}/children/${childId}`);
  }

  async addChildren(
    groupId: ID,
    childIds: ID[],
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ childId: ID; error: string }>;
  }> {
    const result = await this.post(
      `${this.endpoint}/${groupId}/children/bulk`,
      { childIds },
    );
    return result;
  }

  async transferChildren(
    fromGroupId: ID,
    toGroupId: ID,
    childIds: ID[],
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ childId: ID; error: string }>;
  }> {
    const result = await this.post('/groups/transfer-children', {
      fromGroupId,
      toGroupId,
      childIds,
    });
    return result;
  }

  async toggleActive(groupId: ID, isActive: boolean): Promise<Group> {
    const group = await this.patch<Group>(`${this.endpoint}/${groupId}`, {
      isActive,
    });
    return group;
  }

  async search(
    query: string,
    filters?: {
      isActive?: boolean;
      teacherId?: ID;
      ageGroup?: string;
    },
  ): Promise<Group[]> {
    const params = {
      ...filters,
      search: query,
    };

    return this.get<Group[]>(`${this.endpoint}/search`, { params });
  }

  async getAgeGroups(): Promise<string[]> {
    const ageGroups = await this.get<string[]>('/groups/age-groups');
    return ageGroups;
  }

  async export(format: 'excel' = 'excel'): Promise<Blob> {
    return this.get(`${this.endpoint}/export`, {
      params: { format },
      responseType: 'blob',
    });
  }

  async createFromTemplate(
    templateId: ID,
    groupData: {
      name: string;
      teacherId: ID;
      maxStudents?: number;
    },
  ): Promise<Group> {
    const group = await this.post<Group>('/groups/from-template', {
      templateId,
      ...groupData,
    });
    return group;
  }

  async getTemplates(): Promise<
    Array<{
      id: ID;
      name: string;
      description?: string;
      ageGroup: string;
      defaultMaxStudents: number;
    }>
  > {
    const templates = await this.get('/groups/templates');
    return templates;
  }
}


export const groupsApi = new GroupsApiClient();


export const getGroups = () => groupsApi.getAll();
export const getGroup = (id: ID) => groupsApi.getById(id);
export const createGroup = (group: Partial<Group>) => groupsApi.create(group);
export const updateGroup = (id: ID, groupData: Partial<Group>) =>
  groupsApi.update(id, groupData);
export const deleteGroup = (id: ID) => groupsApi.deleteItem(id);
export const getTeachers = () => groupsApi.getTeachers();

export default groupsApi;
