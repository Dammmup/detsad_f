import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Table, TableHead, TableRow, TableCell, TableBody,
  Card, CardContent, Grid, Chip, IconButton, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { AttachMoney, Download, Edit, Visibility, Calculate } from '@mui/icons-material';

interface PayrollRecord {
  id: string;
  staffId: string;
  staffName: string;
  position: string;
  baseSalary: number;
  workDays: number;
  overtime: number;
  bonuses: number;
  deductions: number;
  totalSalary: number;
  month: string;
  status: 'draft' | 'calculated' | 'approved' | 'paid';
}

const PayrollReports: React.FC = () => {
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);

  const statusColors = {
    draft: 'default',
    calculated: 'info',
    approved: 'warning',
    paid: 'success'
  } as const;

  const statusLabels = {
    draft: 'Черновик',
    calculated: 'Рассчитано',
    approved: 'Утверждено',
    paid: 'Выплачено'
  };

  // Генерируем тестовые данные
  useEffect(() => {
 
  }, []);

  const calculateTotals = () => {
    const totalBaseSalary = payrolls.reduce((sum, p) => sum + p.baseSalary, 0);
    const totalBonuses = payrolls.reduce((sum, p) => sum + p.bonuses, 0);
    const totalDeductions = payrolls.reduce((sum, p) => sum + p.deductions, 0);
    const totalPayroll = payrolls.reduce((sum, p) => sum + p.totalSalary, 0);

    return { totalBaseSalary, totalBonuses, totalDeductions, totalPayroll };
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'KZT',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleViewDetails = (payroll: PayrollRecord) => {
    setSelectedPayroll(payroll);
    setDetailsOpen(true);
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1" gutterBottom>
          <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
          Расчет зарплат
        </Typography>
        <Box display="flex" gap={2}>
          <Button variant="outlined" startIcon={<Calculate />}>
            Рассчитать зарплаты
          </Button>
          <Button variant="contained" startIcon={<Download />} color="success">
            Экспорт ведомости
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">Базовые оклады</Typography>
              <Typography variant="h5">{formatCurrency(totals.totalBaseSalary)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Премии</Typography>
              <Typography variant="h5">{formatCurrency(totals.totalBonuses)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">Удержания</Typography>
              <Typography variant="h5">{formatCurrency(totals.totalDeductions)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">К выплате</Typography>
              <Typography variant="h4">{formatCurrency(totals.totalPayroll)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Месяц"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button variant="outlined">
            Применить фильтр
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Сотрудник</TableCell>
              <TableCell>Должность</TableCell>
              <TableCell align="right">Оклад</TableCell>
              <TableCell align="center">Дни</TableCell>
              <TableCell align="right">Премии</TableCell>
              <TableCell align="right">Удержания</TableCell>
              <TableCell align="right">К выплате</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {payrolls.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell>{payroll.staffName}</TableCell>
                <TableCell>{payroll.position}</TableCell>
                <TableCell align="right">{formatCurrency(payroll.baseSalary)}</TableCell>
                <TableCell align="center">{payroll.workDays}</TableCell>
                <TableCell align="right">{formatCurrency(payroll.bonuses)}</TableCell>
                <TableCell align="right">{formatCurrency(payroll.deductions)}</TableCell>
                <TableCell align="right">
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(payroll.totalSalary)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[payroll.status]}
                    color={statusColors[payroll.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleViewDetails(payroll)}>
                    <Visibility />
                  </IconButton>
                  <IconButton size="small">
                    <Edit />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Детали расчета зарплаты</DialogTitle>
        <DialogContent>
          {selectedPayroll && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedPayroll.staffName} - {selectedPayroll.position}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Базовый оклад:</Typography>
                  <Typography variant="h6">{formatCurrency(selectedPayroll.baseSalary)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Отработано дней:</Typography>
                  <Typography variant="h6">{selectedPayroll.workDays}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Сверхурочные:</Typography>
                  <Typography variant="h6">{formatCurrency(selectedPayroll.overtime)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Премии:</Typography>
                  <Typography variant="h6">{formatCurrency(selectedPayroll.bonuses)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Удержания:</Typography>
                  <Typography variant="h6" color="error">{formatCurrency(selectedPayroll.deductions)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">Итого к выплате:</Typography>
                  <Typography variant="h5" color="primary" fontWeight="bold">
                    {formatCurrency(selectedPayroll.totalSalary)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Закрыть</Button>
          <Button variant="contained">Печать расчетного листа</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PayrollReports;
