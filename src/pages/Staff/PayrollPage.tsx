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
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Alert, CircularProgress } from '@mui/material';

interface PayrollPageProps {
  isInReports?: boolean;
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
  status: 'draft' | 'approved' | 'paid';
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

  // Загрузка данных
  useEffect(() => {
    console.log('Загрузка данных для месяца:', selectedMonth);
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('Начало загрузки данных...');
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
      const response = await fetch(`/api/payroll?month=${selectedMonth}`);
      console.log('Ответ от сервера для /api/payroll:', response.status);
      
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
      const response = await fetch('/api/users?type=adult');
      
      console.log('Ответ от сервера для /api/users:', response.status);
      
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
    setCurrentPayroll(payroll || {
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentPayroll(null);
  };

  const handleSavePayroll = async () => {
    if (!currentPayroll) return;

    try {
      const method = currentPayroll._id ? 'PUT' : 'POST';
      const url = currentPayroll._id 
        ? `/api/payroll/${currentPayroll._id}` 
        : '/api/payroll';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentPayroll)
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
    if (window.confirm('Удалить расчетный лист?')) {
      try {
        await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
        fetchPayrolls();
      } catch (error) {
        console.error('Ошибка удаления расчетного листа:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: 'draft' | 'approved' | 'paid') => {
    try {
      await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      fetchPayrolls();
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
    }
  };
  
  // Обработчик экспорта расчетного листа
  const handleExportPayroll = async (id: string, format: 'pdf' | 'excel' | 'csv') => {
    try {
      // В реальном приложении здесь будет запрос к API для экспорта
      alert(`Экспорт расчетного листа в формате ${format}`);
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
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Добавить
          </Button>
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
                               payroll.status === 'approved' ? 'Подтвержден' : 'Оплачен'}
                        color={getStatusColor(payroll.status)}
                        variant={payroll.status === 'draft' ? 'outlined' : 'filled'}
                      />
                    </TableCell>
                    <TableCell align="center">
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
};

export default PayrollPage;
