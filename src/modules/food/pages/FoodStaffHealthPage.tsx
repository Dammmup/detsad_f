import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  foodStaffHealthApi,
  FoodStaffDailyLog,
} from '../services/foodStaffHealth';
import { userApi } from '../../staff/services/users';
import { User } from '../../../shared/types/staff';
import ExportButton from '../../../shared/components/ExportButton';
import { exportData } from '../../../shared/utils/exportUtils';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const defaultForm: Partial<FoodStaffDailyLog> = {
  date: new Date().toISOString().slice(0, 10),
  staffId: '',
  hasPustularDiseases: false,
  hasAnginaSymptoms: false,
  familyHealthy: true,
  healthStatus: 'healthy',
  signature: true,
  notes: '',
};

const FoodStaffHealthPage: React.FC = () => {
  const [rows, setRows] = useState<FoodStaffDailyLog[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<FoodStaffDailyLog>>(defaultForm);
  const [editId, setEditId] = useState<string | undefined>();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logs, staff] = await Promise.all([
        foodStaffHealthApi.getAll(),
        userApi.getAll(),
      ]);
      setRows(logs);
      setEmployees(staff.filter(u => ['manager', 'admin', 'doctor', 'nurse', 'employee'].includes(u.role)));
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpen = (row?: FoodStaffDailyLog) => {
    if (row) {
      setForm({
        ...row,
        date: typeof row.date === 'string' ? row.date.slice(0, 10) : new Date(row.date).toISOString().slice(0, 10),
        staffId: (row.staffId as any)?._id || row.staffId
      });
      setEditId(row._id);
    } else {
      setForm(defaultForm);
      setEditId(undefined);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(defaultForm);
    setEditId(undefined);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (editId) {
        await foodStaffHealthApi.update(editId, form);
      } else {
        await foodStaffHealthApi.create(form as FoodStaffDailyLog);
      }
      await fetchData();
      handleClose();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id || !window.confirm('Удалить эту запись?')) return;
    setLoading(true);
    try {
      await foodStaffHealthApi.deleteItem(id);
      await fetchData();
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (
    exportType: string,
    exportFormat: 'excel',
  ) => {
    await exportData('food-staff-daily-log', exportFormat, { rows });
  };

  return (
    <Box p={3}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/app/med')}
        variant="outlined"
        sx={{ mb: 2 }}
      >
        Назад к журналам
      </Button>
      <Typography variant='h4' gutterBottom>
        Журнал регистрации состояния здоровья работников пищеблока
      </Typography>

      <Stack direction='row' spacing={2} mb={2}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => handleOpen()}
        >
          Новый осмотр
        </Button>
        <ExportButton
          exportTypes={[
            { value: 'food-staff-daily-log', label: 'Журнал здоровья (ежедневный)' },
          ]}
          onExport={handleExport}
        />
      </Stack>

      <Paper sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Дата</TableCell>
              <TableCell>ФИО работника</TableCell>
              <TableCell align="center">Гнойнички</TableCell>
              <TableCell align="center">Ангина/ОРВИ</TableCell>
              <TableCell align="center">Семья здорова</TableCell>
              <TableCell>Допуск</TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && !loading && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.disabled' }}>
                  Записей пока нет
                </TableCell>
              </TableRow>
            )}
            {rows.map((row) => (
              <TableRow key={row._id}>
                <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                <TableCell>{(row.staffId as any)?.fullName || row.staffName || '---'}</TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.hasPustularDiseases ? 'Есть' : 'Нет'}
                    color={row.hasPustularDiseases ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.hasAnginaSymptoms ? 'Есть' : 'Нет'}
                    color={row.hasAnginaSymptoms ? 'error' : 'success'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={row.familyHealthy ? 'Да' : 'Нет'}
                    color={row.familyHealthy ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.healthStatus === 'healthy' ? 'Допущен' : 'Отстранен'}
                    variant="outlined"
                    color={row.healthStatus === 'healthy' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Stack direction='row' spacing={0.5}>
                    <IconButton size='small' onClick={() => handleOpen(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(row._id)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth='xs' fullWidth>
        <DialogTitle>
          {editId ? 'Редактировать осмотр' : 'Регистрация осмотра'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label='Дата'
              name='date'
              type='date'
              value={form.date}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Сотрудник</InputLabel>
              <Select
                name="staffId"
                value={form.staffId}
                label="Сотрудник"
                onChange={(e) => setForm({ ...form, staffId: e.target.value as string })}
              >
                {employees.map(emp => (
                  <MenuItem key={emp.id || (emp as any)._id} value={emp.id || (emp as any)._id}>
                    {emp.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={<Switch checked={form.hasPustularDiseases} onChange={handleChange} name="hasPustularDiseases" />}
              label="Гнойничковые заболевания"
            />

            <FormControlLabel
              control={<Switch checked={form.hasAnginaSymptoms} onChange={handleChange} name="hasAnginaSymptoms" />}
              label="Признаки ангины/ОРВИ"
            />

            <FormControlLabel
              control={<Switch checked={form.familyHealthy} onChange={handleChange} name="familyHealthy" />}
              label="Семья здорова"
            />

            <FormControl fullWidth>
              <InputLabel>Результат осмотра</InputLabel>
              <Select
                name="healthStatus"
                value={form.healthStatus}
                label="Результат осмотра"
                onChange={(e) => setForm({ ...form, healthStatus: e.target.value as any })}
              >
                <MenuItem value="healthy">Допущен к работе</MenuItem>
                <MenuItem value="unfit">Не допущен</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label='Примечания'
              name='notes'
              value={form.notes}
              onChange={handleChange}
              fullWidth
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Отмена</Button>
          <Button onClick={handleSave} variant='contained' disabled={loading || !form.staffId}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FoodStaffHealthPage;
