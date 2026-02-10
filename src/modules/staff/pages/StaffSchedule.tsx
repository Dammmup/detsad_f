import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/ru';
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
  OutlinedInput,
  InputAdornment,
  Checkbox,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';
import { Search as SearchIcon } from '@mui/icons-material';
import ExportButton from '../../../shared/components/ExportButton';
import {
  exportStaffAttendance,
} from '../../../shared/utils/excelExport';
import { useDate } from '../../../app/context/DateContext';
import DateNavigator from '../../../shared/components/DateNavigator';


import {
  Shift,
  ShiftStatus,
  ShiftFormData,
  STATUS_TEXT,
  STATUS_COLORS,
} from '../../../shared/types/common';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} from '../services/shifts';
import { getUsers } from '../services/users';
import { User } from '../../../shared/types/common';
import { KindergartenSettings } from '../../settings/services/settings';
import { getKindergartenSettings } from '../../settings/services/settings';
import { getHolidays } from '../../../shared/services/common';
import { staffAttendanceTrackingService, StaffAttendanceRecord } from '../services/staffAttendanceTracking';




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

const DAY_NAMES = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];




const StaffSchedule: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentDate } = useDate();

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


  const [staff, setStaff] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);


  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [holidays, setHolidays] = useState<string[]>([]);
  const [workingSaturdays, setWorkingSaturdays] = useState<string[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteStartDate, setDeleteStartDate] = useState<moment.Moment | null>(null);
  const [deleteEndDate, setDeleteEndDate] = useState<moment.Moment | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<'selected' | 'all'>('all');

  // Bulk Delete Functions
  const handleBulkDelete = async () => {
    if (!deleteStartDate || !deleteEndDate) {
      enqueueSnackbar('Выберите диапазон дат', { variant: 'error' });
      return;
    }

    const startDateStr = deleteStartDate.format('YYYY-MM-DD');
    const endDateStr = deleteEndDate.format('YYYY-MM-DD');

    try {
      setLoading(true);
      const targetStaffIds = deleteTarget === 'selected' ? selectedStaff : [];

      // Предполагаем наличие API для массового удаления, либо удаляем по одному
      // В данном проекте обычно используется deleteShift по ID
      // Но для массового удаления лучше иметь отдельный метод в сервисе
      const shiftsToDelete = shifts.filter(s => {
        const sDate = moment(s.date).format('YYYY-MM-DD');
        const sId = typeof s.staffId === 'string' ? s.staffId : (s.staffId as any)?._id;
        const inDateRange = sDate >= startDateStr && sDate <= endDateStr;
        const isTarget = deleteTarget === 'all' || targetStaffIds.includes(sId);
        return inDateRange && isTarget;
      });

      if (shiftsToDelete.length === 0) {
        enqueueSnackbar('Смены для удаления не найдены', { variant: 'info' });
        return;
      }

      await Promise.all(shiftsToDelete.map(s => deleteShift(s.id || s._id || '')));

      enqueueSnackbar(`Удалено смен: ${shiftsToDelete.length}`, { variant: 'success' });

      // Refresh data
      const weekStart = moment(currentDate).startOf('isoWeek');
      const weekEnd = moment(currentDate).endOf('isoWeek');
      const updatedShifts = await getShifts(weekStart.format('YYYY-MM-DD'), weekEnd.format('YYYY-MM-DD'));
      setShifts(updatedShifts);

      setDeleteDialogOpen(false);
    } catch (err) {
      console.error('Error in bulk delete:', err);
      enqueueSnackbar('Ошибка при удалении смен', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportFullMonth = async () => {
    const monthStart = moment(currentDate).startOf('month');
    const monthEnd = moment(currentDate).endOf('month');
    const period = `${monthStart.format('DD.MM.YYYY')} - ${monthEnd.format('DD.MM.YYYY')}`;

    try {
      setLoading(true);
      const shiftsForMonth = await getShifts(
        monthStart.format('YYYY-MM-DD'),
        monthEnd.format('YYYY-MM-DD'),
      );
      await exportStaffAttendance(shiftsForMonth, period);
      enqueueSnackbar('Отчет за месяц экспортирован', { variant: 'success' });
    } catch (e: any) {
      console.error('Error exporting staff schedule:', e);
      enqueueSnackbar('Ошибка при экспорте', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (exportType: string, exportFormat: 'excel') => {
    handleExportFullMonth();
  };

  const [formData, setFormData] = useState<ShiftFormData>({
    userId: '',
    staffId: '',
    staffName: '',
    date: moment().format('YYYY-MM-DD'),
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

        const [staffData, shiftsData, attendanceData] = await Promise.all([
          getUsers(),
          getShifts(startDate, endDate),
          staffAttendanceTrackingService.getAllRecords({ startDate, endDate })
        ]);

        setStaff(staffData);
        setShifts(shiftsData);
        setAttendanceRecords(attendanceData.data || []);

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

  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };

  const isWeekend = (date: Date): boolean => {
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const assignFiveTwoSchedule = async () => {
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

      for (const staffId of selectedStaff) {
        const existingShifts = await getShifts(
          monthStart.format('YYYY-MM-DD'),
          monthEnd.format('YYYY-MM-DD'),
        );
        const existingShiftDates = new Set(
          existingShifts
            .filter((shift) => (shift.staffId as any)?._id === staffId || shift.staffId === staffId)
            .map((shift) => shift.date),
        );

        for (const date of workDays) {
          const dateStr = moment(date).format('YYYY-MM-DD');
          if (existingShiftDates.has(dateStr)) continue;

          try {
            await createShift({
              userId: staffId,
              staffId: staffId,
              staffName: staff.find((s) => (s.id || s._id) === staffId)?.fullName || '',
              date: dateStr,
              notes: 'Рабочий день по графику 5/2',
              status: ShiftStatus.scheduled,
            });
          } catch (error: any) {
            console.error('Error creating shift:', error);
          }
        }
      }

      enqueueSnackbar('График 5/2 успешно назначен', { variant: 'success' });
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({ ...prev, date: moment(date).format('YYYY-MM-DD') }));
    }
  };

  const handleStaffSelect = (e: SelectChangeEvent<string>) => {
    const staffId = e.target.value;
    const selectedS = staff.find((s) => (s.id || s._id) === staffId);
    setFormData((prev) => ({
      ...prev,
      staffId,
      staffName: selectedS?.fullName || '',
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.staffId) {
      enqueueSnackbar('Выберите сотрудника', { variant: 'error' });
      return false;
    }
    if (!formData.date) {
      enqueueSnackbar('Укажите дату смены', { variant: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      const shiftData: Partial<Shift> = {
        userId: formData.staffId,
        staffId: formData.staffId,
        staffName: formData.staffName,
        date: formData.date,
        notes: formData.notes,
        status: formData.status,
      };

      if (editingShift) {
        const id = editingShift.id || editingShift._id;
        if (id) {
          await updateShift(id, { ...shiftData, alternativeStaffId: formData.alternativeStaffId });
          enqueueSnackbar('Смена успешно обновлена', { variant: 'success' });
        }
      } else {
        await createShift({ ...shiftData as any, alternativeStaffId: formData.alternativeStaffId });
        enqueueSnackbar('Смена успешно создана', { variant: 'success' });
      }

      const weekStart = moment(currentDate).startOf('isoWeek');
      const weekEnd = moment(currentDate).endOf('isoWeek');
      const shiftsData = await getShifts(weekStart.format('YYYY-MM-DD'), weekEnd.format('YYYY-MM-DD'));
      setShifts(shiftsData);
      handleCloseModal();
    } catch (err) {
      console.error('Error saving shift:', err);
      enqueueSnackbar('Ошибка при сохранении смены', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEditShift = (shift: Shift) => {
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
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingShift(null);
    setFormData({
      userId: '',
      staffId: '',
      staffName: '',
      date: moment().format('YYYY-MM-DD'),
      status: ShiftStatus.scheduled,
      notes: '',
      alternativeStaffId: '',
    });
  };

  const weekStart = moment(currentDate).startOf('isoWeek');
  const weekEnd = moment(currentDate).endOf('isoWeek');
  const weekDays: Date[] = [];
  const day = weekStart.clone();
  while (day.isSameOrBefore(weekEnd)) {
    weekDays.push(day.toDate());
    day.add(1, 'day');
  }

  const getShiftsForDay = (staffId: string, date: Date) => {
    const compareDate = moment(date).format('YYYY-MM-DD');
    return shifts.filter((shift) => {
      const sId = typeof shift.staffId === 'string' ? shift.staffId : (shift.staffId as any)?._id;
      const sDate = moment(shift.date).format('YYYY-MM-DD');
      return sId === staffId && sDate === compareDate;
    });
  };

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

  const filteredStaff = staff.filter((s) => {
    const matchesSearch = !searchTerm || s.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const roleLabel = ROLE_LABELS[s.role as string] || s.role;
    const matchesRole = filterRole.length === 0 || filterRole.includes(roleLabel);
    return matchesSearch && matchesRole && s.active;
  });

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="ru">
      <Box p={3}>
        <Card>
          <CardHeader
            title={
              <Box display='flex' justifyContent='space-between' alignItems='center'>
                <Typography variant='h5'>График смен</Typography>
                <Box>
                  <ExportButton
                    exportTypes={[{ value: 'staff-schedule', label: 'График смен' }]}
                    onExport={handleExport}
                  />
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
                      setDeleteStartDate(moment(currentDate).startOf('isoWeek'));
                      setDeleteEndDate(moment(currentDate).endOf('isoWeek'));
                      setDeleteTarget(selectedStaff.length > 0 ? 'selected' : 'all');
                      setDeleteDialogOpen(true);
                    }}
                  >
                    Удалить смены
                  </Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
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
                      {selected.map((value) => (
                        <Chip key={value} label={value} size='small' />
                      ))}
                    </Box>
                  )}
                >
                  {Object.values(ROLE_LABELS).sort().map((role) => (
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
                    <TableCell>Сотрудник</TableCell>
                    {weekDays.map((day) => {
                      const dateStr = moment(day).format('YYYY-MM-DD');
                      const holiday = holidays.includes(dateStr);
                      const workingSat = workingSaturdays.includes(dateStr);
                      const weekend = isWeekend(day) && !workingSat;
                      return (
                        <TableCell
                          key={day.toString()}
                          align='center'
                          sx={{
                            backgroundColor: holiday ? '#ffcdd2' : (weekend ? 'grey.100' : 'inherit'),
                            color: holiday ? '#c62828' : 'inherit',
                          }}
                        >
                          <Box>
                            <Box>{DAY_NAMES[day.getDay()]}</Box>
                            <Box>{moment(day).format('D')}</Box>
                          </Box>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.map((staffMember) => {
                    const staffId = staffMember.id || staffMember._id;
                    if (!staffId) return null;
                    const isSelected = selectedStaff.includes(staffId);
                    return (
                      <TableRow key={staffId} sx={{ backgroundColor: isSelected ? 'action.selected' : 'inherit' }}>
                        <TableCell>
                          <Box
                            display='flex'
                            alignItems='center'
                            sx={{ cursor: 'pointer' }}
                            onClick={() => {
                              setSelectedStaff(prev =>
                                prev.includes(staffId) ? prev.filter(id => id !== staffId) : [...prev, staffId]
                              );
                            }}
                          >
                            <Checkbox size='small' checked={isSelected} />
                            <Box>
                              <Typography variant='body2' fontWeight='bold'>{staffMember.fullName}</Typography>
                              <Typography variant='caption' sx={{ color: ROLE_COLORS[staffMember.role as string] || '#9e9e9e' }}>
                                {ROLE_LABELS[staffMember.role as string] || staffMember.role}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        {weekDays.map((date) => {
                          const dayShifts = getShiftsForDay(staffId, date);
                          const dateStr = moment(date).format('YYYY-MM-DD');
                          const recordsForDay = attendanceRecords.filter(r => {
                            const rId = r.staffId?._id || r.staffId;
                            return rId === staffId && moment(r.date).format('YYYY-MM-DD') === dateStr;
                          });
                          const isHoliday = holidays.includes(dateStr);
                          const isWorkingSat = workingSaturdays.includes(dateStr);
                          const weekend = isWeekend(date) && !isWorkingSat;

                          return (
                            <TableCell
                              key={date.toString()}
                              align='center'
                              sx={{
                                p: 1,
                                backgroundColor: isHoliday ? '#ffebee' : (weekend ? '#f5f5f5' : 'inherit'),
                                border: '1px solid #e0e0e0',
                                width: '120px',
                                minHeight: '80px',
                                cursor: 'pointer',
                                '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                              }}
                              onClick={() => {
                                setFormData({
                                  ...formData,
                                  staffId,
                                  staffName: staffMember.fullName,
                                  date: dateStr,
                                });
                                setModalOpen(true);
                              }}
                            >
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {dayShifts.map((shift) => {
                                  // Находим соответствующую запись посещаемости для этой смены
                                  const attendanceRecord = recordsForDay.find(r => {
                                    const rId = r.staffId?._id || r.staffId;
                                    return rId === staffId;
                                  });
                                  const displayStatus = getDisplayStatus(shift, attendanceRecord);
                                  return (
                                    <Chip
                                      key={shift.id || shift._id}
                                      label={STATUS_TEXT[displayStatus] || displayStatus}
                                      size='small'
                                      color={STATUS_COLORS[displayStatus] || 'default'}
                                      sx={{ fontSize: '0.65rem' }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditShift(shift);
                                      }}
                                    />
                                  );
                                })}
                                {recordsForDay.map((record) => (
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
                        })}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Shift Form Modal */}
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth='sm' fullWidth>
          <form onSubmit={handleSubmit}>
            <DialogTitle>{editingShift ? 'Редактировать смену' : 'Добавить новую смену'}</DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Сотрудник</InputLabel>
                    <Select value={formData.staffId} onChange={handleStaffSelect} label='Сотрудник' required>
                      {staff.map((s) => (
                        <MenuItem key={s.id || s._id} value={s.id || s._id}>
                          {s.fullName} ({ROLE_LABELS[s.role as string] || s.role})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <DatePicker
                    label='Дата смены'
                    value={moment(formData.date)}
                    onChange={(date) => handleDateChange(date ? date.toDate() : null)}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Статус</InputLabel>
                    <Select name='status' value={formData.status} onChange={handleSelectChange} label='Статус' required>
                      <MenuItem value='scheduled'>Запланирована</MenuItem>
                      <MenuItem value='completed'>Завершена</MenuItem>
                      <MenuItem value='in_progress'>В процессе</MenuItem>
                      <MenuItem value='late'>Опоздание</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField label='Примечания' name='notes' value={formData.notes} onChange={handleInputChange} fullWidth multiline rows={2} />
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
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {editingShift && (
                <Button
                  onClick={async () => {
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
                >
                  Удалить
                </Button>
              )}
              <Button onClick={handleCloseModal}>Отмена</Button>
              <Button type='submit' variant='contained' color='primary' disabled={loading}>
                {editingShift ? 'Сохранить' : 'Добавить'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Delete Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Удаление смен</DialogTitle>
          <DialogContent>
            <Box pt={1} display="flex" flexDirection="column" gap={2}>
              <FormControl>
                <RadioGroup value={deleteTarget} onChange={(e) => setDeleteTarget(e.target.value as any)}>
                  <FormControlLabel value="selected" control={<Radio />} label="Выбранные сотрудники" disabled={selectedStaff.length === 0} />
                  <FormControlLabel value="all" control={<Radio />} label="Все сотрудники" />
                </RadioGroup>
              </FormControl>
              <Box display="flex" gap={2}>
                <DatePicker label="С" value={deleteStartDate} onChange={setDeleteStartDate} renderInput={(p) => <TextField {...p} size='small' />} />
                <DatePicker label="По" value={deleteEndDate} onChange={setDeleteEndDate} renderInput={(p) => <TextField {...p} size='small' />} />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleBulkDelete} color="error" variant="contained">Удалить</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider >
  );
};

export default StaffSchedule;
