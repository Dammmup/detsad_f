import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useAuth } from './context/AuthContext';
import { getStaffShifts, checkIn, checkOut } from '../services/shifts';
import { settingsService } from '../services/settings';
import { collectDeviceMetadata } from '../utils/deviceMetadata';

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
      .catch(() => setGeolocation(null));
  }, []);


  const handleCheckIn = async () => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    try {

      if (geolocation) {

        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
          }),
        );
        const { latitude, longitude } = pos.coords;
        const dist = haversineDistance(
          latitude,
          longitude,
          geolocation.latitude,
          geolocation.longitude,
        );
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
          await checkIn(myShift.id, deviceMetadata);
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

      if (geolocation) {

        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
          }),
        );
        const { latitude, longitude } = pos.coords;
        const dist = haversineDistance(
          latitude,
          longitude,
          geolocation.latitude,
          geolocation.longitude,
        );
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
          await checkOut(myShift.id, deviceMetadata);
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
    status === 'late' ||
    status === 'pending_approval' ||
    status === 'no_record'
  ) {
    buttonText = 'Отметить приход';
    buttonAction = handleCheckIn;
    buttonDisabled = loading || status === 'no_record';
  } else if (status === 'in_progress') {
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
              : status === 'in_progress'
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
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StaffAttendanceButton;
