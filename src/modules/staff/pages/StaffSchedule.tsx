import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import moment from 'moment/min/moment-with-locales';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
  TableSortLabel,
  OutlinedInput,
  InputAdornment,
  Checkbox,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  Avatar,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { Search as SearchIcon } from '@mui/icons-material';
import { useSort } from '../../../shared/hooks/useSort';
import ExportButton from '../../../shared/components/ExportButton';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import { exportData } from '../../../shared/utils/exportUtils';

import { useDate } from '../../../app/context/DateContext';
import DateNavigator from '../../../shared/components/DateNavigator';
import { useAuth } from '../../../app/context/AuthContext';


import {
  Shift,
  ShiftStatus,
  STATUS_TEXT,
  STATUS_COLORS,
  STAFF_ROLES,
} from '../../../shared/types/common';
import {
  getShifts,
  updateShift,
  deleteShift,
  shiftsApi,
} from '../services/shifts';
import { useStaff } from '../../../app/context/StaffContext';
import { getHolidays } from '../../../shared/services/common';
import { staffAttendanceTrackingService } from '../services/staffAttendanceTracking';




const ROLE_COLORS: Record<string, string> = {
  admin: '#f44336',
  manager: '#9c27b0',
  teacher: '#2196f3',
  assistant: '#4caf50',
  nurse: '#ff9800',
  cook: '#795548',
  cleaner: '#607d8b',
  security: '#3f51b5',
  psychologist: '#e91e63',
  music_teacher: '#00bcd4',
  physical_teacher: '#8bc34a',
  staff: '#9e9e9e',
  doctor: '#ff5722',
  intern: '#673ab7',
};

const ROLE_LABELS: Record<string, string> = {
  admin: 'Администратор',
  manager: 'Менеджер',
  teacher: 'Воспитатель',
  assistant: 'Помощник воспитателя',
  nurse: 'Медсестра',
  cook: 'Повар',
  cleaner: 'Уборщица',
  security: 'Охранник',
  psychologist: 'Психолог',
  music_teacher: 'Музыкальный руководитель',
  physical_teacher: 'Инструктор по физкультуре',
  staff: 'Персонал',
  doctor: 'Врач',
  intern: 'Стажер',
};

const isWeekend = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Вспомогательный компонент для чипа смены, чтобы избежать инлайновых функций
const ShiftChip = React.memo(({ shift, displayStatus, onEdit, canEdit }: any) => {
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!canEdit) {
      return;
    }
    e.stopPropagation();
    onEdit(shift);
  }, [shift, onEdit, canEdit]);

  return (
    <Chip
      label={STATUS_TEXT[displayStatus] || displayStatus}
      size='small'
      color={STATUS_COLORS[displayStatus] || 'default'}
      sx={{ fontSize: '0.65rem' }}
      onClick={canEdit ? handleClick : undefined}
    />
  );
});

// Мемоизированный компонент ячейки расписания
const ScheduleCell = React.memo(({
  staffId,
  date,
  dayShifts,
  recordsForDay,
  isHoliday,
  weekend,
  onCellClick,
  onEditShift,
  canEdit,
}: any) => {
  const dateStr = moment(date).format('YYYY-MM-DD');

  const handleClick = useCallback(() => {
    if (!canEdit) {
      return;
    }
    onCellClick(staffId, dateStr);
  }, [onCellClick, staffId, dateStr, canEdit]);

  return (
    <TableCell
      align='center'
      sx={{
        p: 1,
        backgroundColor: isHoliday ? '#ffebee' : (weekend ? '#f5f5f5' : 'inherit'),
        border: '1px solid #e0e0e0',
        width: '120px',
        minHeight: '80px',
        cursor: canEdit ? 'pointer' : 'default',
        '&:hover': { backgroundColor: canEdit ? 'rgba(0,0,0,0.04)' : 'inherit' }
      }}
      onClick={handleClick}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        {dayShifts.map((shift: any) => {
          // Находим соответствующую запись посещаемости для этой смены
          const attendanceRecord = recordsForDay.find((r: any) => {
            const rId = r.staffId?._id || r.staffId;
            return rId === staffId;
          });

          // Логика определения статуса (взята из оригинального кода)
          let displayStatus = shift.status;
          if (attendanceRecord) {
            if (attendanceRecord.actualStart && attendanceRecord.actualEnd) {
              const lateMin = attendanceRecord.lateMinutes || 0;
              displayStatus = lateMin >= 15 ? 'late' : 'completed';
            } else if (attendanceRecord.actualStart && !attendanceRecord.actualEnd) {
              const lateMin = attendanceRecord.lateMinutes || 0;
              displayStatus = lateMin >= 15 ? 'late' : 'in_progress';
            }
          }

          return (
            <ShiftChip
              key={shift.id || shift._id}
              shift={shift}
              displayStatus={displayStatus}
              onEdit={onEditShift}
              canEdit={canEdit}
            />
          );
        })}
        {recordsForDay.map((record: any) => (
          <Box key={record._id} sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.3 }}>
            {(record.lateMinutes ?? 0) > 0 && (
              <Chip label={`Оп: ${record.lateMinutes}м`} size='small' color='error' variant='outlined' sx={{ fontSize: '0.6rem' }} />
            )}
            {(record.earlyLeaveMinutes ?? 0) > 0 && (
              <Chip label={`Ух: ${record.earlyLeaveMinutes}м`} size='small' color='warning' variant='outlined' sx={{ fontSize: '0.6rem' }} />
            )}
            {record.actualStart && record.actualEnd && (
              <Chip label="✓" size='small' color='success' variant='outlined' sx={{ fontSize: '0.6rem', minWidth: 'auto' }} />
            )}
            {record.actualStart && !record.actualEnd && (
              <Chip label="На работе" size='small' color='success' variant='outlined' sx={{ fontSize: '0.6rem' }} />
            )}
          </Box>
        ))}
      </Box>
    </TableCell>
  );
});

// Мемоизированная строка расписания
const ScheduleRow = React.memo(({
  staffMember,
  weekDaysMeta,
  staffShifts,
  staffAttendance,
  selectedStaff,
  onStaffToggle,
  onCellClick,
  onEditShift,
  ROLE_COLORS,
  ROLE_LABELS,
  index,
  canSelect,
  canEdit,
}: any) => {
  const staffId = staffMember.id || staffMember._id;
  const isSelected = selectedStaff.includes(staffId || '');

  // Группируем данные сотрудника по датам для быстрого доступа внутри строки
  const shiftsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!staffId) return map;
    staffShifts.forEach((s: any) => {
      const dStr = moment(s.date).format('YYYY-MM-DD');
      if (!map.has(dStr)) map.set(dStr, []);
      map.get(dStr)!.push(s);
    });
    return map;
  }, [staffShifts, staffId]);

  const attendanceByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    if (!staffId) return map;
    staffAttendance.forEach((r: any) => {
      const dStr = moment(r.date).format('YYYY-MM-DD');
      if (!map.has(dStr)) map.set(dStr, []);
      map.get(dStr)!.push(r);
    });
    return map;
  }, [staffAttendance, staffId]);

  const handleToggle = useCallback(() => {
    if (!canSelect || !staffId) {
      return;
    }
    onStaffToggle(staffId);
  }, [onStaffToggle, staffId, canSelect]);

  if (!staffId) return null;

  return (
    <TableRow key={staffId} sx={{ backgroundColor: isSelected ? 'action.selected' : 'inherit' }}>
      <TableCell align="center" sx={{ width: '50px' }}>
        <Typography variant="body2">{index}</Typography>
      </TableCell>
      <TableCell>
        <Box
          display='flex'
          alignItems='center'
          sx={{ cursor: canSelect ? 'pointer' : 'default' }}
          onClick={handleToggle}
        >
          <Checkbox size='small' checked={isSelected} disabled={!canSelect} />
          <Avatar src={staffMember.photo} sx={{ width: 24, height: 24, mr: 1 }}>
            {staffMember.fullName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant='body2' fontWeight='bold'>{staffMember.fullName}</Typography>
            <Typography variant='caption' sx={{ color: ROLE_COLORS[staffMember.role] || '#9e9e9e' }}>
              {ROLE_LABELS[staffMember.role] || staffMember.role}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      {weekDaysMeta.map((day: any) => {
        const dayShifts = shiftsByDate.get(day.dateStr) || [];
        const recordsForDay = attendanceByDate.get(day.dateStr) || [];

        return (
          <ScheduleCell
            key={day.dateStr}
            staffId={staffId}
            date={day.date}
            dayShifts={dayShifts}
            recordsForDay={recordsForDay}
            isHoliday={day.isHoliday}
            weekend={day.weekend}
            onCellClick={onCellClick}
            onEditShift={onEditShift}
            canEdit={canEdit}
          />
        );
      })}
    </TableRow>
  );
});




const StaffSchedule: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { currentDate } = useDate();
  const { user: currentUser } = useAuth();
  const role = currentUser?.role;
  const canManageSchedule = role === 'admin' || role === 'manager';

  useEffect(() => {
    moment.locale('ru');
  }, []);


  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [nameFilter, setNameFilter] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setNameFilter(value);
    }, 500);
  }, []);

  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(value.includes('') ? [] : (typeof value === 'string' ? value.split(',') : value));
  };


  const { staff: allStaff, fetchStaff } = useStaff();
  const [shifts, setShifts] = useState<any[]>([]);

  const staff = useMemo(() => {
    return allStaff.filter((u: any) => STAFF_ROLES.includes(u.role) && (u.id || u._id));
  }, [allStaff]);

  const staffById = useMemo(() => {
    const map = new Map<string, any>();
    staff.forEach((member: any) => {
      const id = member.id || member._id;
      if (id) map.set(String(id), member);
    });
    return map;
  }, [staff]);


  const [holidays, setHolidays] = useState<string[]>([]);
  const [workingSaturdays, setWorkingSaturdays] = useState<string[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  // Перемещаем useSort и useMemo выше условий загрузки/ошибки
  const { items: sortedStaff, requestSort, sortConfig } = useSort(staff, { key: 'fullName', direction: 'asc' });

  const filteredStaff = useMemo(() => {
    return sortedStaff.filter((s) => {
      const matchesSearch = !nameFilter || s.fullName.toLowerCase().includes(nameFilter.toLowerCase());
      const roleLabel = ROLE_LABELS[s.role as string] || s.role;
      const matchesRole = filterRole.length === 0 || filterRole.includes(roleLabel);
      return matchesSearch && matchesRole && s.active;
    });
  }, [sortedStaff, nameFilter, filterRole]);

  const availableRoleLabels = useMemo(() => Object.values(ROLE_LABELS).sort(), []);

  const shiftsByStaff = useMemo(() => {
    const map = new Map<string, any[]>();
    shifts.forEach(shift => {
      const sId = typeof shift.staffId === 'string' ? shift.staffId : (shift.staffId as any)?._id;
      if (!map.has(sId)) map.set(sId, []);
      map.get(sId)!.push(shift);
    });
    return map;
  }, [shifts]);

  const attendanceByStaff = useMemo(() => {
    const map = new Map<string, any[]>();
    attendanceRecords.forEach(record => {
      const sId = typeof record.staffId === 'object' ? (record.staffId as any)?._id : record.staffId;
      if (!map.has(sId)) map.set(sId, []);
      map.get(sId)!.push(record);
    });
    return map;
  }, [attendanceRecords]);



  const handleExportFullMonth = async () => {
    const monthStart = moment(currentDate).startOf('month');
    const monthEnd = moment(currentDate).endOf('month');
    const period = `${monthStart.format('DD.MM.YYYY')} - ${monthEnd.format('DD.MM.YYYY')}`;

    try {
      setLoading(true);
      await exportData('staff-schedule', 'xlsx', {
        startDate: monthStart.format('YYYY-MM-DD'),
        endDate: monthEnd.format('YYYY-MM-DD'),
      });
      enqueueSnackbar('Отчет за месяц экспортирован', { variant: 'success' });
    } catch (e: any) {
      console.error('Error exporting staff schedule:', e);
      enqueueSnackbar('Ошибка при экспорте', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportType: string, exportFormat: 'xlsx') => {
    handleExportFullMonth();
  };

  const [assignmentType, setAssignmentType] = useState<'single' | 'period'>('single');
  const [assignmentAction, setAssignmentAction] = useState<'create' | 'delete'>('create');
  const [formData, setFormData] = useState<any>({
    userId: '',
    staffId: '',
    staffName: '',
    date: moment().format('YYYY-MM-DD'),
    startDate: moment().format('YYYY-MM-DD'),
    endDate: moment().format('YYYY-MM-DD'),
    selectedDays: [1, 2, 3, 4, 5], // Пн-Пт по умолчанию
    notes: '',
    status: ShiftStatus.scheduled,
    alternativeStaffId: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        const weekStart = moment(currentDate).startOf('isoWeek');
        const weekEnd = moment(currentDate).endOf('isoWeek');
        const startDate = weekStart.format('YYYY-MM-DD');
        const endDate = weekEnd.format('YYYY-MM-DD');

        const [shiftsData, attendanceData] = await Promise.all([
          getShifts(startDate, endDate),
          staffAttendanceTrackingService.getAllRecords({ startDate, endDate })
        ]);

        // Fetch staff in parallel but using context
        fetchStaff();

        setShifts(shiftsData);
        const rawAttendance = attendanceData?.data || attendanceData || [];
        setAttendanceRecords(Array.isArray(rawAttendance) ? rawAttendance : (rawAttendance?.items || rawAttendance?.data || []));

        try {
          const hData = await getHolidays();
          if (hData) {
            if (hData.holidays) setHolidays(hData.holidays);
            if (hData.workingSaturdays) setWorkingSaturdays(hData.workingSaturdays);
          }
        } catch (hErr) {
          console.error("Error fetching holidays:", hErr);
        }
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Не удалось загрузить данные');
        enqueueSnackbar('Ошибка при загрузке данных', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentDate, enqueueSnackbar]);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingShift(null);
    setFormData({
      userId: '',
      staffId: '',
      staffName: '',
      date: moment().format('YYYY-MM-DD'),
      startDate: moment().format('YYYY-MM-DD'),
      endDate: moment().format('YYYY-MM-DD'),
      selectedDays: [1, 2, 3, 4, 5],
      notes: '',
      status: ShiftStatus.scheduled,
      alternativeStaffId: '',
    });
    setSelectedStaff([]);
  }, []);

  const validateForm = useCallback(() => {
    if (!formData.staffId && selectedStaff.length === 0) {
      enqueueSnackbar('Выберите сотрудника', { variant: 'error' });
      return false;
    }
    if (assignmentType === 'single' && !formData.date) {
      enqueueSnackbar('Выберите дату', { variant: 'error' });
      return false;
    }
    if (assignmentType === 'period') {
      if (!formData.startDate || !formData.endDate) {
        enqueueSnackbar('Введите период', { variant: 'error' });
        return false;
      }
      if (formData.selectedDays.length === 0) {
        enqueueSnackbar('Выберите хотя бы один день недели', { variant: 'error' });
        return false;
      }
    }
    return true;
  }, [formData, selectedStaff, assignmentType, enqueueSnackbar]);




  const assignFiveTwoSchedule = async () => {
    if (!canManageSchedule) {
      enqueueSnackbar('Недостаточно прав для управления графиком', { variant: 'error' });
      return;
    }
    try {
      setLoading(true);
      const monthStart = moment(currentDate).startOf('month');
      const monthEnd = moment(currentDate).endOf('month');

      const dates = [];
      let current = monthStart.clone();
      while (current.isSameOrBefore(monthEnd)) {
        dates.push(current.toDate());
        current.add(1, 'day');
      }

      const workDays = dates.filter((date) => {
        const dateStr = moment(date).format('YYYY-MM-DD');
        const dayOfWeek = date.getDay();
        if (workingSaturdays.includes(dateStr)) return true;
        if (holidays.includes(dateStr)) return false;
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      });

      // Получаем все смены за месяц одним запросом
      const existingShifts = await getShifts(
        monthStart.format('YYYY-MM-DD'),
        monthEnd.format('YYYY-MM-DD'),
      );

      // Собираем все новые смены в один массив
      const shiftsToCreate: any[] = [];

      for (const staffId of selectedStaff) {
        const existingShiftDates = new Set(
          existingShifts
            .filter((shift) => (shift.staffId as any)?._id === staffId || shift.staffId === staffId)
            .map((shift) => shift.date),
        );

        for (const date of workDays) {
          const dateStr = moment(date).format('YYYY-MM-DD');
          if (existingShiftDates.has(dateStr)) continue;

          shiftsToCreate.push({
            userId: staffId,
            staffId: staffId,
            staffName: staffById.get(String(staffId))?.fullName || '',
            date: dateStr,
            notes: 'Рабочий день по графику 5/2',
            status: ShiftStatus.scheduled,
          });
        }
      }

      if (shiftsToCreate.length === 0) {
        enqueueSnackbar('Все смены уже назначены', { variant: 'info' });
        setLoading(false);
        return;
      }

      // Отправляем одним bulk-запросом
      const result = await shiftsApi.bulkCreate(shiftsToCreate);
      enqueueSnackbar(`График 5/2 назначен: создано ${result?.success || shiftsToCreate.length} смен`, { variant: 'success' });

      const weekStart = moment(currentDate).startOf('isoWeek');
      const weekEnd = moment(currentDate).endOf('isoWeek');
      const shiftsData = await getShifts(weekStart.format('YYYY-MM-DD'), weekEnd.format('YYYY-MM-DD'));
      setShifts(shiftsData);
      setSelectedStaff([]);
    } catch (err: any) {
      console.error('Error assigning 5/2 schedule:', err);
      enqueueSnackbar('Ошибка при назначении графика 5/2', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  const handleDateChange = useCallback((date: Date | null) => {
    if (date) {
      setFormData((prev: any) => ({ ...prev, date: moment(date).format('YYYY-MM-DD') }));
    }
  }, []);

  const handleStaffSelect = useCallback((e: SelectChangeEvent<string>) => {
    const staffId = e.target.value;
    const selectedS = staffById.get(String(staffId));
    if (selectedS) {
      setFormData((prev: any) => ({
        ...prev,
        staffId,
        staffName: selectedS.fullName,
      }));
    }
  }, [staffById]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageSchedule) {
      enqueueSnackbar('Недостаточно прав для управления графиком', { variant: 'error' });
      return;
    }

    if (!validateForm()) return;

    setLoading(true);
    try {
      if (editingShift) {
        const id = editingShift.id || editingShift._id;
        if (id) {
          await updateShift(id, {
            ...formData,
            date: moment(formData.date).format('YYYY-MM-DD'),
          });
          enqueueSnackbar('Смена обновлена', { variant: 'success' });
        }
      } else {
        if (assignmentAction === 'delete') {
          const idsToDelete: string[] = [];
          const staffs = selectedStaff.length > 0 ? selectedStaff : [formData.staffId];

          for (const sId of staffs) {
            const staffShifts = shifts.filter(s => (s.staffId as any)?._id === sId || s.staffId === sId);
            const start = moment(formData.startDate).startOf('day');
            const end = moment(formData.endDate).endOf('day');

            staffShifts.forEach(shift => {
              const sDate = moment(shift.date);
              if (sDate.isSameOrAfter(start) && sDate.isSameOrBefore(end)) {
                if (formData.selectedDays.includes(sDate.day())) {
                  const id = shift.id || shift._id;
                  if (id) idsToDelete.push(id);
                }
              }
            });
          }

          if (idsToDelete.length > 0) {
            await Promise.all(idsToDelete.map(id => deleteShift(id)));
            enqueueSnackbar(`Удалено смен: ${idsToDelete.length}`, { variant: 'success' });
          } else {
            enqueueSnackbar('Нет смен для удаления в указанном периоде', { variant: 'info' });
          }
        } else {
          // Create shifts logic
          const shiftsToCreate: any[] = [];
          const staffs = selectedStaff.length > 0 ? selectedStaff : [formData.staffId];

          if (assignmentType === 'single') {
            for (const sId of staffs) {
              const member = staffById.get(String(sId));
              shiftsToCreate.push({
                ...formData,
                staffId: sId,
                staffName: member?.fullName || '',
              });
            }
          } else {
            const start = moment(formData.startDate);
            const end = moment(formData.endDate);
            let current = start.clone();

            while (current.isSameOrBefore(end)) {
              if (formData.selectedDays.includes(current.day())) {
                for (const sId of staffs) {
                  const member = staffById.get(String(sId));
                  shiftsToCreate.push({
                    ...formData,
                    staffId: sId,
                    staffName: member?.fullName || '',
                    date: current.format('YYYY-MM-DD'),
                  });
                }
              }
              current.add(1, 'day');
            }
          }

          if (shiftsToCreate.length > 0) {
            await shiftsApi.bulkCreate(shiftsToCreate);
            enqueueSnackbar(`Создано смен: ${shiftsToCreate.length}`, { variant: 'success' });
          }
        }
      }

      const weekStart = moment(currentDate).startOf('isoWeek');
      const weekEnd = moment(currentDate).endOf('isoWeek');
      const updatedShifts = await getShifts(weekStart.format('YYYY-MM-DD'), weekEnd.format('YYYY-MM-DD'));
      setShifts(updatedShifts);
      handleCloseModal();
    } catch (err) {
      console.error('Error saving/deleting shifts:', err);
      enqueueSnackbar('Ошибка при выполнении операции', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [assignmentType, formData, selectedStaff, staffById, editingShift, assignmentAction, shifts, currentDate, enqueueSnackbar, handleCloseModal, validateForm, canManageSchedule]);

  const handleEditShift = useCallback((shift: Shift) => {
    if (!canManageSchedule) {
      enqueueSnackbar('Недостаточно прав для управления графиком', { variant: 'error' });
      return;
    }
    const sId = typeof shift.staffId === 'string' ? shift.staffId : (shift.staffId as any)?._id;
    setFormData({
      userId: sId || '',
      staffId: sId || '',
      staffName: shift.staffName || '',
      date: moment(shift.date).format('YYYY-MM-DD'),
      status: shift.status,
      notes: shift.notes || '',
      alternativeStaffId: shift.alternativeStaffId || '',
    });
    setEditingShift(shift);
    setModalOpen(true);
  }, [enqueueSnackbar, canManageSchedule]);


  const weekDays = useMemo(() => {
    const weekStart = moment(currentDate).startOf('isoWeek');
    const weekEnd = moment(currentDate).endOf('isoWeek');
    const days: Date[] = [];
    const day = weekStart.clone();
    while (day.isSameOrBefore(weekEnd)) {
      days.push(day.toDate());
      day.add(1, 'day');
    }
    return days;
  }, [currentDate]);

  const weekDaysMeta = useMemo(() => {
    return weekDays.map((date) => {
      const dateStr = moment(date).format('YYYY-MM-DD');
      const isHoliday = holidays.includes(dateStr);
      const isWorkingSat = workingSaturdays.includes(dateStr);
      const weekend = isWeekend(date) && !isWorkingSat;
      return {
        date,
        dateStr,
        isHoliday,
        weekend,
        dayName: DAY_NAMES[(date.getDay() + 6) % 7],
        dayNumber: moment(date).format('D'),
      };
    });
  }, [weekDays, holidays, workingSaturdays]);

  const handleCellClick = useCallback((staffId: string, dateStr: string) => {
    if (!canManageSchedule) {
      return;
    }
    const staffMember = staffById.get(String(staffId));
    setFormData((prev: any) => ({
      ...prev,
      staffId,
      staffName: staffMember?.fullName || '',
      date: dateStr,
    }));
    setModalOpen(true);
  }, [staffById, canManageSchedule]);

  const handleStaffToggle = useCallback((staffId: string) => {
    setSelectedStaff(prev =>
      prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
    );
  }, []);

  const handleEditShiftCallback = useCallback((shift: any) => {
    handleEditShift(shift);
  }, [handleEditShift]);

  const getShiftsForDay = useCallback((staffId: string, date: Date) => {
    const compareDate = moment(date).format('YYYY-MM-DD');
    return shifts.filter((shift) => {
      const sId = typeof shift.staffId === 'string' ? shift.staffId : (shift.staffId as any)?._id;
      const sDate = moment(shift.date).format('YYYY-MM-DD');
      return sId === staffId && sDate === compareDate;
    });
  }, [shifts]);

  // Функция для вычисления "отображаемого" статуса на основе данных посещаемости
  const getDisplayStatus = (shift: any, attendanceRecord: any): ShiftStatus => {
    if (attendanceRecord) {
      // Если есть и приход и уход - смена завершена
      if (attendanceRecord.actualStart && attendanceRecord.actualEnd) {
        const lateMin = attendanceRecord.lateMinutes || 0;
        // Если опоздание >= 15 минут, показываем как "Опоздание"
        if (lateMin >= 15) {
          return ShiftStatus.late;
        }
        return ShiftStatus.completed;
      }
      // Если есть только приход - в процессе или опоздание
      if (attendanceRecord.actualStart && !attendanceRecord.actualEnd) {
        const lateMin = attendanceRecord.lateMinutes || 0;
        if (lateMin >= 15) {
          return ShiftStatus.late;
        }
        return ShiftStatus.in_progress;
      }
    }
    // Если нет данных посещаемости - берём статус из смены
    return shift.status as ShiftStatus;
  };

  if (loading && shifts.length === 0 && staff.length === 0) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px'>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Typography color='error'>{error}</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="ru">
      <Box p={3}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography variant='h5'>График смен</Typography>
                <Box>
                  <AuditLogButton entityType="staffShift" />
                  <ExportButton
                    exportTypes={[{ value: 'staff-schedule', label: 'График смен' }]}
                    onExport={handleExport}
                  />
                  {canManageSchedule && (
                    <>
                      <Button
                        variant='contained'
                        color='primary'
                        startIcon={<AddIcon />}
                        onClick={() => setModalOpen(true)}
                        sx={{ ml: 2 }}
                      >
                        Добавить смену
                      </Button>
                      <Button
                        variant='contained'
                        color='secondary'
                        sx={{ ml: 2 }}
                        onClick={() => {
                          if (selectedStaff.length === 0) {
                            enqueueSnackbar('Пожалуйста, выберите сотрудников', { variant: 'warning' });
                            return;
                          }
                          assignFiveTwoSchedule();
                        }}
                      >
                        Назначить график 5/2
                      </Button>
                      <Button
                        variant='contained'
                        color='error'
                        sx={{ ml: 2 }}
                        startIcon={<DeleteIcon />}
                        onClick={() => {
                          setAssignmentAction('delete');
                          setModalOpen(true);
                        }}
                      >
                        Удалить смены
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            <DateNavigator viewType="week" />

            <Box display='flex' flexWrap='wrap' gap={2} alignItems='center' mb={3}>
              <TextField
                placeholder='Поиск по имени...'
                variant='outlined'
                size='small'
                value={searchTerm}
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
                      {selected.length === 0 ? 'Все должности' : selected.map((value) => (
                        <Chip
                          key={value}
                          label={value}
                          size='small'
                          onDelete={() => setFilterRole(filterRole.filter(v => v !== value))}
                          onMouseDown={(e) => e.stopPropagation()}
                        />
                      ))}
                    </Box>
                  )}
                >
                  <MenuItem value="">
                    <em>Все должности</em>
                  </MenuItem>
                  {availableRoleLabels.map((role) => (
                    <MenuItem key={role} value={role}>
                      <Checkbox checked={filterRole.indexOf(role) > -1} />
                      <ListItemText primary={role} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell align="center" sx={{ fontWeight: 'bold', width: '50px' }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      <TableSortLabel
                        active={sortConfig.key === 'fullName'}
                        direction={sortConfig.key === 'fullName' ? (sortConfig.direction || 'asc') : 'asc'}
                        onClick={() => requestSort('fullName')}
                      >
                        Сотрудник
                      </TableSortLabel>
                    </TableCell>
                    {weekDaysMeta.map((day) => (
                      <TableCell
                        key={day.dateStr}
                        align='center'
                        sx={{
                          backgroundColor: day.isHoliday ? '#ffcdd2' : (day.weekend ? 'grey.100' : 'inherit'),
                          color: day.isHoliday ? '#c62828' : 'inherit',
                        }}
                      >
                        <Box>
                          <Box>{day.dayName}</Box>
                          <Box>{day.dayNumber}</Box>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.map((staffMember, index) => (
                    <ScheduleRow
                      key={staffMember.id || staffMember._id}
                      staffMember={staffMember}
                      index={index + 1}
                      weekDaysMeta={weekDaysMeta}
                      staffShifts={shiftsByStaff.get(staffMember.id || staffMember._id || '') || []}
                      staffAttendance={attendanceByStaff.get(staffMember.id || staffMember._id || '') || []}
                      selectedStaff={selectedStaff}
                      onStaffToggle={handleStaffToggle}
                      onCellClick={handleCellClick}
                      onEditShift={handleEditShiftCallback}
                      ROLE_COLORS={ROLE_COLORS}
                      ROLE_LABELS={ROLE_LABELS}
                      canSelect={canManageSchedule}
                      canEdit={canManageSchedule}
                    />
                  ))}

                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Shift Form Modal */}
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth='md' fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>{editingShift ? 'Редактировать смену' : 'Назначить/Удалить смены'}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {!editingShift && (
                  <>
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <RadioGroup
                          row
                          value={assignmentType}
                          onChange={(e) => setAssignmentType(e.target.value as any)}
                        >
                          <FormControlLabel value="single" control={<Radio />} label="Один день" />
                          <FormControlLabel value="period" control={<Radio />} label="Период" />
                        </RadioGroup>

                        <RadioGroup
                          row
                          value={assignmentAction}
                          onChange={(e) => setAssignmentAction(e.target.value as any)}
                        >
                          <FormControlLabel value="create" control={<Radio color="primary" />} label="Назначить" />
                          <FormControlLabel value="delete" control={<Radio color="error" />} label="Удалить" />
                        </RadioGroup>
                      </Box>
                    </Grid>
                    <Divider sx={{ width: '100%', my: 1 }} />
                  </>
                )}

                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Сотрудник(и)</InputLabel>
                    <Select
                      multiple={!editingShift && selectedStaff.length > 1}
                      value={editingShift ? formData.staffId : (selectedStaff.length > 0 ? selectedStaff : (formData.staffId ? [formData.staffId] : []))}
                      onChange={(e) => {
                        if (editingShift) {
                          handleStaffSelect(e as any);
                        } else {
                          const val = e.target.value;
                          if (Array.isArray(val)) {
                            setSelectedStaff(val);
                          } else {
                            handleStaffSelect(e as any);
                            setSelectedStaff([val]);
                          }
                        }
                      }}
                      label='Сотрудник(и)'
                      required
                    >
                      {staff.map((s) => (
                        <MenuItem key={s.id || s._id} value={s.id || s._id}>
                          {s.fullName} ({ROLE_LABELS[s.role as string] || s.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {assignmentType === 'single' || editingShift ? (
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label='Дата смены'
                      inputFormat='DD.MM.YYYY'
                      value={moment(formData.date)}
                      onChange={(date) => date && handleDateChange(date.toDate())}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </Grid>
                ) : (
                  <>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label='Начало периода'
                        inputFormat='DD.MM.YYYY'
                        value={moment(formData.startDate)}
                        onChange={(date) => date && setFormData({ ...formData, startDate: date.format('YYYY-MM-DD') })}
                        renderInput={(params) => <TextField {...params} fullWidth required />}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <DatePicker
                        label='Конец периода'
                        inputFormat='DD.MM.YYYY'
                        value={moment(formData.endDate)}
                        onChange={(date) => date && setFormData({ ...formData, endDate: date.format('YYYY-MM-DD') })}
                        renderInput={(params) => <TextField {...params} fullWidth required />}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>Дни недели:</Typography>
                      <Box display="flex" flexWrap="wrap" gap={1}>
                        {[
                          { label: 'Пн', value: 1 },
                          { label: 'Вт', value: 2 },
                          { label: 'Ср', value: 3 },
                          { label: 'Чт', value: 4 },
                          { label: 'Пт', value: 5 },
                          { label: 'Сб', value: 6 },
                          { label: 'Вс', value: 0 },
                        ].map((day) => (
                          <FormControlLabel
                            key={day.value}
                            control={
                              <Checkbox
                                checked={formData.selectedDays?.includes(day.value)}
                                onChange={(e) => {
                                  const currentDays = formData.selectedDays || [];
                                  const newDays = e.target.checked
                                    ? [...currentDays, day.value]
                                    : currentDays.filter((d: number) => d !== day.value);
                                  setFormData({ ...formData, selectedDays: newDays });
                                }}
                              />
                            }
                            label={day.label}
                          />
                        ))}
                      </Box>
                    </Grid>
                  </>
                )}

                {assignmentAction === 'create' && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Статус</InputLabel>
                        <Select
                          name='status'
                          value={formData.status}
                          onChange={handleSelectChange}
                          label='Статус'
                          required
                        >
                          <MenuItem value='scheduled'>Запланирована</MenuItem>
                          <MenuItem value='completed'>Завершена</MenuItem>
                          <MenuItem value='in_progress'>В процессе</MenuItem>
                          <MenuItem value='late'>Опоздание</MenuItem>
                          <MenuItem value='absent'>Отсутствует</MenuItem>
                          <MenuItem value='vacation'>Отпуск</MenuItem>
                          <MenuItem value='sick_leave'>Больничный</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label='Заметки'
                        name='notes'
                        value={formData.notes}
                        onChange={handleInputChange}
                        multiline
                        rows={2}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Альтернативный сотрудник</InputLabel>
                        <Select name='alternativeStaffId' value={formData.alternativeStaffId || ''} onChange={handleSelectChange} label='Альтернативный сотрудник'>
                          <MenuItem value=''>Нет альтернативного сотрудника</MenuItem>
                          {staff.filter(s => s.role !== 'parent' && s.role !== 'child').map((s) => (
                            <MenuItem key={s.id || s._id} value={s.id || s._id}>{s.fullName}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {editingShift && (
                <Button
                  onClick={async () => {
                    if (!canManageSchedule) {
                      enqueueSnackbar('Недостаточно прав для управления графиком', { variant: 'error' });
                      return;
                    }
                    const id = editingShift.id || editingShift._id;
                    if (id && window.confirm('Удалить смену?')) {
                      await deleteShift(id);
                      enqueueSnackbar('Смена удалена', { variant: 'success' });
                      handleCloseModal();
                      const weekStart = moment(currentDate).startOf('isoWeek');
                      const weekEnd = moment(currentDate).endOf('isoWeek');
                      setShifts(await getShifts(weekStart.format('YYYY-MM-DD'), weekEnd.format('YYYY-MM-DD')));
                    }
                  }}
                  color="error"
                  disabled={!canManageSchedule}
                >
                  Удалить
                </Button>
              )}
              <Button onClick={handleCloseModal}>Отмена</Button>
              {canManageSchedule && (
                <Button
                  type='submit'
                  variant='contained'
                  color={assignmentAction === 'delete' ? 'error' : 'primary'}
                  disabled={loading}
                >
                  {assignmentAction === 'delete' ? 'Удалить' : (editingShift ? 'Сохранить' : 'Применить')}
                </Button>
              )}
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider >
  );
};

export default StaffSchedule;
