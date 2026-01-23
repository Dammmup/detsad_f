import { Shift, ShiftFormData, ShiftFilters, ShiftStatus } from '../../../shared/types/staff';
import { BaseCrudApiClient, apiCache, apiClient } from '../../../shared/utils/api';

class ShiftsApiClient extends BaseCrudApiClient<Shift> {
  endpoint = '/staff-shifts';
  private readonly CACHE_KEY = 'shifts';
  private readonly CACHE_DURATION = 2 * 60 * 1000;

  async getAll(filters?: ShiftFilters): Promise<Shift[]> {
    const cacheKey = `${this.CACHE_KEY}_${JSON.stringify(filters)}`;
    const cached = apiCache.get<Shift[]>(cacheKey);
    if (cached) return cached;

    const data = await super.getAll(filters);
    apiCache.set(cacheKey, data, this.CACHE_DURATION);
    return data;
  }

  async getByDateRange(startDate: string, endDate: string, staffId?: string): Promise<Shift[]> {
    return this.getAll({ startDate, endDate, staffId });
  }

  async create(data: ShiftFormData | any): Promise<Shift> {
    const shift = await super.create(data);
    this.clearCache();
    return shift;
  }

  async update(id: string, data: Partial<Shift>): Promise<Shift> {
    const shift = await super.update(id, data);
    this.clearCache();
    return shift;
  }

  async deleteItem(id: string): Promise<void> {
    await super.deleteItem(id);
    this.clearCache();
  }

  async updateStatus(id: string, status: string): Promise<Shift> {
    const { data } = await apiClient.put(`${this.endpoint}/${id}`, { status });
    this.clearCache();
    return data;
  }

  async bulkCreate(shifts: ShiftFormData[]): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/bulk`, { shifts });
    this.clearCache();
    return data;
  }

  async bulkUpdate(updates: Array<{ id: string; data: Partial<Shift> }>): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/bulk-update`, { updates });
    this.clearCache();
    return data;
  }

  async bulkDelete(ids: string[]): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/bulk-delete`, { ids });
    this.clearCache();
    return data;
  }

  async copyWeek(fromDate: string, toDate: string, staffIds?: string[]): Promise<any> {
    const { data } = await apiClient.post(`${this.endpoint}/copy-week`, { fromDate, toDate, staffIds });
    this.clearCache();
    return data;
  }

  async checkIn(shiftId: string, deviceMetadata?: object): Promise<Shift> {
    const { data } = await apiClient.post(`${this.endpoint}/checkin/${shiftId}`, { deviceMetadata });
    this.clearCache();
    return data;
  }

  async checkOut(shiftId: string, deviceMetadata?: object): Promise<Shift> {
    const { data } = await apiClient.post(`${this.endpoint}/checkout/${shiftId}`, { deviceMetadata });
    this.clearCache();
    return data;
  }

  async requestShift(shiftData: Omit<ShiftFormData, 'status'>): Promise<Shift> {
    const { data } = await apiClient.post(`${this.endpoint}/request`, { ...shiftData, status: 'pending_approval' });
    this.clearCache();
    return data;
  }

  private clearCache(): void {
    apiCache.clear();
  }
}

export const shiftsApi = new ShiftsApiClient();
export const getShifts = (startDate?: string, endDate?: string) => shiftsApi.getByDateRange(startDate || '', endDate || '');
export const createShift = (data: ShiftFormData) => shiftsApi.create(data);
export const updateShift = (id: string, data: Partial<Shift>) => shiftsApi.update(id, data);
export const deleteShift = (id: string) => shiftsApi.deleteItem(id);
export const updateShiftStatus = (id: string, status: string) => shiftsApi.updateStatus(id, status);
export const checkIn = (shiftId: string, deviceMetadata?: object) => shiftsApi.checkIn(shiftId, deviceMetadata);
export const checkOut = (shiftId: string, deviceMetadata?: object) => shiftsApi.checkOut(shiftId, deviceMetadata);
export const requestShift = (data: Omit<ShiftFormData, 'status'>) => shiftsApi.requestShift(data);
export const getStaffShifts = (filters: ShiftFilters) => shiftsApi.getAll(filters);

export default shiftsApi;
