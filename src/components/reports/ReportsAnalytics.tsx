import React, { useEffect, useState } from 'react';
import { Box, Grid, Card, CardContent, Typography, Table, TableHead, TableRow, TableCell, TableBody, CircularProgress, Alert } from '@mui/material';
import { getAttendanceStatistics, getScheduleStatistics } from '../../services/api/reports';

interface Props {
  startDate: string;
  endDate: string;
  userId?: string;
}

const ReportsAnalytics: React.FC<Props> = ({ startDate, endDate, userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attendance, setAttendance] = useState<any>(null);
  const [schedule, setSchedule] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [att, sch] = await Promise.all([
          getAttendanceStatistics(startDate, endDate, userId),
          getScheduleStatistics(startDate, endDate, userId)
        ]);
        if (mounted) {
          setAttendance(att);
          setSchedule(sch);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Ошибка загрузки аналитики');
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
              <Typography variant="h6" color="primary">Дней в периоде</Typography>
              <Typography variant="h4">{attendance?.totalDays ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">Присутствий</Typography>
              <Typography variant="h4">{attendance?.presentDays ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">Опоздания</Typography>
              <Typography variant="h4">{attendance?.lateDays ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="info.main">Часы работы</Typography>
              <Typography variant="h4">{attendance?.totalWorkHours ?? 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Посещаемость</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Метрика</TableCell>
                    <TableCell align="right">Значение</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow><TableCell>Дней</TableCell><TableCell align="right">{attendance?.totalDays ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Присутствий</TableCell><TableCell align="right">{attendance?.presentDays ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Отсутствий</TableCell><TableCell align="right">{attendance?.absentDays ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Опозданий</TableCell><TableCell align="right">{attendance?.lateDays ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Ср. часы/день</TableCell><TableCell align="right">{attendance?.averageWorkHoursPerDay ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Точность</TableCell><TableCell align="right">{attendance?.punctualityRate ?? 0}%</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Расписание</Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Метрика</TableCell>
                    <TableCell align="right">Значение</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow><TableCell>Смен</TableCell><TableCell align="right">{schedule?.totalShifts ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Полных</TableCell><TableCell align="right">{schedule?.regularShifts ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Сверхурочных</TableCell><TableCell align="right">{schedule?.overtimeShifts ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Запланировано часов</TableCell><TableCell align="right">{schedule?.totalScheduledHours ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Отработано часов</TableCell><TableCell align="right">{schedule?.totalWorkedHours ?? 0}</TableCell></TableRow>
                  <TableRow><TableCell>Эффективность</TableCell><TableCell align="right">{schedule?.efficiencyRate ?? 0}%</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReportsAnalytics;
