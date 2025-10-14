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
  ListItemText,
  Chip
} from '@mui/material';
import { CalendarToday, AccessTime } from '@mui/icons-material';
import { useAuth } from './context/AuthContext';
import { getStaffShifts, getShifts } from '../services/shifts';
// import { formatTime } from '../utils/format';

interface StaffScheduleWidgetProps {
  onScheduleChange?: () => void; // Callback для обновления при изменении графика
}

const StaffScheduleWidget: React.FC<StaffScheduleWidgetProps> = ({ onScheduleChange }) => {
  const { user: currentUser } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка графика работы
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!currentUser) return;

      setLoading(true);
      setError(null);
      try {
        // Получаем график на ближайшие 7 дней
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 7);
        
        const shiftList = await getStaffShifts({
          staffId: currentUser.id,
          startDate: today.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0]
        });
        

        
        // Сортируем по дате
        const sortedShifts = [...shiftList].sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        
        // Показываем только первые 5 смен
        setShifts(sortedShifts.slice(0, 5));
      } catch (err: any) {
        // Обработка ошибки 403 - пользователь не имеет доступа к сменам
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
    
    fetchSchedule();
  }, [currentUser]);

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case 'full': return 'Полная смена';
      case 'overtime': return 'Сверхурочная';
      case 'day_off': return 'Выходной';
      case 'vacation': return 'Отпуск';
      case 'sick_leave': return 'Больничный';
      default: return shiftType;
    }
  };

  const getShiftTypeColor = (shiftType: string) => {
    switch (shiftType) {
      case 'full': return 'primary';
      case 'overtime': return 'info';
      case 'day_off': return 'default';
      case 'vacation': return 'success';
      case 'sick_leave': return 'warning';
      default: return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Завтра';
    } else {
      return date.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' });
    }
  };

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
        ) : shifts.length === 0 ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexGrow: 1,
            textAlign: 'center'
          }}>
            <Typography color="text.secondary">
              Нет смен
            </Typography>
          </Box>
        ) : (
          <List dense sx={{ 
            flexGrow: 1, 
            overflowY: 'auto',
            maxHeight: 300
          }}>
            {shifts.map((shift) => (
              <ListItem 
                key={`${shift._id}-${shift.date}`}
                sx={{ 
                  mb: 2,
                  p: 2,
                  backgroundColor: 'white',
                  borderRadius: 2,
                  boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                  borderLeft: `4px solid ${
                    shift.shiftType === 'full' ? '#007bff' :
                    shift.shiftType === 'overtime' ? '#17a2b8' :
                    shift.shiftType === 'day_off' ? '#6c757d' :
                    shift.shiftType === 'vacation' ? '#28a745' :
                    shift.shiftType === 'sick_leave' ? '#ffc107' :
                    '#6c757d'
                  }`,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CalendarToday sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                      <Typography 
                        sx={{ 
                          fontWeight: 600,
                          color: '#212529',
                          fontSize: '0.95rem',
                          flexGrow: 1
                        }}
                      >
                        {formatDate(shift.date)}
                      </Typography>
                      <Chip 
                        label={getShiftTypeLabel(shift.shiftType)} 
                        size="small" 
                        color={getShiftTypeColor(shift.shiftType) as any}
                        variant="outlined"
                        sx={{
                          fontSize: '0.7rem',
                          height: 20,
                          fontWeight: 600
                        }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTime sx={{ fontSize: '1rem', mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">
                          {shift.startTime} - {shift.endTime}
                        </Typography>
                      </Box>
                      
                      {shift.notes && (
                        <Typography variant="body2" color="text.secondary" sx={{ 
                          fontSize: '0.8rem',
                          fontStyle: 'italic',
                          pl: 2.5
                        }}>
                          {shift.notes}
                        </Typography>
                      )}
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center', flexWrap: 'wrap' }}>
                        {shift.groupId && (
                          <Chip 
                            label="Группа назначена" 
                            size="small" 
                            variant="outlined" 
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              borderColor: 'rgba(0,0,0,0.1)',
                              color: 'text.secondary'
                            }}
                          />
                        )}
                        
                        {shift.status && (
                          <Chip 
                            label={shift.status.charAt(0).toUpperCase() + shift.status.slice(1)} 
                            size="small" 
                            color={
                              shift.status === 'scheduled' ? 'info' :
                              shift.status === 'in_progress' ? 'warning' :
                              shift.status === 'completed' ? 'success' :
                              shift.status === 'cancelled' ? 'error' :
                              shift.status === 'no_show' ? 'error' :
                              'default'
                            }
                            variant="filled"
                            sx={{
                              fontSize: '0.7rem',
                              height: 20,
                              fontWeight: 600
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffScheduleWidget;