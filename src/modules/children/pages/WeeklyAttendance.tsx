import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Save as SaveIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment';


import { Child } from '../services/children';
import { useChildren } from '../../../app/context/ChildrenContext';
import { useGroups } from '../../../app/context/GroupsContext';
import { STATUS_COLORS } from '../../../shared/types/common';
import {
  getChildAttendance,
  bulkSaveChildAttendance,
  ChildAttendanceRecord,
} from '../services/childAttendance';
import { useAuth } from '../../../app/context/AuthContext';
import { useDate } from '../../../app/context/DateContext';
import { exportData } from '../../../shared/utils/exportUtils';

import AttendanceBulkModal from '../components/AttendanceBulkModal';
import ExportButton from '../../../shared/components/ExportButton';
import DateNavigator from '../../../shared/components/DateNavigator';
import { importChildAttendance } from '../../../shared/services/importService';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import ChildAttendanceDetailsDialog from '../components/ChildAttendanceDetailsDialog';

// Таймер автосохранения (в миллисекундах)
const AUTO_SAVE_DELAY = 5000;


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

const AttendanceCell = React.memo(({ 
  child, 
  day, 
  attendance, 
  isWeekend, 
  onClick
}: any) => {
  const theme = useTheme();
  
  const handleClick = useCallback(() => {
    if (!isWeekend) {
      onClick(child, day);
    }
  }, [child, day, isWeekend, onClick]);

  if (isWeekend) {
    return (
      <TableCell
        align='center'
        sx={{
          minHeight: '80px',
          border: '1px solid',
          borderColor: 'divider',
          backgroundColor: 'action.hover',
          cursor: 'not-allowed',
        }}
      >
        <Typography variant='body2' color='text.disabled' align='center'>
          Выходной
        </Typography>
      </TableCell>
    );
  }

  return (
    <TableCell
      align='center'
      sx={{
        minHeight: '80px',
        border: '1px solid',
        borderColor: 'divider',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.selected',
        },
      }}
    >
      {attendance ? (
        <Tooltip
          title={
            <Box>
              <Typography variant='body2'>{child.fullName}</Typography>
              <Typography variant='body2'>{moment(day).format('D MMMM YYYY')}</Typography>
              <Typography variant='body2'>Статус: {ATTENDANCE_STATUSES[attendance.status as AttendanceStatus]}</Typography>
              {attendance.notes && (
                <Typography variant='body2'>Примечание: {attendance.notes}</Typography>
              )}
              <Typography variant='caption' sx={{ mt: 1, display: 'block' }}>
                Нажмите для изменения статуса
              </Typography>
            </Box>
          }
          arrow
        >
          <Box
            onClick={handleClick}
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
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <Chip
              label={ATTENDANCE_STATUSES[attendance.status as AttendanceStatus]}
              size='small'
              color={STATUS_COLORS[attendance.status as AttendanceStatus] as any}
              icon={React.createElement(STATUS_ICONS[attendance.status as AttendanceStatus], { fontSize: 'small' })}
            />
          </Box>
        </Tooltip>
      ) : (
        <Tooltip
          title={
            <Box>
              <Typography variant='body2'>{child.fullName}</Typography>
              <Typography variant='body2'>{moment(day).format('D MMMM YYYY')}</Typography>
              <Typography variant='caption'>Нажмите для отметки посещаемости</Typography>
            </Box>
          }
          arrow
        >
          <Box
            onClick={handleClick}
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
            <Typography variant='caption' color='text.secondary'>
              Нажмите для отметки
            </Typography>
          </Box>
        </Tooltip>
      )}
    </TableCell>
  );
});

const AttendanceRow = React.memo(({ 
  child, 
  weekDays, 
  attendanceData, 
  onCellClick, 
  onOpenDetails
}: any) => {
  const childId = child.id || child._id;
  
  const handleDetailsClick = useCallback(() => {
    onOpenDetails(childId, child.fullName);
  }, [childId, child.fullName, onOpenDetails]);

  return (
    <TableRow key={childId}>
      <TableCell>
        <Box display='flex' alignItems='center' justifyContent="space-between">
          <Box display='flex' alignItems='center'>
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
          <IconButton
            size="small"
            onClick={handleDetailsClick}
            title="История посещений"
          >
            <InfoIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
      {weekDays.map((day: Date) => {
        const dateString = moment(day).format('YYYY-MM-DD');
        const attendance = attendanceData[childId]?.[dateString];
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;

        return (
          <AttendanceCell
            key={dateString}
            child={child}
            day={day}
            attendance={attendance}
            isWeekend={isWeekend}
            onClick={onCellClick}
          />
        );
      })}
    </TableRow>
  );
});

const WeeklyAttendance: React.FC = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentDate } = useDate();

  const { groups, loading: groupsLoading, fetchGroups } = useGroups();
  const { children, loading: childrenLoading, fetchChildren } = useChildren();

  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const [attendanceData, setAttendanceData] = useState<AttendanceData>({});

  const [pendingChanges, setPendingChanges] = useState<Array<{
    childId: string;
    date: string;
    status: AttendanceStatus;
    notes?: string;
  }>>([]);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedChildDetails, setSelectedChildDetails] = useState<{ id: string; name: string } | null>(null);

  const loading = groupsLoading || childrenLoading || loadingAttendance;
  const [isImporting, setIsImporting] = useState(false);

  const filteredChildren = useMemo(() => {
    if (!selectedGroup) return [];
    return children.filter((child) => {
      const gId = typeof child.groupId === 'object' && child.groupId !== null
        ? (child.groupId as any)._id || (child.groupId as any).id
        : child.groupId;
      return gId === selectedGroup;
    });
  }, [children, selectedGroup]);

  const weekDays = useMemo(() => {
    const start = moment(currentDate).startOf('isoWeek');
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(start.clone().add(i, 'day').toDate());
    }
    return days;
  }, [currentDate]);

  const fetchAttendanceData = useCallback(async () => {
    if (!selectedGroup) {
      setAttendanceData({});
      return;
    }

    setLoadingAttendance(true);
    try {
      const weekStart = moment(currentDate).startOf('isoWeek');
      const weekEnd = moment(currentDate).endOf('isoWeek');

      const records = await getChildAttendance({
        groupId: selectedGroup,
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekEnd.format('YYYY-MM-DD'),
      });

      const attendanceMap: AttendanceData = {};
      records.forEach((record: ChildAttendanceRecord) => {
        const childId = record.childId;
        const date = record.date.split('T')[0];
        if (!attendanceMap[childId]) attendanceMap[childId] = {};
        attendanceMap[childId][date] = { status: record.status, notes: record.notes };
      });
      setAttendanceData(attendanceMap);
    } catch (err: any) {
      setError('Не удалось загрузить данные посещаемости');
    } finally {
      setLoadingAttendance(false);
    }
  }, [currentDate, selectedGroup]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const handleAttendanceClick = useCallback((child: any, date: Date) => {
    const childId = child.id || child._id;
    const dateString = moment(date).format('YYYY-MM-DD');
    const existing = attendanceData[childId]?.[dateString];
    
    const statusCycle: AttendanceStatus[] = ['present', 'absent', 'sick', 'vacation'];
    const currentIndex = existing ? statusCycle.indexOf(existing.status) : -1;
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];

    const record = {
      childId: childId,
      date: dateString,
      status: nextStatus as AttendanceStatus,
      notes: existing?.notes || '',
    };

    setPendingChanges(prev => {
      const filtered = prev.filter(c => !(c.childId === childId && c.date === dateString));
      return [...filtered, record];
    });

    setAttendanceData(prev => ({
      ...prev,
      [childId]: {
        ...prev[childId],
        [dateString]: { status: nextStatus, notes: existing?.notes || '' },
      },
    }));
  }, [attendanceData]);

  const handleOpenChildDetails = useCallback((childId: string, childName: string) => {
    setSelectedChildDetails({ id: childId, name: childName });
    setDetailsDialogOpen(true);
  }, []);

  const flushPendingChanges = useCallback(async () => {
    if (pendingChanges.length === 0) return;

    setIsAutoSaving(true);
    try {
      await bulkSaveChildAttendance(pendingChanges, selectedGroup);
      setPendingChanges([]);
      enqueueSnackbar('Изменения сохранены', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar('Ошибка при сохранении', { variant: 'error' });
    } finally {
      setIsAutoSaving(false);
    }
  }, [pendingChanges, enqueueSnackbar]);

  // Auto-save logic
  useEffect(() => {
    if (pendingChanges.length > 0) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        flushPendingChanges();
      }, AUTO_SAVE_DELAY);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [pendingChanges, flushPendingChanges]);

  useEffect(() => {
    fetchGroups();
    fetchChildren();
  }, [fetchGroups, fetchChildren]);

  useEffect(() => {
    if (groups.length > 0 && !selectedGroup) {
      setSelectedGroup(groups[0].id || groups[0]._id);
    }
  }, [groups, selectedGroup]);

  const handleGroupChange = (event: SelectChangeEvent) => {
    setSelectedGroup(event.target.value as string);
  };

  const handleExport = async (type: string) => {
    if (type === 'children-attendance') {
      const weekStart = moment(currentDate).startOf('isoWeek');
      const weekEnd = moment(currentDate).endOf('isoWeek');

      await exportData('children-attendance', 'xlsx', {
        groupId: selectedGroup,
        startDate: weekStart.format('YYYY-MM-DD'),
        endDate: weekEnd.format('YYYY-MM-DD'),
      });
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
        fetchAttendanceData();
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
                <Box display='flex' alignItems='center' gap={1}>
                  <Typography variant='h5'>Посещаемость</Typography>
                  <AuditLogButton entityType="childAttendance" />
                </Box>
                <Box display='flex' gap={2}>
                  {pendingChanges.length > 0 && (
                    <Button
                      variant='contained'
                      color='primary'
                      startIcon={isAutoSaving ? <CircularProgress size={16} color='inherit' /> : <SaveIcon />}
                      onClick={flushPendingChanges}
                      size='small'
                      disabled={isAutoSaving}
                    >
                      Сохранить ({pendingChanges.length})
                    </Button>
                  )}
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
            {/* Week Navigation */}
            <DateNavigator viewType="week" />

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
                      {weekDays.map((day: Date) => (
                        <TableCell key={day.toString()} align='center'>
                          <Box sx={{
                            backgroundColor: moment(day).isSame(moment(), 'day') ? 'primary.light' : 'inherit',
                            p: 0.5, borderRadius: 1
                          }}>
                            <Box sx={{ fontWeight: 'bold' }}>{moment(day).format('dd')}</Box>
                            <Box>{moment(day).format('D/MM')}</Box>
                          </Box>
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredChildren.map((child: Child) => (
                      <AttendanceRow
                        key={child.id || (child as any)._id}
                        child={child}
                        weekDays={weekDays}
                        attendanceData={attendanceData}
                        onCellClick={handleAttendanceClick}
                        onOpenDetails={handleOpenChildDetails}
                      />
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

          const weekStart = moment(currentDate).startOf('isoWeek');
          const weekEnd = moment(currentDate).endOf('isoWeek');

          getChildAttendance({
            groupId: selectedGroup,
            startDate: weekStart.format('YYYY-MM-DD'),
            endDate: weekEnd.format('YYYY-MM-DD'),
          })
            .then((records) => {

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
            .catch((err) => {
              console.error('Error refreshing attendance data:', err);
              enqueueSnackbar('Ошибка при обновлении данных', {
                variant: 'error',
              });
            });
        }}
      />

      <ChildAttendanceDetailsDialog
        open={detailsDialogOpen}
        onClose={() => {
          setDetailsDialogOpen(false);
          setSelectedChildDetails(null);
        }}
        childId={selectedChildDetails?.id || ''}
        childName={selectedChildDetails?.name || ''}
        groupId={selectedGroup}
      />
    </LocalizationProvider>
  );
};

export default WeeklyAttendance;
