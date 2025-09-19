import axios from 'axios';

const API_URL = '/api/staff-shifts';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'day_off' | 'vacation' | 'sick_leave' | 'full';
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'confirmed';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export const getShifts = async (): Promise<Shift[]> => {
  const response = await axios.get<Shift[]>(API_URL);
  return response.data;
};

export const getShift = async (id: string): Promise<Shift> => {
  const response = await axios.get<Shift>(`${API_URL}/${id}`);
  return response.data;
};

export const createShift = async (shiftData: Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>): Promise<Shift> => {
  const response = await axios.post<Shift>(API_URL, shiftData);
  return response.data;
};

export const updateShift = async (id: string, shiftData: Partial<Omit<Shift, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Shift> => {
  const response = await axios.put<Shift>(`${API_URL}/${id}`, shiftData);
  return response.data;
};

export const deleteShift = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};
