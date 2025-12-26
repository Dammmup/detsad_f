import { apiClient } from '../utils/api';

interface ApiError extends Error {
  status?: number;
  data?: any;
}

const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);

  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;

  throw apiError;
};

// =====================================================
// Activity Templates API
// =====================================================

export interface ActivityTemplate {
  _id: string;
  name: string;
  type: string;
  category: string;
  content: string;
  goal?: string;
  ageGroups: string[];
  duration?: number;
  order: number;
  isActive: boolean;
}

export interface ScheduleBlock {
  order: number;
  time?: string;
  activityType: string;
  templateId?: string;
  content: string;
  topic?: string;
  goal?: string;
}

export interface DailySchedule {
  _id: string;
  groupId: string | { _id: string; name: string };
  date: string;
  dayOfWeek: string;
  weekNumber?: number;
  blocks: ScheduleBlock[];
  createdBy?: string | { _id: string; fullName: string };
  isTemplate: boolean;
  templateName?: string;
}

// Activity Templates
export const getActivityTemplates = async (filters?: { type?: string; ageGroup?: string }): Promise<ActivityTemplate[]> => {
  try {
    const params: any = {};
    if (filters?.type) params.type = filters.type;
    if (filters?.ageGroup) params.ageGroup = filters.ageGroup;
    const response = await apiClient.get('/cyclogram/activity-templates', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching activity templates');
  }
};

export const getActivityTypes = async (): Promise<{ value: string; label: string }[]> => {
  try {
    const response = await apiClient.get('/cyclogram/activity-templates/types');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching activity types');
  }
};

export const createActivityTemplate = async (data: Partial<ActivityTemplate>): Promise<ActivityTemplate> => {
  try {
    const response = await apiClient.post('/cyclogram/activity-templates', data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'creating activity template');
  }
};

export const updateActivityTemplate = async (id: string, data: Partial<ActivityTemplate>): Promise<ActivityTemplate> => {
  try {
    const response = await apiClient.put(`/cyclogram/activity-templates/${id}`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'updating activity template');
  }
};

export const deleteActivityTemplate = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/cyclogram/activity-templates/${id}`);
  } catch (error) {
    return handleApiError(error, 'deleting activity template');
  }
};

// Daily Schedules
export const getDailySchedules = async (filters?: { groupId?: string; date?: string }): Promise<DailySchedule[]> => {
  try {
    const params: any = {};
    if (filters?.groupId) params.groupId = filters.groupId;
    if (filters?.date) params.date = filters.date;
    const response = await apiClient.get('/cyclogram/daily-schedules', { params });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching daily schedules');
  }
};

export const getWeekSchedule = async (groupId: string, startDate: string): Promise<DailySchedule[]> => {
  try {
    const response = await apiClient.get('/cyclogram/daily-schedules/week', { params: { groupId, startDate } });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching week schedule');
  }
};

export const createDailySchedule = async (data: Partial<DailySchedule>): Promise<DailySchedule> => {
  try {
    const response = await apiClient.post('/cyclogram/daily-schedules', data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'creating daily schedule');
  }
};

export const updateDailyScheduleBlocks = async (id: string, blocks: ScheduleBlock[]): Promise<DailySchedule> => {
  try {
    const response = await apiClient.put(`/cyclogram/daily-schedules/${id}/blocks`, { blocks });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'updating schedule blocks');
  }
};

export const deleteDailySchedule = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/cyclogram/daily-schedules/${id}`);
  } catch (error) {
    return handleApiError(error, 'deleting daily schedule');
  }
};

export const copyFromPreviousWeek = async (groupId: string, targetDate: string): Promise<DailySchedule[]> => {
  try {
    const response = await apiClient.post('/cyclogram/daily-schedules/copy-week', { groupId, targetDate });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'copying from previous week');
  }
};
