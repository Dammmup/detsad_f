import { apiClient } from '../utils/api';


export interface Payroll {
  _id?: string;
  staffId: {
    _id: string;
    fullName: string;
    role: string;
  };
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  advance?: number;
  advanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  accruals: number;
  penalties: number;
  baseSalaryType: string;
  shiftRate?: number;
  latePenalties?: number;
  absencePenalties?: number;
  userFines?: number;
  penaltyDetails?: {
    type: string;
    amount: number;
    latePenalties: number;
    absencePenalties: number;
    userFines: number;
  };
  history?: Array<{
    date: Date;
    action: string;
    comment?: string;
  }>;
  workedDays?: number;
  workedShifts?: number;
}


export interface VirtualPayroll {
  _id: null;
  staffId: {
    _id: string;
    fullName: string;
    role: string;
  };
  period: string;
  baseSalary: number;
  bonuses: number;
  deductions: number;
  total: number;
  status: 'draft' | 'approved' | 'paid';
  paymentDate?: Date;
  advance?: number;
  advanceDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  accruals: number;
  penalties: number;
  baseSalaryType: string;
  shiftRate?: number;
  latePenalties?: number;
  absencePenalties?: number;
  userFines?: number;
  penaltyDetails?: {
    type: string;
    amount: number;
    latePenalties: number;
    absencePenalties: number;
    userFines: number;
  };
  history: undefined;
  workedDays?: number;
  workedShifts?: number;
}

export interface PayrollFilters {
  userId?: string;
  period?: string;
  status?: string;
}


interface ApiError extends Error {
  status?: number;
  data?: any;
}


const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);


  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;

  throw apiError;
};

export const getPayrollsByUsers = async (filters: PayrollFilters) => {
  try {
    const response = await apiClient.get('/payroll/by-users', {
      params: filters,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching payrolls by users');
  }
};

export const getPayrolls = async (filters: PayrollFilters) => {
  try {
    const response = await apiClient.get('/payroll', { params: filters });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching payrolls');
  }
};

export const getPayrollById = async (id: string) => {
  try {
    const response = await apiClient.get(`/payroll/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `fetching payroll ${id}`);
  }
};

export const createPayroll = async (payrollData: Partial<Payroll>) => {
  try {
    const response = await apiClient.post('/payroll', payrollData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'creating payroll');
  }
};

export const updatePayroll = async (
  id: string,
  payrollData: Partial<Payroll>,
) => {
  try {
    const response = await apiClient.put(`/payroll/${id}`, payrollData);
    return response.data;
  } catch (error) {
    return handleApiError(error, `updating payroll ${id}`);
  }
};

export const deletePayroll = async (id: string) => {
  try {
    await apiClient.delete(`/payroll/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting payroll ${id}`);
  }
};

export const approvePayroll = async (id: string) => {
  try {
    const response = await apiClient.patch(`/payroll/${id}/approve`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `approving payroll ${id}`);
  }
};

export const markPayrollAsPaid = async (id: string) => {
  try {
    const response = await apiClient.patch(`/payroll/${id}/mark-paid`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `marking payroll as paid ${id}`);
  }
};

export const calculatePayroll = async (staffId: string, month: string) => {
  try {
    const response = await apiClient.post('/payroll/calculate', {
      staffId,
      month,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'calculating payroll');
  }
};

export const generatePayrollSheets = async (period: string) => {
  try {
    const response = await apiClient.post(
      '/payroll/generate-sheets',
      { period },
      {
        timeout: 60000,
      },
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'generating payroll sheets');
  }
};

export const generateRentSheets = async (period: string) => {
  try {
    const response = await apiClient.post(
      '/rent/generate-sheets',
      { period },
      {
        timeout: 60000,
      },
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'generating rent sheets');
  }
};

export const addFine = async (
  id: string,
  fineData: { amount: number; reason: string; type?: string; notes?: string },
) => {
  try {
    const response = await apiClient.post(`/payroll/${id}/fines`, fineData);
    return response.data;
  } catch (error) {
    return handleApiError(error, `adding fine to payroll ${id}`);
  }
};
