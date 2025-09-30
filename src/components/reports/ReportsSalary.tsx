import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert } from '@mui/material';
import axios from 'axios';

interface Props {
  startDate: string;
  endDate: string;
  userId?: string;
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

const ReportsSalary: React.FC<Props> = ({ startDate, endDate, userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.API_URL || '';
        
        // Получаем информацию о текущем пользователе
        const userResponse = await fetch('/auth/me', {
          credentials: 'include'
        });
        let currentUserData = null;
        if (userResponse.ok) {
          const userData = await userResponse.json();
          currentUserData = {
            id: userData.data._id || userData.data.id,
            role: userData.data.role
          };
          setCurrentUser(currentUserData);
        }
        
        // Используем currentUserData вместо currentUser
        const user = currentUserData;
        
        // Формируем параметры запроса
        const params: any = { startDate, endDate };
        // Если пользователь не администратор, он может видеть только свои данные
        if (currentUserData && currentUserData.role !== 'admin') {
          params.userId = currentUserData.id;
        } else if (userId) {
          // Администратор может фильтровать по userId
          params.userId = userId;
        }
        
        const [sumRes, payrollsRes] = await Promise.all([
          axios.get(`${base}/reports/salary/summary`, { params }),
          axios.get(`${base}/payroll`, { params })
        ]);
        if (!mounted) return;
        setSummary(sumRes.data);
        const data = (payrollsRes.data?.data || []) as any[];
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
  }, [startDate, endDate, userId]);

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
