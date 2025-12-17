import { apiClient } from '../utils/api';




interface ApiError extends Error {
  status?: number;
  data?: any;
}


export interface Shift {
  id?: string;
  userId: string;
  userName?: string;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  notes?: string;
  status?: string;
  groupId?: string;
}


const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);


  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;

  throw apiError;
};

export const getSchedules = async (groupId?: string, userId?: string) => {
  try {
    console.log('Fetching schedules from API...');
    const params: any = {};
    if (groupId) params.groupId = groupId;
    if (userId) params.userId = userId;
    const response = await apiClient.get('/schedule', { params });
    const schedules: Shift[] = response.data.map((schedule: any) => ({
      id: schedule._id,
      groupId: schedule.groupId,
      userId: schedule.userId,
      date: schedule.date,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      notes: schedule.notes,
    }));
    console.log('Schedules data:', schedules);
    return schedules;
  } catch (error) {
    console.error('Error in getSchedules:', error);
    return handleApiError(error, 'fetching schedules');
  }
};

export const getShift = async (id: string) => {
  try {
    const response = await apiClient.get(`/shifts/${id}`);
    const shift: Shift = {
      id: response.data._id,
      userId: response.data.userId,
      userName: response.data.userName,
      date: response.data.date,
      startTime: response.data.startTime,
      endTime: response.data.endTime,
      type: response.data.type,
      notes: response.data.notes,
      status: response.data.status,
    };
    return shift;
  } catch (error) {
    return handleApiError(error, `fetching shift ${id}`);
  }
};

export const createSchedule = async (record: Shift) => {
  try {
    const response = await apiClient.post('/schedule', {
      groupId: record.groupId,
      userId: record.userId,
      date: record.date,
      startTime: record.startTime,
      endTime: record.endTime,
      notes: record.notes,
    });
    const createdRecord: Shift = {
      id: response.data._id,
      groupId: response.data.groupId,
      userId: response.data.userId,
      date: response.data.date,
      startTime: response.data.startTime,
      endTime: response.data.endTime,
      notes: response.data.notes,
      type: response.data.type,
    };
    return createdRecord;
  } catch (error) {
    return handleApiError(error, 'creating schedule');
  }
};

export const updateSchedule = async (id: string, record: Shift) => {
  try {
    const response = await apiClient.put(`/schedule/${id}`, {
      groupId: record.groupId,
      userId: record.userId,
      date: record.date,
      startTime: record.startTime,
      endTime: record.endTime,
      notes: record.notes,
    });
    const updatedRecord: Shift = {
      id: response.data._id,
      groupId: response.data.groupId,
      userId: response.data.userId,
      date: response.data.date,
      startTime: response.data.startTime,
      endTime: response.data.endTime,
      notes: response.data.notes,
      type: response.data.type,
    };
    return updatedRecord;
  } catch (error) {
    return handleApiError(error, `updating schedule ${id}`);
  }
};

export const deleteSchedule = async (id: string) => {
  try {
    await apiClient.delete(`/schedule/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting schedule ${id}`);
  }
};

