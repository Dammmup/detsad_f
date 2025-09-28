import api from './base';
import { TubPositiveRecord } from '../types/tubPositive';

export const getTubPositiveRecords = async (params?: any): Promise<TubPositiveRecord[]> => {
  const { data } = await api.get('/tub-positive-journal', { params });
  return data;
};

export const createTubPositiveRecord = async (record: Partial<TubPositiveRecord>): Promise<TubPositiveRecord> => {
  const { data } = await api.post('/tub-positive-journal', record);
  return data;
};

export const updateTubPositiveRecord = async (id: string, record: Partial<TubPositiveRecord>): Promise<TubPositiveRecord> => {
  const { data } = await api.put(`/tub-positive-journal/${id}`, record);
  return data;
};

export const deleteTubPositiveRecord = async (id: string): Promise<void> => {
  await api.delete(`/tub-positive-journal/${id}`);
};
