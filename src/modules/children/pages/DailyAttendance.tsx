import React, { useState, useEffect, useMemo } from 'react';
import moment from 'moment';
import 'moment/locale/ru';
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
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../../app/context/AuthContext';
import childrenApi, { Child } from '../services/children';
import { getGroups } from '../services/groups';
import {
    getChildAttendance,
    bulkSaveChildAttendance,
    ChildAttendanceRecord,
} from '../services/childAttendance';

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
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState(moment());
    const [group, setGroup] = useState<any>(null);
    const [children, setChildren] = useState<Child[]>([]);
    const [attendance, setAttendance] = useState<Record<string, ChildAttendanceRecord>>({});

    const isToday = selectedDate.isSame(moment(), 'day');

    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            setLoading(true);
            try {
                const groupsData = await getGroups();
                const myGroup = groupsData.find(
                    (g: any) =>
                        g.teacher === currentUser.id ||
                        g.teacher === currentUser._id ||
                        g.teacherId === currentUser.id ||
                        g.teacherId === currentUser._id ||
                        (typeof g.teacher === 'object' && ((g.teacher as any)._id === currentUser._id || (g.teacher as any).id === currentUser.id))
                );

                if (myGroup) {
                    setGroup(myGroup);
                    const groupId = myGroup.id || myGroup._id;

                    const [childrenList, attendanceRecords] = await Promise.all([
                        childrenApi.getAll(),
                        getChildAttendance({
                            groupId,
                            date: selectedDate.format('YYYY-MM-DD'),
                        }),
                    ]);

                    const filteredChildren = childrenList.filter((child: Child) => {
                        if (typeof child.groupId === 'object' && child.groupId !== null) {
                            return (child.groupId as any)._id === groupId || (child.groupId as any).id === groupId;
                        }
                        return child.groupId === groupId;
                    });

                    setChildren(filteredChildren);

                    const attendanceMap: Record<string, ChildAttendanceRecord> = {};
                    attendanceRecords.forEach((record) => {
                        attendanceMap[record.childId] = record;
                    });
                    setAttendance(attendanceMap);
                }
            } catch (error) {
                console.error('Error fetching daily attendance data:', error);
                enqueueSnackbar('Ошибка при загрузке данных', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser, selectedDate, enqueueSnackbar]);

    const handleStatusChange = async (childId: string, status: any) => {
        if (!group) return;
        setSaving(childId);
        const dateStr = selectedDate.format('YYYY-MM-DD');

        try {
            await bulkSaveChildAttendance(
                [{ childId, date: dateStr, status }],
                group.id || group._id
            );

            setAttendance((prev) => ({
                ...prev,
                [childId]: { ...prev[childId], childId, date: dateStr, status } as ChildAttendanceRecord,
            }));

            const childName = children.find(c => c.id === childId || (c as any)._id === childId)?.fullName || 'Ребенок';
            const statusLabel = ATTENDANCE_STATUSES.find(s => s.id === status)?.label || status;
            enqueueSnackbar(`${childName}: ${statusLabel}`, { variant: 'success', autoHideDuration: 2000 });
        } catch (error) {
            console.error('Error saving attendance:', error);
            enqueueSnackbar('Ошибка при сохранении', { variant: 'error' });
        } finally {
            setSaving(null);
        }
    };

    const handleMarkAllPresent = async () => {
        if (!group || children.length === 0) return;
        setLoading(true);
        const dateStr = selectedDate.format('YYYY-MM-DD');
        const records = children.map(child => ({
            childId: (child.id || (child as any)._id),
            date: dateStr,
            status: 'present' as const
        }));

        try {
            await bulkSaveChildAttendance(records, group.id || group._id);

            const newAttendance = { ...attendance };
            records.forEach(record => {
                newAttendance[record.childId] = {
                    ...newAttendance[record.childId],
                    ...record
                } as ChildAttendanceRecord;
            });
            setAttendance(newAttendance);
            enqueueSnackbar('Все дети отмечены как присутствующие', { variant: 'success' });
        } catch (error) {
            console.error('Error bulk saving attendance:', error);
            enqueueSnackbar('Ошибка при массовом сохранении', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const changeDate = (amount: number) => {
        const newDate = moment(selectedDate).add(amount, 'days');
        if (newDate.isAfter(moment(), 'day')) return;
        setSelectedDate(newDate);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (!group) {
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
                            <Typography variant="h5" fontWeight="bold">
                                {group.name}
                            </Typography>
                            <Button
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircleIcon />}
                                onClick={handleMarkAllPresent}
                                size="small"
                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                disabled={!isToday}
                            >
                                Все на месте
                            </Button>
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                            Отметка посещаемости детей
                        </Typography>
                    </Box>
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
                                                disabled={isChildSaving}
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

            {children.length === 0 && (
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
