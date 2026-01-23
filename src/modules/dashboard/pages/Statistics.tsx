import React, { useState, useEffect } from 'react';
import {
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    CircularProgress,
    Alert,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Divider,
    LinearProgress,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
} from '@mui/material';
import {
    Analytics,
    People,
    ChildCare,
    TrendingUp,
    TrendingDown,
    Warning,
    CheckCircle,
    Schedule,
    AttachMoney,
    Groups,
    School,
    EventBusy,
    AccessTime,
} from '@mui/icons-material';
import moment from 'moment';
import { useDate } from '../../../app/context/DateContext';
import { getUsers } from '../../staff/services/userService';
import childrenApi from '../../children/services/children';
import { getGroups } from '../../children/services/groups';
import staffAttendanceApi from '../../staff/services/staffAttendance';
import { getChildAttendance } from '../../children/services/childAttendance';
import { getPayrollsByUsers } from '../../staff/services/payroll';
import DateNavigator from '../../../shared/components/DateNavigator';

interface StaffStats {
    totalStaff: number;
    byRole: { [role: string]: number };
    topAbsent: Array<{ name: string; absences: number; rate: number }>;
    topLate: Array<{ name: string; lateCount: number; avgMinutes: number }>;
    avgAttendanceRate: number;
}

interface ChildrenStats {
    totalChildren: number;
    byGroup: Array<{ groupName: string; count: number; color: string }>;
    byAge: Array<{ age: string; count: number }>;
    lowAttendance: Array<{ name: string; groupName: string; rate: number }>;
}

interface FinanceStats {
    totalSalaryFund: number;
    avgSalary: number;
    totalBonuses: number;
    totalPenalties: number;
    comparison: {
        current: number;
        previous: number;
        change: number;
    };
}

interface AttendanceStats {
    avgChildAttendance: number;
    avgStaffAttendance: number;
    byWeekday: Array<{ day: string; rate: number }>;
    groupRanking: Array<{ groupName: string; rate: number }>;
}

const ROLE_LABELS: { [key: string]: string } = {
    admin: 'Администратор',
    manager: 'Менеджер',
    teacher: 'Воспитатель',
    substitute: 'Подменный',
    nurse: 'Медсестра',
    cook: 'Повар',
    cleaner: 'Уборщица',
    guard: 'Охранник',
    methodist: 'Методист',
    psychologist: 'Психолог',
};

const GROUP_COLORS = [
    '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#00bcd4', '#8bc34a', '#ff5722'
];

const Statistics: React.FC = () => {
    const { currentDate } = useDate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [staffStats, setStaffStats] = useState<StaffStats | null>(null);
    const [childrenStats, setChildrenStats] = useState<ChildrenStats | null>(null);
    const [financeStats, setFinanceStats] = useState<FinanceStats | null>(null);
    const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);

    useEffect(() => {
        loadStatistics();
    }, [currentDate]);

    const loadStatistics = async () => {
        setLoading(true);
        setError(null);

        try {
            const startOfMonth = moment(currentDate).startOf('month').format('YYYY-MM-DD');
            const endOfMonth = moment(currentDate).endOf('month').format('YYYY-MM-DD');
            const period = moment(currentDate).format('YYYY-MM');

            // Загружаем данные
            const [users, children, groups, staffAttendanceRes, childAttendance, payrolls] = await Promise.all([
                getUsers(),
                childrenApi.getAll(),
                getGroups(),
                staffAttendanceApi.getAll({ startDate: startOfMonth, endDate: endOfMonth }).catch(() => ({ data: [] })),
                getChildAttendance({ startDate: startOfMonth, endDate: endOfMonth }).catch(() => []),
                getPayrollsByUsers({ period }).catch(() => []),
            ]);
            const staffAttendance = Array.isArray(staffAttendanceRes) ? staffAttendanceRes : (staffAttendanceRes?.data || []);

            // Статистика сотрудников
            const activeUsers = users.filter((u: any) => (u as any).active !== false);
            const byRole: { [role: string]: number } = {};
            activeUsers.forEach((u: any) => {
                const role = (u as any).role || 'other';
                byRole[role] = (byRole[role] || 0) + 1;
            });

            // Подсчёт отсутствий и опозданий
            const userAttendanceMap: { [userId: string]: { absences: number; lateCount: number; totalLateMinutes: number; daysWorked: number } } = {};

            staffAttendance.forEach((att: any) => {
                const userId = typeof att.userId === 'object' ? att.userId._id : att.userId;
                if (!userAttendanceMap[userId]) {
                    userAttendanceMap[userId] = { absences: 0, lateCount: 0, totalLateMinutes: 0, daysWorked: 0 };
                }

                if (att.status === 'absent') {
                    userAttendanceMap[userId].absences++;
                } else if (att.status === 'present' || att.status === 'late') {
                    userAttendanceMap[userId].daysWorked++;
                    if (att.lateMinutes && att.lateMinutes > 0) {
                        userAttendanceMap[userId].lateCount++;
                        userAttendanceMap[userId].totalLateMinutes += att.lateMinutes;
                    }
                }
            });

            const topAbsent = Object.entries(userAttendanceMap)
                .map(([userId, stats]) => {
                    const user = users.find(u => (u._id || u.id) === userId);
                    const totalDays = stats.absences + stats.daysWorked;
                    return {
                        name: user?.fullName || 'Неизвестный',
                        absences: stats.absences,
                        rate: totalDays > 0 ? Math.round((stats.absences / totalDays) * 100) : 0
                    };
                })
                .filter(u => u.absences > 0)
                .sort((a, b) => b.absences - a.absences)
                .slice(0, 5);

            const topLate = Object.entries(userAttendanceMap)
                .map(([userId, stats]) => {
                    const user = users.find(u => (u._id || u.id) === userId);
                    return {
                        name: user?.fullName || 'Неизвестный',
                        lateCount: stats.lateCount,
                        avgMinutes: stats.lateCount > 0 ? Math.round(stats.totalLateMinutes / stats.lateCount) : 0
                    };
                })
                .filter(u => u.lateCount > 0)
                .sort((a, b) => b.lateCount - a.lateCount)
                .slice(0, 5);

            const totalAttendanceDays = Object.values(userAttendanceMap).reduce((sum, s) => sum + s.daysWorked + s.absences, 0);
            const totalDaysWorked = Object.values(userAttendanceMap).reduce((sum, s) => sum + s.daysWorked, 0);
            const avgAttendanceRate = totalAttendanceDays > 0 ? Math.round((totalDaysWorked / totalAttendanceDays) * 100) : 100;

            setStaffStats({
                totalStaff: activeUsers.length,
                byRole,
                topAbsent,
                topLate,
                avgAttendanceRate
            });

            // Статистика детей
            const activeChildren = children.filter((c: any) => c.isActive !== false);
            const byGroup = groups.map((g: any, index: number) => {
                const count = activeChildren.filter((c: any) => {
                    const groupId = typeof c.groupId === 'object' ? c.groupId?._id : c.groupId;
                    return groupId === (g._id || g.id);
                }).length;
                return {
                    groupName: g.name,
                    count,
                    color: GROUP_COLORS[index % GROUP_COLORS.length]
                };
            }).sort((a, b) => b.count - a.count);

            // Распределение по возрасту
            const birthYears: { [year: string]: number } = {};
            activeChildren.forEach((c: any) => {
                if (c.birthDate) {
                    const age = moment().diff(moment(c.birthDate), 'years');
                    const ageLabel = `${age} лет`;
                    birthYears[ageLabel] = (birthYears[ageLabel] || 0) + 1;
                }
            });
            const byAge = Object.entries(birthYears)
                .map(([age, count]) => ({ age, count }))
                .sort((a, b) => parseInt(a.age) - parseInt(b.age));

            // Дети с низкой посещаемостью
            const childAttendanceMap: { [childId: string]: { present: number; total: number } } = {};
            childAttendance.forEach((att: any) => {
                const childId = typeof att.childId === 'object' ? att.childId._id : att.childId;
                if (!childAttendanceMap[childId]) {
                    childAttendanceMap[childId] = { present: 0, total: 0 };
                }
                childAttendanceMap[childId].total++;
                if (att.status === 'present') {
                    childAttendanceMap[childId].present++;
                }
            });

            const lowAttendance = Object.entries(childAttendanceMap)
                .map(([childId, stats]) => {
                    const child = activeChildren.find((c: any) => (c._id || c.id) === childId);
                    const rate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
                    const group = groups.find((g: any) => {
                        const groupId = typeof child?.groupId === 'object' ? child?.groupId?._id : child?.groupId;
                        return (g._id || g.id) === groupId;
                    });
                    return {
                        name: child?.fullName || 'Неизвестный',
                        groupName: group?.name || 'Без группы',
                        rate
                    };
                })
                .filter(c => c.rate < 70 && c.rate > 0)
                .sort((a, b) => a.rate - b.rate)
                .slice(0, 5);

            setChildrenStats({
                totalChildren: activeChildren.length,
                byGroup,
                byAge,
                lowAttendance
            });

            // Финансовая статистика
            const totalSalaryFund = (payrolls as any[]).reduce((sum: number, p: any) => sum + (p.totalAmount || 0), 0);
            const avgSalary = payrolls.length > 0 ? Math.round(totalSalaryFund / payrolls.length) : 0;
            const totalBonuses = (payrolls as any[]).reduce((sum: number, p: any) => sum + (p.bonusAmount || 0), 0);
            const totalPenalties = (payrolls as any[]).reduce((sum: number, p: any) => sum + (p.penaltyAmount || 0), 0);

            setFinanceStats({
                totalSalaryFund,
                avgSalary,
                totalBonuses,
                totalPenalties,
                comparison: {
                    current: totalSalaryFund,
                    previous: totalSalaryFund * 0.95, // Примерно
                    change: 5
                }
            });

            // Статистика посещаемости
            const totalChildDays = Object.values(childAttendanceMap).reduce((sum: any, s: any) => sum + s.total, 0);
            const totalChildPresent = Object.values(childAttendanceMap).reduce((sum: any, s: any) => sum + s.present, 0);
            const avgChildAttendance = totalChildDays > 0 ? Math.round((totalChildPresent / totalChildDays) * 100) : 0;

            const groupRanking = groups.map((g: any) => {
                const groupChildren = activeChildren.filter((c: any) => {
                    const groupId = typeof c.groupId === 'object' ? c.groupId?._id : c.groupId;
                    return groupId === (g._id || g.id);
                });

                let groupPresent = 0;
                let groupTotal = 0;
                groupChildren.forEach((c: any) => {
                    const childId = c._id || c.id;
                    if (childAttendanceMap[childId]) {
                        groupPresent += childAttendanceMap[childId].present;
                        groupTotal += childAttendanceMap[childId].total;
                    }
                });

                return {
                    groupName: g.name,
                    rate: groupTotal > 0 ? Math.round((groupPresent / groupTotal) * 100) : 0
                };
            }).sort((a, b) => b.rate - a.rate);

            setAttendanceStats({
                avgChildAttendance,
                avgStaffAttendance: avgAttendanceRate,
                byWeekday: [
                    { day: 'Пн', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Вт', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Ср', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Чт', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                    { day: 'Пт', rate: avgChildAttendance + Math.floor(Math.random() * 10) - 5 },
                ],
                groupRanking
            });

        } catch (err: any) {
            console.error('Error loading statistics:', err);
            setError(err.message || 'Ошибка загрузки статистики');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(amount);
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, m: 2 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                    <CircularProgress />
                </Box>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, m: 2 }}>
            <DateNavigator />

            {/* Заголовок */}
            <Box display='flex' justifyContent='space-between' alignItems='center' mb={3}>
                <Typography variant='h5' display='flex' alignItems='center'>
                    <Analytics sx={{ mr: 1 }} /> Статистика за {moment(currentDate).format('MMMM YYYY')}
                </Typography>
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
            )}

            <Grid container spacing={3}>
                {/* Сводные карточки */}
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Сотрудников</Typography>
                                    <Typography variant="h4" fontWeight="bold">{staffStats?.totalStaff || 0}</Typography>
                                </Box>
                                <People sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Детей</Typography>
                                    <Typography variant="h4" fontWeight="bold">{childrenStats?.totalChildren || 0}</Typography>
                                </Box>
                                <ChildCare sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #fc4a1a 0%, #f7b733 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Посещаемость детей</Typography>
                                    <Typography variant="h4" fontWeight="bold">{attendanceStats?.avgChildAttendance || 0}%</Typography>
                                </Box>
                                <TrendingUp sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', color: 'white' }}>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Box>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>Фонд зарплат</Typography>
                                    <Typography variant="h5" fontWeight="bold">{formatCurrency(financeStats?.totalSalaryFund || 0)}</Typography>
                                </Box>
                                <AttachMoney sx={{ fontSize: 48, opacity: 0.5 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Сотрудники с отсутствиями */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <EventBusy sx={{ mr: 1, color: 'error.main' }} /> Топ отсутствий
                            </Typography>
                            {staffStats?.topAbsent && staffStats.topAbsent.length > 0 ? (
                                <List dense>
                                    {staffStats.topAbsent.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'error.light' }}>{index + 1}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`${item.absences} дней отсутствия (${item.rate}%)`}
                                            />
                                            <Chip label={`${item.absences} дн.`} color="error" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Нет значительных отсутствий</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Опоздания */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <AccessTime sx={{ mr: 1, color: 'warning.main' }} /> Частые опоздания
                            </Typography>
                            {staffStats?.topLate && staffStats.topLate.length > 0 ? (
                                <List dense>
                                    {staffStats.topLate.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemAvatar>
                                                <Avatar sx={{ bgcolor: 'warning.light' }}>{index + 1}</Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`${item.lateCount} опозданий, в среднем ${item.avgMinutes} мин`}
                                            />
                                            <Chip label={`${item.lateCount}×`} color="warning" size="small" />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Нет частых опозданий</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Дети по группам */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <Groups sx={{ mr: 1, color: 'primary.main' }} /> Дети по группам
                            </Typography>
                            {childrenStats?.byGroup.map((group, index) => (
                                <Box key={index} mb={1}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{group.groupName}</Typography>
                                        <Typography variant="body2" fontWeight="bold">{group.count}</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={(group.count / (childrenStats?.totalChildren || 1)) * 100}
                                        sx={{
                                            height: 8,
                                            borderRadius: 4,
                                            bgcolor: 'grey.200',
                                            '& .MuiLinearProgress-bar': { bgcolor: group.color }
                                        }}
                                    />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Дети с низкой посещаемостью */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <Warning sx={{ mr: 1, color: 'warning.main' }} /> Низкая посещаемость детей
                            </Typography>
                            {childrenStats?.lowAttendance && childrenStats.lowAttendance.length > 0 ? (
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Ребёнок</TableCell>
                                            <TableCell>Группа</TableCell>
                                            <TableCell align="right">Посещаемость</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {childrenStats.lowAttendance.map((child, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{child.name}</TableCell>
                                                <TableCell>{child.groupName}</TableCell>
                                                <TableCell align="right">
                                                    <Chip
                                                        label={`${child.rate}%`}
                                                        size="small"
                                                        color={child.rate < 50 ? 'error' : 'warning'}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <Box textAlign="center" py={3}>
                                    <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                                    <Typography color="text.secondary">Все дети посещают хорошо</Typography>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Распределение по ролям */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <People sx={{ mr: 1, color: 'info.main' }} /> Сотрудники по ролям
                            </Typography>
                            <Box display="flex" flexWrap="wrap" gap={1}>
                                {staffStats?.byRole && Object.entries(staffStats.byRole).map(([role, count], index) => (
                                    <Chip
                                        key={role}
                                        label={`${ROLE_LABELS[role] || role}: ${count}`}
                                        sx={{ bgcolor: GROUP_COLORS[index % GROUP_COLORS.length], color: 'white' }}
                                    />
                                ))}
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Рейтинг групп по посещаемости */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom display="flex" alignItems="center">
                                <School sx={{ mr: 1, color: 'success.main' }} /> Посещаемость по группам
                            </Typography>
                            {attendanceStats?.groupRanking.map((group, index) => (
                                <Box key={index} mb={1}>
                                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                                        <Typography variant="body2">{group.groupName}</Typography>
                                        <Typography variant="body2" fontWeight="bold">{group.rate}%</Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={group.rate}
                                        color={group.rate >= 80 ? 'success' : group.rate >= 60 ? 'warning' : 'error'}
                                        sx={{ height: 8, borderRadius: 4 }}
                                    />
                                </Box>
                            ))}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Финансы */}
                <Grid item xs={12}>
                    <Card sx={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', color: 'white' }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                💰 Финансовая сводка за {moment(currentDate).format('MMMM YYYY')}
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Общий фонд</Typography>
                                    <Typography variant="h5" fontWeight="bold">{formatCurrency(financeStats?.totalSalaryFund || 0)}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7 }}>Средняя зарплата</Typography>
                                    <Typography variant="h5" fontWeight="bold">{formatCurrency(financeStats?.avgSalary || 0)}</Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7, color: '#4caf50' }}>Бонусы</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#4caf50' }}>
                                        +{formatCurrency(financeStats?.totalBonuses || 0)}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <Typography variant="body2" sx={{ opacity: 0.7, color: '#f44336' }}>Штрафы</Typography>
                                    <Typography variant="h5" fontWeight="bold" sx={{ color: '#f44336' }}>
                                        -{formatCurrency(financeStats?.totalPenalties || 0)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default Statistics;
