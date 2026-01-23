import { apiClient } from '../../../shared/utils/api';

export interface User {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  position?: string;
  type: 'adult' | 'child';
  _id?: string;
}

export const getUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/users');
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await apiClient.get<User>(`/users/${id}`);
  return response.data;
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  const response = await apiClient.post<User>('/users', userData);
  return response.data;
};

export const updateUser = async (
  id: string,
  userData: Partial<User>,
): Promise<User> => {
  const response = await apiClient.put<User>(`/users/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};

// API object for backward compatibility
export const usersApi = {
  getAll: getUsers,
  getById: getUser,
  create: createUser,
  update: updateUser,
  delete: deleteUser,
};

export const userApi = usersApi;
