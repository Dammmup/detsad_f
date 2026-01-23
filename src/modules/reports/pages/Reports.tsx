import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Card,
  SelectChangeEvent,
} from '@mui/material';
import {
  Assessment,
  Email,
  AttachMoney,
  People,
  ChildCare,
  BarChart,
  Download,
} from '@mui/icons-material';
import moment from 'moment';
import { useDate } from '../../../app/context/DateContext';
import ReportsSalary from '../components/PayrollList';
import ReportsRent from '../components/RentReport';
import ReportsChildren from '../components/ChildrenReport';
import { useAuth } from '../../../app/context/AuthContext';
import childrenApi from '../../children/services/children';
import { getChildAttendance } from '../../children/services/childAttendance';
import { getShifts } from '../../staff/services/shifts';
import {
  exportChildrenList,
  exportChildrenAttendance,
  exportStaffAttendance,
  exportSalaryReport,
} from '../../../shared/utils/excelExport';
import {
  getPayrollsByUsers,
  generatePayrollSheets,
} from '../../staff/services/payroll';
import DateNavigator from '../../../shared/components/DateNavigator';
import { getUsers } from '../../staff/services/userService';

const Reports: React.FC = () => {
  const { currentDate } = useDate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [exportType, setExportType] = useState<'salary' | 'children' | 'attendance' | 'schedule'>('salary');

  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const users = await getUsers();
      setStaff(users);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleExportSalary = async () => {
    setLoading(true);
    setError(null);
    try {
      const period = moment(currentDate).format('YYYY-MM');
      await generatePayrollSheets(period);
      const payrolls = await getPayrollsByUsers({
        period: period,
        userId: selectedUserId || undefined,
      });
      await exportSalaryReport(payrolls);
      setSuccess('Отчет по зарплатам успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по зарплатам');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const children = await childrenApi.getAll();
      await exportChildrenList(children, selectedGroupId || undefined);
      setSuccess('Список детей успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта списка детей');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD');
      const endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD');

      const attendanceData = await getChildAttendance({
        startDate,
        endDate,
        groupId: selectedGroupId || undefined,
      });
      const allChildren = await childrenApi.getAll();
      const children = selectedGroupId
        ? allChildren.filter((c: any) => {
          const groupId = typeof c.groupId === 'object' ? c.groupId?._id : c.groupId;
          return groupId === selectedGroupId;
        })
        : allChildren;

      const groupName = selectedGroupId ? 'Selected_Group' : 'All_Groups';
      await exportChildrenAttendance(attendanceData, groupName, `${startDate}_${endDate}`, children);
      setSuccess('Отчет по посещаемости успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта посещаемости');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      const startDate = moment(currentDate).startOf('month').format('YYYY-MM-DD');
      const endDate = moment(currentDate).endOf('month').format('YYYY-MM-DD');

      const shifts = await getShifts(startDate, endDate);
      await exportStaffAttendance(shifts, `${startDate}_${endDate}`);
      setSuccess('Расписание сотрудников успешно экспортировано!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта расписания');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleAdvancedExport = (type: 'salary' | 'children' | 'attendance' | 'schedule') => {
    switch (type) {
      case 'salary':
        return handleExportSalary();
      case 'children':
        return handleExportChildren();
      case 'attendance':
        return handleExportAttendance();
      case 'schedule':
        return handleExportSchedule();
    }
  };

  const isAdminOrManager = authUser?.role === 'admin' || authUser?.role === 'manager';

  useEffect(() => {
    if (!isAdminOrManager && tabValue === 0) {
      setTabValue(1);
    }
  }, [isAdminOrManager, tabValue]);

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <DateNavigator />

      {/* Заголовок */}
      <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
        <Typography variant='h5' display='flex' alignItems='center'>
          <Assessment sx={{ mr: 1 }} /> Отчеты и Экспорт
        </Typography>
      </Box>

      {/* Уведомления */}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Кнопки экспорта */}
      <Card
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
          📊 Экспорт отчетов в Excel
        </Typography>
        <Typography variant='body2' sx={{ mb: 3, opacity: 0.9 }}>
          Выгрузите данные за {moment(currentDate).format('MMMM YYYY')}
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {isAdminOrManager && (
            <Button
              variant='contained'
              color='inherit'
              startIcon={<AttachMoney />}
              onClick={() => handleAdvancedExport('salary')}
              disabled={loading}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Зарплаты
            </Button>
          )}

          <Button
            variant='contained'
            color='inherit'
            startIcon={<ChildCare />}
            onClick={() => handleAdvancedExport('children')}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            Список детей
          </Button>

          <Button
            variant='contained'
            color='inherit'
            startIcon={<People />}
            onClick={() => handleAdvancedExport('attendance')}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            }}
          >
            Посещаемость детей
          </Button>

          {isAdminOrManager && (
            <Button
              variant='contained'
              color='inherit'
              startIcon={<BarChart />}
              onClick={() => handleAdvancedExport('schedule')}
              disabled={loading}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              }}
            >
              Расписание сотрудников
            </Button>
          )}
        </Box>

        {loading && (
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} sx={{ color: 'white' }} />
            <Typography variant='body2'>Формирование отчета...</Typography>
          </Box>
        )}
      </Card>

      {/* Вкладки с детальными отчетами */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        {isAdminOrManager && <Tab label='Зарплаты' />}
        <Tab label='Дети' />
        {authUser?.role === 'admin' && <Tab label='Аренда' />}
      </Tabs>

      {tabValue === 0 && isAdminOrManager && <ReportsSalary />}
      {tabValue === 1 && <ReportsChildren />}
      {tabValue === 2 && authUser?.role === 'admin' && <ReportsRent />}
    </Paper>
  );
};

export default Reports;
