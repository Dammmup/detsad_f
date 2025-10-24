import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays} from 'date-fns';
import { ru } from 'date-fns/locale';
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
 IconButton,
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
  ListItemText
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Search as SearchIcon } from '@mui/icons-material';

// Types and Services
import { Shift, ShiftStatus, ShiftFormData } from '../../types/common';
import { getShifts, createShift, updateShift } from '../../services/shifts';
import { getUsers } from '../../services/users';
import {User} from '../../types/common';

const SHIFT_STATUSES: Record<ShiftStatus, string> = {
  scheduled: 'Запланирована',
  completed: 'Завершена',
  cancelled: 'Отменена',
  no_show: 'Неявка',
  confirmed: 'Подтверждена',
  absent: 'Отсутствует',
  checked_in: 'Прибыл',
  checked_out: 'Ушёл'
};

const STATUS_COLORS = {
  scheduled: 'default',
  completed: 'success',
  cancelled: 'error',
  no_show: 'warning',
  confirmed: 'info',
  late:'primary',
  absent: 'error',
  checked_in: 'success',
  checked_out: 'info',
  on_break: 'warning',
  overtime: 'secondary',
  early_departure: 'warning',
  present: 'success'
} as const;

// Role colors and labels
const ROLE_COLORS: Record<string, string> = {
  admin: '#f44336', // Red
  manager: '#9c27b0', // Purple
  teacher: '#2196f3', // Blue
  assistant: '#4caf50', // Green
  nurse: '#ff9800', // Orange
  cook: '#795548', // Brown
  cleaner: '#607d8b', // Blue Grey
  security: '#3f51b5', // Indigo
  psychologist: '#e91e63', // Pink
  music_teacher: '#00bcd4', // Cyan
  physical_teacher: '#8bc34a', // Light Green
  staff: '#9e9e9e', // Grey
  doctor: '#ff5722', // Deep Orange
  intern: '#673ab7', // Deep Purple
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
  intern: 'Стажер'
};

// Удаляем локальное определение интерфейса ShiftFormData,
// так как он уже определен в types/common.ts

const StaffSchedule: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data
  const [staff, setStaff] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Form state
    const [formData, setFormData] = useState<ShiftFormData>({
          userId: '',
          staffId: '',
          staffName: '',
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '07:30',
          endTime: '18:30',
          notes: '',
          status: ShiftStatus.scheduled,
          alternativeStaffId: ''
        });

  // Load data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const weekStart = startOfWeek(selectedWeek, { locale: ru });
        const weekEnd = addDays(weekStart, 6);
        const [staffData, shiftsData] = await Promise.all([
          getUsers(),
          getShifts(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'))
        ]);
        
        setStaff(staffData);
        setShifts(shiftsData);
      } catch (err: any) {
        console.error('Error loading data:', err);
        setError('Не удалось загрузить данные');
        enqueueSnackbar('Ошибка при загрузке данных', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedWeek, enqueueSnackbar]);
  
  // Обработчик для фильтра ролей
  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };
  
  const assignFiveTwoSchedule = async () => {
    console.log('assignFiveTwoSchedule called');
    try {
      setLoading(true);
      console.log('Loading set to true');
      
      // Определяем текущую дату и конец текущего месяца
      const currentDate = new Date();
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      console.log('Current date:', currentDate, 'End of month:', endOfMonth);
      
      // Создаем массив дат с текущего дня до конца месяца
      const dates = [];
      let current = new Date(currentDate);
      while (current <= endOfMonth) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      console.log('Dates array created, length:', dates.length);
      
      // Фильтруем рабочие дни (понедельник-пятница)
      const workDays = dates.filter(date => {
        const dayOfWeek = date.getDay();
        return dayOfWeek !== 0 && dayOfWeek !== 6; // Не воскресенье и не суббота
      });
      console.log('Work days filtered, length:', workDays.length);
      
      // Берем только рабочие дни, исключаем выходные
      const scheduleBlocks = workDays;
      console.log('Schedule blocks created, length:', scheduleBlocks.length);
      
      // Ограничиваем график до конца месяца
      const finalSchedule = scheduleBlocks.filter(date => date <= endOfMonth);
      console.log('Final schedule filtered, length:', finalSchedule.length);
      
      console.log('Selected staff:', selectedStaff);
      
      // Для каждого выбранного сотрудника создаем смены
      for (const staffId of selectedStaff) {
        console.log('Creating shifts for staff:', staffId);
        
        // Получаем существующие смены сотрудника в диапазоне дат
        const existingShifts = await getShifts(format(currentDate, 'yyyy-MM-dd'), format(endOfMonth, 'yyyy-MM-dd'));
        const existingShiftDates = new Set(
          existingShifts
            .filter(shift => shift.staffId === staffId)
            .map(shift => shift.date)
        );
        
        // Создаем отдельный список для отслеживания созданных смен в процессе выполнения
        const createdShiftDates = new Set<string>();
        
        for (const date of finalSchedule) {
          const dateStr = format(date, 'yyyy-MM-dd');
          
          // Пропускаем дату, если уже есть смена (из базы данных или созданная в этом запуске)
          if (existingShiftDates.has(dateStr) || createdShiftDates.has(dateStr)) {
            console.log('Skipping existing shift for', staffId, 'on', dateStr);
            continue;
          }
          
          try {
            // Для рабочих дней создаем смену типа "full"
            // (выходные дни уже исключены из массива finalSchedule)
            console.log('Creating full shift for', staffId, 'on', date);
            await createShift({
                            userId: staffId,
                            staffId: staffId,
                            staffName: staff.find(s => (s.id || s._id) === staffId)?.fullName || '',
                            date: dateStr,
                            startTime: '07:30',
                            endTime: '18:30',
                            notes: 'Рабочий день по графику 5/2',
                            status: ShiftStatus.scheduled
                          });
            
            // Добавляем дату в список созданных, чтобы избежать дубликатов в этой же итерации
            createdShiftDates.add(dateStr);
          } catch (error: any) {
            // Если ошибка связана с дубликатом, просто продолжаем
            const errorMessage = error.response?.data?.error || error.message || error.response?.data;
            if (errorMessage && typeof errorMessage === 'string' && errorMessage.includes('У сотрудника уже есть смена в этот день')) {
              console.log('Skipping duplicate shift for', staffId, 'on', dateStr);
              // Добавляем дату в список существующих, чтобы избежать попыток создать снова
              existingShiftDates.add(dateStr);
              continue; // Пропускаем и продолжаем выполнение
            } else {
              console.error('Error creating shift for', staffId, 'on', dateStr, ':', error);
              // Продолжаем выполнение, но логируем ошибку
              continue;
            }
          }
        }
      }
      
      enqueueSnackbar('График 5/2 успешно назначен', { variant: 'success' });
      
      // Обновляем данные
      const weekStart = startOfWeek(selectedWeek, { locale: ru });
      const weekEnd = addDays(weekStart, 6);
      const shiftsData = await getShifts(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'));
      setShifts(shiftsData);
      
      // Сбрасываем выбранных сотрудников
      setSelectedStaff([]);
    } catch (err: any) {
      console.error('Error assigning 5/2 schedule:', err);
      enqueueSnackbar('Ошибка при назначении графика 5/2', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };
  
  // Получаем данные пользователя

  // Week navigation
  const goToPreviousWeek = () => {
    setSelectedWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setSelectedWeek(new Date());
  };

  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        date: format(date, 'yyyy-MM-dd')
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        date: ''
      }));
    }
  };

  const handleStaffSelect = (e: SelectChangeEvent<string>) => {
    const staffId = e.target.value;
    const selectedStaff = staff.find(s => (s.id || s._id) === staffId);
    setFormData(prev => ({
      ...prev,
      staffId,
      staffName: selectedStaff?.fullName || ''
    }));
  };

  // Form validation
  const validateForm = (): boolean => {
    if (!formData.staffId) {
      enqueueSnackbar('Выберите сотрудника', { variant: 'error' });
      return false;
    }
    if (!formData.date) {
      enqueueSnackbar('Укажите дату смены', { variant: 'error' });
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      enqueueSnackbar('Укажите время начала и окончания смены', { variant: 'error' });
      return false;
    }
    return true;
  };

  // CRUD operations
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
                          startTime: formData.startTime,
                          endTime: formData.endTime,
                          notes: formData.notes || '',
                          status: formData.status || ShiftStatus.scheduled,
                          createdAt: editingShift?.createdAt || new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        };
      
      if (editingShift) {
              // Update existing shift
              if (editingShift.id) {
                // Обновляем смену через API
                const updatedShift = await updateShift(editingShift.id, {
                  ...shiftData,
                  alternativeStaffId: formData.alternativeStaffId
                });
                setShifts(prev =>
                  prev.map(s => s.id === editingShift.id ? updatedShift : s)
                );
                enqueueSnackbar('Смена успешно обновлена', { variant: 'success' });
              } else {
                enqueueSnackbar('Ошибка: ID смены не определен', { variant: 'error' });
              }
      } else {
        // Create new shift
        const newShift = await createShift({
          ...shiftData,
          alternativeStaffId: formData.alternativeStaffId
        });
        setShifts(prev => [...prev, newShift]);
        enqueueSnackbar('Смена успешно создана', { variant: 'success' });
      }
      
      // После создания смены обновляем только смены, а не весь список
      const weekStart = startOfWeek(selectedWeek, { locale: ru });
      const weekEnd = addDays(weekStart, 6);
      const shiftsData = await getShifts(format(weekStart, 'yyyy-MM-dd'), format(weekEnd, 'yyyy-MM-dd'));
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
              startTime: shift.startTime,
              endTime: shift.endTime,
              status: shift.status,
              notes: shift.notes || '',
              alternativeStaffId: shift.alternativeStaffId || ''
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
          date: format(new Date(), 'yyyy-MM-dd'),
          startTime: '07:30',
          endTime: '18:30',
           status: 'scheduled' as ShiftStatus,
          notes: '',
          alternativeStaffId: ''
        });
  };

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { locale: ru });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get shifts for a specific day and staff
  const getShiftsForDay = (staffId: string, date: Date) => {
    return shifts.filter(shift => {
      // Проверяем, что staffId не null и не undefined
      if (!shift.staffId) return false;
      // Проверяем тип и сравниваем
      if (typeof shift.staffId === 'string') {
        // Сравниваем даты как строки, чтобы избежать проблем с часовыми поясами
        const shiftDate = shift.date.split('T')[0]; // Берем только дату, без времени
        const compareDate = format(date, 'yyyy-MM-dd');
        return shift.staffId === staffId && shiftDate === compareDate;
      } else {
        // Для объекта проверяем наличие _id и сравниваем
        const shiftDate = shift.date.split('T')[0]; // Берем только дату, без времени
        const compareDate = format(date, 'yyyy-MM-dd');
        return (shift.staffId as any)._id === staffId && shiftDate === compareDate;
      }
    });
  };

  // Render loading state
  if (loading && shifts.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box p={3}>
        <Card>
          <CardHeader
            title={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">График смен</Typography>
                <Box>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => setModalOpen(true)}
                  >
                    Добавить смену
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ ml: 2 }}
                    onClick={() => {
                      console.log('5/2 button clicked');
                      console.log('Selected staff length:', selectedStaff.length);
                      console.log('Selected staff:', selectedStaff);
                      // Логика для назначения графика 5/2
                      if (selectedStaff.length === 0) {
                        console.log('No staff selected');
                        enqueueSnackbar('Пожалуйста, выберите сотрудников', { variant: 'warning' });
                        return;
                      }
                      console.log('Calling assignFiveTwoSchedule');
                      assignFiveTwoSchedule();
                    }}
                  >
                    Назначить график 5/2
                  </Button>
                </Box>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            {/* Week Navigation */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <IconButton onClick={goToPreviousWeek}>
                <ArrowBackIosIcon />
              </IconButton>
              
              <Box textAlign="center">
                <Typography variant="h6">
                  {format(weekStart, 'MMMM yyyy', { locale: ru })}
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={goToToday}
                  startIcon={<TodayIcon />}
                  sx={{ mt: 1 }}
                >
                  Сегодня
                </Button>
              </Box>
              
              <IconButton onClick={goToNextWeek}>
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>
            
            {/* Фильтры */}
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="center" mb={3}>
              <TextField
                placeholder="Поиск по имени..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flexGrow: 1, minWidth: '200px' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <FormControl size="small" sx={{ minWidth: '200px' }}>
                <InputLabel id="role-filter-label">Фильтр по должности</InputLabel>
                <Select
                  labelId="role-filter-label"
                  multiple
                  value={filterRole}
                  onChange={handleFilterRoleChange}
                  input={<OutlinedInput label="Фильтр по должности" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
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

            {/* Schedule Table */}
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Сотрудник</TableCell>
                    {weekDays.map(day => (
                      <TableCell key={day.toString()} align="center">
                        <Box>
                          <Box>{format(day, 'EEEEEE', { locale: ru })}</Box>
                          <Box>{format(day, 'd MMM', { locale: ru })}</Box>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staff
                    .filter(staffMember => {
                      // Фильтрация по поисковой строке
                      const matchesSearch = !searchTerm ||
                        staffMember.fullName.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      // Фильтрация по роли
                      const roleLabel = ROLE_LABELS[staffMember.role as string] || staffMember.role;
                      const matchesRole = filterRole.length === 0 ||
                        filterRole.includes(roleLabel);
                      
                      return matchesSearch && matchesRole;
                    })
                    .map(staffMember => {
                      const staffId = staffMember.id || staffMember._id;
                      if (!staffId) return null;
                      const isSelected = selectedStaff.includes(staffId);
                      return (
                        <TableRow
                          key={staffMember.id}
                          sx={{
                            backgroundColor: isSelected ? 'action.selected' : 'inherit',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <TableCell
                            onClick={() => {
                              console.log('Staff cell clicked, staffId:', staffId);
                              if (selectedStaff.includes(staffId)) {
                                console.log('Removing staff from selection');
                                const newSelectedStaff = selectedStaff.filter(id => id !== staffId);
                                setSelectedStaff(newSelectedStaff);
                                console.log('Selected staff after removal:', newSelectedStaff);
                              } else {
                                console.log('Adding staff to selection');
                                const newSelectedStaff = [...selectedStaff, staffId];
                                setSelectedStaff(newSelectedStaff);
                                console.log('Selected staff after addition:', newSelectedStaff);
                              }
                            }}
                            sx={{
                              cursor: 'pointer',
                              userSelect: 'none'
                            }}
                          >
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 12,
                                  height: 12,
                                  borderRadius: '50%',
                                  bgcolor: ROLE_COLORS[staffMember.role as string] || '#9e9e9e',
                                  mr: 1
                                }}
                              />
                              <Box>
                                {staffMember.fullName}
                                <Box sx={{ fontSize: '0.8em', color: 'text.secondary' }}>
                                  {ROLE_LABELS[staffMember.role as string] || staffMember.role}
                                </Box>
                              </Box>
                            </Box>
                          </TableCell>
                          {weekDays.map(day => {
                            const dayShifts = getShiftsForDay(staffId, day);
                            return (
                              <TableCell
                                key={day.toString()}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    staffId: staffId,
                                    staffName: staffMember.fullName,
                                    date: format(day, 'yyyy-MM-dd')
                                  });
                                  setModalOpen(true);
                                }}
                                sx={{
                                  minHeight: '100px',
                                  border: '1px solid',
                                  borderColor: 'divider',
                                  '&:hover': {
                                    backgroundColor: 'action.hover',
                                    cursor: 'pointer'
                                  }
                                }}
                              >
                                {dayShifts.map(shift => (
                                  <Box
                                    key={shift.id}
                                    sx={{
                                      p: 1,
                                      mb: 1,
                                      borderRadius: 1,
                                      bgcolor: 'background.paper',
                                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                                      '&:hover': {
                                        bgcolor: 'action.selected'
                                      }
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditShift(shift);
                                    }}
                                  >
                                    <Box sx={{ fontSize: 12 }}>
                                      {shift.startTime} - {shift.endTime}
                                    </Box>
                                    <Box mt={0.5}>
                                      <Chip
                                        label={SHIFT_STATUSES[shift.status]}
                                        size="small"
                                        color={STATUS_COLORS[shift.status] as any}
                                      />
                                    </Box>
                                  </Box>
                                ))}
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
        <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
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
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleStaffSelect}
                      label="Сотрудник"
                      required
                    >
                      {staff.map(staffMember => (
                        <MenuItem key={staffMember.id} value={staffMember.id}>
                          <Box display="flex" alignItems="center">
                            <Box
                              sx={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                bgcolor: ROLE_COLORS[staffMember.role as string] || '#9e9e9e',
                                mr: 1
                              }}
                            />
                            <Box>
                              {staffMember.fullName}
                              <Box sx={{ fontSize: '0.8em', color: 'text.secondary' }}>
                                {ROLE_LABELS[staffMember.role as string] || staffMember.role}
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
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
                      <DatePicker
                        label="Дата смены"
                        value={formData.date ? new Date(formData.date) : null}
                        onChange={handleDateChange}
                        renderInput={(params) => (
                          <TextField {...params} fullWidth required />
                        )}
                      />
                    </LocalizationProvider>
                  </FormControl>
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Начало"
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300 // 5 min
                    }}
                  />
                </Grid>
                
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Окончание"
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    fullWidth
                    required
                    InputLabelProps={{
                      shrink: true,
                    }}
                    inputProps={{
                      step: 300 // 5 min
                    }}
                  />
                </Grid>
           
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Статус</InputLabel>
                    <Select
                      name="status"
                      value={formData.status}
                      onChange={handleSelectChange}
                      label="Статус"
                      required
                    >
                      {Object.entries(SHIFT_STATUSES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Альтернативный сотрудник</InputLabel>
                    <Select
                      name="alternativeStaffId"
                      value={formData.alternativeStaffId || ''}
                      onChange={handleSelectChange}
                      label="Альтернативный сотрудник"
                    >
                      <MenuItem value="">Нет альтернативного сотрудника</MenuItem>
                      {staff
                        .filter(s => s.role !== 'parent' && s.role !== 'child') // Исключаем родителей и детей
                        .map(staffMember => (
                          <MenuItem key={staffMember.id} value={staffMember.id || staffMember._id}>
                            <Box display="flex" alignItems="center">
                              <Box
                                sx={{
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  bgcolor: ROLE_COLORS[staffMember.role as string] || '#9e9e9e',
                                  mr: 1
                                }}
                              />
                              <Box>
                                {staffMember.fullName}
                                <Box sx={{ fontSize: '0.8em', color: 'text.secondary' }}>
                                  {ROLE_LABELS[staffMember.role as string] || staffMember.role}
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
                    label="Примечания"
                    name="notes"
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
              <Button onClick={handleCloseModal} color="inherit">
                Отмена
              </Button>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {editingShift ? 'Сохранить изменения' : 'Добавить смену'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StaffSchedule;