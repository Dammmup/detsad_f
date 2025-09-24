import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, Circle } from 'react-yandex-maps';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
 Card, CardContent, Grid, Chip, IconButton, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert,
  Tabs, Tab, Avatar, Slider, Switch, FormGroup, FormControlLabel, Typography as MuiTypography,
  Dialog
} from '@mui/material';
import {
  AccessTime, Edit, Visibility, Warning,
   Schedule, Person, AddLocation, Settings, Check
} from '@mui/icons-material';
import { getUsers } from '../../services/api/users';
import { 
  getStaffAttendance, 
  saveStaffAttendance, 
  checkIn, 
  checkOut,
  StaffAttendanceRecord
} from '../../services/api/staffAttendance';

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

// Интерфейс для записей посещаемости
interface AttendanceRecord extends StaffAttendanceRecord {
  staffName: string;
  workDuration?: number;
  penalties?: {
    late: { minutes: number; amount: number; reason?: string };
    earlyLeave: { minutes: number; amount: number; reason?: string };
    unauthorized: { amount: number; reason?: string };
  };
  bonuses?: {
    overtime: { minutes: number; amount: number };
    punctuality: { amount: number; reason?: string };
  };
}

const StaffAttendanceTracking:React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
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
 const [inZone, setInZone] = useState(true);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [checkOutDialogOpen, setCheckOutDialogOpen] = useState(false);
  const [currentStaffId, setCurrentStaffId] = useState('');
  
 const shiftTypes = {
    full: 'Полный день'
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
    late: 'warning'
  };

  const attendanceStatusLabels = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
    no_show: 'Не явился',
    late: 'Опоздание'
  };

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const users = await getUsers();
        setStaffList(users.filter((u: any) => u.type === 'adult'));
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

  // Загрузка реальных данных учета времени с backend
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedStaff !== 'all') params.append('staffId', selectedStaff);
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
        const res = await fetch(`/api/staff-time-tracking?${params.toString()}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          // Преобразуем данные для соответствия интерфейсу
          const transformedRecords = json.data.map((record: any) => ({
            ...record,
            id: record._id || record.id || '', // Используем _id или id в зависимости от доступности
            staffName: getStaffName(record.staffId),
            // Инициализируем penalties и bonuses если их нет
            penalties: record.penalties || {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: record.bonuses || {
              overtime: { minutes: 0, amount: 0 },
              punctuality: { amount: 0 }
            }
          }));
          setRecords(transformedRecords);
        } else {
          setRecords([]);
        }
      } catch (e) {
        console.error('Error fetching records:', e);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [selectedStaff, dateRange]);

  // Загрузка данных посещаемости
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      try {
        const filters: any = { date };
        if (selectedStaff !== 'all') {
          filters.staffId = selectedStaff;
        }
        
        const attendanceRecords = await getStaffAttendance(filters);
        
        // Преобразуем данные для соответствия интерфейсу
        const transformedRecords = attendanceRecords.map((record: any) => ({
          ...record,
          staffName: getStaffName(record.staffId),
          workDuration: record.actualEnd && record.actualStart ? 
            calculateWorkDuration(record.actualStart, record.actualEnd, record.breakTime) : 0,
          penalties: {
            late: { 
              minutes: record.lateMinutes || 0, 
              amount: (record.lateMinutes || 0) * 500 // Пример расчета штрафа
            },
            earlyLeave: { 
              minutes: record.earlyLeaveMinutes || 0, 
              amount: (record.earlyLeaveMinutes || 0) * 500 // Пример расчета штрафа
            },
            unauthorized: { amount: 0 }
          },
          bonuses: {
            overtime: { 
              minutes: record.overtimeMinutes || 0, 
              amount: (record.overtimeMinutes || 0) * 700 // Пример расчета премии
            },
            punctuality: { amount: 0 }
          }
        }));
        
        setAttendanceRecords(transformedRecords);
      } catch (e) {
        console.error('Error fetching attendance records:', e);
        setAttendanceRecords([]);
      }
    };
    fetchAttendanceRecords();
  }, [date, selectedStaff]);

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
    notes: '',
    location: {
      address: '',
      radius: '50'
    }
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
    if (name === 'address' || name === 'radius') {
      setMarkForm({
        ...markForm,
        location: {
          ...markForm.location,
          [name]: value
        }
      });
    } else {
      setMarkForm({ ...markForm, [name]: value });
    }
  };

  // Геокодер для автозаполнения адреса
  const fetchAddressByCoords = async (lat: string, lon: string) => {
    try {
      // Убрано использование API Яндекса, так как он больше не нужен
      // const resp = await fetch(`https://geocode-maps.yandex.ru/1.x/?format=json&apikey=27f5e447-de11-4c83-8d7c-8fe75da25a7a&geocode=${lon},${lat}`);
      // const data = await resp.json();
      // const address = data.response.GeoObjectCollection.featureMember?.[0]?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || '';
      // setMarkForm(form => ({ ...form, location: { ...form.location, address }));
    } catch {}
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
      const result = await checkIn(location);
      console.log('Check-in successful:', result);
      setCheckInDialogOpen(false);
      // Обновляем записи
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const attendanceRecords = await getStaffAttendance(filters);
      const transformedRecords = attendanceRecords.map((record: any) => ({
        ...record,
        staffName: getStaffName(record.staffId),
        workDuration: record.actualEnd && record.actualStart ? 
          calculateWorkDuration(record.actualStart, record.actualEnd, record.breakTime) : 0,
        penalties: {
          late: { 
            minutes: record.lateMinutes || 0, 
            amount: (record.lateMinutes || 0) * 500
          },
          earlyLeave: { 
            minutes: record.earlyLeaveMinutes || 0, 
            amount: (record.earlyLeaveMinutes || 0) * 500
          },
          unauthorized: { amount: 0 }
        },
        bonuses: {
          overtime: { 
            minutes: record.overtimeMinutes || 0, 
            amount: (record.overtimeMinutes || 0) * 700
          },
          punctuality: { amount: 0 }
        }
      }));
      setAttendanceRecords(transformedRecords);
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
      const result = await checkOut(location);
      console.log('Check-out successful:', result);
      setCheckOutDialogOpen(false);
      // Обновляем записи
      const filters: any = { date };
      if (selectedStaff !== 'all') {
        filters.staffId = selectedStaff;
      }
      const attendanceRecords = await getStaffAttendance(filters);
      const transformedRecords = attendanceRecords.map((record: any) => ({
        ...record,
        staffName: getStaffName(record.staffId),
        workDuration: record.actualEnd && record.actualStart ? 
          calculateWorkDuration(record.actualStart, record.actualEnd, record.breakTime) : 0,
        penalties: {
          late: { 
            minutes: record.lateMinutes || 0, 
            amount: (record.lateMinutes || 0) * 500
          },
          earlyLeave: { 
            minutes: record.earlyLeaveMinutes || 0, 
            amount: (record.earlyLeaveMinutes || 0) * 500
          },
          unauthorized: { amount: 0 }
        },
        bonuses: {
          overtime: { 
            minutes: record.overtimeMinutes || 0, 
            amount: (record.overtimeMinutes || 0) * 700
          },
          punctuality: { amount: 0 }
        }
      }));
      setAttendanceRecords(transformedRecords);
    } catch (error) {
      console.error('Error during check-out:', error);
    }
  };

  // Состояние для проверки "в зоне"

  const handleMarkSubmit = async () => {
    try {
      const res = await fetch('/api/staff-time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markForm)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setMarkDialogOpen(false);
        setMarkForm({
          staffId: '',
          date: new Date().toISOString().slice(0, 10),
          checkInTime: '',
          checkOutTime: '',
          status: 'checked_in',
          notes: '',
          location: { address: '', radius: '50' }
        });
        // Перезагрузить записи
        const params = new URLSearchParams();
        if (selectedStaff !== 'all') params.append('staffId', selectedStaff);
        // if (selectedMonth) {
        //   const [year, month] = selectedMonth.split('-');
        //   const from = `${year}-${month}-01`;
        //   const to = `${year}-${month}-${new Date(Number(year), Number(month), 0).getDate()}`;
        //   params.append('from', from);
        //   params.append('to', to);
        // }

        // Перезагрузить записи
        const params2 = new URLSearchParams();
        if (selectedStaff !== 'all') params2.append('staffId', selectedStaff);
        params2.append('from', dateRange.from);
        params2.append('to', dateRange.to);
        const res2 = await fetch(`/api/staff-time-tracking?${params2.toString()}`);
        const json2 = await res2.json();
        if (res2.ok && json2.success && json2.data) {
          // Преобразуем данные для соответствия интерфейсу
          const transformedRecords = json2.data.map((record: any) => ({
            ...record,
            id: record._id || record.id || '', // Используем _id или id в зависимости от доступности
            staffName: getStaffName(record.staffId),
            // Инициализируем penalties и bonuses если их нет
            penalties: record.penalties || {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: record.bonuses || {
              overtime: { minutes: 0, amount: 0 },
              punctuality: { amount: 0 }
            }
          }));
          setRecords(transformedRecords);
        }
      }
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
      const res = await fetch(`/api/staff-time-tracking/${selectedRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...selectedRecord,
          checkInTime: selectedRecord.checkInTime || undefined,
          checkOutTime: selectedRecord.checkOutTime || undefined,
          notes: selectedRecord.notes || undefined
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Перезагрузить записи
        const params = new URLSearchParams();
        if (selectedStaff !== 'all') params.append('staffId', selectedStaff);
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
        const res = await fetch(`/api/staff-time-tracking?${params.toString()}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          // Преобразуем данные для соответствия интерфейсу
          const transformedRecords = json.data.map((record: any) => ({
            ...record,
            id: record._id || record.id || '', // Используем _id или id в зависимости от доступности
            staffName: getStaffName(record.staffId),
            // Инициализируем penalties и bonuses если их нет
            penalties: record.penalties || {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: record.bonuses || {
              overtime: { minutes: 0, amount: 0 },
              punctuality: { amount: 0 }
            }
          }));
          setRecords(transformedRecords);
        }
        setEditDialogOpen(false);
        setSelectedRecord(null);
      }
    } catch (e) {
      console.error('Error saving record:', e);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/staff-time-tracking/${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (res.ok && json.success) {
        // Удаляем запись из списка
        // Перезагрузить записи
        const params = new URLSearchParams();
        if (selectedStaff !== 'all') params.append('staffId', selectedStaff);
        params.append('from', dateRange.from);
        params.append('to', dateRange.to);
        const res = await fetch(`/api/staff-time-tracking?${params.toString()}`);
        const json = await res.json();
        if (res.ok && json.success && json.data) {
          // Преобразуем данные для соответствия интерфейсу
          const transformedRecords = json.data.map((record: any) => ({
            ...record,
            id: record._id || record.id || '', // Используем _id или id в зависимости от доступности
            staffName: getStaffName(record.staffId),
            // Инициализируем penalties и bonuses если их нет
            penalties: record.penalties || {
              late: { minutes: 0, amount: 0 },
              earlyLeave: { minutes: 0, amount: 0 },
              unauthorized: { amount: 0 }
            },
            bonuses: record.bonuses || {
              overtime: { minutes: 0, amount: 0 },
              punctuality: { amount: 0 }
            }
          }));
          setRecords(transformedRecords);
        }
      }
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
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Премии</Typography>
              <Typography variant="h5">{formatCurrency(stats.totalBonuses)}</Typography>
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
              <TableCell align="right">Премии</TableCell>
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
                    {record.staffName}
                  </Box>
                </TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{shiftTypes['full']}</Typography>
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
                    {(record.overtimeDuration || 0) > 0 && (
                      <Chip
                        label={`Сверхурочные: ${record.overtimeDuration || 0}м`}
                        size="small"
                        color="info"
                        sx={{ mr: 0.5, mt: 0.5 }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[record.status]}
                    color={statusColors[record.status]}
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

  const renderAttendanceTab = () => (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Смена</TableCell>
              <TableCell>Время работы</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record._id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                      <Person />
                    </Avatar>
                    {record.staffName}
                  </Box>
                </TableCell>
                <TableCell>{new Date(record.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {record.startTime} - {record.endTime}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.shiftType === 'full' ? 'Полная смена' : 'Сверхурочная'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">
                      {record.actualStart || '-'} - {record.actualEnd || '-'}
                    </Typography>
                    {record.workDuration !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(record.workDuration)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={attendanceStatusLabels[record.status]}
                    color={attendanceStatusColors[record.status] as any}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  {record.status === 'scheduled' && (
                    <Button 
                      variant="contained" 
                      size="small" 
                      onClick={() => handleCheckIn(record.staffId)}
                      sx={{ mr: 1 }}
                    >
                      Приход
                    </Button>
                  )}
                  {record.status === 'in_progress' && (
                    <Button 
                      variant="contained" 
                      color="success"
                      size="small" 
                      onClick={() => handleCheckOut(record.staffId)}
                    >
                      Уход
                    </Button>
                  )}
                  <IconButton size="small" onClick={() => {
                    // Преобразуем AttendanceRecord в TimeRecord для редактирования
                    const timeRecord: TimeRecord = {
                      id: record._id || '', // Используем _id
                      staffId: record.staffId,
                      staffName: record.staffName,
                      date: record.date,
                      status: 'checked_in', // Значение по умолчанию
                      penalties: record.penalties || {
                        late: { minutes: 0, amount: 0 },
                        earlyLeave: { minutes: 0, amount: 0 },
                        unauthorized: { amount: 0 }
                      },
                      bonuses: record.bonuses || {
                        overtime: { minutes: 0, amount: 0 },
                        punctuality: { amount: 0 }
                      }
                    };
                    handleEditRecord(timeRecord);
                  }}>
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );

  const renderPenaltiesTab = () => (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Система автоматических штрафов: опоздание - 500₸/мин, ранний уход - 500₸/мин
      </Alert>
      
      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Дата</TableCell>
              <TableCell>Тип нарушения</TableCell>
              <TableCell>Время</TableCell>
              <TableCell align="right">Сумма штрафа</TableCell>
              <TableCell>Причина</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {records.flatMap(record => {
              const penalties = [];
              if ((record.penalties?.late?.amount || 0) > 0) {
                penalties.push({
                  ...record,
                  type: 'Опоздание',
                  minutes: record.penalties.late.minutes,
                  amount: record.penalties.late.amount,
                  reason: record.penalties.late.reason
                });
              }
              if ((record.penalties?.earlyLeave?.amount || 0) > 0) {
                penalties.push({
                  ...record,
                  type: 'Ранний уход',
                  minutes: record.penalties.earlyLeave.minutes,
                  amount: record.penalties.earlyLeave.amount,
                  reason: record.penalties.earlyLeave.reason
                });
              }
              if ((record.penalties?.unauthorized?.amount || 0) > 0) {
                penalties.push({
                  ...record,
                  type: 'Несанкционированный выход',
                  minutes: 0,
                  amount: record.penalties.unauthorized.amount,
                  reason: record.penalties.unauthorized.reason
                });
              }
              return penalties;
            }).map((penalty, index) => (
              <TableRow key={index}>
                <TableCell>{penalty.staffName}</TableCell>
                <TableCell>{new Date(penalty.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>
                  <Chip
                    label={penalty.type}
                    color="warning"
                    size="small"
                    icon={<Warning />}
                  />
                </TableCell>
                <TableCell>{penalty.minutes || 0} минут</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error" fontWeight="bold">
                    {formatCurrency(penalty.amount)}
                  </Typography>
                </TableCell>
                <TableCell>{penalty.reason || '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Эффективность по сотрудникам</Typography>
              <Table>
                <TableHead>
                  <TableRow>
    <TableCell>Сотрудник</TableCell>
                    <TableCell align="right">Отработано</TableCell>
                    <TableCell align="right">Среднее время</TableCell>
                    <TableCell align="right">Эффективность</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {staffList.map(staff => {
                    const staffRecords = records.filter(r => r.staffId === staff.id);
                    const totalWorkMinutes = staffRecords.reduce((sum, r) => sum + (r.workDuration || 0), 0);
                    const avgWorkMinutes = staffRecords.length > 0 ? totalWorkMinutes / staffRecords.length : 0;
                    // Для статусов TimeRecord используем правильное значение
                    const completedRecords = staffRecords.filter(r => r.status === 'checked_out').length;
                    const efficiency = staffRecords.length > 0 ? Math.round((completedRecords / staffRecords.length) * 100) : 0;
                    
                    return (
                      <TableRow key={staff.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, width: 32, height: 32, fontSize: 14 }}>
                              {staff.fullName.charAt(0)}
                            </Avatar>
                            {staff.fullName}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{formatTime(totalWorkMinutes)}</TableCell>
                        <TableCell align="right">{formatTime(avgWorkMinutes)}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${efficiency}%`}
                            color={efficiency >= 90 ? 'success' : efficiency >= 70 ? 'warning' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Финансовая аналитика</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Показатель</TableCell>
                    <TableCell align="right">Значение</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Общие штрафы</TableCell>
                    <TableCell align="right" color="error.main">
                      {formatCurrency(stats.totalPenalties)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Общие премии</TableCell>
                    <TableCell align="right" color="success.main">
                      {formatCurrency(stats.totalBonuses)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Чистый результат</TableCell>
                    <TableCell align="right" color={stats.totalBonuses >= stats.totalPenalties ? 'success.main' : 'error.main'}>
                      {formatCurrency(stats.totalBonuses - stats.totalPenalties)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Статистика нарушений</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Тип нарушения</TableCell>
                    <TableCell align="right">Количество</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
    <TableCell>Опоздания</TableCell>
                    <TableCell align="right">
                      {records.filter(r => (r.penalties?.late?.amount || 0) > 0).length}
                    </TableCell>
                    <TableCell align="right" color="error.main">
                      {formatCurrency(records.reduce((sum, r) => sum + (r.penalties?.late?.amount || 0), 0))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Ранний уход</TableCell>
                    <TableCell align="right">
                      {records.filter(r => (r.penalties?.earlyLeave?.amount || 0) > 0).length}
                    </TableCell>
                    <TableCell align="right" color="error.main">
                      {formatCurrency(records.reduce((sum, r) => sum + (r.penalties?.earlyLeave?.amount || 0), 0))}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Несанкционированный выход</TableCell>
                    <TableCell align="right">
                      {records.filter(r => (r.penalties?.unauthorized?.amount || 0) > 0).length}
                    </TableCell>
                    <TableCell align="right" color="error.main">
                      {formatCurrency(records.reduce((sum, r) => sum + (r.penalties?.unauthorized?.amount || 0), 0))}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  const renderStatsTab = () => (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Всего смен</Typography>
              <Typography variant="h4">{attendanceRecords.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Завершено</Typography>
              <Typography variant="h4">
                {attendanceRecords.filter(r => r.status === 'completed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Опоздания</Typography>
              <Typography variant="h4">
                {attendanceRecords.filter(r => r.lateMinutes && r.lateMinutes > 0).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">Не явился</Typography>
              <Typography variant="h4">
                {attendanceRecords.filter(r => r.status === 'no_show').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell>Время прихода</TableCell>
              <TableCell>Время ухода</TableCell>
              <TableCell>Опоздание (мин)</TableCell>
              <TableCell>Сверхурочные (мин)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attendanceRecords.map((record) => (
              <TableRow key={record._id}>
                <TableCell>{record.staffName}</TableCell>
                <TableCell>
                  <Chip
                    label={attendanceStatusLabels[record.status]}
                    color={attendanceStatusColors[record.status] as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>{record.actualStart || '-'}</TableCell>
                <TableCell>{record.actualEnd || '-'}</TableCell>
                <TableCell>{record.lateMinutes || 0}</TableCell>
                <TableCell>{record.overtimeMinutes || 0}</TableCell>
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
          <Tab label="Штрафы и премии" />
          <Tab label="Аналитика" />
          <Tab label="Табель" />
          <Tab label="Статистика" />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderOverviewTab()}
          {tabValue === 1 && renderPenaltiesTab()}
          {tabValue === 2 && renderAnalyticsTab()}
          {tabValue === 3 && renderAttendanceTab()}
          {tabValue === 4 && renderStatsTab()}
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
          <TextField
            label="Адрес учреждения"
            name="address"
            value={markForm.location.address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setMarkForm({
                ...markForm,
                location: {
                  ...markForm.location,
                  address: e.target.value
                }
              });
            }}
            fullWidth
            margin="normal"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
            <Slider
              min={50}
              max={500}
              step={10}
              value={Number(markForm.location.radius) || 100}
              onChange={(_event: Event, value: number | number[]) => setMarkForm({ ...markForm, location: { ...markForm.location, radius: String(value) } })}
              valueLabelDisplay="auto"
              sx={{ width: 200 }}
            />
            <TextField
              label="Радиус (метры)"
              name="radius"
              type="number"
              value={markForm.location.radius || ''}
              onChange={e => setMarkForm({ ...markForm, location: { ...markForm.location, radius: e.target.value } })}
              sx={{ width: 120 }}
              inputProps={{ min: 50, max: 500, step: 10 }}
            />
          </Box>
          <Typography variant="caption" color="text.secondary">Можно задать радиус допустимой отметки с помощью ползунка или вручную (от 50 до 500 метров)</Typography>
          <Box sx={{ mt: 1 }}>
            <Typography variant="body2" color={inZone ? 'success.main' : 'error.main'}>
              {inZone ? 'Метка в зоне учреждения' : 'ВНЕ зоны учреждения!'}
            </Typography>
            </Box>
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