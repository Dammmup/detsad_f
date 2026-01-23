import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Grid, FormControl, InputLabel, Select, MenuItem, Typography, IconButton,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Autocomplete, Box, Divider
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Dish } from '../services/dishes';
import { Product, ProductIngredient, getProducts } from '../services/products';

interface DishDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (dish: Partial<Dish>) => void;
    dish: Dish | null;
}

const UNITS = ['г', 'кг', 'мл', 'л', 'шт'];

const DishDialog: React.FC<DishDialogProps> = ({ open, onClose, onSave, dish }) => {
    const [form, setForm] = useState<Partial<Dish>>({
        name: '',
        category: 'breakfast',
        ingredients: [],
        servingsCount: 1,
        description: '',
        isActive: true
    });
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [ingredientQty, setIngredientQty] = useState<number>(0);
    const [ingredientUnit, setIngredientUnit] = useState<string>('г');

    useEffect(() => {
        if (dish) {
            setForm(dish);
        } else {
            setForm({
                name: '',
                category: 'breakfast',
                ingredients: [],
                servingsCount: 1,
                description: '',
                isActive: true
            });
        }
    }, [dish, open]);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await getProducts({ status: 'active' });
                setProducts(data);
            } catch (error) {
                console.error('Error loading products:', error);
            }
        };
        if (open) loadProducts();
    }, [open]);

    const handleAddIngredient = () => {
        if (!selectedProduct || ingredientQty <= 0) return;

        const newIngredient: ProductIngredient = {
            productId: selectedProduct._id || selectedProduct.id || '',
            quantity: ingredientQty,
            unit: ingredientUnit
        };

        // Проверяем что продукт ещё не добавлен
        const exists = form.ingredients?.some(i => i.productId === newIngredient.productId);
        if (exists) return;

        setForm({
            ...form,
            ingredients: [...(form.ingredients || []), newIngredient]
        });
        setSelectedProduct(null);
        setIngredientQty(0);
    };

    const handleRemoveIngredient = (productId: string) => {
        setForm({
            ...form,
            ingredients: (form.ingredients || []).filter(i => i.productId !== productId)
        });
    };

    const getProductName = (productId: string) => {
        const product = products.find(p => (p._id || p.id) === productId);
        return product?.name || 'Неизвестный продукт';
    };

    const handleSave = () => {
        if (!form.name?.trim()) return;
        onSave(form);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>{dish ? 'Редактировать блюдо' : 'Добавить блюдо'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Название блюда"
                            value={form.name || ''}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <FormControl fullWidth>
                            <InputLabel>Категория</InputLabel>
                            <Select
                                value={form.category || 'breakfast'}
                                label="Категория"
                                onChange={(e) => setForm({ ...form, category: e.target.value as Dish['category'] })}
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
                            label="Порций на 1 ребёнка"
                            type="number"
                            value={form.servingsCount || 1}
                            onChange={(e) => setForm({ ...form, servingsCount: parseInt(e.target.value) || 1 })}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={2}
                            label="Описание"
                            value={form.description || ''}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" gutterBottom>
                    🥗 Ингредиенты (на 1 ребёнка)
                </Typography>

                <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={5}>
                        <Autocomplete
                            options={products.filter(p => !form.ingredients?.some(i => i.productId === (p._id || p.id)))}
                            getOptionLabel={(o) => o.name}
                            value={selectedProduct}
                            onChange={(_, v) => {
                                setSelectedProduct(v);
                                if (v) setIngredientUnit(v.unit || 'г');
                            }}
                            renderInput={(params) => <TextField {...params} label="Продукт" size="small" />}
                        />
                    </Grid>
                    <Grid item xs={5} sm={3}>
                        <TextField
                            fullWidth
                            type="number"
                            label="Количество"
                            size="small"
                            value={ingredientQty || ''}
                            onChange={(e) => setIngredientQty(Number(e.target.value))}
                        />
                    </Grid>
                    <Grid item xs={4} sm={2}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Ед.</InputLabel>
                            <Select
                                value={ingredientUnit}
                                label="Ед."
                                onChange={(e) => setIngredientUnit(e.target.value)}
                            >
                                {UNITS.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={3} sm={2}>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddIngredient}
                            disabled={!selectedProduct || ingredientQty <= 0}
                            fullWidth
                        >
                            Добавить
                        </Button>
                    </Grid>
                </Grid>

                {(form.ingredients?.length || 0) > 0 ? (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                    <TableCell><strong>Продукт</strong></TableCell>
                                    <TableCell align="right"><strong>Кол-во на 1 реб.</strong></TableCell>
                                    <TableCell align="center"><strong>Действие</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {form.ingredients?.map((ing) => (
                                    <TableRow key={ing.productId}>
                                        <TableCell>{getProductName(ing.productId)}</TableCell>
                                        <TableCell align="right">{ing.quantity} {ing.unit}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" color="error" onClick={() => handleRemoveIngredient(ing.productId)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Box sx={{ py: 2, textAlign: 'center', color: 'text.secondary' }}>
                        Ингредиенты не добавлены
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Отмена</Button>
                <Button variant="contained" onClick={handleSave} disabled={!form.name?.trim()}>
                    Сохранить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DishDialog;
