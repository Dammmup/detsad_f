import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

import moment from 'moment/min/moment-with-locales';;

moment.locale('ru');
import {
    Box,
    Typography,
    Card,
    CardContent,
    CircularProgress,
    IconButton,
    Button,
    Grid,
    Avatar,
    Chip,
    Paper,
    Divider,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    SelectChangeEvent,
    Alert,
} from '@mui/material';
import {
    CheckCircle as CheckCircleIcon,
    Cancel as CancelIcon,
    Sick as SickIcon,
    BeachAccess as BeachAccessIcon,
    Schedule as ScheduleIcon,
    Person as PersonIcon,
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Save as SaveIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../app/context/AuthContext';
import { useChildren } from '../../../app/context/ChildrenContext';
import { useGroups } from '../../../app/context/GroupsContext';
import {
    getChildAttendance,
    bulkSaveChildAttendance,
    ChildAttendanceRecord,
} from '../services/childAttendance';
import { Child } from '../services/children';
import AuditLogButton from '../../../shared/components/AuditLogButton';

// Таймер автосохранения (в миллисекундах)
const AUTO_SAVE_DELAY = 5000;

const FULL_GROUP_ACCESS_ROLES = ['admin', 'manager', 'director', 'owner'] as const;

function refId(ref: unknown): string {
    if (ref == null) return '';
    if (typeof ref === 'string') return ref;
    if (typeof ref === 'object') {
        const o = ref as { _id?: unknown; id?: unknown };
        return String(o._id ?? o.id ?? '');
    }
    return String(ref);
}

function isUserAssignedToGroup(
    group: { teacherId?: string; teacher?: string; assistantId?: string },
    userId: string,
): boolean {
    const teacherSide = refId(group.teacherId ?? group.teacher);
    const assistantSide = refId(group.assistantId);
    return teacherSide === userId || assistantSide === userId;
}

const ATTENDANCE_STATUSES = [
    { id: 'present', label: 'Присутствует', color: 'success', icon: <CheckCircleIcon /> },
    { id: 'absent', label: 'Отсутствует', color: 'error', icon: <CancelIcon /> },
    { id: 'sick', label: 'Болеет', color: 'warning', icon: <SickIcon /> },
    { id: 'vacation', label: 'Отпуск', color: 'info', icon: <BeachAccessIcon /> },
    { id: 'late', label: 'Опоздание', color: 'warning', icon: <ScheduleIcon /> },
] as const;

const DailyAttendance: React.FC = () => {
    const { user: currentUser } = useAuth();
    const { enqueueSnackbar } = useSnackbar();
    const role = currentUser?.role;
    const canEditAttendance = role === 'admin' || role === 'teacher' || role === 'assistant';

    const { groups: groupsList, loading: groupsLoading, fetchGroups } = useGroups();
    const { children: allChildren, loading: childrenLoading, fetchChildren } = useChildren();

    const visibleGroups = useMemo(() => {
        const uid = String(currentUser?.id || (currentUser as { _id?: string })?._id || '');
        const role = String(currentUser?.role || '');
        if (!uid || (FULL_GROUP_ACCESS_ROLES as readonly string[]).includes(role)) {
            return groupsList;
        }
        return groupsList.filter((g) => isUserAssignedToGroup(g, uid));
    }, [groupsList, currentUser]);

    const [saving, setSaving] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(moment());
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [attendance, setAttendance] = useState<Record<string, ChildAttendanceRecord>>({});

    const [pendingChanges, setPendingChanges] = useState<Array<{
        childId: string;
        date: string;
        status: 'present' | 'absent' | 'late' | 'sick' | 'vacation';
    }>>([]);
    const [isAutoSaving, setIsAutoSaving] = useState(false);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    const loading = groupsLoading || childrenLoading;
    const isToday = selectedDate.isSame(moment(), 'day');
    const isAdmin = ['admin', 'manager', 'director', 'owner'].includes(currentUser?.role || '');
    const canChangeDate = isAdmin;

    const group = useMemo(() =>
        visibleGroups.find(g => (g.id || g._id) === selectedGroupId),
        [visibleGroups, selectedGroupId]);

    const children = useMemo(() => {
        if (!selectedGroupId) return [];
        return allChildren.filter((child) => {
            const groupRef = child.groupId;
            const childGroupId = typeof groupRef === 'object' && groupRef !== null
                ? String((groupRef as any)._id || (groupRef as any).id || '')
                : String(groupRef || '');

            // Фильтруем служебные записи типа "Итого детей"
            const isSummaryRecord = child.fullName?.startsWith('Итого');

            return childGroupId === String(selectedGroupId) && !isSummaryRecord;
        });
    }, [allChildren, selectedGroupId]);

    const childById = useMemo(() => {
        const map = new Map<string, Child>();
        children.forEach((child: any) => {
            const id = String(child.id || child._id || '');
            if (id) map.set(id, child);
        });
        return map;
    }, [children]);

    const statusLabelById = useMemo(() => {
        const map = new Map<string, string>();
        ATTENDANCE_STATUSES.forEach((status) => map.set(status.id, status.label));
        return map;
    }, []);

    // Функция автосохранения накопленных изменений
    const flushPendingChanges = useCallback(async () => {
        if (!canEditAttendance) {
            enqueueSnackbar('Недостаточно прав для изменения посещаемости', { variant: 'error' });
            return;
        }
        if (!selectedGroupId || pendingChanges.length === 0) return;

        setIsAutoSaving(true);
        const changesToSave = [...pendingChanges];

        try {
            await bulkSaveChildAttendance(changesToSave as any, selectedGroupId);

            // Обновляем локальное состояние
            const newAttendance = { ...attendance };
            changesToSave.forEach(record => {
                newAttendance[record.childId] = {
                    ...newAttendance[record.childId],
                    ...record
                } as ChildAttendanceRecord;
            });
            setAttendance(newAttendance);

            // Очищаем буфер
            setPendingChanges([]);

            enqueueSnackbar(`Сохранено изменений: ${changesToSave.length}`, { variant: 'success', autoHideDuration: 2000 });
        } catch (error) {
            console.error('Error auto-saving attendance:', error);
            enqueueSnackbar('Ошибка при автосохранении', { variant: 'error' });
        } finally {
            setIsAutoSaving(false);
        }
    }, [selectedGroupId, pendingChanges, attendance, enqueueSnackbar, canEditAttendance]);

    // Таймер автосохранения
    useEffect(() => {
        if (!canEditAttendance) {
            return;
        }
        if (pendingChanges.length > 0 && !isAutoSaving) {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }

            autoSaveTimerRef.current = setTimeout(() => {
                flushPendingChanges();
            }, AUTO_SAVE_DELAY);
        }

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [pendingChanges, isAutoSaving, flushPendingChanges, canEditAttendance]);

    // Сохранение при смене даты
    useEffect(() => {
        if (pendingChanges.length > 0) {
            flushPendingChanges();
        }
    }, [selectedDate]);

    useEffect(() => {
        const initData = async () => {
            await Promise.all([fetchGroups(), fetchChildren()]);
        };
        initData();
    }, [fetchGroups, fetchChildren]);

    useEffect(() => {
        if (visibleGroups.length === 0) return;
        const ids = visibleGroups.map((g) => String(g.id || g._id));
        const cur = String(selectedGroupId);
        if (!selectedGroupId || !ids.includes(cur)) {
            setSelectedGroupId(visibleGroups[0].id || visibleGroups[0]._id);
        }
    }, [visibleGroups, selectedGroupId]);

    useEffect(() => {
        const fetchAttendance = async () => {
            if (!selectedGroupId) return;
            try {
                const records = await getChildAttendance({
                    groupId: selectedGroupId,
                    date: selectedDate.format('YYYY-MM-DD'),
                });
                const attendanceMap: Record<string, ChildAttendanceRecord> = {};
                records.forEach((record) => {
                    attendanceMap[record.childId] = record;
                });
                setAttendance(attendanceMap);
            } catch (error) {
                console.error('Error fetching attendance:', error);
            }
        };
        fetchAttendance();
    }, [selectedGroupId, selectedDate]);

    const handleGroupChange = async (e: SelectChangeEvent<string>) => {
        if (pendingChanges.length > 0) {
            await flushPendingChanges();
        }
        setSelectedGroupId(e.target.value);
    };

    const handleStatusChange = async (childId: string, status: any) => {
        if (!canEditAttendance) {
            enqueueSnackbar('Недостаточно прав для изменения посещаемости', { variant: 'error' });
            return;
        }
        if (!selectedGroupId) return;
        const dateStr = selectedDate.format('YYYY-MM-DD');

        // Добавляем изменение в буфер вместо немедленной отправки
        setPendingChanges(prev => {
            const filtered = prev.filter(c => !(c.childId === childId && c.date === dateStr));
            return [...filtered, { childId, date: dateStr, status }];
        });

        // Сразу обновляем локальное состояние для мгновенного отклика UI
        setAttendance((prev) => ({
            ...prev,
            [childId]: { ...prev[childId], childId, date: dateStr, status } as ChildAttendanceRecord,
        }));

        const childName = childById.get(childId)?.fullName || 'Ребенок';
        const statusLabel = statusLabelById.get(status) || status;
        enqueueSnackbar(`${childName}: ${statusLabel} (в очереди на сохранение)`, { variant: 'info', autoHideDuration: 1500 });
    };

    const handleMarkAllPresent = async () => {
        if (!canEditAttendance) {
            enqueueSnackbar('Недостаточно прав для изменения посещаемости', { variant: 'error' });
            return;
        }
        if (!selectedGroupId || children.length === 0) return;
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const records = children.map(child => ({
            childId: (child.id || (child as any)._id),
            date: dateStr,
            status: 'present' as const
        }));

        setPendingChanges(prev => {
            const filtered = prev.filter(c => c.date !== dateStr);
            return [...filtered, ...records];
        });

        const newAttendance = { ...attendance };
        records.forEach(record => {
            newAttendance[record.childId] = {
                ...newAttendance[record.childId],
                ...record
            } as ChildAttendanceRecord;
        });
        setAttendance(newAttendance);

        enqueueSnackbar(`Все дети отмечены как присутствующие (в очереди на сохранение)`, { variant: 'info' });
    };

    const changeDate = (amount: number) => {
        const newDate = moment(selectedDate).add(amount, 'days');
        if (newDate.isAfter(moment(), 'day')) return;
        setSelectedDate(newDate);
    };

    if (loading && visibleGroups.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!loading && visibleGroups.length === 0) {
        return (
            <Box p={3} textAlign="center">
                <Typography variant="h6" color="textSecondary">
                    Вы не назначены ни в одну группу. Обратитесь к администратору.
                </Typography>
            </Box>
        );
    }

    return (
        <Box p={{ xs: 1, sm: 3 }}>
            <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                            {visibleGroups.length > 1 ? (
                                <FormControl size="small" sx={{ minWidth: 200 }}>
                                    <InputLabel>Выберите группу</InputLabel>
                                    <Select
                                        value={selectedGroupId}
                                        label="Выберите группу"
                                        onChange={handleGroupChange}
                                    >
                                        {visibleGroups.map((g: any) => (
                                            <MenuItem key={g.id || g._id} value={g.id || g._id}>
                                                {g.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Typography variant="h5" fontWeight="bold">
                                    {group?.name || 'Загрузка...'}
                                </Typography>
                            )}
                            <AuditLogButton entityType="childAttendance" />
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={handleMarkAllPresent}
                                size="small"
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                disabled={!isToday || !canEditAttendance}
                            >
                                Все на месте
                            </Button>
                            {pendingChanges.length > 0 && canEditAttendance && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={isAutoSaving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                                    onClick={flushPendingChanges}
                                    size="small"
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                    disabled={isAutoSaving}
                                >
                                    Сохранить ({pendingChanges.length})
                                </Button>
                            )}
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Отметка посещаемости детей
                        </Typography>
                        {!canEditAttendance && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                                У вас нет прав на изменение посещаемости.
                            </Alert>
                        )}
                    </Box>
                    {canChangeDate && (
                        <Box display="flex" alignItems="center" bgcolor="white" borderRadius={3} p={0.5} boxShadow={1}>
                            <IconButton onClick={() => changeDate(-1)} size="small">
                                <ChevronLeftIcon />
                            </IconButton>
                            <Box px={2} textAlign="center" minWidth="120px">
                                <Typography variant="subtitle2" fontWeight="bold">
                                    {isToday ? 'Сегодня' : selectedDate.format('DD MMMM')}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    {selectedDate.format('dddd')}
                                </Typography>
                            </Box>
                            <IconButton
                                onClick={() => changeDate(1)}
                                size="small"
                                disabled={isToday}
                            >
                                <ChevronRightIcon />
                            </IconButton>
                        </Box>
                    )}
                </Box>
            </Paper>

            <Grid container spacing={2}>
                {children.map((child) => {
                    const childId = (child.id || (child as any)._id);
                    const currentRecord = attendance[childId];
                    const currentStatus = currentRecord?.status;
                    const isChildSaving = saving === childId;

                    const statusConfig = ATTENDANCE_STATUSES.find(s => s.id === currentStatus);
                    const borderColor = statusConfig ? (theme: any) => theme.palette[statusConfig.color].main : 'transparent';

                    return (
                        <Grid item xs={12} sm={6} md={4} key={childId}>
                            <Card sx={{
                                height: '100%',
                                borderRadius: 3,
                                transition: 'all 0.3s ease',
                                border: '2px solid',
                                borderColor: borderColor,
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 4
                                },
                                position: 'relative'
                            }}>
                                <CardContent>
                                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                                        <Box display="flex" alignItems="center">
                                            <Avatar sx={{
                                                bgcolor: 'primary.light',
                                                width: 48,
                                                height: 48,
                                                mr: 2,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                            }}>
                                                <PersonIcon />
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                                    {child.fullName}
                                                </Typography>
                                                {child.parentName && (
                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                        {child.parentName}
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Box>
                                        {currentStatus && (
                                            <Chip
                                                label={statusConfig?.label}
                                                color={statusConfig?.color as any}
                                                size="small"
                                                variant="filled"
                                                sx={{ fontWeight: 'bold' }}
                                            />
                                        )}
                                    </Box>

                                    <Divider sx={{ mb: 2 }} />

                                    <Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={1}>
                                        {ATTENDANCE_STATUSES.map((status) => (
                                            <Button
                                                key={status.id}
                                                variant={currentStatus === status.id ? 'contained' : 'outlined'}
                                                color={status.color as any}
                                                size="small"
                                                onClick={() => handleStatusChange(childId, status.id)}
                                                disabled={isChildSaving || !canEditAttendance}
                                                sx={{
                                                    py: 1,
                                                    px: 0,
                                                    minWidth: 0,
                                                    borderRadius: 2,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: 0.5,
                                                    textTransform: 'none',
                                                    borderWidth: 1.5,
                                                    '&:hover': { borderWidth: 1.5 }
                                                }}
                                            >
                                                {React.cloneElement(status.icon as React.ReactElement, { fontSize: 'small' })}
                                                <Typography variant="caption" style={{ fontSize: '0.65rem' }}>
                                                    {status.label}
                                                </Typography>
                                            </Button>
                                        ))}
                                    </Box>
                                </CardContent>
                                {isChildSaving && (
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        bgcolor: 'rgba(255,255,255,0.6)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        zIndex: 1,
                                        borderRadius: 3
                                    }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                )}
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>

            {children.length === 0 && !loading && (
                <Box textAlign="center" py={10}>
                    <Typography variant="h6" color="textSecondary">
                        В этой группе пока нет детей.
                    </Typography>
                </Box>
            )}
        </Box>
    );
};

export default DailyAttendance;
