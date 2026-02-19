import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  Chip,
  Avatar,
} from '@mui/material';
import { AccessTime, Person, CheckCircle, Schedule } from '@mui/icons-material';
import { useAuth } from '../../../app/context/AuthContext';
import { useDate } from '../../../app/context/DateContext';
import shiftsApi from '../../staff/services/shifts';
import { staffAttendanceTrackingService } from '../../staff/services/staffAttendanceTracking';
import { STATUS_TEXT, STATUS_COLORS } from '../../../shared/types/common';

interface ShiftWithAttendance {
  id: string;
  staffId: string;
  staffName: string;
  shiftTime: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'scheduled' | 'checked_in' | 'checked_out';
  lateMinutes?: number;
  earlyLeaveMinutes?: number;
}

interface StaffScheduleWidgetProps {
  onScheduleChange?: () => void;
}

const StaffScheduleWidget: React.FC<StaffScheduleWidgetProps> = () => {
  const { user: currentUser } = useAuth();
  const { currentDate } = useDate();
  const [shifts, setShifts] = useState<ShiftWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentUser?.role === 'admin';


  useEffect(() => {
    const fetchTodaySchedule = async () => {
      if (!currentUser || !currentUser.id) return;

      setLoading(true);
      setError(null);
      try {
        const todayStr = currentDate.toISOString().split('T')[0];



        const filters: any = {
          startDate: todayStr,
          endDate: todayStr,
        };

        if (!isAdmin) {
          filters.staffId = currentUser.id;
        }

        const shiftList = await shiftsApi.getAll(filters);


        let attendanceRecords: any[] = [];
        try {
          const attendanceResponse = await staffAttendanceTrackingService.getAllRecords({
            startDate: todayStr,
            endDate: todayStr,
          });
          const rawRecords = attendanceResponse?.data || attendanceResponse || [];
          attendanceRecords = Array.isArray(rawRecords) ? rawRecords : (rawRecords?.items || rawRecords?.data || []);
        } catch (e) {
          console.warn('Could not load attendance records:', e);
        }


        const attendanceMap = new Map<string, any>();
        attendanceRecords.forEach((record: any) => {
          const staffId = record.staffId?._id || record.staffId;
          if (staffId) {
            attendanceMap.set(staffId, record);
          }
        });


        const shiftsWithAttendance: ShiftWithAttendance[] = shiftList.map((shift: any) => {
          const staffId = shift.staffId?._id || shift.staffId;
          const staffName = shift.staffId?.fullName || shift.staffName || 'Неизвестно';
          const attendance = attendanceMap.get(staffId);

          let status: 'scheduled' | 'checked_in' | 'checked_out' = 'scheduled';
          let actualStart: string | undefined;
          let actualEnd: string | undefined;

          if (attendance) {
            if (attendance.actualStart && attendance.actualEnd) {
              status = 'checked_out';
              actualStart = new Date(attendance.actualStart).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });
              actualEnd = new Date(attendance.actualEnd).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });
            } else if (attendance.actualStart) {
              status = 'checked_in';
              actualStart = new Date(attendance.actualStart).toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
              });
            }
          }

          return {
            id: shift._id || shift.id,
            staffId,
            staffName,
            shiftTime: `${shift.startTime} - ${shift.endTime}`,
            actualStart,
            actualEnd,
            status,
            lateMinutes: attendance?.lateMinutes,
            earlyLeaveMinutes: attendance?.earlyLeaveMinutes,
          };
        });


        const statusOrder = { scheduled: 0, checked_in: 1, checked_out: 2 };
        shiftsWithAttendance.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

        setShifts(shiftsWithAttendance);
      } catch (err: any) {
        if (err.response && err.response.status === 403) {
          setError('Недостаточно прав для просмотра графика работы');
        } else {
          setError(err.message);
        }
        console.error('Error fetching schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaySchedule();
  }, [currentUser, currentDate, isAdmin]);

  const getStatusChip = (shift: ShiftWithAttendance) => {
    switch (shift.status) {
      case 'checked_out':
        return (
          <Chip
            icon={<CheckCircle />}
            label="Завершено"
            size="small"
            color="success"
            variant="filled"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        );
      case 'checked_in':
        return (
          <Chip
            icon={<Person />}
            label="На работе"
            size="small"
            color="primary"
            variant="filled"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        );
      default:
        return (
          <Chip
            icon={<Schedule />}
            label="Запланировано"
            size="small"
            color="warning"
            variant="outlined"
            sx={{ fontSize: '0.7rem', height: 22 }}
          />
        );
    }
  };

  const formatToday = () => {
    return currentDate.toLocaleDateString('ru-RU', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

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
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            pb: 1,
            borderBottom: '1px solid #dee2e6',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {formatToday()}
          </Typography>
          <Chip
            label={`${shifts.length} ${shifts.length === 1 ? 'смена' : shifts.length < 5 ? 'смены' : 'смен'}`}
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>

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
            <CircularProgress size={24} />
          </Box>
        ) : shifts.length === 0 ? (
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
              {isAdmin ? 'Нет смен на сегодня' : 'У вас нет смены сегодня'}
            </Typography>
          </Box>
        ) : (
          <List
            dense
            sx={{
              flexGrow: 1,
              overflowY: 'auto',
              maxHeight: 350,
            }}
          >
            {shifts.map((shift) => (
              <ListItem
                key={shift.id}
                sx={{
                  mb: 1.5,
                  p: 1.5,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  borderLeft: shift.status === 'checked_out'
                    ? '4px solid #4caf50'
                    : shift.status === 'checked_in'
                      ? '4px solid #2196f3'
                      : '4px solid #ff9800',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        sx={{
                          width: 28,
                          height: 28,
                          mr: 1,
                          bgcolor: shift.status === 'checked_out'
                            ? 'success.main'
                            : shift.status === 'checked_in'
                              ? 'primary.main'
                              : 'warning.main',
                          fontSize: '0.75rem',
                        }}
                      >
                        {shift.staffName.charAt(0)}
                      </Avatar>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: '#212529',
                          fontSize: '0.875rem',
                        }}
                      >
                        {shift.staffName}
                      </Typography>
                    </Box>
                    {getStatusChip(shift)}
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5, pl: 4.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccessTime sx={{ fontSize: '0.875rem', mr: 0.5, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                        Смена: {shift.shiftTime}
                      </Typography>
                    </Box>
                  </Box>

                  {(shift.actualStart || shift.actualEnd) && (
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5, pl: 4.5 }}>
                      {shift.actualStart && (
                        <Typography variant="body2" color="success.main" sx={{ fontSize: '0.75rem' }}>
                          Приход: {shift.actualStart}
                        </Typography>
                      )}
                      {shift.actualEnd && (
                        <Typography variant="body2" color="error.main" sx={{ fontSize: '0.75rem' }}>
                          Уход: {shift.actualEnd}
                        </Typography>
                      )}
                    </Box>
                  )}

                  {shift.lateMinutes && shift.lateMinutes > 0 && (
                    <Chip
                      label={`Опоздание: ${shift.lateMinutes}м`}
                      size="small"
                      color="error"
                      variant="outlined"
                      sx={{ mt: 0.5, ml: 4.5, fontSize: '0.65rem', height: 18 }}
                    />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffScheduleWidget;
