import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, FormControl,
    InputLabel, Select, MenuItem, Grid, Chip, Alert, CircularProgress,
    Accordion, AccordionSummary, AccordionDetails, List, ListItem,
    ListItemText, ListItemSecondaryAction
} from '@mui/material';
import {
    Add as AddIcon, Delete as DeleteIcon, ExpandMore as ExpandMoreIcon,
    PlayArrow as PlayArrowIcon, CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { showSnackbar } from '../../../shared/components/Snackbar';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';
import { getDishes, Dish } from '../services/dishes';
import { useAuth } from '../../../app/context/AuthContext';
import {
    WeeklyMenuTemplate, getWeeklyMenuTemplates, createWeeklyMenuTemplate,
    deleteWeeklyMenuTemplate, getWeeklyMenuTemplateById, addDishToTemplateDay,
    removeDishFromTemplateDay, applyTemplateToWeek, applyTemplateToMonth,
    calculateRequiredProducts, WEEKDAYS, WEEKDAY_NAMES, Weekday, MealType,
    RequiredProduct
} from '../services/weeklyMenuTemplate';
import { getMealTypeName } from '../services/dailyMenu';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

// Мемоизированный компонент дня в шаблоне
const DayAccordion = React.memo(({
    day,
    dayName,
    dayData,
    onRemoveDish,
    onAddDishClick,
    canManage
}: {
    day: Weekday;
    dayName: string;
    dayData: any;
    onRemoveDish: (day: Weekday, mealType: MealType, dishId: string) => void;
    onAddDishClick: (day: Weekday, mealType: MealType) => void;
    canManage: boolean;
}) => (
    <Accordion>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={500}>{dayName}</Typography>
        </AccordionSummary>
        <AccordionDetails>
            <Grid container spacing={2}>
                {MEAL_TYPES.map((mealType) => {
                    const meals = dayData?.[mealType] || [];
                    return (
                        <Grid item xs={12} sm={6} md={3} key={mealType}>
                            <Paper variant="outlined" sx={{ p: 1 }}>
                                <Typography variant="subtitle2" color="primary">{getMealTypeName(mealType)}</Typography>
                                <List dense>
                                    {meals.map((dish: any) => (
                                        <ListItem key={dish._id || dish}>
                                            <ListItemText primary={dish.name || 'Блюдо'} />
                                            {canManage && (
                                                <ListItemSecondaryAction>
                                                    <IconButton size="small" onClick={() => onRemoveDish(day, mealType, dish._id || dish)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </ListItemSecondaryAction>
                                            )}
                                        </ListItem>
                                    ))}
                                </List>
                                {canManage && (
                                    <Button size="small" startIcon={<AddIcon />} onClick={() => onAddDishClick(day, mealType)}>
                                        Добавить
                                    </Button>
                                )}
                            </Paper>
                        </Grid>
                    );
                })}
            </Grid>
        </AccordionDetails>
    </Accordion>
));

const WeeklyMenuTab: React.FC = () => {
    const { user: currentUser } = useAuth();
    const role = currentUser?.role;
    const canViewWeeklyMenu =
        role === 'admin' || role === 'manager' || role === 'director' || role === 'cook' || role === 'doctor' || role === 'nurse';
    const canManageTemplates = role === 'admin' || role === 'manager';
    const canCalculateRequirements = role === 'admin' || role === 'manager' || role === 'director' || role === 'cook';

    const [templates, setTemplates] = useState<WeeklyMenuTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<WeeklyMenuTemplate | null>(null);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [loading, setLoading] = useState(false);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [applyDialogOpen, setApplyDialogOpen] = useState(false);
    const [addDishDialogOpen, setAddDishDialogOpen] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [selectedDay, setSelectedDay] = useState<Weekday>('monday');
    const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
    const [applyStartDate, setApplyStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [applyChildCount, setApplyChildCount] = useState(30);
    const [applyType, setApplyType] = useState<'week' | 'month'>('week');
    const [requiredProducts, setRequiredProducts] = useState<RequiredProduct[]>([]);
    const [showRequirements, setShowRequirements] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [applyError, setApplyError] = useState<string | null>(null);
    const [addDishError, setAddDishError] = useState<string | null>(null);
    const [dishSearchTerm, setDishSearchTerm] = useState('');
    const [debouncedDishSearch, setDebouncedDishSearch] = useState('');
    const dishSearchRef = React.useRef<any>(null);

    const onDishSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDishSearchTerm(value);
        if (dishSearchRef.current) clearTimeout(dishSearchRef.current);
        dishSearchRef.current = setTimeout(() => {
            setDebouncedDishSearch(value);
        }, 300);
    }, []);

    const filteredDishesForAdd = useMemo(() => {
        return dishes.filter(d => {
            const matchesCategory = d.category === selectedMealType || ['drink', 'salad', 'baking'].includes(d.subcategory || '');
            const matchesSearch = !debouncedDishSearch || d.name.toLowerCase().includes(debouncedDishSearch.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [dishes, selectedMealType, debouncedDishSearch]);

    const loadTemplates = useCallback(async () => {
        if (!canViewWeeklyMenu) {
            setTemplates([]);
            return;
        }
        try {
            setLoading(true);
            const data = await getWeeklyMenuTemplates();
            setTemplates(data);
        } catch (error) {
            showSnackbar({ message: 'Ошибка загрузки шаблонов', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDishes = useCallback(async () => {
        if (!canViewWeeklyMenu) {
            setDishes([]);
            return;
        }
        try {
            const data = await getDishes({ isActive: true });
            setDishes(data);
        } catch (error) {
            console.error('Error loading dishes:', error);
        }
    }, [canViewWeeklyMenu]);

    useEffect(() => {
        loadTemplates();
        loadDishes();
    }, [loadTemplates, loadDishes]);

    const handleSelectTemplate = useCallback(async (templateId: string) => {
        try {
            const data = await getWeeklyMenuTemplateById(templateId);
            setSelectedTemplate(data);
        } catch (error) {
            showSnackbar({ message: 'Ошибка загрузки шаблона', type: 'error' });
        }
    }, [canViewWeeklyMenu]);

    const handleCreateTemplate = useCallback(async () => {
        if (!canManageTemplates) {
            showSnackbar({ message: 'Недостаточно прав для создания шаблона', type: 'error' });
            return;
        }
        if (!newTemplateName.trim()) return;
        try {
            await createWeeklyMenuTemplate({ name: newTemplateName, defaultChildCount: 30 });
            showSnackbar({ message: 'Шаблон создан', type: 'success' });
            setCreateDialogOpen(false);
            setCreateError(null);
            setNewTemplateName('');
            loadTemplates();
        } catch (error) {
            setCreateError(getErrorMessage(error));
        }
    }, [newTemplateName, loadTemplates, canManageTemplates]);

    const handleDeleteTemplate = useCallback(async (id: string) => {
        if (!canManageTemplates) {
            showSnackbar({ message: 'Недостаточно прав для удаления шаблона', type: 'error' });
            return;
        }
        if (!window.confirm('Удалить шаблон?')) return;
        try {
            await deleteWeeklyMenuTemplate(id);
            showSnackbar({ message: 'Шаблон удален', type: 'success' });
            setSelectedTemplate(prev => prev?._id === id ? null : prev);
            loadTemplates();
        } catch (error) {
            showSnackbar({ message: 'Ошибка удаления', type: 'error' });
        }
    }, [loadTemplates, canManageTemplates]);

    const handleAddDish = useCallback(async (dishId: string) => {
        if (!canManageTemplates) {
            showSnackbar({ message: 'Недостаточно прав для изменения шаблона', type: 'error' });
            return;
        }
        if (!selectedTemplate) return;
        try {
            await addDishToTemplateDay(selectedTemplate._id!, selectedDay, selectedMealType, dishId);
            handleSelectTemplate(selectedTemplate._id!);
            setAddDishDialogOpen(false);
            setAddDishError(null);
            showSnackbar({ message: 'Блюдо добавлено', type: 'success' });
        } catch (error) {
            setAddDishError(getErrorMessage(error));
        }
    }, [selectedTemplate, selectedDay, selectedMealType, handleSelectTemplate, canManageTemplates]);

    const handleRemoveDish = useCallback(async (day: Weekday, mealType: MealType, dishId: string) => {
        if (!canManageTemplates) {
            showSnackbar({ message: 'Недостаточно прав для изменения шаблона', type: 'error' });
            return;
        }
        if (!selectedTemplate) return;
        try {
            await removeDishFromTemplateDay(selectedTemplate._id!, day, mealType, dishId);
            handleSelectTemplate(selectedTemplate._id!);
            showSnackbar({ message: 'Блюдо удалено', type: 'success' });
        } catch (error) {
            showSnackbar({ message: 'Ошибка удаления блюда', type: 'error' });
        }
    }, [selectedTemplate, handleSelectTemplate, canManageTemplates]);

    const handleApplyTemplate = useCallback(async () => {
        if (!canManageTemplates) {
            setApplyError('Недостаточно прав для применения шаблона');
            return;
        }
        if (!selectedTemplate) return;
        try {
            setLoading(true);
            const result = applyType === 'week'
                ? await applyTemplateToWeek(selectedTemplate._id!, applyStartDate, applyChildCount)
                : await applyTemplateToMonth(selectedTemplate._id!, applyStartDate, applyChildCount);

            showSnackbar({ message: result.message, type: 'success' });
            if (result.shortages.length > 0) {
                setRequiredProducts(result.shortages);
                setShowRequirements(true);
            }
            setApplyDialogOpen(false);
            setApplyError(null);
        } catch (error: any) {
            setApplyError(getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    }, [selectedTemplate, applyType, applyStartDate, applyChildCount, canManageTemplates]);

    const handleOpenCreateDialog = useCallback(() => setCreateDialogOpen(true), []);
    const handleCloseCreateDialog = useCallback(() => setCreateDialogOpen(false), []);
    const handleOpenApplyDialog = useCallback(() => setApplyDialogOpen(true), []);
    const handleCloseApplyDialog = useCallback(() => setApplyDialogOpen(false), []);
    const handleCloseAddDishDialog = useCallback(() => setAddDishDialogOpen(false), []);
    const handleCloseRequirements = useCallback(() => setShowRequirements(false), []);

    const handleNewTemplateNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setNewTemplateName(e.target.value);
    }, []);

    const handleApplyStartDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setApplyStartDate(e.target.value);
    }, []);

    const handleApplyChildCountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setApplyChildCount(Number(e.target.value));
    }, []);

    const handleApplyTypeChange = useCallback((e: any) => {
        setApplyType(e.target.value as any);
    }, []);

    const handleCalculateRequirements = useCallback(async () => {
        if (!canCalculateRequirements) {
            showSnackbar({ message: 'Недостаточно прав для расчета потребности', type: 'error' });
            return;
        }
        if (!selectedTemplate) return;
        try {
            const days = applyType === 'week' ? 7 : 30;
            const data = await calculateRequiredProducts(selectedTemplate._id!, days, applyChildCount);
            setRequiredProducts(data);
            setShowRequirements(true);
        } catch (error) {
            showSnackbar({ message: 'Ошибка расчёта', type: 'error' });
        }
    }, [selectedTemplate, applyType, applyChildCount, canCalculateRequirements]);

    const handleDayAddDishClick = useCallback((day: Weekday, mealType: MealType) => {
        setSelectedDay(day);
        setSelectedMealType(mealType);
        setAddDishDialogOpen(true);
    }, []);

    const handleTemplateSelectChange = useCallback((e: any) => handleSelectTemplate(e.target.value as string), [handleSelectTemplate]);
    const handleDeleteTemplateClick = useCallback(() => selectedTemplate && handleDeleteTemplate(selectedTemplate._id!), [selectedTemplate, handleDeleteTemplate]);
    const handleAddDishToTemplate = useCallback((dishId: string) => handleAddDish(dishId), [handleAddDish]);

    return (
        <Box sx={{ px: 3 }}>
            {!canViewWeeklyMenu && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Недостаточно прав для просмотра шаблонов меню.
                </Alert>
            )}
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Шаблон</InputLabel>
                    <Select
                        value={selectedTemplate?._id || ''}
                        label="Шаблон"
                        onChange={handleTemplateSelectChange}
                    >
                        {templates.map((t) => (
                            <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {canManageTemplates && (
                    <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
                        Новый шаблон
                    </Button>
                )}
                {selectedTemplate && (
                    <>
                        {canManageTemplates && (
                            <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={handleOpenApplyDialog}>
                                Применить
                            </Button>
                        )}
                        {canManageTemplates && (
                            <IconButton color="error" onClick={handleDeleteTemplateClick}>
                                <DeleteIcon />
                            </IconButton>
                        )}
                    </>
                )}
            </Box>

            {showRequirements && requiredProducts.length > 0 && (
                <Alert 
                    severity={requiredProducts.some(p => !p.sufficient) ? 'warning' : 'success'} 
                    sx={{ mb: 2 }} 
                    onClose={handleCloseRequirements}
                >
                    <Typography variant="subtitle2">Требуемые продукты:</Typography>
                    {requiredProducts.filter(p => !p.sufficient).map((p) => (
                        <Typography key={p.productId} variant="body2" color="error">
                            ⚠️ {p.name}: нужно {p.required.toFixed(1)} {p.unit}, в наличии {p.available.toFixed(1)}, не хватает {p.shortage.toFixed(1)}
                        </Typography>
                    ))}
                </Alert>
            )}

            {selectedTemplate && (
                <Box>
                    {WEEKDAYS.map((day) => (
                        <DayAccordion
                            key={day}
                            day={day}
                            dayName={WEEKDAY_NAMES[day]}
                            dayData={selectedTemplate!.days[day]}
                            onRemoveDish={handleRemoveDish}
                            onAddDishClick={handleDayAddDishClick}
                            canManage={canManageTemplates}
                        />
                    ))}
                </Box>
            )}

            {/* Create Template Dialog */}
            <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog}>
                <DialogTitle>Новый шаблон</DialogTitle>
                <DialogContent>
                    <FormErrorAlert error={createError} onClose={() => setCreateError(null)} />
                    <TextField fullWidth label="Название" value={newTemplateName} onChange={handleNewTemplateNameChange} sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseCreateDialog}>Отмена</Button>
                    {canManageTemplates && (
                        <Button variant="contained" onClick={handleCreateTemplate}>Создать</Button>
                    )}
                </DialogActions>
            </Dialog>
 
            {/* Apply Template Dialog */}
            <Dialog open={applyDialogOpen} onClose={handleCloseApplyDialog}>
                <DialogTitle>Применить шаблон</DialogTitle>
                <DialogContent>
                    <FormErrorAlert error={applyError} onClose={() => setApplyError(null)} />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField fullWidth type="date" label="Дата начала" value={applyStartDate} onChange={handleApplyStartDateChange} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="number" label="Кол-во детей" value={applyChildCount} onChange={handleApplyChildCountChange} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Период</InputLabel>
                                <Select value={applyType} label="Период" onChange={handleApplyTypeChange}>
                                    <MenuItem value="week">Неделя</MenuItem>
                                    <MenuItem value="month">Месяц</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    {canCalculateRequirements && (
                        <Button sx={{ mt: 2 }} onClick={handleCalculateRequirements}>Рассчитать продукты</Button>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseApplyDialog}>Отмена</Button>
                    {canManageTemplates && (
                        <Button variant="contained" onClick={handleApplyTemplate} disabled={loading}>
                            {loading ? <CircularProgress size={20} /> : 'Применить'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
 
            {/* Add Dish Dialog */}
            <Dialog open={addDishDialogOpen} onClose={handleCloseAddDishDialog} fullWidth maxWidth="sm">
                <DialogTitle>Добавить блюдо - {WEEKDAY_NAMES[selectedDay]}, {getMealTypeName(selectedMealType)}</DialogTitle>
                <DialogContent>
                    <FormErrorAlert error={addDishError} onClose={() => setAddDishError(null)} />
                    <TextField
                        fullWidth
                        size="small"
                        placeholder="Поиск блюда..."
                        value={dishSearchTerm}
                        onChange={onDishSearchChange}
                        sx={{ my: 1 }}
                    />
                    <List sx={{ maxHeight: 400, overflow: 'auto' }}>
                        {filteredDishesForAdd.map((dish) => (
                            <ListItem key={dish._id || dish.id} button onClick={() => handleAddDish(dish._id! || dish.id!)}>
                                <ListItemText primary={dish.name} secondary={dish.subcategory} />
                            </ListItem>
                        ))}
                        {filteredDishesForAdd.length === 0 && (
                            <Typography sx={{ py: 2, textAlign: 'center' }} color="text.secondary">
                                Блюда не найдены
                            </Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDishDialogOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default WeeklyMenuTab;
