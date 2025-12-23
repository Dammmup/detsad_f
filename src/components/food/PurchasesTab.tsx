import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Button, TextField, Dialog, DialogTitle,
    DialogContent, DialogActions, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, IconButton, FormControl,
    InputLabel, Select, MenuItem, Grid, CircularProgress, Autocomplete
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { Product, getProducts } from '../../services/products';
import { ProductPurchase, getProductPurchases, createProductPurchase, deleteProductPurchase } from '../../services/productPurchase';

const PurchasesTab: React.FC = () => {
    const [purchases, setPurchases] = useState<ProductPurchase[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [form, setForm] = useState({
        productId: '',
        quantity: 0,
        pricePerUnit: 0,
        supplier: '',
        batchNumber: '',
        expirationDate: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        invoiceNumber: '',
        notes: ''
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

    const handleProductSelect = (product: Product | null) => {
        setSelectedProduct(product);
        if (product) {
            setForm({
                ...form,
                productId: product._id || product.id || '',
                pricePerUnit: product.price || 0,
                supplier: product.supplier || ''
            });
        }
    };

    const handleCreate = async () => {
        if (!form.productId || form.quantity <= 0) {
            toast.error('Укажите продукт и количество');
            return;
        }
        try {
            await createProductPurchase(form);
            toast.success('Закупка добавлена');
            setDialogOpen(false);
            setForm({ productId: '', quantity: 0, pricePerUnit: 0, supplier: '', batchNumber: '', expirationDate: '', purchaseDate: new Date().toISOString().split('T')[0], invoiceNumber: '', notes: '' });
            setSelectedProduct(null);
            loadData();
        } catch (error: any) {
            toast.error(error.message || 'Ошибка');
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

    return (
        <Box sx={{ px: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
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
                                <TableCell align="right"><strong>Кол-во</strong></TableCell>
                                <TableCell align="right"><strong>Цена/ед</strong></TableCell>
                                <TableCell align="right"><strong>Сумма</strong></TableCell>
                                <TableCell><strong>Поставщик</strong></TableCell>
                                <TableCell><strong>Срок годности</strong></TableCell>
                                <TableCell align="center"><strong>Действия</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {purchases.map((p) => {
                                const product = typeof p.productId === 'object' ? p.productId : null;
                                return (
                                    <TableRow key={p._id || p.id}>
                                        <TableCell>{formatDate(p.purchaseDate)}</TableCell>
                                        <TableCell>{product?.name || '-'}</TableCell>
                                        <TableCell align="right">{p.quantity} {p.unit}</TableCell>
                                        <TableCell align="right">{p.pricePerUnit?.toLocaleString()} ₸</TableCell>
                                        <TableCell align="right">{p.totalPrice?.toLocaleString()} ₸</TableCell>
                                        <TableCell>{p.supplier}</TableCell>
                                        <TableCell>{formatDate(p.expirationDate)}</TableCell>
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

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить закупку</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={products}
                                getOptionLabel={(o) => o.name}
                                value={selectedProduct}
                                onChange={(_, v) => handleProductSelect(v)}
                                renderInput={(params) => <TextField {...params} label="Продукт" />}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="number" label="Количество" value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="number" label="Цена за ед. (₸)" value={form.pricePerUnit || ''} onChange={(e) => setForm({ ...form, pricePerUnit: Number(e.target.value) })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Поставщик" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth label="Номер партии" value={form.batchNumber} onChange={(e) => setForm({ ...form, batchNumber: e.target.value })} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="date" label="Дата закупки" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={6}>
                            <TextField fullWidth type="date" label="Срок годности" value={form.expirationDate} onChange={(e) => setForm({ ...form, expirationDate: e.target.value })} InputLabelProps={{ shrink: true }} />
                        </Grid>
                        <Grid item xs={12}>
                            <Typography variant="body2" color="text.secondary">
                                Итого: {((form.quantity || 0) * (form.pricePerUnit || 0)).toLocaleString()} ₸
                            </Typography>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleCreate}>Добавить</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default PurchasesTab;
