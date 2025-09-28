import React, { useState, useEffect } from 'react';
import { Button, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useAuth } from './context/AuthContext';
import shiftsApi, { getShifts } from '../services/api/shifts';

interface StaffAttendanceButtonProps {
  onStatusChange?: () => void; // Callback для обновления статуса
}

const StaffAttendanceButton: React.FC<StaffAttendanceButtonProps> = ({ onStatusChange }) => {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed' | 'no_record' | 'error'>('no_record');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Загрузка статуса посещаемости для текущего пользователя
  useEffect(() => {
    const fetchShiftStatus = async () => {
      if (!currentUser) return;
      try {
        const today = new Date().toISOString().split('T')[0];
        const shifts = await getShifts(today, today);
        const myShift = shifts.find(s => s.staffId === currentUser.id);
        if (myShift) {
          setStatus(myShift.status as 'scheduled' | 'in_progress' | 'completed');
        } else {
          setStatus('no_record');
        }
      } catch (error) {
        console.error('Error fetching shift status:', error);
        setStatus('error');
      }
    };
    fetchShiftStatus();
  }, [currentUser]);

  const handleCheckIn = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const shifts = await getShifts(today, today);
      const myShift = shifts.find(s => s.staffId === currentUser.id);
      if (myShift) {
        await shiftsApi.updateStatus(myShift.id, 'in_progress');
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
    if (!currentUser) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const shifts = await getShifts(today, today);
      const myShift = shifts.find(s => s.staffId === currentUser.id);
      if (myShift) {
        await shiftsApi.updateStatus(myShift.id, 'completed');
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

  // Определение текста и обработчика кнопки в зависимости от статуса
  let buttonText = '';
  let buttonAction: (() => void) | undefined = undefined;
  let buttonDisabled = false;

  if (status === 'scheduled' || status === 'no_record') {
    buttonText = 'Отметить приход';
    buttonAction = handleCheckIn;
    buttonDisabled = loading;
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

  return (
    <>
      <Button
        variant="contained"
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
          background: status === 'completed' ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' :
                     status === 'in_progress' ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' :
                     'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px rgba(0,0,0,0.2)'
          },
          '&:disabled': {
            background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)',
            color: 'rgba(255,255,0.7)'
          }
        }}
      >
        {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : buttonText}
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