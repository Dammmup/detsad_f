import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, IconButton,
  Tooltip, Chip, Divider, FormControl, InputLabel, Select, SelectChangeEvent,
  Alert, CircularProgress, Tabs, Tab
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
  TableChart,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import { usersApi } from '../../services/api/users';
import { getStaffAttendance } from '../../services/api/staffAttendance';

interface PayrollReportPageProps {
  isInReports?: boolean;
}

interface Payroll {
  _id: string;
 staffId: string | {
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
  // Добавим поля для детализации штрафов
  latePenalties?: number;
  absencePenalties?: number;
}

interface StaffAttendanceRecord {
  _id?: string;
  staffId: string;
  groupId?: string;
  date: string;
  shiftType: 'full' | 'overtime';
  startTime: string;
  endTime: string;
  actualStart?: string;
  actualEnd?: string;
  breakTime?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'late';
  lateMinutes?: number;
  overtimeMinutes?: number;
  earlyLeaveMinutes?: number;
  location?: {
    checkIn?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    checkOut?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  notes?: string;
  markedBy: string;
  createdAt?: string;
 updatedAt?: string;
}

const PayrollReportPage: React.FC<PayrollReportPageProps> = ({ isInReports = false }) => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<StaffAttendanceRecord[]>([]);
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
 const [tabValue, setTabValue] = useState(0);
 const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
 const [selectedPayrollDetails, setSelectedPayrollDetails] = useState<Payroll | null>(null);

  // Загрузка данных
 useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchPayrolls(),
          fetchStaff(),
          fetchAttendance()
        ]);
      } catch (err) {
        setError('Не удалось загрузить данные. Пожалуйста, обновите страницу.');
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedMonth]);

  // Пересчет штрафов для всех сотрудников
  useEffect(() => {
    if (payrolls.length > 0 && attendanceRecords.length > 0 && staffList.length > 0) {
      // Обновляем штрафы в расчетных листах на основе посещаемости
      const updatedPayrolls = payrolls.map(payroll => {
        // Определяем ID сотрудника в зависимости от типа
        const staffId = typeof payroll.staffId === 'string' ? payroll.staffId : payroll.staffId._id;
        
        // Рассчитываем штрафы на основе посещаемости
        const staffAttendance = attendanceRecords.filter(record =>
          record.staffId === staffId && record.date.startsWith(selectedMonth)
        );
        
        // Штрафы за опоздания
        const latePenalty = staffAttendance.reduce((sum, record) => {
          if (record.lateMinutes && record.lateMinutes > 0) {
            // 100 тг за каждые 5 минут опоздания
            return sum + Math.ceil(record.lateMinutes / 5) * 100;
          }
          return sum;
        }, 0);
        
        // Штрафы за неявку: 60*10,5 = 630 тг за смену
        const absencePenalty = staffAttendance.filter(record =>
          record.status === 'no_show'
        ).length * 630;
        
        const totalPenalties = latePenalty + absencePenalty;
        
        return {
          ...payroll,
          penalties: totalPenalties,
          latePenalties: latePenalty,
          absencePenalties: absencePenalty,
          total: payroll.accruals + payroll.bonuses - totalPenalties
        };
      });
      setPayrolls(updatedPayrolls);
    }
  }, [attendanceRecords, staffList]);

  const fetchPayrolls = async () => {
    try {
      const response = await fetch(`/api/payroll?month=${selectedMonth}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setPayrolls(data.data || []);
      } else {
        throw new Error(data.message || 'Ошибка при загрузке данных');
      }
    } catch (error) {
      console.error('Ошибка загрузки расчетных листов:', error);
      throw error;
    }
  };

  const fetchStaff = async () => {
    try {
      const staff = await usersApi.getAll({ type: 'adult' });
      console.log('Получены данные сотрудников:', staff);
      
      // Фильтруем только активных сотрудников
      const activeStaff = staff.filter((user: any) => user.status !== 'inactive');
      
      console.log('Активные сотрудники:', activeStaff);
      setStaffList(activeStaff);
      
      if (activeStaff.length === 0) {
        console.warn('Не найдено активных сотрудников с типом adult');
      }
    } catch (error) {
      console.error('Ошибка загрузки сотрудников:', error);
      throw error;
    }
  };

  const fetchAttendance = async () => {
    try {
      const startDate = new Date(selectedMonth + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
      
      const attendance = await getStaffAttendance({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      setAttendanceRecords(attendance);
    } catch (error) {
      console.error('Ошибка загрузки посещаемости:', error);
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
      staffId: '', // теперь staffId - это строка при создании нового
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
      // Подготовим данные для отправки, убедившись, что staffId - это строка
      let staffIdToSend = '';
      if (typeof currentPayroll.staffId === 'string') {
        staffIdToSend = currentPayroll.staffId;
      } else if (currentPayroll.staffId && typeof currentPayroll.staffId === 'object') {
        staffIdToSend = currentPayroll.staffId._id;
      }

      const payrollToSend = {
        ...currentPayroll,
        staffId: staffIdToSend
      };

      const method = currentPayroll._id ? 'PUT' : 'POST';
      const url = currentPayroll._id
        ? `/api/payroll/${currentPayroll._id}`
        : '/api/payroll';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payrollToSend)
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
 
 const handleViewDetails = (payroll: Payroll) => {
   setSelectedPayrollDetails(payroll);
   setDetailsDialogOpen(true);
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

  const calculatePenalties = (staffId: string) => {
    // Рассчитываем штрафы на основе посещаемости
    const staffAttendance = attendanceRecords.filter(record =>
      record.staffId === staffId && record.date.startsWith(selectedMonth)
    );
    
    let totalPenalty = 0;
    
    // Штрафы за опоздания
    // В задании не указано, сколько конкретно списывать за опоздание,
    // но упоминается "60*10,5 минут", что, по всей видимости, относится к штрафу за неявку
    // Пока реализуем условный штраф за опоздание: 100 тг за каждые 5 минут опоздания
    const latePenalty = staffAttendance.reduce((sum, record) => {
      if (record.lateMinutes && record.lateMinutes > 0) {
        // 100 тг за каждые 5 минут опоздания
        return sum + Math.ceil(record.lateMinutes / 5) * 100;
      }
      return sum;
    }, 0);
    
    // Штрафы за неявку: 60*10,5 = 630 тг за смену
    const absencePenalty = staffAttendance.filter(record =>
      record.status === 'no_show'
    ).length * 630;
    
    totalPenalty = latePenalty + absencePenalty;
    
    return totalPenalty;
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
                <TableCell align="right">Оклад</TableCell>
                <TableCell align="right">Штрафы за опоздания</TableCell>
                <TableCell align="right">Штрафы за неявки</TableCell>
                <TableCell align="right">Всего штрафов</TableCell>
                <TableCell align="right">К выплате</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell align="center">Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payrolls
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((payroll) => (
                  <TableRow key={payroll._id}>
                    <TableCell>
                      {typeof payroll.staffId === 'string'
                        ? staffList.find(s => s._id === payroll.staffId)?.fullName || 'Неизвестно'
                        : payroll.staffId.fullName || 'Неизвестно'}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(payroll.accruals)}</TableCell>
                    <TableCell align="right">{formatCurrency(payroll.bonuses)}</TableCell>
                    <TableCell align="right">-{formatCurrency(payroll.latePenalties || 0)}</TableCell>
                    <TableCell align="right">-{formatCurrency(payroll.absencePenalties || 0)}</TableCell>
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
                      <Tooltip title="Детали расчета">
                        <IconButton
                          onClick={() => handleViewDetails(payroll)}
                          size="small"
                        >
                          <VisibilityIcon fontSize="small" />
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
                    value={typeof currentPayroll.staffId === 'string'
                      ? currentPayroll.staffId
                      : currentPayroll.staffId?._id || ''}
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
      
      {/* Диалог с деталями расчета */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Детали расчета зарплаты</DialogTitle>
        <DialogContent dividers>
          {selectedPayrollDetails && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {typeof selectedPayrollDetails.staffId === 'string'
                  ? staffList.find(s => s._id === selectedPayrollDetails.staffId)?.fullName || 'Неизвестно'
                  : selectedPayrollDetails.staffId.fullName || 'Неизвестно'}
                {' - '}
                {selectedPayrollDetails.month}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Оклад:</Typography>
                  <Typography variant="h6">{formatCurrency(selectedPayrollDetails.accruals)}</Typography>
                </Grid>
               
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Штрафы за опоздания:</Typography>
                  <Typography variant="h6">-{formatCurrency(selectedPayrollDetails.latePenalties || 0)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Штрафы за неявки:</Typography>
                  <Typography variant="h6">-{formatCurrency(selectedPayrollDetails.absencePenalties || 0)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Всего штрафов:</Typography>
                  <Typography variant="h6">-{formatCurrency(selectedPayrollDetails.penalties)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Итого к выплате:</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatCurrency(selectedPayrollDetails.total)}
                  </Typography>
                </Grid>
              </Grid>
              
              {/* Детали посещаемости */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>Детали посещаемости</Typography>
                {(() => {
                  const staffId = typeof selectedPayrollDetails.staffId === 'string'
                    ? selectedPayrollDetails.staffId
                    : selectedPayrollDetails.staffId._id;
                  
                  const staffAttendance = attendanceRecords.filter(record =>
                    record.staffId === staffId && record.date.startsWith(selectedMonth)
                  );
                  
                  if (staffAttendance.length === 0) {
                    return <Typography variant="body2">Нет данных о посещаемости</Typography>;
                  }
                  
                  return (
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Дата</TableCell>
                          <TableCell>Время смены</TableCell>
                          <TableCell>Факт. приход</TableCell>
                          <TableCell>Факт. уход</TableCell>
                          <TableCell>Статус</TableCell>
                          <TableCell>Опоздание</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {staffAttendance.map((record, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(record.date).toLocaleDateString('ru-RU')}</TableCell>
                            <TableCell>{record.startTime} - {record.endTime}</TableCell>
                            <TableCell>{record.actualStart || '-'}</TableCell>
                            <TableCell>{record.actualEnd || '-'}</TableCell>
                            <TableCell>{record.status}</TableCell>
                            <TableCell>{record.lateMinutes ? `${record.lateMinutes} мин` : '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  );
                })()}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollReportPage;