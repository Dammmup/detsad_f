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
    } | null;
}

const PayrollTotalDialog: React.FC<Props> = ({ open, onClose, data }) => {
    if (!data) return null;

    const isShiftBased = data.baseSalaryType === 'shift';

    // Calculate base part details
    // If shift based, baseSalary IS the rate.
    // If month based: Show formula: Base / Norm * Worked
    const baseDescription = isShiftBased
        ? `${data.workedShifts} смен * ${data.baseSalary.toLocaleString()} тг`
        : (typeof data.normDays === 'number' && data.normDays > 0)
            ? `${data.baseSalary.toLocaleString()} / ${data.normDays} дн. * ${data.workedDays} дн.`
            : `Оклад за месяц`;

    // Determine effective daily/shift rate for month-based if relevant, or just show accrued
    // For month based: accruals is calculated based on working days.
    // We can show: (Base / Norm) * Worked

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
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Норма дней (график):</Typography>
                                            <Typography variant="body2">{data.normDays} дн.</Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Ставка за день:</Typography>
                                            <Typography variant="body2">
                                                {Math.round(data.baseSalary / data.normDays).toLocaleString()} тг
                                                <Typography component="span" variant="caption" color="text.disabled" sx={{ ml: 1 }}>
                                                    ({data.baseSalary.toLocaleString()} / {data.normDays})
                                                </Typography>
                                            </Typography>
                                        </Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <Typography variant="body2" color="text.secondary">Отработано:</Typography>
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
