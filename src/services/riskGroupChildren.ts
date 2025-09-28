import api from './base';
import { RiskGroupChild } from '../types/riskGroupChild';

export const getRiskGroupChildren = async (params?: any): Promise<RiskGroupChild[]> => {
  const { data } = await api.get('/risk-group-children', { params });
  return data;
};

export const createRiskGroupChild = async (record: Partial<RiskGroupChild>): Promise<RiskGroupChild> => {
  const { data } = await api.post('/risk-group-children', record);
  return data;
};

export const updateRiskGroupChild = async (id: string, record: Partial<RiskGroupChild>): Promise<RiskGroupChild> => {
  const { data } = await api.put(`/risk-group-children/${id}`, record);
  return data;
};

export const deleteRiskGroupChild = async (id: string): Promise<void> => {
  await api.delete(`/risk-group-children/${id}`);
};
