import { apiClient } from '../../../shared/utils/api';

export interface StaffAttendanceRecord {
  _id: string;
  staffId: {
    _id: string;
    fullName: string;
    role: string;
  };
  shiftId?: string;
  date: Date;
  actualStart?: Date;
  actualEnd?: Date;
  workDuration?: number;
  breakDuration?: number;
  overtimeDuration?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  penalties: {
    late: {
      minutes: number;
      amount: number;
      reason?: string;
    };
    earlyLeave: {
      minutes: number;
      amount: number;
      reason?: string;
    };
    unauthorized: {
      amount: number;
      reason?: string;
    };
  };
  bonuses: {
    overtime: {
      minutes: number;
      amount: number;
    };
    punctuality: {
      amount: number;
      reason?: string;
    };
  };
  notes?: string;
  attachments?: string[];
  approvedBy?: string;
  approvedAt?: Date;
  inZone?: boolean;
  clockInLocation?: any;
  clockOutLocation?: any;
  photoClockIn?: string;
  photoClockOut?: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  approvedAtTimeTracking?: Date;
  approvedByTimeTracking?: string;
  isManualEntry: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClockInOutData {
  latitude: number;
  longitude: number;
  photo?: string;
  notes?: string;
}

export const staffAttendanceTrackingService = {

  clockIn: (data: ClockInOutData) =>
    apiClient.post('/attendance/clock-in', data),
  clockOut: (data: ClockInOutData) =>
    apiClient.post('/attendance/clock-out', data),


  startBreak: () => apiClient.post('/attendance/start-break'),
  endBreak: () => apiClient.post('/attendance/end-break'),


  getEntries: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) => apiClient.get('/attendance/entries', { params }),
  getSummary: (startDate: string, endDate: string) =>
    apiClient.get(`/attendance/summary`, { params: { startDate, endDate } }),
  getAllRecords: (params?: {
    staffId?: string;
    date?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => apiClient.get('/attendance', { params }),
  getRecordById: (id: string) => apiClient.get(`/attendance/${id}`),
  getByStaffId: (
    staffId: string,
    params?: {
      date?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    },
  ) => apiClient.get(`/attendance/staff/${staffId}`, { params }),
  getByDateRange: (
    startDate: string,
    endDate: string,
    params?: { staffId?: string; status?: string },
  ) =>
    apiClient.get(`/attendance/date-range`, {
      params: { startDate, endDate, ...params },
    }),


  createRecord: (data: Partial<StaffAttendanceRecord>) =>
    apiClient.post('/attendance', data),
  updateRecord: (id: string, data: Partial<StaffAttendanceRecord>) =>
    apiClient.put(`/attendance/${id}`, data),
  deleteRecord: (id: string) => apiClient.delete(`/attendance/${id}`),
  updateRecordStatus: (id: string, status: string) =>
    apiClient.put(`/attendance/${id}/status`, { status }),
  addRecordNotes: (id: string, notes: string) =>
    apiClient.put(`/attendance/${id}/notes`, { notes }),
  approveRecord: (id: string, approvedBy: string) =>
    apiClient.put(`/attendance/${id}/approve`, { approvedBy }),
  updateAdjustments: (
    id: string,
    data: { penalties: any; bonuses: any; notes: string },
  ) => apiClient.put(`/attendance/${id}/adjustments`, data),


  getPendingApprovals: () => apiClient.get('/attendance/pending-approvals'),
  getApprovedRecords: () => apiClient.get('/attendance/approved'),
  getRejectedRecords: () => apiClient.get('/attendance/rejected'),
  approveAttendance: (id: string) =>
    apiClient.put(`/attendance/${id}/attendance-approve`),
  rejectAttendance: (id: string, reason?: string) =>
    apiClient.put(`/attendance/${id}/attendance-reject`, { reason }),


  getStatistics: () => apiClient.get('/attendance/statistics'),
  getLateArrivals: (threshold?: number) =>
    apiClient.get('/attendance/late-arrivals', { params: { threshold } }),
  getEarlyLeaves: (threshold?: number) =>
    apiClient.get('/attendance/early-leaves', { params: { threshold } }),
  getOvertimeRecords: (threshold?: number) =>
    apiClient.get('/attendance/overtime', { params: { threshold } }),
  getAbsenteeismRecords: () => apiClient.get('/attendance/absenteeism'),
  getWorkDurationStats: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/work-duration-stats', {
      params: { startDate, endDate },
    }),
  getBreakDurationStats: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/break-duration-stats', {
      params: { startDate, endDate },
    }),
  getAttendanceRate: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/rate', { params: { startDate, endDate } }),
  getLateArrivalRate: (
    startDate: string,
    endDate: string,
    threshold?: number,
  ) =>
    apiClient.get('/attendance/late-rate', {
      params: { startDate, endDate, threshold },
    }),
  getEarlyLeaveRate: (startDate: string, endDate: string, threshold?: number) =>
    apiClient.get('/attendance/early-rate', {
      params: { startDate, endDate, threshold },
    }),
  getOvertimeRate: (startDate: string, endDate: string, threshold?: number) =>
    apiClient.get('/attendance/overtime-rate', {
      params: { startDate, endDate, threshold },
    }),
  getAbsenteeismRate: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/absenteeism-rate', {
      params: { startDate, endDate },
    }),

  // Массовое обновление записей
  bulkUpdate: (data: { ids: string[]; actualStart?: string; actualEnd?: string; notes?: string }) =>
    apiClient.post('/attendance/bulk-update', data),
};
