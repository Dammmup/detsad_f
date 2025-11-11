import React, { useState } from 'react';
import { useAuth } from '../components/context/AuthContext';
import {
  Button,
  Typography,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Локальный импорт компонентов
import StaffAttendanceButton from '../components/StaffAttendanceButton';
import ChildrenModal from '../components/ChildrenModal';
import TaskListColumn from '../components/TaskListColumn';
import FinancialStatsWidget from '../components/FinancialStatsWidget';
import StaffScheduleWidget from '../components/StaffScheduleWidget';
import BirthdaysCalendarWidget from '../components/BirthdaysCalendarWidget';

import DateNavigator from '../components/DateNavigator';

const Dashboard = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success',
  );

  const isStaff = currentUser && currentUser.role !== 'admin';
  const isAdmin = currentUser && currentUser.role === 'admin';
  const canManageChildren =
    currentUser &&
    (currentUser.role === 'admin' ||
      currentUser.role === 'teacher' ||
      currentUser.role === 'substitute');

  const handleAttendanceStatusChange = () => {
    // Обновление статуса отметки посещаемости
    // В данном случае, StaffScheduleWidget должен самостоятельно обновлять данные
    // при изменении статуса через onStatusChange callback
  };

  const handleOpenAttendancePage = () => {
    navigate('/app/children/attendance');
  };

  const handleAddChildModalClose = () => {
    setAddChildModalOpen(false);
  };

  const handleAddChildModalOpen = () => {
    setAddChildModalOpen(true);
  };

  const handleChildSaved = () => {
    setSnackbarMessage('Ребёнок успешно добавлен');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setAddChildModalOpen(false);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const isMobile = useMediaQuery('(max-width:900px)');

  return (
    <Container
      maxWidth='lg'
      sx={{
        py: 4,
        background:
          'linear-gradient(135deg, rgba(245, 247, 250, 1) 0%, rgba(235, 240, 245, 1) 100%)',
        minHeight: '100vh',
      }}
    >
      <DateNavigator />
      {/* На мобильных список задач всегда сверху и в одну колонку */}
      {isMobile && (
        <Box sx={{ mb: 3 }}>
          <TaskListColumn />
        </Box>
      )}

      <Box
        sx={{
          display: isMobile ? 'block' : 'flex',
          gap: 3,
          height: isMobile ? 'auto' : 'calc(100vh - 200px)',
        }}
      >
        {/* Левая колонка с виджетами */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            {/* Кнопка отметки прихода/ухода для сотрудников */}
            {isStaff && (
              <Grid item xs={12} sm={6} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    background:
                      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    boxShadow:
                      '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
                    transition:
                      'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow:
                        '0 15px 30px rgba(0,0,0,0.3), 0 10px rgba(0,0,0,0.22)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: 'rgba(255,0.2)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <Typography variant='h4'>🕐</Typography>
                      </Box>
                      <Typography variant='h6' sx={{ fontWeight: 600 }}>
                        Отметить посещение
                      </Typography>
                    </Box>
                    <Typography variant='body2' sx={{ mb: 3, opacity: 0.9 }}>
                      Отметьте свой приход или уход на работу
                    </Typography>
                    <StaffAttendanceButton
                      onStatusChange={handleAttendanceStatusChange}
                    />
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Кнопка отметки детей */}
            {canManageChildren && (
              <Grid item xs={12} sm={6} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    background:
                      'linear-gradient(135deg, #a0a0a0 0%, #808080 100%)',
                    color: 'white',
                    boxShadow:
                      '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
                    transition:
                      'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow:
                        '0 15px 30px rgba(0,0,0,0.3), 0 10px rgba(0,0,0,0.22)',
                    },
                    borderRadius: 3,
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: 'rgba(255,255,0.2)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                          boxShadow: '0 4px 8px rgba(0,0,0.1)',
                        }}
                      >
                        <Typography variant='h4'>👶</Typography>
                      </Box>
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        Отметить детей
                      </Typography>
                    </Box>
                    <Typography
                      variant='body2'
                      sx={{ mb: 3, opacity: 0.9, lineHeight: 1.5 }}
                    >
                      Перейти на страницу посещаемости детей
                    </Typography>
                    <Button
                      variant='contained'
                      onClick={handleOpenAttendancePage}
                      sx={{
                        minWidth: '140px',
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        backgroundColor: 'rgba(255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,0.3)',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,0.3)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      Перейти к посещаемости
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Кнопка добавления ребенка */}
            {canManageChildren && (
              <Grid item xs={12} sm={6} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    background:
                      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    boxShadow:
                      '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
                    transition:
                      'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow:
                        '0 15px 30px rgba(0,0,0,0.3), 0 10px 10px rgba(0,0,0,0.22)',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          width: 50,
                          height: 50,
                          backgroundColor: 'rgba(255,255,0.2)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2,
                        }}
                      >
                        <Typography variant='h4'>➕</Typography>
                      </Box>
                      <Typography variant='h6' sx={{ fontWeight: 600 }}>
                        Добавить ребёнка
                      </Typography>
                    </Box>
                    <Typography variant='body2' sx={{ mb: 3, opacity: 0.9 }}>
                      Добавить нового ребёнка в систему
                    </Typography>
                    <Button
                      variant='contained'
                      onClick={handleAddChildModalOpen}
                      sx={{
                        minWidth: '180px',
                        fontSize: '0.875rem',
                        padding: '8px 16px',
                        backgroundColor: 'rgba(255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,0.3)',
                        '&:hover': {
                          backgroundColor: 'rgba(255,255,0.3)',
                        },
                      }}
                    >
                      Добавить ребёнка
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Виджет календаря дней рождения */}
          <Grid item xs={12} md={6}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'white',
                boxShadow:
                  '0 4px 12px rgba(0,0,0.15), 0 2px 4px rgba(0,0,0,0.18)',
                transition:
                  'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 6px 20px rgba(0,0,0.2), 0 4px 8px rgba(0,0,0,0.18)',
                },
                borderRadius: 2,
              }}
            >
              <CardContent>
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
                  <Typography
                    variant='h6'
                    sx={{ fontWeight: 600, color: '#495057' }}
                  >
                    🎂 Дни рождения
                  </Typography>
                </Box>
                <BirthdaysCalendarWidget />
              </CardContent>
            </Card>
          </Grid>

          {/* Виджет финансовой статистики - только для админов */}
          {isAdmin && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  height: '100%',
                  backgroundColor: 'white',
                  boxShadow:
                    '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.18)',
                  transition:
                    'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow:
                      '0 6px 20px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.18)',
                  },
                  borderRadius: 2,
                }}
              >
                <CardContent>
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
                    <Typography
                      variant='h6'
                      sx={{ fontWeight: 600, color: '#495057' }}
                    >
                      💰 Финансовая статистика
                    </Typography>
                  </Box>
                  <FinancialStatsWidget />
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Виджет графика работы */}
          <Grid item xs={12} md={12}>
            <Card
              sx={{
                height: '100%',
                backgroundColor: 'white',
                boxShadow:
                  '0 4px 12px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.18)',
                transition:
                  'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow:
                    '0 6px 20px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.18)',
                },
                borderRadius: 2,
              }}
            >
              <CardContent>
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
                  <Typography
                    variant='h6'
                    sx={{ fontWeight: 600, color: '#495057' }}
                  >
                    📅 График работы
                  </Typography>
                </Box>
                <StaffScheduleWidget />
              </CardContent>
            </Card>
          </Grid>

          {/* Пустое пространство для растягивания */}
          <Box sx={{ flexGrow: 1 }} />
        </Box>

        {/* Правая колонка - шторка уведомлений */}
        <Box
          sx={{
            width: 350,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: 2,
            boxShadow:
              '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
            overflow: 'hidden',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateX(-5px)',
            },
          }}
        >
          <TaskListColumn />
        </Box>
      </Box>

      {/* Модальное окно добавления ребёнка */}
      <ChildrenModal
        open={addChildModalOpen}
        onClose={handleAddChildModalClose}
        onSaved={handleChildSaved}
        child={null}
      />

      {/* Snackbar для уведомлений */}
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
    </Container>
  );
};

export default Dashboard;
