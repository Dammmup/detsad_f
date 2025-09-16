import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}` || 'http://localhost:8080/api';

// Интерфейсы для отчетов
export interface Report {
  id?: string;
  title: string;
  type: 'attendance' | 'schedule' | 'staff' | 'salary' | 'children' | 'custom';
  description?: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  filters?: {
    userId?: string;
    groupId?: string;
    department?: string;
    status?: string;
  };
  data?: any;
  format?: 'pdf' | 'excel' | 'csv';
  status?: 'generating' | 'completed' | 'failed' | 'scheduled';
  filePath?: string;
  fileSize?: number;
  generatedAt?: string;
  scheduledFor?: string;
  emailRecipients?: string[];
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  attendanceRate: number;
  totalWorkHours: number;
  averageWorkHoursPerDay: number;
  earlyLeaveDays: number;
  sickDays: number;
  vacationDays: number;
  punctualityRate: number;
}

export interface ScheduleStats {
  totalShifts: number;
  regularShifts: number;
  overtimeShifts: number;
  cancelledShifts: number;
  totalScheduledHours: number;
  totalWorkedHours: number;
  efficiencyRate: number;
  sickLeaves: number;
  vacationDays: number;
  totalHours: number;
  overtimeHours: number;
  averageHoursPerDay: number;
}

// API Error interface
interface ApiError extends Error {
  status?: number;
  data?: any;
}

// Create axios instance
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

// Response interceptor for handling errors and rate limiting
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 429 (Too Many Requests), wait and retry
    if (error.response?.status === 429 && !originalRequest._retry) {
      originalRequest._retry = true;
      const retryAfter = error.response.headers['retry-after'] || 2; // Default to 2 seconds
      
      console.warn(`Rate limited. Retrying after ${retryAfter} seconds...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      
      // Retry the request
      return api(originalRequest);
    }
    
    return Promise.reject(error);
  }
);

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

// Add delay between requests to prevent rate limiting
const delay = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get all reports
 * @returns {Promise<Report[]>} List of reports
 */
export const getReports = async () => {
  try {
    console.log('Fetching reports from API...');
    
    const response = await api.get('/reports');
    
    const reports: Report[] = response.data.map((report: any) => ({
      id: report._id,
      title: report.title,
      type: report.type,
      description: report.description,
      dateRange: {
        startDate: report.dateRange.startDate,
        endDate: report.dateRange.endDate
      },
      filters: report.filters,
      data: report.data,
      format: report.format, // format, // убрано, не определено
      status: report.status,
      filePath: report.filePath,
      fileSize: report.fileSize,
      generatedAt: report.generatedAt,
      scheduledFor: report.scheduledFor,
      emailRecipients: report.emailRecipients,
      createdBy: report.createdBy, // createdBy, // убрано, не определено
      createdAt: report.createdAt,
      updatedAt: report.updatedAt
    }));
    
    console.log('Reports data:', reports);
    return reports;
  } catch (error) {
    console.error('Error in getReports:', error);
    return handleApiError(error, 'fetching reports');
  }
};

/**
 * Get a single report by ID
 * @param {string} id - Report ID
 * @returns {Promise<Report>} Report data
 */
export const getReport = async (id: string) => {
  try {
    await delay(300);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.get(`/reports/${id}`);
    
    // Моковые данные для тестирования
    const mockReport: Report = {
      id,
      title: 'Отчет по посещаемости за сентябрь 2025',
      type: 'attendance',
      dateRange: {
        startDate: '2025-09-01',
        endDate: '2025-09-30'
      },
      filters: {
        userId: '',
        status: ''
      },
      createdAt: '2025-09-05T10:30:00',
      createdBy: 'admin',
      format: 'pdf',
      data: {
        // Данные отчета будут здесь
      }
    };
    
    return mockReport;
  } catch (error) {
    return handleApiError(error, `fetching report ${id}`);
  }
};

/**
 * Create a new report
 * @param {Report} report - Report data to create
 * @returns {Promise<Report>} Created report
 */
export const createReport = async (report: Report) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.post('/reports', report);
    
    // Моковые данные для тестирования
    const mockReport: Report = {
      ...report,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: new Date().toISOString(),
      createdBy: 'admin'
    };
    
    return mockReport;
  } catch (error) {
    return handleApiError(error, 'creating report');
  }
};

/**
 * Delete a report
 * @param {string} id - Report ID
 * @returns {Promise<void>}
 */
export const deleteReport = async (id: string) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.delete(`/reports/${id}`);
    
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting report ${id}`);
  }
};

/**
 * Generate attendance statistics for a specific date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} userId - Optional user ID to filter statistics
 * @returns {Promise<AttendanceStats>} Attendance statistics
 */
export const getAttendanceStatistics = async (startDate: string, endDate: string, userId?: string) => {
  try {
    await delay(500);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.get('/reports/attendance-statistics', { params: { startDate, endDate, userId } });
    
    // Моковые данные для тестирования
    const mockStats: AttendanceStats = {
      totalDays: 22,
      presentDays: 18,
      lateDays: 2,
      absentDays: 1,
      earlyLeaveDays: 1,
      sickDays: 1,
      vacationDays: 2,
      totalWorkHours: 144,
      attendanceRate: 81.8, // (18/22) * 100
      punctualityRate: 72.7, // ((18-2)/22) * 100
      averageWorkHoursPerDay: 8
    };
    
    return mockStats;
  } catch (error) {
    return handleApiError(error, 'fetching attendance statistics');
  }
};

/**
 * Generate schedule statistics for a specific date range
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} endDate - End date in YYYY-MM-DD format
 * @param {string} userId - Optional user ID to filter statistics
 * @returns {Promise<ScheduleStats>} Schedule statistics
 */
export const getScheduleStatistics = async (startDate: string, endDate: string, userId?: string) => {
  try {
   
    
    // В реальном приложении здесь будет запрос к API
    const response = await api.get('/reports/schedule-statistics', { params: { startDate, endDate, userId } });
    
    
    
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching schedule statistics');
  }
};

/**
 * Export report to file
 * @param {string} reportId - Report ID
 * @param {string} format - Export format (pdf, excel, csv)
 * @returns {Promise<Blob>} File blob
 */
export const exportReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
  try {
    await delay(1000);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.get(`/reports/${reportId}/export`, { 
    //   params: { format },
    //   responseType: 'blob'
    // });
    
    // Моковые данные для тестирования
    // В реальном приложении здесь будет возвращаться blob файла
    console.log(`Exporting report ${reportId} to ${format}...`);
    
    // Симуляция успешного экспорта
    return { success: true, message: `Отчет успешно экспортирован в формате ${format}` };
  } catch (error) {
    return handleApiError(error, `exporting report ${reportId}`);
  }
};

// ===== РАСШИРЕННЫЕ ФУНКЦИИ ЭКСПОРТА ОТЧЕТОВ =====

/**
 * Export salary report
 * @param {object} params - Salary report parameters
 * @returns {Promise<Blob>} File blob
 */
export const exportSalaryReport = async (params: {
  startDate: string;
  endDate: string;
  userId?: string;
  format: 'pdf' | 'excel' | 'csv';
  includeDeductions?: boolean;
  includeBonus?: boolean;
}) => {
  try {
    const response = await api.post('/reports/salary/export', params, {
      responseType: 'blob'
    });
    
    // Создаем blob для скачивания
    const blob = new Blob([response.data], {
      type: params.format === 'pdf' ? 'application/pdf' : 
           params.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
           'text/csv'
    });
    
    return blob;
  } catch (error) {
    return handleApiError(error, 'exporting salary report');
  }
};

/**
 * Export children list report
 * @param {object} params - Children report parameters
 * @returns {Promise<Blob>} File blob
 */
export const exportChildrenReport = async (params: {
  groupId?: string;
  ageGroup?: string;
  format: 'pdf' | 'excel' | 'csv';
  includeParentInfo?: boolean;
  includeHealthInfo?: boolean;
}) => {
  try {
    const response = await api.post('/reports/children/export', params, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], {
      type: params.format === 'pdf' ? 'application/pdf' : 
           params.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
           'text/csv'
    });
    
    return blob;
  } catch (error) {
    return handleApiError(error, 'exporting children report');
  }
};

/**
 * Export attendance report with advanced options
 * @param {object} params - Attendance report parameters
 * @returns {Promise<Blob>} File blob
 */
export const exportAttendanceReport = async (params: {
  startDate: string;
  endDate: string;
  userId?: string;
  groupId?: string;
  format: 'pdf' | 'excel' | 'csv';
  includeStatistics?: boolean;
  includeCharts?: boolean;
}) => {
  try {
    const response = await api.post('/reports/attendance/export', params, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], {
      type: params.format === 'pdf' ? 'application/pdf' : 
           params.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
           'text/csv'
    });
    
    return blob;
  } catch (error) {
    return handleApiError(error, 'exporting attendance report');
  }
};

/**
 * Send report via email
 * @param {object} params - Email parameters
 * @returns {Promise<any>} Success response
 */
export const sendReportByEmail = async (params: {
  reportId?: string;
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  recipients: string[];
  subject?: string;
  message?: string;
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
}) => {
  try {
    const response = await api.post('/reports/send-email', params);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'sending report by email');
  }
};

/**
 * Schedule automatic report generation and sending
 * @param {object} params - Schedule parameters
 * @returns {Promise<any>} Success response
 */
export const scheduleReport = async (params: {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
  startDate?: string;
}) => {
  try {
    const response = await api.post('/reports/schedule', params);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'scheduling report');
  }
};

/**
 * Download report file directly
 * @param {string} reportId - Report ID
 * @param {string} format - File format
 * @returns {Promise<void>} Triggers download
 */
export const downloadReport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
  try {
    const response = await api.get(`/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob'
    });
    
    // Создаем ссылку для скачивания
    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Определяем имя файла
    const fileExtension = format === 'excel' ? 'xlsx' : format;
    link.download = `report_${reportId}.${fileExtension}`;
    
    // Запускаем скачивание
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Файл успешно скачан' };
  } catch (error) {
    return handleApiError(error, `downloading report ${reportId}`);
  }
};

/**
 * Generate a custom report
 * @param {object} params - Report parameters
 * @returns {Promise<any>} Report data
 */
export const generateCustomReport = async (params: {
  type: string;
  startDate: string;
  endDate: string;
  userId?: string;
  groupId?: string;
  format?: 'pdf' | 'excel' | 'csv';
}) => {
  try {
    await delay(1000);
    
    // В реальном приложении здесь будет запрос к API
    // const response = await api.post('/reports/generate', params);
    
    // Моковые данные для тестирования
    const mockReport = {
      id: Math.random().toString(36).substring(2, 15),
      title: `Отчет по ${params.type} за период ${params.startDate} - ${params.endDate}`,
      type: params.type,
      dateRange: {
        startDate: params.startDate,
        endDate: params.endDate
      },
      filters: {
        userId: params.userId,
        groupId: params.groupId
      },
      createdAt: new Date().toISOString(),
      createdBy: 'admin',
      format: params.format || 'pdf',
      data: {
        // Данные отчета будут здесь
      }
    };
    
    return mockReport;
  } catch (error) {
    return handleApiError(error, 'generating custom report');
  }
};
