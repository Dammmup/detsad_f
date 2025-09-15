import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, Chip, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete, Schedule as ScheduleIcon } from '@mui/icons-material';

interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  date: string;
  startTime: string;
  endTime: string;
  type: 'morning' | 'evening' | 'night' | 'full';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
}

const StaffSchedule: React.FC = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const shiftTypes = {
    morning: 'Утренняя смена',
    evening: 'Вечерняя смена', 
    night: 'Ночная смена',
    full: 'Полный день'
  };

  const statusColors = {
    scheduled: 'default',
    confirmed: 'info',
    completed: 'success',
    cancelled: 'error'
  } as const;

  const statusLabels = {
    scheduled: 'Запланировано',
    confirmed: 'Подтверждено',
    completed: 'Выполнено',
    cancelled: 'Отменено'
  };

  // Генерируем тестовые данные
  useEffect(() => {
    const mockShifts: Shift[] = [
      {
        id: '1',
        staffId: '1',
        staffName: 'Иванова Мария',
        date: '2024-01-15',
        startTime: '08:00',
        endTime: '17:00',
        type: 'full',
        status: 'confirmed'
      },
      {
        id: '2', 
        staffId: '2',
        staffName: 'Петрова Анна',
        date: '2024-01-15',
        startTime: '07:00',
        endTime: '15:00',
        type: 'morning',
        status: 'scheduled'
      }
    ];
    setShifts(mockShifts);
  }, []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ScheduleIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Расписание сотрудников
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setModalOpen(true)}
        >
          Добавить смену
        </Button>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Всего смен</Typography>
              <Typography variant="h4">{shifts.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Подтверждено</Typography>
              <Typography variant="h4">
                {shifts.filter(s => s.status === 'confirmed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Ожидает</Typography>
              <Typography variant="h4">
                {shifts.filter(s => s.status === 'scheduled').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">Выполнено</Typography>
              <Typography variant="h4">
                {shifts.filter(s => s.status === 'completed').length}
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
              <TableCell>Дата</TableCell>
              <TableCell>Время</TableCell>
              <TableCell>Тип смены</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((shift) => (
              <TableRow key={shift.id}>
                <TableCell>{shift.staffName}</TableCell>
                <TableCell>{new Date(shift.date).toLocaleDateString('ru-RU')}</TableCell>
                <TableCell>{shift.startTime} - {shift.endTime}</TableCell>
                <TableCell>{shiftTypes[shift.type]}</TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[shift.status]}
                    color={statusColors[shift.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                  <IconButton size="small" color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Добавить смену</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Сотрудник"
              margin="normal"
            />
            <TextField
              fullWidth
              label="Дата"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Время начала"
                  type="time"
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Время окончания"
                  type="time"
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>
            <FormControl fullWidth margin="normal">
              <InputLabel>Тип смены</InputLabel>
              <Select label="Тип смены">
                <MenuItem value="morning">Утренняя смена</MenuItem>
                <MenuItem value="evening">Вечерняя смена</MenuItem>
                <MenuItem value="night">Ночная смена</MenuItem>
                <MenuItem value="full">Полный день</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)}>Отмена</Button>
          <Button variant="contained">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StaffSchedule;
