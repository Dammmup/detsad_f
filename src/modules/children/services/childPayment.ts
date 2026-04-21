import { IChildPayment } from '../../../shared/types/common';
import { apiClient as api } from '../../../shared/utils/api';

const API_BASE_URL = '/child-payments';

export interface AttendanceRecalculationResult {
  payment: IChildPayment;
  calculation: {
    childId: string;
    childName: string;
    periodStart: string;
    periodEnd: string;
    baseAmount: number;
    carryOverBalance: number;
    accruals: number;
    paidAmount: number;
    workingDays: number;
    presentDays: number;
    absentWorkingDays: number;
    nonWorkingPresentDays: number;
    dailyRate: number;
    recalculatedAmount: number;
    attendanceDeduction: number;
    totalBeforeAttendance: number;
    totalDue: number;
    debt: number;
    overpayment: number;
    formula: string;
    presentDates: string[];
    absentDates: string[];
    ignoredPresentDates: string[];
  };
}

const childPaymentApi = {
  getAll: async (filters?: { monthPeriod?: string; childId?: string; status?: string }): Promise<IChildPayment[]> => {
    const params = new URLSearchParams();
    if (filters?.monthPeriod) params.append('monthPeriod', filters.monthPeriod);
    if (filters?.childId) params.append('childId', filters.childId);
    if (filters?.status) params.append('status', filters.status);

    const url = params.toString() ? `${API_BASE_URL}?${params.toString()}` : API_BASE_URL;
    const response = await api.get(url);
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

  update: async (
    id: string,
    data: Partial<IChildPayment>,
  ): Promise<IChildPayment> => {
    const response = await api.put(`${API_BASE_URL}/${id}`, data);
    return response.data;
  },

  markAsPaid: async (id: string, paymentType: 'kaspi' | 'cash' | 'none' = 'kaspi'): Promise<IChildPayment> => {
    const response = await api.post(`${API_BASE_URL}/${id}/pay`, { paymentType });
    return response.data;
  },

  cancelPaid: async (id: string): Promise<IChildPayment> => {
    const response = await api.post(`${API_BASE_URL}/${id}/cancel-paid`);
    return response.data;
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`${API_BASE_URL}/${id}`);
  },

  generate: async (date: Date): Promise<any> => {
    const response = await api.post(`${API_BASE_URL}/generate`, { date });
    return response.data;
  },

  recalculateAttendance: async (id: string): Promise<AttendanceRecalculationResult> => {
    const response = await api.post(`${API_BASE_URL}/${id}/recalculate-attendance`);
    return response.data;
  },
};

export default childPaymentApi;
