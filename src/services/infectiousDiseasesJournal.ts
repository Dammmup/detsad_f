import api from './base';
import { InfectiousDiseaseRecord } from '../types/infectiousDisease';

export const getInfectiousDiseaseRecords = async (
  params?: any,
): Promise<InfectiousDiseaseRecord[]> => {
  const { data } = await api.get('/infectious-diseases-journal', { params });
  return data;
};

export const createInfectiousDiseaseRecord = async (
  record: Partial<InfectiousDiseaseRecord>,
): Promise<InfectiousDiseaseRecord> => {
  const { data } = await api.post('/infectious-diseases-journal', record);
  return data;
};

export const updateInfectiousDiseaseRecord = async (
  id: string,
  record: Partial<InfectiousDiseaseRecord>,
): Promise<InfectiousDiseaseRecord> => {
  const { data } = await api.put(`/infectious-diseases-journal/${id}`, record);
  return data;
};

export const deleteInfectiousDiseaseRecord = async (
  id: string,
): Promise<void> => {
  await api.delete(`/infectious-diseases-journal/${id}`);
};
