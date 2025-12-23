import React, { useState, useEffect } from 'react';
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
import { toast } from 'react-toastify';
import { getDishes, Dish } from '../../services/dishes';
import {
    WeeklyMenuTemplate, getWeeklyMenuTemplates, createWeeklyMenuTemplate,
    deleteWeeklyMenuTemplate, getWeeklyMenuTemplateById, addDishToTemplateDay,
    removeDishFromTemplateDay, applyTemplateToWeek, applyTemplateToMonth,
    calculateRequiredProducts, WEEKDAYS, WEEKDAY_NAMES, Weekday, MealType,
    RequiredProduct
} from '../../services/weeklyMenuTemplate';
import { getMealTypeName } from '../../services/dailyMenu';

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'snack', 'dinner'];

const WeeklyMenuTab: React.FC = () => {
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

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await getWeeklyMenuTemplates();
            setTemplates(data);
        } catch (error) {
            toast.error('Ошибка загрузки шаблонов');
        } finally {
            setLoading(false);
        }
    };

    const loadDishes = async () => {
        try {
            const data = await getDishes({ isActive: true });
            setDishes(data);
        } catch (error) {
            console.error('Error loading dishes:', error);
        }
    };

    useEffect(() => {
        loadTemplates();
        loadDishes();
    }, []);

    const handleSelectTemplate = async (templateId: string) => {
        try {
            const data = await getWeeklyMenuTemplateById(templateId);
            setSelectedTemplate(data);
        } catch (error) {
            toast.error('Ошибка загрузки шаблона');
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim()) return;
        try {
            await createWeeklyMenuTemplate({ name: newTemplateName, defaultChildCount: 30 });
            toast.success('Шаблон создан');
            setCreateDialogOpen(false);
            setNewTemplateName('');
            loadTemplates();
        } catch (error) {
            toast.error('Ошибка создания шаблона');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!window.confirm('Удалить шаблон?')) return;
        try {
            await deleteWeeklyMenuTemplate(id);
            toast.success('Шаблон удален');
            if (selectedTemplate?._id === id) setSelectedTemplate(null);
            loadTemplates();
        } catch (error) {
            toast.error('Ошибка удаления');
        }
    };

    const handleAddDish = async (dishId: string) => {
        if (!selectedTemplate) return;
        try {
            await addDishToTemplateDay(selectedTemplate._id!, selectedDay, selectedMealType, dishId);
            handleSelectTemplate(selectedTemplate._id!);
            setAddDishDialogOpen(false);
            toast.success('Блюдо добавлено');
        } catch (error) {
            toast.error('Ошибка добавления блюда');
        }
    };

    const handleRemoveDish = async (day: Weekday, mealType: MealType, dishId: string) => {
        if (!selectedTemplate) return;
        try {
            await removeDishFromTemplateDay(selectedTemplate._id!, day, mealType, dishId);
            handleSelectTemplate(selectedTemplate._id!);
            toast.success('Блюдо удалено');
        } catch (error) {
            toast.error('Ошибка удаления блюда');
        }
    };

    const handleApplyTemplate = async () => {
        if (!selectedTemplate) return;
        try {
            setLoading(true);
            const result = applyType === 'week'
                ? await applyTemplateToWeek(selectedTemplate._id!, applyStartDate, applyChildCount)
                : await applyTemplateToMonth(selectedTemplate._id!, applyStartDate, applyChildCount);

            toast.success(result.message);
            if (result.shortages.length > 0) {
                setRequiredProducts(result.shortages);
                setShowRequirements(true);
            }
            setApplyDialogOpen(false);
        } catch (error: any) {
            toast.error(error.message || 'Ошибка применения шаблона');
        } finally {
            setLoading(false);
        }
    };

    const handleCalculateRequirements = async () => {
        if (!selectedTemplate) return;
        try {
            const days = applyType === 'week' ? 7 : 30;
            const data = await calculateRequiredProducts(selectedTemplate._id!, days, applyChildCount);
            setRequiredProducts(data);
            setShowRequirements(true);
        } catch (error) {
            toast.error('Ошибка расчёта');
        }
    };

    return (
        <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Шаблон</InputLabel>
                    <Select
                        value={selectedTemplate?._id || ''}
                        label="Шаблон"
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                    >
                        {templates.map((t) => (
                            <MenuItem key={t._id} value={t._id}>{t.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateDialogOpen(true)}>
                    Новый шаблон
                </Button>
                {selectedTemplate && (
                    <>
                        <Button variant="outlined" startIcon={<PlayArrowIcon />} onClick={() => setApplyDialogOpen(true)}>
                            Применить
                        </Button>
                        <IconButton color="error" onClick={() => handleDeleteTemplate(selectedTemplate._id!)}>
                            <DeleteIcon />
                        </IconButton>
                    </>
                )}
            </Box>

            {showRequirements && requiredProducts.length > 0 && (
                <Alert severity={requiredProducts.some(p => !p.sufficient) ? 'warning' : 'success'} sx={{ mb: 2 }} onClose={() => setShowRequirements(false)}>
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
                        <Accordion key={day}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography fontWeight={500}>{WEEKDAY_NAMES[day]}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Grid container spacing={2}>
                                    {MEAL_TYPES.map((mealType) => {
                                        const meals = (selectedTemplate.days[day] as any)?.[mealType] || [];
                                        return (
                                            <Grid item xs={12} sm={6} md={3} key={mealType}>
                                                <Paper variant="outlined" sx={{ p: 1 }}>
                                                    <Typography variant="subtitle2" color="primary">{getMealTypeName(mealType)}</Typography>
                                                    <List dense>
                                                        {meals.map((dish: any) => (
                                                            <ListItem key={dish._id || dish}>
                                                                <ListItemText primary={dish.name || 'Блюдо'} />
                                                                <ListItemSecondaryAction>
                                                                    <IconButton size="small" onClick={() => handleRemoveDish(day, mealType, dish._id || dish)}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </ListItemSecondaryAction>
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                    <Button size="small" startIcon={<AddIcon />} onClick={() => {
                                                        setSelectedDay(day);
                                                        setSelectedMealType(mealType);
                                                        setAddDishDialogOpen(true);
                                                    }}>Добавить</Button>
                                                </Paper>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Box>
            )}

            {/* Create Template Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
                <DialogTitle>Новый шаблон</DialogTitle>
                <DialogContent>
                    <TextField fullWidth label="Название" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} sx={{ mt: 1 }} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreateTemplate}>Создать</Button>
                </DialogActions>
            </Dialog>

            {/* Apply Template Dialog */}
            <Dialog open={applyDialogOpen} onClose={() => setApplyDialogOpen(false)}>
                <DialogTitle>Применить шаблон</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField fullWidth type="date" label="Дата начала" value={applyStartDate} onChange={(e) => setApplyStartDate(e.target.value)} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="number" label="Кол-во детей" value={applyChildCount} onChange={(e) => setApplyChildCount(Number(e.target.value))} />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Период</InputLabel>
                                <Select value={applyType} label="Период" onChange={(e) => setApplyType(e.target.value as any)}>
                                    <MenuItem value="week">Неделя</MenuItem>
                                    <MenuItem value="month">Месяц</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <Button sx={{ mt: 2 }} onClick={handleCalculateRequirements}>Рассчитать продукты</Button>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setApplyDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleApplyTemplate} disabled={loading}>
                        {loading ? <CircularProgress size={20} /> : 'Применить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Add Dish Dialog */}
            <Dialog open={addDishDialogOpen} onClose={() => setAddDishDialogOpen(false)}>
                <DialogTitle>Добавить блюдо - {WEEKDAY_NAMES[selectedDay]}, {getMealTypeName(selectedMealType)}</DialogTitle>
                <DialogContent>
                    <List>
                        {dishes.filter(d => d.category === selectedMealType).map((dish) => (
                            <ListItem key={dish._id} button onClick={() => handleAddDish(dish._id!)}>
                                <ListItemText primary={dish.name} />
                            </ListItem>
                        ))}
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
