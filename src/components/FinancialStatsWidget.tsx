import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Grid,
  Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from './context/AuthContext';
import { formatCurrency } from '../utils/format';

interface FinancialStatsWidgetProps {
  onStatsChange?: () => void; // Callback для обновления статистики
}

const FinancialStatsWidget: React.FC<FinancialStatsWidgetProps> = ({ onStatsChange }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);

  // Загрузка финансовой статистики
  useEffect(() => {
    const fetchFinancialStats = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        // Используем токен из AuthContext
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Требуется аутентификация');
        }
        
        const response = await fetch(`/api/reports/salary/summary?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}&userId=${currentUser.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          // Проверяем, является ли ответ JSON
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Не удалось загрузить финансовую статистику');
          } else {
            // Если ответ не JSON, то возможно это HTML страница ошибки
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error('Сервер вернул ошибку');
          }
        }
        
        const statsData = await response.json();
        

        
        setStats(statsData);
        
        // Подготовка данных для графика
        const chartDataArray = [
          { name: 'Начисления', value: statsData.totalAccruals || 0, color: '#4caf50' },
          { name: 'Штрафы', value: statsData.totalPenalties || 0, color: '#f44336' },
          { name: 'К выплате', value: statsData.totalPayout || 0, color: '#ff9800' }
        ];
        
        setChartData(chartDataArray);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching financial stats:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFinancialStats();
  }, [currentUser]);

  // const getPriorityColor = (priority: string) => {
  //   switch (priority) {
  //     case 'high': return 'error';
  //     case 'medium': return 'warning';
  //     case 'low': return 'success';
  //     default: return 'default';
  //   }
  // };

  // const formatDate = (dateString?: string) => {
  //   if (!dateString) return '';
  //   return new Date(dateString).toLocaleDateString('ru-RU');
  // };

  return (
    <Card sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'transparent',
      border: 'none',
      borderRadius: 0,
      boxShadow: 'none'
    }}>
      <CardContent sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        '&:last-child': {
          pb: 2
        }
      }}>
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          pb: 1,
          borderBottom: '1px solid #dee2e6'
        }}>
       
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <CircularProgress size={24} />
          </Box>
        ) : !stats ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexGrow: 1,
            textAlign: 'center'
          }}>
            <Typography color="text.secondary">
              Нет данных
            </Typography>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Основные метрики */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%', 
                  backgroundColor: '#e8f5e9',
                  border: '1px solid #c8e6c9'
                }}>
                  <CardContent>
                    <Typography variant="h6" align="center" color="success.main">
                      {formatCurrency(stats.totalAccruals || 0)}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Начисления
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%', 
                  backgroundColor: '#ffebee',
                  border: '1px solid #ffcdd2'
                }}>
                  <CardContent>
                    <Typography variant="h6" align="center" color="error.main">
                      {formatCurrency(stats.totalPenalties || 0)}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      Штрафы
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card sx={{ 
                  height: '100%', 
                  backgroundColor: '#fff3e0',
                  border: '1px solid #ffe0b2'
                }}>
                  <CardContent>
                    <Typography variant="h6" align="center" color="warning.main">
                      {formatCurrency(stats.totalPayout || 0)}
                    </Typography>
                    <Typography variant="body2" align="center" color="text.secondary">
                      К выплате
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* График */}
            <Box sx={{ flexGrow: 1, minHeight: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Сумма']} />
                  <Legend />
                  <Bar dataKey="value" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Детализация по типам */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Детализация:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`Сотрудников: ${stats.totalEmployees || 0}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
                <Chip
                  label={`Начислений: ${stats.totalAccrualsCount || 0}`}
                  size="small"
                  color="success"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
                <Chip
                  label={`Штрафов: ${stats.totalPenaltiesCount || 0}`}
                  size="small"
                  color="error"
                  variant="outlined"
                  sx={{
                    fontSize: '0.7rem',
                    height: 20
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