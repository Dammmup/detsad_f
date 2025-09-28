import api from './base';
import { OrganolepticRecord } from '../types/organoleptic';

export const getOrganolepticRecords = async (params?: any): Promise<OrganolepticRecord[]> => {
  const { data } = await api.get('/organoleptic-journal', { params });
  return data;
};

export const createOrganolepticRecord = async (record: Partial<OrganolepticRecord>): Promise<OrganolepticRecord> => {
  const { data } = await api.post('/organoleptic-journal', record);
  return data;
};

export const updateOrganolepticRecord = async (id: string, record: Partial<OrganolepticRecord>): Promise<OrganolepticRecord> => {
  const { data } = await api.put(`/organoleptic-journal/${id}`, record);
  return data;
};

export const deleteOrganolepticRecord = async (id: string): Promise<void> => {
  await api.delete(`/organoleptic-journal/${id}`);
};

export const clearOrganolepticRecords = async (): Promise<void> => {
  await api.delete('/organoleptic-journal');
};

export const generateOrganolepticByMenu = async (params: { date?: string; group?: string }): Promise<OrganolepticRecord[]> => {
  const { data } = await api.post('/organoleptic-journal/generate-by-menu', params);
  return data;
};
