import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Typography,
} from '@mui/material';
import {
  Groups as GroupsIcon,
  Refresh as RefreshIcon,
  Restaurant as RestaurantIcon,
} from '@mui/icons-material';
import { getAttendanceStats, AttendanceStats } from '../../children/services/childAttendance';
import { TIMEZONE } from '../../../shared/utils/timezone';

const getTodayInAlmaty = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

const formatDate = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
};

const TodayMarkedChildrenWidget: React.FC = () => {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const today = useMemo(() => getTodayInAlmaty(), []);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAttendanceStats({
        startDate: today,
        endDate: today,
      });
      setStats(data);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить отметки детей');
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const presentCount = stats?.byStatus.present || 0;
  const lateCount = stats?.byStatus.late || 0;
  const mealCount = presentCount + lateCount;
  const absentCount = stats?.byStatus.absent || 0;
  const sickCount = stats?.byStatus.sick || 0;
  const vacationCount = stats?.byStatus.vacation || 0;

  return (
    <Card
      sx={{
        height: '100%',
        color: 'white',
        background: 'linear-gradient(135deg, #1f9d8a 0%, #2b6cb0 100%)',
        borderRadius: 3,
        boxShadow: '0 10px 20px rgba(31, 157, 138, 0.24)',
      }}
    >
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RestaurantIcon />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Детей к питанию
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.86 }}>
                Сегодня, {formatDate(today)}
              </Typography>
            </Box>
          </Box>
          <Button
            size="small"
            color="inherit"
            onClick={fetchStats}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={14} color="inherit" /> : <RefreshIcon />}
            sx={{
              borderColor: 'rgba(255,255,255,0.5)',
              color: 'white',
              minWidth: 0,
              px: 1,
            }}
            variant="outlined"
          >
            Обновить
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ bgcolor: 'rgba(255,255,255,0.92)' }}>
            {error}
          </Alert>
        )}

        {!error && loading ? (
          <Box flexGrow={1} display="flex" alignItems="center" justifyContent="center" py={2}>
            <CircularProgress color="inherit" />
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="flex-end" gap={1}>
              <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 0.9 }}>
                {mealCount}
              </Typography>
              <GroupsIcon sx={{ mb: 0.7, opacity: 0.86 }} />
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Всего отмечено: {stats?.total || 0}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Chip label={`Присутствуют: ${presentCount}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white' }} />
              <Chip label={`Опоздали: ${lateCount}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white' }} />
              <Chip label={`Нет: ${absentCount + sickCount + vacationCount}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: 'white' }} />
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayMarkedChildrenWidget;
