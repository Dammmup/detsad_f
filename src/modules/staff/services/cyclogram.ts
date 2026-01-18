import { ActivityTemplate, DailySchedule, ScheduleBlock } from '../../../shared/types/staff';
import { BaseCrudApiClient, apiClient } from '../../../shared/utils/api';

class ActivityTemplateApiClient extends BaseCrudApiClient<ActivityTemplate> {
  endpoint = '/cyclogram/activity-templates';

  async getTypes(): Promise<{ value: string; label: string }[]> {
    const { data } = await apiClient.get(`${this.endpoint}/types`);
    return data;
  }
}

class DailyScheduleApiClient extends BaseCrudApiClient<DailySchedule> {
  endpoint = '/cyclogram/daily-schedules';

  async getWeekSchedule(groupId: string, startDate: string): Promise<DailySchedule[]> {
    const { data } = await apiClient.get(`${this.endpoint}/week`, { params: { groupId, startDate } });
    return data;
  }

  async updateBlocks(id: string, blocks: ScheduleBlock[]): Promise<DailySchedule> {
    const { data } = await apiClient.put(`${this.endpoint}/${id}/blocks`, { blocks });
    return data;
  }

  async copyFromPreviousWeek(groupId: string, targetDate: string): Promise<DailySchedule[]> {
    const { data } = await apiClient.post(`${this.endpoint}/copy-week`, { groupId, targetDate });
    return data;
  }
}

export const activityTemplateApi = new ActivityTemplateApiClient();
export const dailyScheduleApi = new DailyScheduleApiClient();

// Activity Templates
export const getActivityTemplates = (filters?: any) => activityTemplateApi.getAll(filters);
export const getActivityTypes = () => activityTemplateApi.getTypes();
export const createActivityTemplate = (data: Partial<ActivityTemplate>) => activityTemplateApi.create(data);
export const updateActivityTemplate = (id: string, data: Partial<ActivityTemplate>) => activityTemplateApi.update(id, data);
export const deleteActivityTemplate = (id: string) => activityTemplateApi.deleteItem(id);

// Daily Schedules
export const getDailySchedules = (filters?: any) => dailyScheduleApi.getAll(filters);
export const getWeekSchedule = (groupId: string, startDate: string) => dailyScheduleApi.getWeekSchedule(groupId, startDate);
export const createDailySchedule = (data: Partial<DailySchedule>) => dailyScheduleApi.create(data);
export const updateDailyScheduleBlocks = (id: string, blocks: ScheduleBlock[]) => dailyScheduleApi.updateBlocks(id, blocks);
export const deleteDailySchedule = (id: string) => dailyScheduleApi.deleteItem(id);
export const copyFromPreviousWeek = (groupId: string, targetDate: string) => dailyScheduleApi.copyFromPreviousWeek(groupId, targetDate);

export type { ActivityTemplate, DailySchedule, ScheduleBlock };
