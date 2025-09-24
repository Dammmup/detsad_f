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
}

const ReportsSalary: React.FC<Props> = ({ startDate, endDate, userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const base = process.env.REACT_APP_API_URL || '';
        const [sumRes, listRes] = await Promise.all([
          axios.get(`${base}/reports/salary/summary`, { params: { startDate, endDate, userId } }),
          axios.post(`${base}/payroll/export`, { format: 'json', startDate, endDate, staffId: userId })
        ]);
        if (!mounted) return;
        setSummary(sumRes.data);
        const data = (listRes.data?.data || []) as any[];
        setRows(data.map((p: any) => ({
          staffName: p.staffId?.fullName || 'Неизвестно',
          month: p.month,
          accruals: p.accruals || 0,
          bonuses: p.bonuses || 0,
          penalties: p.penalties || 0,
          total: p.total || 0
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
                <TableCell align="right">Премии</TableCell>
                <TableCell align="right">Штрафы</TableCell>
                <TableCell align="right">Итого</TableCell>
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
