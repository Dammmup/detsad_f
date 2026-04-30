import { Shift, ShiftFormData, ShiftFilters, ShiftStatus } from '../../../shared/types/staff';
import { BaseCrudApiClient, apiClient } from '../../../shared/utils/api';

class ShiftsApiClient extends BaseCrudApiClient<Shift> {
  endpoint = '/staff-shifts';

  async getAll(filters?: ShiftFilters): Promise<Shift[]> {
    const data = await super.getAll(filters);
    return data;
  }

  async getByDateRange(startDate: string, endDate: string, staffId?: string): Promise<Shift[]> {
    return this.getAll({ startDate, endDate, staffId });
  }

  async create(data: ShiftFormData | any): Promise<Shift> {
    const shift = await super.create(data);
    return shift;
  }

  async update(id: string, data: Partial<Shift>): Promise<Shift> {
    const shift = await super.update(id, data);
    return shift;
  }

  async deleteItem(id: string): Promise<void> {
    await super.deleteItem(id);
  }

  async updateStatus(id: string, status: string): Promise<Shift> {
    const { data } = await apiClient.put(`${this.endpoint}/${id}`, { status });
    return data;
  }

  async bulkCreate(shifts: ShiftFormData[]): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/bulk`, { shifts });
    return data;
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<Shift> }>): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/bulk-update`, { updates });
    return data;
  }

  async bulkDelete(payload: string[] | { staffIds: string[]; dates: string[] }): Promise<any> {
    const body = Array.isArray(payload) ? { ids: payload } : payload;
    const { data } = await apiClient.post(`${this.endpoint}/bulk-delete`, body);
    return data;
  }

  async bulkUpdateStatus(filters: { staffId?: string; startDate: string; endDate: string; status: string }): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/bulk-update-status`, filters);
    return data;
  }

  async copyWeek(fromDate: string, toDate: string, staffIds?: string[]): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/copy-week`, { fromDate, toDate, staffIds });
    return data;
  }

  async checkIn(shiftId: string, latitude?: number, longitude?: number, deviceMetadata?: object): Promise<Shift> {
    const { data } = await apiClient.post(`${this.endpoint}/checkin/${shiftId}`, { latitude, longitude, deviceMetadata });
    return data;
  }

  async checkOut(shiftId: string, latitude?: number, longitude?: number, deviceMetadata?: object): Promise<Shift> {
    const { data } = await apiClient.post(`${this.endpoint}/checkout/${shiftId}`, { latitude, longitude, deviceMetadata });
    return data;
  }

  async requestShift(shiftData: Omit<ShiftFormData, 'status'>): Promise<Shift> {
    const { data } = await apiClient.post(`${this.endpoint}/request`, { ...shiftData, status: 'pending_approval' });
    return data;
  }
}

export const shiftsApi = new ShiftsApiClient();
export const getShifts = (startDate?: string, endDate?: string) => shiftsApi.getByDateRange(startDate || '', endDate || '');
export const createShift = (data: ShiftFormData) => shiftsApi.create(data);
export const updateShift = (id: string, data: Partial<Shift>) => shiftsApi.update(id, data);
export const deleteShift = (id: string) => shiftsApi.deleteItem(id);
export const updateShiftStatus = (id: string, status: string) => shiftsApi.updateStatus(id, status);
export const checkIn = (shiftId: string, latitude?: number, longitude?: number, deviceMetadata?: object) => shiftsApi.checkIn(shiftId, latitude, longitude, deviceMetadata);
export const checkOut = (shiftId: string, latitude?: number, longitude?: number, deviceMetadata?: object) => shiftsApi.checkOut(shiftId, latitude, longitude, deviceMetadata);
export const requestShift = (data: Omit<ShiftFormData, 'status'>) => shiftsApi.requestShift(data);
export const getStaffShifts = (filters: ShiftFilters) => shiftsApi.getAll(filters);

export default shiftsApi;
