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
import ExportButton from '../../components/ExportButton';
import {
  exportStaffAttendance,
} from '../../utils/excelExport';
import { useDate } from '../../components/context/DateContext';
import DateNavigator from '../../components/DateNavigator';


import {
  Shift,
  ShiftStatus,
  ShiftFormData,
  STATUS_TEXT,
  STATUS_COLORS,
} from '../../types/common';
import {
  getShifts,
  createShift,
  updateShift,
  deleteShift,
} from '../../services/shifts';
import { getUsers } from '../../services/users';
import { User } from '../../types/common';
import { KindergartenSettings } from '../../services/settings';
import { getHolidays } from '../../services/common';




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


  const [staff, setStaff] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);


  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [holidays, setHolidays] = useState<string[]>([]);

  // Bulk Delete State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'selected' | 'all'>('selected');
  const [deleteStartDate, setDeleteStartDate] = useState<moment.Moment | null>(moment());
  const [deleteEndDate, setDeleteEndDate] = useState<moment.Moment | null>(moment());

  const handleBulkDelete = async () => {
    if (!deleteStartDate || !deleteEndDate) {
      enqueueSnackbar('Выберите период', { variant: 'warning' });
      return;
    }

    setLoading(true);
    try {
      // Prepare date range
      const start = deleteStartDate.format('YYYY-MM-DD');
      const end = deleteEndDate.format('YYYY-MM-DD');

      // Filter shifts
      const shiftsToDelete = shifts.filter(shift => {
        const shiftDate = shift.date.split('T')[0];
        const inRange = shiftDate >= start && shiftDate <= end;

        if (!inRange) return false;

        if (deleteTarget === 'selected') {
          const sId = typeof shift.staffId === 'string' ? shift.staffId : (shift.staffId as any)._id;
          return selectedStaff.includes(sId);
        }

        return true; // 'all'
      });

      const idsToDelete = shiftsToDelete.map(s => s.id || s._id);

      if (idsToDelete.length === 0) {
        enqueueSnackbar('Смены для удаления не найдены', { variant: 'info' });
        setLoading(false);
        return;
      }

      if (!window.confirm(`Будет удалено ${idsToDelete.length} смен. Продолжить?`)) {
        setLoading(false);
        return;
      }

      // Dynamic import to avoid circular dependencies if any, good practice from previous code
      const { shiftsApi } = await import('../../services/shifts');
      await shiftsApi.bulkDelete(idsToDelete);

      enqueueSnackbar(`Удалено ${idsToDelete.length} смен`, { variant: 'success' });

      // Refresh
      const monthStart = moment(currentDate).startOf('month');
      const monthEnd = moment(currentDate).endOf('month');
      const newData = await getShifts(monthStart.format('YYYY-MM-DD'), monthEnd.format('YYYY-MM-DD'));
      setShifts(newData);

      setDeleteDialogOpen(false);
    } catch (e) {
      console.error(e);
      enqueueSnackbar('Ошибка при удалении', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (
    exportType: string,
    exportFormat: 'pdf' | 'excel' | 'csv',
  ) => {
    const monthStart = moment(currentDate).startOf('month');
    const monthEnd = moment(currentDate).endOf('month');
    const period = `${monthStart.format('DD.MM.YYYY')} - ${monthEnd.format('DD.MM.YYYY')}`;


    const shiftsForMonth = await getShifts(
      monthStart.format('YYYY-MM-DD'),
      monthEnd.format('YYYY-MM-DD'),
    );

    try {
      await exportStaffAttendance(shiftsForMonth, period);
      enqueueSnackbar('Отчет экспортирован', { variant: 'success' });
    } catch (e: any) {
      console.error('Error exporting staff schedule:', e);
      enqueueSnackbar('Ошибка при экспорте', { variant: 'error' });
    }
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
        const monthStart = moment(currentDate).startOf('month');
        const monthEnd = moment(currentDate).endOf('month');
        const [staffData, shiftsData] = await Promise.all([
          getUsers(),
          getShifts(
            monthStart.format('YYYY-MM-DD'),
            monthEnd.format('YYYY-MM-DD'),
          ),
        ]);

        setStaff(staffData);
        setShifts(shiftsData);

        try {
          const hData = await getHolidays();
          if (hData && hData.holidays) {
            setHolidays(hData.holidays);
          }
        } catch (hErr) {
          console.error("Error fetching holidays:", hErr);
          // Don't block UI if holidays fail
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
    console.log('assignFiveTwoSchedule called');
    try {
      setLoading(true);
      console.log('Loading set to true');


      const monthStart = moment(currentDate).startOf('month');
      const monthEnd = moment(currentDate).endOf('month');
      console.log('Current date:', currentDate, 'End of month:', monthEnd);


      const dates = [];
      let current = monthStart.clone();
      while (current.isSameOrBefore(monthEnd)) {
        dates.push(current.toDate());
        current.add(1, 'day');
      }
      console.log('Dates array created, length:', dates.length);


      const workDays = dates.filter((date) => {
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6;
      });
      console.log('Work days filtered, length:', workDays.length);


      const scheduleBlocks = workDays;
      console.log('Schedule blocks created, length:', scheduleBlocks.length);


      const finalSchedule = scheduleBlocks.filter((date) => moment(date).isSameOrBefore(monthEnd));
      console.log('Final schedule filtered, length:', finalSchedule.length);

      console.log('Selected staff:', selectedStaff);


      for (const staffId of selectedStaff) {
        console.log('Creating shifts for staff:', staffId);


        const existingShifts = await getShifts(
          monthStart.format('YYYY-MM-DD'),
          monthEnd.format('YYYY-MM-DD'),
        );
        const existingShiftDates = new Set(
          existingShifts
            .filter((shift) => shift.staffId === staffId)
            .map((shift) => shift.date),
        );


        const createdShiftDates = new Set<string>();

        for (const date of finalSchedule) {
          const dateStr = moment(date).format('YYYY-MM-DD');


          if (
            existingShiftDates.has(dateStr) ||
            createdShiftDates.has(dateStr)
          ) {
            console.log('Skipping existing shift for', staffId, 'on', dateStr);
            continue;
          }

          try {


            console.log('Creating full shift for', staffId, 'on', date);
            await createShift({
              userId: staffId,
              staffId: staffId,
              staffName:
                staff.find((s) => (s.id || s._id) === staffId)?.fullName || '',
              date: dateStr,
              notes: 'Рабочий день по графику 5/2',
              status: ShiftStatus.scheduled,
            });


            createdShiftDates.add(dateStr);
          } catch (error: any) {

            const errorMessage =
              error.response?.data?.error ||
              error.message ||
              error.response?.data;
            if (
              errorMessage &&
              typeof errorMessage === 'string' &&
              errorMessage.includes('У сотрудника уже есть смена в этот день')
            ) {
              console.log(
                'Skipping duplicate shift for',
                staffId,
                'on',
                dateStr,
              );

              existingShiftDates.add(dateStr);
              continue;
            } else {
              console.error(
                'Error creating shift for',
                staffId,
                'on',
                dateStr,
                ':',
                error,
              );

              continue;
            }
          }
        }
      }

      enqueueSnackbar('График 5/2 успешно назначен', { variant: 'success' });


      const monthStartUpdated = moment(currentDate).startOf('month');
      const monthEndUpdated = moment(currentDate).endOf('month');
      const shiftsData = await getShifts(
        monthStartUpdated.format('YYYY-MM-DD'),
        monthEndUpdated.format('YYYY-MM-DD'),
      );
      setShifts(shiftsData);


      setSelectedStaff([]);
    } catch (err: any) {
      console.error('Error assigning 5/2 schedule:', err);
      enqueueSnackbar('Ошибка при назначении графика 5/2', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };





  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData((prev) => ({
        ...prev,
        date: moment(date).format('YYYY-MM-DD'),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        date: '',
      }));
    }
  };

  const handleStaffSelect = (e: SelectChangeEvent<string>) => {
    const staffId = e.target.value;
    const selectedStaff = staff.find((s) => (s.id || s._id) === staffId);
    setFormData((prev) => ({
      ...prev,
      staffId,
      staffName: selectedStaff?.fullName || '',
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
      const shiftData: Shift = {
        _id: editingShift?._id || '',
        id: editingShift?.id || '',
        userId: formData.staffId || '',
        staffId: formData.staffId || '',
        staffName: formData.staffName || '',
        date: formData.date,
        notes: formData.notes || '',
        status: formData.status || ShiftStatus.scheduled,
        createdAt: editingShift?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (editingShift) {

        if (editingShift.id) {

          const updatedShift = await updateShift(editingShift.id, {
            ...shiftData,
            alternativeStaffId: formData.alternativeStaffId,
          });
          setShifts((prev) =>
            prev.map((s) => (s.id === editingShift.id ? updatedShift : s)),
          );
          enqueueSnackbar('Смена успешно обновлена', { variant: 'success' });
        } else {
          enqueueSnackbar('Ошибка: ID смены не определен', {
            variant: 'error',
          });
        }
      } else {

        const newShift = await createShift({
          ...shiftData as any,
          alternativeStaffId: formData.alternativeStaffId as any,
        });
        setShifts((prev) => [...prev, newShift]);
        enqueueSnackbar('Смена успешно создана', { variant: 'success' });
      }


      const monthStart = moment(currentDate).startOf('month');
      const monthEnd = moment(currentDate).endOf('month');
      const shiftsData = await getShifts(
        monthStart.format('YYYY-MM-DD'),
        monthEnd.format('YYYY-MM-DD'),
      );
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
    setFormData({
      userId: (shift.staffId as any)?._id || shift.staffId || '',
      staffId: (shift.staffId as any)?._id || shift.staffId || '',
      staffName: shift.staffName || '',
      date: shift.date,
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
      status: 'scheduled' as ShiftStatus,
      notes: '',
      alternativeStaffId: '',
    });
  };


  const monthStart = moment(currentDate).startOf('month');
  const monthEnd = moment(currentDate).endOf('month');
  const monthDays: Date[] = [];
  const day = monthStart.clone();
  while (day.isSameOrBefore(monthEnd)) {
    monthDays.push(day.toDate());
    day.add(1, 'day');
  }


  const getShiftsForDay = (staffId: string, date: Date) => {
    return shifts.filter((shift) => {

      if (!shift.staffId) return false;

      if (typeof shift.staffId === 'string') {

        const shiftDate = shift.date.split('T')[0];
        const compareDate = moment(date).format('YYYY-MM-DD');
        return shift.staffId === staffId && shiftDate === compareDate;
      } else {

        const shiftDate = shift.date.split('T')[0];
        const compareDate = moment(date).format('YYYY-MM-DD');
        return (
          (shift.staffId as any)._id === staffId && shiftDate === compareDate
        );
      }
    });
  };


  if (loading && shifts.length === 0) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='200px'
      >
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
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
              >
                <Typography variant='h5'>График смен</Typography>
                <Box>
                  <ExportButton
                    exportTypes={[
                      { value: 'staff-schedule', label: 'График смен' },
                    ]}
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
                      console.log('5/2 button clicked');
                      console.log(
                        'Selected staff length:',
                        selectedStaff.length,
                      );
                      console.log('Selected staff:', selectedStaff);

                      if (selectedStaff.length === 0) {
                        console.log('No staff selected');
                        enqueueSnackbar('Пожалуйста, выберите сотрудников', {
                          variant: 'warning',
                        });
                        return;
                      }
                      console.log('Calling assignFiveTwoSchedule');
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
                      // Initialize dates to current selection context or current month view if needed
                      // For simplicity, default to current day or current month start/end
                      setDeleteStartDate(moment(currentDate));
                      setDeleteEndDate(moment(currentDate));
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
            {/* Month Navigation */}
            <DateNavigator />

            {/* Фильтры */}
            <Box
              display='flex'
              flexWrap='wrap'
              gap={2}
              alignItems='center'
              mb={3}
            >
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
                <InputLabel id='role-filter-label'>
                  Фильтр по должности
                </InputLabel>
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
                  {Object.values(ROLE_LABELS)
                    .sort()
                    .map((role) => (
                      <MenuItem key={role} value={role}>
                        <Checkbox checked={filterRole.indexOf(role) > -1} />
                        <ListItemText primary={role} />
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Box>

            {/* Schedule Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Сотрудник</TableCell>
                    {monthDays.map((day) => {
                      return (
                        <TableCell
                          key={day.toString()}
                          align='center'
                          sx={{
                            backgroundColor:
                              holidays.includes(moment(day).format('YYYY-MM-DD')) ? '#ffcdd2' : // Red 100
                                isWeekend(day)
                                  ? 'grey.100'
                                  : 'inherit',
                            color: holidays.includes(moment(day).format('YYYY-MM-DD')) ? '#c62828' : 'inherit', // Red 800
                            border: holidays.includes(moment(day).format('YYYY-MM-DD')) ? '1px solid #e57373' : undefined
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
                  {staff
                    .filter((staffMember) => {

                      const matchesSearch =
                        !searchTerm ||
                        staffMember.fullName
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase());


                      const roleLabel =
                        ROLE_LABELS[staffMember.role as string] ||
                        staffMember.role;
                      const matchesRole =
                        filterRole.length === 0 ||
                        filterRole.includes(roleLabel);


                      return matchesSearch && matchesRole && staffMember.active;
                    })
                    .map((staffMember) => {
                      const staffId = staffMember.id || staffMember._id;
                      if (!staffId) return null;
                      const isSelected = selectedStaff.includes(staffId);
                      return (
                        <TableRow
                          key={staffMember.id}
                          sx={{
                            backgroundColor: isSelected
                              ? 'action.selected'
                              : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <TableCell
                            onClick={() => {
                              console.log(
                                'Staff cell clicked, staffId:',
                                staffId,
                              );
                              if (selectedStaff.includes(staffId)) {
                                console.log('Removing staff from selection');
                                const newSelectedStaff = selectedStaff.filter(
                                  (id) => id !== staffId,
                                );
                                setSelectedStaff(newSelectedStaff);
                                console.log(
                                  'Selected staff after removal:',
                                  newSelectedStaff,
                                );
                              } else {
                                console.log('Adding staff to selection');
                                const newSelectedStaff = [
                                  ...selectedStaff,
                                  staffId,
                                ];
                                setSelectedStaff(newSelectedStaff);
                                console.log(
                                  'Selected staff after addition:',
                                  newSelectedStaff,
                                );
                              }
                            }}
                            sx={{
                              cursor: 'pointer',
                              userSelect: 'none',
                            }}
                          >
                            <Box display='flex' alignItems='center'>
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor:
                                    ROLE_COLORS[staffMember.role as string] ||
                                    '#9e9e9e',
                                  mr: 1,
                                }}
                              />
                              <Box>
                                {staffMember.fullName}
                                <Box
                                  sx={{
                                    fontSize: '0.8em',
                                    color: 'text.secondary',
                                  }}
                                >
                                  {ROLE_LABELS[staffMember.role as string] ||
                                    staffMember.role}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          {monthDays.map((day) => {
                            const dayShifts = getShiftsForDay(staffId, day);
                            return (
                              <TableCell
                                key={day.toString()}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    staffId: staffId,
                                    staffName: staffMember.fullName,
                                    date: moment(day).format('YYYY-MM-DD'),
                                  });
                                  setModalOpen(true);
                                }}
                                sx={{
                                  minHeight: '100px',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  backgroundColor:
                                    holidays.includes(moment(day).format('YYYY-MM-DD')) ? '#ffcdd2' :
                                      isWeekend(day)
                                        ? 'grey.100'
                                        : 'inherit',
                                  '&:hover': {
                                    backgroundColor:
                                      holidays.includes(moment(day).format('YYYY-MM-DD')) ? '#e57373' :
                                        isWeekend(day)
                                          ? 'grey.200'
                                          : 'action.hover',
                                    cursor: 'pointer',
                                  },
                                }}
                              >
                                {dayShifts.map((shift) => (
                                  <Box
                                    key={shift.id}
                                    sx={{
                                      p: 1,
                                      mb: 1,
                                      borderRadius: 1,
                                      bgcolor: 'background.paper',
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                      '&:hover': {
                                        bgcolor: 'action.selected',
                                      },
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditShift(shift);
                                    }}
                                  >

                                    <Box mt={0.5}>
                                      <Chip
                                        label={
                                          STATUS_TEXT[
                                          shift.status as keyof typeof STATUS_TEXT
                                          ] || shift.status
                                        }
                                        size='small'
                                        color={
                                          STATUS_COLORS[
                                          shift.status as keyof typeof STATUS_COLORS
                                          ] || 'default'
                                        }
                                      />
                                    </Box>
                                  </Box>
                                ))
                                }
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
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth='sm'
          fullWidth
        >
          <form onSubmit={handleSubmit}>
            <DialogTitle>
              {editingShift ? 'Редактировать смену' : 'Добавить новую смену'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel>Сотрудник</InputLabel>
                    <Select
                      name='staffId'
                      value={formData.staffId}
                      onChange={handleStaffSelect}
                      label='Сотрудник'
                      required
                    >
                      {staff.map((staffMember) => (
                        <MenuItem key={staffMember.id} value={staffMember.id}>
                          <Box display='flex' alignItems='center'>
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor:
                                  ROLE_COLORS[staffMember.role as string] ||
                                  '#9e9e9e',
                                mr: 1,
                              }}
                            />
                            <Box>
                              {staffMember.fullName}
                              <Box
                                sx={{
                                  fontSize: '0.8em',
                                  color: 'text.secondary',
                                }}
                              >
                                {ROLE_LABELS[staffMember.role as string] ||
                                  staffMember.role}
                              </Box>
                            </Box>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <LocalizationProvider
                      dateAdapter={AdapterMoment}
                      adapterLocale="ru"
                    >
                      <DatePicker
                        label='Дата смены'
                        value={formData.date ? new Date(formData.date) : null}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth required />
                        )}
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>


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
                      <MenuItem value='pending_approval'>
                        Ожидает подтверждения
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Альтернативный сотрудник</InputLabel>
                    <Select
                      name='alternativeStaffId'
                      value={formData.alternativeStaffId || ''}
                      onChange={handleSelectChange}
                      label='Альтернативный сотрудник'
                    >
                      <MenuItem value=''>
                        Нет альтернативного сотрудника
                      </MenuItem>
                      {staff
                        .filter(
                          (s) => s.role !== 'parent' && s.role !== 'child',
                        )
                        .map((staffMember) => (
                          <MenuItem
                            key={staffMember.id}
                            value={staffMember.id || staffMember._id}
                          >
                            <Box display='flex' alignItems='center'>
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor:
                                    ROLE_COLORS[staffMember.role as string] ||
                                    '#9e9e9e',
                                  mr: 1,
                                }}
                              />
                              <Box>
                                {staffMember.fullName}
                                <Box
                                  sx={{
                                    fontSize: '0.8em',
                                    color: 'text.secondary',
                                  }}
                                >
                                  {ROLE_LABELS[staffMember.role as string] ||
                                    staffMember.role}
                                </Box>
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label='Примечания'
                    name='notes'
                    value={formData.notes}
                    onChange={handleInputChange}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {editingShift && editingShift.id && (
                <Button
                  onClick={async () => {
                    if (window.confirm('Вы уверены, что хотите удалить эту смену?')) {
                      try {
                        await deleteShift(editingShift.id!);
                        enqueueSnackbar('Смена удалена', { variant: 'success' });
                        const monthStart = moment(currentDate).startOf('month');
                        const monthEnd = moment(currentDate).endOf('month');
                        const shiftsData = await getShifts(
                          monthStart.format('YYYY-MM-DD'),
                          monthEnd.format('YYYY-MM-DD'),
                        );
                        setShifts(shiftsData);
                        handleCloseModal();
                      } catch (e) {
                        console.error(e);
                        enqueueSnackbar('Ошибка при удалении', { variant: 'error' });
                      }
                    }
                  }}
                  color="error"
                >
                  Удалить
                </Button>
              )}
              {editingShift && editingShift.status !== 'scheduled' && (
                // Only show for existing shifts perhaps? Or just always if staff is known.
                // Actually, editingShift always exists in this context.
                <Button
                  onClick={() => {
                    if (editingShift.staffId) {
                      const sId = typeof editingShift.staffId === 'string' ? editingShift.staffId : (editingShift.staffId as any)._id;
                      setSelectedStaff([sId]);
                      setDeleteTarget('selected');
                      setDeleteStartDate(moment(currentDate));
                      setDeleteEndDate(moment(currentDate)); // or end of month? default is fine
                      setDeleteDialogOpen(true);
                      setModalOpen(false);
                    }
                  }}
                  color="warning"
                >
                  Удалить за период
                </Button>
              )}
              <Button onClick={handleCloseModal} color='primary'>
                Отмена
              </Button>
              <Button
                type='submit'
                variant='contained'
                color='primary'
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {editingShift ? 'Сохранить изменения' : 'Добавить смену'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Удаление смен</DialogTitle>
          <DialogContent>
            <Box pt={1} display="flex" flexDirection="column" gap={2}>
              <FormControl>
                <RadioGroup
                  value={deleteTarget}
                  onChange={(e) => setDeleteTarget(e.target.value as 'selected' | 'all')}
                >
                  <FormControlLabel
                    value="selected"
                    control={<Radio />}
                    label={`Только выбранные сотрудники (${selectedStaff.length})`}
                    disabled={selectedStaff.length === 0}
                  />
                  <FormControlLabel value="all" control={<Radio />} label="Все сотрудники" />
                </RadioGroup>
              </FormControl>

              <Box display="flex" gap={2} mt={2}>
                <DatePicker
                  label="С даты"
                  value={deleteStartDate}
                  onChange={(newValue: moment.Moment | null) => setDeleteStartDate(newValue)}
                  renderInput={(params: any) => <TextField {...params} size='small' />}
                />
                <DatePicker
                  label="По дату"
                  value={deleteEndDate}
                  onChange={(newValue: moment.Moment | null) => setDeleteEndDate(newValue)}
                  renderInput={(params: any) => <TextField {...params} size='small' />}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleBulkDelete} color="error" variant="contained">
              Удалить
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StaffSchedule;
