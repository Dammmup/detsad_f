import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Typography, CircularProgress, Paper, Box, Grid
} from '@mui/material';
import { Dish } from '../services/dishes';
import { Product, getProducts } from '../services/products';

interface ProductCalculationDialogProps {
    open: boolean;
    onClose: () => void;
    dish: Dish | null;
    allProducts: Product[]; // All products to lookup ingredients
    initialChildCount: number; // Initial value for number of children
}

interface CalculatedIngredient {
    name: string;
    requiredQuantity: number;
    unit: string;
    stockQuantity: number;
    isSufficient: boolean;
}

const ProductCalculationDialog: React.FC<ProductCalculationDialogProps> = ({
    open,
    onClose,
    dish,
    allProducts,
    initialChildCount,
}) => {
    const [childCount, setChildCount] = useState(initialChildCount);

    useEffect(() => {
        setChildCount(initialChildCount);
    }, [initialChildCount]);

    const calculatedIngredients: CalculatedIngredient[] = useMemo(() => {
        if (!dish || !dish.ingredients || childCount <= 0) return [];

        // Assuming servingsCount is 1 now (as per user's request to remove manual input)
        // If dish.servingsCount is still present and might be > 1, this logic needs adjustment.
        // For now, if the field is removed, it implies ingredient quantities are 'per portion'
        // and a 'portion' is what 1 child consumes for this dish.
        const servingsPerDish = dish.servingsCount || 1; // Default to 1 if not explicitly set

        return dish.ingredients.map(ing => {
            // Safely get the product ID string, handling if ing.productId is an object
            const ingredientProductId = typeof ing.productId === 'object' && ing.productId !== null
                ? (ing.productId as any)._id?.toString() || (ing.productId as any).id?.toString() || ing.productId.toString()
                : ing.productId?.toString();

            const product = allProducts.find(p => (p._id?.toString() || p.id?.toString()) === ingredientProductId);
            const requiredQuantity = (ing.quantity / servingsPerDish) * childCount; // Scale by child count
            
            return {
                name: product?.name || `Неизвестный продукт (ID: ${ingredientProductId})` || 'Неизвестный продукт',
                requiredQuantity: parseFloat(requiredQuantity.toFixed(2)),
                unit: ing.unit,
                stockQuantity: product?.stockQuantity || 0,
                isSufficient: (product?.stockQuantity || 0) >= requiredQuantity,
            };
        });
    }, [dish, childCount, allProducts]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Расчет продуктов для блюда: {dish?.name}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <TextField
                        label="Количество детей"
                        type="number"
                        value={childCount}
                        onChange={(e) => setChildCount(parseInt(e.target.value) || 0)}
                        fullWidth
                        size="small"
                    />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Необходимые ингредиенты:
                </Typography>

                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell><strong>Ингредиент</strong></TableCell>
                                <TableCell align="right"><strong>Требуется</strong></TableCell>
                                <TableCell align="right"><strong>На складе</strong></TableCell>
                                <TableCell align="center"><strong>Достаточно</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {calculatedIngredients.length > 0 ? (
                                calculatedIngredients.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{item.name}</TableCell>
                                        <TableCell align="right">{item.requiredQuantity} {item.unit}</TableCell>
                                        <TableCell align="right">{item.stockQuantity} {item.unit}</TableCell>
                                        <TableCell align="center" sx={{ color: item.isSufficient ? 'green' : 'red' }}>
                                            {item.isSufficient ? 'Да' : 'Нет'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} sx={{ textAlign: 'center', color: 'text.secondary' }}>
                                        Нет ингредиентов для расчета.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Закрыть</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductCalculationDialog;
