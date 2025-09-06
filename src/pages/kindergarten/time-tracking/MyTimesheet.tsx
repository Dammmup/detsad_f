import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
  Button,
  TextField,
  MenuItem,
  Pagination,
  Alert,
  Tooltip,
  IconButton
} from '@mui/material';
import {
  AccessTime,
  DateRange,
  TrendingUp,
  Download,
  Refresh,
  Info
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';
import { toast } from 'react-toastify';
import Axios from 'axios';
import config from '../../../config';

const MyTimesheet = () => {
  const [timeEntries, setTimeEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Start of current month
    endDate: new Date(),
    status: 'all'
  });

  const statusOptions = [
    { value: 'all', label: 'Все статусы' },
    { value: 'active', label: 'Активные' },
    { value: 'completed', label: 'Завершенные' },
    { value: 'missed', label: 'Пропущенные' },
    { value: 'pending_approval', label: 'На утверждении' }
  ];

  // Fetch time entries
  const fetchTimeEntries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString()
      });

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const response = await Axios.get(`${config.baseURLApi}/time-tracking/entries?${params}`);
      setTimeEntries(response.data.entries);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      toast.error('Ошибка загрузки записей рабочего времени');
    } finally {
      setLoading(false);
    }
  };

  // Fetch summary
  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString()
      });

      const response = await Axios.get(`${config.baseURLApi}/time-tracking/summary?${params}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      toast.error('Ошибка загрузки сводки');
    }
  };

  useEffect(() => {
    fetchTimeEntries();
    fetchSummary();
  }, [page, filters]);

  // Handle filter changes
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(1); // Reset to first page when filters change
  };

  // Format time display
  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Format hours display
  const formatHours = (hours) => {
    return `${hours.toFixed(2)}ч`;
  };

  // Get status color and label
  const getStatusInfo = (status) => {
    switch (status) {
      case 'active':
        return { color: 'success', label: 'Активная' };
      case 'completed':
        return { color: 'primary', label: 'Завершена' };
      case 'missed':
        return { color: 'error', label: 'Пропущена' };
      case 'pending_approval':
        return { color: 'warning', label: 'На утверждении' };
      default:
        return { color: 'default', label: status };
    }
  };

  // Export timesheet
  const exportTimesheet = async () => {
    try {
      toast.info('Экспорт будет доступен в следующей версии');
      // In a real implementation, this would generate and download a file
    } catch (error) {
      toast.error('Ошибка экспорта');
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h4" component="h1">
              Мой табель учета рабочего времени
            </Typography>
            <Box>
              <Button
                startIcon={<Refresh />}
                onClick={() => {
                  fetchTimeEntries();
                  fetchSummary();
                }}
                sx={{ mr: 1 }}
              >
                Обновить
              </Button>
              <Button
                startIcon={<Download />}
                variant="outlined"
                onClick={exportTimesheet}
              >
                Экспорт
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* Filters */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Фильтры
              </Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Дата начала"
                    value={filters.startDate}
                    onChange={(value) => handleFilterChange('startDate', value)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <DatePicker
                    label="Дата окончания"
                    value={filters.endDate}
                    onChange={(value) => handleFilterChange('endDate', value)}
                    renderInput={(params) => <TextField {...params} fullWidth />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Статус"
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    {statusOptions.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Summary Cards */}
        {summary && (
          <>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AccessTime color="primary" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {formatHours(summary.totalHours)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Всего часов
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <DateRange color="success" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {summary.daysWorked}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Рабочих дней
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <TrendingUp color="warning" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {formatHours(summary.overtimeHours)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Сверхурочные
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <AccessTime color="info" sx={{ mr: 1 }} />
                    <Box>
                      <Typography variant="h6">
                        {formatHours(summary.averageHoursPerDay)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Среднее в день
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </>
        )}

        {/* Time Entries Table */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Записи рабочего времени
              </Typography>

              {timeEntries.length === 0 ? (
                <Alert severity="info">
                  Нет записей за выбранный период
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Дата</TableCell>
                          <TableCell>Приход</TableCell>
                          <TableCell>Уход</TableCell>
                          <TableCell>Перерыв</TableCell>
                          <TableCell>Часы</TableCell>
                          <TableCell>Сверхурочные</TableCell>
                          <TableCell>Статус</TableCell>
                          <TableCell>Действия</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {timeEntries.map((entry) => {
                          const statusInfo = getStatusInfo(entry.status);
                          return (
                            <TableRow key={entry._id}>
                              <TableCell>
                                {formatDate(entry.clockIn)}
                              </TableCell>
                              <TableCell>
                                {formatTime(entry.clockIn)}
                              </TableCell>
                              <TableCell>
                                {entry.clockOut ? formatTime(entry.clockOut) : '-'}
                              </TableCell>
                              <TableCell>
                                {entry.breakDuration ? `${entry.breakDuration}м` : '-'}
                              </TableCell>
                              <TableCell>
                                {formatHours(entry.regularHours)}
                              </TableCell>
                              <TableCell>
                                {entry.overtimeHours > 0 ? formatHours(entry.overtimeHours) : '-'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={statusInfo.label}
                                  color={statusInfo.color}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {entry.notes && (
                                  <Tooltip title={entry.notes}>
                                    <IconButton size="small">
                                      <Info />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pagination */}
                  <Box display="flex" justifyContent="center" mt={2}>
                    <Pagination
                      count={totalPages}
                      page={page}
                      onChange={(event, value) => setPage(value)}
                      color="primary"
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </LocalizationProvider>
  );
};

export default MyTimesheet;
