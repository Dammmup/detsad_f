import apiClient from './base';

export interface Holiday {
  _id: string;
  id?: string;
  name: string;
  day: number;
  month: number;
  year?: number;
  isRecurring: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface HolidayFormData {
  name: string;
  day: number;
  month: number;
  year?: number;
  isRecurring: boolean;
  description?: string;
}



const HOLIDAYS_API_BASE = '/holidays';

export const getAllHolidays = async (filters?: {
  year?: number;
  month?: number;
  isRecurring?: boolean;
}): Promise<Holiday[]> => {
  const params = new URLSearchParams();

  if (filters?.year) params.append('year', filters.year.toString());
  if (filters?.month) params.append('month', filters.month.toString());
  if (filters?.isRecurring !== undefined)
    params.append('isRecurring', filters.isRecurring.toString());

  const queryString = params.toString();
  const url = queryString
    ? `${HOLIDAYS_API_BASE}?${queryString}`
    : HOLIDAYS_API_BASE;

  return apiClient.get(url);
};

export const getHolidayById = async (id: string): Promise<Holiday> => {
  return apiClient.get(`${HOLIDAYS_API_BASE}/${id}`);
};

export const createHoliday = async (
  holidayData: HolidayFormData,
): Promise<Holiday> => {
  return apiClient.post(HOLIDAYS_API_BASE, holidayData);
};

export const updateHoliday = async (
  id: string,
  holidayData: Partial<HolidayFormData>,
): Promise<Holiday> => {
  return apiClient.put(`${HOLIDAYS_API_BASE}/${id}`, holidayData);
};

export const deleteHoliday = async (id: string): Promise<void> => {
  return apiClient.delete(`${HOLIDAYS_API_BASE}/${id}`);
};


export const checkIfHoliday = async (
  date: string,
): Promise<{ isHoliday: boolean; date: Date }> => {
  return apiClient.get(`${HOLIDAYS_API_BASE}/check/${date}`);
};
