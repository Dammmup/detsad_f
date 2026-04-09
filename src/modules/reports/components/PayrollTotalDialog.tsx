import React from 'react';
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
    useTheme,
    useMediaQuery,
    Switch,
    FormControlLabel,
    IconButton,
} from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RestartAltIcon from '@mui/icons-material/RestartAlt';

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
        carryOverDebt?: number;
    } | null;
    onUpdate?: (id: string, updates: any) => Promise<void>;
}

const PayrollTotalDialog: React.FC<Props> = ({ open, onClose, data, onUpdate }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [loading, setLoading] = React.useState(false);
    const [showWithoutDebt, setShowWithoutDebt] = React.useState(false); // Локальный режим просмотра без долга

    if (!data) return null;

    const isShiftBased = data.baseSalaryType === 'shift';
    
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
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
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
