import api from './base';
import { VitaminizationRecord } from '../types/vitaminization';

// ...CRUD...

export const generateVitaminizationByMenu = async (params: { date?: string; group?: string; nurse?: string }): Promise<VitaminizationRecord[]> => {
  const { data } = await api.post('/vitaminization-journal/generate-by-menu', params);
  return data;
};
