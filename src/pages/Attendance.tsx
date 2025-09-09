import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, FormHelperText, Grid, IconButton,
  Tooltip, Chip, CircularProgress, Alert, SelectChangeEvent, Table, TableHead, TableRow,
  TableCell, TableBody, TablePagination, TableContainer
} from '@mui/material';
import { 
  Add, Edit, Delete, CheckCircle, FilterList,

} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  getAttendanceRecords, createAttendanceRecord, updateAttendanceRecord, 
  deleteAttendanceRecord, checkIn, checkOut, AttendanceRecord 
} from '../components/services/api/attendance';
import { getUsers } from '../components/services/api/users';

// Интерфейс для сотрудника
interface StaffMember {
  id?: string;
  fullName: string;
  role: string;
}

const Attendance: React.FC = () => {
  // Состояния для данных
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  
  // Состояния для UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  
  // Состояния для фильтрации и пагинации
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Состояние для формы
  const [form, setForm] = useState<AttendanceRecord>({
    userId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'present'
  });
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
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
      
      // Получение записей посещаемости на текущую неделю
      await fetchAttendanceRecords();
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };
  
  // Получение записей посещаемости на выбранный период
  const fetchAttendanceRecords = async () => {
    try {
      // Форматируем даты для API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Получаем записи с учетом фильтра по пользователю
      const recordsData = await getAttendanceRecords(
        formattedStartDate, 
        formattedEndDate, 
        filterUserId || undefined
      );
      
      // Применяем фильтр по статусу, если он выбран
      const filteredRecords = filterStatus 
        ? recordsData.filter(record => record.status === filterStatus)
        : recordsData;
      
      setRecords(filteredRecords);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки записей посещаемости');
    }
  };
  
  // Обработчик изменения фильтров
  const handleFilterChange = () => {
    fetchAttendanceRecords();
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
    if (!form.status) errors.status = 'Выберите статус';
    
    // Проверка времени прихода и ухода
    if (form.checkIn && form.checkOut && form.checkIn >= form.checkOut) {
      errors.checkOut = 'Время ухода должно быть позже времени прихода';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Сохранение записи посещаемости (создание или обновление)
  const handleSave = async () => {
    // Валидация формы
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (form.id) {
        // Обновление существующей записи
        await updateAttendanceRecord(form.id, form);
      } else {
        // Создание новой записи
        await createAttendanceRecord(form);
      }
      
      // Закрываем модальное окно
      setModalOpen(false);
      
      // Обновляем список записей
      await fetchAttendanceRecords();
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения записи');
    } finally {
      setLoading(false);
    }
  };
  
  // Удаление записи посещаемости
  const handleDelete = async () => {
    if (!form.id) return;
    
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteAttendanceRecord(form.id);
      
      // Закрываем модальное окно
      setModalOpen(false);
      
      // Обновляем список записей
      await fetchAttendanceRecords();
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления записи');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик отметки прихода
  const handleCheckIn = async (userId: string) => {
    setLoading(true);
    
    try {
      // Получаем текущее местоположение (в реальном приложении)
      // const position = await getCurrentPosition();
      // const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      
      // Для демонстрации используем фиксированные координаты
      const location = { latitude: 51.1605, longitude: 71.4704 };
      
      // Отмечаем приход
      await checkIn(userId, location);
      
      // Обновляем список записей
      await fetchAttendanceRecords();
    } catch (err: any) {
      setError(err?.message || 'Ошибка отметки прихода');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик отметки ухода
  const handleCheckOut = async (userId: string, date: string) => {
    setLoading(true);
    
    try {
      // Получаем текущее местоположение (в реальном приложении)
      // const position = await getCurrentPosition();
      // const location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      
      // Для демонстрации используем фиксированные координаты
      const location = { latitude: 51.1605, longitude: 71.4704 };
      
      // Отмечаем уход
      await checkOut(userId, date, location);
      
      // Обновляем список записей
      await fetchAttendanceRecords();
    } catch (err: any) {
      setError(err?.message || 'Ошибка отметки ухода');
    } finally {
      setLoading(false);
    }
  };
  
  // Получение цвета для статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'late': return 'warning';
      case 'absent': return 'error';
      case 'early-leave': return 'warning';
      case 'sick': return 'info';
      case 'vacation': return 'primary';
      default: return 'default';
    }
  };
  
  // Получение текста для статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Присутствует';
      case 'late': return 'Опоздание';
      case 'absent': return 'Отсутствует';
      case 'early-leave': return 'Ранний уход';
      case 'sick': return 'Больничный';
      case 'vacation': return 'Отпуск';
      default: return status;
    }
  };
  
  // Обработчик изменения страницы пагинации
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Обработчик изменения количества строк на странице
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок и кнопки управления */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <CheckCircle sx={{ mr: 1 }} /> Учет посещаемости
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => {
            setForm({
              userId: '',
              date: new Date().toISOString().split('T')[0],
              status: 'present'
            });
            setModalOpen(true);
          }}
        >
          Добавить запись
        </Button>
      </Box>
      
      {/* Фильтры */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Начальная дата"
            value={startDate}
            onChange={(newValue) => newValue && setStartDate(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
          
          <DatePicker
            label="Конечная дата"
            value={endDate}
            onChange={(newValue) => newValue && setEndDate(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        
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
          <InputLabel>Статус</InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Статус"
          >
            <MenuItem value="">Все статусы</MenuItem>
            <MenuItem value="present">Присутствует</MenuItem>
            <MenuItem value="late">Опоздание</MenuItem>
            <MenuItem value="absent">Отсутствует</MenuItem>
            <MenuItem value="early-leave">Ранний уход</MenuItem>
            <MenuItem value="sick">Больничный</MenuItem>
            <MenuItem value="vacation">Отпуск</MenuItem>
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
      
      {/* Таблица записей посещаемости */}
      {!loading && !error && (
        <>
          {records.length === 0 ? (
            <Alert severity="info">Нет записей посещаемости для отображения</Alert>
          ) : (
            <>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Сотрудник</TableCell>
                      <TableCell>Дата</TableCell>
                      <TableCell>Приход</TableCell>
                      <TableCell>Уход</TableCell>
                      <TableCell>Часы работы</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {records
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((record) => {
                        const staffMember = staff.find(s => s.id === record.userId);
                        return (
                          <TableRow key={record.id}>
                            <TableCell>{staffMember?.fullName || 'Неизвестный сотрудник'}</TableCell>
                            <TableCell>{new Date(record.date).toLocaleDateString('ru-RU')}</TableCell>
                            <TableCell>
                              {record.checkIn || (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleCheckIn(record.userId)}
                                >
                                  Отметить приход
                                </Button>
                              )}
                            </TableCell>
                            <TableCell>
                              {record.checkOut || (record.checkIn && (
                                <Button 
                                  size="small" 
                                  variant="outlined" 
                                  onClick={() => handleCheckOut(record.userId, record.date)}
                                >
                                  Отметить уход
                                </Button>
                              ))}
                            </TableCell>
                            <TableCell>{record.workHours?.toFixed(2) || '-'}</TableCell>
                            <TableCell>
                              <Chip 
                                label={getStatusText(record.status)} 
                                color={getStatusColor(record.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Tooltip title="Редактировать">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setForm(record);
                                    setModalOpen(true);
                                  }}
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Удалить">
                                <IconButton 
                                  size="small" 
                                  onClick={() => {
                                    setForm(record);
                                    handleDelete();
                                  }}
                                >
                                  <Delete fontSize="small" color="error" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={records.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Строк на странице:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
              />
            </>
          )}
        </>
      )}
      
      {/* Модальное окно для добавления/редактирования записи */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {form.id ? 'Редактировать запись посещаемости' : 'Добавить новую запись посещаемости'}
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
            
            <Grid item xs={12}>
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
              <TextField
                label="Время прихода"
                name="checkIn"
                type="time"
                value={form.checkIn || ''}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Время ухода"
                name="checkOut"
                type="time"
                value={form.checkOut || ''}
                onChange={handleChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
                error={!!formErrors.checkOut}
                helperText={formErrors.checkOut}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth error={!!formErrors.status}>
                <InputLabel>Статус</InputLabel>
                <Select
                  name="status"
                  value={form.status}
                  onChange={handleSelectChange}
                  label="Статус"
                >
                  <MenuItem value="present">Присутствует</MenuItem>
                  <MenuItem value="late">Опоздание</MenuItem>
                  <MenuItem value="absent">Отсутствует</MenuItem>
                  <MenuItem value="early-leave">Ранний уход</MenuItem>
                  <MenuItem value="sick">Больничный</MenuItem>
                  <MenuItem value="vacation">Отпуск</MenuItem>
                </Select>
                {formErrors.status && <FormHelperText>{formErrors.status}</FormHelperText>}
              </FormControl>
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

export default Attendance;