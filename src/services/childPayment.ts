import { IChildPayment } from '../types/common';
import api from '../services/base';

const API_BASE_URL = '/child-payments';

const childPaymentApi = {
  getAll: async (): Promise<IChildPayment[]> => {
    const response = await api.get(API_BASE_URL);
    return response.data;
  },

  getById: async (id: string): Promise<IChildPayment> => {
    const response = await api.get(`${API_BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: Partial<IChildPayment>): Promise<IChildPayment> => {
    const response = await api.post(API_BASE_URL, data);
    return response.data;
  },

  update: async (id: string, data: Partial<IChildPayment>): Promise<IChildPayment> => {
    const response = await api.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`${API_BASE_URL}/${id}`);
  }
};

export default childPaymentApi;