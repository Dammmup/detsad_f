import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    Button,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Alert,
    Card,
    CardContent,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tooltip,
    CircularProgress,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
    Refresh as RefreshIcon,
    ExpandMore as ExpandMoreIcon,
    Restaurant as RestaurantIcon,
    PlayArrow as PlayArrowIcon,
    CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';

import {
    Product,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductAlerts,
    ProductAlerts
} from '../../services/products';
import {
    Dish,
    getDishes,
    createDish,
    updateDish,
    deleteDish
} from '../../services/dishes';
import {
    DailyMenu,
    MealType,
    getTodayMenu,
    createDailyMenu,
    serveMeal,
    addDishToMeal,
    removeDishFromMeal,
    getMealTypeName
} from '../../services/dailyMenu';

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function TabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;
    return (
        <div role="tabpanel" hidden={value !== index} {...other}>
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const CATEGORIES = [
    { value: 'dairy', label: 'Молочные продукты' },
    { value: 'meat', label: 'Мясо' },
    { value: 'vegetables', label: 'Овощи' },
    { value: 'fruits', label: 'Фрукты' },
    { value: 'grains', label: 'Крупы' },
    { value: 'bakery', label: 'Хлебобулочные' },
    { value: 'other', label: 'Прочее' }
];

const UNITS = ['кг', 'г', 'л', 'мл', 'шт', 'упак'];

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const ProductAccountingPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);

    // Products state
    const [products, setProducts] = useState<Product[]>([]);
    const [alerts, setAlerts] = useState<ProductAlerts | null>(null);
    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState<Partial<Product>>({
        name: '',
        category: '',
        unit: 'кг',
        supplier: '',
        price: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 1000,
        storageConditions: '',
        childCount: 0,
        purchaseDays: 0,
        status: 'active'
    });

    // Dishes state
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [dishDialogOpen, setDishDialogOpen] = useState(false);
    const [editingDish, setEditingDish] = useState<Dish | null>(null);
    const [dishForm, setDishForm] = useState<Partial<Dish>>({
        name: '',
        category: 'breakfast',
        ingredients: [],
        servingsCount: 1,
        isActive: true
    });

    // Menu state
    const [todayMenu, setTodayMenu] = useState<DailyMenu | null>(null);
    const [servingMeal, setServingMeal] = useState<MealType | null>(null);
    const [childCountInput, setChildCountInput] = useState<number>(30);
    const [addDishDialogOpen, setAddDishDialogOpen] = useState(false);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');

    // Load data
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, alertsData] = await Promise.all([
                getProducts(),
                getProductAlerts()
            ]);
            setProducts(productsData);
            setAlerts(alertsData);
        } catch (error) {
            console.error('Error loading products:', error);
            toast.error('Ошибка загрузки продуктов');
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDishes = useCallback(async () => {
        try {
            const data = await getDishes();
            setDishes(data);
        } catch (error) {
            console.error('Error loading dishes:', error);
            toast.error('Ошибка загрузки блюд');
        }
    }, []);

    const loadTodayMenu = useCallback(async () => {
        try {
            const data = await getTodayMenu();
            setTodayMenu(data);
        } catch (error) {
            console.error('Error loading today menu:', error);
        }
    }, []);

    useEffect(() => {
        loadProducts();
        loadDishes();
        loadTodayMenu();
    }, [loadProducts, loadDishes, loadTodayMenu]);

    // Product handlers
    const handleOpenProductDialog = (product?: Product) => {
        if (product) {
            setEditingProduct(product);
            setProductForm(product);
        } else {
            setEditingProduct(null);
            setProductForm({
                name: '',
                category: '',
                unit: 'кг',
                supplier: '',
                price: 0,
                stockQuantity: 0,
                minStockLevel: 0,
                maxStockLevel: 1000,
                storageConditions: '',
                childCount: 0,
                purchaseDays: 0,
                status: 'active'
            });
        }
        setProductDialogOpen(true);
    };

    const handleSaveProduct = async () => {
        try {
            if (editingProduct) {
                await updateProduct(editingProduct._id || editingProduct.id || '', productForm);
                toast.success('Продукт обновлен');
            } else {
                await createProduct(productForm);
                toast.success('Продукт создан');
            }
            setProductDialogOpen(false);
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сохранения продукта');
        }
    };

    const handleDeleteProduct = async (product: Product) => {
        if (!window.confirm(`Удалить продукт "${product.name}"?`)) return;
        try {
            await deleteProduct(product._id || product.id || '');
            toast.success('Продукт удален');
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления продукта');
        }
    };

    // Dish handlers
    const handleOpenDishDialog = (dish?: Dish) => {
        if (dish) {
            setEditingDish(dish);
            setDishForm(dish);
        } else {
            setEditingDish(null);
            setDishForm({
                name: '',
                category: 'breakfast',
                ingredients: [],
                servingsCount: 1,
                isActive: true
            });
        }
        setDishDialogOpen(true);
    };

    const handleSaveDish = async () => {
        try {
            if (editingDish) {
                await updateDish(editingDish._id || editingDish.id || '', dishForm);
                toast.success('Блюдо обновлено');
            } else {
                await createDish(dishForm);
                toast.success('Блюдо создано');
            }
            setDishDialogOpen(false);
            loadDishes();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка сохранения блюда');
        }
    };

    const handleDeleteDish = async (dish: Dish) => {
        if (!window.confirm(`Удалить блюдо "${dish.name}"?`)) return;
        try {
            await deleteDish(dish._id || dish.id || '');
            toast.success('Блюдо удалено');
            loadDishes();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления блюда');
        }
    };

    // Menu handlers
    const handleCreateTodayMenu = async () => {
        try {
            await createDailyMenu({
                date: new Date().toISOString(),
                totalChildCount: childCountInput
            });
            toast.success('Меню на сегодня создано');
            loadTodayMenu();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка создания меню');
        }
    };

    const handleServeMeal = async (mealType: MealType) => {
        if (!todayMenu) return;
        try {
            setServingMeal(mealType);
            await serveMeal(todayMenu._id || todayMenu.id || '', mealType, childCountInput);
            toast.success(`${getMealTypeName(mealType)} подан! Продукты списаны.`);
            loadTodayMenu();
            loadProducts();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка подачи приёма пищи');
        } finally {
            setServingMeal(null);
        }
    };

    const handleAddDishToMeal = async (dishId: string) => {
        if (!todayMenu) return;
        try {
            await addDishToMeal(todayMenu._id || todayMenu.id || '', selectedMealType, dishId);
            toast.success('Блюдо добавлено');
            setAddDishDialogOpen(false);
            loadTodayMenu();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка добавления блюда');
        }
    };

    const handleRemoveDishFromMeal = async (mealType: MealType, dishId: string) => {
        if (!todayMenu) return;
        try {
            await removeDishFromMeal(todayMenu._id || todayMenu.id || '', mealType, dishId);
            toast.success('Блюдо удалено');
            loadTodayMenu();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка удаления блюда');
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('ru-RU');
    };

    const isExpiringSoon = (product: Product) => {
        if (!product.expirationDate) return false;
        const expDate = new Date(product.expirationDate);
        const daysUntilExpiry = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
    };

    const isExpired = (product: Product) => {
        if (!product.expirationDate) return false;
        return new Date(product.expirationDate) < new Date();
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    🍎 Учет продуктов
                </Typography>
                <Button startIcon={<RefreshIcon />} onClick={() => { loadProducts(); loadDishes(); loadTodayMenu(); }}>
                    Обновить
                </Button>
            </Box>

            {/* Alerts Section */}
            {alerts && alerts.totalAlerts > 0 && (
                <Box sx={{ mb: 3 }}>
                    {alerts.expired.length > 0 && (
                        <Alert severity="error" sx={{ mb: 1 }} icon={<ErrorIcon />}>
                            <strong>Срок годности истёк:</strong> {alerts.expired.map(p => p.name).join(', ')}
                        </Alert>
                    )}
                    {alerts.expiring.length > 0 && (
                        <Alert severity="warning" sx={{ mb: 1 }} icon={<WarningIcon />}>
                            <strong>Скоро истечёт срок:</strong> {alerts.expiring.map(p => `${p.name} (${formatDate(p.expirationDate)})`).join(', ')}
                        </Alert>
                    )}
                    {alerts.lowStock.length > 0 && (
                        <Alert severity="info" sx={{ mb: 1 }}>
                            <strong>Низкий запас:</strong> {alerts.lowStock.map(p => p.name).join(', ')}
                        </Alert>
                    )}
                </Box>
            )}

            <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: '#f5f5f5' }}
                >
                    <Tab label="📦 Продукты" />
                    <Tab label="🍽️ Блюда" />
                    <Tab label="📋 Меню дня" />
                </Tabs>

                {/* Products Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenProductDialog()}>
                                Добавить продукт
                            </Button>
                        </Box>

                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <TableContainer>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                            <TableCell><strong>Название</strong></TableCell>
                                            <TableCell><strong>Категория</strong></TableCell>
                                            <TableCell align="right"><strong>Запас</strong></TableCell>
                                            <TableCell align="right"><strong>Цена</strong></TableCell>
                                            <TableCell><strong>Срок годности</strong></TableCell>
                                            <TableCell><strong>На детей</strong></TableCell>
                                            <TableCell><strong>На дней</strong></TableCell>
                                            <TableCell align="center"><strong>Действия</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {products.map((product) => (
                                            <TableRow
                                                key={product._id || product.id}
                                                sx={{
                                                    bgcolor: isExpired(product) ? '#ffebee' : isExpiringSoon(product) ? '#fff8e1' : 'inherit',
                                                    '&:hover': { bgcolor: '#f5f5f5' }
                                                }}
                                            >
                                                <TableCell>
                                                    {product.name}
                                                    {isExpired(product) && <Chip size="small" label="Просрочен" color="error" sx={{ ml: 1 }} />}
                                                    {isExpiringSoon(product) && <Chip size="small" label="Скоро" color="warning" sx={{ ml: 1 }} />}
                                                </TableCell>
                                                <TableCell>{CATEGORIES.find(c => c.value === product.category)?.label || product.category}</TableCell>
                                                <TableCell align="right">{product.stockQuantity} {product.unit}</TableCell>
                                                <TableCell align="right">{product.price?.toLocaleString()} ₸</TableCell>
                                                <TableCell>{formatDate(product.expirationDate)}</TableCell>
                                                <TableCell>{product.childCount || '-'}</TableCell>
                                                <TableCell>{product.purchaseDays || '-'}</TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => handleOpenProductDialog(product)}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" color="error" onClick={() => handleDeleteProduct(product)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </Box>
                </TabPanel>

                {/* Dishes Tab */}
                <TabPanel value={tabValue} index={1}>
                    <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDishDialog()}>
                                Добавить блюдо
                            </Button>
                        </Box>

                        <Grid container spacing={2}>
                            {dishes.map((dish) => (
                                <Grid item xs={12} sm={6} md={4} key={dish._id || dish.id}>
                                    <Card sx={{ height: '100%' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography variant="h6" sx={{ fontSize: '1rem' }}>{dish.name}</Typography>
                                                <Chip size="small" label={getMealTypeName(dish.category as MealType)} color="primary" variant="outlined" />
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                Порций: {dish.servingsCount}
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Ингредиентов: {dish.ingredients?.length || 0}
                                            </Typography>
                                            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                                                <IconButton size="small" onClick={() => handleOpenDishDialog(dish)}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                                <IconButton size="small" color="error" onClick={() => handleDeleteDish(dish)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </TabPanel>

                {/* Menu Tab */}
                <TabPanel value={tabValue} index={2}>
                    <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <TextField
                                label="Количество детей"
                                type="number"
                                size="small"
                                value={childCountInput}
                                onChange={(e) => setChildCountInput(parseInt(e.target.value) || 0)}
                                sx={{ width: 150 }}
                            />
                            {!todayMenu && (
                                <Button variant="contained" onClick={handleCreateTodayMenu}>
                                    Создать меню на сегодня
                                </Button>
                            )}
                        </Box>

                        {todayMenu ? (
                            <Box>
                                <Typography variant="h6" sx={{ mb: 2 }}>
                                    Меню на {formatDate(todayMenu.date)}
                                </Typography>

                                {MEAL_TYPES.map((mealType) => {
                                    const meal = todayMenu.meals[mealType];
                                    const isServed = !!meal?.servedAt;

                                    return (
                                        <Accordion key={mealType} defaultExpanded>
                                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                    <RestaurantIcon color={isServed ? 'success' : 'action'} />
                                                    <Typography sx={{ fontWeight: 500 }}>{getMealTypeName(mealType)}</Typography>
                                                    {isServed && (
                                                        <Chip
                                                            size="small"
                                                            icon={<CheckCircleIcon />}
                                                            label={`Подан (${meal.childCount} детей)`}
                                                            color="success"
                                                        />
                                                    )}
                                                    <Box sx={{ flexGrow: 1 }} />
                                                    {!isServed && (
                                                        <Button
                                                            size="small"
                                                            variant="contained"
                                                            color="primary"
                                                            startIcon={servingMeal === mealType ? <CircularProgress size={16} /> : <PlayArrowIcon />}
                                                            onClick={(e) => { e.stopPropagation(); handleServeMeal(mealType); }}
                                                            disabled={servingMeal !== null || (meal?.dishes?.length || 0) === 0}
                                                        >
                                                            Подать
                                                        </Button>
                                                    )}
                                                </Box>
                                            </AccordionSummary>
                                            <AccordionDetails>
                                                <List dense>
                                                    {meal?.dishes?.map((dish: any, idx: number) => (
                                                        <ListItem key={idx}>
                                                            <ListItemText primary={dish.name || 'Блюдо'} />
                                                            {!isServed && (
                                                                <ListItemSecondaryAction>
                                                                    <IconButton
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={() => handleRemoveDishFromMeal(mealType, dish._id || dish.id)}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </ListItemSecondaryAction>
                                                            )}
                                                        </ListItem>
                                                    ))}
                                                </List>
                                                {!isServed && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<AddIcon />}
                                                        onClick={() => { setSelectedMealType(mealType); setAddDishDialogOpen(true); }}
                                                    >
                                                        Добавить блюдо
                                                    </Button>
                                                )}
                                            </AccordionDetails>
                                        </Accordion>
                                    );
                                })}
                            </Box>
                        ) : (
                            <Typography color="text.secondary">Меню на сегодня не создано</Typography>
                        )}
                    </Box>
                </TabPanel>
            </Paper>

            {/* Product Dialog */}
            <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Название"
                                value={productForm.name || ''}
                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Категория</InputLabel>
                                <Select
                                    value={productForm.category || ''}
                                    label="Категория"
                                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                                >
                                    {CATEGORIES.map((cat) => (
                                        <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Ед. изм.</InputLabel>
                                <Select
                                    value={productForm.unit || 'кг'}
                                    label="Ед. изм."
                                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                                >
                                    {UNITS.map((unit) => (
                                        <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Цена (₸)"
                                type="number"
                                value={productForm.price || 0}
                                onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Количество на складе"
                                type="number"
                                value={productForm.stockQuantity || 0}
                                onChange={(e) => setProductForm({ ...productForm, stockQuantity: parseFloat(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Поставщик"
                                value={productForm.supplier || ''}
                                onChange={(e) => setProductForm({ ...productForm, supplier: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Срок годности"
                                type="date"
                                InputLabelProps={{ shrink: true }}
                                value={productForm.expirationDate ? new Date(productForm.expirationDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => setProductForm({ ...productForm, expirationDate: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="На сколько детей"
                                type="number"
                                value={productForm.childCount || 0}
                                onChange={(e) => setProductForm({ ...productForm, childCount: parseInt(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="На сколько дней"
                                type="number"
                                value={productForm.purchaseDays || 0}
                                onChange={(e) => setProductForm({ ...productForm, purchaseDays: parseInt(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Условия хранения"
                                value={productForm.storageConditions || ''}
                                onChange={(e) => setProductForm({ ...productForm, storageConditions: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setProductDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleSaveProduct}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Dish Dialog */}
            <Dialog open={dishDialogOpen} onClose={() => setDishDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingDish ? 'Редактировать блюдо' : 'Добавить блюдо'}</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Название блюда"
                                value={dishForm.name || ''}
                                onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <FormControl fullWidth>
                                <InputLabel>Категория</InputLabel>
                                <Select
                                    value={dishForm.category || 'breakfast'}
                                    label="Категория"
                                    onChange={(e) => setDishForm({ ...dishForm, category: e.target.value as Dish['category'] })}
                                >
                                    <MenuItem value="breakfast">Завтрак</MenuItem>
                                    <MenuItem value="lunch">Обед</MenuItem>
                                    <MenuItem value="dinner">Ужин</MenuItem>
                                    <MenuItem value="snack">Полдник</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Количество порций"
                                type="number"
                                value={dishForm.servingsCount || 1}
                                onChange={(e) => setDishForm({ ...dishForm, servingsCount: parseInt(e.target.value) || 1 })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="Описание"
                                value={dishForm.description || ''}
                                onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDishDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleSaveDish}>Сохранить</Button>
                </DialogActions>
            </Dialog>

            {/* Add Dish to Meal Dialog */}
            <Dialog open={addDishDialogOpen} onClose={() => setAddDishDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить блюдо в {getMealTypeName(selectedMealType)}</DialogTitle>
                <DialogContent>
                    <List>
                        {dishes
                            .filter((d) => d.category === selectedMealType && d.isActive)
                            .map((dish) => (
                                <ListItem
                                    key={dish._id || dish.id}
                                    button
                                    onClick={() => handleAddDishToMeal(dish._id || dish.id || '')}
                                >
                                    <ListItemText primary={dish.name} secondary={`Порций: ${dish.servingsCount}`} />
                                </ListItem>
                            ))}
                    </List>
                    {dishes.filter((d) => d.category === selectedMealType).length === 0 && (
                        <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                            Нет блюд для этой категории. Создайте блюда на вкладке "Блюда".
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddDishDialogOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ProductAccountingPage;
