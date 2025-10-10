import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

interface Props {
  userId?: string;
}

interface CurrentUser {
  id: string;
 role: string;
}

interface PayrollRow {
  staffName: string;
 month: string;
 accruals: number;
  bonuses: number;
  penalties: number;
  total: number;
  status: string;
  staffId: string;
}

// Тип для информации о пользователе
interface CurrentUser {
  id: string;
  role: string;
}

const ReportsSalary: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let mounted = true;
    
    // Определяем текущий месяц
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Импортируем сервисы
        const { getCurrentUser } = await import('../../services/auth');
        const { getSalarySummary } = await import('../../services/reports');
        const { getPayrolls } = await import('../../services/payroll');
        
        // Получаем информацию о текущем пользователе через сервис
        let currentUserData = null;
        try {
          const userData = getCurrentUser();
          if (userData) {
            currentUserData = {
              id: userData.id,
              role: userData.role || 'staff'  // Устанавливаем значение по умолчанию
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }
        
        // Формируем параметры запроса - теперь используем текущий месяц
        const params: any = {
          month: currentMonth  // используем месяц вместо startDate/endDate
        };
        
        // Если пользователь не администратор, он может видеть только свои данные
        if (currentUserData && currentUserData.role !== 'admin') {
          params.userId = currentUserData.id;
        } else if (userId) {
          // Администратор может фильтровать по userId
          params.userId = userId;
        }
        
        const [summaryData, payrollsData] = await Promise.all([
          getSalarySummary(currentMonth),
          getPayrolls(params)
        ]);
        
        if (!mounted) return;
        setSummary(summaryData);
        const data = (payrollsData?.data || payrollsData || []) as any[];
        setRows(data.map((p: any) => ({
          staffName: p.staffId?.fullName || 'Неизвестно',
          month: p.month,
          accruals: p.accruals || 0,
          bonuses: p.bonuses || 0,
          penalties: p.penalties || 0,
          total: p.total || 0,
          status: p.status || 'draft',
          staffId: p.staffId?._id || p.staffId?.id || ''
        })));
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Ошибка загрузки зарплат');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [userId]); // убрали startDate и endDate из зависимостей

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Сотрудников</Typography>
              <Typography variant="h4">{summary?.totalEmployees ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Начисления</Typography>
              <Typography variant="h4">{summary?.totalAccruals ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">Штрафы</Typography>
              <Typography variant="h4">{summary?.totalPenalties ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6">К выплате</Typography>
              <Typography variant="h4">{summary?.totalPayout ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Расчетные листы</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Месяц</TableCell>
                <TableCell align="right">Начисления</TableCell>
                <TableCell align="right">Штрафы</TableCell>
                <TableCell align="right">Итого</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.staffName}</TableCell>
                  <TableCell>{r.month}</TableCell>
                  <TableCell align="right">{r.accruals}</TableCell>
                  <TableCell align="right">{r.bonuses}</TableCell>
                  <TableCell align="right">{r.penalties}</TableCell>
                  <TableCell align="right">{r.total}</TableCell>
                  <TableCell>
                    {r.status === 'draft' ? 'Черновик' :
                     r.status === 'calculated' ? 'Рассчитано' :
                     r.status === 'approved' ? 'Подтвержден' : 'Оплачен'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ReportsSalary;
