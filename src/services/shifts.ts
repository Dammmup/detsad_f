import { BaseCrudApiClient, apiCache } from '../utils/api';
import {
  Shift,
  ShiftFormData,
  ShiftFilters,
  ID,
  ShiftStatus,
} from '../types/common';

class ShiftsApiClient extends BaseCrudApiClient<Shift> {
  protected endpoint = '/staff-shifts';
  private readonly CACHE_KEY = 'shifts';
  private readonly CACHE_DURATION = 2 * 60 * 1000;

  async getAll(filters?: ShiftFilters): Promise<Shift[]> {
    const cacheKey = `${this.CACHE_KEY}_${JSON.stringify(filters)}`;

    const cached = apiCache.get<Shift[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const shifts = await super.getAll(filters);

    apiCache.set(cacheKey, shifts, this.CACHE_DURATION);
    return shifts;
  }

  async getByDateRange(
    startDate: string,
    endDate: string,
    staffId?: ID,
  ): Promise<Shift[]> {
    const filters: ShiftFilters = {
      startDate,
      endDate,
      staffId,
    };

    return this.getAll(filters);
  }

  async create(shiftData: ShiftFormData): Promise<Shift> {
    const shift = await super.create({
      userId: shiftData.userId,
      staffId: shiftData.staffId,
      staffName: shiftData.staffName,
      date: shiftData.date,
      status: shiftData.status || ShiftStatus.scheduled,
      notes: shiftData.notes,
      alternativeStaffId: shiftData.alternativeStaffId,
    });

    this.clearCache();
    return shift;
  }

  async update(id: ID, shiftData: Partial<Shift>): Promise<Shift> {
    const shift = await super.update(id, shiftData);
    this.clearCache();
    return shift;
  }

  async deleteItem(id: ID): Promise<void> {
    await super.deleteItem(id);
    this.clearCache();
  }

  async updateStatus(id: ID, status: Shift['status']): Promise<Shift> {
    const shift = await this.put<Shift>(`${this.endpoint}/${id}`, { status });
    this.clearCache();
    return shift;
  }

  async bulkCreate(shifts: ShiftFormData[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ shift: ShiftFormData; error: string }>;
    createdShifts: Shift[];
  }> {
    const result = await this.post(`${this.endpoint}/bulk`, { shifts });
    this.clearCache();
    return result;
  }

  async bulkUpdate(updates: Array<{ id: ID; data: Partial<Shift> }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: ID; error: string }>;
  }> {
    const result = await this.post(`${this.endpoint}/bulk-update`, { updates });
    this.clearCache();
    return result;
  }

  async bulkDelete(ids: ID[]): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: ID; error: string }>;
  }> {
    const result = await this.post(`${this.endpoint}/bulk-delete`, { ids });
    this.clearCache();
    return result;
  }

  async copyWeek(
    fromDate: string,
    toDate: string,
    staffIds?: ID[],
  ): Promise<{
    success: number;
    failed: number;
    errors: Array<{ date: string; staffId: ID; error: string }>;
  }> {
    const result = await this.post(`${this.endpoint}/copy-week`, {
      fromDate,
      toDate,
      staffIds,
    });

    this.clearCache();
    return result;
  }

  async getConflicts(
    startDate: string,
    endDate: string,
  ): Promise<
    Array<{
      type: 'overlap' | 'double_booking' | 'insufficient_staff';
      date: string;
      staffId: ID;
      staffName: string;
      shifts: Shift[];
      message: string;
    }>
  > {
    return this.get(`${this.endpoint}/conflicts`, {
      params: { startDate, endDate },
    });
  }

  async autoSchedule(params: {
    startDate: string;
    endDate: string;
    staffIds: ID[];
    preferences?: {
      preferredHours?: Record<ID, number>;
      unavailableDates?: Record<ID, string[]>;
      maxConsecutiveDays?: number;
    };
  }): Promise<{
    suggestedShifts: ShiftFormData[];
    conflicts: Array<{ date: string; issue: string }>;
    coverage: Record<string, number>;
  }> {
    return this.post(`${this.endpoint}/auto-schedule`, params);
  }

  async getStats(filters?: {
    startDate?: string;
    endDate?: string;
    staffId?: ID;
  }): Promise<{
    totalShifts: number;
    completedShifts: number;
    cancelledShifts: number;
    noShowShifts: number;
    averageHoursPerShift: number;
    totalHours: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byStaff: Array<{
      staffId: ID;
      staffName: string;
      totalShifts: number;
      totalHours: number;
    }>;
  }> {
    return this.get(`${this.endpoint}/stats`, { params: filters });
  }

  async export(
    filters?: ShiftFilters,
    format: 'csv' | 'excel' | 'pdf' = 'excel',
  ): Promise<Blob> {
    const params = { ...filters, format };

    return this.get(`${this.endpoint}/export`, {
      params,
      responseType: 'blob',
    });
  }

  async import(
    file: File,
    options?: {
      overwrite?: boolean;
      skipConflicts?: boolean;
    },
  ): Promise<{
    success: number;
    failed: number;
    conflicts: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const formData = new FormData();
    formData.append('file', file);

    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    const result = await this.post(`${this.endpoint}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    this.clearCache();
    return result;
  }

  async getTemplates(): Promise<
    Array<{
      id: ID;
      name: string;
      description?: string;
      shifts: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }>;
    }>
  > {
    const cacheKey = 'shift_templates';

    const cached = apiCache.get<
      Array<{
        id: ID;
        name: string;
        description?: string;
        shifts: Array<{
          dayOfWeek: number;
          startTime: string;
          endTime: string;
        }>;
      }>
    >(cacheKey);
    if (cached) {
      return cached;
    }

    const templates = await this.get(`${this.endpoint}/templates`);

    apiCache.set(cacheKey, templates, this.CACHE_DURATION * 5);
    return templates;
  }

  async createFromTemplate(
    templateId: ID,
    params: {
      startDate: string;
      endDate: string;
      staffIds: ID[];
    },
  ): Promise<{
    createdShifts: Shift[];
    conflicts: Array<{ date: string; staffId: ID; message: string }>;
  }> {
    const result = await this.post(`${this.endpoint}/from-template`, {
      templateId,
      ...params,
    });

    this.clearCache();
    return result;
  }

  async findAvailableStaff(
    date: string,
    startTime: string,
    endTime: string,
  ): Promise<
    Array<{
      staffId: ID;
      staffName: string;
      availability: 'available' | 'busy' | 'partial';
      conflictingShifts?: Shift[];
      preferredHours?: number;
    }>
  > {
    return this.get(`${this.endpoint}/available-staff`, {
      params: { date, startTime, endTime },
    });
  }

  async getOptimizationSuggestions(
    startDate: string,
    endDate: string,
  ): Promise<
    Array<{
      type:
      | 'reduce_overtime'
      | 'balance_workload'
      | 'fill_gaps'
      | 'reduce_conflicts';
      priority: 'high' | 'medium' | 'low';
      description: string;
      affectedShifts: ID[];
      suggestedChanges: Array<{
        shiftId: ID;
        currentData: Partial<Shift>;
        suggestedData: Partial<Shift>;
      }>;
    }>
  > {
    return this.get(`${this.endpoint}/optimization-suggestions`, {
      params: { startDate, endDate },
    });
  }

  clearCache(): void {

    apiCache.clear();

  }

  async checkIn(shiftId: ID, deviceMetadata?: object): Promise<Shift> {
    console.log('📱 [shifts.ts] checkIn called with deviceMetadata:', deviceMetadata);
    console.log('📱 [shifts.ts] Sending body:', JSON.stringify({ deviceMetadata }));
    const result = await this.post(`${this.endpoint}/checkin/${shiftId}`, { deviceMetadata });
    this.clearCache();
    return result;
  }

  async checkOut(shiftId: ID, deviceMetadata?: object): Promise<Shift> {
    console.log('📱 [shifts.ts] checkOut called with deviceMetadata:', deviceMetadata);
    console.log('📱 [shifts.ts] Sending body:', JSON.stringify({ deviceMetadata }));
    const result = await this.post(`${this.endpoint}/checkout/${shiftId}`, { deviceMetadata });
    this.clearCache();
    return result;
  }

  async requestShift(shiftData: Omit<ShiftFormData, 'status'>): Promise<Shift> {

    const result = await this.post(`${this.endpoint}/request`, {
      ...shiftData,
      status: 'pending_approval' as ShiftStatus,
    });
    this.clearCache();
    return result;
  }
}

export const getStaffShifts = async ({
  staffId,
  startDate,
  endDate,
}: {
  staffId: ID;
  startDate: string;
  endDate: string;
}) => {
  return shiftsApi.getByDateRange(startDate, endDate, staffId);
};


export const getShifts = (startDate?: string, endDate?: string) =>
  shiftsApi.getByDateRange(startDate || '', endDate || '');
export const createShift = (shiftData: ShiftFormData) =>
  shiftsApi.create(shiftData);
export const updateShift = (id: ID, shiftData: Partial<Shift>) =>
  shiftsApi.update(id, shiftData);
export const deleteShift = (id: ID) => shiftsApi.deleteItem(id);
export const updateShiftStatus = (id: ID, status: Shift['status']) =>
  shiftsApi.updateStatus(id, status);


export const shiftsApi = new ShiftsApiClient();


export const checkIn = async (shiftId: ID, deviceMetadata?: object) => {
  return shiftsApi.checkIn(shiftId, deviceMetadata);
};

export const checkOut = async (shiftId: ID, deviceMetadata?: object) => {
  return shiftsApi.checkOut(shiftId, deviceMetadata);
};


export const requestShift = async (
  shiftData: Omit<ShiftFormData, 'status'>,
) => {
  return shiftsApi.requestShift(shiftData);
};

export default shiftsApi;
