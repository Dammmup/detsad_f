import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Chip,
  IconButton,
  Tooltip,
  TableSortLabel,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { getPayrollsByUsers, Payroll, VirtualPayroll } from '../../services/payroll';

interface PayrollTableProps {
  period?: string;
}

type SortField = 'fullName' | 'role' | 'baseSalary' | 'total' | 'status' | 'period' | 'workedDays';
type SortDirection = 'asc' | 'desc';

const PayrollTable: React.FC<PayrollTableProps> = ({ period }) => {
 const [payrolls, setPayrolls] = useState<Array<Payroll | VirtualPayroll>>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(period || new Date().toISOString().slice(0, 7)); // текущий месяц в формате YYYY-MM
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchPayrolls();
  }, [selectedPeriod, statusFilter, searchTerm]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const filters: { period?: string; status?: string } = {
        period: selectedPeriod
      };
      
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      
      const data = await getPayrollsByUsers(filters);
      setPayrolls(data);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки данных о зарплатах');
      console.error('Error fetching payrolls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPeriod(e.target.value);
  };

  const handleStatusChange = (e: SelectChangeEvent<string>) => {
    setStatusFilter(e.target.value);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredAndSortedPayrolls = React.useMemo(() => {
    let result = [...payrolls];
    
    // Фильтрация по поисковому запросу
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(payroll => 
        payroll.staffId.fullName.toLowerCase().includes(term) ||
        payroll.staffId.role.toLowerCase().includes(term)
      );
    }
    
    // Сортировка
    result.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'fullName':
          aValue = a.staffId.fullName.toLowerCase();
          bValue = b.staffId.fullName.toLowerCase();
          break;
        case 'role':
          aValue = a.staffId.role.toLowerCase();
          bValue = b.staffId.role.toLowerCase();
          break;
        case 'baseSalary':
          aValue = a.baseSalary;
          bValue = b.baseSalary;
          break;
        case 'total':
          aValue = a.total;
          bValue = b.total;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'period':
          aValue = a.period;
          bValue = b.period;
          break;
        case 'workedDays':
          aValue = a.workedDays || 0;
          bValue = b.workedDays || 0;
          break;
        default:
          aValue = a.staffId.fullName.toLowerCase();
          bValue = b.staffId.fullName.toLowerCase();
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return result;
 }, [payrolls, searchTerm, sortField, sortDirection]);

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'draft':
        return <Chip label="Черновик" size="small" color="default" />;
      case 'approved':
        return <Chip label="Утверждено" size="small" color="primary" />;
      case 'paid':
        return <Chip label="Оплачено" size="small" color="success" />;
      default:
        return <Chip label={status} size="small" color="default" />;
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <Typography>Загрузка данных о зарплатах...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Typography color="error" align="center">{error}</Typography>;
  }

  return (
    <Box>
      <Box display="flex" gap={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          label="Период (Месяц)"
          type="month"
          value={selectedPeriod}
          onChange={handlePeriodChange}
          variant="outlined"
          size="small"
        />
        <FormControl variant="outlined" size="small" style={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            label="Статус"
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="draft">Черновик</MenuItem>
            <MenuItem value="approved">Утверждено</MenuItem>
            <MenuItem value="paid">Оплачено</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Поиск сотрудника"
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          style={{ minWidth: 200 }}
        />
        <Button variant="contained" color="primary" onClick={fetchPayrolls} startIcon={<AddIcon />}>
          Обновить
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'fullName'}
                  direction={sortField === 'fullName' ? sortDirection : 'asc'}
                  onClick={() => handleSort('fullName')}
                >
                  Сотрудник
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'role'}
                  direction={sortField === 'role' ? sortDirection : 'asc'}
                  onClick={() => handleSort('role')}
                >
                  Должность
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'baseSalary'}
                  direction={sortField === 'baseSalary' ? sortDirection : 'asc'}
                  onClick={() => handleSort('baseSalary')}
                >
                  Оклад
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Надбавки</TableCell>
              <TableCell align="right">Вычеты</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'total'}
                  direction={sortField === 'total' ? sortDirection : 'asc'}
                  onClick={() => handleSort('total')}
                >
                  Итого
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">Штрафы</TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'workedDays'}
                  direction={sortField === 'workedDays' ? sortDirection : 'asc'}
                  onClick={() => handleSort('workedDays')}
                >
                  Отработано дней/смен
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortDirection : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Статус
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'period'}
                  direction={sortField === 'period' ? sortDirection : 'asc'}
                  onClick={() => handleSort('period')}
                >
                  Период
                </TableSortLabel>
              </TableCell>
              <TableCell>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAndSortedPayrolls.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body1" color="textSecondary" style={{ fontStyle: 'italic' }}>
                    Нет данных о зарплатах за выбранный период
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedPayrolls.map((payroll) => (
                <TableRow key={payroll._id || `virtual-${payroll.staffId._id}`} hover>
                  <TableCell>{payroll.staffId.fullName}</TableCell>
                  <TableCell>{payroll.staffId.role}</TableCell>
                  <TableCell align="right">{payroll.baseSalary?.toLocaleString() || 0}</TableCell>
                  <TableCell align="right">{payroll.bonuses?.toLocaleString() || 0}</TableCell>
                  <TableCell align="right">{payroll.deductions?.toLocaleString() || 0}</TableCell>
                  <TableCell align="right">{payroll.total?.toLocaleString() || 0}</TableCell>
                  <TableCell align="right">{payroll.penalties?.toLocaleString() || 0}</TableCell>
                  <TableCell align="right">
                    {payroll.workedDays !== undefined && payroll.workedDays !== null ?
                      `${payroll.workedDays} дн.` :
                      (payroll.workedShifts !== undefined && payroll.workedShifts !== null ?
                        `${payroll.workedShifts} смен` :
                        'Нет данных')}
                  </TableCell>
                  <TableCell>
                    {payroll._id ? (
                      getStatusChip(payroll.status)
                    ) : (
                      <Tooltip title="Нет записи в базе данных, данные взяты из профиля сотрудника">
                        <Chip label="Нет записи" size="small" color="warning" variant="outlined" />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>{payroll.period}</TableCell>
                  <TableCell>
                    <Tooltip title={payroll._id ? "Редактировать" : "Создать запись"}>
                      <IconButton color="primary" size="small">
                        {payroll._id ? <EditIcon /> : <AddIcon />}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Просмотр">
                      <IconButton color="default" size="small">
                        <VisibilityIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="textSecondary">
          Показано {filteredAndSortedPayrolls.length} записей
        </Typography>
      </Box>
    </Box>
  );
};

export default PayrollTable;