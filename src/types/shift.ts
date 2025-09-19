export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'confirmed';

export type ShiftType = 'day_off' | 'vacation' | 'sick_leave' | 'full';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
  status: ShiftStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface ShiftFormData {
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: ShiftType;
  notes: string;
}

export interface ShiftFilters {
  staffId?: string;
  startDate?: string;
  endDate?: string;
  status?: ShiftStatus;
  _sort?: string;
  _order?: 'asc' | 'desc';
}
