import { apiClient } from '../utils/api';


interface ApiError extends Error {
  status?: number;
  data?: any;
}


export interface CyclogramActivity {
  id?: string;
  name: string;
  description?: string;
  duration: number;
  type:
  | 'educational'
  | 'physical'
  | 'creative'
  | 'rest'
  | 'meal'
  | 'hygiene'
  | 'outdoor';
  ageGroup: string;
  materials?: string[];
  goals?: string[];
  methods?: string[];
}


export interface CyclogramTimeSlot {
  id?: string;
  startTime: string;
  endTime: string;
  activity: CyclogramActivity;
  dayOfWeek: number;
  groupId?: string;
  teacherId?: string;
  notes?: string;
}


export interface WeeklyCyclogram {
  id?: string;
  title: string;
  description?: string;
  ageGroup: string;
  groupId: string;
  teacherId: string;
  weekStartDate: string;
  timeSlots: CyclogramTimeSlot[];
  status: 'draft' | 'active' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}


export interface CyclogramTemplate {
  id?: string;
  name: string;
  description?: string;
  ageGroup: string;
  timeSlots: Omit<CyclogramTimeSlot, 'id' | 'groupId' | 'teacherId'>[];
  isDefault: boolean;
  createdAt?: string;
}


const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);


  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;

  throw apiError;
};



export const getCyclograms = async (groupId?: string) => {
  try {
    const params: any = {};
    if (groupId) params.groupId = groupId;
    const response = await apiClient.get('/cyclogram', { params });
    const cyclograms: WeeklyCyclogram[] = response.data.map((item: any) => ({
      id: item._id,
      title: item.title,
      description: item.description,
      ageGroup: item.ageGroup,
      groupId: item.groupId,
      teacherId: item.teacherId,
      weekStartDate: item.weekStartDate,
      timeSlots: item.timeSlots,
      status: item.status,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    return cyclograms;
  } catch (error) {
    return handleApiError(error, 'fetching cyclograms');
  }
};

export const getCyclogram = async (id: string) => {
  try {
    const response = await apiClient.get(`/cyclogram/${id}`);
    const cyclogram: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };
    return cyclogram;
  } catch (error) {
    return handleApiError(error, `fetching cyclogram ${id}`);
  }
};

export const createCyclogram = async (cyclogram: WeeklyCyclogram) => {
  try {
    const response = await apiClient.post('/cyclogram', cyclogram);
    const created: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };
    return created;
  } catch (error) {
    return handleApiError(error, 'creating cyclogram');
  }
};

export const updateCyclogram = async (
  id: string,
  cyclogram: WeeklyCyclogram,
) => {
  try {
    const response = await apiClient.put(`/cyclogram/${id}`, cyclogram);
    const updated: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };
    return updated;
  } catch (error) {
    return handleApiError(error, `updating cyclogram ${id}`);
  }
};

export const deleteCyclogram = async (id: string) => {
  try {
    await apiClient.delete(`/cyclogram/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting cyclogram ${id}`);
  }
};

export const getCyclogramTemplates = async (ageGroup?: string) => {
  try {
    const params: any = {};
    if (ageGroup) params.ageGroup = ageGroup;

    const response = await apiClient.get('/cyclogram/templates', { params });
    const templates: CyclogramTemplate[] = response.data.map((item: any) => ({
      id: item._id,
      name: item.name,
      description: item.description,
      ageGroup: item.ageGroup,
      timeSlots: item.timeSlots,
      isDefault: item.isDefault,
      createdAt: item.createdAt,
    }));

    return templates;
  } catch (error) {
    return handleApiError(error, 'fetching cyclogram templates');
  }
};

export const createCyclogramFromTemplate = async (
  templateId: string,
  params: {
    title: string;
    groupId: string;
    teacherId: string;
    weekStartDate: string;
  },
) => {
  try {
    const response = await apiClient.post(
      `/cyclogram/templates/${templateId}/create`,
      params,
    );

    const createdCyclogram: WeeklyCyclogram = {
      id: response.data._id,
      title: response.data.title,
      description: response.data.description,
      ageGroup: response.data.ageGroup,
      groupId: response.data.groupId,
      teacherId: response.data.teacherId,
      weekStartDate: response.data.weekStartDate,
      timeSlots: response.data.timeSlots,
      status: response.data.status,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };

    return createdCyclogram;
  } catch (error) {
    return handleApiError(error, 'creating cyclogram from template');
  }
};

































