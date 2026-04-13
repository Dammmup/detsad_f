import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Paper, Typography, Grid, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, Alert, Chip, Divider, IconButton,
    FormControl, InputLabel, Select, MenuItem as MuiMenuItem, TextField, CircularProgress
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PrintIcon from '@mui/icons-material/Print';
import { getDailyMenus, DailyMenu as DailyMenuType, Meal, deleteDailyMenu } from '../services/dailyMenu';
import {
    WeeklyMenuTemplate, getWeeklyMenuTemplates, applyTemplateToWeek, applyTemplateToMonth
} from '../services/weeklyMenuTemplate';
import { Dish } from '../services/dishes';
import { showSnackbar } from '../../../shared/components/Snackbar';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';
import { format } from 'date-fns';
import { useAuth } from '../../../app/context/AuthContext';

interface IMenuItem {
    _id: string;
    name: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: Array<{
        productId?: {
            _id: string;
            name: string;
        };
        quantity: number;
        unit: string;
    }>;
}

// Мемоизированный компонент ячейки календаря
const CalendarDayCell = React.memo(({
    date,
    isCurrentMonth,
    dateMenu,
    isSelected,
    onClick
}: {
    date: Date;
    isCurrentMonth: boolean;
    dateMenu?: DailyMenuType;
    isSelected: boolean;
    onClick: (date: Date) => void;
}) => {
    const hasMenu = !!dateMenu;

    return (
        <Grid item xs={12 / 7}>
            <Box
                sx={{
                    minHeight: 100, p: 1, borderRight: '1px solid #e0e0e0',
                    borderBottom: '1px solid #e0e0e0',
                    backgroundColor: isCurrentMonth ? (isSelected ? '#e3f2fd' : hasMenu ? '#f0f8ff' : 'inherit') : '#fafafa',
                    cursor: isCurrentMonth ? 'pointer' : 'default',
                    '&:hover': { backgroundColor: isCurrentMonth && !isSelected ? '#f0f8ff' : 'inherit' }
                }}
                onClick={() => isCurrentMonth && onClick(date)}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                    <Typography variant="body2" sx={{
                        fontWeight: isCurrentMonth ? 'normal' : 'light',
                        color: isCurrentMonth ? 'inherit' : 'text.disabled'
                    }}>{date.getDate()}</Typography>
                    {hasMenu && <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'primary.main', ml: 0.5 }} />}
                </Box>

                {isCurrentMonth && hasMenu && dateMenu && (
                    <>
                        {dateMenu.meals?.breakfast?.dishes?.length > 0 && (
                            <Typography variant="caption" noWrap sx={{ display: 'block' }}>🥣 {dateMenu.meals.breakfast.dishes[0]?.name}</Typography>
                        )}
                        {dateMenu.meals?.lunch?.dishes?.length > 0 && (
                            <Typography variant="caption" noWrap sx={{ display: 'block' }}>🍲 {dateMenu.meals.lunch.dishes[0]?.name}</Typography>
                        )}
                        {dateMenu.meals?.snack?.dishes?.length > 0 && (
                            <Typography variant="caption" noWrap sx={{ display: 'block' }}>🍰 {dateMenu.meals.snack.dishes[0]?.name}</Typography>
                        )}
                        {dateMenu.meals?.dinner?.dishes?.length > 0 && (
                            <Typography variant="caption" noWrap sx={{ display: 'block' }}>🥗 {dateMenu.meals.dinner.dishes[0]?.name}</Typography>
                        )}
                    </>
                )}
            </Box>
        </Grid>
    );
});

const MenuCalendarPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const role = currentUser?.role;
    const isAdmin = role === 'admin';
    const isManager = role === 'manager';
    const canManageMenus = isAdmin || isManager;

    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dailyMenus, setDailyMenus] = useState<DailyMenuType[]>([]);
    const [templates, setTemplates] = useState<WeeklyMenuTemplate[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [applying, setApplying] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Form state for applying template
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
    const [applyChildCount, setApplyChildCount] = useState<number>(30);
    const [applyType, setApplyType] = useState<'week' | 'month'>('week');

    // Fetch menus for the current month
    const fetchMenus = async () => {
        setLoading(true);
        try {
            const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
            const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

            const menus = await getDailyMenus({
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd')
            });

            setDailyMenus(menus);
            setError(null);
        } catch (err) {
            setError('Ошибка загрузки меню: ' + (err as Error).message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch templates
    const fetchTemplates = async () => {
        try {
            const data = await getWeeklyMenuTemplates({ isActive: true });
            setTemplates(data);
        } catch (err) {
            console.error('Error fetching templates:', err);
        }
    };

    useEffect(() => {
        fetchMenus();
        fetchTemplates();
    }, [currentDate]);

    const handlePrevMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
    }, []);

    const handleNextMonth = useCallback(() => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
    }, []);

    // Index menus by date for O(1) lookup
    const indexedMenus = useMemo(() => {
        const index: Record<string, DailyMenuType> = {};
        dailyMenus.forEach(menu => {
            try {
                const dateKey = format(new Date(menu.date), 'yyyy-MM-dd');
                index[dateKey] = menu;
            } catch (e) {
                const dateKey = menu.date.split('T')[0];
                index[dateKey] = menu;
            }
        });
        return index;
    }, [dailyMenus]);

    // Get menu for selected date
    const getMenuForDate = useCallback((date: Date): DailyMenuType | undefined => {
        const dateString = format(date, 'yyyy-MM-dd');
        return indexedMenus[dateString];
    }, [indexedMenus]);

    // Close dialog
    const handleCloseDialog = useCallback(() => {
        setSelectedDate(null);
        setSelectedTemplateId('');
    }, []);

    const selectedMenu = useMemo(() => 
        selectedDate ? getMenuForDate(selectedDate) : null
    , [selectedDate, getMenuForDate]);

    // Handle delete menu
    const handleDeleteMenu = useCallback(async () => {
        if (!selectedMenu || !selectedMenu._id) return;
        if (!canManageMenus) {
            showSnackbar({ message: 'Недостаточно прав для удаления меню', type: 'error' });
            return;
        }

        if (!window.confirm('Вы уверены, что хотите удалить меню на этот день?')) {
            return;
        }

        try {
            await deleteDailyMenu(selectedMenu._id);
            showSnackbar({ message: 'Меню успешно удалено', type: 'success' });
            handleCloseDialog();
            fetchMenus();
        } catch (err) {
            showSnackbar({ message: 'Ошибка при удалении меню: ' + getErrorMessage(err), type: 'error' });
        }
    }, [selectedMenu, handleCloseDialog, fetchMenus, canManageMenus]);

    // Handle apply template
    const handleApplyTemplate = useCallback(async () => {
        if (!selectedTemplateId || !selectedDate) return;
        if (!canManageMenus) {
            setError('Недостаточно прав для применения шаблонов меню');
            return;
        }

        setApplying(true);
        try {
            const startDateStr = format(selectedDate, 'yyyy-MM-dd');
            const result = applyType === 'week'
                ? await applyTemplateToWeek(selectedTemplateId, startDateStr, applyChildCount)
                : await applyTemplateToMonth(selectedTemplateId, startDateStr, applyChildCount);

            showSnackbar({ message: result.message, type: 'success' });
            handleCloseDialog();
            fetchMenus();
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setApplying(false);
        }
    }, [selectedTemplateId, selectedDate, applyType, applyChildCount, handleCloseDialog, fetchMenus, canManageMenus]);

    const handleTemplateChange = useCallback((e: any) => setSelectedTemplateId(e.target.value), []);
    const handleChildCountChange = useCallback((e: any) => setApplyChildCount(Number(e.target.value)), []);
    const handleApplyTypeChange = useCallback((e: any) => setApplyType(e.target.value as any), []);

    // Print menu
    const handlePrintMenu = useCallback(() => {
        if (!selectedMenu || !selectedDate) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showSnackbar({ message: 'Разрешите всплывающие окна для работы печати', type: 'error' });
            return;
        }

        const dateStr = selectedDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' });
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <title>Меню на ${dateStr}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #333; }
                    h1 { text-align: center; color: #1976d2; margin-bottom: 30px; }
                    h2 { border-bottom: 2px solid #1976d2; padding-bottom: 5px; margin-top: 25px; color: #1976d2; font-size: 1.3em; }
                    .dish { margin-bottom: 12px; page-break-inside: avoid; }
                    .dish-name { font-weight: bold; font-size: 1.1em; }
                    .ingredients { color: #555; margin-left: 15px; margin-top: 4px; font-size: 0.9em; }
                    .meta { margin-top: 40px; font-style: italic; color: #666; border-top: 1px dashed #ccc; padding-top: 10px; }
                    @media print {
                        body { padding: 0; }
                    }
                </style>
            </head>
            <body>
                <h1>Меню на ${dateStr}</h1>
        `;

        const mealLabels = { breakfast: 'Завтрак', lunch: 'Обед', snack: 'Полдник', dinner: 'Ужин' };
        
        (['breakfast', 'lunch', 'snack', 'dinner'] as const).forEach(mealType => {
            const meal = selectedMenu.meals?.[mealType];
            if (meal && meal.dishes && meal.dishes.length > 0) {
                html += `<h2>${mealLabels[mealType]}</h2>`;
                meal.dishes.forEach((dish: any) => {
                    html += `<div class="dish"><div class="dish-name">${dish.name}</div>`;
                    if (dish.ingredients && dish.ingredients.length > 0) {
                        const ingStr = dish.ingredients.map((ing: any) => `${ing.productId?.name || 'Продукт'} — ${ing.quantity} ${ing.unit}`).join(', ');
                        html += `<div class="ingredients">${ingStr}</div>`;
                    }
                    html += `</div>`;
                });
            }
        });

        html += `
                <div class="meta">
                    <p>Количество порций (детей): ${selectedMenu.totalChildCount || 0}</p>
                    ${selectedMenu.notes ? `<p>Примечания: ${selectedMenu.notes}</p>` : ''}
                </div>
                <script>
                    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 300); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    }, [selectedMenu, selectedDate]);

    // Generate calendar days
    const calendarDays = useMemo((): Date[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayIndex = firstDay.getDay();
        const prevMonthDays = startDayIndex === 0 ? 6 : startDayIndex - 1;
        const totalDays = 42;
        const days: Date[] = [];

        for (let i = prevMonthDays - 1; i >= 0; i--) {
            days.push(new Date(year, month, 1 - i - 1));
        }
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }
        const remainingDays = totalDays - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            days.push(new Date(year, month + 1, i));
        }
        return days;
    }, [currentDate]);

    const handleDateClick = useCallback((date: Date) => {
        if (date.getMonth() === currentDate.getMonth()) {
            setSelectedDate(date);
        }
    }, [currentDate.getMonth()]);


    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ p: 3 }}>
                <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                    <Grid container alignItems="center" justifyContent="space-between" spacing={2}>
                        <Grid item>
                            <Typography variant="h4">Календарь меню</Typography>
                        </Grid>
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Button onClick={handlePrevMonth}>
                                    {'<'} Пред.
                                </Button>
                                <Typography variant="h6">
                                    {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <Button onClick={handleNextMonth}>
                                    След. {'>'}
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading ? (
                    <Typography>Загрузка...</Typography>
                ) : (
                    <Paper elevation={3}>
                        <Grid container spacing={0} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                                <Grid item xs={12 / 7} key={`header-${index}`}>
                                    <Box sx={{
                                        p: 1.5, textAlign: 'center', backgroundColor: '#f5f5f5',
                                        borderBottom: '1px solid #e0e0e0', borderRight: index < 6 ? '1px solid #e0e0e0' : 'none',
                                        fontWeight: 'bold'
                                    }}>{day}</Box>
                                </Grid>
                            ))}

                            {calendarDays.map((date, index) => {
                                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                const dateStr = format(date, 'yyyy-MM-dd');
                                const dateMenu = indexedMenus[dateStr];
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                                return (
                                    <CalendarDayCell
                                        key={dateStr}
                                        date={date}
                                        isCurrentMonth={isCurrentMonth}
                                        dateMenu={dateMenu}
                                        isSelected={!!isSelected}
                                        onClick={handleDateClick}
                                    />
                                );
                            })}
                        </Grid>
                    </Paper>
                )}

                <Dialog open={!!selectedDate} onClose={handleCloseDialog} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {selectedDate?.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
                        <IconButton onClick={handleCloseDialog}><CloseIcon /></IconButton>
                    </DialogTitle>
                    <DialogContent dividers>
                        <FormErrorAlert error={error} onClose={() => setError(null)} />
                        {selectedMenu ? (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Детали меню</Typography>
                                    <Box sx={{ display: 'flex', gap: 2 }}>
                                        <Button variant="outlined" color="primary" startIcon={<PrintIcon />} onClick={handlePrintMenu}>Печать</Button>
                                        {canManageMenus && (
                                            <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteMenu}>Удалить меню на день</Button>
                                        )}
                                    </Box>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => {
                                    const meal = selectedMenu.meals?.[mealType];
                                    const icons = { breakfast: '🥣 Завтрак', lunch: '🍲 Обед', snack: '🍰 Полдник', dinner: '🥗 Ужин' };
                                    return (
                                        <Box key={mealType} sx={{ mb: 3 }}>
                                            <Typography variant="h6" color="primary">{icons[mealType]}</Typography>
                                            {meal?.dishes?.length > 0 ? (
                                                meal.dishes.map((dish: any) => (
                                                    <Box key={dish._id || dish.id} sx={{ mb: 2, pl: 2 }}>
                                                        <Typography variant="subtitle1"><strong>{dish.name}</strong></Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {dish.ingredients.map((ing: any) => `${ing.productId?.name || 'Продукт'} - ${ing.quantity}${ing.unit}`).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                ))
                                            ) : <Typography color="text.secondary">Нет блюд</Typography>}
                                        </Box>
                                    );
                                })}
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="body2" color="text.secondary">Детей: {selectedMenu.totalChildCount}</Typography>
                                {selectedMenu.notes && <Box sx={{ mt: 2 }}><Typography variant="body2"><strong>Примечания:</strong> {selectedMenu.notes}</Typography></Box>}
                            </Box>
                        ) : (
                            <Box sx={{ py: 2 }}>
                                <Typography variant="h6" gutterBottom>Применить шаблон меню</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>На выбранную дату меню отсутствует. Вы можете применить существующий шаблон.</Typography>

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <FormControl fullWidth>
                                            <InputLabel>Выберите шаблон</InputLabel>
                                            <Select 
                                                value={selectedTemplateId} 
                                                label="Выберите шаблон" 
                                                onChange={handleTemplateChange}
                                            >
                                                {templates.map(t => <MuiMenuItem key={t._id} value={t._id}>{t.name}</MuiMenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            fullWidth 
                                            type="number" 
                                            label="Количество детей" 
                                            value={applyChildCount} 
                                            onChange={handleChildCountChange} 
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Период</InputLabel>
                                            <Select 
                                                value={applyType} 
                                                label="Период" 
                                                onChange={handleApplyTypeChange}
                                            >
                                                <MuiMenuItem value="week">Неделя</MuiMenuItem>
                                                <MuiMenuItem value="month">Месяц</MuiMenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                {!canManageMenus && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Недостаточно прав для применения шаблонов меню.
                                    </Alert>
                                )}
                                {canManageMenus && (
                                    <Button
                                        variant="contained" fullWidth size="large" startIcon={<PlayArrowIcon />} sx={{ mt: 3 }}
                                        onClick={handleApplyTemplate} disabled={!selectedTemplateId || applying}
                                    >
                                        {applying ? <CircularProgress size={24} /> : 'Применить шаблон'}
                                    </Button>
                                )}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions><Button onClick={handleCloseDialog}>Закрыть</Button></DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
};

export default MenuCalendarPage;
