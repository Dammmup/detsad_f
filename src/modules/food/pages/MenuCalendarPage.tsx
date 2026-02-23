import React, { useState, useEffect } from 'react';
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
import { getDailyMenus, DailyMenu as DailyMenuType, Meal, deleteDailyMenu } from '../services/dailyMenu';
import {
    WeeklyMenuTemplate, getWeeklyMenuTemplates, applyTemplateToWeek, applyTemplateToMonth
} from '../services/weeklyMenuTemplate';
import { Dish } from '../services/dishes';
import { toast } from 'react-toastify';

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

const MenuCalendarPage: React.FC = () => {
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
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
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

    // Get menu for selected date
    const getMenuForDate = (date: Date): DailyMenuType | undefined => {
        const dateString = date.toISOString().split('T')[0];
        return dailyMenus.find(menu => menu.date.startsWith(dateString));
    };

    // Close dialog
    const handleCloseDialog = () => {
        setSelectedDate(null);
        setSelectedTemplateId('');
    };

    // Handle delete menu
    const handleDeleteMenu = async () => {
        if (!selectedMenu || !selectedMenu._id) return;

        if (!window.confirm('Вы уверены, что хотите удалить меню на этот день?')) {
            return;
        }

        try {
            await deleteDailyMenu(selectedMenu._id);
            toast.success('Меню успешно удалено');
            handleCloseDialog();
            fetchMenus();
        } catch (err) {
            toast.error('Ошибка при удалении меню: ' + (err as Error).message);
        }
    };

    // Handle apply template
    const handleApplyTemplate = async () => {
        if (!selectedTemplateId || !selectedDate) return;

        setApplying(true);
        try {
            const startDateStr = selectedDate.toISOString().split('T')[0];
            const result = applyType === 'week'
                ? await applyTemplateToWeek(selectedTemplateId, startDateStr, applyChildCount)
                : await applyTemplateToMonth(selectedTemplateId, startDateStr, applyChildCount);

            toast.success(result.message);
            handleCloseDialog();
            fetchMenus();
        } catch (err) {
            toast.error('Ошибка при применении шаблона: ' + (err as Error).message);
        } finally {
            setApplying(false);
        }
    };

    // Generate calendar days
    const generateCalendarDays = (): Date[] => {
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
    };

    const handleDateClick = (date: Date) => {
        if (date.getMonth() === currentDate.getMonth()) {
            setSelectedDate(date);
        }
    };

    const calendarDays = generateCalendarDays();
    const selectedMenu = selectedDate ? getMenuForDate(selectedDate) : null;

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
                                <Button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                                >
                                    {'<'} Пред.
                                </Button>
                                <Typography variant="h6">
                                    {currentDate.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                                </Typography>
                                <Button
                                    onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                                >
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
                                const dateMenu = getMenuForDate(date);
                                const hasMenu = !!dateMenu;
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                                return (
                                    <Grid item xs={12 / 7} key={`day-${index}`}>
                                        <Box
                                            sx={{
                                                minHeight: 100, p: 1, borderRight: index % 7 !== 6 ? '1px solid #e0e0e0' : 'none',
                                                borderBottom: '1px solid #e0e0e0',
                                                backgroundColor: isCurrentMonth ? (isSelected ? '#e3f2fd' : hasMenu ? '#f0f8ff' : 'inherit') : '#fafafa',
                                                cursor: isCurrentMonth ? 'pointer' : 'default',
                                                '&:hover': { backgroundColor: isCurrentMonth && !isSelected ? '#f0f8ff' : 'inherit' }
                                            }}
                                            onClick={() => isCurrentMonth && handleDateClick(date)}
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
                        {selectedMenu ? (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography variant="h6">Детали меню</Typography>
                                    <Button variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={handleDeleteMenu}>Удалить меню на день</Button>
                                </Box>
                                <Divider sx={{ my: 2 }} />
                                {(['breakfast', 'lunch', 'snack', 'dinner'] as const).map(mealType => {
                                    const meal = selectedMenu.meals?.[mealType];
                                    const icons = { breakfast: '🥣 Завтрак', lunch: '🍲 Обед', snack: '🍰 Полдник', dinner: '🥗 Ужин' };
                                    return (
                                        <Box key={mealType} sx={{ mb: 3 }}>
                                            <Typography variant="h6" color="primary">{icons[mealType]}</Typography>
                                            {meal?.dishes?.length > 0 ? (
                                                meal.dishes.map((dish: any, idx: number) => (
                                                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
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
                                            <Select value={selectedTemplateId} label="Выберите шаблон" onChange={(e: any) => setSelectedTemplateId(e.target.value)}>
                                                {templates.map(t => <MuiMenuItem key={t._id} value={t._id}>{t.name}</MuiMenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth type="number" label="Количество детей" value={applyChildCount} onChange={(e: any) => setApplyChildCount(Number(e.target.value))} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Период</InputLabel>
                                            <Select value={applyType} label="Период" onChange={(e: any) => setApplyType(e.target.value as any)}>
                                                <MuiMenuItem value="week">Неделя</MuiMenuItem>
                                                <MuiMenuItem value="month">Месяц</MuiMenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>
                                <Button
                                    variant="contained" fullWidth size="large" startIcon={<PlayArrowIcon />} sx={{ mt: 3 }}
                                    onClick={handleApplyTemplate} disabled={!selectedTemplateId || applying}
                                >
                                    {applying ? <CircularProgress size={24} /> : 'Применить шаблон'}
                                </Button>
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