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
} from 'recharts';
import { getAttendanceStats } from '../services/childAttendance';
import { useAuth } from './context/AuthContext';

interface AttendanceStatsWidgetProps {
  onStatsChange?: () => void;
}

const AttendanceStatsWidget: React.FC<AttendanceStatsWidgetProps> = ({
  onStatsChange,
}) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);


  useEffect(() => {
    const fetchAttendanceStats = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {

        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);

        const statsData = await getAttendanceStats({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        });

        setStats(statsData);


        const chartDataArray = [
          {
            name: 'Присутствия',
            value: statsData.byStatus.present || 0,
            color: '#4caf50',
          },
          {
            name: 'Отсутствия',
            value: statsData.byStatus.absent || 0,
            color: '#f44336',
          },
          {
            name: 'Опоздания',
            value: statsData.byStatus.late || 0,
            color: '#ff9800',
          },
          {
            name: 'Болеют',
            value: statsData.byStatus.sick || 0,
            color: '#2196f3',
          },
          {
            name: 'Отпуск',
            value: statsData.byStatus.vacation || 0,
            color: '#9c27b0',
          },
        ];

        setChartData(chartDataArray);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching attendance stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceStats();
  }, [currentUser]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'success';
      case 'absent':
        return 'error';
      case 'late':
        return 'warning';
      case 'sick':
        return 'info';
      case 'vacation':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present':
        return 'Присутствия';
      case 'absent':
        return 'Отсутствия';
      case 'late':
        return 'Опоздания';
      case 'sick':
        return 'Болеют';
      case 'vacation':
        return 'Отпуск';
      default:
        return status;
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'white',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.18)',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.18)',
        },
        borderRadius: 2,
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          p: 2,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1,
            borderBottom: '1px solid #dee2e6',
          }}
        ></Box>

        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
            }}
          >
            <CircularProgress />
          </Box>
        ) : !stats ? (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexGrow: 1,
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
                    backgroundColor: '#e8f5e9',
                    border: '1px solid #c8e6c9',
                  }}
                >
                  <CardContent>
                    <Typography
                      variant='h6'
                      align='center'
                      color='success.main'
                    >
                      {stats.total}
                    </Typography>
                    <Typography
                      variant='body2'
                      align='center'
                      color='text.secondary'
                    >
                      Всего записей
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: '#fff3e0',
                    border: '1px solid #ffe0b2',
                  }}
                >
                  <CardContent>
                    <Typography
                      variant='h6'
                      align='center'
                      color='warning.main'
                    >
                      {stats.attendanceRate}%
                    </Typography>
                    <Typography
                      variant='body2'
                      align='center'
                      color='text.secondary'
                    >
                      Посещаемость
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: '#e3f2fd',
                    border: '1px solid #bbdefb',
                  }}
                >
                  <CardContent>
                    <Typography variant='h6' align='center' color='info.main'>
                      {stats.byStatus.present || 0}
                    </Typography>
                    <Typography
                      variant='body2'
                      align='center'
                      color='text.secondary'
                    >
                      Присутствия
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card
                  sx={{
                    height: '100%',
                    backgroundColor: '#ffebee',
                    border: '1px solid #ffcdd2',
                  }}
                >
                  <CardContent>
                    <Typography variant='h6' align='center' color='error.main'>
                      {(stats.byStatus.absent || 0) +
                        (stats.byStatus.sick || 0)}
                    </Typography>
                    <Typography
                      variant='body2'
                      align='center'
                      color='text.secondary'
                    >
                      Отсутствия
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
                  <Tooltip />
                  <Legend />
                  <Bar dataKey='value' fill='#8884d8' />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* Детализация по статусам */}
            <Box sx={{ mt: 2 }}>
              <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 600 }}>
                Детализация:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(stats.byStatus).map(([status, count]) => (
                  <Chip
                    key={status}
                    label={`${getStatusLabel(status)}: ${count}`}
                    size='small'
                    color={getStatusColor(status) as any}
                    variant='outlined'
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AttendanceStatsWidget;
