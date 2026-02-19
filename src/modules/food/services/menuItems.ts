import { apiClient as api } from '../../../shared/utils/api';

export interface MenuItem {
  _id?: string;
  name: string;
  meal: string;
  group: string;
  vitaminDose: number;
  defaultPortion: number;
  unit: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getMenuItems = async (): Promise<MenuItem[]> => {
  const { data } = await api.get('/menu-items');
  return data;
};

export const createMenuItem = async (
  item: Partial<MenuItem>,
): Promise<MenuItem> => {
  const { data } = await api.post('/menu-items', item);
  return data;
};

export const updateMenuItem = async (
  id: string,
  item: Partial<MenuItem>,
): Promise<MenuItem> => {
  const { data } = await api.put(`/menu-items/${id}`, item);
  return data;
};

export const deleteMenuItem = async (id: string): Promise<void> => {
  await api.delete(`/menu-items/${id}`);
};
