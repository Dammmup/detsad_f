import { apiClient } from '../utils/api';


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


const delay = (ms: number | undefined) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getReports = async () => {
  try {
    console.log('Fetching reports from API...');

    const response = await apiClient.get('/reports', {
      timeout: 30000,
    });

    const reports: Report[] = response.data.map((report: any) => ({
      id: report._id,
      title: report.title,
      type: report.type,
      description: report.description,
      dateRange: {
        startDate: report.dateRange.startDate,
        endDate: report.dateRange.endDate,
      },
      filters: report.filters,
      data: report.data,
      format: report.format,
      status: report.status,
      filePath: report.filePath,
      fileSize: report.fileSize,
      generatedAt: report.generatedAt,
      scheduledFor: report.scheduledFor,
      emailRecipients: report.emailRecipients,
      createdBy: report.createdBy,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    }));

    console.log('Reports data:', reports);
    return reports;
  } catch (error) {
    console.error('Error in getReports:', error);
    return handleApiError(error, 'fetching reports');
  }
};

export const getReport = async (id: string) => {
  try {
    const response = await apiClient.get(`/reports/${id}`, {
      timeout: 30000,
    });

    const report: Report = {
      id: response.data._id,
      title: response.data.title,
      type: response.data.type,
      description: response.data.description,
      dateRange: {
        startDate: response.data.dateRange.startDate,
        endDate: response.data.dateRange.endDate,
      },
      filters: response.data.filters,
      data: response.data.data,
      format: response.data.format,
      status: response.data.status,
      filePath: response.data.filePath,
      fileSize: response.data.fileSize,
      generatedAt: response.data.generatedAt,
      scheduledFor: response.data.scheduledFor,
      emailRecipients: response.data.emailRecipients,
      createdBy: response.data.createdBy,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };

    return report;
  } catch (error) {
    return handleApiError(error, `fetching report ${id}`);
  }
};

export const createReport = async (report: Report) => {
  try {
    const response = await apiClient.post('/reports', report, {
      timeout: 30000,
    });

    const createdReport: Report = {
      id: response.data._id,
      title: response.data.title,
      type: response.data.type,
      description: response.data.description,
      dateRange: {
        startDate: response.data.dateRange.startDate,
        endDate: response.data.dateRange.endDate,
      },
      filters: response.data.filters,
      data: response.data.data,
      format: response.data.format,
      status: response.data.status,
      filePath: response.data.filePath,
      fileSize: response.data.fileSize,
      generatedAt: response.data.generatedAt,
      scheduledFor: response.data.scheduledFor,
      emailRecipients: response.data.emailRecipients,
      createdBy: response.data.createdBy,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };

    return createdReport;
  } catch (error) {
    return handleApiError(error, 'creating report');
  }
};

export const deleteReport = async (id: string) => {
  try {
    await apiClient.delete(`/reports/${id}`, {
      timeout: 30000,
    });
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting report ${id}`);
  }
};

export const getAttendanceStatistics = async (
  startDate: string,
  endDate: string,
  userId?: string,
) => {
  try {
    await delay(500);


    const response = await apiClient.get('/reports/attendance-statistics', {
      params: { startDate, endDate, userId },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching attendance statistics');
  }
};

export const getScheduleStatistics = async (
  startDate: string,
  endDate: string,
  userId?: string,
) => {
  try {
    await delay(500);


    const response = await apiClient.get('/reports/schedule-statistics', {
      params: { startDate, endDate, userId },
      timeout: 30000,
    });

    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching schedule statistics');
  }
};

export const exportReport = async (
  reportId: string,
  format: 'pdf' | 'excel' | 'csv',
) => {
  try {
    const response = await apiClient.get(`/reports/${reportId}/export`, {
      params: { format },
      responseType: 'blob',
      timeout: 60000,
    });


    const blob = new Blob([response.data], {
      type:
        format === 'pdf'
          ? 'application/pdf'
          : format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
    });

    return blob;
  } catch (error) {
    return handleApiError(error, `exporting report ${reportId}`);
  }
};



export const exportSalaryReport = async (params: {
  startDate: string;
  endDate: string;
  userId?: string;
  format: 'pdf' | 'excel' | 'csv';
  includeDeductions?: boolean;
  includeBonus?: boolean;
}) => {
  try {
    console.log(
      '[exportSalaryReport] Отправка запроса на экспорт зарплат:',
      params,
    );
    const response = await apiClient.post('/reports/salary/export', params, {
      responseType: 'blob',
      timeout: 60000,
    });
    const blob = new Blob([response.data], {
      type:
        params.format === 'pdf'
          ? 'application/pdf'
          : params.format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
    });
    return blob;
  } catch (error: any) {
    if (error.response) {

      console.error(
        '[exportSalaryReport] Ошибка:',
        error.response.status,
        error.response.data,
      );
      alert(
        `Ошибка экспорта зарплат: ${error.response.status} ${JSON.stringify(error.response.data)}`,
      );
    } else {
      console.error('[exportSalaryReport] Неизвестная ошибка:', error);
      alert('Неизвестная ошибка экспорта зарплат');
    }
    return handleApiError(error, 'exporting salary report');
  }
};


export const getSalarySummary = async (month: string) => {
  try {
    const response = await apiClient.get('/reports/salary/summary', {
      params: { month },
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching salary summary');
  }
};

export const exportChildrenReport = async (params: {
  groupId?: string;
  ageGroup?: string;
  format: 'pdf' | 'excel' | 'csv';
  includeParentInfo?: boolean;
  includeHealthInfo?: boolean;
}) => {
  try {
    const response = await apiClient.post('/reports/children/export', params, {
      responseType: 'blob',
      timeout: 60000,
    });

    const blob = new Blob([response.data], {
      type:
        params.format === 'pdf'
          ? 'application/pdf'
          : params.format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
    });

    return blob;
  } catch (error) {
    return handleApiError(error, 'exporting children report');
  }
};

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
    const response = await apiClient.post(
      '/reports/attendance/export',
      params,
      {
        responseType: 'blob',
        timeout: 60000,
      },
    );

    const blob = new Blob([response.data], {
      type:
        params.format === 'pdf'
          ? 'application/pdf'
          : params.format === 'excel'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/csv',
    });

    return blob;
  } catch (error) {
    return handleApiError(error, 'exporting attendance report');
  }
};

export const sendReportByEmail = async (params: {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  recipients: string[];
  subject?: string;
  message?: string;
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
}) => {
  try {
    const response = await apiClient.post('/reports/send-email', params, {
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'sending report by email');
  }
};

export const scheduleReport = async (params: {
  reportType: 'salary' | 'children' | 'attendance' | 'schedule';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  reportParams?: any;
  startDate?: string;
}) => {
  try {
    const response = await apiClient.post('/reports/schedule', params, {
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'scheduling report');
  }
};

export const downloadReport = async (
  reportId: string,
  format: 'pdf' | 'excel' | 'csv',
) => {
  try {
    const response = await apiClient.get(`/reports/${reportId}/download`, {
      params: { format },
      responseType: 'blob',
      timeout: 60000,
    });


    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;


    const fileExtension = format === 'excel' ? 'xlsx' : format;
    link.download = `report_${reportId}.${fileExtension}`;


    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Файл успешно скачан' };
  } catch (error) {
    return handleApiError(error, `downloading report ${reportId}`);
  }
};

export const generateCustomReport = async (params: {
  type: string;
  startDate: string;
  endDate: string;
  userId?: string;
  groupId?: string;
  format?: 'pdf' | 'excel' | 'csv';
}) => {
  try {
    const response = await apiClient.post('/reports/generate', params, {
      timeout: 60000,
    });

    const report: Report = {
      id: response.data._id,
      title: response.data.title,
      type: response.data.type,
      description: response.data.description,
      dateRange: {
        startDate: response.data.dateRange.startDate,
        endDate: response.data.dateRange.endDate,
      },
      filters: response.data.filters,
      data: response.data.data,
      format: response.data.format,
      status: response.data.status,
      filePath: response.data.filePath,
      fileSize: response.data.fileSize,
      generatedAt: response.data.generatedAt,
      scheduledFor: response.data.scheduledFor,
      emailRecipients: response.data.emailRecipients,
      createdBy: response.data.createdBy,
      createdAt: response.data.createdAt,
      updatedAt: response.data.updatedAt,
    };

    return report;
  } catch (error) {
    return handleApiError(error, 'generating custom report');
  }
};



export const getRents = async (params: any = {}) => {
  try {
    const response = await apiClient.get('/rent', {
      params,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching rents');
  }
};

export const updateRent = async (id: string, data: any) => {
  try {
    const response = await apiClient.put(`/rent/${id}`, data, {
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, `updating rent ${id}`);
  }
};

export const deleteRent = async (id: string) => {
  try {
    await apiClient.delete(`/rent/${id}`, {
      timeout: 30000,
    });
    return { success: true };
  } catch (error) {
    return handleApiError(error, `deleting rent ${id}`);
  }
};

export const markRentAsPaid = async (id: string) => {
  try {
    const response = await apiClient.patch(
      `/rent/${id}/mark-paid`,
      {},
      {
        timeout: 30000,
      },
    );
    return response.data;
  } catch (error) {
    return handleApiError(error, `marking rent ${id} as paid`);
  }
};

export const generateRentSheets = async (params: {
  period: string;
  tenantIds?: string[];
}) => {
  try {
    const response = await apiClient.post('/rent/generate-sheets', params, {
      timeout: 120000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'generating rent sheets');
  }
};



export const getChildrenSummary = async (params?: { groupId?: string }) => {
  try {
    const response = await apiClient.get('/reports/children/summary', {
      params,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching children summary');
  }
};

export const getAttendanceSummary = async (params: {
  startDate: string;
  endDate: string;
  groupId?: string;
}) => {
  try {
    const response = await apiClient.get('/reports/attendance/summary', {
      params,
      timeout: 30000,
    });
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetching attendance summary');
  }
};

const reportsService = {

  getReports,
  getReport,
  createReport,
  deleteReport,
  downloadReport,


  getAttendanceStatistics,
  getScheduleStatistics,


  exportReport,
  exportSalaryReport,
  exportChildrenReport,
  exportAttendanceReport,


  sendReportByEmail,


  scheduleReport,


  generateCustomReport,


  getRents,
  updateRent,
  deleteRent,
  markRentAsPaid,
  generateRentSheets,


  getChildrenSummary,
  getAttendanceSummary,
};
export default reportsService;
