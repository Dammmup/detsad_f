import api from './base';
import { HelminthRecord } from '../types/helminth';

export const getHelminthRecords = async (params?: any): Promise<HelminthRecord[]> => {
  const { data } = await api.get('/helminth-journal', { params });
  return data;
};

export const createHelminthRecord = async (record: Partial<HelminthRecord>): Promise<HelminthRecord> => {
  const { data } = await api.post('/helminth-journal', record);
  return data;
};

export const updateHelminthRecord = async (id: string, record: Partial<HelminthRecord>): Promise<HelminthRecord> => {
  const { data } = await api.put(`/helminth-journal/${id}`, record);
  return data;
};

export const deleteHelminthRecord = async (id: string): Promise<void> => {
  await api.delete(`/helminth-journal/${id}`);
};
