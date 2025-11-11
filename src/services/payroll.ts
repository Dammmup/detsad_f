import { apiClient } from '../utils/api';

// Интерфейсы для зарплаты
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
  advance?: number; // Аванс
  advanceDate?: Date; // Дата аванса
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

// Интерфейс для виртуальной зарплаты (когда нет записи в коллекции payrolls)
export interface VirtualPayroll {
  _id: null; // Отсутствие ID указывает на виртуальную запись
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
  advance?: number; // Аванс
  advanceDate?: Date; // Дата аванса
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

// API Error interface
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Helper function to handle API errors
const handleApiError = (error: any, context = '') => {
  const errorMessage = error.response?.data?.message || error.message;
  console.error(`Error ${context}:`, errorMessage);

  // Create a more detailed error object
  const apiError = new Error(`Error ${context}: ${errorMessage}`) as ApiError;
  apiError.status = error.response?.status;
  apiError.data = error.response?.data;

  throw apiError;
};

/**
 * Get all payrolls based on users collection
 * This method returns payrolls for all users, creating virtual payroll records for users without existing payroll entries
 * @param {PayrollFilters} filters - Filters for payrolls
 * @returns {Promise<Payroll[]>} List of payrolls
 */
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

/**
 * Get all payrolls
 * @param {PayrollFilters} filters - Filters for payrolls
 * @returns {Promise<Payroll[]>} List of payrolls
 */
export const getPayrolls = async (filters: PayrollFilters) => {
  try {
    const response = await apiClient.get('/payroll', { params: filters });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching payrolls');
  }
};

/**
 * Get payroll by ID
 * @param {string} id - Payroll ID
 * @returns {Promise<Payroll>} Payroll data
 */
export const getPayrollById = async (id: string) => {
  try {
    const response = await apiClient.get(`/payroll/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `fetching payroll ${id}`);
  }
};

/**
 * Create new payroll
 * @param {Partial<Payroll>} payrollData - Payroll data to create
 * @returns {Promise<Payroll>} Created payroll
 */
export const createPayroll = async (payrollData: Partial<Payroll>) => {
  try {
    const response = await apiClient.post('/payroll', payrollData);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'creating payroll');
  }
};

/**
 * Update payroll
 * @param {string} id - Payroll ID
 * @param {Partial<Payroll>} payrollData - Updated payroll data
 * @returns {Promise<Payroll>} Updated payroll
 */
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

/**
 * Delete payroll
 * @param {string} id - Payroll ID
 * @returns {Promise<void>} Success response
 */
export const deletePayroll = async (id: string) => {
  try {
    await apiClient.delete(`/payroll/${id}`);
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting payroll ${id}`);
  }
};

/**
 * Approve payroll
 * @param {string} id - Payroll ID
 * @returns {Promise<Payroll>} Updated payroll
 */
export const approvePayroll = async (id: string) => {
  try {
    const response = await apiClient.patch(`/payroll/${id}/approve`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `approving payroll ${id}`);
  }
};

/**
 * Mark payroll as paid
 * @param {string} id - Payroll ID
 * @returns {Promise<Payroll>} Updated payroll
 */
export const markPayrollAsPaid = async (id: string) => {
  try {
    const response = await apiClient.patch(`/payroll/${id}/mark-paid`);
    return response.data;
  } catch (error) {
    return handleApiError(error, `marking payroll as paid ${id}`);
  }
};

/**
 * Calculate payroll for a staff member
 * @param {string} staffId - Staff member ID
 * @param {string} month - Month in YYYY-MM format
 * @returns {Promise<Payroll>} Calculated payroll
 */
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

/**
 * Generate payroll sheets for all staff members
 * @param {string} period - Period in YYYY-MM format
 * @returns {Promise<any>} Success response
 */
export const generatePayrollSheets = async (period: string) => {
  try {
    const response = await apiClient.post(
      '/payroll/generate-sheets',
      { period },
      {
        timeout: 60000, // 60 seconds for payroll sheet generation
      },
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'generating payroll sheets');
  }
};

/**
 * Generate rent sheets for all tenants
 * @param {string} period - Period in YYYY-MM format
 * @returns {Promise<any>} Success response
 */
export const generateRentSheets = async (period: string) => {
  try {
    const response = await apiClient.post(
      '/rent/generate-sheets',
      { period },
      {
        timeout: 60000, // 60 seconds for rent sheet generation
      },
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, 'generating rent sheets');
  }
};
