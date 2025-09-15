import React, { useState, useEffect } from 'react';
import { YMaps, Map, Placemark, Circle } from 'react-yandex-maps';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Alert,
  Tabs, Tab, Divider, Avatar, Stack, Slider
} from '@mui/material';
import { 
  AccessTime, Edit, Visibility, LocationOn, AttachMoney, Warning, 
  CheckCircle, Schedule, Person, TrendingUp 
} from '@mui/icons-material';
import { getUsers } from '../components/services/api/users';

interface TimeRecord {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  shiftType: 'morning' | 'evening' | 'night' | 'full';
  scheduledStart: string;
  scheduledEnd: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  workMinutes: number;
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
    checkIn?: { lat: number; lng: number; address?: string };
    checkOut?: { lat: number; lng: number; address?: string };
  };
  notes?: string;
}


const StaffTimeTracking: React.FC = () => {
  const [staffList, setStaffList] = useState<any[]>([]);

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

  const [records, setRecords] = useState<TimeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  // const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TimeRecord | null>(null);

  const shiftTypes = {
    morning: 'Утренняя смена',
    evening: 'Вечерняя смена',
    night: 'Ночная смена',
    full: 'Полный день'
  };

  const statusColors = {
    scheduled: 'default',
    in_progress: 'info',
    completed: 'success',
    cancelled: 'error',
    no_show: 'warning'
  } as const;

  const statusLabels = {
    scheduled: 'Запланировано',
    in_progress: 'В процессе',
    completed: 'Завершено',
    cancelled: 'Отменено',
    no_show: 'Не явился'
  };

  // Загрузка реальных данных учета времени с backend
  useEffect(() => {
    const fetchRecords = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (selectedStaff !== 'all') params.append('staffId', selectedStaff);
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const from = `${year}-${String(month).padStart(2, '0')}-01`;
        const to = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
        params.append('from', from);
        params.append('to', to);
        const res = await fetch(`/api/staff-time-tracking?${params.toString()}`);
        const json = await res.json();
        if (json.success) {
          setRecords(json.data);
        } else {
          setRecords([]);
        }
      } catch (e) {
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [selectedStaff]);

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
      latitude: '',
      longitude: '',
      address: '',
      radius: '100', // default 100m
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
  // <TextField label="Адрес учреждения" name="address" value={markForm.location.address} onChange={handleMarkChange} fullWidth margin="normal" />
  // <TextField label="Широта" name="latitude" value={markForm.location.latitude} onChange={handleMarkChange} fullWidth margin="normal" />
  // <TextField label="Долгота" name="longitude" value={markForm.location.longitude} onChange={handleMarkChange} fullWidth margin="normal" />

  const handleMarkChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | any) => {
    const { name, value } = e.target;
    if (name === 'latitude' || name === 'longitude' || name === 'address' || name === 'radius') {
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
      const resp = await fetch(`https://geocode-maps.yandex.ru/1.x/?format=json&apikey=27f5e447-de11-4c83-8d7c-8fe75da25a7a&geocode=${lon},${lat}`);
      const data = await resp.json();
      const address = data.response.GeoObjectCollection.featureMember?.[0]?.GeoObject?.metaDataProperty?.GeocoderMetaData?.text || '';
      setMarkForm(form => ({ ...form, location: { ...form.location, address } }));
    } catch {}
  };

  // Проверка попадания в радиус (frontend)
  function isInsideRadius(lat1: number, lon1: number, lat2: number, lon2: number, radius: number) {
    // Haversine formula
    const R = 6371000;
    const toRad = (d: number) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c <= radius;
  }

  // Состояние для проверки "в зоне"
  const [inZone, setInZone] = useState(true);

  // При изменении координат или радиуса — проверять попадание (например, сравнивать с "эталонной" точкой учреждения)
  useEffect(() => {
    const lat = Number(markForm.location.latitude);
    const lon = Number(markForm.location.longitude);
    const radius = Number(markForm.location.radius);
    // Для примера: эталонная точка учреждения (можно вынести в настройки)
    const refLat = 43.222;
    const refLon = 76.851;
    setInZone(isInsideRadius(refLat, refLon, lat, lon, radius));
  }, [markForm.location.latitude, markForm.location.longitude, markForm.location.radius]);


  const handleMarkSubmit = async () => {
    try {
      const res = await fetch('/api/staff-time-tracking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(markForm)
      });
      const json = await res.json();
      if (json.success) {
        setMarkDialogOpen(false);
        setMarkForm({
          staffId: '',
          date: new Date().toISOString().slice(0, 10),
          checkInTime: '',
          checkOutTime: '',
          status: 'checked_in',
          notes: '',
          location: { latitude: '', longitude: '', address: '', radius: '100' }
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
        const res2 = await fetch(`/api/staff-time-tracking?${params.toString()}`);
        const json2 = await res2.json();
        setRecords(json2.success ? json2.data : []);
      }
    } catch {}
  };


  const calculateStats = () => {
    const totalRecords = records.length;
    const completedRecords = records.filter(r => r.status === 'completed').length;
    const totalPenalties = records.reduce((sum, r) => 
      sum + r.penalties.late.amount + r.penalties.earlyLeave.amount + r.penalties.unauthorized.amount, 0
    );
    const totalBonuses = records.reduce((sum, r) => 
      sum + r.bonuses.overtime.amount + r.bonuses.punctuality.amount, 0
    );
    const avgWorkHours = records.length > 0 
      ? records.reduce((sum, r) => sum + r.workMinutes, 0) / records.length / 60
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
              <TableCell>Широта</TableCell>
              <TableCell>Долгота</TableCell>
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
                    <Typography variant="body2">{shiftTypes[record.shiftType]}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {record.scheduledStart} - {record.scheduledEnd}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2">{formatTime(record.workMinutes)}</Typography>
                    {record.lateMinutes > 0 && (
                      <Chip 
                        label={`Опоздание: ${record.lateMinutes}м`} 
                        size="small" 
                        color="warning"
                        sx={{ mr: 0.5, mt: 0.5 }}
                      />
                    )}
                    {record.overtimeMinutes > 0 && (
                      <Chip 
                        label={`Сверхурочные: ${record.overtimeMinutes}м`} 
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
                      record.penalties.late.amount + 
                      record.penalties.earlyLeave.amount + 
                      record.penalties.unauthorized.amount
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="success.main">
                    {formatCurrency(
                      record.bonuses.overtime.amount + 
                      record.bonuses.punctuality.amount
                    )}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleEditRecord(record)}>
                    <Edit />
                  </IconButton>
                  <IconButton size="small">
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
              if (record.penalties.late.amount > 0) {
                penalties.push({
                  ...record,
                  type: 'Опоздание',
                  minutes: record.penalties.late.minutes,
                  amount: record.penalties.late.amount,
                  reason: record.penalties.late.reason
                });
              }
              if (record.penalties.earlyLeave.amount > 0) {
                penalties.push({
                  ...record,
                  type: 'Ранний уход',
                  minutes: record.penalties.earlyLeave.minutes,
                  amount: record.penalties.earlyLeave.amount,
                  reason: record.penalties.earlyLeave.reason
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
                <TableCell>{penalty.minutes} минут</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" color="error" fontWeight="bold">
                    {formatCurrency(penalty.amount)}
                  </Typography>
                </TableCell>
                <TableCell>{penalty.reason}</TableCell>
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
        <Button variant="contained" startIcon={<Schedule />}>
          Создать смену
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          {/* <TextField
            label="Месяц"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
          /> */}
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
        </Tabs>
        <Box sx={{ p: 3 }}>
          {tabValue === 0 && renderOverviewTab()}
          {tabValue === 1 && renderPenaltiesTab()}
          {tabValue === 2 && (
            <Alert severity="info">
              Раздел аналитики в разработке
            </Alert>
          )}
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
          <YMaps>
            <Map defaultState={{ center: [Number(markForm.location.latitude) || 43.222, Number(markForm.location.longitude) || 76.851], zoom: 15 }} width="100%" height={300}>
              <Placemark
                geometry={markForm.location.latitude && markForm.location.longitude ? [Number(markForm.location.latitude), Number(markForm.location.longitude)] : [43.222, 76.851]}
                draggable
                onDragEnd={(e: any) => {
                  const coords = e.get('target').geometry.getCoordinates();
                  setMarkForm({
                    ...markForm,
                    location: {
                      ...markForm.location,
                      latitude: coords[0].toString(),
                      longitude: coords[1].toString()
                    }
                  });
                  fetchAddressByCoords(coords[0], coords[1]);
                }}
              />
              <Circle
                geometry={[[
                  Number(markForm.location.latitude) || 43.222,
                  Number(markForm.location.longitude) || 76.851
                ], Number(markForm.location.radius) || 100]}
                options={{ draggable: false, fillColor: '#00FF0088', strokeColor: '#0000FF', strokeWidth: 2 }}
              />
            </Map>
          </YMaps>
          <TextField
            label="Широта"
            name="latitude"
            value={markForm.location.latitude}
            onChange={handleMarkChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Долгота"
            name="longitude"
            value={markForm.location.longitude}
            onChange={handleMarkChange}
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
    </Box>
  );
};

export default StaffTimeTracking;

