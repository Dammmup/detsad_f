import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Grid, Card, CardContent, CircularProgress, Alert
} from '@mui/material';
import { getAttendanceStatistics, getScheduleStatistics } from '../services/api/reports';
import { getUsers } from '../services/api/users';
import { getGroups } from '../services/api/groups';
import { ID, UserRole } from '../types/common';

// Интерфейс для сотрудника
interface StaffMember {
  id?: ID;
  fullName: string;
 role?: UserRole;
}

// Интерфейс для аналитических данных
interface AnalyticsData {
  attendance?: {
    totalDays: number;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    attendanceRate: number;
    totalWorkHours: number;
    averageWorkHoursPerDay: number;
    earlyLeaveDays: number;
    sickDays: number;
    vacationDays: number;
    punctualityRate: number;
  };
  schedule?: {
    totalShifts: number;
    regularShifts: number;
    overtimeShifts: number;
    cancelledShifts: number;
    totalScheduledHours: number;
    totalWorkedHours: number;
    efficiencyRate: number;
    sickLeaves: number;
    vacationDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHoursPerDay: number;
  };
  staffCount?: number;
  groupsCount?: number;
}

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [startDate] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate] = useState<Date>(new Date());

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Загружаем статистику
        const [attendanceStats, scheduleStats, staffData, groupsData] = await Promise.all([
          getAttendanceStatistics(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ),
          getScheduleStatistics(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ),
          getUsers(),
          getGroups()
        ]);

        setAnalyticsData({
          attendance: attendanceStats,
          schedule: scheduleStats,
          staffCount: staffData.length,
          groupsCount: groupsData.length
        });

        setStaff(staffData.map(user => ({
          id: user._id || user.id,
          fullName: user.fullName,
          role: user.role
        })));
        
        setGroups(groupsData);
      } catch (err: any) {
        setError(err?.message || 'Ошибка загрузки аналитических данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [startDate, endDate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error && !analyticsData) {
    return <Alert severity="error">{error}</Alert>;
 }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Аналитика</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Статистика посещаемости</Typography>
              {analyticsData?.attendance ? (
                <>
                  <Typography>Всего дней: <strong>{analyticsData.attendance.totalDays}</strong></Typography>
                  <Typography>Присутствие: <strong>{analyticsData.attendance.presentDays}</strong> дней ({analyticsData.attendance.attendanceRate}%)</Typography>
                  <Typography>Опоздания: <strong>{analyticsData.attendance.lateDays}</strong> дней</Typography>
                  <Typography>Отсутствия: <strong>{analyticsData.attendance.absentDays}</strong> дней</Typography>
                  <Typography>Болезни: <strong>{analyticsData.attendance.sickDays}</strong> дней</Typography>
                  <Typography>Отпуска: <strong>{analyticsData.attendance.vacationDays}</strong> дней</Typography>
                  <Typography>Пунктуальность: <strong>{analyticsData.attendance.punctualityRate}%</strong></Typography>
                </>
              ) : (
                <Typography color="text.secondary">Данные недоступны</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Статистика расписания</Typography>
              {analyticsData?.schedule ? (
                <>
                  <Typography>Всего смен: <strong>{analyticsData.schedule.totalShifts}</strong></Typography>
                  <Typography>Обычные смены: <strong>{analyticsData.schedule.regularShifts}</strong></Typography>
                  <Typography>Сверхурочные: <strong>{analyticsData.schedule.overtimeShifts}</strong></Typography>
                  <Typography>Отмененные: <strong>{analyticsData.schedule.cancelledShifts}</strong></Typography>
                  <Typography>Общие часы: <strong>{analyticsData.schedule.totalHours}</strong> ч</Typography>
                  <Typography>Средние часы в день: <strong>{analyticsData.schedule.averageHoursPerDay}</strong> ч</Typography>
                  <Typography>Эффективность: <strong>{analyticsData.schedule.efficiencyRate}%</strong></Typography>
                </>
              ) : (
                <Typography color="text.secondary">Данные недоступны</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Общая статистика</Typography>
              <Typography>Сотрудников: <strong>{analyticsData?.staffCount || staff.length}</strong></Typography>
              <Typography>Групп: <strong>{analyticsData?.groupsCount || groups.length}</strong></Typography>
              <Typography>Общие рабочие часы: <strong>{analyticsData?.attendance?.totalWorkHours || 0}</strong> ч</Typography>
              <Typography>Средние рабочие часы в день: <strong>{analyticsData?.attendance?.averageWorkHoursPerDay || 0}</strong> ч</Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Дополнительная информация</Typography>
              <Typography>Поздние уходы: <strong>{analyticsData?.attendance?.earlyLeaveDays || 0}</strong> дней</Typography>
              <Typography>Общее количество сотрудников: <strong>{staff.length}</strong></Typography>
              <Typography>Общее количество групп: <strong>{groups.length}</strong></Typography>
              <Typography>Период анализа: <strong>{startDate.toLocaleDateString('ru-RU')} - {endDate.toLocaleDateString('ru-RU')}</strong></Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Графики и диаграммы</Typography>
              <Box sx={{ 
                height: 300, 
                bgcolor: 'rgba(0, 0, 0, 0.04)', 
                borderRadius: 1, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mt: 2
              }}>
                <Typography color="text.secondary">
                  Интерактивные графики посещаемости и эффективности работы
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;