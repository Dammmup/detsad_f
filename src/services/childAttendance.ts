import axios from 'axios';

const API_URL = process.env.API_URL || 'https://detsad-b.onrender.com';

export interface ChildAttendanceRecord {
  _id?: string;
  childId: string;
  groupId: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
  markedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AttendanceStats {
  total: number;
  byStatus: {
    present?: number;
    absent?: number;
    late?: number;
    sick?: number;
    vacation?: number;
  };
  attendanceRate: number;
}

export interface BulkAttendanceResponse {
  success: number;
  errorCount: number;
  results: ChildAttendanceRecord[];
  errors: Array<{
    record: any;
    error: string;
  }>;
}

// Get attendance records with filters
export const getChildAttendance = async (params?: {
  groupId?: string;
  childId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<ChildAttendanceRecord[]> => {
  try {
const response = await axios.get(`${API_URL}/child-attendance`, {
  params,
  withCredentials: true
});
    return response.data;
  } catch (error: any) {
    console.error('Error fetching child attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения посещаемости');
  }
};

// Create or update single attendance record
export const saveChildAttendance = async (record: Omit<ChildAttendanceRecord, '_id' | 'createdAt' | 'updatedAt'>): Promise<ChildAttendanceRecord> => {
  try {
  const response = await axios.post(`${API_URL}/child-attendance`, record);
    return response.data;
  } catch (error: any) {
    console.error('Error saving child attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка сохранения посещаемости');
  }
};

// Bulk save attendance records (for grid)
export const bulkSaveChildAttendance = async (
  records: Array<{
    childId: string;
    date: string;
    status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
    notes?: string;
  }>,
  groupId: string
): Promise<BulkAttendanceResponse> => {
  try {
  const response = await axios.post(`${API_URL}/child-attendance/bulk`, {
      records,
      groupId
    });
    return response.data;
  } catch (error: any) {
    console.error('Error bulk saving attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка массового сохранения');
  }
};

// Get attendance statistics
export const getAttendanceStats = async (params?: {
  groupId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<AttendanceStats> => {
  try {
  const response = await axios.get(`${API_URL}/child-attendance/stats`, { params });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching attendance stats:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения статистики');
  }
};

// Delete attendance record
export const deleteChildAttendance = async (id: string): Promise<void> => {
  try {
  await axios.delete(`${API_URL}/child-attendance/${id}`);
  } catch (error: any) {
    console.error('Error deleting attendance:', error);
    throw new Error(error.response?.data?.error || 'Ошибка удаления записи');
  }
};

// Debug function to check database status
export const debugChildAttendance = async (): Promise<any> => {
  try {
  const response = await axios.get(`${API_URL}/child-attendance/debug`);
    console.log('🔍 Debug info:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('Debug error:', error);
    throw new Error(error.response?.data?.error || 'Ошибка получения debug информации');
  }
};

// Helper function to convert attendance grid to bulk records
export const convertGridToBulkRecords = (
  attendanceGrid: { [childId: string]: { [date: string]: boolean } },
  comments: { [childId: string]: { [date: string]: string } } = {}
) => {
  const records: Array<{
    childId: string;
    date: string;
    status: 'present' | 'absent';
    notes?: string;
  }> = [];

  Object.entries(attendanceGrid).forEach(([childId, dates]) => {
    Object.entries(dates).forEach(([date, isPresent]) => {
      records.push({
        childId,
        date,
        status: isPresent ? 'present' : 'absent',
        notes: comments[childId]?.[date] || undefined
      });
    });
  });

  return records;
};
