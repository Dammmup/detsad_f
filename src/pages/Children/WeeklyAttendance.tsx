import React, { useState, useEffect } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Tooltip,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Download as DownloadIcon,
  CheckCircle,
  Cancel,
  Sick,
  BeachAccess,
  Schedule,
  EventNote as EventNoteIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiClient from '../../utils/api';

// Types and Services
import childrenApi, { Child } from '../../services/children';
import { STATUS_COLORS } from '../../types/common';
import { getGroups } from '../../services/groups';
import {
  getChildAttendance,
  bulkSaveChildAttendance,
  ChildAttendanceRecord
} from '../../services/childAttendance';
import { useAuth } from '../../components/context/AuthContext';
import { exportChildrenAttendance, getCurrentMonthRange, getCurrentPeriod } from '../../utils/excelExport';
import AttendanceBulkModal from '../../components/AttendanceBulkModal';
import ExportButton from '../../components/ExportButton';

// Constants
const ATTENDANCE_STATUSES = {
  present: 'Присутствует',
  absent: 'Отсутствует',
  sick: 'Болеет',
  vacation: 'Отпуск',
  late: 'Опоздание'
} as const;



const STATUS_ICONS = {
  present: CheckCircle,
  absent: Cancel,
  sick: Sick,
  vacation: BeachAccess,
  late: Schedule
};

type AttendanceStatus = 'present' | 'absent' | 'late' | 'sick' | 'vacation';

interface AttendanceData {
  [childId: string]: {
    [date: string]: {
      status: AttendanceStatus;
      notes?: string;
    };
  };
}

const WeeklyAttendance: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  
  // State
 const [selectedWeek, setSelectedWeek] = useState<Date>(new Date());
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  
  // Data
  const [groups, setGroups] = useState<any[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();

  const handleExport = async (exportType: string, exportFormat: 'pdf' | 'excel' | 'csv') => {
    if (!selectedGroup) {
      enqueueSnackbar('Выберите группу для экспорта', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
        const group = groups.find(g => (g.id || g._id) === selectedGroup);
        const groupName = group ? group.name : 'Unknown Group';

        const { startDate: monthStartDate, endDate: monthEndDate } = getCurrentMonthRange();
        const period = `${format(new Date(monthStartDate), 'dd.MM.yyyy')} - ${format(new Date(monthEndDate), 'dd.MM.yyyy')}`;

        const attendanceRecordsForExport = await getChildAttendance({
          groupId: selectedGroup,
          startDate: monthStartDate,
          endDate: monthEndDate
        });

        await exportChildrenAttendance(
            attendanceRecordsForExport,
            groupName,
            period,
            filteredChildren
        );

        enqueueSnackbar('Отчет экспортирован', { variant: 'success' });
    } catch (e: any) {
      setError(e?.message || 'Ошибка экспорта');
      enqueueSnackbar('Ошибка при экспорте', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isLoggedIn || !currentUser || authLoading) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const [groupsData, childrenList] = await Promise.all([
          getGroups(),
          childrenApi.getAll()
        ]);
        setGroups(groupsData || []);
        setChildren(childrenList);
        
        // Auto-select group for teachers
        if (currentUser.role === 'teacher' || currentUser.role === 'assistant') {
          const myGroup = groupsData.find(g => g.teacher === currentUser.id);
          if (myGroup && (myGroup.id || myGroup._id)) {
            setSelectedGroup(myGroup.id || myGroup._id || '');
          }
        }
      } catch (err: any) {
        console.error('Error loading initial data:', err);
        setError('Не удалось загрузить данные');
        enqueueSnackbar('Ошибка при загрузке данных', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, [isLoggedIn, currentUser, authLoading, enqueueSnackbar]);

  // Load attendance data when week or group changes
  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!selectedGroup) {
        setAttendanceData({});
        return;
      }
      
      setLoading(true);
      try {
        const weekStart = startOfWeek(selectedWeek, { locale: ru });
        const weekEnd = addDays(weekStart, 6);
        
        const records = await getChildAttendance({
          groupId: selectedGroup,
          startDate: format(weekStart, 'yyyy-MM-dd'),
          endDate: format(weekEnd, 'yyyy-MM-dd')
        });
        
        // Convert records to attendance data format
        const attendanceMap: AttendanceData = {};
        records.forEach((record: ChildAttendanceRecord) => {
          const childId = record.childId;
          const date = record.date.split('T')[0];
          
          if (!attendanceMap[childId]) {
            attendanceMap[childId] = {};
          }
          
          attendanceMap[childId][date] = {
            status: record.status,
            notes: record.notes
          };
        });
        
        setAttendanceData(attendanceMap);
      } catch (err: any) {
        console.error('Error loading attendance data:', err);
        setError('Не удалось загрузить данные посещаемости');
        enqueueSnackbar('Ошибка при загрузке данных посещаемости', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [selectedWeek, selectedGroup, enqueueSnackbar]);

  // Week navigation
  const goToPreviousWeek = () => {
    setSelectedWeek(prev => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setSelectedWeek(prev => addDays(prev, 7));
  };

  const goToToday = () => {
    setSelectedWeek(new Date());
  };

  const handleGroupChange = (e: SelectChangeEvent<string>) => {
    setSelectedGroup(e.target.value);
  };

  // Get filtered children for selected group
  const filteredChildren = selectedGroup
    ? children.filter(child => {
        // Проверяем, является ли groupId объектом или строкой
        if (typeof child.groupId === 'object' && child.groupId !== null) {
          return (child.groupId as any)._id === selectedGroup || (child.groupId as any).id === selectedGroup;
        } else {
          return child.groupId === selectedGroup;
        }
      })
    : [];

  // Get week days
  const weekStart = startOfWeek(selectedWeek, { locale: ru });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Get attendance for a specific child and day
  const getAttendanceForDay = (childId: string, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return attendanceData[childId]?.[dateString];
  };

  // Cycle through attendance statuses on click
  const handleAttendanceClick = async (child: Child, date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const existingAttendance = getAttendanceForDay(child.id!, date);
    
    // Cycle through statuses: present -> absent -> sick -> vacation -> late -> present
    const statusCycle: AttendanceStatus[] = ['present', 'absent', 'sick', 'vacation'];
    const currentIndex = existingAttendance ? statusCycle.indexOf(existingAttendance.status) : -1;
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    try {
      const record: {
        childId: string;
        date: string;
        status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
        notes?: string;
      } = {
        childId: child.id!,
        date: dateString,
        status: nextStatus,
        notes: existingAttendance?.notes || ''
      };

      await bulkSaveChildAttendance([record], selectedGroup);
      
      // Update local state
      setAttendanceData(prev => ({
        ...prev,
        [child.id!]: {
          ...prev[child.id!],
          [dateString]: {
            status: nextStatus,
            notes: existingAttendance?.notes || ''
          }
        }
      }));

      enqueueSnackbar(`${child.fullName}: ${ATTENDANCE_STATUSES[nextStatus]}`, { variant: 'success' });
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      enqueueSnackbar('Ошибка при сохранении', { variant: 'error' });
    }
  };

  // Render loading state
  if (loading && Object.keys(attendanceData).length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  // Render error state
  if (error) {
    return (
      <Box p={3}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
      <Box p={3}>
        <Card>
          <CardHeader 
            title={
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h5">Недельная посещаемость</Typography>
                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<EventNoteIcon />}
                    onClick={() => setBulkModalOpen(true)}
                    disabled={!selectedGroup}
                  >
                    Массовое назначение
                  </Button>

                  <ExportButton
                    exportTypes={[{ value: 'children-attendance', label: 'Посещаемость детей' }]}
                    onExport={handleExport}
                  />
                </Box>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            {/* Week Navigation */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <IconButton onClick={goToPreviousWeek}>
                <ArrowBackIosIcon />
              </IconButton>
              
              <Box textAlign="center">
                <Typography variant="h6">
                  {format(weekStart, 'MMMM yyyy', { locale: ru })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {format(weekStart, 'd MMM', { locale: ru })} - {format(addDays(weekStart, 6), 'd MMM', { locale: ru })}
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={goToToday}
                  startIcon={<TodayIcon />}
                  sx={{ mt: 1 }}
                >
                  Сегодня
                </Button>
              </Box>
              
              <IconButton onClick={goToNextWeek}>
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>

            <Box mb={3}>
              <FormControl fullWidth>
                <InputLabel>Выберите группу</InputLabel>
                <Select value={selectedGroup} onChange={handleGroupChange}>
                  {groups.map(group => (
                    <MenuItem key={group.id || group._id} value={group.id || group._id}>
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Attendance Table */}
            {selectedGroup ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Ребенок</TableCell>
                      {weekDays.map(day => (
                        <TableCell key={day.toString()} align="center">
                          <Box>
                            <Box>{format(day, 'EEEEEE', { locale: ru })}</Box>
                            <Box>{format(day, 'd MMM', { locale: ru })}</Box>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredChildren.map(child => (
                      <TableRow key={child.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                            <Box>
                              {child.fullName}
                              {child.parentName && (
                                <Box sx={{ fontSize: '0.8em', color: 'text.secondary' }}>
                                  Родитель: {child.parentName}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        {weekDays.map(day => {
                          const attendance = getAttendanceForDay(child.id!, day);
                          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                          
                          return (
                            <TableCell
                              key={day.toString()}
                              align="center"
                              sx={{
                                minHeight: '80px',
                                border: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: isWeekend ? 'action.hover' : 'inherit',
                                cursor: isWeekend ? 'not-allowed' : 'pointer',
                                '&:hover': {
                                  backgroundColor: isWeekend ? 'action.hover' : 'action.selected'
                                }
                              }}
                            >
                              {isWeekend ? (
                                <Typography variant="body2" color="text.disabled" align="center">
                                  Выходной
                                </Typography>
                              ) : attendance ? (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="body2">
                                        {child.fullName}
                                      </Typography>
                                      <Typography variant="body2">
                                        {format(day, 'd MMMM yyyy', { locale: ru })}
                                      </Typography>
                                      <Typography variant="body2">
                                        Статус: {ATTENDANCE_STATUSES[attendance.status]}
                                      </Typography>
                                      {attendance.notes && (
                                        <Typography variant="body2">
                                          Примечание: {attendance.notes}
                                        </Typography>
                                      )}
                                      <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                                        Нажмите для изменения статуса
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Box
                                    onClick={() => handleAttendanceClick(child, day)}
                                    sx={{
                                      p: 1,
                                      borderRadius: 1,
                                      bgcolor: 'background.paper',
                                      borderLeft: `4px solid ${
                                        attendance.status === 'present' ? theme.palette.success.main :
                                        attendance.status === 'sick' ? theme.palette.warning.main :
                                        attendance.status === 'vacation' ? theme.palette.info.main :
                                        attendance.status === 'late' ? theme.palette.warning.main :
                                        theme.palette.error.main
                                      }`,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        bgcolor: 'action.selected'
                                      }
                                    }}
                                  >
                                    <Chip
                                      label={ATTENDANCE_STATUSES[attendance.status]}
                                      size="small"
                                      color={STATUS_COLORS[attendance.status] as any}
                                      icon={React.createElement(STATUS_ICONS[attendance.status], { fontSize: 'small' })}
                                    />
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="body2">
                                        {child.fullName}
                                      </Typography>
                                      <Typography variant="body2">
                                        {format(day, 'd MMMM yyyy', { locale: ru })}
                                      </Typography>
                                      <Typography variant="caption">
                                        Нажмите для отметки посещаемости
                                      </Typography>
                                      {/* Показываем информацию о возможности отметки альтернативным сотрудником */}
                                      {selectedGroup && (
                                        <Typography variant="caption" sx={{ mt: 1, display: 'block', color: 'warning.main' }}>
                                          Может быть отмечено альтернативным сотрудником
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Box
                                    onClick={() => handleAttendanceClick(child, day)}
                                    sx={{
                                      p: 1,
                                      borderRadius: 1,
                                      border: '1px dashed',
                                      borderColor: 'divider',
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        bgcolor: 'action.selected',
                                        borderColor: 'primary.main'
                                      }
                                    }}
                                  >
                                    <Typography variant="caption" color="text.secondary">
                                      Нажмите для отметки
                                    </Typography>
                                  </Box>
                                </Tooltip>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="h6" color="text.secondary">
                  Выберите группу для просмотра посещаемости
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
      
      {/* Bulk Attendance Modal */}
      <AttendanceBulkModal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        groupId={selectedGroup}
        onSuccess={() => {
          // Refresh attendance data after bulk operation
          const weekStart = startOfWeek(selectedWeek, { locale: ru });
          const weekEnd = addDays(weekStart, 6);
          
          getChildAttendance({
            groupId: selectedGroup,
            startDate: format(weekStart, 'yyyy-MM-dd'),
            endDate: format(weekEnd, 'yyyy-MM-dd')
          }).then(records => {
            // Convert records to attendance data format
            const attendanceMap: AttendanceData = {};
            records.forEach((record: ChildAttendanceRecord) => {
              const childId = record.childId;
              const date = record.date.split('T')[0];
              
              if (!attendanceMap[childId]) {
                attendanceMap[childId] = {};
              }
              
              attendanceMap[childId][date] = {
                status: record.status,
                notes: record.notes
              };
            });
            
            setAttendanceData(attendanceMap);
            enqueueSnackbar('Посещаемость успешно обновлена', { variant: 'success' });
          }).catch(err => {
            console.error('Error refreshing attendance data:', err);
            enqueueSnackbar('Ошибка при обновлении данных', { variant: 'error' });
          });
        }}
      />
    </LocalizationProvider>
  );
};

export default WeeklyAttendance;