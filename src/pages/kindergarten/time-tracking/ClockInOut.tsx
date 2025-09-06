import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccessTime,
  LocationOn,
  PhotoCamera,
  Coffee,
  ExitToApp,
  Login,
  Schedule,
  Warning
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import Axios from 'axios';
import config from '../../../config';

const ClockInOut = () => {
  const [timeStatus, setTimeStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [photoDialog, setPhotoDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [actionType, setActionType] = useState(null);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Location error:', error);
          setLocationError('Не удалось получить местоположение. Проверьте разрешения.');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    } else {
      setLocationError('Геолокация не поддерживается браузером');
    }
  }, []);

  // Fetch time tracking status
  const fetchTimeStatus = async () => {
    try {
      setLoading(true);
      const response = await Axios.get(`${config.baseURLApi}/time-tracking/status`);
      setTimeStatus(response.data);
    } catch (error) {
      console.error('Error fetching time status:', error);
      toast.error('Ошибка загрузки статуса рабочего времени');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeStatus();
  }, []);

  // Handle clock in/out actions
  const handleTimeAction = async (action) => {
    if (!location) {
      toast.error('Местоположение не определено. Проверьте разрешения GPS.');
      return;
    }

    setActionType(action);
    setPhotoDialog(true);
  };

  const executeTimeAction = async (photo = null) => {
    try {
      setActionLoading(true);
      
      const requestData = {
        latitude: location.latitude,
        longitude: location.longitude,
        notes: notes.trim() || undefined,
        photo: photo || undefined
      };

      let endpoint = '';
      let successMessage = '';

      switch (actionType) {
        case 'clock-in':
          endpoint = '/time-tracking/clock-in';
          successMessage = 'Успешно отмечен приход на работу';
          break;
        case 'clock-out':
          endpoint = '/time-tracking/clock-out';
          successMessage = 'Успешно отмечен уход с работы';
          break;
        case 'break-start':
          endpoint = '/time-tracking/break-start';
          successMessage = 'Перерыв начат';
          break;
        case 'break-end':
          endpoint = '/time-tracking/break-end';
          successMessage = 'Перерыв завершен';
          break;
        default:
          throw new Error('Неизвестное действие');
      }

      const response = await Axios.post(`${config.baseURLApi}${endpoint}`, requestData);
      
      toast.success(successMessage);
      setPhotoDialog(false);
      setNotes('');
      setActionType(null);
      
      // Refresh status
      await fetchTimeStatus();
    } catch (error) {
      console.error('Time action error:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Произошла ошибка при выполнении действия');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Take photo function (simplified - in real app would use camera)
  const takePhoto = () => {
    // In a real implementation, this would open camera
    // For now, we'll just proceed without photo
    executeTimeAction(null);
  };

  // Format time display
  const formatTime = (date) => {
    return date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format duration
  const formatDuration = (startTime) => {
    const now = new Date();
    const diff = now - new Date(startTime);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}ч ${minutes}м`;
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'scheduled': return 'primary';
      case 'late': return 'warning';
      case 'completed': return 'success';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
          Загрузка статуса рабочего времени...
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Current Time Display */}
      <Grid item xs={12}>
        <Card sx={{ textAlign: 'center', py: 3 }}>
          <CardContent>
            <Typography variant="h2" component="div" sx={{ mb: 1 }}>
              {formatTime(currentTime)}
            </Typography>
            <Typography variant="h6" color="text.secondary">
              {currentTime.toLocaleDateString('ru-RU', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Location Status */}
      <Grid item xs={12}>
        {locationError ? (
          <Alert severity="error" icon={<LocationOn />}>
            {locationError}
          </Alert>
        ) : location ? (
          <Alert severity="success" icon={<LocationOn />}>
            Местоположение определено (точность: {Math.round(location.accuracy)}м)
          </Alert>
        ) : (
          <Alert severity="info" icon={<LocationOn />}>
            Определение местоположения...
          </Alert>
        )}
      </Grid>

      {/* Current Status */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Текущий статус
            </Typography>
            
            {timeStatus?.isActive ? (
              <Box>
                <Chip
                  label="На работе"
                  color="success"
                  icon={<AccessTime />}
                  sx={{ mb: 2 }}
                />
                <Typography variant="body2" color="text.secondary">
                  Пришел: {new Date(timeStatus.activeEntry.clockIn).toLocaleTimeString('ru-RU')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Рабочее время: {formatDuration(timeStatus.activeEntry.clockIn)}
                </Typography>
                {timeStatus.activeEntry.breakStart && !timeStatus.activeEntry.breakEnd && (
                  <Typography variant="body2" color="warning.main">
                    На перерыве с: {new Date(timeStatus.activeEntry.breakStart).toLocaleTimeString('ru-RU')}
                  </Typography>
                )}
              </Box>
            ) : (
              <Chip
                label="Не на работе"
                color="default"
                icon={<ExitToApp />}
              />
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Today's Schedule */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Расписание на сегодня
            </Typography>
            
            {timeStatus?.todaySchedule ? (
              <Box>
                <Typography variant="body2">
                  Смена: {timeStatus.todaySchedule.shiftId?.name}
                </Typography>
                <Typography variant="body2">
                  Время: {timeStatus.todaySchedule.shiftId?.startTime} - {timeStatus.todaySchedule.shiftId?.endTime}
                </Typography>
                <Chip
                  label={timeStatus.todaySchedule.status}
                  color={getStatusColor(timeStatus.todaySchedule.status)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Нет запланированных смен
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Action Buttons */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Действия
            </Typography>
            
            <Grid container spacing={2}>
              {!timeStatus?.isActive ? (
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    size="large"
                    startIcon={<Login />}
                    onClick={() => handleTimeAction('clock-in')}
                    disabled={!location || actionLoading}
                    sx={{ py: 2 }}
                  >
                    Приход
                  </Button>
                </Grid>
              ) : (
                <>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      size="large"
                      startIcon={<ExitToApp />}
                      onClick={() => handleTimeAction('clock-out')}
                      disabled={!location || actionLoading}
                      sx={{ py: 2 }}
                    >
                      Уход
                    </Button>
                  </Grid>
                  
                  {!timeStatus.activeEntry?.breakStart || timeStatus.activeEntry?.breakEnd ? (
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="warning"
                        size="large"
                        startIcon={<Coffee />}
                        onClick={() => handleTimeAction('break-start')}
                        disabled={actionLoading}
                        sx={{ py: 2 }}
                      >
                        Начать перерыв
                      </Button>
                    </Grid>
                  ) : (
                    <Grid item xs={12} sm={6} md={3}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="warning"
                        size="large"
                        startIcon={<Coffee />}
                        onClick={() => handleTimeAction('break-end')}
                        disabled={actionLoading}
                        sx={{ py: 2 }}
                      >
                        Завершить перерыв
                      </Button>
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Photo/Notes Dialog */}
      <Dialog open={photoDialog} onClose={() => setPhotoDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Подтверждение действия
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Добавьте заметку (необязательно):
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Введите заметку..."
              variant="outlined"
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Tooltip title="Сделать фото (необязательно)">
              <IconButton
                color="primary"
                size="large"
                onClick={takePhoto}
                sx={{ border: '2px dashed', borderColor: 'primary.main', p: 3 }}
              >
                <PhotoCamera sx={{ fontSize: 40 }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography variant="caption" display="block" textAlign="center" color="text.secondary">
            Нажмите на камеру для фото или продолжите без фото
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPhotoDialog(false)} disabled={actionLoading}>
            Отмена
          </Button>
          <Button 
            onClick={() => executeTimeAction(null)} 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? 'Обработка...' : 'Продолжить без фото'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default ClockInOut;
