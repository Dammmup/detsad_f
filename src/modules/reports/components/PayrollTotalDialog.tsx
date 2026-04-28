import React from 'react';
import moment from 'moment/min/moment-with-locales';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Divider,
    Grid,
    CircularProgress,
    Collapse,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    useTheme,
    useMediaQuery,
    Switch,
    FormControlLabel,
    IconButton,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TableRowsIcon from '@mui/icons-material/TableRows';
import { staffAttendanceTrackingService, StaffAttendanceRecord } from '../../staff/services/staffAttendanceTracking';

interface Props {
    open: boolean;
    onClose: () => void;
    data: {
        staffName: string;
        accruals: number;
        baseSalary: number;
        baseSalaryType?: 'month' | 'shift';
        workedShifts: number;
        shiftRate: number;
        workedDays: number;
        bonuses: number;
        advance: number;
        penalties: number;
        total: number;
        bonusDetails?: any;
        normDays?: number;
        normProduction?: number;
        normShifts?: number;
        normType?: 'production' | 'shifts';
        _id?: string;
        deductions?: number;
        latePenalties?: number;
        absencePenalties?: number;
        userFines?: number;
        missingChildAttendancePenalties?: number;
        carryOverDebt?: number;
        staffId?: string;
    } | null;
    period?: string;
    onUpdate?: (id: string, updates: any) => Promise<void>;
}

type AttendanceViewMode = 'table' | 'calendar';
type AttendanceStatus = 'completed' | 'late' | 'early_leave' | 'in_progress' | 'absent' | 'scheduled' | 'missing';

const ATTENDANCE_STATUS_META: Record<AttendanceStatus, { label: string; bg: string; color: string; border: string }> = {
    completed: { label: 'Завершено', bg: 'rgba(22, 163, 74, 0.12)', color: '#15803d', border: 'rgba(22, 163, 74, 0.35)' },
    late: { label: 'Опоздание', bg: 'rgba(245, 158, 11, 0.14)', color: '#b45309', border: 'rgba(245, 158, 11, 0.45)' },
    early_leave: { label: 'Ранний уход', bg: 'rgba(249, 115, 22, 0.14)', color: '#c2410c', border: 'rgba(249, 115, 22, 0.45)' },
    in_progress: { label: 'На смене', bg: 'rgba(37, 99, 235, 0.12)', color: '#1d4ed8', border: 'rgba(37, 99, 235, 0.35)' },
    absent: { label: 'Отсутствовал', bg: 'rgba(220, 38, 38, 0.12)', color: '#b91c1c', border: 'rgba(220, 38, 38, 0.35)' },
    scheduled: { label: 'Запланировано', bg: 'rgba(100, 116, 139, 0.12)', color: '#475569', border: 'rgba(100, 116, 139, 0.32)' },
    missing: { label: 'Нет отметки', bg: 'rgba(148, 163, 184, 0.10)', color: '#64748b', border: 'rgba(148, 163, 184, 0.30)' },
};

const resolveAttendanceStatus = (record?: StaffAttendanceRecord | null): AttendanceStatus => {
    if (!record) return 'missing';

    const rawStatus = (record as any).status;
    if (rawStatus === 'absent') return 'absent';
    if (rawStatus === 'scheduled' && !record.actualStart) return 'scheduled';
    if (!record.actualStart) return 'missing';
    if ((record.lateMinutes || 0) > 0) return 'late';
    if ((record.earlyLeaveMinutes || 0) > 0) return 'early_leave';
    if (record.actualStart && record.actualEnd) return 'completed';
    return 'in_progress';
};

const formatTime = (value?: Date | string) => (value ? moment(value).format('HH:mm') : '—');

const PayrollTotalDialog: React.FC<Props> = ({ open, onClose, data, period, onUpdate }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = React.useState(false);
    const [showWithoutDebt, setShowWithoutDebt] = React.useState(false); // Локальный режим просмотра без долга
    const [attendanceExpanded, setAttendanceExpanded] = React.useState(true);
    const [attendanceView, setAttendanceView] = React.useState<AttendanceViewMode>('table');
    const [attendanceRecords, setAttendanceRecords] = React.useState<StaffAttendanceRecord[]>([]);
    const [attendanceLoading, setAttendanceLoading] = React.useState(false);
    const [attendanceError, setAttendanceError] = React.useState<string | null>(null);

    const selectedPeriod = period || moment().format('YYYY-MM');

    React.useEffect(() => {
        if (!open) return;
        setAttendanceExpanded(true);
    }, [open]);

    React.useEffect(() => {
        if (!open || !data?.staffId) {
            setAttendanceRecords([]);
            return;
        }

        let cancelled = false;
        const startDate = moment(selectedPeriod, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
        const endDate = moment(selectedPeriod, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');

        setAttendanceLoading(true);
        setAttendanceError(null);

        staffAttendanceTrackingService.getAllRecords({
            staffId: data.staffId,
            startDate,
            endDate,
        })
            .then((response) => {
                if (cancelled) return;
                setAttendanceRecords(Array.isArray(response.data) ? response.data : []);
            })
            .catch((error) => {
                if (cancelled) return;
                console.error('Error loading payroll attendance details:', error);
                setAttendanceRecords([]);
                setAttendanceError('Не удалось загрузить отметки прихода и ухода');
            })
            .finally(() => {
                if (!cancelled) setAttendanceLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, data?.staffId, selectedPeriod]);

    const sortedAttendanceRecords = React.useMemo(() => {
        return [...attendanceRecords].sort((a, b) => {
            const aTime = a.date ? new Date(a.date).getTime() : 0;
            const bTime = b.date ? new Date(b.date).getTime() : 0;
            return aTime - bTime;
        });
    }, [attendanceRecords]);

    const attendanceByDate = React.useMemo(() => {
        const map = new Map<string, StaffAttendanceRecord>();
        sortedAttendanceRecords.forEach((record) => {
            if (record.date) {
                map.set(moment(record.date).format('YYYY-MM-DD'), record);
            }
        });
        return map;
    }, [sortedAttendanceRecords]);

    const calendarCells = React.useMemo(() => {
        const start = moment(selectedPeriod, 'YYYY-MM').startOf('month');
        const daysInMonth = start.daysInMonth();
        const leadingEmptyCells = start.isoWeekday() - 1;
        const cells: Array<{ dateKey?: string; day?: number; record?: StaffAttendanceRecord }> = [];

        for (let i = 0; i < leadingEmptyCells; i += 1) {
            cells.push({});
        }

        for (let day = 1; day <= daysInMonth; day += 1) {
            const date = start.clone().date(day);
            const dateKey = date.format('YYYY-MM-DD');
            cells.push({
                dateKey,
                day,
                record: attendanceByDate.get(dateKey),
            });
        }

        return cells;
    }, [attendanceByDate, selectedPeriod]);

    if (!data) return null;

    const isShiftBased = data.baseSalaryType === 'shift';
    const renderStatusChip = (status: AttendanceStatus) => {
        const meta = ATTENDANCE_STATUS_META[status];
        return (
            <Chip
                size="small"
                label={meta.label}
                sx={{
                    bgcolor: meta.bg,
                    color: meta.color,
                    border: '1px solid',
                    borderColor: meta.border,
                    fontWeight: 600,
                }}
            />
        );
    };
    
    const handleVariantClick = async (variant: 'production' | 'shifts') => {
        if (!data._id || !onUpdate || loading || data.normType === variant) return;
        
        setLoading(true);
        try {
            await onUpdate(data._id, { normType: variant });
        } catch (error) {
            console.error('Error updating norm type:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetDebt = async () => {
        if (!data._id || !onUpdate || loading) return;
        if (!window.confirm('Вы уверены, что хотите обнулить долг сотрудника за этот месяц?')) return;

        setLoading(true);
        try {
            await onUpdate(data._id, { carryOverDebt: 0 });
        } catch (error) {
            console.error('Error resetting debt:', error);
        } finally {
            setLoading(false);
        }
    };

    const displayTotal = showWithoutDebt 
        ? data.total + (data.carryOverDebt || 0) 
        : data.total;


    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ p: { xs: 2, sm: 3 }, pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 'bold' }}>
                        Детализация: {data.staffName}
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch 
                                size="small" 
                                checked={showWithoutDebt} 
                                onChange={(e) => setShowWithoutDebt(e.target.checked)} 
                            />
                        }
                        label={<Typography variant="caption">Без долга</Typography>}
                        sx={{ m: 0 }}
                    />
                </Box>
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>

                    {/* Main Salary Section */}
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Осн. часть (Начисления)
                        </Typography>

                        {isShiftBased ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Ставка за смену:</Typography>
                                    <Typography variant="body2">{(data.shiftRate || data.baseSalary).toLocaleString()} тг</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Отработано смен:</Typography>
                                    <Typography variant="body2">{data.workedShifts} смен</Typography>
                                </Box>
                                <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="body1">
                                        Расчет: {(data.shiftRate || data.baseSalary).toLocaleString()} * {data.workedShifts}
                                    </Typography>
                                    <Typography variant="body1" fontWeight="bold" color="primary">
                                        {data.accruals.toLocaleString()} тг
                                    </Typography>
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <Typography variant="body2" color="text.secondary">Оклад:</Typography>
                                    <Typography variant="body2">{data.baseSalary.toLocaleString()} тг</Typography>
                                </Box>

                                {typeof data.normDays === 'number' && data.normDays > 0 ? (
                                    <>
                                        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom color="primary" sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 1 }}>
                                                Варианты нормы
                                            </Typography>
                                            
                                            <Grid container spacing={1.5}>
                                                <Grid item xs={isMobile ? 12 : 6}>
                                                    <Box 
                                                        onClick={() => handleVariantClick('shifts')}
                                                        sx={{ 
                                                            p: 1.5, 
                                                            borderRadius: 2, 
                                                            bgcolor: data.normType === 'shifts' ? 'action.selected' : 'transparent',
                                                            cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: data.normType === 'shifts' ? 'primary.main' : 'divider',
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="text.secondary" display="block">По графику смен</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{data.normShifts || 0} дн.</Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                                            Дн. ставка: {data.normShifts ? Math.round(data.baseSalary / data.normShifts).toLocaleString() : 0} тг
                                                        </Typography>
                                                        {data.normType === 'shifts' && (
                                                            <Typography variant="caption" sx={{ color: 'success.main', display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                                                                ✓ Выбрано
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={isMobile ? 12 : 6} sx={{ borderLeft: isMobile ? 'none' : '1px solid', borderTop: isMobile ? '1px solid' : 'none', borderColor: 'divider', mt: isMobile ? 1 : 0, pt: isMobile ? 1 : 0 }}>
                                                    <Box 
                                                        onClick={() => handleVariantClick('production')}
                                                        sx={{ 
                                                            p: 1.5, 
                                                            borderRadius: 2, 
                                                            bgcolor: data.normType === 'production' || !data.normType ? 'action.selected' : 'transparent',
                                                            cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: data.normType === 'production' || !data.normType ? 'primary.main' : 'divider',
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="text.secondary" display="block">Произв. календарь</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{data.normProduction || 0} дн.</Typography>
                                                        <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.7rem' }}>
                                                            Дн. ставка: {data.normProduction ? Math.round(data.baseSalary / data.normProduction).toLocaleString() : 0} тг
                                                        </Typography>
                                                        {(data.normType === 'production' || !data.normType) && (
                                                            <Typography variant="caption" sx={{ color: 'success.main', display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                                                                ✓ Выбрано
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>
                                            </Grid>
                                        </Box>

                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Ставка за день (используемая):</Typography>
                                            <Typography variant="body2" fontWeight="bold">
                                                {Math.round(data.baseSalary / (data.normDays || 1)).toLocaleString()} тг
                                                <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                                                    ({data.baseSalary.toLocaleString()} / {data.normDays})
                                                </Typography>
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Отработано дней:</Typography>
                                            <Typography variant="body2">{data.workedDays} дн.</Typography>
                                        </Box>

                                        <Divider sx={{ my: 0.5, borderStyle: 'dashed' }} />

                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography variant="body1">
                                                Расчет: {Math.round(data.baseSalary / (data.normDays || 1)).toLocaleString()} * {data.workedDays}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="bold" color="primary">
                                                {data.accruals.toLocaleString()} тг
                                            </Typography>
                                        </Box>
                                        {data.accruals !== Math.round((data.baseSalary / (data.normDays || 1)) * data.workedDays) && data.workedDays === 0 && (
                                            <Typography variant="caption" color="error" sx={{ textAlign: 'right', display: 'block' }}>
                                                * Внимание: начислен полный оклад при 0 дней
                                            </Typography>
                                        )}
                                    </>
                                ) : (
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body1" color="error">Данные о норме дней отсутствуют</Typography>
                                        <Typography variant="body1" fontWeight="bold" color="primary">
                                            {data.accruals.toLocaleString()} тг
                                        </Typography>
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Box>

                    <Divider />

                    {/* Bonuses */}
                    <Box>
                        <Typography variant="subtitle2" color="success.main" gutterBottom>
                            Доплаты и премии
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Премии</Typography>
                            <Typography variant="body2">{data.bonuses.toLocaleString()} тг</Typography>
                        </Box>
                        {data.bonusDetails?.weekendWork ? (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                <Typography variant="caption" color="text.secondary">- Выходные</Typography>
                                <Typography variant="caption">{data.bonusDetails.weekendWork.toLocaleString()} тг</Typography>
                            </Box>
                        ) : null}
                        {data.bonusDetails?.holidayWork ? (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 2 }}>
                                <Typography variant="caption" color="text.secondary">- Праздники</Typography>
                                <Typography variant="caption">{data.bonusDetails.holidayWork.toLocaleString()} тг</Typography>
                            </Box>
                        ) : null}
                    </Box>

                    <Divider />

                    {/* Deductions */}
                    <Box>
                        <Typography variant="subtitle2" color="error.main" gutterBottom>
                            Удержания
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Аванс</Typography>
                            <Typography variant="body2">-{data.advance.toLocaleString()} тг</Typography>
                        </Box>
                        
                        <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, bgcolor: 'rgba(211, 47, 47, 0.05)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2" fontWeight="bold">Вычеты / Штрафы (автоматические)</Typography>
                                <Typography variant="body2" fontWeight="bold" color="error.main">-{data.penalties.toLocaleString()} тг</Typography>
                            </Box>
                            
                            {data.latePenalties ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                                    <Typography variant="caption" color="text.secondary">• Опоздания</Typography>
                                    <Typography variant="caption">-{data.latePenalties.toLocaleString()} тг</Typography>
                                </Box>
                            ) : null}

                            {data.absencePenalties ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                                    <Typography variant="caption" color="text.secondary">• Пропуски</Typography>
                                    <Typography variant="caption">-{data.absencePenalties.toLocaleString()} тг</Typography>
                                </Box>
                            ) : null}

                            {data.missingChildAttendancePenalties ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                                    <Typography variant="caption" color="text.secondary">• Пропуск отметки детей</Typography>
                                    <Typography variant="caption">-{data.missingChildAttendancePenalties.toLocaleString()} тг</Typography>
                                </Box>
                            ) : null}

                            {data.userFines ? (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', pl: 1 }}>
                                    <Typography variant="caption" color="text.secondary">• Админ. штрафы</Typography>
                                    <Typography variant="caption">-{data.userFines.toLocaleString()} тг</Typography>
                                </Box>
                            ) : null}
                        </Box>

                        {data.deductions ? (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2">Корректировки (ручные вычеты)</Typography>
                                <Typography variant="body2">-{data.deductions.toLocaleString()} тг</Typography>
                            </Box>
                        ) : null}
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2">Долг с прошлого месяца</Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color={data.carryOverDebt ? "error.main" : "text.secondary"}>
                                    {data.carryOverDebt ? `-${data.carryOverDebt.toLocaleString()}` : "0"} тг
                                </Typography>
                                {!!data.carryOverDebt && onUpdate && (
                                    <IconButton 
                                        size="small" 
                                        color="error" 
                                        onClick={handleResetDebt}
                                        disabled={loading}
                                        title="Обнулить долг"
                                    >
                                        <RestartAltIcon fontSize="small" />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                p: 1.25,
                                bgcolor: 'grey.50',
                                flexWrap: 'wrap'
                            }}
                        >
                            <Button
                                onClick={() => setAttendanceExpanded((prev) => !prev)}
                                startIcon={attendanceExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                sx={{ textTransform: 'none', fontWeight: 700 }}
                            >
                                Отметки прихода и ухода
                            </Button>
                            <ToggleButtonGroup
                                size="small"
                                exclusive
                                value={attendanceView}
                                onChange={(_, value) => value && setAttendanceView(value)}
                                disabled={!attendanceExpanded}
                            >
                                <ToggleButton value="table" aria-label="Таблица">
                                    <TableRowsIcon fontSize="small" />
                                </ToggleButton>
                                <ToggleButton value="calendar" aria-label="Мини-календарь">
                                    <CalendarMonthIcon fontSize="small" />
                                </ToggleButton>
                            </ToggleButtonGroup>
                        </Box>

                        <Collapse in={attendanceExpanded}>
                            <Box sx={{ p: 1.5 }}>
                                {attendanceLoading ? (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                        <CircularProgress size={24} />
                                    </Box>
                                ) : attendanceError ? (
                                    <Typography variant="body2" color="error.main">
                                        {attendanceError}
                                    </Typography>
                                ) : sortedAttendanceRecords.length === 0 ? (
                                    <Typography variant="body2" color="text.secondary">
                                        За выбранный месяц отметки прихода и ухода не найдены.
                                    </Typography>
                                ) : attendanceView === 'table' ? (
                                    <Box sx={{ overflowX: 'auto' }}>
                                        <Table size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Дата</TableCell>
                                                    <TableCell>Приход</TableCell>
                                                    <TableCell>Уход</TableCell>
                                                    <TableCell>Отклонения</TableCell>
                                                    <TableCell>Статус</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {sortedAttendanceRecords.map((record) => {
                                                    const status = resolveAttendanceStatus(record);
                                                    const deviations = [
                                                        record.lateMinutes ? `опоздание ${Math.round(record.lateMinutes)} мин` : '',
                                                        record.earlyLeaveMinutes ? `ранний уход ${Math.round(record.earlyLeaveMinutes)} мин` : '',
                                                    ].filter(Boolean).join(', ') || '—';

                                                    return (
                                                        <TableRow key={record._id}>
                                                            <TableCell>{record.date ? moment(record.date).format('DD.MM.YYYY') : '—'}</TableCell>
                                                            <TableCell>{formatTime(record.actualStart)}</TableCell>
                                                            <TableCell>{formatTime(record.actualEnd)}</TableCell>
                                                            <TableCell>{deviations}</TableCell>
                                                            <TableCell>{renderStatusChip(status)}</TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75, mb: 0.75 }}>
                                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day) => (
                                                <Typography key={day} variant="caption" color="text.secondary" textAlign="center" fontWeight={700}>
                                                    {day}
                                                </Typography>
                                            ))}
                                        </Box>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.75 }}>
                                            {calendarCells.map((cell, index) => {
                                                if (!cell.dateKey) {
                                                    return <Box key={`empty-${index}`} sx={{ minHeight: 54 }} />;
                                                }

                                                const status = resolveAttendanceStatus(cell.record);
                                                const meta = ATTENDANCE_STATUS_META[status];
                                                const hasRecord = !!cell.record;

                                                return (
                                                    <Box
                                                        key={cell.dateKey}
                                                        sx={{
                                                            minHeight: 54,
                                                            p: 0.75,
                                                            borderRadius: 1,
                                                            border: '1px solid',
                                                            borderColor: meta.border,
                                                            bgcolor: hasRecord ? meta.bg : 'transparent',
                                                            color: hasRecord ? meta.color : 'text.disabled',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <Typography variant="caption" fontWeight={800}>
                                                            {cell.day}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontSize: '0.65rem', lineHeight: 1.15 }}>
                                                            {cell.record?.actualStart ? formatTime(cell.record.actualStart) : '—'}
                                                            {cell.record?.actualEnd ? ` / ${formatTime(cell.record.actualEnd)}` : ''}
                                                        </Typography>
                                                    </Box>
                                                );
                                            })}
                                        </Box>
                                    </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mt: 1.5 }}>
                                    {(['completed', 'late', 'early_leave', 'in_progress', 'absent', 'missing'] as AttendanceStatus[]).map((status) => (
                                        <Box key={status}>{renderStatusChip(status)}</Box>
                                    ))}
                                </Box>
                            </Box>
                        </Collapse>
                    </Box>

                    <Divider sx={{ borderBottomWidth: 2 }} />

                    {/* Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="h6">Итого к выплате {showWithoutDebt ? "(без долга)" : ""}</Typography>
                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {displayTotal.toLocaleString()} тг
                        </Typography>
                    </Box>

                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
};

export default PayrollTotalDialog;
