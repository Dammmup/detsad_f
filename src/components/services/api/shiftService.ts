import axios from 'axios';
import { Shift } from './types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

// Create axios instance with base config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export const getShifts = async (startDate?: string, endDate?: string): Promise<Shift[]> => {
  try {
    const params: any = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const response = await api.get(`/api/staff-shifts`, { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching shifts:', error);
    throw error;
  }
};

export const createShift = async (shiftData: Omit<Shift, 'id'>): Promise<Shift> => {
  try {
    const response = await api.post(`/api/staff-shifts`, shiftData);
    return response.data;
  } catch (error) {
    console.error('Error creating shift:', error);
    throw error;
  }
};

export const updateShift = async (id: string, shiftData: Partial<Omit<Shift, 'id'>>): Promise<Shift> => {
  try {
    const response = await api.put(`/api/staff-shifts/${id}`, shiftData);
    return response.data;
  } catch (error) {
    console.error('Error updating shift:', error);
    throw error;
  }
};

export const deleteShift = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/staff-shifts/${id}`);
  } catch (error) {
    console.error('Error deleting shift:', error);
    throw error;
  }
};

export const updateShiftStatus = async (id: string, status: Shift['status']): Promise<Shift> => {
  try {
    const response = await api.put(`/api/staff-shifts/${id}`, { status });
    return response.data;
  } catch (error) {
    console.error('Error updating shift status:', error);
    throw error;
  }
};
