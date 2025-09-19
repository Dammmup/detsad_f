import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, Chip, IconButton, TextField, FormControl, InputLabel,
  Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress,
  Fab, Tooltip, Alert, Avatar
} from '@mui/material';
import {
  AccessTime, Download, PlayArrow, Stop, Add, Schedule, TrendingUp, Warning, Person
} from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { getUsers } from '../../components/services/api/users';
import { getGroups } from '../../components/services/api/groups';
import { useAuth } from '../../components/context/AuthContext';
import {
  getStaffAttendance,
  saveStaffAttendance,
  checkIn,
  checkOut,
  getStaffAttendanceStats,
  StaffAttendanceRecord,
  getStatusColor,
  getStatusText,
  getShiftTypeText,
  formatTime,
  canCheckIn,
  canCheckOut,
  getCurrentTime
} from '../../components/services/api/staffAttendance';
import ExportMenuButton from '../../components/ExportMenuButton';
import { exportStaffAttendance, getCurrentPeriod } from '../../components/services/api/excelExport';
import axios from 'axios';
import { User } from '../../components/services/api/types';
import { Group } from '../../components/services/api/types';

interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  totalLateMinutes: number;
  totalOvertimeMinutes: number;
  totalEarlyLeaveMinutes: number;
  averageWorkHours: number;
}

const StaffAttendanceNew: React.FC = () => {
  const [records, setRecords] = useState<StaffAttendanceRecord[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [todayRecord, setTodayRecord] = useState<StaffAttendanceRecord | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newShift, setNewShift] = useState({
    staffId: '',
    groupId: '',
    date: new Date().toISOString().split('T')[0],
    shiftType: 'full' as const,
    startTime: '08:00',
    endTime: '17:00',
    notes: ''
  });

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  // Загружаем данные
  useEffect(() => {
    const fetchData = async () => {
      if (!isLoggedIn || !currentUser || authLoading) return;

      setLoading(true);
      try {
        // Загружаем сотрудников и группы
        const [usersData, groupsData] = await Promise.all([
          getUsers(),
          getGroups()
        ]);
        
        setStaff(usersData.filter(user => user.type === 'adult'));
        setGroups(groupsData);
        
        // Загружаем записи посещаемости
        await fetchAttendanceRecords();
        
        // Загружаем сегодняшнюю запись для текущего пользователя
        if (!isAdmin && currentUser?.id) {
          await fetchTodayRecord();
        }
        
      } catch (error: any) {
        console.error('Error loading data:', error);
        setError('Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLoggedIn, currentUser, authLoading]);

  const fetchAttendanceRecords = async () => {
    try {
      const filters: any = {
        date: selectedDate.toISOString().split('T')[0]
      };
      
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      
      if (selectedGroup !== 'all') {
        filters.groupId = selectedGroup;
      }
      
      const data = await getStaffAttendance(filters);
      setRecords(data);
      
      // Загружаем статистику
      const statsData = await getStaffAttendanceStats(filters);
      setAttendanceStats(statsData);
      
    } catch (error: any) {
      console.error('Error fetching attendance:', error);
      setError('Ошибка загрузки посещаемости');
    }
  };
  
  const fetchTodayRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const records = await getStaffAttendance({
        staffId: currentUser?.id,
        date: today
      });
      
      setTodayRecord(records[0] || null);
    } catch (error: any) {
      console.error('Error fetching today record:', error);
      setTodayRecord(null);
    }
  };
  
  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const result = await checkIn(currentUser?.id);
      console.log(result.message);
      await fetchTodayRecord();
      await fetchAttendanceRecords();
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setCheckingIn(false);
    }
  };
  
  const handleCheckOut = async () => {
    setCheckingOut(true);
    try {
      const result = await checkOut(currentUser?.id);
      console.log(result.message);
      await fetchTodayRecord();
      await fetchAttendanceRecords();
    } catch (error: any) {
      console.error(error.message);
    } finally {
      setCheckingOut(false);
    }
  };
  
  const handleCreateShift = async () => {
    try {
      await saveStaffAttendance(newShift);
      setDialogOpen(false);
      setNewShift({
        staffId: '',
        groupId: '',
        date: new Date().toISOString().split('T')[0],
        shiftType: 'full',
        startTime: '08:00',
        endTime: '17:00',
        notes: ''
      });
      await fetchAttendanceRecords();
      console.log('Смена создана успешно!');
    } catch (error: any) {
      console.error(error.message);
    }
  };
  
  // Обновляем данные при изменении фильтров
  useEffect(() => {
    if (isLoggedIn && !authLoading && currentUser) {
      fetchAttendanceRecords();
    }
  }, [selectedDate, selectedStaff, selectedGroup, isLoggedIn, authLoading, currentUser]);

  const getStaffName = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId || s._id === staffId);
    return staffMember?.fullName || 'Неизвестно';
  };
  
  const getStaffAvatar = (staffId: string) => {
    const staffMember = staff.find(s => s.id === staffId || s._id === staffId);
    return staffMember?.avatarUrl || '';
  };

  const getGroupName = (groupId?: string) => {
    if (!groupId) return '-';
    const group = groups.find(g => (g.id || g._id) === groupId);
    return group?.name || '-';
  };

  const calculateWorkHours = (record: StaffAttendanceRecord) => {
    if (!record.actualStart || !record.actualEnd) return 0;
    
    const start = record.actualStart.split(':').map(Number);
    const end = record.actualEnd.split(':').map(Number);
    
    const startMinutes = start[0] * 60 + start[1];
    const endMinutes = end[0] * 60 + end[1];
    
    const workMinutes = Math.max(0, endMinutes - startMinutes - (record.breakTime || 0));
    return Math.round((workMinutes / 60) * 100) / 100;
  };

  // Экспорт: скачать файл
  const handleExportDownload = () => {
    exportStaffAttendance(records, getCurrentPeriod());
  };

  // Экспорт: отправить на email
  const handleExportEmail = async () => {
    try {
      await axios.post('exports/staff-attendance', { action: 'email' });
      console.log('Документ отправлен на почту администратора');
    } catch (e) {
      console.error('Ошибка отправки на почту');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Посещаемость сотрудников
        </Typography>
        <Box mb={2}>
          <ExportMenuButton
            onDownload={handleExportDownload}
            onSendEmail={handleExportEmail}
            label="Экспортировать табель"
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Статистика */}
        {attendanceStats && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Всего дней
                  </Typography>
                  <Typography variant="h5">
                    {attendanceStats.totalDays}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Присутствовали
                  </Typography>
                  <Typography variant="h5">
                    {attendanceStats.presentDays}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Опоздания
                  </Typography>
                  <Typography variant="h5">
                    {attendanceStats.lateDays}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Среднее время работы
                  </Typography>
                  <Typography variant="h5">
                    {attendanceStats.averageWorkHours.toFixed(1)}ч
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Быстрые действия для сотрудников */}
        {!isAdmin && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Быстрые действия
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrow />}
                  onClick={handleCheckIn}
                  disabled={checkingIn || !canCheckIn(todayRecord || undefined)}
                >
                  Отметить приход
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<Stop />}
                  onClick={handleCheckOut}
                  disabled={checkingOut || !canCheckOut(todayRecord || undefined)}
                >
                  Отметить уход
                </Button>
              </Box>
              {todayRecord && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    Статус: <Chip 
                      label={getStatusText(todayRecord.status)} 
                      color={getStatusColor(todayRecord.status)} 
                      size="small" 
                    />
                  </Typography>
                  {todayRecord.actualStart && (
                    <Typography variant="body2">
                      Время прихода: {todayRecord.actualStart}
                    </Typography>
                  )}
                  {todayRecord.actualEnd && (
                    <Typography variant="body2">
                      Время ухода: {todayRecord.actualEnd}
                    </Typography>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Фильтры */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <DatePicker
                label="Дата"
                value={selectedDate}
                onChange={(newValue) => newValue && setSelectedDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Сотрудник</InputLabel>
                <Select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  label="Сотрудник"
                >
                  <MenuItem value="all">Все сотрудники</MenuItem>
                  {staff.map((s) => (
                    <MenuItem key={s.id || s._id} value={s.id || s._id}>
                      {s.fullName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth>
                <InputLabel>Группа</InputLabel>
                <Select
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  label="Группа"
                >
                  <MenuItem value="all">Все группы</MenuItem>
                  {groups.map((g) => (
                    <MenuItem key={g.id || g._id} value={g.id || g._id}>
                      {g.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                fullWidth
                onClick={() => console.log('Экспорт в разработке')}
              >
                Экспорт
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Таблица посещаемости */}
        <Paper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Группа</TableCell>
                <TableCell>Тип смены</TableCell>
                <TableCell>Запланировано</TableCell>
                <TableCell>Фактически</TableCell>
                <TableCell>Часы работы</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Опоздание</TableCell>
                <TableCell>Сверхурочные</TableCell>
                <TableCell>Учет времени</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((record) => (
                <TableRow key={record._id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        src={getStaffAvatar(record.staffId)}
                        sx={{ width: 32, height: 32 }}
                      />
                      <span>{getStaffName(record.staffId)}</span>
                    </Box>
                  </TableCell>
                  <TableCell>{getGroupName(record.groupId)}</TableCell>
                  <TableCell>{getShiftTypeText(record.shiftType)}</TableCell>
                  <TableCell>
                    {record.startTime} - {record.endTime}
                  </TableCell>
                  <TableCell>
                    {record.actualStart || '-'} - {record.actualEnd || '-'}
                  </TableCell>
                  <TableCell>{calculateWorkHours(record)}ч</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(record.status)}
                      color={getStatusColor(record.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {record.lateMinutes ? formatTime(record.lateMinutes) : '-'}
                  </TableCell>
                  <TableCell>
                    {record.overtimeMinutes ? formatTime(record.overtimeMinutes) : '-'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexDirection="column" gap={0.5}>
                      <Typography variant="caption" color="textSecondary">
                        Приход: {record.actualStart || '-'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Уход: {record.actualEnd || '-'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {records.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    Нет данных для отображения
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Paper>

        {/* FAB для создания смены (только для админов) */}
        {isAdmin && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setDialogOpen(true)}
          >
            <Add />
          </Fab>
        )}

        {/* Диалог создания смены */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Создать смену</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Сотрудник</InputLabel>
                  <Select
                    value={newShift.staffId}
                    onChange={(e) => setNewShift({ ...newShift, staffId: e.target.value })}
                    label="Сотрудник"
                  >
                    {staff.map((s) => (
                      <MenuItem key={s.id || s._id} value={s.id || s._id}>
                        {s.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Группа</InputLabel>
                  <Select
                    value={newShift.groupId}
                    onChange={(e) => setNewShift({ ...newShift, groupId: e.target.value })}
                    label="Группа"
                  >
                    <MenuItem value="">Без группы</MenuItem>
                    {groups.map((g) => (
                      <MenuItem key={g.id || g._id} value={g.id || g._id}>
                        {g.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Дата"
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel>Тип смены</InputLabel>
                  <Select
                    value={newShift.shiftType}
                    onChange={(e) => setNewShift({ ...newShift, shiftType: e.target.value as any })}
                    label="Тип смены"
                  >
                  
                    <MenuItem value="full">Полная</MenuItem>
                    <MenuItem value="overtime">Сверхурочная</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Начало смены"
                  type="time"
                  value={newShift.startTime}
                  onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Конец смены"
                  type="time"
                  value={newShift.endTime}
                  onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Примечания"
                  multiline
                  rows={3}
                  value={newShift.notes}
                  onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleCreateShift} variant="contained">
              Создать
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
};

export default StaffAttendanceNew;
