import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, TextField, Grid, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Card, CardContent, CircularProgress, Chip
} from '@mui/material';
import { toast } from 'react-toastify';
import { getConsumptionReport, getSummaryReport, ConsumptionReportItem, SummaryReport } from '../services/productReports';

const CATEGORY_LABELS: Record<string, string> = {
    dairy: 'Молочные', meat: 'Мясо', vegetables: 'Овощи', fruits: 'Фрукты',
    grains: 'Крупы', bakery: 'Хлебобулочные', other: 'Прочее'
};

const ReportsTab: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [consumption, setConsumption] = useState<ConsumptionReportItem[]>([]);
    const [summary, setSummary] = useState<SummaryReport | null>(null);

    const loadReports = async () => {
        try {
            setLoading(true);
            const [consumptionData, summaryData] = await Promise.all([
                getConsumptionReport(startDate, endDate),
                getSummaryReport(startDate, endDate)
            ]);
            setConsumption(consumptionData);
            setSummary(summaryData);
        } catch (error) {
            toast.error('Ошибка загрузки отчётов');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadReports(); }, [startDate, endDate]);

    return (
        <Box sx={{ px: 3 }}>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField fullWidth type="date" label="С" value={startDate} onChange={(e) => setStartDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <TextField fullWidth type="date" label="По" value={endDate} onChange={(e) => setEndDate(e.target.value)} InputLabelProps={{ shrink: true }} size="small" />
                </Grid>
            </Grid>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
                <>
                    {summary && (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6} sm={3}>
                                <Card><CardContent>
                                    <Typography color="text.secondary" variant="body2">Всего продуктов</Typography>
                                    <Typography variant="h5">{summary.stockStatus.totalProducts}</Typography>
                                </CardContent></Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: summary.stockStatus.lowStock > 0 ? '#fff3e0' : undefined }}><CardContent>
                                    <Typography color="text.secondary" variant="body2">Низкий запас</Typography>
                                    <Typography variant="h5" color={summary.stockStatus.lowStock > 0 ? 'warning.main' : undefined}>
                                        {summary.stockStatus.lowStock}
                                    </Typography>
                                </CardContent></Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: summary.stockStatus.expiringSoon > 0 ? '#fff8e1' : undefined }}><CardContent>
                                    <Typography color="text.secondary" variant="body2">Скоро истечёт</Typography>
                                    <Typography variant="h5" color={summary.stockStatus.expiringSoon > 0 ? 'warning.main' : undefined}>
                                        {summary.stockStatus.expiringSoon}
                                    </Typography>
                                </CardContent></Card>
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <Card sx={{ bgcolor: summary.stockStatus.expired > 0 ? '#ffebee' : undefined }}><CardContent>
                                    <Typography color="text.secondary" variant="body2">Просрочено</Typography>
                                    <Typography variant="h5" color={summary.stockStatus.expired > 0 ? 'error.main' : undefined}>
                                        {summary.stockStatus.expired}
                                    </Typography>
                                </CardContent></Card>
                            </Grid>
                        </Grid>
                    )}

                    <Typography variant="h6" sx={{ mb: 2 }}>Расход продуктов за период</Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                    <TableCell><strong>Продукт</strong></TableCell>
                                    <TableCell><strong>Категория</strong></TableCell>
                                    <TableCell align="right"><strong>Всего</strong></TableCell>
                                    <TableCell align="right"><strong>Завтрак</strong></TableCell>
                                    <TableCell align="right"><strong>Обед</strong></TableCell>
                                    <TableCell align="right"><strong>Полдник</strong></TableCell>
                                    <TableCell align="right"><strong>Ужин</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {consumption.map((item) => (
                                    <TableRow key={item.productId}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell><Chip size="small" label={CATEGORY_LABELS[item.category] || item.category} /></TableCell>
                                        <TableCell align="right"><strong>{item.totalConsumed.toFixed(2)} {item.unit}</strong></TableCell>
                                        <TableCell align="right">{item.byMealType.breakfast.toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.byMealType.lunch.toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.byMealType.snack.toFixed(2)}</TableCell>
                                        <TableCell align="right">{item.byMealType.dinner.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                                {consumption.length === 0 && (
                                    <TableRow><TableCell colSpan={7} align="center">Нет данных за выбранный период</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default ReportsTab;
