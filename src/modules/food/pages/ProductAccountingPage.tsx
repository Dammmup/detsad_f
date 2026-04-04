import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
    TableSortLabel,
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
    Description as DescriptionIcon, 
    Print as PrintIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';
import { showSnackbar } from '../../../shared/components/Snackbar';

import {
    Product,
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getProductAlerts,
    ProductAlerts
} from '../services/products';
import {
    Dish,
    getDishes,
    createDish,
    updateDish,
    deleteDish
} from '../services/dishes';
import {
    DailyMenu,
    MealType,
    getTodayMenu,
    createDailyMenu,
    serveMeal,
    addDishToMeal,
    removeDishFromMeal,
    getMealTypeName
} from '../services/dailyMenu';
import WeeklyMenuTab from '../components/WeeklyMenuTab';
import PurchasesTab from '../components/PurchasesTab';
import ReportsTab from '../components/ReportsTab';
import DishDialog from '../components/DishDialog';
import TechnicalCard from '../components/TechnicalCard';
import ProductCalculationDialog from '../components/ProductCalculationDialog';
import PdfImportDialog from '../components/PdfImportDialog';
import { useSort } from '../../../shared/hooks/useSort';

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

const formatDate = (dateStr?: string | Date) => {
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

// Мемоизированная строка продукта
const ProductRow = React.memo(({
    product,
    categoryLabel,
    onEdit,
    onDelete,
    index
}: {
    product: Product;
    categoryLabel: string;
    onEdit: (p: Product) => void;
    onDelete: (p: Product) => void;
    index: number;
}) => {
    const expired = isExpired(product);
    const expiringSoon = isExpiringSoon(product);

    const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);
    const handleDelete = useCallback(() => onDelete(product), [onDelete, product]);

    return (
        <TableRow
            sx={{
                bgcolor: expired ? '#ffebee' : expiringSoon ? '#fff8e1' : 'inherit',
                '&:hover': { bgcolor: '#f5f5f5' }
            }}
        >
            <TableCell sx={{ fontWeight: 'bold', width: 40 }}>{index + 1}</TableCell>
            <TableCell>
                {product.name}
                {expired && <Chip size="small" label="Просрочен" color="error" sx={{ ml: 1 }} />}
                {expiringSoon && <Chip size="small" label="Скоро" color="warning" sx={{ ml: 1 }} />}
            </TableCell>
            <TableCell>{product.code || '-'}</TableCell>
            <TableCell>{categoryLabel}</TableCell>
            <TableCell align="right">{product.stockQuantity} {product.unit}</TableCell>
            <TableCell align="right">{product.price?.toLocaleString()} ₸</TableCell>
            <TableCell>{formatDate(product.expirationDate)}</TableCell>
            <TableCell>{product.purchaseDays || '-'}</TableCell>
            <TableCell align="center">
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <IconButton size="small" onClick={handleEdit}>
                        <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={handleDelete}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </TableCell>
        </TableRow>
    );
});

// Мемоизированная карточка блюда
const DishCard = React.memo(({
    dish,
    onEdit,
    onDelete,
    onViewTechnical,
    onViewCalc
}: {
    dish: Dish;
    onEdit: (d: Dish) => void;
    onDelete: (d: Dish) => void;
    onViewTechnical: (d: Dish) => void;
    onViewCalc: (d: Dish) => void;
}) => {
    const handleEdit = useCallback(() => onEdit(dish), [onEdit, dish]);
    const handleDelete = useCallback(() => onDelete(dish), [onDelete, dish]);
    const handleViewTechnical = useCallback(() => onViewTechnical(dish), [onViewTechnical, dish]);
    const handleViewCalc = useCallback(() => onViewCalc(dish), [onViewCalc, dish]);

    return (
        <Grid item xs={12} sm={6} md={4} lg={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" component="div" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                            {dish.name}
                        </Typography>
                        <Chip
                            label={dish.category === 'breakfast' ? 'Завтрак' : dish.category === 'lunch' ? 'Обед' : dish.category === 'snack' ? 'Полдник' : 'Ужин'}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                        {dish.subcategory && (
                            <Chip label={dish.subcategory} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                        )}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                        Выход: {(dish as any).yield || (dish as any).outputWeight || 0}г
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                        Ингредиенты: {dish.ingredients?.length || 0} шт.
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                        <Tooltip title="Техзадание">
                            <IconButton size="small" onClick={handleViewTechnical}>
                                <DescriptionIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Расчёт">
                            <IconButton size="small" onClick={handleViewCalc}>
                                <RestaurantIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Редактировать">
                            <IconButton size="small" onClick={handleEdit}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Удалить">
                            <IconButton size="small" color="error" onClick={handleDelete}>
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </CardContent>
            </Card>
        </Grid>
    );
});

const ProductAccountingPage: React.FC = () => {
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [dishes, setDishes] = useState<Dish[]>([]);
    const [todayMenu, setTodayMenu] = useState<DailyMenu | null>(null);
    const [alerts, setAlerts] = useState<ProductAlerts | null>(null);

    const [productDialogOpen, setProductDialogOpen] = useState(false);
    const [dishDialogOpen, setDishDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editingDish, setEditingDish] = useState<Dish | null>(null);
    const [productSaveError, setProductSaveError] = useState<string | null>(null);
    const [dishSaveError, setDishSaveError] = useState<string | null>(null);
    const [techCardSaveError, setTechCardSaveError] = useState<string | null>(null);
    const [productForm, setProductForm] = useState<Partial<Product>>({
        name: '',
        code: '',
        category: '',
        unit: 'кг',
        price: 0,
        stockQuantity: 0,
        minStockLevel: 0,
        maxStockLevel: 1000,
        expirationDate: '',
        supplier: '',
        storageConditions: '',
        purchaseDays: 0,
        status: 'active'
    });

    const [productSearch, setProductSearch] = useState('');
    const [debouncedProductSearch, setDebouncedProductSearch] = useState('');
    const [dishSearch, setDishSearch] = useState('');
    const [debouncedDishSearch, setDebouncedDishSearch] = useState('');
    const [dishCategoryFilter, setDishCategoryFilter] = useState('all');
    const [dishSubcategoryFilter, setDishSubcategoryFilter] = useState('all');
    const [childCountInput, setChildCountInput] = useState(25);
    const [servingMeal, setServingMeal] = useState<MealType | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('breakfast');
    const [addDishDialogOpen, setAddDishDialogOpen] = useState(false);
    const [calculationDialogOpen, setCalculationDialogOpen] = useState(false);
    const [selectedDishForCalculation, setSelectedDishForCalculation] = useState<Dish | null>(null);
    const [techCardDialogOpen, setTechCardDialogOpen] = useState(false);
    const [selectedDishForTechCard, setSelectedDishForTechCard] = useState<Dish | null>(null);
    const [tempDishForTechCard, setTempDishForTechCard] = useState<Dish | null>(null);
    const [pdfImportDialogOpen, setPdfImportDialogOpen] = useState(false);

    const productSearchRef = React.useRef<any>(null);
    const dishSearchRef = React.useRef<any>(null);

    const onProductSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setProductSearch(e.target.value);
        if (productSearchRef.current) clearTimeout(productSearchRef.current);
        productSearchRef.current = setTimeout(() => {
            setDebouncedProductSearch(e.target.value);
        }, 300);
    }, []);

    const onDishSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setDishSearch(e.target.value);
        if (dishSearchRef.current) clearTimeout(dishSearchRef.current);
        dishSearchRef.current = setTimeout(() => {
            setDebouncedDishSearch(e.target.value);
        }, 300);
    }, []);

    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, alertsData] = await Promise.all([getProducts(), getProductAlerts()]);
            setProducts(productsData);
            setAlerts(alertsData);
        } catch (error) {
            showSnackbar({ message: 'Ошибка загрузки продуктов', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadDishes = useCallback(async () => {
        try {
            const data = await getDishes({});
            setDishes(data);
        } catch (error) {
            showSnackbar({ message: 'Ошибка загрузки блюд', type: 'error' });
        }
    }, []);

    const loadTodayMenu = useCallback(async () => {
        try {
            const data = await getTodayMenu();
            setTodayMenu(data);
        } catch (error) {
            console.error('Error menu:', error);
        }
    }, []);

    useEffect(() => {
        loadProducts();
        loadDishes();
        loadTodayMenu();
    }, [loadProducts, loadDishes, loadTodayMenu]);

    const categoryMap = useMemo(() => {
        const map = new Map<string, string>();
        CATEGORIES.forEach(c => map.set(c.value, c.label));
        return map;
    }, []);

    const processedProducts = useMemo(() => {
        return products.map(p => ({
            ...p,
            _categoryLabel: categoryMap.get(p.category as string) || (p.category as string),
            _expirationDate: p.expirationDate ? new Date(p.expirationDate).getTime() : 0,
            _price: p.price || 0,
            _stockQuantity: p.stockQuantity || 0,
            _purchaseDays: p.purchaseDays || 0
        }));
    }, [products, categoryMap]);

    const { items: sortedProducts, requestSort, sortConfig } = useSort(processedProducts);

    const filteredProducts = useMemo(() => {
        if (!debouncedProductSearch) return sortedProducts;
        const search = debouncedProductSearch.toLowerCase();
        return sortedProducts.filter(p => 
            p.name.toLowerCase().includes(search) || 
            p.code?.toLowerCase().includes(search)
        );
    }, [sortedProducts, debouncedProductSearch]);

    const filteredDishes = useMemo(() => {
        return dishes.filter(dish => {
            const matchCategory = dishCategoryFilter === 'all' || dish.category === dishCategoryFilter;
            const matchSubcategory = dishSubcategoryFilter === 'all' || dish.subcategory === dishSubcategoryFilter;
            const matchSearch = !debouncedDishSearch || dish.name.toLowerCase().includes(debouncedDishSearch.toLowerCase());
            return matchCategory && matchSubcategory && matchSearch;
        });
    }, [dishes, dishCategoryFilter, dishSubcategoryFilter, debouncedDishSearch]);

    const handleOpenProductDialog = useCallback((product?: Product) => {
        if (product && !(product as any).target) {
            setEditingProduct(product);
            setProductForm(product);
        } else {
            setEditingProduct(null);
            setProductForm({
                name: '',
                code: '',
                category: '',
                unit: 'кг',
                price: 0,
                stockQuantity: 0,
                minStockLevel: 0,
                maxStockLevel: 1000,
                expirationDate: '',
                supplier: '',
                storageConditions: '',
                purchaseDays: 0,
                status: 'active'
            });
        }
        setProductDialogOpen(true);
        setProductSaveError(null);
    }, []);

    const handleSaveProduct = useCallback(async () => {
        try {
            if (editingProduct) {
                await updateProduct(editingProduct._id || editingProduct.id || '', productForm);
                showSnackbar({ message: 'Продукт обновлен', type: 'success' });
            } else {
                await createProduct(productForm);
                showSnackbar({ message: 'Продукт создан', type: 'success' });
            }
            setProductDialogOpen(false);
            setProductSaveError(null);
            loadProducts();
        } catch (error: any) {
            setProductSaveError(getErrorMessage(error));
        }
    }, [editingProduct, productForm, loadProducts]);

    const handleDeleteProduct = useCallback(async (product: Product) => {
        if (!window.confirm(`Удалить "${product.name}"?`)) return;
        try {
            await deleteProduct(product._id || product.id || '');
            showSnackbar({ message: 'Продукт удален', type: 'success' });
            loadProducts();
        } catch (error: any) {
            showSnackbar({ message: getErrorMessage(error), type: 'error' });
        }
    }, [loadProducts]);

    const handleOpenDishDialog = useCallback((dish?: Dish) => {
        if (dish && !(dish as any).target) {
            setEditingDish(dish);
        } else {
            setEditingDish(null);
        }
        setDishDialogOpen(true);
    }, []);

    const handleSaveDish = useCallback(async (dishData: Partial<Dish>) => {
        try {
            if (editingDish) {
                await updateDish(editingDish._id || editingDish.id || '', dishData);
                showSnackbar({ message: 'Блюдо обновлено', type: 'success' });
            } else {
                await createDish(dishData);
                showSnackbar({ message: 'Блюдо создано', type: 'success' });
            }
            setDishDialogOpen(false);
            setDishSaveError(null);
            loadDishes();
        } catch (error: any) {
            setDishSaveError(getErrorMessage(error));
        }
    }, [editingDish, loadDishes]);

    const handleDeleteDish = useCallback(async (dish: Dish) => {
        if (!window.confirm(`Удалить "${dish.name}"?`)) return;
        try {
            await deleteDish(dish._id || dish.id || '');
            showSnackbar({ message: 'Блюдо удалено', type: 'success' });
            loadDishes();
        } catch (error: any) {
            showSnackbar({ message: getErrorMessage(error), type: 'error' });
        }
    }, [loadDishes]);

    const handleCreateTodayMenu = async () => {
        try {
            await createDailyMenu({ date: new Date().toISOString(), totalChildCount: childCountInput });
            showSnackbar({ message: 'Меню создано', type: 'success' });
            loadTodayMenu();
        } catch (error: any) {
            showSnackbar({ message: getErrorMessage(error), type: 'error' });
        }
    };

    const handleServeMeal = async (mealType: MealType) => {
        if (!todayMenu) return;
        try {
            setServingMeal(mealType);
            await serveMeal(todayMenu._id || todayMenu.id || '', mealType, childCountInput);
            showSnackbar({ message: 'Приём пищи подан!', type: 'success' });
            loadTodayMenu();
            loadProducts();
        } catch (error: any) {
            showSnackbar({ message: getErrorMessage(error), type: 'error' });
        } finally {
            setServingMeal(null);
        }
    };

    const handleAddDishToMeal = async (dishId: string) => {
        if (!todayMenu) return;
        try {
            await addDishToMeal(todayMenu._id || todayMenu.id || '', selectedMealType, dishId);
            showSnackbar({ message: 'Блюдо добавлено', type: 'success' });
            setAddDishDialogOpen(false);
            loadTodayMenu();
        } catch (error: any) {
            showSnackbar({ message: getErrorMessage(error), type: 'error' });
        }
    };

    const handleRemoveDishFromMeal = async (mealType: MealType, dishId: string) => {
        if (!todayMenu) return;
        try {
            await removeDishFromMeal(todayMenu._id || todayMenu.id || '', mealType, dishId);
            showSnackbar({ message: 'Блюдо удалено', type: 'success' });
            loadTodayMenu();
        } catch (error: any) {
            showSnackbar({ message: getErrorMessage(error), type: 'error' });
        }
    };

    const handleViewTechnical = useCallback((d: Dish) => {
        setSelectedDishForTechCard(d);
        setTempDishForTechCard(d);
        setTechCardDialogOpen(true);
    }, []);

    const handleViewCalc = useCallback((d: Dish) => {
        setSelectedDishForCalculation(d);
        setCalculationDialogOpen(true);
    }, []);

    const handleUpdateProductForm = useCallback((fields: Partial<Product>) => {
        setProductForm(prev => ({ ...prev, ...fields }));
    }, []);

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#1a1a2e' }}>
                    🍎 Учет продуктов
                </Typography>
                <Button startIcon={<RefreshIcon />} onClick={loadProducts}>
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
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab label="📦 Продукты" />
                    <Tab label="🍽️ Блюда" />
                    <Tab label="📋 Меню дня" />
                    <Tab label="📅 Недельное меню" />
                    <Tab label="🛒 Закупки" />
                    <Tab label="📊 Отчёты" />
                </Tabs>

                {/* Products Tab */}
                <TabPanel value={tabValue} index={0}>
                    <Box sx={{ px: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                            <TextField
                                size="small"
                                placeholder="Поиск продуктов..."
                                value={productSearch}
                                onChange={onProductSearchChange}
                                sx={{ flexGrow: 1, maxWidth: 400 }}
                            />
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
                                            <TableCell sx={{ width: 40 }}><strong>#</strong></TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={sortConfig.key === 'name'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('name')}
                                                >
                                                    <strong>Название</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={sortConfig.key === 'code'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('code')}
                                                >
                                                    <strong>Код</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={sortConfig.key === '_categoryLabel'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('_categoryLabel')}
                                                >
                                                    <strong>Категория</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell align="right">
                                                <TableSortLabel
                                                    active={sortConfig.key === '_stockQuantity'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('_stockQuantity')}
                                                >
                                                    <strong>Запас</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell align="right">
                                                <TableSortLabel
                                                    active={sortConfig.key === '_price'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('_price')}
                                                >
                                                    <strong>Цена</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={sortConfig.key === '_expirationDate'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('_expirationDate')}
                                                >
                                                    <strong>Срок годности</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell>
                                                <TableSortLabel
                                                    active={sortConfig.key === '_purchaseDays'}
                                                    direction={sortConfig.direction || 'asc'}
                                                    onClick={() => requestSort('_purchaseDays')}
                                                >
                                                    <strong>На дней</strong>
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell align="center"><strong>Действия</strong></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredProducts.map((product, index) => (
                                            <ProductRow
                                                key={product._id || product.id}
                                                product={product}
                                                categoryLabel={categoryMap.get(product.category as string) || product.category as string}
                                                onEdit={handleOpenProductDialog}
                                                onDelete={handleDeleteProduct}
                                                index={index}
                                            />
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1 }}>
                                <TextField
                                    size="small"
                                    placeholder="Поиск блюд..."
                                    value={dishSearch}
                                    onChange={onDishSearchChange}
                                    sx={{ minWidth: 200, flexGrow: 1, maxWidth: 300 }}
                                />
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Приём пищи</InputLabel>
                                    <Select
                                        value={dishCategoryFilter}
                                        label="Приём пищи"
                                        onChange={(e) => setDishCategoryFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">Все</MenuItem>
                                        <MenuItem value="breakfast">Завтрак</MenuItem>
                                        <MenuItem value="lunch">Обед</MenuItem>
                                        <MenuItem value="snack">Полдник</MenuItem>
                                        <MenuItem value="dinner">Ужин</MenuItem>
                                    </Select>
                                </FormControl>
                                <FormControl size="small" sx={{ minWidth: 150 }}>
                                    <InputLabel>Подкатегория</InputLabel>
                                    <Select
                                        value={dishSubcategoryFilter}
                                        label="Подкатегория"
                                        onChange={(e) => setDishSubcategoryFilter(e.target.value)}
                                    >
                                        <MenuItem value="all">Все</MenuItem>
                                        <MenuItem value="soup">Первое блюдо (Суп)</MenuItem>
                                        <MenuItem value="main">Второе блюдо</MenuItem>
                                        <MenuItem value="garnish">Гарнир</MenuItem>
                                        <MenuItem value="porridge">Каша</MenuItem>
                                        <MenuItem value="salad">Салат</MenuItem>
                                        <MenuItem value="drink">Напиток</MenuItem>
                                        <MenuItem value="baking">Выпечка</MenuItem>
                                        <MenuItem value="other">Прочее</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {/* 
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<PdfIcon />}
                                    onClick={() => setPdfImportDialogOpen(true)}
                                >
                                    Импорт из PDF
                                </Button>
                                */}
                                <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDishDialog()}>
                                    Добавить блюдо
                                </Button>
                            </Box>
                        </Box>

                        <Grid container spacing={2}>
                            {filteredDishes.map((dish) => (
                                <DishCard
                                    key={dish._id || dish.id}
                                    dish={dish}
                                    onEdit={handleOpenDishDialog}
                                    onDelete={handleDeleteDish}
                                    onViewTechnical={handleViewTechnical}
                                    onViewCalc={handleViewCalc}
                                />
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
                                                    {meal?.dishes?.map((dish: any) => (
                                                        <ListItem key={dish._id || dish.id}>
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

                {/* Weekly Menu Tab */}
                <TabPanel value={tabValue} index={3}>
                    <WeeklyMenuTab />
                </TabPanel>

                {/* Purchases Tab */}
                <TabPanel value={tabValue} index={4}>
                    <PurchasesTab />
                </TabPanel>

                {/* Reports Tab */}
                <TabPanel value={tabValue} index={5}>
                    <ReportsTab />
                </TabPanel>
            </Paper>

            {/* Product Dialog */}
            <Dialog open={productDialogOpen} onClose={() => setProductDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingProduct ? 'Редактировать продукт' : 'Добавить продукт'}</DialogTitle>
                <DialogContent>
                    <FormErrorAlert error={productSaveError} onClose={() => setProductSaveError(null)} />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Название"
                                value={productForm.name || ''}
                                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Код продукта"
                                value={productForm.code || ''}
                                onChange={(e) => setProductForm({ ...productForm, code: e.target.value })}
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
                                label="Мин. запас"
                                type="number"
                                value={productForm.minStockLevel || 0}
                                onChange={(e) => setProductForm({ ...productForm, minStockLevel: parseFloat(e.target.value) || 0 })}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Макс. запас"
                                type="number"
                                value={productForm.maxStockLevel || 1000}
                                onChange={(e) => setProductForm({ ...productForm, maxStockLevel: parseFloat(e.target.value) || 1000 })}
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
            <DishDialog
                open={dishDialogOpen}
                onClose={() => setDishDialogOpen(false)}
                onSave={handleSaveDish}
                dish={editingDish}
                error={dishSaveError}
                onCloseError={() => setDishSaveError(null)}
            />

            {/* Add Dish to Meal Dialog */}
            <Dialog open={addDishDialogOpen} onClose={() => setAddDishDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить блюдо в {getMealTypeName(selectedMealType)}</DialogTitle>
                <DialogContent>
                    <List>
                        {dishes
                            .filter((d) =>
                                (d.category === selectedMealType || ['drink', 'salad', 'baking'].includes(d.subcategory || ''))
                                && d.isActive
                            )
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

            {/* Product Calculation Dialog */}
            <ProductCalculationDialog
                open={calculationDialogOpen}
                onClose={() => setCalculationDialogOpen(false)}
                dish={selectedDishForCalculation}
                allProducts={products} // Pass all products for lookup
                initialChildCount={childCountInput} // Pass current child count from Menu tab
            />

            {/* Технологическая карта - Диалог просмотра и печати */}
            <Dialog
                open={techCardDialogOpen}
                onClose={() => setTechCardDialogOpen(false)}
                maxWidth="lg"
                fullWidth
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Просмотр и редактирование технологической карты
                    <Box>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                            sx={{ mr: 1 }}
                        >
                            Печать
                        </Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={async () => {
                                if (tempDishForTechCard) {
                                    try {
                                        await updateDish(tempDishForTechCard._id || tempDishForTechCard.id || '', tempDishForTechCard);
                                        showSnackbar({ message: 'Технологическая карта сохранена', type: 'success' });
                                        setTechCardSaveError(null);
                                        loadDishes();
                                    } catch (e: any) {
                                        setTechCardSaveError(getErrorMessage(e));
                                    }
                                }
                            }}
                        >
                            Сохранить изменения
                        </Button>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    <FormErrorAlert error={techCardSaveError} onClose={() => setTechCardSaveError(null)} />
                    {tempDishForTechCard && (
                        <TechnicalCard 
                            dish={tempDishForTechCard} 
                            editable={true}
                            onUpdate={(updatedFields) => {
                                setTempDishForTechCard({ ...tempDishForTechCard, ...updatedFields });
                            }}
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setTechCardDialogOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            {/* PDF Import Dialog */}
            <PdfImportDialog
                open={pdfImportDialogOpen}
                onClose={() => setPdfImportDialogOpen(false)}
                onImportComplete={() => loadDishes()}
            />
        </Box>
    );
};

export default ProductAccountingPage;
