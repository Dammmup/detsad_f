import { BaseRecord } from './base';

export interface User extends BaseRecord {
    username?: string;
    email?: string;
    role: string;
    phone?: string;
    fullName: string;
    avatar?: string;
    active: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
    uniqNumber?: string;
    notes?: string;
    iin?: string;
    groupId?: string;
    birthday?: string;
    photo?: string;
    parentName?: string;
    parentPhone?: string;
    initialPassword?: string;
    salary?: number;
    salaryType?: 'shift' | 'month' | 'day';
    shiftRate?: number;
    staffId?: string;
    staffName?: string;
    tenant?: boolean;
}

export enum ShiftStatus {
    scheduled = 'scheduled',
    completed = 'completed',
    absent = 'absent',
    present = 'present',
    in_progress = 'in_progress',
    pending_approval = 'pending_approval',
    late = 'late',
    no_clock_in = 'no_clock_in',
    no_clock_out = 'no_clock_out',
    checked_in = 'checked_in',
    checked_out = 'checked_out',
    early_leave = 'early_leave',
    late_arrival = 'late_arrival',
}

export interface Shift extends BaseRecord {
    userId: string;
    staffId?: string;
    staffName?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    status: ShiftStatus | string;
    notes?: string;
    alternativeStaffId?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ShiftFormData {
    userId: string;
    staffId?: string;
    staffName?: string;
    date: string;
    notes?: string;
    status?: ShiftStatus | string;
    alternativeStaffId?: string;
}

export interface ShiftFilters {
    userId?: string;
    staffId?: string;
    startDate?: string;
    endDate?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: ShiftStatus | string;
}

export interface StaffAttendanceRecord extends BaseRecord {
    staffId: string | {
        _id: string;
        fullName: string;
        role: string;
    };
    groupId?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    actualStart?: string;
    actualEnd?: string;
    workDuration?: number;
    overtimeMinutes?: number;
    lateMinutes?: number;
    earlyLeaveMinutes?: number;
    status: 'scheduled' | 'in_progress' | 'completed' | 'absent' | 'present' | 'sick' | 'vacation' | string;
    penalties?: {
        late?: { minutes: number; amount: number; reason?: string };
        earlyLeave?: { minutes: number; amount: number; reason?: string };
        unauthorized?: { amount: number; reason?: string };
    };
    bonuses?: {
        overtime?: { minutes: number; amount: number };
        punctuality?: { amount: number; reason?: string };
    };
    notes?: string;
    attachments?: string[];
    approvedBy?: string;
    approvedAt?: Date | string;
    checkInDevice?: any;
    checkOutDevice?: any;
    inZone?: boolean;
    clockInLocation?: any;
    clockOutLocation?: any;
    photoClockIn?: string;
    photoClockOut?: string;
    breakStart?: Date | string;
    breakEnd?: Date | string;
    totalHours?: number;
    regularHours?: number;
    overtimeHours?: number;
    isManualEntry?: boolean;
    fio?: string;
    position?: string;
}

export interface PayrollRecord extends BaseRecord {
    staffId: string | {
        _id: string;
        fullName: string;
        role: string;
    };
    period: string;
    month?: number;
    year?: number;
    baseSalary: number;
    bonuses: number;
    deductions: number;
    total: number;
    status: 'draft' | 'approved' | 'paid' | 'pending' | string;
    paymentDate?: Date | string;
    advance?: number;
    advanceDate?: Date | string;
    accruals?: number;
    penalties?: number;
    baseSalaryType?: string;
    shiftRate?: number;
    latePenalties?: number;
    absencePenalties?: number;
    userFines?: number;
    penaltyDetails?: {
        type?: string;
        amount?: number;
        latePenalties?: number;
        absencePenalties?: number;
        userFines?: number;
    };
    history?: Array<{
        date: Date | string;
        action: string;
        comment?: string;
    }>;
    workedDays?: number;
    workedShifts?: number;
    normDays?: number;
    notes?: string;
    fio?: string;
}

export interface FineRecord extends BaseRecord {
    staffId: string;
    date: string;
    amount: number;
    reason: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ActivityTemplate extends BaseRecord {
    name: string;
    type: string;
    category: string;
    content: string;
    goal?: string;
    ageGroups: string[];
    duration?: number;
    order: number;
    isActive: boolean;
}

export interface ScheduleBlock {
    order: number;
    time?: string;
    activityType: string;
    templateId?: string;
    content: string;
    topic?: string;
    goal?: string;
}

export interface DailySchedule extends BaseRecord {
    groupId: string | { _id: string; name: string };
    date: string;
    dayOfWeek: string;
    weekNumber?: number;
    blocks: ScheduleBlock[];
    createdBy?: string | { _id: string; fullName: string };
    isTemplate: boolean;
    templateName?: string;
}
