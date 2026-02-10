import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Chip,
    Divider,
    IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import CloseIcon from '@mui/icons-material/Close';
import { getDailyMenus, DailyMenu as DailyMenuType, Meal } from '../services/dailyMenu';
import { Dish } from '../services/dishes';

interface MenuItem {
    _id: string;
    name: string;
    category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    ingredients: Array<{
        productName: string;
        quantity: number;
        unit: string;
    }>;
}

const MenuCalendarPage: React.FC = () => {
    const [currentDate, setCurrentDate] = useState<Date>(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [dailyMenus, setDailyMenus] = useState<DailyMenuType[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch menus for the current month
    useEffect(() => {
        const fetchMenus = async () => {
            setLoading(true);
            try {
                // Calculate start and end dates for the current month
                const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                const menus = await getDailyMenus({
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                });

                setDailyMenus(menus);
                setError(null);
            } catch (err) {
                setError('Ошибка загрузки меню: ' + (err as Error).message);
            } finally {
                setLoading(false);
            }
        };

        fetchMenus();
    }, [currentDate]);

    // Get menu for selected date
    const getMenuForDate = (date: Date): DailyMenuType | undefined => {
        const dateString = date.toISOString().split('T')[0]; // Convert to YYYY-MM-DD format
        return dailyMenus.find(menu => menu.date.startsWith(dateString));
    };

    // Generate calendar days for current month
    const generateCalendarDays = (): Date[] => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // First day of month
        const firstDay = new Date(year, month, 1);
        // Last day of month
        const lastDay = new Date(year, month + 1, 0);

        // Starting day (Sunday = 0, Monday = 1, etc.)
        const startDayIndex = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Days from previous month to show
        const prevMonthDays = startDayIndex;

        // Total days to show in calendar (6 weeks)
        const totalDays = 42; // 6 weeks * 7 days

        const days: Date[] = [];

        // Add days from previous month
        for (let i = prevMonthDays - 1; i >= 0; i--) {
            const date = new Date(year, month, 1 - i - 1);
            days.push(date);
        }

        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i);
            days.push(date);
        }

        // Add days from next month to fill up the grid
        const remainingDays = totalDays - days.length;
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i);
            days.push(date);
        }

        return days;
    };

    // Handle date selection
    const handleDateClick = (date: Date) => {
        // Only allow selecting dates from the current month
        if (date.getMonth() === currentDate.getMonth()) {
            setSelectedDate(date);
        }
    };

    // Close dialog
    const handleCloseDialog = () => {
        setSelectedDate(null);
    };

    // Format date for display
    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    // Get day of week name
    const getDayOfWeek = (date: Date): string => {
        const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return days[date.getDay()];
    };

    // Render meal chips
    const renderMealChips = (meals: MenuItem[], category: string) => {
        if (!meals || meals.length === 0) return null;

        return (
            <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                    {category}:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {meals.map((dish, idx) => (
                        <Chip
                            key={idx}
                            label={dish.name}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                    ))}
                </Box>
            </Box>
        );
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

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                {loading ? (
                    <Typography>Загрузка...</Typography>
                ) : (
                    <Paper elevation={3}>
                        <Grid container spacing={0} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                            {/* Day headers */}
                            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((day, index) => (
                                <Grid item xs={12 / 7} key={`header-${index}`}>
                                    <Box
                                        sx={{
                                            p: 1.5,
                                            textAlign: 'center',
                                            backgroundColor: '#f5f5f5',
                                            borderBottom: '1px solid #e0e0e0',
                                            borderRight: index < 6 ? '1px solid #e0e0e0' : 'none',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {day}
                                    </Box>
                                </Grid>
                            ))}

                            {/* Calendar days */}
                            {calendarDays.map((date, index) => {
                                const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                                const hasMenu = !!getMenuForDate(date);
                                const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                                // Get the menu for this date to show abbreviated version
                                const dateMenu = getMenuForDate(date);

                                return (
                                    <Grid item xs={12 / 7} key={`day-${index}`}>
                                        <Box
                                            sx={{
                                                minHeight: 100,
                                                p: 1,
                                                borderRight: index % 7 !== 6 ? '1px solid #e0e0e0' : 'none',
                                                borderBottom: '1px solid #e0e0e0',
                                                backgroundColor: isCurrentMonth
                                                    ? (isSelected
                                                        ? '#e3f2fd'
                                                        : hasMenu
                                                            ? '#f0f8ff'
                                                            : 'inherit')
                                                    : '#fafafa',
                                                cursor: isCurrentMonth ? 'pointer' : 'default',
                                                '&:hover': {
                                                    backgroundColor: isCurrentMonth && !isSelected ? '#f0f8ff' : 'inherit'
                                                }
                                            }}
                                            onClick={() => isCurrentMonth && handleDateClick(date)}
                                        >
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    mb: 0.5
                                                }}
                                            >
                                                <Typography
                                                    variant="body2"
                                                    sx={{
                                                        fontWeight: isCurrentMonth ? 'normal' : 'light',
                                                        color: isCurrentMonth ? 'inherit' : 'text.disabled'
                                                    }}
                                                >
                                                    {date.getDate()}
                                                </Typography>
                                                {hasMenu && (
                                                    <Box
                                                        sx={{
                                                            width: 8,
                                                            height: 8,
                                                            borderRadius: '50%',
                                                            backgroundColor: 'primary.main',
                                                            ml: 0.5
                                                        }}
                                                    />
                                                )}
                                            </Box>

                                            {/* Show abbreviated menu for the day */}
                                            {isCurrentMonth && hasMenu && dateMenu && (
                                                <>
                                                    {dateMenu.meals?.breakfast?.dishes && dateMenu.meals.breakfast.dishes.length > 0 && (
                                                        <Typography variant="caption" noWrap>
                                                            🥣 {dateMenu.meals.breakfast.dishes[0]?.name || ''}
                                                        </Typography>
                                                    )}
                                                    {dateMenu.meals?.lunch?.dishes && dateMenu.meals.lunch.dishes.length > 0 && (
                                                        <Typography variant="caption" noWrap>
                                                            🍲 {dateMenu.meals.lunch.dishes[0]?.name || ''}
                                                        </Typography>
                                                    )}
                                                    {dateMenu.meals?.snack?.dishes && dateMenu.meals.snack.dishes.length > 0 && (
                                                        <Typography variant="caption" noWrap>
                                                            🍰 {dateMenu.meals.snack.dishes[0]?.name || ''}
                                                        </Typography>
                                                    )}
                                                    {dateMenu.meals?.dinner?.dishes && dateMenu.meals.dinner.dishes.length > 0 && (
                                                        <Typography variant="caption" noWrap>
                                                            🥗 {dateMenu.meals.dinner.dishes[0]?.name || ''}
                                                        </Typography>
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

                {/* Menu detail dialog */}
                {selectedDate && (
                    <Dialog
                        open={!!selectedDate}
                        onClose={handleCloseDialog}
                        maxWidth="md"
                        fullWidth
                    >
                        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Меню на {selectedDate.toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                weekday: 'long'
                            })}
                            <IconButton onClick={handleCloseDialog}>
                                <CloseIcon />
                            </IconButton>
                        </DialogTitle>
                        <DialogContent dividers>
                            {selectedMenu ? (
                                <Box>
                                    <Typography variant="h6" gutterBottom>
                                        Блюда на {selectedDate.toLocaleDateString('ru-RU')}
                                    </Typography>

                                    <Divider sx={{ my: 2 }} />

                                    {/* Breakfast */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            🥣 Завтрак
                                        </Typography>
                                        {selectedMenu.meals?.breakfast?.dishes && selectedMenu.meals.breakfast.dishes.length > 0 ? (
                                            <Box>
                                                {selectedMenu.meals.breakfast.dishes.map((dish, idx) => (
                                                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                                                        <Typography variant="subtitle1"><strong>{dish.name}</strong></Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {dish.ingredients.map((ing: any) =>
                                                                `${ing.productName} - ${ing.quantity}${ing.unit}`
                                                            ).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">Нет блюд</Typography>
                                        )}
                                    </Box>

                                    {/* Lunch */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            🍲 Обед
                                        </Typography>
                                        {selectedMenu.meals?.lunch?.dishes && selectedMenu.meals.lunch.dishes.length > 0 ? (
                                            <Box>
                                                {selectedMenu.meals.lunch.dishes.map((dish, idx) => (
                                                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                                                        <Typography variant="subtitle1"><strong>{dish.name}</strong></Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {dish.ingredients.map((ing: any) =>
                                                                `${ing.productName} - ${ing.quantity}${ing.unit}`
                                                            ).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">Нет блюд</Typography>
                                        )}
                                    </Box>

                                    {/* Snack */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            🍰 Полдник
                                        </Typography>
                                        {selectedMenu.meals?.snack?.dishes && selectedMenu.meals.snack.dishes.length > 0 ? (
                                            <Box>
                                                {selectedMenu.meals.snack.dishes.map((dish, idx) => (
                                                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                                                        <Typography variant="subtitle1"><strong>{dish.name}</strong></Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {dish.ingredients.map((ing: any) =>
                                                                `${ing.productName} - ${ing.quantity}${ing.unit}`
                                                            ).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">Нет блюд</Typography>
                                        )}
                                    </Box>

                                    {/* Dinner */}
                                    <Box sx={{ mb: 3 }}>
                                        <Typography variant="h6" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                                            🥗 Ужин
                                        </Typography>
                                        {selectedMenu.meals?.dinner?.dishes && selectedMenu.meals.dinner.dishes.length > 0 ? (
                                            <Box>
                                                {selectedMenu.meals.dinner.dishes.map((dish, idx) => (
                                                    <Box key={idx} sx={{ mb: 2, pl: 2 }}>
                                                        <Typography variant="subtitle1"><strong>{dish.name}</strong></Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {dish.ingredients.map((ing: any) =>
                                                                `${ing.productName} - ${ing.quantity}${ing.unit}`
                                                            ).join(', ')}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                            </Box>
                                        ) : (
                                            <Typography color="text.secondary">Нет блюд</Typography>
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 2 }} />

                                    <Typography variant="body2" color="text.secondary">
                                        Детей: {selectedMenu.totalChildCount}
                                    </Typography>

                                    {selectedMenu.notes && (
                                        <Box sx={{ mt: 2 }}>
                                            <Typography variant="body2"><strong>Примечания:</strong> {selectedMenu.notes}</Typography>
                                        </Box>
                                    )}
                                </Box>
                            ) : (
                                <Typography>Меню на выбранную дату отсутствует</Typography>
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={handleCloseDialog}>Закрыть</Button>
                        </DialogActions>
                    </Dialog>
                )}
            </Box>
        </LocalizationProvider>
    );
};

export default MenuCalendarPage;