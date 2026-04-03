import { apiClient, normalizeMongoArray, normalizeMongoObject } from '../../../shared/utils/api';
import { IExternalSpecialist } from '../../../shared/types/common';

export const getExternalSpecialists = async (): Promise<IExternalSpecialist[]> => {
  const response = await apiClient.get<IExternalSpecialist[]>('/external-specialists');
  return normalizeMongoArray(response.data || response) as IExternalSpecialist[];
};

export const getExternalSpecialist = async (id: string): Promise<IExternalSpecialist> => {
  const response = await apiClient.get<IExternalSpecialist>(`/external-specialists/${id}`);
  return normalizeMongoObject(response.data || response) as IExternalSpecialist;
};

export const createExternalSpecialist = async (
  data: Omit<IExternalSpecialist, '_id' | 'createdAt' | 'updatedAt'>
): Promise<IExternalSpecialist> => {
  const response = await apiClient.post<IExternalSpecialist>('/external-specialists', data);
  return normalizeMongoObject(response.data || response) as IExternalSpecialist;
};

export const updateExternalSpecialist = async (
  id: string,
  data: Partial<IExternalSpecialist>
): Promise<IExternalSpecialist> => {
  const response = await apiClient.put<IExternalSpecialist>(`/external-specialists/${id}`, data);
  return normalizeMongoObject(response.data || response) as IExternalSpecialist;
};

export const deleteExternalSpecialist = async (id: string): Promise<void> => {
  await apiClient.delete(`/external-specialists/${id}`);
};

export const externalSpecialistsApi = {
  getAll: getExternalSpecialists,
  getById: getExternalSpecialist,
  create: createExternalSpecialist,
  update: updateExternalSpecialist,
  delete: deleteExternalSpecialist,
};
