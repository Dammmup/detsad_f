import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
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
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Today as TodayIcon
} from '@mui/icons-material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Types and Services
import { Shift, ShiftStatus, ShiftType } from '../../types/common';
import { getShifts, createShift, updateShift, deleteShift } from '../../services/api/shifts';
import { getUsers } from '../../services/api/users';
import { useAuth } from '../../components/context/AuthContext';
import {User} from '../../types/common';
import { SHIFT_TYPES } from '../../types/common';

const SHIFT_STATUSES: Record<ShiftStatus, string> = {
  scheduled: 'Запланирована',
  in_progress: 'В процессе',
  completed: 'Завершена',
  cancelled: 'Отменена',
  no_show: 'Неявка',
  confirmed: 'Подтверждена'
};

const STATUS_COLORS = {
  scheduled: 'default',
  in_progress: 'primary',
  completed: 'success',
  cancelled: 'error',
  no_show: 'warning',
  confirmed: 'info'
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

interface ShiftFormData {
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  status: ShiftStatus;
  notes: string;
}

const StaffSchedule: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  // State
  const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Data
  const [staff, setStaff] = useState<User[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  
  // Form state
  const [formData, setFormData] = useState<ShiftFormData>({
    staffId: '',
    staffName: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    startTime: '07:30',
    endTime: '18:00',
    shiftType: 'full',
    status: 'scheduled',
    notes: ''
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
        
        // Фильтруем сотрудников, оставляя только 'adult'
        const adultStaff = staffData.filter(user => user.type === 'adult');
        setStaff(adultStaff);
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
  }, [enqueueSnackbar]);

  // Получаем данные пользователя
  const { user } = useAuth();

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
      const shiftData = {
        ...formData,
        staffName: staff.find(s => (s.id || s._id) === formData.staffId)?.fullName || '',
        createdBy: user?.id || '',
        type: formData.shiftType
      };
      
      if (editingShift) {
        // Update existing shift
        const updatedShift = await updateShift(editingShift.id, shiftData);
        setShifts(prev =>
          prev.map(s => s.id === editingShift.id ? { ...updatedShift, staffName: shiftData.staffName } : s)
        );
        enqueueSnackbar('Смена успешно обновлена', { variant: 'success' });
      } else {
        // Create new shift
        const newShift = await createShift(shiftData);
        setShifts(prev => [...prev, newShift]);
        enqueueSnackbar('Смена успешно создана', { variant: 'success' });
      }
      
      // После создания смены обновляем только смены, а не весь список
      const shiftsData = await getShifts();
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
      staffId: (shift.staffId as any)?._id || shift.staffId || '',
      staffName: shift.staffName,
      date: shift.date,
      startTime: shift.startTime,
      endTime: shift.endTime,
      shiftType: shift.type,
      status: shift.status,
      notes: shift.notes || ''
    });
    setEditingShift(shift);
    setModalOpen(true);
  };

  const handleDeleteShift = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту смену?')) return;
    
    setLoading(true);
    
    try {
      await deleteShift(id);
      setShifts(prev => prev.filter(s => s.id !== id));
      enqueueSnackbar('Смена успешно удалена', { variant: 'success' });
    } catch (err) {
      console.error('Error deleting shift:', err);
      enqueueSnackbar('Ошибка при удалении смены', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingShift(null);
    setFormData({
      staffId: '',
      staffName: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      startTime: '07:30',
      endTime: '18:00',
      shiftType: 'full',
      status: 'scheduled',
      notes: ''
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
        return shift.staffId === staffId && isSameDay(parseISO(shift.date), date);
      } else {
        // Для объекта проверяем наличие _id и сравниваем
        return (shift.staffId as any)._id === staffId && isSameDay(parseISO(shift.date), date);
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
                  {staff.map(staffMember => (
                    <TableRow key={staffMember.id}>
                      <TableCell>
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
                        const staffId = staffMember.id || staffMember._id;
                        if (!staffId) return null;
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
                                <Box>{SHIFT_TYPES[shift.type]}</Box>
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
                  ))}
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
                    <InputLabel>Тип смены</InputLabel>
                    <Select
                      name="shiftType"
                      value={formData.shiftType}
                      onChange={handleSelectChange}
                      label="Тип смены"
                      required
                    >
                      {Object.entries(SHIFT_TYPES).map(([value, label]) => (
                        <MenuItem key={value} value={value}>
                          {label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
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
                
                <Grid item xs={12}>
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