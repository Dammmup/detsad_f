import { StaffAttendanceRecord } from '../../../shared/types/staff';
import { BaseCrudApiClient, apiClient } from '../../../shared/utils/api';

class StaffAttendanceApiClient extends BaseCrudApiClient<StaffAttendanceRecord> {
  endpoint = '/attendance';

  async checkIn(data: any): Promise<any> {
    return apiClient.post(`${this.endpoint}/clock-in`, data);
  }

  async checkOut(data: any): Promise<any> {
    return apiClient.post(`${this.endpoint}/clock-out`, data);
  }

  async startBreak(): Promise<any> {
    return apiClient.post(`${this.endpoint}/start-break`);
  }

  async endBreak(): Promise<any> {
    return apiClient.post(`${this.endpoint}/end-break`);
  }

  async getSummary(startDate: string, endDate: string): Promise<any> {
    return apiClient.get(`${this.endpoint}/summary`, { params: { startDate, endDate } });
  }

  async updateStatus(id: string, status: string): Promise<any> {
    return apiClient.patch(`${this.endpoint}/${id}/status`, { status });
  }

  async approve(id: string, approvedBy?: string): Promise<any> {
    return apiClient.patch(`${this.endpoint}/${id}/approve`, { approvedBy });
  }

  async bulkCreate(records: any[]): Promise<any> {
    return apiClient.post(`${this.endpoint}/bulk`, { records });
  }

  async bulkUpdate(updates: any[]): Promise<any> {
    return apiClient.post(`${this.endpoint}/bulk-update`, { updates });
  }
}

export const staffAttendanceApi = new StaffAttendanceApiClient();
export const getStaffAttendanceRecords = (params?: any) => staffAttendanceApi.getAll(params);
export const createStaffAttendanceRecord = (data: Partial<StaffAttendanceRecord>) => staffAttendanceApi.create(data);
export const updateStaffAttendanceRecord = (id: string, data: Partial<StaffAttendanceRecord>) => staffAttendanceApi.update(id, data);
export const deleteStaffAttendanceRecord = (id: string) => staffAttendanceApi.deleteItem(id);

export default staffAttendanceApi;
