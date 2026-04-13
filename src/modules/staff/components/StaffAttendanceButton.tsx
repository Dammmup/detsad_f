import React, { useState, useEffect } from 'react';
import { 
  Button, 
  CircularProgress, 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Typography,
  Box,
  Divider
} from '@mui/material';
import { useAuth } from '../../../app/context/AuthContext';
import { getStaffShifts, checkIn, checkOut } from '../services/shifts';
import { settingsService } from '../../settings/services/settings';
import { collectDeviceMetadata } from '../../../shared/utils/deviceMetadata';
import CloseIcon from '@mui/icons-material/Close';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SettingsIcon from '@mui/icons-material/Settings';

interface StaffAttendanceButtonProps {
  onStatusChange?: () => void;
}

const haversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const StaffAttendanceButton: React.FC<StaffAttendanceButtonProps> = ({
  onStatusChange,
}) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<
    | 'scheduled'
    | 'in_progress'
    | 'completed'
    | 'late'
    | 'pending_approval'
    | 'no_record'
    | 'error'
  >('no_record');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success',
  );
  const [geoErrorOpen, setGeoErrorOpen] = useState(false);
  const [isIOS] = useState(/iPad|iPhone|iPod/.test(navigator.userAgent));

  const [geolocation, setGeolocation] = useState<{
    latitude: number;
    longitude: number;
    radius: number;
  } | null>(null);





  const [workingHours, setWorkingHours] = useState({ start: '08:00', end: '23:00' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await settingsService.getKindergartenSettings();
        if (response.data && response.data.workingHours) {
          setWorkingHours(response.data.workingHours);
        }
      } catch (e) {
        console.error("Failed to load settings", e);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchShiftStatus = async () => {
      if (!currentUser || !currentUser.id) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const shifts = await getStaffShifts({
          staffId: currentUser.id,
          startDate: today,
          endDate: today,
        });
        const myShift = shifts.find((s) => {

          if (
            typeof s.staffId === 'object' &&
            s.staffId !== null &&
            '_id' in s.staffId
          ) {
            return (s.staffId as any)._id === currentUser.id;
          }
          return s.staffId === currentUser.id;
        });
        if (myShift) {
          setStatus(
            myShift.status as
            | 'scheduled'
            | 'in_progress'
            | 'completed'
            | 'late'
            | 'pending_approval',
          );
        } else {
          setStatus('no_record');
        }
      } catch (error) {
        console.error('Error fetching shift status:', error);
        setStatus('error');
      }
    };
    fetchShiftStatus();
  }, [currentUser, onStatusChange]);

  useEffect(() => {
    settingsService
      .getGeolocationSettings()
      .then((res: any) => {
        if (res.data?.enabled) {
          setGeolocation({
            latitude: res.data.coordinates.latitude,
            longitude: res.data.coordinates.longitude,
            radius: res.data.radius,
          });
        }
      })
      .catch((err) => {
        console.error('🔴 [StaffAttendanceButton] Failed to fetch geolocation settings:', err);
        setGeolocation(null);
      });
  }, []);


  const handleCheckIn = async () => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    try {
      let userLat: number | undefined = undefined;
      let userLng: number | undefined = undefined;

      // Пытаемся получить геолокацию, если она поддерживается браузером
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          console.log('📍 [StaffAttendanceButton] Requesting GPS coordinates for checkIn...');
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            }),
          );
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
          console.log('📍 [StaffAttendanceButton] GPS success:', userLat, userLng);

          if (geolocation) {
            const dist = haversineDistance(
              userLat,
              userLng,
              geolocation.latitude,
              geolocation.longitude,
            );
            console.log(`📍 [StaffAttendanceButton] Distance to center: ${Math.round(dist)}m (Radius: ${geolocation.radius}m)`);
            
            if (dist > geolocation.radius) {
              setSnackbarMessage(
                'Вы вне разрешённой зоны для отметки прихода.\nДопустимо ' +
                Math.round(geolocation.radius) +
                'м, у вас ' +
                Math.round(dist) +
                'м.',
              );
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
              setLoading(false);
              return;
            }
          }
        } catch (geoErr: any) {
          console.error('🔴 [StaffAttendanceButton] Geolocation error:', geoErr);
          if (geoErr.code === 1) { // PERMISSION_DENIED
            setGeoErrorOpen(true);
            setLoading(false);
            return;
          }
          // Если настройки геолокации были загружены и активны, то отсутствие координат - это ошибка.
          // Если же настройки не загрузились, мы позволяем попытку без координат (бэкенд решит).
          if (geolocation) {
            throw new Error('Не удалось получить ваше местоположение. Убедитесь, что GPS включен.');
          }
        }
      }


      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTimeInMinutes = currentHours * 60 + currentMinutes;


      const today = new Date().toISOString().split('T')[0];
      const shifts = await getStaffShifts({
        staffId: currentUser.id,
        startDate: today,
        endDate: today,
      });
      const myShift = shifts.find((s) => {

        if (
          typeof s.staffId === 'object' &&
          s.staffId !== null &&
          '_id' in s.staffId
        ) {
          return (s.staffId as any)._id === currentUser.id;
        }
        return s.staffId === currentUser.id;
      });

      if (myShift && myShift.id) {

        const startStr = (myShift as any).startTime || workingHours.start;
        const endStr = (myShift as any).endTime || workingHours.end;

        const [shiftStartHour, shiftStartMinute] = startStr
          .split(':')
          .map(Number);
        const [shiftEndHour, shiftEndMinute] = endStr
          .split(':')
          .map(Number);
        const shiftStartInMinutes = shiftStartHour * 60 + shiftStartMinute;
        const shiftEndInMinutes = shiftEndHour * 60 + shiftEndMinute;



        const allowedStartRange = shiftStartInMinutes - 30;
        const allowedEndRange = shiftEndInMinutes + 30;

        if (
          currentTimeInMinutes < allowedStartRange ||
          currentTimeInMinutes > allowedEndRange
        ) {

          if (currentTimeInMinutes < allowedStartRange) {
            const minutesUntilStart = allowedStartRange - currentTimeInMinutes;
            const hours = Math.floor(minutesUntilStart / 60);
            const minutes = minutesUntilStart % 60;
            setSnackbarMessage(
              `Отметка прихода возможна за 30 минут до начала смены. Смена начинается в ${startStr}, можно отмечаться с ${String(Math.floor(allowedStartRange / 60)).padStart(2, '0')}:${String(allowedStartRange % 60).padStart(2, '0')}. Осталось ${hours}ч ${minutes}м.`,
            );
          } else {
            const minutesAfterEnd = currentTimeInMinutes - allowedEndRange;
            const hours = Math.floor(minutesAfterEnd / 60);
            const minutes = minutesAfterEnd % 60;
            setSnackbarMessage(
              `Время смены уже прошло. Смена заканчивается в ${endStr}, разрешенное время отметки до ${String(Math.floor(allowedEndRange / 60)).padStart(2, '0')}:${String(allowedEndRange % 60).padStart(2, '0')}. Прошло ${hours}ч ${minutes}м.`,
            );
          }
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }


        if (myShift.id) {
          const deviceMetadata = collectDeviceMetadata();
          console.log('📱 [StaffAttendanceButton] Sending checkIn with deviceMetadata:', deviceMetadata);
          await checkIn(myShift.id, userLat, userLng, deviceMetadata);
        }

        setStatus('in_progress');
        setSnackbarMessage('Отметка о приходе успешно сохранена');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        if (onStatusChange) onStatusChange();
      } else {
        setSnackbarMessage('Смена не найдена на сегодня');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Error during check-in:', error);
      setSnackbarMessage(error.message || 'Ошибка при отметке прихода');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    try {

      let userLat: number | undefined = undefined;
      let userLng: number | undefined = undefined;

      // Пытаемся получить геолокацию, если она поддерживается браузером
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          console.log('📍 [StaffAttendanceButton] Requesting GPS coordinates for checkOut...');
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
            }),
          );
          userLat = pos.coords.latitude;
          userLng = pos.coords.longitude;
          console.log('📍 [StaffAttendanceButton] GPS success (checkOut):', userLat, userLng);

          if (geolocation) {
            const dist = haversineDistance(
              userLat,
              userLng,
              geolocation.latitude,
              geolocation.longitude,
            );
            console.log(`📍 [StaffAttendanceButton] Distance to center: ${Math.round(dist)}m (Radius: ${geolocation.radius}m)`);
            
            if (dist > geolocation.radius) {
              setSnackbarMessage(
                'Вы вне разрешённой зоны для отметки ухода.\nДопустимо ' +
                Math.round(geolocation.radius) +
                'м, у вас ' +
                Math.round(dist) +
                'м.',
              );
              setSnackbarSeverity('error');
              setSnackbarOpen(true);
              setLoading(false);
              return;
            }
          }
        } catch (geoErr: any) {
          console.error('🔴 [StaffAttendanceButton] Geolocation error (checkOut):', geoErr);
          if (geoErr.code === 1) { // PERMISSION_DENIED
            setGeoErrorOpen(true);
            setLoading(false);
            return;
          }
          // Если настройки геолокации были загружены и активны, то отсутствие координат - это ошибка.
          if (geolocation) {
            throw new Error('Не удалось получить ваше местоположение. Убедитесь, что GPS включен.');
          }
        }
      }


      const today = new Date().toISOString().split('T')[0];
      const shifts = await getStaffShifts({
        staffId: currentUser.id,
        startDate: today,
        endDate: today,
      });
      const myShift = shifts.find((s) => {

        if (
          typeof s.staffId === 'object' &&
          s.staffId !== null &&
          '_id' in s.staffId
        ) {
          return (s.staffId as any)._id === currentUser.id;
        }
        return s.staffId === currentUser.id;
      });

      if (myShift && myShift.id) {

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;


        const startStr = (myShift as any).startTime || workingHours.start;
        const endStr = (myShift as any).endTime || workingHours.end;

        const [shiftStartHour, shiftStartMinute] = startStr
          .split(':')
          .map(Number);
        const [shiftEndHour, shiftEndMinute] = endStr
          .split(':')
          .map(Number);
        const shiftStartInMinutes = shiftStartHour * 60 + shiftStartMinute;
        const shiftEndInMinutes = shiftEndHour * 60 + shiftEndMinute;



        const allowedStartRange = shiftStartInMinutes - 30;
        const allowedEndRange = shiftEndInMinutes + 30;

        if (
          currentTimeInMinutes < allowedStartRange ||
          currentTimeInMinutes > allowedEndRange
        ) {

          if (currentTimeInMinutes < allowedStartRange) {
            const minutesUntilStart = allowedStartRange - currentTimeInMinutes;
            const hours = Math.floor(minutesUntilStart / 60);
            const minutes = minutesUntilStart % 60;
            setSnackbarMessage(
              `Отметка ухода возможна только после начала смены. Смена начинается в ${startStr}, можно отмечаться с ${String(Math.floor(allowedStartRange / 60)).padStart(2, '0')}:${String(allowedStartRange % 60).padStart(2, '0')}. Осталось ${hours}ч ${minutes}м.`,
            );
          } else {
            const minutesAfterEnd = currentTimeInMinutes - allowedEndRange;
            const hours = Math.floor(minutesAfterEnd / 60);
            const minutes = minutesAfterEnd % 60;
            setSnackbarMessage(
              `Время смены уже прошло. Смена заканчивается в ${endStr}, разрешенное время отметки до ${String(Math.floor(allowedEndRange / 60)).padStart(2, '0')}:${String(allowedEndRange % 60).padStart(2, '0')}. Прошло ${hours}ч ${minutes}м.`,
            );
          }
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          setLoading(false);
          return;
        }


        if (myShift.id) {
          const deviceMetadata = collectDeviceMetadata();
          console.log('📱 [StaffAttendanceButton] Sending checkOut with deviceMetadata:', deviceMetadata);
          await checkOut(myShift.id, userLat, userLng, deviceMetadata);
        }
        setStatus('completed');
        setSnackbarMessage('Отметка об уходе успешно сохранена');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        if (onStatusChange) onStatusChange();
      } else {
        setSnackbarMessage('Смена не найдена на сегодня');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error: any) {
      console.error('Error during check-out:', error);
      setSnackbarMessage(error.message || 'Ошибка при отметке ухода');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };


  let buttonText = '';
  let buttonAction: (() => void) | undefined = undefined;
  let buttonDisabled = false;

  if (currentUser && currentUser.role === 'admin') {
    return null;
  }
  if (
    status === 'scheduled' ||
    status === 'pending_approval' ||
    status === 'no_record'
  ) {
    buttonText = 'Отметить приход';
    buttonAction = handleCheckIn;
    buttonDisabled = loading || status === 'no_record';
  } else if (status === 'in_progress' || status === 'late') {
    buttonText = 'Отметить уход';
    buttonAction = handleCheckOut;
    buttonDisabled = loading;
  } else if (status === 'completed') {
    buttonText = 'Посещение отмечено';
    buttonAction = undefined;
    buttonDisabled = true;
  } else if (status === 'error') {
    buttonText = 'Ошибка загрузки';
    buttonAction = undefined;
    buttonDisabled = true;
  }

  console.log('StaffAttendanceButton State:', {
    currentUser,
    status,
    buttonDisabled,
    buttonText,
  });

  return (
    <>
      <Button
        variant='contained'
        onClick={buttonAction}
        disabled={buttonDisabled}
        sx={{
          mr: 2,
          minWidth: '180px',
          fontSize: '0.875rem',
          padding: '12px 24px',
          borderRadius: '25px',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease-in-out',
          background:
            status === 'completed'
              ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
              : status === 'in_progress' || status === 'late'
                ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
          },
          '&:disabled': {
            background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)',
            color: 'rgba(255,255,0.7)',
          },
        }}
      >
        {loading ? (
          <CircularProgress size={20} sx={{ color: 'white' }} />
        ) : (
          buttonText
        )}
      </Button>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%', boxShadow: 3 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog 
        open={geoErrorOpen} 
        onClose={() => setGeoErrorOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <GpsFixedIcon color="error" />
          <Typography variant="h6" fontWeight={700}>Геолокация запрещена</Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Для отметки посещения необходимо разрешить доступ к вашему местоположению в браузере.
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon fontSize="small" /> Инструкция:
            </Typography>
            
            {isIOS ? (
              <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.85rem' }}>
                <li>Нажмите на иконку <b>«АА»</b> или <b>замок</b> слева в адресной строке.</li>
                <li>Выберите <b>«Настройки веб-сайта»</b>.</li>
                <li>В пункте <b>«Геопозиция»</b> выберите <b>«Разрешить»</b>.</li>
                <li>Обновите страницу.</li>
              </Box>
            ) : (
              <Box component="ol" sx={{ pl: 2, m: 0, fontSize: '0.85rem' }}>
                <li>Нажмите на иконку <b>замка</b> слева от адреса сайта.</li>
                <li>Нажмите <b>«Настройки сайтов»</b> (или найдите переключатель Геоданные).</li>
                <li>Установите <b>«Разрешить»</b> для Местоположения.</li>
                <li>Вернитесь и обновите страницу.</li>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button 
            onClick={() => window.location.reload()} 
            variant="contained" 
            fullWidth
            sx={{ 
              borderRadius: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          >
            Я разрешил, обновить страницу
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default StaffAttendanceButton;
