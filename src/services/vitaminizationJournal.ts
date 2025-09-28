import api from './base';
import { VitaminizationRecord } from '../types/vitaminization';

export const getVitaminizationRecords = async (params?: any): Promise<VitaminizationRecord[]> => {
  const { data } = await api.get('/vitaminization-journal', { params });
  return data;
};

export const createVitaminizationRecord = async (record: Partial<VitaminizationRecord>): Promise<VitaminizationRecord> => {
  const { data } = await api.post('/vitaminization-journal', record);
  return data;
};

export const updateVitaminizationRecord = async (id: string, record: Partial<VitaminizationRecord>): Promise<VitaminizationRecord> => {
  const { data } = await api.put(`/vitaminization-journal/${id}`, record);
  return data;
};

export const deleteVitaminizationRecord = async (id: string): Promise<void> => {
  await api.delete(`/vitaminization-journal/${id}`);
};

export const clearVitaminizationRecords = async (): Promise<void> => {
  await api.delete('/vitaminization-journal');
};
