import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, Chip, IconButton, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Tabs, Tab, Avatar,
  Dialog
} from '@mui/material';
import {
  AccessTime, Edit, Visibility, Check,
   Schedule, Person
} from '@mui/icons-material';
import { getUsers } from '../../services/users';
import shiftsApi from '../../services/shifts';
import { Shift } from '../../types/common';

// Интерфейс для записей учета времени
  interface TimeRecord {
    id: string;
    staffId: string;
    staffName: string;
    date: string;
    checkInTime?: string;
    checkOutTime?: string;
    status: 'checked_in' | 'checked_out' | 'on_break' | 'overtime' | 'absent';
    workDuration?: number;
    breakDuration?: number;
    overtimeDuration?: number;
    type?: string; // Добавляем тип смены
    penalties: {
      late: { minutes: number; amount: number; reason?: string };
      earlyLeave: { minutes: number; amount: number; reason?: string };
      unauthorized: { amount: number; reason?: string };
    };
    bonuses: {
      overtime: { minutes: number; amount: number };
      punctuality: { amount: number; reason?: string };
    };
    location?: {
      checkIn?: { address?: string };
      checkOut?: { address?: string };
    };
    notes?: string;
  }

// Используем только смены (Shift) для учета посещаемости сотрудников

const StaffAttendanceTracking:React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState('');
  
 const shiftTypes = {
     full: 'Полный день',
     day_off: 'Выходной',
     vacation: 'Отпуск',
     sick_leave: 'Больничный',
     overtime: 'Сверхурочная'
   };
 
  const statusColors = {
    checked_in: 'info',
    checked_out: 'success',
    on_break: 'warning',
    overtime: 'primary',
    absent: 'error'
  } as const;

  const statusLabels = {
    checked_in: 'Пришел',
    checked_out: 'Ушел',
    on_break: 'Перерыв',
    overtime: 'Сверхурочные',
    absent: 'Отсутствует'
  };

  const attendanceStatusColors = {
    scheduled: 'default',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
    no_show: 'error',
    late: 'warning',
    confirmed: 'success'
  };

  const attendanceStatusLabels = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
    no_show: 'Не явился',
    late: 'Опоздание',
    confirmed: 'Подтверждено'
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await getUsers();
  setStaffList(users);
      } catch {
        setStaffList([]);
      }
    };
    fetchStaff();
  }, []);

  const getStaffName = (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId || s._id === staffId);
    return staff?.fullName || 'Неизвестно';
 };

  // Загрузка смен сотрудников (учет посещаемости)
       useEffect(() => {
         const fetchRecords = async () => {
           setLoading(true);
           try {
             let filters: any = {};
             if (selectedStaff !== 'all') filters.staffId = selectedStaff;
             if (dateRange.from) filters.startDate = dateRange.from;
             if (dateRange.to) filters.endDate = dateRange.to;
             
             const records = await shiftsApi.getAll(filters);
             
             // Преобразуем данные смен для отображения в таблице
             const transformedRecords = records.map((shift: Shift) => {
               // Преобразуем статусы смен в статусы TimeRecord
               const statusMap: Record<string, TimeRecord['status']> = {
                 'scheduled': 'absent', // Запланированная смена - сотрудник еще не пришел
                 'in_progress': 'on_break',
                 'completed': 'checked_out',
                 'cancelled': 'absent',
                 'no_show': 'absent',
                 'confirmed': 'checked_in',
                 'late': 'on_break'
               };
               
               return {
                 id: shift._id || shift.id || '',
                 staffId: shift.staffId,
                 staffName: shift.staffName || (shift.staffId && typeof shift.staffId === 'object' && '_id' in shift.staffId ? (shift.staffId as any).fullName : getStaffName(shift.staffId)),
                 date: shift.date,
                 checkInTime: shift.startTime,
                 checkOutTime: shift.endTime,
                 status: statusMap[shift.status] || 'checked_in',
                 type: shift.type,
                 workDuration: shift.startTime && shift.endTime ?
                   calculateWorkDuration(shift.startTime, shift.endTime, 0) : 0,
                 notes: shift.notes || '',
                 // Инициализируем penalties и bonuses как пустые объекты для смен
                 penalties: {
                   late: { minutes: 0, amount: 0 },
                   earlyLeave: { minutes: 0, amount: 0 },
                   unauthorized: { amount: 0 }
                 },
                 bonuses: {
                   overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
                   punctuality: { amount: 0 }
                 }
               };
             });
             
             setRecords(transformedRecords);
             setAttendanceRecords(records);
           } catch (e) {
             console.error('Error fetching records:', e);
             setRecords([]);
             setAttendanceRecords([]);
           } finally {
             setLoading(false);
           }
         };
         fetchRecords();
       }, [selectedStaff, dateRange]);
  
  const calculateWorkDuration = (start: string, end: string, breakTime: number = 0) => {
    const [startHours, startMinutes] = start.split(':').map(Number);
    const [endHours, endMinutes] = end.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    return Math.max(0, endTotalMinutes - startTotalMinutes - breakTime);
  };

  // Диалог отметки времени
  const [markDialogOpen, setMarkDialogOpen] = useState(false);
  const [markForm, setMarkForm] = useState({
    staffId: '',
    date: new Date().toISOString().slice(0, 10),
    checkInTime: '',
    checkOutTime: '',
    status: 'checked_in',
    notes: ''
  });

  const handleOpenMarkDialog = () => {
    setMarkDialogOpen(true);
  };
  const handleCloseMarkDialog = () => {
    setMarkDialogOpen(false);
  };

  // ...
  
  // Вставьте этот блок в JSX диалога (DialogContent)
  // Адрес учреждения

  const handleMarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
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

  const handleCheckInSubmit = async (location?: { latitude: number; longitude: number; address?: string }) => {
    try {
      // Найти смену для текущего сотрудника и даты
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find(s => s.staffId === currentStaffId);
      if (myShift) {
        await shiftsApi.updateStatus(myShift.id, 'in_progress');
        setCheckInDialogOpen(false);
        // Обновить записи
        const updatedShifts = await shiftsApi.getAll(filters);
        setAttendanceRecords(updatedShifts);
      }
    } catch (error) {
      console.error('Error during check-in:', error);
    }
  };

  const handleCheckOut = async (staffId: string) => {
    try {
      setCurrentStaffId(staffId);
      setCheckOutDialogOpen(true);
    } catch (error) {
      console.error('Error initiating check-out:', error);
    }
  };

  const handleCheckOutSubmit = async (location?: { latitude: number; longitude: number; address?: string }) => {
    try {
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const shifts = await shiftsApi.getAll(filters);
      const myShift = shifts.find(s => s.staffId === currentStaffId);
      if (myShift) {
        await shiftsApi.updateStatus(myShift.id, 'completed');
        setCheckOutDialogOpen(false);
        // Обновить записи
        const updatedShifts = await shiftsApi.getAll(filters);
        setAttendanceRecords(updatedShifts);
      }
    } catch (error) {
      console.error('Error during check-out:', error);
    }
  };

  // Состояние для проверки "в зоне"

  const handleMarkSubmit = async () => {
      try {
        // Создаем новую смену через API
        await shiftsApi.create({
          staffId: markForm.staffId,
          date: markForm.date,
          startTime: markForm.checkInTime,
          endTime: markForm.checkOutTime,
          type: 'full', // по умолчанию полная смена
          notes: markForm.notes
        });
        
        setMarkDialogOpen(false);
        setMarkForm({
          staffId: '',
          date: new Date().toISOString().slice(0, 10),
          checkInTime: '',
          checkOutTime: '',
          status: 'checked_in',
          notes: ''
        });
        
        // Обновляем записи
        let filters: any = {};
        if (selectedStaff !== 'all') filters.staffId = selectedStaff;
        if (dateRange.from) filters.startDate = dateRange.from;
        if (dateRange.to) filters.endDate = dateRange.to;
        
        const records = await shiftsApi.getAll(filters);
        
        // Преобразуем данные смен для отображения в таблице
        const transformedRecords = records.map((shift: Shift) => {
          // Преобразуем статусы смен в статусы TimeRecord
          const statusMap: Record<string, TimeRecord['status']> = {
            'scheduled': 'checked_in',
            'in_progress': 'on_break',
            'completed': 'checked_out',
            'cancelled': 'absent',
            'no_show': 'absent',
            'confirmed': 'checked_in',
            'late': 'on_break'
          };
          
          return {
            id: shift._id || shift.id || '',
            staffId: shift.staffId,
            staffName: shift.staffName || getStaffName(shift.staffId),
            date: shift.date,
            checkInTime: shift.startTime,
            checkOutTime: shift.endTime,
            status: statusMap[shift.status] || 'checked_in',
            type: shift.type,
            workDuration: shift.startTime && shift.endTime ?
              calculateWorkDuration(shift.startTime, shift.endTime, 0) : 0,
            notes: shift.notes || '',
            // Инициализируем penalties и bonuses как пустые объекты для смен
            penalties: {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: {
              overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
              punctuality: { amount: 0 }
            }
          };
        });
        
        setRecords(transformedRecords);
      } catch {}
    };

  const calculateStats = () => {
    const totalRecords = records.length;
    // Для статусов TimeRecord используем правильное значение
    const completedRecords = records.filter(r => r.status === 'checked_out').length;
    const totalPenalties = records.reduce((sum, r) =>
      sum + (r.penalties?.late?.amount || 0) + (r.penalties?.earlyLeave?.amount || 0) + (r.penalties?.unauthorized?.amount || 0), 0
    );
    const totalBonuses = records.reduce((sum, r) =>
      sum + (r.bonuses?.overtime?.amount || 0) + (r.bonuses?.punctuality?.amount || 0), 0
    );
    const avgWorkHours = records.length > 0
      ? records.reduce((sum, r) => sum + (r.workDuration || 0), 0) / records.length / 60
      : 0;

    return { totalRecords, completedRecords, totalPenalties, totalBonuses, avgWorkHours };
  };

  const stats = calculateStats();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const handleEditRecord = (record: TimeRecord) => {
    setSelectedRecord(record);
    setEditDialogOpen(true);
 };

  const handleSaveRecord = async () => {
      if (!selectedRecord) return;
      
      try {
        // Обновляем смену через API
        await shiftsApi.update(selectedRecord.id, {
          startTime: selectedRecord.checkInTime,
          endTime: selectedRecord.checkOutTime,
          notes: selectedRecord.notes
        });
        
        // Обновляем записи
        let filters: any = {};
        if (selectedStaff !== 'all') filters.staffId = selectedStaff;
        if (dateRange.from) filters.startDate = dateRange.from;
        if (dateRange.to) filters.endDate = dateRange.to;
        
        const records = await shiftsApi.getAll(filters);
        
        // Преобразуем данные смен для отображения в таблице
        const transformedRecords = records.map((shift: Shift) => {
          // Преобразуем статусы смен в статусы TimeRecord
          const statusMap: Record<string, TimeRecord['status']> = {
            'scheduled': 'checked_in',
            'in_progress': 'on_break',
            'completed': 'checked_out',
            'cancelled': 'absent',
            'no_show': 'absent',
            'confirmed': 'checked_in',
            'late': 'on_break'
          };
          
          return {
            id: shift._id || shift.id || '',
            staffId: shift.staffId,
            staffName: shift.staffName || getStaffName(shift.staffId),
            date: shift.date,
            checkInTime: shift.startTime,
            checkOutTime: shift.endTime,
            status: statusMap[shift.status] || 'checked_in',
            type: shift.type,
            workDuration: shift.startTime && shift.endTime ?
              calculateWorkDuration(shift.startTime, shift.endTime, 0) : 0,
            notes: shift.notes || '',
            // Инициализируем penalties и bonuses как пустые объекты для смен
            penalties: {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: {
              overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
              punctuality: { amount: 0 }
            }
          };
        });
        
        setRecords(transformedRecords);
        setEditDialogOpen(false);
        setSelectedRecord(null);
      } catch (e) {
        console.error('Error saving record:', e);
      }
    };

  const handleDeleteRecord = async (id: string) => {
      try {
        // Удаляем смену через API
        await shiftsApi.deleteItem(id);
        
        // Обновляем записи
        let filters: any = {};
        if (selectedStaff !== 'all') filters.staffId = selectedStaff;
        if (dateRange.from) filters.startDate = dateRange.from;
        if (dateRange.to) filters.endDate = dateRange.to;
        
        const records = await shiftsApi.getAll(filters);
        
        // Преобразуем данные смен для отображения в таблице
        const transformedRecords = records.map((shift: Shift) => {
          // Преобразуем статусы смен в статусы TimeRecord
          const statusMap: Record<string, TimeRecord['status']> = {
            'scheduled': 'checked_in',
            'in_progress': 'on_break',
            'completed': 'checked_out',
            'cancelled': 'absent',
            'no_show': 'absent',
            'confirmed': 'checked_in',
            'late': 'on_break'
          };
          
          return {
            id: shift._id || shift.id || '',
            staffId: shift.staffId,
            staffName: shift.staffName || getStaffName(shift.staffId),
            date: shift.date,
            checkInTime: shift.startTime,
            checkOutTime: shift.endTime,
            status: statusMap[shift.status] || 'checked_in',
            type: shift.type,
            workDuration: shift.startTime && shift.endTime ?
              calculateWorkDuration(shift.startTime, shift.endTime, 0) : 0,
            notes: shift.notes || '',
            // Инициализируем penalties и bonuses как пустые объекты для смен
            penalties: {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: {
              overtime: { minutes: 0, amount: 0 }, // Не добавляем сверхурочные в смену
              punctuality: { amount: 0 }
            }
          };
        });
        
        setRecords(transformedRecords);
      } catch (e) {
        console.error('Error deleting record:', e);
      }
   };

  const renderOverviewTab = () => (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Всего записей</Typography>
              <Typography variant="h4">{stats.totalRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Завершено</Typography>
              <Typography variant="h4">{stats.completedRecords}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">Штрафы</Typography>
              <Typography variant="h5">{formatCurrency(stats.totalPenalties)}</Typography>
            </CardContent>
          </Card>
        </Grid>

      </Grid>
  
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Смена</TableCell>
              <TableCell>Время работы</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Адрес</TableCell>
              <TableCell align="right">Штрафы</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    {record.staffName || getStaffName(record.staffId)}
                  </Box>
                </TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                                <Box>
                                  <Typography variant="body2">{shiftTypes[record.type as keyof typeof shiftTypes] || shiftTypes['full']}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {record.checkInTime || '-'} - {record.checkOutTime || '-'}
                                  </Typography>
                                </Box>
                              </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{formatTime(record.workDuration || 0)}</Typography>
                    {record.penalties?.late?.minutes > 0 && (
                                        <Chip
                                          label={`Опоздание: ${record.penalties.late.minutes}м`}
                                          size="small"
                                          color="warning"
                                          sx={{ mr: 0.5, mt: 0.5 }}
                                        />
                                      )}
                                      {record.penalties?.earlyLeave?.minutes > 0 && (
                                        <Chip
                                          label={`Ранний уход: ${record.penalties.earlyLeave.minutes}м`}
                                          size="small"
                                          color="warning"
                                          sx={{ mr: 0.5, mt: 0.5 }}
                                        />
                                      )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[record.status as keyof typeof statusLabels] || attendanceStatusLabels[record.status as keyof typeof attendanceStatusLabels] || record.status}
                    color={attendanceStatusColors[record.status as keyof typeof attendanceStatusColors] as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error">
                    {formatCurrency(
                      (record.penalties?.late?.amount || 0) +
                      (record.penalties?.earlyLeave?.amount || 0) +
                      (record.penalties?.unauthorized?.amount || 0)
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(
                      (record.bonuses?.overtime?.amount || 0) +
                      (record.bonuses?.punctuality?.amount || 0)
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEditRecord(record)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDeleteRecord(record.id)}>
                    <Visibility />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
  

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AccessTime sx={{ mr: 1, verticalAlign: 'middle' }} />
          Учет рабочего времени
        </Typography>
        <Button variant="contained" startIcon={<Schedule />} onClick={handleOpenMarkDialog}>
          Создать смену
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center" flexWrap="wrap">
          {tabValue !== 3 && tabValue !== 4 && (
            <>
              <TextField
                label="Дата с"
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label="Дата по"
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
            </>
          )}
          {(tabValue === 3 || tabValue === 4) && (
            <TextField
              label="Дата"
              type="date"
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
              label="Сотрудник"
              onChange={(e) => setSelectedStaff(e.target.value)}
            >
              <MenuItem value="all">Все сотрудники</MenuItem>
              {staffList.map((staff: any) => (
                <MenuItem key={staff.id} value={staff.id}>{staff.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
          <Tab label="Обзор" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderOverviewTab()}
        </Box>
      </Paper>

      {/* Mark Dialog */}
      <Dialog open={markDialogOpen} onClose={handleCloseMarkDialog}>
        <DialogTitle>Отметить рабочее время</DialogTitle>
        <DialogContent>
          {/* TODO: добавить поля для выбора сотрудника, даты, времени, статуса, комментария */}
          <TextField
            label="Сотрудник"
            name="staffId"
            select
            value={markForm.staffId}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
          >
            {staffList.map((staff: any) => (
              <MenuItem key={staff.id} value={staff.id}>{staff.fullName}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Дата"
            name="date"
            type="date"
            value={markForm.date}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Время прихода"
            name="checkInTime"
            type="time"
            value={markForm.checkInTime}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Время ухода"
            name="checkOutTime"
            type="time"
            value={markForm.checkOutTime}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Статус"
            name="status"
            select
            value={markForm.status}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
          >
            <MenuItem value="checked_in">Пришел</MenuItem>
            <MenuItem value="checked_out">Ушел</MenuItem>
            <MenuItem value="on_break">Перерыв</MenuItem>
            <MenuItem value="overtime">Переработка</MenuItem>
            <MenuItem value="absent">Отсутствует</MenuItem>
          </TextField>
          <TextField
            label="Комментарий"
            name="notes"
            value={markForm.notes}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
            multiline
            minRows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkDialog}>Отмена</Button>
          <Button variant="contained" onClick={handleMarkSubmit}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать запись</DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Сотрудник"
                  value={selectedRecord.staffName}
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Дата"
                  type="date"
                  value={selectedRecord.date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Статус"
                  select
                  value={selectedRecord.status}
                  onChange={(e) => setSelectedRecord({...selectedRecord, status: e.target.value as any})}
                  fullWidth
                >
                  {Object.entries(statusLabels).map(([key, label]) => (
                    <MenuItem key={key} value={key}>{label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Время прихода"
                  type="time"
                  value={selectedRecord.checkInTime || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, checkInTime: e.target.value})}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Время ухода"
                  type="time"
                  value={selectedRecord.checkOutTime || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, checkOutTime: e.target.value})}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Примечания"
                  multiline
                  rows={3}
                  value={selectedRecord.notes || ''}
                  onChange={(e) => setSelectedRecord({...selectedRecord, notes: e.target.value})}
                  fullWidth
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button variant="contained" onClick={handleSaveRecord}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onClose={() => setCheckInDialogOpen(false)}>
        <DialogTitle>Отметить приход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить приход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckInDialogOpen(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={() => handleCheckInSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>

      {/* Check-out Dialog */}
      <Dialog open={checkOutDialogOpen} onClose={() => setCheckOutDialogOpen(false)}>
        <DialogTitle>Отметить уход</DialogTitle>
        <DialogContent>
          <Typography>Вы уверены, что хотите отметить уход?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckOutDialogOpen(false)}>Отмена</Button>
          <Button 
            variant="contained" 
            onClick={() => handleCheckOutSubmit()}
            startIcon={<Check />}
          >
            Подтвердить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffAttendanceTracking;