import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, IconButton,
  Tooltip, Chip, Divider, FormControl, InputLabel, Select, SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  AttachMoney as MoneyIcon,
  PictureAsPdf,
  TableChart
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, CircularProgress } from '@mui/material';
import { exportSalaryReport } from '../../services/reports';
import usersApi from '../../services/users';
// Типы для настроек зарплаты и штрафа
type PayrollSettings = {
  salary?: number;
  shiftRate?: number;
  salaryType?: 'day' | 'month' | 'shift';
  penaltyType?: 'fixed' | 'percent' | 'per_minute' | 'per_5_minutes' | 'per_10_minutes'; // добавляем типы штрафов из User
  penaltyAmount?: number;
};
  // Диалог и состояние для настроек зарплаты/штрафа
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [settingsUser, setSettingsUser] = useState<any>(null);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  // Открыть диалог настроек
  const handleOpenSettings = async (user: any) => {
    setSettingsUser(user);
    setSettingsLoading(true);
    setSettingsDialogOpen(true);
    try {
      const data = await usersApi.getPayrollSettings(user._id);
      setPayrollSettings({
        salary: typeof data.salary === 'number' ? data.salary : undefined,
        shiftRate: typeof data.shiftRate === 'number' ? data.shiftRate : undefined,
        salaryType: data.salaryType ?? 'month',
        penaltyType: (data.penaltyType === 'fixed' || data.penaltyType === 'percent' || data.penaltyType === 'per_minute' || data.penaltyType === 'per_5_minutes' || data.penaltyType === 'per_10_minutes') ? data.penaltyType : 'fixed',
        penaltyAmount: typeof data.penaltyAmount === 'number' ? data.penaltyAmount : undefined
      });
    } catch {
      setPayrollSettings({ salary: undefined, salaryType: 'month', penaltyType: 'fixed', penaltyAmount: undefined });
    } finally {
      setSettingsLoading(false);
    }
  };

  // Сохранить настройки
  const handleSaveSettings = async () => {
    if (!settingsUser) return;
    setSettingsLoading(true);
    try {
      await usersApi.updatePayrollSettings(settingsUser._id, payrollSettings);
      setSettingsDialogOpen(false);
    } catch (e) {
      alert('Ошибка сохранения настроек');
    } finally {
      setSettingsLoading(false);
    }
  };

interface PayrollPageProps {
  isInReports?: boolean;
}

// Тип для информации о пользователе
interface CurrentUser {
  _id: string;
 role: string;
}

interface Payroll {
  _id: string;
  staffId: {
    _id: string;
    fullName: string;
  };
  month: string;
  accruals: number;
  deductions: number;
  bonuses: number;
  penalties: number;
  total: number;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
  fines: Array<{
    date: Date;
    type: string;
    amount: number;
    comment: string;
  }>;
}

const PayrollPage: React.FC<PayrollPageProps> = ({ isInReports = false }) => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPayroll, setCurrentPayroll] = useState<Partial<Payroll> | null>(null);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(
    format(new Date(), 'yyyy-MM')
  );

  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Загрузка данных
  useEffect(() => {
    console.log('Загрузка данных для месяца:', selectedMonth);
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Начало загрузки данных...');
        // Загружаем информацию о текущем пользователе
        const userResponse = await fetch('/auth/me', {
          credentials: 'include'
        });
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setCurrentUser({
            _id: userData.data._id,
            role: userData.data.role
          });
        }
        
        await Promise.all([
          fetchPayrolls(),
          fetchStaff()
        ]);
        console.log('Данные успешно загружены');
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
        setError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
      } finally {
        setLoading(false);
        console.log('Загрузка завершена, состояние loading:', false);
      }
    };

    loadData();
  }, [selectedMonth]);

  const fetchPayrolls = async () => {
    try {
      console.log('Запрос расчетных листов за месяц:', selectedMonth);
      const response = await fetch(`/payroll?month=${selectedMonth}`, {
        credentials: 'include'
      });
      console.log('Ответ от сервера для /payroll:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Получены данные расчетных листов:', data);
      
      if (data.success) {
        console.log('Расчетные листы успешно загружены:', data.data);
        setPayrolls(data.data || []);
      } else {
        console.error('Ошибка при загрузке расчетных листов:', data.message);
        throw new Error(data.message || 'Ошибка при загрузке данных');
      }
    } catch (error) {
      console.error('Ошибка загрузки расчетных листов:', error);
      throw error;
    }
  };

  const fetchStaff = async () => {
    try {
      console.log('Запрос сотрудников с типом adult...');
  const response = await fetch('/users', {
    credentials: 'include'
  });
      
      console.log('Ответ от сервера для /users:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка ответа сервера:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Получены данные сотрудников:', data);
      
      if (data.success) {
        console.log('Все полученные сотрудники:', data.data);
        // Фильтруем только активных сотрудников
        const activeStaff = Array.isArray(data.data)
          ? data.data.filter((user: any) => {
              const isActive = user.active === true;
              console.log(`Сотрудник ${user.fullName} active: ${user.active}, включен в список: ${isActive}`);
              return isActive;
            })
          : [];
          
        console.log('Активные сотрудники после фильтрации:', activeStaff);
        setStaffList(activeStaff);
        
        if (activeStaff.length === 0) {
          console.warn('Не найдено активных сотрудников с типом adult');
        } else {
          console.log(`Найдено ${activeStaff.length} активных сотрудников`);
        }
      } else {
        console.error('Ошибка в данных ответа:', data.message);
        throw new Error(data.message || 'Ошибка при загрузке сотрудников');
      }
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      throw error;
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (payroll?: Payroll) => {
    // Проверяем, является ли пользователь администратором
    if (currentUser?.role !== 'admin') {
      // Обычный сотрудник может редактировать только свои данные
      if (payroll && currentUser && payroll.staffId._id !== currentUser._id) {
        alert('У вас нет прав для редактирования этого расчетного листа');
        return;
      }
    }
    
    if (payroll) {
      // Редактирование существующего
      setCurrentPayroll(payroll);
    } else {
      // Создание нового
      setCurrentPayroll({
        staffId: { _id: '', fullName: '' },
        month: selectedMonth,
        accruals: 0,
        deductions: 0,
        bonuses: 0,
        penalties: 0,
        total: 0,
        status: 'draft',
        fines: []
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPayroll(null);
  };

  const handleSavePayroll = async () => {
    if (!currentPayroll) return;
    
    // Проверяем, является ли пользователь администратором
    if (currentUser?.role !== 'admin') {
      alert('У вас нет прав для создания или редактирования расчетных листов');
      return;
    }

    try {
      const method = currentPayroll._id ? 'PUT' : 'POST';
      const url = currentPayroll._id
        ? `/payroll/${currentPayroll._id}`
        : '/payroll';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayroll),
        credentials: 'include'
      });

      if (response.ok) {
        fetchPayrolls();
        handleCloseDialog();
      }
    } catch (error) {
      console.error('Ошибка сохранения расчетного листа:', error);
    }
 };

  const handleDeletePayroll = async (id: string) => {
    // Проверяем, является ли пользователь администратором
    if (currentUser?.role !== 'admin') {
      alert('У вас нет прав для удаления расчетных листов');
      return;
    }
    
    if (window.confirm('Удалить расчетный лист?')) {
      try {
        await fetch(`/payroll/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });
        fetchPayrolls();
      } catch (error) {
        console.error('Ошибка удаления расчетного листа:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'approved' | 'paid') => {
    // Проверяем, является ли пользователь администратором
    if (currentUser?.role !== 'admin') {
      alert('У вас нет прав для изменения статуса расчетных листов');
      return;
    }
    
    try {
      await fetch(`/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
 };
  
  // Обработчик экспорта расчетного листа
  // Экспорт зарплатного отчета через API
  const handleExportPayroll = async (id: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      // Формируем параметры для экспорта
      const params: any = {
        startDate: selectedMonth + '-01',
        endDate: selectedMonth + '-28', // для простоты, можно доработать до конца месяца
        format
      };
      
      // Если пользователь не администратор, он может экспортировать только свои данные
      if (currentUser?.role !== 'admin' && id) {
        params.userId = currentUser?._id;
      } else if (id) {
        params.userId = id;
      }
      
      const blob = await exportSalaryReport(params);
      if (!blob) throw new Error('Пустой ответ от сервера');
      // Формируем имя файла
      const fileName = `payroll_${id ? id + '_' : ''}${selectedMonth}.${format === 'excel' ? 'xlsx' : format}`;
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Ошибка экспорта расчетного листа:', error);
      setError('Не удалось экспортировать расчетный лист');
    }
 };
  
  // Обработчик отправки расчетного листа по email
  const handleSendByEmail = async (id: string) => {
    try {
      // В реальном приложении здесь будет запрос к API для отправки email
      alert('Расчетный лист отправлен по email');
    } catch (error) {
      console.error('Ошибка отправки расчетного листа по email:', error);
      setError('Не удалось отправить расчетный лист по email');
    }
  };
  
  // Обработчик печати расчетного листа
  const handlePrintPayroll = async (id: string) => {
    try {
      // В реальном приложении здесь будет запрос к API для получения данных для печати
      alert('Печать расчетного листа');
    } catch (error) {
      console.error('Ошибка печати расчетного листа:', error);
      setError('Не удалось напечатать расчетный лист');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calculated': return 'info';
      case 'approved': return 'primary';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box p={3} display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Обновить страницу
        </Button>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          <MoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          {isInReports ? 'Отчет по зарплатам' : 'Зарплаты'}
        </Typography>
        <Box>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 200, mr: 2 }}>
            <InputLabel>Месяц</InputLabel>
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              label="Месяц"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = format(date, 'yyyy-MM');
                const label = format(date, 'LLLL yyyy', { locale: ru });
                return (
                  <MenuItem key={value} value={value}>
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<PictureAsPdf />}
            onClick={() => handleExportPayroll('', 'pdf')}
            sx={{ mr: 2 }}
          >
            Экспорт PDF
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<TableChart />}
            onClick={() => handleExportPayroll('', 'excel')}
            sx={{ mr: 2 }}
          >
            Экспорт Excel
          </Button>
          {currentUser?.role === 'admin' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
            >
              Добавить
            </Button>
          )}
        </Box>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell align="right">Начисления</TableCell>
                <TableCell align="right">Штрафы</TableCell>
                
                <TableCell align="right">Итого</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="center">Действия</TableCell>
                <TableCell align="center">Ставка</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payroll) => (
                  <TableRow key={payroll._id}>
                    <TableCell>{payroll.staffId?.fullName || 'Неизвестно'}</TableCell>
                    <TableCell align="right">{formatCurrency(payroll.accruals)}</TableCell>
                    <TableCell align="right">{formatCurrency(payroll.bonuses)}</TableCell>
                    <TableCell align="right">-{formatCurrency(payroll.penalties)}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(payroll.total)}
                    </TableCell>
                    <TableCell align="center">
                     
                      <Tooltip title="Удалить">
                        <IconButton 
                          onClick={() => handleDeletePayroll(payroll._id)} 
                          color="error"
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Печать">
                        <IconButton
                          size="small"
                          onClick={() => handlePrintPayroll(payroll._id)}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Отправить на email">
                        <IconButton
                          size="small"
                          onClick={() => handleSendByEmail(payroll._id)}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Экспорт">
                        <IconButton
                          size="small"
                          onClick={() => handleExportPayroll(payroll._id, 'pdf')}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Настроить ставку и штраф">
                        <IconButton size="small" onClick={() => handleOpenSettings(payroll.staffId)}>
                          <MoneyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
      {/* Диалог настройки ставки и штрафа */}
      <Dialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Настройка ставки и штрафа</DialogTitle>
        <DialogContent dividers>
          {settingsLoading ? <CircularProgress /> : settingsUser && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>{settingsUser.fullName}</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Оклад"
                    type="number"
                    fullWidth
                    value={payrollSettings.salary ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      setPayrollSettings(s => ({ ...s, salary: val === '' ? undefined : Number(val) }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Ставка за смену"
                    type="number"
                    fullWidth
                    value={payrollSettings.shiftRate ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      setPayrollSettings(s => ({ ...s, shiftRate: val === '' ? undefined : Number(val) }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Тип оплаты</InputLabel>
                    <Select
                      value={payrollSettings.salaryType || 'month'}
                      label="Тип оплаты"
                      onChange={e => setPayrollSettings(s => ({ ...s, salaryType: e.target.value as any }))}
                    >
                      <MenuItem value="month">В месяц</MenuItem>
                      <MenuItem value="day">В день</MenuItem>
                      <MenuItem value="shift">За смену</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Штраф за опоздание"
                    type="number"
                    fullWidth
                    value={payrollSettings.penaltyAmount ?? ''}
                    onChange={e => {
                      const val = e.target.value;
                      setPayrollSettings(s => ({ ...s, penaltyAmount: val === '' ? undefined : Number(val) }));
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Тип штрафа</InputLabel>
                    <Select
                      value={payrollSettings.penaltyType || 'fixed'}
                      label="Тип штрафа"
                      onChange={e => setPayrollSettings(s => ({ ...s, penaltyType: e.target.value as any }))}
                    >
                      <MenuItem value="fixed">Фиксированная сумма</MenuItem>
                      <MenuItem value="percent">Процент от ставки</MenuItem>
                      <MenuItem value="per_minute">За минуту</MenuItem>
                      <MenuItem value="per_5_minutes">За 5 минут</MenuItem>
                      <MenuItem value="per_10_minutes">За 10 минут</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveSettings} variant="contained" color="primary" disabled={settingsLoading}>
            Сохранить
          </Button>
        </DialogActions>
                  <Paper>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Сотрудник</TableCell>
                            <TableCell align="right">Начисления</TableCell>
                            <TableCell align="right">Штрафы</TableCell>
                            <TableCell align="right">Итого</TableCell>
                            <TableCell>Статус</TableCell>
                            <TableCell align="center">Действия</TableCell>
                            <TableCell align="center">Ставка</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {payrolls
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((payroll) => (
                              <TableRow key={payroll._id}>
                                <TableCell>{payroll.staffId?.fullName || 'Неизвестно'}</TableCell>
                                <TableCell align="right">{formatCurrency(payroll.accruals)}</TableCell>
                                <TableCell align="right">{formatCurrency(payroll.bonuses)}</TableCell>
                                <TableCell align="right">-{formatCurrency(payroll.penalties)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                  {formatCurrency(payroll.total)}
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={payroll.status === 'draft' ? 'Черновик' :
                                           payroll.status === 'calculated' ? 'Рассчитано' :
                                           payroll.status === 'approved' ? 'Подтвержден' : 'Оплачен'}
                                    color={getStatusColor(payroll.status)}
                                    variant={payroll.status === 'draft' ? 'outlined' : 'filled'}
                                  />
                                </TableCell>
                                <TableCell align="center">
                                  <Tooltip title="Настроить ставку и штраф">
                                    <IconButton size="small" onClick={() => handleOpenSettings(payroll.staffId)}>
                                      <MoneyIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {/* Показываем кнопки редактирования и удаления только для администраторов */}
                                  {currentUser?.role === 'admin' && (
                                    <>
                                      <Tooltip title="Редактировать">
                                        <IconButton onClick={() => handleOpenDialog(payroll)} size="small">
                                          <EditIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      <Tooltip title="Удалить">
                                        <IconButton
                                          onClick={() => handleDeletePayroll(payroll._id)}
                                          color="error"
                                          size="small"
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </>
                                  )}
                                  <Tooltip title="Печать">
                                    <IconButton
                                      size="small"
                                      onClick={() => handlePrintPayroll(payroll._id)}
                                    >
                                      <PrintIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Отправить на email">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleSendByEmail(payroll._id)}
                                    >
                                      <EmailIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Экспорт">
                                    <IconButton
                                      size="small"
                                      onClick={() => handleExportPayroll(payroll._id, 'pdf')}
                                    >
                                      <PictureAsPdf fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={payrolls.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                      labelRowsPerPage="Строк на странице:"
                      labelDisplayedRows={({ from, to, count }) => 
                        `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`}
                    />
                  </Paper>
      </Dialog>
                    <TableCell>
                      <Chip
                        label={payroll.status === 'draft' ? 'Черновик' :
                               payroll.status === 'calculated' ? 'Рассчитано' :
                               payroll.status === 'approved' ? 'Подтвержден' : 'Оплачен'}
                        color={getStatusColor(payroll.status)}
                        variant={payroll.status === 'draft' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      {/* Показываем кнопки редактирования и удаления только для администраторов */}
                      {currentUser?.role === 'admin' && (
                        <>
                          <Tooltip title="Редактировать">
                            <IconButton onClick={() => handleOpenDialog(payroll)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton
                              onClick={() => handleDeletePayroll(payroll._id)}
                              color="error"
                              size="small"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Печать">
                        <IconButton
                          size="small"
                          onClick={() => handlePrintPayroll(payroll._id)}
                        >
                          <PrintIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Отправить на email">
                        <IconButton
                          size="small"
                          onClick={() => handleSendByEmail(payroll._id)}
                        >
                          <EmailIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Экспорт">
                        <IconButton
                          size="small"
                          onClick={() => handleExportPayroll(payroll._id, 'pdf')}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={payrolls.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Строк на странице:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} из ${count !== -1 ? count : `более чем ${to}`}`}
        />
      </Paper>

      {/* Диалог редактирования/создания расчетного листа */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentPayroll?._id ? 'Редактировать расчетный лист' : 'Новый расчетный лист'}
        </DialogTitle>
        <DialogContent dividers>
          {currentPayroll && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Сотрудник</InputLabel>
                  <Select
                    value={currentPayroll.staffId?._id || ''}
                    onChange={(e) => setCurrentPayroll({
                      ...currentPayroll,
                      staffId: {
                        _id: e.target.value,
                        fullName: staffList.find(s => s._id === e.target.value)?.fullName || ''
                      }
                    })}
                    label="Сотрудник"
                  >
                    {staffList.map((staff) => (
                      <MenuItem key={staff._id} value={staff._id}>
                        {staff.fullName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Месяц"
                  type="month"
                  value={currentPayroll.month || ''}
                  onChange={(e) => setCurrentPayroll({
                    ...currentPayroll,
                    month: e.target.value
                  })}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Оклад"
                  type="number"
                  value={currentPayroll.accruals || ''}
                  onChange={(e) => setCurrentPayroll({
                    ...currentPayroll,
                    accruals: Number(e.target.value)
                  })}
                />
              </Grid>
         
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Штрафы"
                  type="number"
                  value={currentPayroll.penalties || 0}
                  onChange={(e) => setCurrentPayroll({
                    ...currentPayroll,
                    penalties: Number(e.target.value)
                  })}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  Итого к выплате: {formatCurrency(
                    (currentPayroll.accruals || 0) + 
                    (currentPayroll.bonuses || 0) - 
                    (currentPayroll.penalties || 0)
                  )}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Отмена</Button>
          <Button 
            onClick={handleSavePayroll} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PayrollPage;
