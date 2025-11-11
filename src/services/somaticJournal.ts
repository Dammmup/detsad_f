import api from './base';
import { SomaticRecord } from '../types/somatic';

export const getSomaticRecords = async (
  params?: any,
): Promise<SomaticRecord[]> => {
  const { data } = await api.get('/somatic-journal', { params });
  return data;
};

export const createSomaticRecord = async (
  record: Partial<SomaticRecord>,
): Promise<SomaticRecord> => {
  const { data } = await api.post('/somatic-journal', record);
  return data;
};

export const updateSomaticRecord = async (
  id: string,
  record: Partial<SomaticRecord>,
): Promise<SomaticRecord> => {
  const { data } = await api.put(`/somatic-journal/${id}`, record);
  return data;
};

export const deleteSomaticRecord = async (id: string): Promise<void> => {
  await api.delete(`/somatic-journal/${id}`);
};
