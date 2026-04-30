import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    LinearProgress,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import {
    Analytics,
    People,
    ChildCare,
    TrendingUp,
    TrendingDown,
    Warning,
    CheckCircle,
    Schedule,
    AttachMoney,
    Groups,
    School,
    EventBusy,
    AccessTime,
} from '@mui/icons-material';
import moment from 'moment/min/moment-with-locales';
import { useDate } from '../../../app/context/DateContext';
import { useAuth } from '../../../app/context/AuthContext';
import { getUsers } from '../../staff/services/userService';
import childrenApi from '../../children/services/children';
import { getGroups } from '../../children/services/groups';
import staffAttendanceApi from '../../staff/services/staffAttendance';
import { getChildAttendance } from '../../children/services/childAttendance';
import { getPayrollsByUsers } from '../../staff/services/payroll';
import { shiftsApi } from '../../staff/services/shifts';
import { getKindergartenSettings } from '../../settings/services/settings';
import DateNavigator from '../../../shared/components/DateNavigator';

interface StaffStats {
    totalStaff: number;
    byRole: { [role: string]: number };
    topAbsent: Array<{ name: string; absences: number; rate: number }>;
    topLate: Array<{ name: string; lateCount: number; avgMinutes: number }>;
    earlyLeavers: Array<{ name: string; count: number; avgMinutes: number }>;
    missingMarkings: Array<{ name: string; count: number; type: 'no_clock_in' | 'no_clock_out' | 'both' }>;
    avgAttendanceRate: number;
}

interface ChildrenStats {
    totalChildren: number;
    byGroup: Array<{ groupName: string; count: number; color: string }>;
    byAge: Array<{ age: string; count: number }>;
    lowAttendance: Array<{ name: string; groupName: string; rate: number }>;
}

interface FinanceStats {
    totalSalaryFund: number;
    avgSalary: number;
    totalBonuses: number;
    totalPenalties: number;
    comparison: {
        current: number;
        previous: number;
        change: number;
    };
}

interface AttendanceStats {
    avgChildAttendance: number;
    avgStaffAttendance: number;
    byWeekday: Array<{ day: string; rate: number }>;
    groupRanking: Array<{ groupName: string; rate: number }>;
}

interface NewControlsStats {
    childMarkingToday: {
        totalChildren: number;
        marked: number;
        presentForKitchen: number;
        unmarked: number;
        completionRate: number;
        present: number;
        late: number;
        absent: number;
        sick: number;
        vacation: number;
        windowStart: string;
        windowEnd: string;
        windowIsOpen: boolean;
        minutesLeft: number;
        groupGaps: Array<{ groupName: string; total: number; marked: number; unmarked: number }>;
    };
    shiftsToday: {
        total: number;
        covered: number;
        completionRate: number;
        inProgress: number;
        completed: number;
        scheduled: number;
        late: number;
        absent: number;
        withoutMarks: number;
    };
    payrollAdjustments: {
        sheetsWithExcludedPenalties: number;
        excludedPenaltyTypesCount: number;
        excludedPenaltyAmount: number;
        manualDebtSheets: number;
        manualDebtAmount: number;
        missingChildAttendancePenaltyAmount: number;
        latePenaltyAmount: number;
    };
    customAccess: {
        employeesWithAccess: number;
        totalGrantedAccesses: number;
        bySection: Array<{ label: string; count: number }>;
        topRoles: Array<{ role: string; count: number }>;
    };
}

const ROLE_LABELS: { [key: string]: string } = {
    admin: 'Администратор',
    manager: 'Менеджер',
    teacher: 'Воспитатель',
    substitute: 'Подменный',
    nurse: 'Медсестра',
    cook: 'Повар',
    cleaner: 'Уборщица',
    guard: 'Охранник',
    methodist: 'Методист',
    psychologist: 'Психолог',
};

const GROUP_COLORS = [
    '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#8bc34a', '#ff5722'
];

const ACCESS_CONTROL_LABELS: Record<string, string> = {
    canSeeChildren: 'Дети',
    canSeeFood: 'Питание',
    canSeeRent: 'Аренда',
    canSeeStaff: 'Сотрудники',
    canSeeSettings: 'Настройки',
};

const getEntityId = (value: any): string => {
    if (!value) return '';
    if (typeof value === 'object') return value._id || value.id || '';
    return String(value);
};

const parseTimeToMinutes = (value?: string): number | null => {
    if (!value) return null;
    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

const formatMinutesAsTime = (minutes: number): string => {
    const normalized = ((minutes % 1440) + 1440) % 1440;
    const hours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
};

const getFineAmountByType = (payroll: any, type: string): number => {
    const fines = payroll?.fines || [];
    const fineTotal = fines
        .filter((fine: any) => fine.type === type)
        .reduce((sum: number, fine: any) => sum + (Number(fine.amount) || 0), 0);

    if (fineTotal > 0 || fines.some((fine: any) => fine.type === type)) {
        return fineTotal;
    }

    if (type === 'late') return Number(payroll?.latePenalties) || 0;
    if (type === 'absence') return Number(payroll?.absencePenalties) || 0;
    if (type === 'missing_child_attendance') return Number(payroll?.missingChildAttendancePenalties) || 0;
    if (type === 'manual') return Number(payroll?.userFines) || 0;
    return 0;
};

const Statistics: React.FC = () => {
    const { currentDate } = useDate();
    const { user: currentUser } = useAuth();
    const role = currentUser?.role || '';
    const canViewStatistics = ['admin', 'manager', 'director'].includes(role);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const requestIdRef = useRef(0);

    const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
    const [childrenStats, setChildrenStats] = useState<ChildrenStats | null>(null);
    const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
    const [newControlsStats, setNewControlsStats] = useState<NewControlsStats | null>(null);

    const periodInfo = useMemo(() => {
        const date = moment(currentDate);
        return {
            startOfMonth: date.startOf('month').format('YYYY-MM-DD'),
            endOfMonth: date.endOf('month').format('YYYY-MM-DD'),
            period: date.format('YYYY-MM'),
            label: date.format('MMMM YYYY'),
        };
    }, [currentDate]);

    const loadStatistics = useCallback(async () => {
        const requestId = ++requestIdRef.current;
        setLoading(true);
        setError(null);

        try {
            const todayDate = moment().format('YYYY-MM-DD');

            // Загружаем данные
            const [
                users,
                children,
                groups,
                staffAttendanceRes,
                childAttendance,
                payrolls,
                shifts,
                todayChildAttendance,
                todayStaffAttendanceRes,
                todayShifts,
                settings,
            ] = await Promise.all([
                getUsers(),
                childrenApi.getAll(),
                getGroups(),
                staffAttendanceApi.getAll({ startDate: periodInfo.startOfMonth, endDate: periodInfo.endOfMonth }).catch(() => ({ data: [] })),
                getChildAttendance({ startDate: periodInfo.startOfMonth, endDate: periodInfo.endOfMonth }).catch(() => []),
                getPayrollsByUsers({ period: periodInfo.period }).catch(() => []),
                shiftsApi.getAll({ startDate: periodInfo.startOfMonth, endDate: periodInfo.endOfMonth }).catch(() => []),
                getChildAttendance({ date: todayDate }).catch(() => []),
                staffAttendanceApi.getAll({ startDate: todayDate, endDate: todayDate }).catch(() => ({ data: [] })),
                shiftsApi.getAll({ startDate: todayDate, endDate: todayDate }).catch(() => []),
                getKindergartenSettings().catch(() => null),
            ]);
            if (requestId !== requestIdRef.current) return;
            const staffAttendance = Array.isArray(staffAttendanceRes) ? staffAttendanceRes : (staffAttendanceRes?.data || []);
            const todayStaffAttendance = Array.isArray(todayStaffAttendanceRes) ? todayStaffAttendanceRes : (todayStaffAttendanceRes?.data || []);

            // Статистика сотрудников
            const activeUsers = users.filter((u: any) => (u as any).active !== false);
            const byRole: { [role: string]: number } = {};
            activeUsers.forEach((u: any) => {
                const role = (u as any).role || 'other';
                byRole[role] = (byRole[role] || 0) + 1;
            });

            // Подсчёт отсутствий, опозданий, ранних уходов и пропущенных отметок
            const userAttendanceMap: {
                [userId: string]: {
                    absences: number;
                    lateCount: number;
                    totalLateMinutes: number;
                    daysWorked: number;
                    earlyLeaveCount: number;
                    totalEarlyLeaveMinutes: number;
                    noClockIn: number;
                    noClockOut: number;
                }
            } = {};

            staffAttendance.forEach((att: any) => {
                const userId = typeof att.userId === 'object' ? att.userId._id : (att.staffId?._id || att.staffId || att.userId);
                if (!userAttendanceMap[userId]) {
                    userAttendanceMap[userId] = { absences: 0, lateCount: 0, totalLateMinutes: 0, daysWorked: 0, earlyLeaveCount: 0, totalEarlyLeaveMinutes: 0, noClockIn: 0, noClockOut: 0 };
                }

                if (att.status === 'absent') {
                    userAttendanceMap[userId].absences++;
                } else if (att.status === 'present' || att.status === 'late' || att.status === 'completed') {
                    userAttendanceMap[userId].daysWorked++;
                    if (att.lateMinutes && att.lateMinutes > 0) {
                        userAttendanceMap[userId].lateCount++;
                        userAttendanceMap[userId].totalLateMinutes += att.lateMinutes;
                    }
                    if (att.earlyLeaveMinutes && att.earlyLeaveMinutes > 0) {
                        userAttendanceMap[userId].earlyLeaveCount++;
                        userAttendanceMap[userId].totalEarlyLeaveMinutes += att.earlyLeaveMinutes;
                    }

                    if (!att.actualStart && (att.status === 'completed' || att.status === 'present')) {
                        userAttendanceMap[userId].noClockIn++;
                    }
                    if (!att.actualEnd && (att.status === 'completed' || att.status === 'present')) {
                        userAttendanceMap[userId].noClockOut++;
                    }
                }
            });

            // Анализ смен для поиска пропущенных отметок (смена есть, а записи в посещаемости нет)
            shifts.forEach((shift: any) => {
                const userId = typeof shift.staffId === 'object' ? shift.staffId._id : shift.staffId;
                if (!userAttendanceMap[userId]) {
                    userAttendanceMap[userId] = { absences: 0, lateCount: 0, totalLateMinutes: 0, daysWorked: 0, earlyLeaveCount: 0, totalEarlyLeaveMinutes: 0, noClockIn: 0, noClockOut: 0 };
                }

                const attendanceOnDate = staffAttendance.find((att: any) => {
                    const attUserId = typeof att.userId === 'object' ? att.userId._id : (att.staffId?._id || att.staffId || att.userId);
                    const attDate = moment(att.date).format('YYYY-MM-DD');
                    return attUserId === userId && attDate === shift.date;
                });

                if (!attendanceOnDate && shift.status !== 'absent') {
                    userAttendanceMap[userId].noClockIn++;
                    userAttendanceMap[userId].noClockOut++;
                }
            });

            const topAbsent = Object.entries(userAttendanceMap)
                .map(([userId, stats]) => {
                    const user = users.find(u => (u._id || u.id) === userId);
                    const totalDays = stats.absences + stats.daysWorked;
                    return {
                        name: user?.fullName || 'Неизвестный',
                        absences: stats.absences,
                        rate: totalDays > 0 ? Math.round((stats.absences / totalDays) * 100) : 0
                    };
                })
                .filter(u => u.absences > 0)
                .sort((a, b) => b.absences - a.absences)
                .slice(0, 5);

            const topLate = Object.entries(userAttendanceMap)
                .map(([userId, stats]) => {
                    const user = users.find(u => (u._id || u.id) === userId);
                    return {
                        name: user?.fullName || 'Неизвестный',
                        lateCount: stats.lateCount,
                        avgMinutes: stats.lateCount > 0 ? Math.round(stats.totalLateMinutes / stats.lateCount) : 0
                    };
                })
                .filter(u => u.lateCount > 0)
                .sort((a, b) => b.lateCount - a.lateCount)
                .slice(0, 5);

            const earlyLeavers = Object.entries(userAttendanceMap)
                .map(([userId, stats]) => {
                    const user = users.find(u => (u._id || u.id) === userId);
                    return {
                        name: user?.fullName || 'Неизвестный',
                        count: stats.earlyLeaveCount,
                        avgMinutes: stats.earlyLeaveCount > 0 ? Math.round(stats.totalEarlyLeaveMinutes / stats.earlyLeaveCount) : 0
                    };
                })
                .filter(u => u.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const missingMarkings = Object.entries(userAttendanceMap)
                .map(([userId, stats]) => {
                    const user = users.find(u => (u._id || u.id) === userId);
                    let type: 'no_clock_in' | 'no_clock_out' | 'both' = 'both';
                    if (stats.noClockIn > 0 && stats.noClockOut === 0) type = 'no_clock_in';
                    else if (stats.noClockIn === 0 && stats.noClockOut > 0) type = 'no_clock_out';

                    return {
                        name: user?.fullName || 'Неизвестный',
                        count: stats.noClockIn + stats.noClockOut,
                        type
                    };
                })
                .filter(u => u.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

            const totalAttendanceDays = Object.values(userAttendanceMap).reduce((sum, s) => sum + s.daysWorked + s.absences, 0);
            const totalDaysWorked = Object.values(userAttendanceMap).reduce((sum, s) => sum + s.daysWorked, 0);
            const avgAttendanceRate = totalAttendanceDays > 0 ? Math.round((totalDaysWorked / totalAttendanceDays) * 100) : 100;

            if (requestId !== requestIdRef.current) return;
            setStaffStats({
                totalStaff: activeUsers.length,
                byRole,
                topAbsent,
                topLate,
                earlyLeavers,
                missingMarkings,
                avgAttendanceRate
            });

            // Статистика детей
            const activeChildren = children.filter((c: any) => c.isActive !== false);
            const byGroup = groups.map((g: any, index: number) => {
                const count = activeChildren.filter((c: any) => {
                    const groupId = typeof c.groupId === 'object' ? c.groupId?._id : c.groupId;
                    return groupId === (g._id || g.id);
                }).length;
                return {
                    groupName: g.name,
                    count,
                    color: GROUP_COLORS[index % GROUP_COLORS.length]
                };
            }).sort((a, b) => b.count - a.count);

            // Распределение по возрасту
            const birthYears: { [year: string]: number } = {};
            activeChildren.forEach((c: any) => {
                if (c.birthDate) {
                    const age = moment().diff(moment(c.birthDate), 'years');
                    const ageLabel = `${age} лет`;
                    birthYears[ageLabel] = (birthYears[ageLabel] || 0) + 1;
                }
            });
            const byAge = Object.entries(birthYears)
                .map(([age, count]) => ({ age, count }))
                .sort((a, b) => parseInt(a.age) - parseInt(b.age));

            // Дети с низкой посещаемостью
            const childAttendanceMap: { [childId: string]: { present: number; total: number } } = {};
            childAttendance.forEach((att: any) => {
                const childId = typeof att.childId === 'object' ? att.childId._id : att.childId;
                if (!childAttendanceMap[childId]) {
                    childAttendanceMap[childId] = { present: 0, total: 0 };
                }
                childAttendanceMap[childId].total++;
                if (att.status === 'present') {
                    childAttendanceMap[childId].present++;
                }
            });

            const lowAttendance = Object.entries(childAttendanceMap)
                .map(([childId, stats]) => {
                    const child = activeChildren.find((c: any) => (c._id || c.id) === childId);
                    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                    const group = groups.find((g: any) => {
                        const groupId = typeof child?.groupId === 'object' ? child?.groupId?._id : child?.groupId;
                        return (g._id || g.id) === groupId;
                    });
                    return {
                        name: child?.fullName || 'Неизвестный',
                        groupName: group?.name || 'Без группы',
                        rate
                    };
                })
                .filter(c => c.rate < 70 && c.rate > 0)
                .sort((a, b) => a.rate - b.rate)
                .slice(0, 5);

            if (requestId !== requestIdRef.current) return;
            setChildrenStats({
                totalChildren: activeChildren.length,
                byGroup,
                byAge,
                lowAttendance
            });

            // Финансовая статистика
            const totalSalaryFund = (payrolls as any[]).reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);
            const avgSalary = payrolls.length > 0 ? Math.round(totalSalaryFund / payrolls.length) : 0;
            const totalBonuses = (payrolls as any[]).reduce((sum: number, p: any) => sum + (p.bonusAmount || 0), 0);
            const totalPenalties = (payrolls as any[]).reduce((sum: number, p: any) => sum + (p.penaltyAmount || 0), 0);

            if (requestId !== requestIdRef.current) return;
            setFinanceStats({
                totalSalaryFund,
                avgSalary,
                totalBonuses,
                totalPenalties,
                comparison: {
                    current: totalSalaryFund,
                    previous: totalSalaryFund * 0.95, // Примерно
                    change: 5
                }
            });

            // Статистика посещаемости
            const totalChildDays = Object.values(childAttendanceMap).reduce((sum: any, s: any) => sum + s.total, 0);
            const totalChildPresent = Object.values(childAttendanceMap).reduce((sum: any, s: any) => sum + s.present, 0);
            const avgChildAttendance = totalChildDays > 0 ? Math.round((totalChildPresent / totalChildDays) * 100) : 0;

            const groupRanking = groups.map((g: any) => {
                const groupChildren = activeChildren.filter((c: any) => {
                    const groupId = typeof c.groupId === 'object' ? c.groupId?._id : c.groupId;
                    return groupId === (g._id || g.id);
                });

                let groupPresent = 0;
                let groupTotal = 0;
                groupChildren.forEach((c: any) => {
                    const childId = c._id || c.id;
                    if (childAttendanceMap[childId]) {
                        groupPresent += childAttendanceMap[childId].present;
                        groupTotal += childAttendanceMap[childId].total;
                    }
                });

                return {
                    groupName: g.name,
                    rate: groupTotal > 0 ? Math.round((groupPresent / groupTotal) * 100) : 0
                };
            }).sort((a, b) => b.rate - a.rate);

            if (requestId !== requestIdRef.current) return;
            setAttendanceStats({
                avgChildAttendance,
                avgStaffAttendance: avgAttendanceRate,
                byWeekday: [
                    { day: 'Пн', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Вт', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Ср', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Чт', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Пт', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                ],
                groupRanking
            });

            // Сводка по новым контрольным функциям
            const accessEntries = Object.entries(ACCESS_CONTROL_LABELS);
            const employeesWithAccess = activeUsers.filter((user: any) =>
                accessEntries.some(([key]) => user.accessControls?.[key] === true)
            );
            const totalGrantedAccesses = activeUsers.reduce((sum: number, user: any) => (
                sum + accessEntries.filter(([key]) => user.accessControls?.[key] === true).length
            ), 0);
            const accessBySection = accessEntries.map(([key, label]) => ({
                label,
                count: activeUsers.filter((user: any) => user.accessControls?.[key] === true).length,
            })).filter(item => item.count > 0);
            const accessRoleCounts: Record<string, number> = {};
            employeesWithAccess.forEach((user: any) => {
                const userRole = user.role || 'other';
                accessRoleCounts[userRole] = (accessRoleCounts[userRole] || 0) + 1;
            });

            const activeChildIds = new Set(activeChildren.map((child: any) => child._id || child.id));
            const childGroupMap = new Map<string, string>();
            activeChildren.forEach((child: any) => {
                childGroupMap.set(child._id || child.id, getEntityId(child.groupId));
            });

            const todayChildAttendanceMap = new Map<string, any>();
            (todayChildAttendance || []).forEach((record: any) => {
                const childId = getEntityId(record.childId);
                if (activeChildIds.has(childId)) {
                    todayChildAttendanceMap.set(childId, record);
                }
            });
            const childStatusCounts = Array.from(todayChildAttendanceMap.values()).reduce((acc: Record<string, number>, record: any) => {
                const status = record.status || 'unknown';
                acc[status] = (acc[status] || 0) + 1;
                return acc;
            }, {});
            const groupGaps = groups.map((group: any) => {
                const groupId = group._id || group.id;
                const groupChildren = activeChildren.filter((child: any) => childGroupMap.get(child._id || child.id) === groupId);
                const marked = groupChildren.filter((child: any) => todayChildAttendanceMap.has(child._id || child.id)).length;
                return {
                    groupName: group.name,
                    total: groupChildren.length,
                    marked,
                    unmarked: Math.max(groupChildren.length - marked, 0),
                };
            }).filter(item => item.total > 0 && item.unmarked > 0)
                .sort((a, b) => b.unmarked - a.unmarked)
                .slice(0, 5);

            const workingStart = settings?.workingHours?.start || '08:00';
            const workingEnd = settings?.workingHours?.end || '18:00';
            const startMinutes = parseTimeToMinutes(workingStart) ?? 8 * 60;
            const endMinutes = parseTimeToMinutes(workingEnd) ?? 18 * 60;
            const markingEndMinutes = Math.min(startMinutes + 4 * 60, endMinutes);
            const nowMinutes = moment().hours() * 60 + moment().minutes();
            const todayAttendanceByStaff = new Map<string, any>();
            todayStaffAttendance.forEach((record: any) => {
                const staffId = getEntityId(record.staffId || record.userId);
                if (staffId) todayAttendanceByStaff.set(staffId, record);
            });

            let coveredShifts = 0;
            let inProgressShifts = 0;
            let completedShifts = 0;
            let scheduledShifts = 0;
            let lateShifts = 0;
            let absentShifts = 0;
            let shiftsWithoutMarks = 0;

            (todayShifts || []).forEach((shift: any) => {
                const staffId = getEntityId(shift.staffId || shift.userId);
                const attendance = todayAttendanceByStaff.get(staffId);
                const status = attendance?.status || shift.status;
                const hasStart = Boolean(attendance?.actualStart);
                const hasEnd = Boolean(attendance?.actualEnd);

                if (status === 'absent') absentShifts++;
                if (status === 'late' || status === 'late_arrival' || (Number(attendance?.lateMinutes) || 0) > 0) lateShifts++;
                if (hasStart && hasEnd || status === 'completed' || status === 'checked_out') {
                    completedShifts++;
                    coveredShifts++;
                    return;
                }
                if (hasStart || status === 'in_progress' || status === 'checked_in' || status === 'present') {
                    inProgressShifts++;
                    coveredShifts++;
                    return;
                }
                if (status === 'scheduled' || status === 'pending_approval') scheduledShifts++;
                if (status !== 'absent') shiftsWithoutMarks++;
            });

            const payrollAdjustments = (payrolls as any[]).reduce((acc, payroll: any) => {
                const excludedTypes = payroll.excludedPenaltyTypes || [];
                if (excludedTypes.length > 0) {
                    acc.sheetsWithExcludedPenalties++;
                    acc.excludedPenaltyTypesCount += excludedTypes.length;
                    acc.excludedPenaltyAmount += excludedTypes.reduce((sum: number, type: string) => sum + getFineAmountByType(payroll, type), 0);
                }
                if (payroll.isManualDebt) {
                    acc.manualDebtSheets++;
                    acc.manualDebtAmount += Number(payroll.carryOverDebt) || 0;
                }
                acc.missingChildAttendancePenaltyAmount += getFineAmountByType(payroll, 'missing_child_attendance');
                acc.latePenaltyAmount += getFineAmountByType(payroll, 'late');
                return acc;
            }, {
                sheetsWithExcludedPenalties: 0,
                excludedPenaltyTypesCount: 0,
                excludedPenaltyAmount: 0,
                manualDebtSheets: 0,
                manualDebtAmount: 0,
                missingChildAttendancePenaltyAmount: 0,
                latePenaltyAmount: 0,
            });

            if (requestId !== requestIdRef.current) return;
            setNewControlsStats({
                childMarkingToday: {
                    totalChildren: activeChildren.length,
                    marked: todayChildAttendanceMap.size,
                    presentForKitchen: (childStatusCounts.present || 0) + (childStatusCounts.late || 0),
                    unmarked: Math.max(activeChildren.length - todayChildAttendanceMap.size, 0),
                    completionRate: activeChildren.length > 0 ? Math.round((todayChildAttendanceMap.size / activeChildren.length) * 100) : 0,
                    present: childStatusCounts.present || 0,
                    late: childStatusCounts.late || 0,
                    absent: childStatusCounts.absent || 0,
                    sick: childStatusCounts.sick || 0,
                    vacation: childStatusCounts.vacation || 0,
                    windowStart: formatMinutesAsTime(startMinutes),
                    windowEnd: formatMinutesAsTime(markingEndMinutes),
                    windowIsOpen: nowMinutes >= startMinutes && nowMinutes <= markingEndMinutes,
                    minutesLeft: Math.max(markingEndMinutes - nowMinutes, 0),
                    groupGaps,
                },
                shiftsToday: {
                    total: (todayShifts || []).length,
                    covered: coveredShifts,
                    completionRate: (todayShifts || []).length > 0 ? Math.round((coveredShifts / (todayShifts || []).length) * 100) : 0,
                    inProgress: inProgressShifts,
                    completed: completedShifts,
                    scheduled: scheduledShifts,
                    late: lateShifts,
                    absent: absentShifts,
                    withoutMarks: shiftsWithoutMarks,
                },
                payrollAdjustments,
                customAccess: {
                    employeesWithAccess: employeesWithAccess.length,
                    totalGrantedAccesses,
                    bySection: accessBySection,
                    topRoles: Object.entries(accessRoleCounts)
                        .map(([role, count]) => ({ role: ROLE_LABELS[role] || role, count }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 4),
                },
            });

        } catch (err: any) {
            if (requestId !== requestIdRef.current) return;
            console.error('Error loading statistics:', err);
            setError(err.message || 'Ошибка загрузки статистики');
        } finally {
            if (requestId === requestIdRef.current) {
                setLoading(false);
            }
        }
    }, [periodInfo]);

    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount);
    }, [periodInfo]);

    useEffect(() => {
        if (!canViewStatistics) {
            setLoading(false);
            setError(null);
            return;
        }
        loadStatistics();
    }, [canViewStatistics, loadStatistics]);

    if (!canViewStatistics) {
        return (
            <Paper sx={{ p: 3, m: 2 }}>
                <Alert severity="error">
                    Недостаточно прав для просмотра статистики.
                </Alert>
            </Paper>
        );
    }

    if (loading) {
        return (
            <Paper sx={{ p: 3, m: 2 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <DateNavigator />

            {/* Заголовок */}
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Typography variant='h5' display='flex' alignItems='center'>
                    <Analytics sx={{ mr: 1 }} /> Статистика за {periodInfo.label}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Сводные карточки */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Сотрудников</Typography>
                                    <Typography variant="h4" fontWeight="bold">{staffStats?.totalStaff || 0}</Typography>
                                </Box>
                                <People sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Детей</Typography>
                                    <Typography variant="h4" fontWeight="bold">{childrenStats?.totalChildren || 0}</Typography>
                                </Box>
                                <ChildCare sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Посещаемость детей</Typography>
                                    <Typography variant="h4" fontWeight="bold">{attendanceStats?.avgChildAttendance || 0}%</Typography>
                                </Box>
                                <TrendingUp sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Фонд зарплат</Typography>
                                    <Typography variant="h5" fontWeight="bold">{formatCurrency(financeStats?.totalSalaryFund || 0)}</Typography>
                                </Box>
                                <AttachMoney sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Новые контрольные виджеты */}
                <Grid item xs={12}>
                    <Typography variant="h6" display="flex" alignItems="center" sx={{ mt: 1 }}>
                        <CheckCircle sx={{ mr: 1, color: 'success.main' }} /> Новые контрольные показатели
                    </Typography>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">К готовке сегодня</Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography variant="h4" fontWeight="bold">
                                    {newControlsStats?.childMarkingToday.presentForKitchen || 0}
                                </Typography>
                                <ChildCare sx={{ fontSize: 42, color: 'success.main', opacity: 0.7 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Отмечено {newControlsStats?.childMarkingToday.marked || 0} из {newControlsStats?.childMarkingToday.totalChildren || 0} детей
                            </Typography>
                            <LinearProgress
                                variant="determinate"
                                value={newControlsStats?.childMarkingToday.completionRate || 0}
                                color={(newControlsStats?.childMarkingToday.completionRate || 0) >= 90 ? 'success' : 'warning'}
                                sx={{ mt: 1.5, height: 8, borderRadius: 4 }}
                            />
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                                <Chip size="small" label={`${newControlsStats?.childMarkingToday.completionRate || 0}% заполнено`} color="primary" />
                                <Chip size="small" label={`Не отмечено: ${newControlsStats?.childMarkingToday.unmarked || 0}`} color={(newControlsStats?.childMarkingToday.unmarked || 0) > 0 ? 'warning' : 'success'} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Окно отметки детей</Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography variant="h5" fontWeight="bold">
                                    {newControlsStats?.childMarkingToday.windowStart || '08:00'}-{newControlsStats?.childMarkingToday.windowEnd || '12:00'}
                                </Typography>
                                <Schedule sx={{ fontSize: 42, color: 'info.main', opacity: 0.7 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Воспитатели могут отмечать только в первые 4 часа рабочего дня
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                                <Chip
                                    size="small"
                                    label={newControlsStats?.childMarkingToday.windowIsOpen ? 'Окно открыто' : 'Окно закрыто'}
                                    color={newControlsStats?.childMarkingToday.windowIsOpen ? 'success' : 'default'}
                                />
                                <Chip
                                    size="small"
                                    label={newControlsStats?.childMarkingToday.windowIsOpen
                                        ? `Осталось ${newControlsStats?.childMarkingToday.minutesLeft || 0} мин`
                                        : 'Отметки ограничены'
                                    }
                                    variant="outlined"
                                />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Смены сегодня</Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography variant="h4" fontWeight="bold">
                                    {newControlsStats?.shiftsToday.covered || 0}/{newControlsStats?.shiftsToday.total || 0}
                                </Typography>
                                <People sx={{ fontSize: 42, color: 'primary.main', opacity: 0.7 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                Приход/уход есть у {newControlsStats?.shiftsToday.completionRate || 0}% смен
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                                <Chip size="small" label={`В работе: ${newControlsStats?.shiftsToday.inProgress || 0}`} color="info" />
                                <Chip size="small" label={`Завершено: ${newControlsStats?.shiftsToday.completed || 0}`} color="success" />
                                <Chip size="small" label={`Без отметок: ${newControlsStats?.shiftsToday.withoutMarks || 0}`} color={(newControlsStats?.shiftsToday.withoutMarks || 0) > 0 ? 'warning' : 'default'} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Typography variant="body2" color="text.secondary">Исключенные вычеты</Typography>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                                <Typography variant="h5" fontWeight="bold">
                                    {formatCurrency(newControlsStats?.payrollAdjustments.excludedPenaltyAmount || 0)}
                                </Typography>
                                <AttachMoney sx={{ fontSize: 42, color: 'warning.main', opacity: 0.7 }} />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                                В {newControlsStats?.payrollAdjustments.sheetsWithExcludedPenalties || 0} расчетных листах
                            </Typography>
                            <Box display="flex" gap={1} flexWrap="wrap" mt={1.5}>
                                <Chip size="small" label={`Типов: ${newControlsStats?.payrollAdjustments.excludedPenaltyTypesCount || 0}`} color="warning" />
                                <Chip size="small" label={`Ручной долг: ${newControlsStats?.payrollAdjustments.manualDebtSheets || 0}`} variant="outlined" />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <ChildCare sx={{ mr: 1, color: 'success.main' }} /> Группы без полной отметки сегодня
                            </Typography>
                            {newControlsStats?.childMarkingToday.groupGaps && newControlsStats?.childMarkingToday.groupGaps.length > 0 ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Группа</TableCell>
                                            <TableCell align="right">Отмечено</TableCell>
                                            <TableCell align="right">Не отмечено</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {newControlsStats?.childMarkingToday.groupGaps.map((group, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{group.groupName}</TableCell>
                                                <TableCell align="right">{group.marked}/{group.total}</TableCell>
                                                <TableCell align="right">
                                                    <Chip label={group.unmarked} size="small" color="warning" />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Все группы сегодня заполнены</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <People sx={{ mr: 1, color: 'info.main' }} /> Индивидуальные доступы
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={5}>
                                    <Typography variant="h4" fontWeight="bold">
                                        {newControlsStats?.customAccess.employeesWithAccess || 0}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        сотрудников с отдельными доступами
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" mt={1}>
                                        Всего выдано: {newControlsStats?.customAccess.totalGrantedAccesses || 0}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} sm={7}>
                                    <Box display="flex" gap={1} flexWrap="wrap">
                                        {newControlsStats?.customAccess.bySection && newControlsStats?.customAccess.bySection.length > 0 ? (
                                            newControlsStats?.customAccess.bySection.map((section, index) => (
                                                <Chip
                                                    key={section.label}
                                                    label={`${section.label}: ${section.count}`}
                                                    sx={{ bgcolor: GROUP_COLORS[index % GROUP_COLORS.length], color: 'white' }}
                                                />
                                            ))
                                        ) : (
                                            <Typography color="text.secondary">Отдельных доступов пока нет</Typography>
                                        )}
                                    </Box>
                                    {newControlsStats?.customAccess.topRoles && newControlsStats?.customAccess.topRoles.length > 0 && (
                                        <Box mt={2}>
                                            <Typography variant="body2" color="text.secondary" mb={1}>По ролям</Typography>
                                            <Box display="flex" gap={1} flexWrap="wrap">
                                                {newControlsStats?.customAccess.topRoles.map((role) => (
                                                    <Chip key={role.role} label={`${role.role}: ${role.count}`} size="small" variant="outlined" />
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Сотрудники с отсутствиями */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <EventBusy sx={{ mr: 1, color: 'error.main' }} /> Топ отсутствий
                            </Typography>
                            {staffStats?.topAbsent && staffStats.topAbsent.length > 0 ? (
                                <List dense>
                                    {staffStats.topAbsent.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'error.light' }}>{index + 1}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`${item.absences} дней отсутствия (${item.rate}%)`}
                                            />
                                            <Chip label={`${item.absences} дн.`} color="error" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Нет значительных отсутствий</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Опоздания */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <AccessTime sx={{ mr: 1, color: 'warning.main' }} /> Частые опоздания
                            </Typography>
                            {staffStats?.topLate && staffStats.topLate.length > 0 ? (
                                <List dense>
                                    {staffStats.topLate.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'warning.light' }}>{index + 1}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`${item.lateCount} опозданий, в среднем ${item.avgMinutes} мин`}
                                            />
                                            <Chip label={`${item.lateCount}×`} color="warning" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Нет частых опозданий</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Ранние уходы */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <TrendingDown sx={{ mr: 1, color: '#ff9800' }} /> Ранние уходы
                            </Typography>
                            {staffStats?.earlyLeavers && staffStats.earlyLeavers.length > 0 ? (
                                <List dense>
                                    {staffStats.earlyLeavers.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: '#fff3e0' }}>{index + 1}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`${item.count} раз ушел(ла) раньше, в среднем ${item.avgMinutes} мин`}
                                            />
                                            <Chip label={`${item.count}×`} sx={{ bgcolor: '#ff9800', color: 'white' }} size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Все уходят вовремя</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Отсутствие отметок */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <Warning sx={{ mr: 1, color: 'error.main' }} /> Забывают отметиться
                            </Typography>
                            {staffStats?.missingMarkings && staffStats.missingMarkings.length > 0 ? (
                                <List dense>
                                    {staffStats.missingMarkings.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'error.light' }}>{index + 1}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={
                                                    item.type === 'no_clock_in' ? 'Часто не отмечают приход' :
                                                        item.type === 'no_clock_out' ? 'Часто не отмечают уход' :
                                                            'Не отмечают ни приход, ни уход'
                                                }
                                            />
                                            <Chip label={`${item.count} отм.`} color="error" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Все отмечаются исправно</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Дети по группам */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <Groups sx={{ mr: 1, color: 'primary.main' }} /> Дети по группам
                            </Typography>
                            {childrenStats?.byGroup.map((group, index) => (
                                <Box key={index} mb={1}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{group.groupName}</Typography>
                                        <Typography variant="body2" fontWeight="bold">{group.count}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(group.count / (childrenStats?.totalChildren || 1)) * 100}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: 'grey.200',
                                            '& .MuiLinearProgress-bar': { bgcolor: group.color }
                                        }}
                                    />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Дети с низкой посещаемостью */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <Warning sx={{ mr: 1, color: 'warning.main' }} /> Низкая посещаемость детей
                            </Typography>
                            {childrenStats?.lowAttendance && childrenStats.lowAttendance.length > 0 ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ребёнок</TableCell>
                                            <TableCell>Группа</TableCell>
                                            <TableCell align="right">Посещаемость</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {childrenStats.lowAttendance.map((child, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{child.name}</TableCell>
                                                <TableCell>{child.groupName}</TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={`${child.rate}%`}
                                                        size="small"
                                                        color={child.rate < 50 ? 'error' : 'warning'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Все дети посещают хорошо</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Распределение по ролям */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <People sx={{ mr: 1, color: 'info.main' }} /> Сотрудники по ролям
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {staffStats?.byRole && Object.entries(staffStats.byRole).map(([role, count], index) => (
                                    <Chip
                                        key={role}
                                        label={`${ROLE_LABELS[role] || role}: ${count}`}
                                        sx={{ bgcolor: GROUP_COLORS[index % GROUP_COLORS.length], color: 'white' }}
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Рейтинг групп по посещаемости */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <School sx={{ mr: 1, color: 'success.main' }} /> Посещаемость по группам
                            </Typography>
                            {attendanceStats?.groupRanking.map((group, index) => (
                                <Box key={index} mb={1}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{group.groupName}</Typography>
                                        <Typography variant="body2" fontWeight="bold">{group.rate}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={group.rate}
                                        color={group.rate >= 80 ? 'success' : group.rate >= 60 ? 'warning' : 'error'}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Финансы */}
                <Grid item xs={12}>
                    <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                💰 Финансовая сводка за {periodInfo.label}
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Общий фонд</Typography>
                                    <Typography variant="h5" fontWeight="bold">{formatCurrency(financeStats?.totalSalaryFund || 0)}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Средняя зарплата</Typography>
                                    <Typography variant="h5" fontWeight="bold">{formatCurrency(financeStats?.avgSalary || 0)}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7, color: '#4caf50' }}>Бонусы</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#4caf50' }}>
                                        +{formatCurrency(financeStats?.totalBonuses || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7, color: '#f44336' }}>Штрафы</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f44336' }}>
                                        -{formatCurrency(financeStats?.totalPenalties || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7, color: '#ffb74d' }}>Штрафы за отметки детей</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#ffb74d' }}>
                                        -{formatCurrency(newControlsStats?.payrollAdjustments.missingChildAttendancePenaltyAmount || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7, color: '#90caf9' }}>Исключено из вычетов</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#90caf9' }}>
                                        {formatCurrency(newControlsStats?.payrollAdjustments.excludedPenaltyAmount || 0)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default Statistics;
