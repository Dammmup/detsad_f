import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Chip,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuth } from '../../../app/context/AuthContext';
import { useDate } from '../../../app/context/DateContext';
import { formatCurrency } from '../../../shared/utils/format';
import { apiClient } from '../../../shared/utils/api';

interface FinancialStatsWidgetProps {
  onStatsChange?: () => void;
}

const FinancialStatsWidget: React.FC<FinancialStatsWidgetProps> = ({
  onStatsChange,
}) => {
  const { user: currentUser } = useAuth();
  const { currentDate } = useDate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);


  useEffect(() => {
    const fetchFinancialStats = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {
        const startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1,
        );
        const endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0,
        );

        // Форматируем даты в локальном часовом поясе YYYY-MM-DD
        const formatDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const response = await apiClient.get('/payroll/summary', {
          params: {
            startDate: formatDate(startDate),
            endDate: formatDate(endDate),
            userId: currentUser.id,
          },
        });

        const statsData = response.data;

        setStats(statsData);


        const chartDataArray = [
          {
            name: 'Начисления',
            value: statsData.totalAccruals || 0,
            color: '#4caf50',
          },
          {
            name: 'Авансы',
            value: statsData.totalAdvance || 0,
            color: '#2196f3',
          },
          {
            name: 'Вычеты',
            value: statsData.totalPenalties || 0,
            color: '#f44336',
          },
          {
            name: 'К выплате',
            value: statsData.totalPayout || 0,
            color: '#ff9800',
          },
        ];

        setChartData(chartDataArray);
      } catch (err: any) {
        let friendlyError = err.message;
        if (
          friendlyError &&
          (friendlyError.includes('Unexpected token') ||
            friendlyError.includes('<'))
        ) {
          friendlyError =
            'Ошибка соединения с сервером или некорректный ответ API.';
        }
        setError(friendlyError);
        console.error('Error fetching financial stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFinancialStats();
  }, [currentUser, currentDate]);















  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        border: 'none',
        borderRadius: 0,
        boxShadow: 'none',
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
          '&:last-child': {
            pb: 2,
          },
        }}
      >
        {/* Удален пустой разделитель, так как заголовок находится в Dashboard.tsx */}

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {currentUser?.role !== 'admin' ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            <Typography color='text.secondary'>
              Финансовая статистика доступна только администраторам
            </Typography>
          </Box>
        ) : loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        ) : !stats ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
              textAlign: 'center',
            }}
          >
            <Typography color='text.secondary'>Нет данных</Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Основные метрики */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    border: '1px solid #bbf7d0',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(76, 175, 80, 0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography
                      variant='h6'
                      align='center'
                      sx={{ fontWeight: 700, color: '#166534' }}
                    >
                      {formatCurrency(stats.totalAccruals || 0)}
                    </Typography>
                    <Typography
                      variant='caption'
                      display='block'
                      align='center'
                      sx={{ color: '#166534', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}
                    >
                      Начисления
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                    border: '1px solid #bfdbfe',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(33, 150, 243, 0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography
                      variant='h6'
                      align='center'
                      sx={{ fontWeight: 700, color: '#1e40af' }}
                    >
                      {formatCurrency(stats.totalAdvance || 0)}
                    </Typography>
                    <Typography
                      variant='caption'
                      display='block'
                      align='center'
                      sx={{ color: '#1e40af', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}
                    >
                      Авансы
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                    border: '1px solid #fecaca',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(244, 67, 54, 0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography
                      variant='h6'
                      align='center'
                      sx={{ fontWeight: 700, color: '#991b1b' }}
                    >
                      {formatCurrency(stats.totalPenalties || 0)}
                    </Typography>
                    <Typography
                      variant='caption'
                      display='block'
                      align='center'
                      sx={{ color: '#991b1b', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}
                    >
                      Вычеты
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    border: '1px solid #fed7aa',
                    borderRadius: 2,
                    boxShadow: '0 2px 4px rgba(255, 152, 0, 0.1)',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-2px)' }
                  }}
                >
                  <CardContent sx={{ p: '16px !important' }}>
                    <Typography
                      variant='h6'
                      align='center'
                      sx={{ fontWeight: 700, color: '#9a3412' }}
                    >
                      {formatCurrency(stats.totalPayout || 0)}
                    </Typography>
                    <Typography
                      variant='caption'
                      display='block'
                      align='center'
                      sx={{ color: '#9a3412', opacity: 0.8, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}
                    >
                      К выплате
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* График */}
            <Box sx={{ flexGrow: 1, minHeight: 200 }}>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      formatCurrency(Number(value)),
                      'Сумма',
                    ]}
                  />
                  <Legend />
                  <Bar dataKey='value'>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Детализация по типам */}
            <Box sx={{ mt: 3, pt: 2, borderTop: '1px dashed #e2e8f0' }}>
              <Typography variant='caption' sx={{ mb: 1.5, fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', display: 'block' }}>
                Статистика за период:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Chip
                  label={`Сотрудников: ${stats.totalEmployees || 0}`}
                  size='small'
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    border: '1px solid #e2e8f0',
                  }}
                />
                <Chip
                  label={`Начислений: ${stats.totalAccrualsCount || 0}`}
                  size='small'
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#f0fdf4',
                    color: '#16a34a',
                    border: '1px solid #dcfce7',
                  }}
                />
                <Chip
                  label={`Вычетов: ${stats.totalPenaltiesCount || 0}`}
                  size='small'
                  sx={{
                    fontWeight: 600,
                    backgroundColor: '#fef2f2',
                    color: '#dc2626',
                    border: '1px solid #fee2e2',
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default FinancialStatsWidget;
