import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { TIMEZONE } from '../../../shared/utils/timezone';
import {
  Paper,
  Typography,
  Box,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Tabs,
  Tab,
  Avatar,
  OutlinedInput,
  InputAdornment,
  Checkbox,
  ListItemText,
  Dialog,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  TableSortLabel,
} from '@mui/material';
import {
  AccessTime,
  Edit,
  Visibility,
  Check,
  Schedule,
  Person,
  Search as SearchIcon,
  FileUpload,
  Smartphone,
  Computer,
  Tablet,
  Send as TelegramIcon,
  PhoneAndroid,
  Delete,
} from '@mui/icons-material';
import moment from 'moment';
import 'moment/locale/ru';
import { useDate } from '../../../app/context/DateContext';
import { getUsers } from '../services/users';
import shiftsApi from '../services/shifts';
import { staffAttendanceTrackingService } from '../services/staffAttendanceTracking';
import {
  ShiftStatus,
  STATUS_COLORS,
  ROLE_TRANSLATIONS,
  SHIFT_STATUS_TEXT,
  STAFF_ROLES,
  STATUS_TEXT,
} from '../../../shared/types/common';
import {
  getKindergartenSettings,
} from '../../settings/services/settings';
import DateNavigator from '../../../shared/components/DateNavigator';
import { useSnackbar } from 'notistack';
import { collectDeviceMetadata } from '../../../shared/utils/deviceMetadata';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import { useSort } from '../../../shared/hooks/useSort';
moment.locale('ru');

interface TimeRecord {
  id: string;
  staffId: string | undefined;
  staffName: string;
  date: string;
  actualStart?: string;
  actualEnd?: string;
  statuses: ShiftStatus[];
  workDuration?: number;
  lateMinutes?: number;
  notes?: string;
  amount: number;
  penalties: number;
  checkInDevice?: {
    userAgent?: string;
    deviceModel?: string;
    browser?: string;
    os?: string;
    ipAddress?: string;
    timezone?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    screenResolution?: string;
    platform?: string;
    language?: string;
    source?: string;
    telegramChatId?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    live?: boolean;
  };
  checkOutDevice?: {
    deviceModel?: string;
    browser?: string;
    os?: string;
    ipAddress?: string;
    timezone?: string;
    deviceType?: 'mobile' | 'tablet' | 'desktop';
    screenResolution?: string;
    platform?: string;
    language?: string;
    source?: string;
    telegramChatId?: string;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    live?: boolean;
  };
}








// Мемоизированный компонент строки посещаемости сотрудника
const StaffAttendanceRow = React.memo(({ 
  record, 
  selected, 
  onSelect, 
  onEdit, 
  onDelete, 
  getStaffName, 
  formatTime, 
  formatCurrency, 
  STATUS_TEXT, 
  STATUS_COLORS,
  index,
  staffMap
}: any) => {
  const handleSelectChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSelect(record.id, e.target.checked);
  }, [record.id, onSelect]);

  const handleEditClick = useCallback(() => {
    onEdit(record);
  }, [record, onEdit]);

  const handleDeleteClick = useCallback(() => {
    onDelete(record.id);
  }, [record.id, onDelete]);

  return (
    <TableRow selected={selected}>
      <TableCell sx={{ fontWeight: 'bold', width: 40 }}>{index + 1}</TableCell>
      <TableCell padding="checkbox">
        <Checkbox
          checked={selected}
          onChange={handleSelectChange}
        />
      </TableCell>
      <TableCell>
        <Box display='flex' alignItems='center'>
          <Avatar src={staffMap.get(record.staffId)?.photo} sx={{ mr: 2, width: 32, height: 32 }}>
            {record.staffName?.charAt(0) || <Person />}
          </Avatar>
          {record.staffName || getStaffName(record.staffId || '')}
        </Box>
      </TableCell>
      <TableCell>
        {new Date(record.date).toLocaleDateString('ru-RU')}
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant='body2'>Смена</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant='caption' color='text.secondary'>
              Приход: {record.actualStart || '-'}
            </Typography>
            {record.checkInDevice && (
              <Tooltip
                title={
                  <Box sx={{ p: 0.5 }}>
                    <Typography variant='caption' sx={{ fontWeight: 'bold', display: 'block' }}>
                      📱 Устройство прихода
                    </Typography>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      Модель: {record.checkInDevice.deviceModel || 'н/д'}
                    </Typography>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      IP: {record.checkInDevice.ipAddress || 'н/д'}
                    </Typography>
                    <Typography variant='caption' sx={{ display: 'block' }}>
                      Браузер: {record.checkInDevice.browser || 'н/д'}
                    </Typography>
                  </Box>
                }
                arrow
              >
                <Box component="span" sx={{ cursor: 'help', display: 'inline-flex', alignItems: 'center' }}>
                    <Computer sx={{ fontSize: 16, color: 'secondary.main' }} />
                </Box>
              </Tooltip>
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant='caption' color='text.secondary'>
              Уход: {record.actualEnd || '-'}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>
        <Box>
          <Typography variant='body2'>
            {formatTime(record.workDuration || 0)}
          </Typography>
          {record.lateMinutes !== undefined && record.lateMinutes > 0 && (
            <Chip
              label={`Опоздание: ${record.lateMinutes}м`}
              size='small'
              color='warning'
              sx={{ mr: 0.5, mt: 0.5 }}
            />
          )}
        </Box>
      </TableCell>
      <TableCell>
        <Box display="flex" flexWrap="wrap" gap={0.5}>
          {record.statuses.map((status: any) => (
            <Chip
              key={status}
              label={STATUS_TEXT[status] || status || '–'}
              color={(STATUS_COLORS[status] || 'default') as any}
              size='small'
            />
          ))}
        </Box>
      </TableCell>
      <TableCell align='right'>
        <Typography variant='body2' color='success.main'>
          {formatCurrency(record.amount || 0)}
        </Typography>
      </TableCell>
      <TableCell align='right'>
        <Typography variant='body2' color='error.main'>
          {formatCurrency(record.penalties || 0)}
        </Typography>
      </TableCell>
      <TableCell align='right'>
        <IconButton size='small' onClick={handleEditClick} title="Редактировать">
          <Edit fontSize="small" />
        </IconButton>
        <IconButton size='small' onClick={handleDeleteClick} color="error" title="Удалить">
          <Delete fontSize="small" />
        </IconButton>
        <AuditLogButton
          entityType="staffAttendance"
          entityId={record.id}
          entityName={record.staffName}
          size="small"
        />
      </TableCell>
    </TableRow>
  );
});

const StaffAttendanceTracking: React.FC = () => {
  const { currentDate } = useDate();
  const { enqueueSnackbar } = useSnackbar();
  
  // 1. Все стейты в начале
  const [staffList, setStaffList] = useState<any[]>([]);
  const [allRawRecords, setAllRawRecords] = useState<TimeRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const saved = localStorage.getItem('sat_selectedDate');
    return saved ? new Date(saved) : new Date();
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState(() => localStorage.getItem('sat_selectedStaff') || 'all');
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [viewMode, setViewMode] = useState<'day' | 'range'>(() => {
    const saved = localStorage.getItem('sat_viewMode');
    return (saved === 'day' || saved === 'range') ? saved : 'day';
  });
  const [startDate, setStartDate] = useState(() => localStorage.getItem('sat_startDate') || moment().format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(() => localStorage.getItem('sat_endDate') || moment().format('YYYY-MM-DD'));
  const [workingHours, setWorkingHours] = useState({ start: '09:00', end: '18:00' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState({ actualStart: '', actualEnd: '', notes: '', status: '' });
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatusForm, setBulkStatusForm] = useState({
    startDate: moment().startOf('month').format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    status: 'completed',
    staffId: 'all'
  });
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    staffId: '',
    date: new Date().toISOString().slice(0, 10),
    actualStart: '',
    actualEnd: '',
    status: 'checked_in',
    notes: '',
  });

  // 2. Refs
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => setSearchTerm(value), 500);
  }, []);

  // 3. Memos
  const staffMap = useMemo(() => {
    const map = new Map<string, any>();
    staffList.forEach(s => map.set(s.id || s._id || '', s));
    return map;
  }, [staffList]);

  const records = useMemo(() => {
    let filteredRecords = [...allRawRecords];

    if (viewMode === 'day') {
      const selectedDayStr = moment(selectedDate).format('YYYY-MM-DD');
      filteredRecords = filteredRecords.filter(r => {
        const rDate = moment(r.date).format('YYYY-MM-DD');
        return rDate === selectedDayStr;
      });
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filteredRecords = filteredRecords.filter((record) =>
        record.staffName?.toLowerCase().includes(search),
      );
    }

    if (filterRole.length > 0) {
      filteredRecords = filteredRecords.filter((record) => {
        const staffIdVal = typeof record.staffId === 'object' ? (record.staffId as any)?._id : record.staffId;
        const staff = staffMap.get(String(staffIdVal));
        const russianRole = staff
          ? ROLE_TRANSLATIONS[
          staff.role as keyof typeof ROLE_TRANSLATIONS
          ] || staff.role
          : '';
        return filterRole.includes(russianRole);
      });
    }

    return filteredRecords;
  }, [allRawRecords, viewMode, selectedDate, searchTerm, filterRole, staffMap]);

  const processedRecords = useMemo(() => {
    return records.map(r => ({
      ...r,
      _staffName: r.staffName || '',
      _status: r.statuses.join(', '),
      _date: r.date ? new Date(r.date).getTime() : 0
    }));
  }, [records]);

  // 4. Custom hook SORT
  const { items: sortedRecords, requestSort, sortConfig } = useSort(processedRecords);

  const stats = useMemo(() => {
    const totalRecords = records.length;
    const completedRecords = records.filter(
      (r) => r.statuses.includes(ShiftStatus.completed) || (r.actualStart && r.actualEnd),
    ).length;
    const totalPenalties = records.reduce((sum, r) => sum + (r.penalties || 0), 0);
    const avgWorkHours =
      records.length > 0
        ? records.reduce((sum, r) => sum + (r.workDuration || 0), 0) /
        records.length /
        60
        : 0;

    return {
      totalRecords,
      completedRecords,
      totalPenalties,
      avgWorkHours,
    };
  }, [records]);

  // Сохранение состояния в localStorage
  useEffect(() => {
    localStorage.setItem('sat_viewMode', viewMode);
    localStorage.setItem('sat_selectedDate', selectedDate.toISOString());
    localStorage.setItem('sat_startDate', startDate);
    localStorage.setItem('sat_endDate', endDate);
    localStorage.setItem('sat_selectedStaff', selectedStaff);
  }, [viewMode, selectedDate, startDate, endDate, selectedStaff]);








  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await getUsers();
        setStaffList(users.filter((user: any) => user.active === true && STAFF_ROLES.includes(user.role)));
      } catch {
        setStaffList([]);
      }
    };
    fetchStaff();
  }, []);


  const availableRoles = Object.values(ROLE_TRANSLATIONS).sort();


  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };

  const getStaffName = useCallback(
    (staffId: string) => {
      const staff = staffList.find(
        (s) => s.id === staffId || s._id === staffId,
      );
      return staff?.fullName || 'Неизвестно';
    },
    [staffList],
  );

  const fetchRecordsData = useCallback(async () => {
    try {
      const settings = await getKindergartenSettings();
      if (settings.workingHours) {
        setWorkingHours({
          start: settings.workingHours.start || '09:00',
          end: settings.workingHours.end || '18:00'
        });
      }

      if (viewMode === 'range' && (!startDate || !endDate)) {
        setAllRawRecords([]);
        return;
      }

      if (staffList.length === 0) return;

      let filters: any = {};

      if (viewMode === 'day') {
        const formattedDate = moment(selectedDate).format('YYYY-MM-DD');
        filters.startDate = formattedDate;
        filters.endDate = formattedDate;
      } else {
        filters.startDate = startDate;
        filters.endDate = endDate;
      }

      if (selectedStaff !== 'all') filters.staffId = selectedStaff;

      const response =
        await staffAttendanceTrackingService.getAllRecords(filters);
      const attendanceRecords = response.data;

      const shifts = await shiftsApi.getAll(filters);

      const attendanceMap = new Map();
      attendanceRecords.forEach((record: any) => {
        if (!record.staffId) return;
        const localDate = moment(record.date).utcOffset(5).format('YYYY-MM-DD');
        const key = `${record.staffId._id || record.staffId}-${localDate}`;
        attendanceMap.set(key, record);
      });

      const allRecords: TimeRecord[] = [];

      const getWorkDays = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        let count = 0;
        for (let d = 1; d <= lastDay; d++) {
          const dayOfWeek = new Date(year, month, d).getDay();
          if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
        }
        return count || 22;
      };

      const workDaysCache = new Map<string, number>();
      const getCachedWorkDays = (d: Date) => {
        const key = moment(d).format('YYYY-MM');
        if (workDaysCache.has(key)) return workDaysCache.get(key)!;
        const days = getWorkDays(d);
        workDaysCache.set(key, days);
        return days;
      };

      shifts.forEach((shift: any) => {
        if (!shift.staffId) return;

        const staffId = shift.staffId?._id || shift.staffId;
        const shiftDateKey = `${String(staffId)}-${shift.date}`;
        const attendanceRecord = attendanceMap.get(shiftDateKey);

        const staff = staffMap.get(String(staffId));
        const baseSalary = staff?.baseSalary || 180000;
        const salaryType = staff?.baseSalaryType || staff?.salaryType || 'month';
        const shiftRate = staff?.shiftRate || 0;

        const workDaysInMonth = getCachedWorkDays(new Date(shift.date));
        let dailyAccrual = 0;
        if (salaryType === 'shift') {
          dailyAccrual = shiftRate > 0 ? shiftRate : baseSalary;
        } else {
          dailyAccrual = Math.round(baseSalary / workDaysInMonth);
        }

        if (attendanceRecord) {
          const currentStatuses: ShiftStatus[] = [];

          if (attendanceRecord.status) {
            currentStatuses.push(attendanceRecord.status as ShiftStatus);
          } else {
            if (attendanceRecord.actualStart && !attendanceRecord.actualEnd) {
              const now = new Date();
              const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
              const [curH, curM] = almatyTimeStr.split(':').map(Number);
              const currentAlmatyMinutes = curH * 60 + curM;

              const recordDate = moment(attendanceRecord.date);
              const isToday = moment().isSame(recordDate, 'day');

              const lateMin = attendanceRecord.lateMinutes || 0;

              if (lateMin >= 90) {
                currentStatuses.push(ShiftStatus.late_arrival);
              }

              if (!isToday) {
                currentStatuses.push(ShiftStatus.no_clock_out);
              } else {
                if (currentAlmatyMinutes >= 23 * 60) {
                  currentStatuses.push(ShiftStatus.no_clock_out);
                } else if (lateMin < 90) {
                  currentStatuses.push(ShiftStatus.checked_in);
                }
              }
            } else if (attendanceRecord.actualStart && attendanceRecord.actualEnd) {
              const lateMin = attendanceRecord.lateMinutes || 0;
              const earlyLeaveMin = attendanceRecord.earlyLeaveMinutes || 0;

              if (lateMin >= 90) {
                currentStatuses.push(ShiftStatus.late_arrival);
              }
              if (earlyLeaveMin >= 90) {
                currentStatuses.push(ShiftStatus.early_leave);
              }

              if (currentStatuses.length === 0) {
                currentStatuses.push(ShiftStatus.completed);
              }
            } else if (!attendanceRecord.actualStart && attendanceRecord.actualEnd) {
              currentStatuses.push(ShiftStatus.no_clock_in);
            } else {
              currentStatuses.push(ShiftStatus.absent);
            }
          }

          const lateMin = attendanceRecord.lateMinutes || 0;

          allRecords.push({
            id: attendanceRecord._id || attendanceRecord.id || '',
            staffId: staffId,
            staffName:
              attendanceRecord.staffId?.fullName ||
              getStaffName(staffId),
            date: attendanceRecord.date,
            actualStart: attendanceRecord.actualStart
              ? new Date(attendanceRecord.actualStart).toLocaleTimeString(
                'ru-RU',
                { hour: '2-digit', minute: '2-digit' },
              )
              : undefined,
            actualEnd: attendanceRecord.actualEnd
              ? new Date(attendanceRecord.actualEnd).toLocaleTimeString(
                'ru-RU',
                { hour: '2-digit', minute: '2-digit' },
              )
              : undefined,
            statuses: currentStatuses,
            workDuration: attendanceRecord.workDuration,
            lateMinutes: lateMin,
            notes: attendanceRecord.notes || '',
            amount: (currentStatuses.includes(ShiftStatus.absent) || currentStatuses.includes(ShiftStatus.scheduled)) ? 0 : dailyAccrual,
            penalties: attendanceRecord.penalties || 0,
            checkInDevice: attendanceRecord.checkInDevice,
            checkOutDevice: attendanceRecord.checkOutDevice,
          });
        } else {
          const shiftStatus = (shift.status || 'scheduled') as ShiftStatus;
          let displayStatus: ShiftStatus = shiftStatus;

          if (shiftStatus === 'scheduled') {
            const now = moment();
            const shiftDate = moment(shift.date);
            if (now.isAfter(shiftDate.endOf('day'))) {
              displayStatus = ShiftStatus.no_clock_in;
            } else {
              const isToday = now.isSame(shiftDate, 'day');
              if (isToday) {
                const almatyTimeStr = now.toDate().toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
                const [curH] = almatyTimeStr.split(':').map(Number);
                if (curH >= 19) {
                  displayStatus = ShiftStatus.no_clock_in;
                }
              }
            }
          } else {
            displayStatus = ({
              completed: ShiftStatus.checked_out,
              late: ShiftStatus.late_arrival,
              absent: ShiftStatus.absent,
              in_progress: ShiftStatus.checked_in,
              pending_approval: ShiftStatus.absent
            } as any)[shiftStatus] || shiftStatus;
          }

          allRecords.push({
            id: `${shift.staffId?._id || shift.staffId}_${shift.date}`,
            staffId: shift.staffId?._id || shift.staffId,
            staffName:
              shift.staffId?.fullName ||
              getStaffName(shift.staffId?._id || shift.staffId || ''),
            date: shift.date,
            actualStart: undefined,
            actualEnd: undefined,
            statuses: [displayStatus],
            workDuration: undefined,
            lateMinutes: 0,
            notes: displayStatus === ShiftStatus.no_clock_in
              ? 'Не отметил приход'
              : `Смена ${shiftStatus === 'completed' ? 'завершена' : 'запланирована'} по графику`,
            amount: (displayStatus === ShiftStatus.absent || displayStatus === ShiftStatus.scheduled || displayStatus === ShiftStatus.no_clock_in) ? 0 : dailyAccrual,
            penalties: 0,
          });
        }
      });

      attendanceRecords.forEach((record: any) => {
        if (!record.staffId) return;

        const localDate = moment(record.date).utcOffset(5).format('YYYY-MM-DD');
        const currentKey = `${String(record.staffId._id || record.staffId)}-${localDate}`;
        const shiftExists = shifts.some(
          (shift: any) =>
            `${String(shift.staffId?._id || shift.staffId)}-${shift.date}` === currentKey,
        );

        if (!shiftExists) {
          const staffIdVal = typeof record.staffId === 'object' ? (record.staffId as any)?._id : record.staffId;
          const staff = staffMap.get(String(staffIdVal));
          const baseSalary = staff?.baseSalary || 180000;
          const salaryType = staff?.baseSalaryType || staff?.salaryType || 'month';
          const shiftRate = staff?.shiftRate || 0;

          const workDaysInMonth = getCachedWorkDays(new Date(record.date));
          let dailyAccrual = 0;
          if (salaryType === 'shift') {
            dailyAccrual = shiftRate > 0 ? shiftRate : baseSalary;
          } else {
            dailyAccrual = Math.round(baseSalary / workDaysInMonth);
          }

          const currentStatuses: ShiftStatus[] = [];
          if (record.status) {
            currentStatuses.push(record.status as ShiftStatus);
          } else {
            if (record.actualStart && !record.actualEnd) {
              const now = new Date();
              const almatyTimeStr = now.toLocaleTimeString('en-GB', { timeZone: TIMEZONE, hour12: false });
              const [curH, curM] = almatyTimeStr.split(':').map(Number);
              const currentAlmatyMinutes = curH * 60 + curM;

              const recordDate = moment(record.date);
              const isToday = moment().isSame(recordDate, 'day');

              const lateMin = record.lateMinutes || 0;

              if (lateMin >= 90) {
                currentStatuses.push(ShiftStatus.late_arrival);
              }

              if (!isToday) {
                currentStatuses.push(ShiftStatus.no_clock_out);
              } else {
                if (currentAlmatyMinutes >= 23 * 60) {
                  currentStatuses.push(ShiftStatus.no_clock_out);
                } else if (lateMin < 90) {
                  currentStatuses.push(ShiftStatus.checked_in);
                }
              }
            } else if (record.actualStart && record.actualEnd) {
              const lateMin = record.lateMinutes || 0;
              const earlyLeaveMin = record.earlyLeaveMinutes || 0;

              if (lateMin >= 90) {
                currentStatuses.push(ShiftStatus.late_arrival);
              }
              if (earlyLeaveMin >= 90) {
                currentStatuses.push(ShiftStatus.early_leave);
              }

              if (currentStatuses.length === 0) {
                currentStatuses.push(ShiftStatus.completed);
              }
            } else if (!record.actualStart && record.actualEnd) {
              currentStatuses.push(ShiftStatus.no_clock_in);
            } else {
              currentStatuses.push(ShiftStatus.absent);
            }
          }

          const lateMin = record.lateMinutes || 0;

          allRecords.push({
            id: record._id || record.id || '',
            staffId: record.staffId?._id || record.staffId,
            staffName:
              record.staffId?.fullName ||
              getStaffName(record.staffId?._id || record.staffId || ''),
            date: record.date,
            actualStart: record.actualStart
              ? new Date(record.actualStart).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })
              : undefined,
            actualEnd: record.actualEnd
              ? new Date(record.actualEnd).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              })
              : undefined,
            statuses: currentStatuses,
            workDuration: record.workDuration,
            lateMinutes: lateMin,
            notes: record.notes || '',
            amount: (currentStatuses.includes(ShiftStatus.absent) || currentStatuses.includes(ShiftStatus.scheduled)) ? 0 : dailyAccrual,
            penalties: record.penalties || 0,
            checkInDevice: record.checkInDevice,
            checkOutDevice: record.checkOutDevice,
          });
        }
      });

      allRecords.sort((a, b) => moment(a.date).diff(moment(b.date)));
      setAllRawRecords(allRecords);
    } catch (e) {
      console.error('Error fetching records:', e);
      setAllRawRecords([]);
    }
  }, [
    viewMode,
    startDate,
    endDate,
    selectedDate,
    selectedStaff,
    staffList,
    staffMap,
    getStaffName,
  ]);

  useEffect(() => {
    fetchRecordsData();
  }, [fetchRecordsData]);

  useEffect(() => {
    fetchRecordsData();
  }, [fetchRecordsData]);

  const handleOpenMarkDialog = () => {
    setMarkForm((prev) => ({
      ...prev,
      actualStart: workingHours.start,
      actualEnd: workingHours.end,
      date: moment(selectedDate).format('YYYY-MM-DD'),
    }));
    setMarkDialogOpen(true);
  };
  const handleCloseMarkDialog = () => {
    setMarkDialogOpen(false);
  };

  const handleMarkChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any,
  ) => {
    const { name, value } = e.target;
    setMarkForm({ ...markForm, [name]: value });
  };

  const handleCheckIn = async (staffId: string) => {
    try {
      setCurrentStaffId(staffId);
      setCheckInDialogOpen(true);
    } catch (error) {
      console.error('Error initiating check-in:', error);
    }
  };

  const handleCheckInSubmit = async (location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    try {

      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find((s) => {

        if (
          typeof s.staffId === 'object' &&
          s.staffId !== null &&
          '_id' in s.staffId
        ) {
          return (s.staffId as any)._id === currentStaffId;
        }
        return s.staffId === currentStaffId;
      });
      if (myShift) {
        if (myShift.id) {
          const deviceMetadata = collectDeviceMetadata();
          console.log('📱 [StaffAttendanceTracking] Calling checkIn with deviceMetadata:', deviceMetadata);
          await shiftsApi.checkIn(myShift.id, undefined, undefined, deviceMetadata);
        }
        setCheckInDialogOpen(false);
        fetchRecordsData();
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };

  const handleCheckOutSubmit = async (location?: {
    latitude: number;
    longitude: number;
    address?: string;
  }) => {
    try {
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find((s) => {

        if (
          typeof s.staffId === 'object' &&
          s.staffId !== null &&
          '_id' in s.staffId
        ) {
          return (s.staffId as any)._id === currentStaffId;
        }
        return s.staffId === currentStaffId;
      });
      if (myShift) {
        if (myShift.id) {
          if (myShift.id) {
            const deviceMetadata = collectDeviceMetadata();
            await shiftsApi.checkOut(myShift.id, undefined, undefined, deviceMetadata);
          }
        }
        setCheckOutDialogOpen(false);
        fetchRecordsData();
      }
    } catch (error) {
      console.error('Error during check-out:', error);
    }
  };

  const handleMarkSubmit = async () => {
    try {

      await staffAttendanceTrackingService.createRecord({
        staffId: markForm.staffId,
        date: markForm.date,
        actualStart: markForm.actualStart,
        actualEnd: markForm.actualEnd,
        status: markForm.status as any,
        notes: markForm.notes,
      } as any);

      setMarkDialogOpen(false);
      fetchRecordsData();
    } catch { }
  };

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatTime = useCallback((minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  }, []);

  const handleEditRecord = useCallback((record: TimeRecord) => {
    const editRecord = { ...record };
    if (!editRecord.actualStart) editRecord.actualStart = workingHours.start;

    setSelectedRecord(editRecord);
    setEditDialogOpen(true);
  }, [workingHours.start]);

  const handleSaveRecord = async () => {
    if (!selectedRecord) return;

    try {
      const isNewRecord = selectedRecord.id.includes('_');
      let updatedRecord: { data: any };
      const dateOnly = moment(selectedRecord.date).format('YYYY-MM-DD');

      if (isNewRecord) {
        updatedRecord = await staffAttendanceTrackingService.createRecord({
          staffId: selectedRecord.staffId,
          date: dateOnly,
          actualStart: selectedRecord.actualStart
            ? new Date(`${dateOnly}T${selectedRecord.actualStart}:00`)
            : undefined,
          actualEnd: selectedRecord.actualEnd
            ? new Date(`${dateOnly}T${selectedRecord.actualEnd}:00`)
            : undefined,
          notes: selectedRecord.notes,
        } as any);
      } else {
        const updateData: any = {
          notes: selectedRecord.notes,
          lateMinutes: selectedRecord.lateMinutes,
          status: selectedRecord.statuses[0],
        };

        if (selectedRecord.actualStart) {
          updateData.actualStart = new Date(`${dateOnly}T${selectedRecord.actualStart}:00`);
        }
        if (selectedRecord.actualEnd) {
          updateData.actualEnd = new Date(`${dateOnly}T${selectedRecord.actualEnd}:00`);
        }

        updatedRecord = await staffAttendanceTrackingService.updateRecord(
          selectedRecord.id,
          updateData,
        );
      }

      setEditDialogOpen(false);
      setSelectedRecord(null);
      enqueueSnackbar('Запись успешно сохранена!', { variant: 'success' });
      fetchRecordsData();
    } catch (e) {
      console.error('Error saving record:', e);
      enqueueSnackbar('Ошибка сохранения записи', { variant: 'error' });
    }
  };

  const handleSelectRecord = useCallback((id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = records
        .filter(r => r.id)
        .map(r => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.length === 0) {
      enqueueSnackbar('Выберите хотя бы одну запись', { variant: 'warning' });
      return;
    }

    setIsBulkUpdating(true);
    try {
      const existingIds = selectedIds.filter(id => !id.includes('_'));
      const plannedIds = selectedIds.filter(id => id.includes('_'));

      let successCount = 0;
      let errorCount = 0;

      for (const plannedId of plannedIds) {
        try {
          const [staffId, dateStr] = plannedId.split('_');
          const createData: any = {
            staffId,
            date: dateStr,
          };

          if (bulkForm.actualStart) {
            createData.actualStart = new Date(`${dateStr}T${bulkForm.actualStart}:00`);
          }
          if (bulkForm.actualEnd) {
            createData.actualEnd = new Date(`${dateStr}T${bulkForm.actualEnd}:00`);
          }
          if (bulkForm.notes) {
            createData.notes = bulkForm.notes;
          }
          if (bulkForm.status) {
            createData.status = bulkForm.status;
          }

          await staffAttendanceTrackingService.createRecord(createData);
          successCount++;
        } catch (e) {
          console.error('Error creating record for:', plannedId, e);
          errorCount++;
        }
      }

      if (existingIds.length > 0) {
        const updateData: any = {
          ids: existingIds,
          timeStart: bulkForm.actualStart || undefined,
          timeEnd: bulkForm.actualEnd || undefined,
          notes: bulkForm.notes || undefined,
          status: bulkForm.status || undefined
        };

        const response = await staffAttendanceTrackingService.bulkUpdate(updateData);
        successCount += response.data.success || 0;
        errorCount += response.data.errors || 0;
      }

      enqueueSnackbar(
        `Обработано: ${successCount} записей${errorCount > 0 ? `, ошибок: ${errorCount}` : ''}`,
        { variant: errorCount > 0 ? 'warning' : 'success' }
      );

      setBulkDialogOpen(false);
      setSelectedIds([]);
      setBulkForm({ actualStart: '', actualEnd: '', notes: '', status: '' });
      fetchRecordsData();
    } catch (e: any) {
      console.error('Error bulk updating:', e);
      enqueueSnackbar(e.response?.data?.error || 'Ошибка массового обновления', { variant: 'error' });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleBulkStatusUpdate = async () => {
    setIsBulkUpdating(true);
    try {
      const filters = {
        startDate: bulkStatusForm.startDate,
        endDate: bulkStatusForm.endDate,
        status: bulkStatusForm.status,
        staffId: bulkStatusForm.staffId === 'all' ? undefined : bulkStatusForm.staffId
      };

      await shiftsApi.bulkUpdateStatus(filters);

      enqueueSnackbar('Статусы успешно обновлены', { variant: 'success' });
      setBulkStatusDialogOpen(false);
      fetchRecordsData();
    } catch (e: any) {
      console.error('Error bulk status updating:', e);
      enqueueSnackbar(e.response?.data?.error || 'Ошибка массового обновления статусов', { variant: 'error' });
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleDeleteRecord = useCallback(async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    try {
      await staffAttendanceTrackingService.deleteRecord(id);
      enqueueSnackbar('Запись удалена', { variant: 'success' });
      fetchRecordsData();
    } catch (e) {
      console.error('Error deleting record:', e);
      enqueueSnackbar('Ошибка при удалении', { variant: 'error' });
    }
  }, [enqueueSnackbar, fetchRecordsData]);

  const renderOverviewTab = () => (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='primary'>
                Всего записей
              </Typography>
              <Typography variant='h4'>{stats.totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='success.main'>
                Завершено
              </Typography>
              <Typography variant='h4'>{stats.completedRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant='h6' color='error.main'>
                Вычеты
              </Typography>
              <Typography variant='h4'>{formatCurrency(stats.totalPenalties)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Кнопка массового обновления */}
      {selectedIds.length > 0 && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Chip
            label={`Выбрано: ${selectedIds.length}`}
            color="primary"
            variant="outlined"
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              // Инициализируем форму значениями из настроек
              setBulkForm({
                actualStart: workingHours.start,
                actualEnd: workingHours.end,
                notes: '',
                status: ''
              });
              setBulkDialogOpen(true);
            }}
            startIcon={<Check />}
          >
            Массовое обновление
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => setSelectedIds([])}
          >
            Снять выбор
          </Button>
        </Box>
      )}

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < sortedRecords.filter(r => !r.id.includes('_')).length}
                  checked={selectedIds.length > 0 && selectedIds.length === sortedRecords.filter(r => !r.id.includes('_')).length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === '_staffName'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('_staffName')}
                >
                  Сотрудник
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === '_date'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('_date')}
                >
                  Дата
                </TableSortLabel>
              </TableCell>
              <TableCell>Смена</TableCell>
              <TableCell>Время работы</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortConfig.key === '_status'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('_status')}
                >
                  Статус
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>
                <TableSortLabel
                  active={sortConfig.key === 'amount'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('amount')}
                >
                  Начислено
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>
                <TableSortLabel
                  active={sortConfig.key === 'penalties'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('penalties')}
                >
                  Вычеты
                </TableSortLabel>
              </TableCell>
              <TableCell align='right'>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.length === 0 && viewMode === 'range' && selectedStaff === 'all' && (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 10 }}>
                  <Typography variant="body1" color="text.secondary">
                    Выберите сотрудника и период для отображения данных в режиме периода
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {sortedRecords.map((record, index) => (
              <StaffAttendanceRow
                key={record.id}
                record={record}
                selected={selectedIds.includes(record.id)}
                onSelect={(id: string, checked: boolean) => handleSelectRecord(id, checked)}
                onEdit={handleEditRecord}
                onDelete={handleDeleteRecord}
                getStaffName={getStaffName}
                formatTime={formatTime}
                formatCurrency={formatCurrency}
                STATUS_TEXT={STATUS_TEXT}
                STATUS_COLORS={STATUS_COLORS}
                index={index}
                staffMap={staffMap}
              />
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );

  return (
    <Box>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h4' component='h1' gutterBottom>
          <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
          Учет рабочего времени
        </Typography>
        <Box>
          <Button
            variant='contained'
            startIcon={<Schedule />}
            onClick={handleOpenMarkDialog}
            sx={{ mr: 1 }}
          >
            Создать смену
          </Button>
          <Button
            variant='contained'
            color='secondary'
            startIcon={<Edit />}
            onClick={() => setBulkStatusDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Массовая корректировка
          </Button>
          <AuditLogButton entityType="staffAttendance" />
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        {viewMode === 'day' && <DateNavigator />}
        <Box display='flex' flexWrap='wrap' gap={2} alignItems='center' p={2}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, value) => value && setViewMode(value)}
            size='small'
            color='primary'
          >
            <ToggleButton value='day'>День</ToggleButton>
            <ToggleButton value='range' onClick={() => {
              if (viewMode === 'day') {
                setStartDate(moment(selectedDate).startOf('month').format('YYYY-MM-DD'));
                setEndDate(moment(selectedDate).endOf('month').format('YYYY-MM-DD'));
              }
            }}>Период</ToggleButton>
          </ToggleButtonGroup>

          {/* Выбор даты */}
          {viewMode === 'day' ? (
            <TextField
              label='Дата'
              type='date'
              size='small'
              value={moment(selectedDate).format('YYYY-MM-DD')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              sx={{ minWidth: '180px' }}
              InputLabelProps={{ shrink: true }}
            />
          ) : (
            <>
              <TextField
                label='Начало'
                type='date'
                size='small'
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ minWidth: '150px' }}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label='Конец'
                type='date'
                size='small'
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ minWidth: '150px' }}
                InputLabelProps={{ shrink: true }}
              />
            </>
          )}
          {(tabValue === 3 || tabValue === 4) && (
            <TextField
              label='Дата'
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 150 }}
            />
          )}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Сотрудник</InputLabel>
            <Select
              value={selectedStaff}
              label='Сотрудник'
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <MenuItem value='all'>Все сотрудники</MenuItem>
              {staffList.map((staff: any) => (
                <MenuItem key={staff.id} value={staff.id}>
                  {staff.fullName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Фильтр по имени */}
          <TextField
            placeholder='Поиск по имени...'
            variant='outlined'
            size='small'
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Фильтр по роли */}
          <FormControl size='small' sx={{ minWidth: '200px' }}>
            <InputLabel id='role-filter-label'>Фильтр по должности</InputLabel>
            <Select
              labelId='role-filter-label'
              multiple
              value={filterRole}
              onChange={handleFilterRoleChange}
              input={<OutlinedInput label='Фильтр по должности' />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size='small' />
                  ))}
                </Box>
              )}
            >
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  <Checkbox checked={filterRole.indexOf(role) > -1} />
                  <ListItemText primary={role} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
        >
          <Tab label='Обзор' />
        </Tabs>
        <Box sx={{ p: 3 }}>{tabValue === 0 && renderOverviewTab()}</Box>
      </Paper>

      {/* Mark Dialog */}
      <Dialog open={markDialogOpen} onClose={handleCloseMarkDialog}>
        <DialogTitle>Отметить рабочее время</DialogTitle>
        <DialogContent>
          {/* TODO: добавить поля для выбора сотрудника, даты, времени, статуса, комментария */}
          <TextField
            label='Сотрудник'
            name='staffId'
            select
            value={markForm.staffId}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
          >
            {staffList.map((staff: any) => (
              <MenuItem key={staff.id} value={staff.id}>
                {staff.fullName}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label='Дата'
            name='date'
            type='date'
            value={markForm.date}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Время прихода'
            name='actualStart'
            type='time'
            value={markForm.actualStart}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Время ухода'
            name='actualEnd'
            type='time'
            value={markForm.actualEnd}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label='Статус'
            name='status'
            select
            value={markForm.status}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
          >
            <MenuItem value='checked_in'>Пришел</MenuItem>
            <MenuItem value='checked_out'>Ушел</MenuItem>
            <MenuItem value='on_break'>Перерыв</MenuItem>
            <MenuItem value='overtime'>Переработка</MenuItem>
            <MenuItem value='absent'>Отсутствует</MenuItem>
            <MenuItem value='late'>Опоздание</MenuItem>
            <MenuItem value='pending_approval'>Ожидает подтверждения</MenuItem>
          </TextField>
          <TextField
            label='Комментарий'
            name='notes'
            value={markForm.notes}
            onChange={handleMarkChange}
            fullWidth
            margin='normal'
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkDialog}>Отмена</Button>
          <Button variant='contained' onClick={handleMarkSubmit}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Редактировать запись</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label='Сотрудник'
                  value={selectedRecord.staffName || ''}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Дата'
                  type='date'
                  value={selectedRecord.date || ''}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Статус'
                  select
                  value={selectedRecord.statuses[0] || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev
                        ? {
                          ...prev,
                          statuses: [e.target.value as ShiftStatus],
                        }
                        : null,
                    )
                  }
                  fullWidth
                >
                  {Object.entries(SHIFT_STATUS_TEXT).map(([key, label]) => (
                    <MenuItem key={key} value={key}>
                      {label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Время прихода'
                  type='time'
                  value={selectedRecord.actualStart || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev ? { ...prev, actualStart: e.target.value } : null,
                    )
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Время ухода'
                  type='time'
                  value={selectedRecord.actualEnd || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev ? { ...prev, actualEnd: e.target.value } : null,
                    )
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label='Примечания'
                  multiline
                  rows={3}
                  value={selectedRecord.notes || ''}
                  onChange={(e) =>
                    setSelectedRecord((prev) =>
                      prev ? { ...prev, notes: e.target.value } : null,
                    )
                  }
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant='contained' onClick={handleSaveRecord}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog
        open={checkInDialogOpen}
        onClose={() => setCheckInDialogOpen(false)}
      >
        <DialogTitle>Отметить приход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить приход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            onClick={() => handleCheckInSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog
        open={checkOutDialogOpen}
        onClose={() => setCheckOutDialogOpen(false)}
      >
        <DialogTitle>Отметить уход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить уход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckOutDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            onClick={() => handleCheckOutSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Массовое обновление ({selectedIds.length} записей)</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Укажите новое время прихода и ухода для выбранных записей.
            Оставьте поле пустым, чтобы не изменять его.
            Опоздания и штрафы будут пересчитаны автоматически.
          </Typography>
          <TextField
            label="Время прихода"
            type="time"
            fullWidth
            sx={{ mb: 2 }}
            value={bulkForm.actualStart}
            onChange={(e) => setBulkForm(prev => ({ ...prev, actualStart: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Время ухода"
            type="time"
            fullWidth
            sx={{ mb: 2 }}
            value={bulkForm.actualEnd}
            onChange={(e) => setBulkForm(prev => ({ ...prev, actualEnd: e.target.value }))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Статус"
            select
            fullWidth
            sx={{ mb: 2, mt: 2 }}
            value={bulkForm.status}
            onChange={(e) => setBulkForm(prev => ({ ...prev, status: e.target.value }))}
          >
            <MenuItem value="">Не менять статус</MenuItem>
            {Object.entries(STATUS_TEXT).map(([key, label]) => (
              <MenuItem key={key} value={key}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Примечание"
            multiline
            rows={2}
            fullWidth
            value={bulkForm.notes}
            onChange={(e) => setBulkForm(prev => ({ ...prev, notes: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            onClick={handleBulkUpdate}
            disabled={isBulkUpdating || (!bulkForm.actualStart && !bulkForm.actualEnd && !bulkForm.notes)}
            startIcon={isBulkUpdating ? <Schedule /> : <Check />}
          >
            {isBulkUpdating ? 'Обновление...' : 'Обновить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Status Update Dialog */}
      <Dialog
        open={bulkStatusDialogOpen}
        onClose={() => setBulkStatusDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Массовая корректировка статусов</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            Выберите период и статус для массового обновления.
            Если выбран статус "Завершено", время прихода и ухода будет установлено согласно настройкам.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Сотрудник</InputLabel>
                <Select
                  value={bulkStatusForm.staffId}
                  label='Сотрудник'
                  onChange={(e) => setBulkStatusForm(prev => ({ ...prev, staffId: e.target.value }))}
                >
                  <MenuItem value='all'>Все сотрудники</MenuItem>
                  {staffList.map((staff: any) => (
                    <MenuItem key={staff.id} value={staff.id}>
                      {staff.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Начало'
                type='date'
                fullWidth
                value={bulkStatusForm.startDate}
                onChange={(e) => setBulkStatusForm(prev => ({ ...prev, startDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Конец'
                type='date'
                fullWidth
                value={bulkStatusForm.endDate}
                onChange={(e) => setBulkStatusForm(prev => ({ ...prev, endDate: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Статус'
                select
                fullWidth
                value={bulkStatusForm.status}
                onChange={(e) => setBulkStatusForm(prev => ({ ...prev, status: e.target.value }))}
              >
                {Object.entries(SHIFT_STATUS_TEXT).map(([key, label]) => (
                  <MenuItem key={key} value={key}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkStatusDialogOpen(false)}>Отмена</Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleBulkStatusUpdate}
            disabled={isBulkUpdating}
            startIcon={isBulkUpdating ? <Schedule /> : <Check />}
          >
            {isBulkUpdating ? 'Обновление...' : 'Применить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAttendanceTracking;
