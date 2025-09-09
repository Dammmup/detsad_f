import React, { useState, useEffect, useCallback } from 'react';
import {
  Paper, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Grid, IconButton,
  Tooltip, Chip, CircularProgress, Alert, SelectChangeEvent
} from '@mui/material';
import { Add, Edit, Delete, Event, CalendarMonth, ViewList, FilterList } from '@mui/icons-material';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { getSchedules, createSchedule, updateSchedule, deleteSchedule, getShiftTypes, Shift } from '../components/services/api/schedule';
import { getUsers } from '../components/services/api/users';

// Интерфейс для сотрудника
interface StaffMember {
  id?: string;
  fullName: string;
  role: string;
}

// Интерфейс для события календаря
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    userId: string;
    userName: string;
    type: string;
    notes?: string;
    status?: string;
  };
}

const Schedule: React.FC = () => {
  // Состояния для данных
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [shiftTypes, setShiftTypes] = useState<string[]>([]);
  
  // Состояния для UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  // Состояние для формы
  const [form, setForm] = useState<Shift>({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '17:00',
    type: 'regular'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  // Фильтры
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
  }, []);
  
  // Загрузка всех необходимых данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получение списка сотрудников
      const staffData = await getUsers();
      setStaff(staffData);
      
      // Получение типов смен
      const typesData = await getShiftTypes();
      setShiftTypes(typesData);
      
      // Получение смен на текущий месяц
      await fetchShifts();
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };
  
  // Получение смен на выбранный период
  const fetchShifts = async () => {
    try {
      // Получаем начало и конец месяца
      const date = new Date(selectedDate);
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
      const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const startDate = firstDay.toISOString().split('T')[0];
      const endDate = lastDay.toISOString().split('T')[0];
      
      // Получаем смены с учетом фильтра по пользователю
      const shiftsData = await getSchedules(filterUserId || undefined);
      
      // Применяем фильтр по типу смены, если он выбран
      const filteredShifts = filterType 
        ? shiftsData.filter(shift => shift.type === filterType)
        : shiftsData;
      
      setShifts(filteredShifts);
      
      // Преобразуем смены в события для календаря
      const calendarEvents = filteredShifts.map(shift => convertShiftToEvent(shift));
      setEvents(calendarEvents);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки смен');
    }
  };
  
  // Преобразование смены в событие для календаря
  const convertShiftToEvent = (shift: Shift): CalendarEvent => {
    // Определяем цвет в зависимости от типа смены
    let backgroundColor = '#1890ff'; // regular - синий
    let borderColor = '#1890ff';
    
    if (shift.type === 'overtime') {
      backgroundColor = '#faad14'; // overtime - оранжевый
      borderColor = '#faad14';
    } else if (shift.type === 'sick') {
      backgroundColor = '#ff4d4f'; // sick - красный
      borderColor = '#ff4d4f';
    } else if (shift.type === 'vacation') {
      backgroundColor = '#52c41a'; // vacation - зеленый
      borderColor = '#52c41a';
    }
    
    // Если смена отменена, делаем ее полупрозрачной
    if (shift.status === 'cancelled') {
      backgroundColor = backgroundColor + '80'; // 50% прозрачность
    }
    
    // Формируем название события
    const title = `${shift.userName || 'Сотрудник'} - ${shift.type === 'regular' ? 'Смена' : 
                   shift.type === 'overtime' ? 'Сверхурочно' : 
                   shift.type === 'sick' ? 'Больничный' : 'Отпуск'}`;
    
    return {
      id: shift.id || '',
      title,
      start: `${shift.date}T${shift.startTime}`,
      end: `${shift.date}T${shift.endTime}`,
      backgroundColor,
      borderColor,
      textColor: '#ffffff',
      extendedProps: {
        userId: shift.userId,
        userName: shift.userName || '',
        type: shift.type,
        notes: shift.notes,
        status: shift.status
      }
    };
  };
  
  // Обработчик изменения месяца в календаре
  const handleDateChange = (date: Date) => {
    setSelectedDate(date.toISOString().split('T')[0]);
    // Загружаем смены для нового месяца
    fetchShifts();
  };
  
  // Обработчик клика по событию в календаре
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const event = events.find(e => e.id === eventId);
    
    if (event) {
      setSelectedEvent(event);
      
      // Находим соответствующую смену
      const shift = shifts.find(s => s.id === eventId);
      
      if (shift) {
        // Заполняем форму данными выбранной смены
        setForm({
          id: shift.id,
          userId: shift.userId,
          date: shift.date,
          startTime: shift.startTime,
          endTime: shift.endTime,
          type: shift.type,
          notes: shift.notes,
          status: shift.status
        });
        
        // Открываем модальное окно для редактирования
        setModalOpen(true);
      }
    }
  };
  
  // Обработчик клика по дате в календаре для создания новой смены
  const handleDateClick = (info: any) => {
    // Сбрасываем выбранное событие
    setSelectedEvent(null);
    
    // Заполняем форму начальными данными
    setForm({
      userId: '',
      date: info.dateStr,
      startTime: '08:00',
      endTime: '17:00',
      type: 'regular'
    });
    
    // Открываем модальное окно для создания
    setModalOpen(true);
  };
  
  // Обработчик изменения полей формы
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Очищаем ошибку для измененного поля
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Обработчик изменения полей Select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Очищаем ошибку для измененного поля
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Валидация формы
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!form.userId) errors.userId = 'Выберите сотрудника';
    if (!form.date) errors.date = 'Выберите дату';
    if (!form.startTime) errors.startTime = 'Выберите время начала';
    if (!form.endTime) errors.endTime = 'Выберите время окончания';
    if (!form.type) errors.type = 'Выберите тип смены';
    
    // Проверка, что время окончания позже времени начала
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errors.endTime = 'Время окончания должно быть позже времени начала';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Сохранение смены (создание или обновление)
  const handleSave = async () => {
    // Валидация формы
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (form.id) {
        // Обновление существующей смены
        await updateSchedule(form.id, form);
      } else {
        // Создание новой смены
        await createSchedule(form);
      }
      
      // Закрываем модальное окно
      setModalOpen(false);
      
      // Обновляем список смен
      await fetchShifts();
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения смены');
    } finally {
      setLoading(false);
    }
  };
  
  // Удаление смены
  const handleDelete = async () => {
    if (!form.id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту смену?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteSchedule(form.id);
      
      // Закрываем модальное окно
      setModalOpen(false);
      
      // Обновляем список смен
      await fetchShifts();
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления смены');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик изменения фильтров
  const handleFilterChange = () => {
    fetchShifts();
  };
  
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок и кнопки управления */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Event sx={{ mr: 1 }} /> Расписание смен
        </Typography>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => {
              setSelectedEvent(null);
              setForm({
                userId: '',
                date: new Date().toISOString().split('T')[0],
                startTime: '08:00',
                endTime: '17:00',
                type: 'regular'
              });
              setModalOpen(true);
            }}
            sx={{ mr: 1 }}
          >
            Добавить смену
          </Button>
          
          <Tooltip title={viewMode === 'calendar' ? 'Показать список' : 'Показать календарь'}>
            <IconButton onClick={() => setViewMode(viewMode === 'calendar' ? 'list' : 'calendar')}>
              {viewMode === 'calendar' ? <ViewList /> : <CalendarMonth />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Фильтры */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Сотрудник</InputLabel>
          <Select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            label="Сотрудник"
          >
            <MenuItem value="">Все сотрудники</MenuItem>
            {staff.map((member) => (
              <MenuItem key={member.id} value={member.id}>{member.fullName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Тип смены</InputLabel>
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            label="Тип смены"
          >
            <MenuItem value="">Все типы</MenuItem>
            {shiftTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type === 'regular' ? 'Обычная смена' : 
                 type === 'overtime' ? 'Сверхурочная работа' : 
                 type === 'sick' ? 'Больничный' : 'Отпуск'}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          startIcon={<FilterList />}
          onClick={handleFilterChange}
        >
          Применить фильтры
        </Button>
      </Box>
      
      {/* Индикатор загрузки и ошибки */}
      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Календарь или список смен */}
      {!loading && !error && (
        viewMode === 'calendar' ? (
          <Box sx={{ height: 'calc(100vh - 300px)', minHeight: 500 }}>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={events}
              eventClick={(info) => handleEventClick(info)}
              dateClick={(info) => handleDateClick(info)}
              datesSet={(dateInfo) => handleDateChange(dateInfo.view.currentStart)}
              height="100%"
              locale="ru"
              firstDay={1} // Понедельник как первый день недели
            />
          </Box>
        ) : (
          <Box>
            {shifts.length === 0 ? (
              <Alert severity="info">Нет смен для отображения</Alert>
            ) : (
              <Grid container spacing={2}>
                {shifts.map((shift) => {
                  const staffMember = staff.find(s => s.id === shift.userId);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={shift.id}>
                      <Paper elevation={2} sx={{ p: 2, position: 'relative' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {staffMember?.fullName || 'Сотрудник'}
                          </Typography>
                          <Chip 
                            label={shift.type === 'regular' ? 'Обычная' : 
                                  shift.type === 'overtime' ? 'Сверхурочно' : 
                                  shift.type === 'sick' ? 'Больничный' : 'Отпуск'}
                            color={shift.type === 'regular' ? 'primary' : 
                                  shift.type === 'overtime' ? 'warning' : 
                                  shift.type === 'sick' ? 'error' : 'success'}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary">
                          Дата: {new Date(shift.date).toLocaleDateString('ru-RU')}
                        </Typography>
                        
                        <Typography variant="body2" color="text.secondary">
                          Время: {shift.startTime} - {shift.endTime}
                        </Typography>
                        
                        {shift.notes && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {shift.notes}
                          </Typography>
                        )}
                        
                        <Box display="flex" justifyContent="flex-end" mt={1}>
                          <Tooltip title="Редактировать">
                            <IconButton size="small" onClick={() => handleEventClick({ event: { id: shift.id } })}>
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton size="small" onClick={() => {
                              setForm({ ...shift });
                              handleDelete();
                            }}>
                              <Delete fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        
                        {shift.status === 'cancelled' && (
                          <Chip 
                            label="Отменена"
                            color="default"
                            size="small"
                            sx={{ position: 'absolute', top: 8, right: 8 }}
                          />
                        )}
                      </Paper>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>
        )
      )}
      
      {/* Модальное окно для добавления/редактирования смены */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.id ? 'Редактировать смену' : 'Добавить новую смену'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.userId}>
                <InputLabel>Сотрудник</InputLabel>
                <Select
                  name="userId"
                  value={form.userId}
                  onChange={handleSelectChange}
                  label="Сотрудник"
                >
                  {staff.map((member) => (
                    <MenuItem key={member.id} value={member.id}>{member.fullName}</MenuItem>
                  ))}
                </Select>
                {formErrors.userId && <FormHelperText>{formErrors.userId}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Дата"
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.date}
                helperText={formErrors.date}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!formErrors.type}>
                <InputLabel>Тип смены</InputLabel>
                <Select
                  name="type"
                  value={form.type}
                  onChange={handleSelectChange}
                  label="Тип смены"
                >
                  {shiftTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type === 'regular' ? 'Обычная смена' : 
                       type === 'overtime' ? 'Сверхурочная работа' : 
                       type === 'sick' ? 'Больничный' : 'Отпуск'}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.type && <FormHelperText>{formErrors.type}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Время начала"
                name="startTime"
                type="time"
                value={form.startTime}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.startTime}
                helperText={formErrors.startTime}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Время окончания"
                name="endTime"
                type="time"
                value={form.endTime}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.endTime}
                helperText={formErrors.endTime}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Примечания"
                name="notes"
                value={form.notes || ''}
                onChange={handleChange}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
            
            {form.id && (
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Статус</InputLabel>
                  <Select
                    name="status"
                    value={form.status || 'planned'}
                    onChange={handleSelectChange}
                    label="Статус"
                  >
                    <MenuItem value="planned">Запланирована</MenuItem>
                    <MenuItem value="completed">Выполнена</MenuItem>
                    <MenuItem value="cancelled">Отменена</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          
          {form.id && (
            <Button 
              onClick={handleDelete} 
              color="error"
              disabled={loading}
            >
              Удалить
            </Button>
          )}
          
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary"
            disabled={loading}
          >
            {form.id ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Schedule;
