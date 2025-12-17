import apiClient from '../utils/api';

export interface StaffAttendance {
  _id: string;
  staffId: {
    _id: string;
    fullName: string;
    role: string;
  };
  groupId?: string;
  date: string;
  startTime: string;
  endTime: string;
  actualStart?: string;
  actualEnd?: string;
  workDuration?: number;
  overtimeMinutes?: number;
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'absent';
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
  breakStart?: Date;
  breakEnd?: Date;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  approvedAtTimeTracking?: Date;
  approvedByTimeTracking?: string;
  isManualEntry: boolean;
  alternativeStaffId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClockInOutData {
  latitude: number;
  longitude: number;
  photo?: string;
  notes?: string;
}

export const staffAttendanceService = {

  checkIn: (data: ClockInOutData) =>
    apiClient.post('/attendance/clock-in', data),
  checkOut: (data: ClockInOutData) =>
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
    groupId?: string;
  }) => apiClient.get('/attendance', { params }),
  getRecordById: (id: string) => apiClient.get(`/attendance/${id}`),
  getByStaffId: (
    staffId: string,
    params?: {
      date?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
      groupId?: string;
    },
  ) => apiClient.get(`/attendance/staff/${staffId}`, { params }),
  getByDateRange: (
    startDate: string,
    endDate: string,
    params?: { staffId?: string; status?: string; groupId?: string },
  ) =>
    apiClient.get(`/attendance/range`, {
      params: { startDate, endDate, ...params },
    }),


  createRecord: (data: Partial<StaffAttendance>) =>
    apiClient.post('/attendance', data),
  updateRecord: (id: string, data: Partial<StaffAttendance>) =>
    apiClient.put(`/attendance/${id}`, data),
  deleteRecord: (id: string) => apiClient.delete(`/attendance/${id}`),
  updateRecordStatus: (id: string, status: string) =>
    apiClient.patch(`/attendance/${id}/status`, { status }),
  addRecordNotes: (id: string, notes: string) =>
    apiClient.patch(`/attendance/${id}/notes`, { notes }),
  approveRecord: (id: string, approvedBy: string) =>
    apiClient.patch(`/attendance/${id}/approve`, { approvedBy }),
  updateAdjustments: (
    id: string,
    data: { penalties: any; bonuses: any; notes: string },
  ) => apiClient.put(`/attendance/${id}/adjustments`, data),


  getPendingApprovals: () => apiClient.get('/attendance/approvals/pending'),
  getApprovedRecords: () => apiClient.get('/attendance/records/approved'),
  getRejectedRecords: () => apiClient.get('/attendance/records/rejected'),
  approveAttendance: (id: string) =>
    apiClient.patch(`/attendance/${id}/approve-time`),
  rejectAttendance: (id: string, reason?: string) =>
    apiClient.patch(`/attendance/${id}/reject`, { reason }),


  getStatistics: () => apiClient.get('/attendance/statistics'),
  getLateArrivals: (threshold?: number) =>
    apiClient.get('/attendance/arrivals/late', { params: { threshold } }),
  getEarlyLeaves: (threshold?: number) =>
    apiClient.get('/attendance/leaves/early', { params: { threshold } }),
  getOvertimeRecords: (threshold?: number) =>
    apiClient.get('/attendance/overtime', { params: { threshold } }),
  getAbsenteeismRecords: () => apiClient.get('/attendance/absenteeism'),
  getWorkDurationStats: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/stats/work', { params: { startDate, endDate } }),
  getBreakDurationStats: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/stats/break', {
      params: { startDate, endDate },
    }),
  getAttendanceRate: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/rate/attendance', {
      params: { startDate, endDate },
    }),
  getLateArrivalRate: (
    startDate: string,
    endDate: string,
    threshold?: number,
  ) =>
    apiClient.get('/attendance/rate/late', {
      params: { startDate, endDate, threshold },
    }),
  getEarlyLeaveRate: (startDate: string, endDate: string, threshold?: number) =>
    apiClient.get('/attendance/rate/early', {
      params: { startDate, endDate, threshold },
    }),
  getOvertimeRate: (startDate: string, endDate: string, threshold?: number) =>
    apiClient.get('/attendance/rate/overtime', {
      params: { startDate, endDate, threshold },
    }),
  getAbsenteeismRate: (startDate: string, endDate: string) =>
    apiClient.get('/attendance/rate/absenteeism', {
      params: { startDate, endDate },
    }),


  getTimeTracking: (params?: {
    staffId?: string;
    startDate?: string;
    endDate?: string;
    groupId?: string;
  }) => apiClient.get('/attendance/timetracking', { params }),
};
