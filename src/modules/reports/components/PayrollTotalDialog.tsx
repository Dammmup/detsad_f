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
    Grid
} from '@mui/material';

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
    } | null;
    onUpdate?: (id: string, updates: any) => Promise<void>;
}

const PayrollTotalDialog: React.FC<Props> = ({ open, onClose, data, onUpdate }) => {
    const [loading, setLoading] = React.useState(false);
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
            setLoading(true); // Keep loading until closed or data refreshed
            setLoading(false);
        }
    };


    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Детализация: {data.staffName}</Typography>
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
                                        <Box sx={{ mb: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                                            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom color="primary">
                                                ВАРИАНТЫ НОРМЫ (ДЛЯ РАСЧЕТА СТАВКИ)
                                            </Typography>
                                            
                                            <Grid container spacing={2}>
                                                <Grid item xs={6}>
                                                    <Box 
                                                        onClick={() => handleVariantClick('shifts')}
                                                        sx={{ 
                                                            p: 1, 
                                                            borderRadius: 1, 
                                                            bgcolor: data.normType === 'shifts' ? 'action.selected' : 'transparent',
                                                            cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: data.normType === 'shifts' ? 'primary.main' : 'transparent',
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="text.secondary" display="block">По графику смен</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{data.normShifts || 0} дн.</Typography>
                                                        <Typography variant="caption" color="text.disabled">
                                                            Дн. ставка: {data.normShifts ? Math.round(data.baseSalary / data.normShifts).toLocaleString() : 0} тг
                                                        </Typography>
                                                        {data.normType === 'shifts' && (
                                                            <Typography variant="caption" sx={{ color: 'success.main', display: 'block', mt: 0.5, fontWeight: 'bold' }}>
                                                                ✓ Выбрано
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={6} sx={{ borderLeft: '1px solid', borderColor: 'divider' }}>
                                                    <Box 
                                                        onClick={() => handleVariantClick('production')}
                                                        sx={{ 
                                                            p: 1, 
                                                            borderRadius: 1, 
                                                            bgcolor: data.normType === 'production' || !data.normType ? 'action.selected' : 'transparent',
                                                            cursor: 'pointer',
                                                            border: '2px solid',
                                                            borderColor: data.normType === 'production' || !data.normType ? 'primary.main' : 'transparent',
                                                            '&:hover': { bgcolor: 'action.hover' },
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        <Typography variant="caption" color="text.secondary" display="block">Произв. календарь</Typography>
                                                        <Typography variant="body2" fontWeight="bold">{data.normProduction || 0} дн.</Typography>
                                                        <Typography variant="caption" color="text.disabled">
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
                                                Расчет: {Math.round(data.baseSalary / data.normDays).toLocaleString()} * {data.workedDays}
                                            </Typography>
                                            <Typography variant="body1" fontWeight="bold" color="primary">
                                                {data.accruals.toLocaleString()} тг
                                            </Typography>
                                        </Box>
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2">Вычеты/Штрафы</Typography>
                            <Typography variant="body2">-{data.penalties.toLocaleString()} тг</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ borderBottomWidth: 2 }} />

                    {/* Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="h6">Итого к выплате</Typography>
                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                            {data.total.toLocaleString()} тг
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
