import React, { useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../../app/context/AuthContext';
import {
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Snackbar,
  Alert,
  useMediaQuery,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';


import StaffAttendanceButton from '../../staff/components/StaffAttendanceButton';
import ChildrenModal from '../../children/components/ChildrenModal';
import TaskListColumn from '../../tasks/components/TaskListColumn';
import FinancialStatsWidget from '../components/FinancialStatsWidget';
import StaffScheduleWidget from '../components/StaffScheduleWidget';
import BirthdaysCalendarWidget from '../components/BirthdaysCalendarWidget';
import TodayMenuWidget from '../components/TodayMenuWidget';
import TodayMarkedChildrenWidget from '../components/TodayMarkedChildrenWidget';

import DateNavigator from '../../../shared/components/DateNavigator';
import ReportsWidget from '../../reports/components/ReportsWidget';

const rootSx = {
  py: { xs: 2, sm: 4 },
  px: { xs: 1, sm: 0 },
  background:
    'linear-gradient(135deg, rgba(245, 247, 250, 1) 0%, rgba(235, 240, 245, 1) 100%)',
  minHeight: '100vh',
  width: '100%',
};

const Dashboard = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [addChildModalOpen, setAddChildModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>(
    'success',
  );

  const permissions = useMemo(() => {
    const role = currentUser?.role || '';
    return {
      showAttendanceButton: !!currentUser && role !== 'admin',
      canViewReports: ['admin', 'manager', 'director'].includes(role),
      canViewFinancialStats: ['admin', 'director'].includes(role),
      canManageChildren: ['admin', 'manager', 'director'].includes(role),
      canViewKitchenAttendanceCount: role === 'cook' || currentUser?.accessControls?.canSeeFood === true,
    };
  }, [currentUser]);

  const handleAttendanceStatusChange = useCallback(() => {}, []);
  const handleOpenAttendancePage = useCallback(() => {
    navigate('/app/children/attendance');
  }, [navigate]);

  const handleAddChildModalClose = useCallback(() => {
    setAddChildModalOpen(false);
  }, []);

  const handleAddChildModalOpen = useCallback(() => {
    setAddChildModalOpen(true);
  }, []);

  const handleChildSaved = useCallback(() => {
    setSnackbarMessage('Ребёнок успешно добавлен');
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setAddChildModalOpen(false);
  }, []);

  const handleCloseSnackbar = useCallback(() => {
    setSnackbarOpen(false);
  }, []);

  const isMobile = useMediaQuery('(max-width:900px)');
  const layoutSx = useMemo(
    () => ({
      display: isMobile ? 'block' : 'flex',
      gap: 3,
      height: isMobile ? 'auto' : 'calc(100vh - 200px)',
    }),
    [isMobile],
  );
  const rightColumnSx = useMemo(
    () => ({
      width: isMobile ? '100%' : 350,
      display: 'flex',
      flexDirection: 'column',
      gap: 2,
    }),
    [isMobile],
  );

  return (
    <Box sx={rootSx}>
      <DateNavigator />
      {permissions.canViewReports && <ReportsWidget />}

      <Box sx={layoutSx}>
        {/* Левая колонка с виджетами */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Grid container spacing={3}>
            {/* Кнопка отметки прихода/ухода для сотрудников */}
            {permissions.showAttendanceButton && (
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
            {permissions.canManageChildren && (
              <Grid item xs={12} sm={6} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    background:
                      'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)',
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
                          backgroundColor: 'green',
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
            {permissions.canManageChildren && (
              <Grid item xs={12} sm={6} md={6}>
                <Card
                  sx={{
                    height: '100%',
                    background:
                      'linear-gradient(135deg, rgb(102, 126, 234) 0%, rgb(118, 75, 162) 100%)',
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
                        backgroundColor: 'rgb(24, 144, 255)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,0.3)',
                        '&:hover': {
                          backgroundColor: 'green',
                        },
                      }}
                    >
                      Добавить ребёнка
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {permissions.canViewKitchenAttendanceCount && (
              <Grid item xs={12} sm={6} md={6}>
                <TodayMarkedChildrenWidget />
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
          {permissions.canViewFinancialStats && (
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
        <Box sx={rightColumnSx}>
          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 2,
              boxShadow:
                '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: isMobile ? 'none' : 'translateX(-5px)',
              },
            }}
          >
            <TaskListColumn />
          </Box>

          <Box
            sx={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: 2,
              boxShadow:
                '0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)',
              overflow: 'hidden',
              transition: 'transform 0.3s ease-in-out',
              '&:hover': {
                transform: isMobile ? 'none' : 'translateX(-5px)',
              },
            }}
          >
            <Box
              sx={{
                background: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
                color: 'white',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Typography variant='h6' sx={{ fontWeight: 600 }}>
                🍴 Меню на сегодня
              </Typography>
            </Box>
            <Box sx={{ p: 0, maxHeight: 320, overflowY: 'auto' }}>
              <TodayMenuWidget />
            </Box>
          </Box>
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
    </Box>
  );
};

export default Dashboard;
