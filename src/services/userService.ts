import axios from 'axios';

const REACT_APP_API_URL = '/users';

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
  const response = await axios.get<User[]>(REACT_APP_API_URL);
  return response.data;
};

export const getUser = async (id: string): Promise<User> => {
  const response = await axios.get<User>(`${REACT_APP_API_URL}/${id}`);
  return response.data;
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
  const response = await axios.post<User>(REACT_APP_API_URL, userData);
  return response.data;
};

export const updateUser = async (id: string, userData: Partial<User>): Promise<User> => {
  const response = await axios.put<User>(`${REACT_APP_API_URL}/${id}`, userData);
  return response.data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await axios.delete(`${REACT_APP_API_URL}/${id}`);
};
