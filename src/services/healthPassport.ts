import api from './base';
import { HealthPassport } from '../types/healthPassport';

export const getHealthPassports = async (params?: any): Promise<HealthPassport[]> => {
  const { data } = await api.get('/health-passport', { params });
  return data;
};

export const createHealthPassport = async (record: Partial<HealthPassport>): Promise<HealthPassport> => {
  const { data } = await api.post('/health-passport', record);
  return data;
};

export const updateHealthPassport = async (id: string, record: Partial<HealthPassport>): Promise<HealthPassport> => {
  const { data } = await api.put(`/health-passport/${id}`, record);
  return data;
};

export const deleteHealthPassport = async (id: string): Promise<void> => {
  await api.delete(`/health-passport/${id}`);
};
