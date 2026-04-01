import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Button,
  Card,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  AttachMoney,
  People,
  ChildCare,
  BarChart,
  Badge,
  Payment,
  Restaurant,
  LocalGroceryStore,
} from '@mui/icons-material';
import moment from 'moment';
import { useDate } from '../../../app/context/DateContext';
import { useAuth } from '../../../app/context/AuthContext';
import childrenApi from '../../children/services/children';
import { getChildAttendance } from '../../children/services/childAttendance';
import { getShifts } from '../../staff/services/shifts';
import {
  exportChildrenList,
  exportChildrenAttendance,
  exportStaffAttendance,
  exportSalaryReport,
  exportStaffList,
  exportChildPayments,
  exportProducts,
  exportDishes,
} from '../../../shared/utils/excelExport';
import {
  getPayrollsByUsers,
  generatePayrollSheets,
} from '../../staff/services/payroll';
import { usersApi } from '../../staff/services/users';
import childPaymentApi from '../../children/services/childPayment';
import groupsApi from '../../children/services/groups';
import { getProducts } from '../../food/services/products';
import { getDishes } from '../../food/services/dishes';

const ReportsWidget: React.FC = () => {
  const { currentDate } = useDate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleExportSalary = async () => {
    setLoading(true);
    setError(null);
    try {
      const period = moment(currentDate).format('YYYY-MM');
      await generatePayrollSheets(period);
      const payrolls = await getPayrollsByUsers({
        period: period,
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
      await exportChildrenList(children);
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
      });
      const allChildren = await childrenApi.getAll();

      const groupName = 'All_Groups';
      await exportChildrenAttendance(attendanceData, groupName, `${startDate}_${endDate}`, allChildren);
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

  const handleExportStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const staffList = await usersApi.getAll();
      await exportStaffList(staffList);
      setSuccess('Список сотрудников успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта списка сотрудников');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportChildPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const monthPeriod = moment(currentDate).format('YYYY-MM');
      const payments = await childPaymentApi.getAll({ monthPeriod });
      const children = await childrenApi.getAll();
      const groups = await groupsApi.getAll();
      await exportChildPayments(payments, children, groups);
      setSuccess('Оплаты посещений детей успешно экспортированы!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта оплат детей');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const products = await getProducts();
      await exportProducts(products);
      setSuccess('Список продуктов успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта продуктов');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleExportDishes = async () => {
    setLoading(true);
    setError(null);
    try {
      const dishes = await getDishes();
      const products = await getProducts();
      await exportDishes(dishes, products);
      setSuccess('Справочник блюд успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта блюд');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3000);
    }
  };


  const isAdminOrManager = authUser?.role === 'admin' || authUser?.role === 'manager';

  return (
    <Card
      sx={{
        mb: 3,
        p: 2,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <Typography variant='subtitle1' sx={{ mb: 1, fontWeight: 600 }} textAlign='center'>
        📊 Экспорт отчетов ({moment(currentDate).format('MMMM YYYY')})
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mb: 1, py: 0 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity='success' sx={{ mb: 1, py: 0 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        {isAdminOrManager && (
          <Button
            variant='contained'
            color='inherit'
            size="small"
            startIcon={<AttachMoney />}
            onClick={handleExportSalary}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              fontSize: '0.75rem',
            }}
          >
            Зарплаты
          </Button>
        )}

        <Button
          variant='contained'
          color='inherit'
          size="small"
          startIcon={<ChildCare />}
          onClick={handleExportChildren}
          disabled={loading}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            fontSize: '0.75rem',
          }}
        >
          Дети
        </Button>

        <Button
          variant='contained'
          color='inherit'
          size="small"
          startIcon={<People />}
          onClick={handleExportAttendance}
          disabled={loading}
          sx={{
            bgcolor: 'rgba(255,255,255,0.2)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
            fontSize: '0.75rem',
          }}
        >
          Посещаемость
        </Button>

        {isAdminOrManager && (
          <Button
            variant='contained'
            color='inherit'
            size="small"
            startIcon={<BarChart />}
            onClick={handleExportSchedule}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              fontSize: '0.75rem',
            }}
          >
            График
          </Button>
        )}

        {isAdminOrManager && (
          <Button
            variant='contained'
            color='inherit'
            size="small"
            startIcon={<Badge />}
            onClick={handleExportStaff}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              fontSize: '0.75rem',
            }}
          >
            Сотрудники
          </Button>
        )}

        {isAdminOrManager && (
          <Button
            variant='contained'
            color='inherit'
            size="small"
            startIcon={<Payment />}
            onClick={handleExportChildPayments}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              fontSize: '0.75rem',
            }}
          >
            Оплаты
          </Button>
        )}

        {isAdminOrManager && (
          <Button
            variant='contained'
            color='inherit'
            size="small"
            startIcon={<LocalGroceryStore />}
            onClick={handleExportProducts}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              fontSize: '0.75rem',
            }}
          >
            Продукты
          </Button>
        )}

        {isAdminOrManager && (
          <Button
            variant='contained'
            color='inherit'
            size="small"
            startIcon={<Restaurant />}
            onClick={handleExportDishes}
            disabled={loading}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              fontSize: '0.75rem',
            }}
          >
            Блюда
          </Button>
        )}
      </Box>

      {loading && (
        <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <CircularProgress size={16} sx={{ color: 'white' }} />
          <Typography variant='caption'>Экспорт...</Typography>
        </Box>
      )}
    </Card>
  );
};

export default ReportsWidget;
