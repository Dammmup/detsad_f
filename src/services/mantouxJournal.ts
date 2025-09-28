import api from './base';
import { MantouxRecord } from '../types/mantoux';

export const getMantouxRecords = async (params?: any): Promise<MantouxRecord[]> => {
  const { data } = await api.get('/mantoux-journal', { params });
  return data;
};

export const createMantouxRecord = async (record: Partial<MantouxRecord>): Promise<MantouxRecord> => {
  const { data } = await api.post('/mantoux-journal', record);
  return data;
};

export const updateMantouxRecord = async (id: string, record: Partial<MantouxRecord>): Promise<MantouxRecord> => {
  const { data } = await api.put(`/mantoux-journal/${id}`, record);
  return data;
};

export const deleteMantouxRecord = async (id: string): Promise<void> => {
  await api.delete(`/mantoux-journal/${id}`);
};
