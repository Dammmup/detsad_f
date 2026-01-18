import React, { useState, useEffect } from 'react';
import moment from 'moment';
import 'moment/locale/ru';
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
} from '@mui/material';
import {
  ArrowBackIos as ArrowBackIosIcon,
  ArrowForwardIos as ArrowForwardIosIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  CheckCircle,
  Cancel,
  Sick,
  BeachAccess,
  Schedule,
  EventNote as EventNoteIcon,
  FileUpload as FileUploadIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';


import childrenApi, { Child } from '../services/children';
import { STATUS_COLORS } from '../../../shared/types/common';
import { getGroups } from '../services/groups';
import {
  getChildAttendance,
  bulkSaveChildAttendance,
  ChildAttendanceRecord,
} from '../services/childAttendance';
import { useAuth } from '../../../app/context/AuthContext';
import { useDate } from '../../../app/context/DateContext';
import {
  exportChildrenAttendance,

} from '../../../shared/utils/excelExport';
import AttendanceBulkModal from '../components/AttendanceBulkModal';
import ExportButton from '../../../shared/components/ExportButton';
import { importChildAttendance } from '../../../shared/services/importService';


const ATTENDANCE_STATUSES = {
  present: 'Присутствует',
  absent: 'Отсутствует',
  sick: 'Болеет',
  vacation: 'Отпуск',
  late: 'Опоздание',
} as const;

const STATUS_ICONS = {
  present: CheckCircle,
  absent: Cancel,
  sick: Sick,
  vacation: BeachAccess,
  late: Schedule,
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
  const { currentDate, setCurrentDate } = useDate();


  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);


  const [groups, setGroups] = useState<any[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async (
    exportType: string,
    exportFormat: 'pdf' | 'excel' | 'csv',
  ) => {
    if (!selectedGroup) {
      enqueueSnackbar('Выберите группу для экспорта', { variant: 'error' });
      return;
    }

    setLoading(true);
    try {
      const group = groups.find((g) => (g.id || g._id) === selectedGroup);
      const groupName = group ? group.name : 'Unknown Group';

      const monthStart = moment(currentDate).startOf('month');
      const monthEnd = moment(currentDate).endOf('month');
      const period = `${monthStart.format('DD.MM.YYYY')} - ${monthEnd.format('DD.MM.YYYY')}`;

      const attendanceRecordsForExport = await getChildAttendance({
        groupId: selectedGroup,
        startDate: monthStart.format('YYYY-MM-DD'),
        endDate: monthEnd.format('YYYY-MM-DD'),
      });

      await exportChildrenAttendance(
        attendanceRecordsForExport,
        groupName,
        period,
        filteredChildren,
      );

      enqueueSnackbar('Отчет экспортирован', { variant: 'success' });
    } catch (e: any) {
      setError(e?.message || 'Ошибка экспорта');
      enqueueSnackbar('Ошибка при экспорте', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isLoggedIn || !currentUser || authLoading) return;

      setLoading(true);
      setError(null);

      try {
        const [groupsData, childrenList] = await Promise.all([
          getGroups(),
          childrenApi.getAll(),
        ]);
        setGroups(groupsData || []);
        setChildren(childrenList);


        if (
          currentUser.role === 'teacher' ||
          currentUser.role === 'assistant'
        ) {
          const myGroup = groupsData.find((g: any) => g.teacher === currentUser.id);
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


  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!selectedGroup) {
        setAttendanceData({});
        return;
      }

      setLoading(true);
      try {
        const monthStart = moment(currentDate).startOf('month');
        const monthEnd = moment(currentDate).endOf('month');

        const records = await getChildAttendance({
          groupId: selectedGroup,
          startDate: monthStart.format('YYYY-MM-DD'),
          endDate: monthEnd.format('YYYY-MM-DD'),
        });


        const attendanceMap: AttendanceData = {};
        records.forEach((record: ChildAttendanceRecord) => {
          const childId = record.childId;
          const date = record.date.split('T')[0];

          if (!attendanceMap[childId]) {
            attendanceMap[childId] = {};
          }

          attendanceMap[childId][date] = {
            status: record.status,
            notes: record.notes,
          };
        });

        setAttendanceData(attendanceMap);
      } catch (err: any) {
        console.error('Error loading attendance data:', err);
        setError('Не удалось загрузить данные посещаемости');
        enqueueSnackbar('Ошибка при загрузке данных посещаемости', {
          variant: 'error',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceData();
  }, [currentDate, selectedGroup, enqueueSnackbar]);


  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const handleGroupChange = (e: SelectChangeEvent<string>) => {
    setSelectedGroup(e.target.value);
  };


  const filteredChildren = selectedGroup
    ? children.filter((child) => {

      if (typeof child.groupId === 'object' && child.groupId !== null) {
        return (
          (child.groupId as any)._id === selectedGroup ||
          (child.groupId as any).id === selectedGroup
        );
      } else {
        return child.groupId === selectedGroup;
      }
    })
    : [];


  const monthStart = moment(currentDate).startOf('month');
  const monthEnd = moment(currentDate).endOf('month');
  const monthDays: Date[] = [];
  const day = monthStart.clone();
  while (day.isSameOrBefore(monthEnd)) {
    monthDays.push(day.toDate());
    day.add(1, 'day');
  }


  const getAttendanceForDay = (childId: string, date: Date) => {
    const dateString = moment(date).format('YYYY-MM-DD');
    return attendanceData[childId]?.[dateString];
  };


  const handleAttendanceClick = async (child: Child, date: Date) => {
    const dateString = moment(date).format('YYYY-MM-DD');
    const existingAttendance = getAttendanceForDay(child.id!, date);


    const statusCycle: AttendanceStatus[] = [
      'present',
      'absent',
      'sick',
      'vacation',
    ];
    const currentIndex = existingAttendance
      ? statusCycle.indexOf(existingAttendance.status)
      : -1;
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
        notes: existingAttendance?.notes || '',
      };

      await bulkSaveChildAttendance([record], selectedGroup);


      setAttendanceData((prev) => ({
        ...prev,
        [child.id!]: {
          ...prev[child.id!],
          [dateString]: {
            status: nextStatus,
            notes: existingAttendance?.notes || '',
          },
        },
      }));

      enqueueSnackbar(`${child.fullName}: ${ATTENDANCE_STATUSES[nextStatus]}`, {
        variant: 'success',
      });
    } catch (err: any) {
      console.error('Error saving attendance:', err);
      enqueueSnackbar('Ошибка при сохранении', { variant: 'error' });
    }
  };

  // Импорт посещаемости детей из Excel
  const handleImportChildAttendance = async () => {
    try {
      setIsImporting(true);
      const year = moment(currentDate).year();
      const result = await importChildAttendance(year);
      if (result.success) {
        enqueueSnackbar(`Импорт завершён: создано ${result.stats.created || 0}, обновлено ${result.stats.updated || 0}`, { variant: 'success' });
        // Перезагружаем данные
        if (selectedGroup) {
          setLoading(true);
          const monthStart = moment(currentDate).startOf('month');
          const monthEnd = moment(currentDate).endOf('month');
          const records = await getChildAttendance({
            groupId: selectedGroup,
            startDate: monthStart.format('YYYY-MM-DD'),
            endDate: monthEnd.format('YYYY-MM-DD'),
          });
          const attendanceMap: AttendanceData = {};
          records.forEach((record: ChildAttendanceRecord) => {
            const childId = record.childId;
            const date = record.date.split('T')[0];
            if (!attendanceMap[childId]) attendanceMap[childId] = {};
            attendanceMap[childId][date] = { status: record.status, notes: record.notes };
          });
          setAttendanceData(attendanceMap);
          setLoading(false);
        }
      } else {
        enqueueSnackbar(result.error || 'Ошибка импорта', { variant: 'error' });
      }
    } catch (error: any) {
      console.error('Error importing child attendance:', error);
      enqueueSnackbar(error?.message || 'Ошибка импорта', { variant: 'error' });
    } finally {
      setIsImporting(false);
    }
  };


  if (loading && Object.keys(attendanceData).length === 0) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='200px'
      >
        <CircularProgress />
      </Box>
    );
  }


  if (error) {
    return (
      <Box p={3}>
        <Typography color='error'>{error}</Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterMoment} adapterLocale="ru">
      <Box p={3}>
        <Card>
          <CardHeader
            title={
              <Box
                display='flex'
                justifyContent='space-between'
                alignItems='center'
              >
                <Typography variant='h5'>Посещаемость</Typography>
                <Box display='flex' gap={2}>
                  <Button
                    variant='contained'
                    color='primary'
                    startIcon={<EventNoteIcon />}
                    onClick={() => setBulkModalOpen(true)}
                    disabled={!selectedGroup}
                  >
                    Массовое назначение
                  </Button>

                  <ExportButton
                    exportTypes={[
                      {
                        value: 'children-attendance',
                        label: 'Посещаемость детей',
                      },
                    ]}
                    onExport={handleExport}
                  />
                  <Tooltip title="Импортировать из Excel (docs/Посещаемость детей.xlsx)">
                    <Button
                      variant='outlined'
                      color='primary'
                      startIcon={isImporting ? <CircularProgress size={20} /> : <FileUploadIcon />}
                      onClick={handleImportChildAttendance}
                      disabled={isImporting || loading}
                    >
                      {isImporting ? 'Импорт...' : 'Импорт'}
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
            }
          />
          <Divider />
          <CardContent>
            {/* Month Navigation */}
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              mb={3}
            >
              <IconButton onClick={goToPreviousMonth}>
                <ArrowBackIosIcon />
              </IconButton>

              <Box textAlign='center'>
                <Typography variant='h6'>
                  {moment(currentDate).format('MMMM YYYY')}
                </Typography>
                <Button
                  variant='outlined'
                  size='small'
                  onClick={goToToday}
                  startIcon={<TodayIcon />}
                  sx={{ mt: 1 }}
                >
                  Сегодня
                </Button>
              </Box>

              <IconButton onClick={goToNextMonth}>
                <ArrowForwardIosIcon />
              </IconButton>
            </Box>

            <Box mb={3}>
              <FormControl fullWidth>
                <InputLabel>Выберите группу</InputLabel>
                <Select value={selectedGroup} onChange={handleGroupChange}>
                  {groups.map((group) => (
                    <MenuItem
                      key={group.id || group._id}
                      value={group.id || group._id}
                    >
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
                      {monthDays.map((day) => (
                        <TableCell key={day.toString()} align='center'>
                          <Box>
                            <Box>{moment(day).format('dd')}</Box>
                            <Box>{moment(day).format('D')}</Box>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredChildren.map((child) => (
                      <TableRow key={child.id}>
                        <TableCell>
                          <Box display='flex' alignItems='center'>
                            <PersonIcon
                              sx={{ mr: 1, color: 'text.secondary' }}
                            />
                            <Box>
                              {child.fullName}
                              {child.parentName && (
                                <Box
                                  sx={{
                                    fontSize: '0.8em',
                                    color: 'text.secondary',
                                  }}
                                >
                                  Родитель: {child.parentName}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        {monthDays.map((day) => {
                          const attendance = getAttendanceForDay(
                            child.id!,
                            day,
                          );
                          const isWeekend =
                            day.getDay() === 0 || day.getDay() === 6;

                          return (
                            <TableCell
                              key={day.toString()}
                              align='center'
                              sx={{
                                minHeight: '80px',
                                border: '1px solid',
                                borderColor: 'divider',
                                backgroundColor: isWeekend
                                  ? 'action.hover'
                                  : 'inherit',
                                cursor: isWeekend ? 'not-allowed' : 'pointer',
                                '&:hover': {
                                  backgroundColor: isWeekend
                                    ? 'action.hover'
                                    : 'action.selected',
                                },
                              }}
                            >
                              {isWeekend ? (
                                <Typography
                                  variant='body2'
                                  color='text.disabled'
                                  align='center'
                                >
                                  Выходной
                                </Typography>
                              ) : attendance ? (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant='body2'>
                                        {child.fullName}
                                      </Typography>
                                      <Typography variant='body2'>
                                        {moment(day).format('D MMMM YYYY')}
                                      </Typography>
                                      <Typography variant='body2'>
                                        Статус:{' '}
                                        {ATTENDANCE_STATUSES[attendance.status]}
                                      </Typography>
                                      {attendance.notes && (
                                        <Typography variant='body2'>
                                          Примечание: {attendance.notes}
                                        </Typography>
                                      )}
                                      <Typography
                                        variant='caption'
                                        sx={{ mt: 1, display: 'block' }}
                                      >
                                        Нажмите для изменения статуса
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Box
                                    onClick={() =>
                                      handleAttendanceClick(child, day)
                                    }
                                    sx={{
                                      p: 1,
                                      borderRadius: 1,
                                      bgcolor: 'background.paper',
                                      borderLeft: `4px solid ${attendance.status === 'present'
                                        ? theme.palette.success.main
                                        : attendance.status === 'sick'
                                          ? theme.palette.warning.main
                                          : attendance.status === 'vacation'
                                            ? theme.palette.info.main
                                            : attendance.status === 'late'
                                              ? theme.palette.warning.main
                                              : theme.palette.error.main
                                        }`,
                                      cursor: 'pointer',
                                      '&:hover': {
                                        bgcolor: 'action.selected',
                                      },
                                    }}
                                  >
                                    <Chip
                                      label={
                                        ATTENDANCE_STATUSES[attendance.status]
                                      }
                                      size='small'
                                      color={
                                        STATUS_COLORS[attendance.status] as any
                                      }
                                      icon={React.createElement(
                                        STATUS_ICONS[attendance.status],
                                        { fontSize: 'small' },
                                      )}
                                    />
                                  </Box>
                                </Tooltip>
                              ) : (
                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant='body2'>
                                        {child.fullName}
                                      </Typography>
                                      <Typography variant='body2'>
                                        {moment(day).format('D MMMM YYYY')}
                                      </Typography>
                                      <Typography variant='caption'>
                                        Нажмите для отметки посещаемости
                                      </Typography>
                                      {/* Показываем информацию о возможности отметки альтернативным сотрудником */}
                                      {selectedGroup && (
                                        <Typography
                                          variant='caption'
                                          sx={{
                                            mt: 1,
                                            display: 'block',
                                            color: 'warning.main',
                                          }}
                                        >
                                          Может быть отмечено альтернативным
                                          сотрудником
                                        </Typography>
                                      )}
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Box
                                    onClick={() =>
                                      handleAttendanceClick(child, day)
                                    }
                                    sx={{
                                      p: 1,
                                      borderRadius: 1,
                                      border: '1px dashed',
                                      borderColor: 'divider',
                                      textAlign: 'center',
                                      cursor: 'pointer',
                                      '&:hover': {
                                        bgcolor: 'action.selected',
                                        borderColor: 'primary.main',
                                      },
                                    }}
                                  >
                                    <Typography
                                      variant='caption'
                                      color='text.secondary'
                                    >
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
              <Box textAlign='center' py={4}>
                <Typography variant='h6' color='text.secondary'>
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

          const monthStart = moment(currentDate).startOf('month');
          const monthEnd = moment(currentDate).endOf('month');

          getChildAttendance({
            groupId: selectedGroup,
            startDate: monthStart.format('YYYY-MM-DD'),
            endDate: monthEnd.format('YYYY-MM-DD'),
          })
            .then((records: any) => {

              const attendanceMap: AttendanceData = {};
              records.forEach((record: ChildAttendanceRecord) => {
                const childId = record.childId;
                const date = record.date.split('T')[0];

                if (!attendanceMap[childId]) {
                  attendanceMap[childId] = {};
                }

                attendanceMap[childId][date] = {
                  status: record.status,
                  notes: record.notes,
                };
              });

              setAttendanceData(attendanceMap);
              enqueueSnackbar('Посещаемость успешно обновлена', {
                variant: 'success',
              });
            })
            .catch((err: any) => {
              console.error('Error refreshing attendance data:', err);
              enqueueSnackbar('Ошибка при обновлении данных', {
                variant: 'error',
              });
            });
        }}
      />
    </LocalizationProvider>
  );
};

export default WeeklyAttendance;
