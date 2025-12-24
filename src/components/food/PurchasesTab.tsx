import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, Checkbox,
    Grid, CircularProgress, Card, CardContent, Chip
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, ShoppingCart } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { Product, getProducts } from '../../services/products';
import { ProductPurchase, getProductPurchases, createProductPurchase, deleteProductPurchase } from '../../services/productPurchase';

interface SelectedProduct {
    product: Product;
    quantity: number;
    pricePerUnit: number;
    weight?: number;
    weightUnit?: 'г' | 'кг' | 'мл' | 'л';
}

const PurchasesTab: React.FC = () => {
    const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>([]);
    const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
    const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]); // Фильтр по дате
    const [supplier, setSupplier] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const loadData = async () => {
        try {
            setLoading(true);
            const [purchasesData, productsData] = await Promise.all([
                getProductPurchases(),
                getProducts()
            ]);
            setPurchases(purchasesData);
            setProducts(productsData);
        } catch (error) {
            toast.error('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // Общая сумма расходов за выбранную дату
    const filteredPurchases = useMemo(() => {
        if (!filterDate) return purchases;
        return purchases.filter(p => {
            const pDate = p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : null;
            return pDate === filterDate;
        });
    }, [purchases, filterDate]);

    const totalExpenses = useMemo(() => {
        return filteredPurchases.reduce((sum, p) => sum + (p.totalPrice || 0), 0);
    }, [filteredPurchases]);

    // Сумма выбранных продуктов в модальном окне
    const selectedTotal = useMemo(() => {
        return selectedProducts.reduce((sum, sp) => sum + (sp.quantity * sp.pricePerUnit), 0);
    }, [selectedProducts]);

    // Фильтрованные продукты для поиска
    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        return products.filter(p =>
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    const handleToggleProduct = (product: Product) => {
        const existing = selectedProducts.find(sp => (sp.product._id || sp.product.id) === (product._id || product.id));
        if (existing) {
            setSelectedProducts(selectedProducts.filter(sp => (sp.product._id || sp.product.id) !== (product._id || product.id)));
        } else {
            setSelectedProducts([...selectedProducts, {
                product,
                quantity: 1,
                pricePerUnit: product.price || 0,
                weight: product.weight || 0,
                weightUnit: product.weightUnit || 'г'
            }]);
        }
    };

    const handleQuantityChange = (productId: string, quantity: number) => {
        setSelectedProducts(selectedProducts.map(sp =>
            (sp.product._id || sp.product.id) === productId
                ? { ...sp, quantity: Math.max(0, quantity) }
                : sp
        ));
    };

    const handlePriceChange = (productId: string, price: number) => {
        setSelectedProducts(selectedProducts.map(sp =>
            (sp.product._id || sp.product.id) === productId
                ? { ...sp, pricePerUnit: Math.max(0, price) }
                : sp
        ));
    };

    const handleWeightChange = (productId: string, weight: number) => {
        setSelectedProducts(selectedProducts.map(sp =>
            (sp.product._id || sp.product.id) === productId
                ? { ...sp, weight: Math.max(0, weight) }
                : sp
        ));
    };

    const isProductSelected = (product: Product) => {
        return selectedProducts.some(sp => (sp.product._id || sp.product.id) === (product._id || product.id));
    };

    const handleCreateBatch = async () => {
        if (selectedProducts.length === 0) {
            toast.error('Выберите хотя бы один продукт');
            return;
        }

        const invalidProducts = selectedProducts.filter(sp => sp.quantity <= 0);
        if (invalidProducts.length > 0) {
            toast.error('Укажите количество для всех выбранных продуктов');
            return;
        }

        try {
            setLoading(true);
            // Создаем закупки для всех выбранных продуктов
            for (const sp of selectedProducts) {
                await createProductPurchase({
                    productId: sp.product._id || sp.product.id || '',
                    quantity: sp.quantity,
                    pricePerUnit: sp.pricePerUnit,
                    weight: sp.weight,
                    weightUnit: sp.weightUnit,
                    supplier: supplier,
                    purchaseDate: purchaseDate,
                    batchNumber: '',
                    expirationDate: '',
                    invoiceNumber: '',
                    notes: ''
                });
            }
            toast.success(`Добавлено ${selectedProducts.length} закупок`);
            setDialogOpen(false);
            setSelectedProducts([]);
            setSearchTerm('');
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Удалить запись о закупке?')) return;
        try {
            await deleteProductPurchase(id);
            toast.success('Удалено');
            loadData();
        } catch (error) {
            toast.error('Ошибка удаления');
        }
    };

    const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('ru-RU') : '-';

    const openDialog = () => {
        setSelectedProducts([]);
        setPurchaseDate(new Date().toISOString().split('T')[0]);
        setSupplier('');
        setSearchTerm('');
        setDialogOpen(true);
    };

    return (
        <Box sx={{ px: 3 }}>
            {/* Карточка с общей суммой */}
            <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ color: 'white', opacity: 0.9 }}>
                            Общая сумма закупок
                        </Typography>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {totalExpenses.toLocaleString()} ₸
                        </Typography>
                    </Box>
                    <ShoppingCart sx={{ fontSize: 48, color: 'white', opacity: 0.7 }} />
                </CardContent>
            </Card>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <TextField
                        type="date"
                        label="Дата"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        size="small"
                        sx={{ width: 180 }}
                    />
                    <Typography variant="subtitle1" color="text.secondary">
                        Записей за день: {filteredPurchases.length}
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog}>
                    Добавить закупку
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
            ) : (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                <TableCell><strong>Дата</strong></TableCell>
                                <TableCell><strong>Продукт</strong></TableCell>
                                <TableCell><strong>Вес</strong></TableCell>
                                <TableCell align="right"><strong>Кол-во</strong></TableCell>
                                <TableCell align="right"><strong>Цена/ед</strong></TableCell>
                                <TableCell align="right"><strong>Сумма</strong></TableCell>
                                <TableCell><strong>Поставщик</strong></TableCell>
                                <TableCell align="center"><strong>Действия</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPurchases.map((p) => {
                                const product = typeof p.productId === 'object' ? p.productId : null;
                                const weight = p.weight || product?.weight;
                                const weightUnit = p.weightUnit || product?.weightUnit || 'г';
                                return (
                                    <TableRow key={p._id || p.id}>
                                        <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                                        <TableCell>{product?.name || '-'}</TableCell>
                                        <TableCell>{weight ? `${weight} ${weightUnit}` : '-'}</TableCell>
                                        <TableCell align="right">{p.quantity} {p.unit}</TableCell>
                                        <TableCell align="right">{p.pricePerUnit?.toLocaleString()} ₸</TableCell>
                                        <TableCell align="right"><strong>{p.totalPrice?.toLocaleString()} ₸</strong></TableCell>
                                        <TableCell>{p.supplier}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleDelete(p._id || p.id || '')}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* Модальное окно для группового выбора продуктов */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Добавить закупку</Typography>
                        {selectedProducts.length > 0 && (
                            <Chip
                                label={`Выбрано: ${selectedProducts.length} | Итого: ${selectedTotal.toLocaleString()} ₸`}
                                color="primary"
                            />
                        )}
                    </Box>
                </DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                type="date"
                                label="Дата закупки"
                                value={purchaseDate}
                                onChange={(e) => setPurchaseDate(e.target.value)}
                                InputLabelProps={{ shrink: true }}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField
                                fullWidth
                                label="Поставщик"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Поиск продуктов"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Введите название или категорию..."
                            />
                        </Grid>
                    </Grid>

                    {/* Список продуктов с чекбоксами */}
                    <TableContainer component={Paper} sx={{ mt: 2, maxHeight: 400, overflow: 'auto' }}>
                        <Table size="small" stickyHeader>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"></TableCell>
                                    <TableCell><strong>Продукт</strong></TableCell>
                                    <TableCell><strong>Вес</strong></TableCell>
                                    <TableCell><strong>Категория</strong></TableCell>
                                    <TableCell align="center"><strong>Кол-во</strong></TableCell>
                                    <TableCell align="center"><strong>Цена (₸)</strong></TableCell>
                                    <TableCell align="right"><strong>Сумма</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredProducts.map((product) => {
                                    const selected = selectedProducts.find(sp =>
                                        (sp.product._id || sp.product.id) === (product._id || product.id)
                                    );
                                    const isSelected = !!selected;
                                    const productId = product._id || product.id || '';

                                    return (
                                        <TableRow
                                            key={productId}
                                            hover
                                            sx={{
                                                bgcolor: isSelected ? 'action.selected' : 'inherit',
                                                cursor: 'pointer'
                                            }}
                                            onClick={() => handleToggleProduct(product)}
                                        >
                                            <TableCell padding="checkbox">
                                                <Checkbox checked={isSelected} />
                                            </TableCell>
                                            <TableCell>{product.name}</TableCell>
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                {isSelected ? (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={selected?.weight || 0}
                                                        onChange={(e) => handleWeightChange(productId, Number(e.target.value))}
                                                        sx={{ width: 80 }}
                                                        inputProps={{ min: 0 }}
                                                        placeholder="г"
                                                    />
                                                ) : (
                                                    product.weight ? `${product.weight} ${product.weightUnit || 'г'}` : '-'
                                                )}
                                            </TableCell>
                                            <TableCell>{product.category || '-'}</TableCell>
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                {isSelected && (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={selected?.quantity || 0}
                                                        onChange={(e) => handleQuantityChange(productId, Number(e.target.value))}
                                                        sx={{ width: 80 }}
                                                        inputProps={{ min: 0 }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                {isSelected && (
                                                    <TextField
                                                        type="number"
                                                        size="small"
                                                        value={selected?.pricePerUnit || 0}
                                                        onChange={(e) => handlePriceChange(productId, Number(e.target.value))}
                                                        sx={{ width: 100 }}
                                                        inputProps={{ min: 0 }}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell align="right">
                                                {isSelected && (
                                                    <Typography fontWeight="bold">
                                                        {((selected?.quantity || 0) * (selected?.pricePerUnit || 0)).toLocaleString()} ₸
                                                    </Typography>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </DialogContent>
                <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
                    <Typography variant="h6" sx={{ flexGrow: 1, color: 'primary.main' }}>
                        Итого: {selectedTotal.toLocaleString()} ₸
                    </Typography>
                    <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateBatch}
                        disabled={selectedProducts.length === 0 || loading}
                    >
                        {loading ? <CircularProgress size={20} /> : `Добавить (${selectedProducts.length})`}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchasesTab;
