import { 
    Box, Typography, Table, TableBody, TableCell, 
    TableContainer, TableHead, TableRow, Paper, Divider, Grid,
    TextField, IconButton
} from '@mui/material';
import { Dish } from '../services/dishes';

interface TechnicalCardProps {
    dish: Dish;
    organizationName?: string;
    editable?: boolean;
    onUpdate?: (dish: Partial<Dish>) => void;
}

const TechnicalCard: React.FC<TechnicalCardProps> = ({ 
    dish, 
    organizationName = 'ИП: __________________________',
    editable = false,
    onUpdate
}) => {
    // Расчет итогов
    const totals = dish.ingredients.reduce((acc, ing) => {
        acc.gross += Number(ing.grossQuantity) || 0;
        acc.net += Number(ing.quantity) || 0;
        acc.produced += Number(ing.producedQuantity) || 0;
        return acc;
    }, { gross: 0, net: 0, produced: 0 });

    const handleFieldChange = (field: keyof Dish | string, value: any) => {
        if (!onUpdate) return;
        
        if (field.includes('.')) {
            const [parent, child] = field.split('.');
            const parentValue = (dish as any)[parent] || {};
            onUpdate({ [parent]: { ...parentValue, [child]: value } });
        } else {
            onUpdate({ [field]: value });
        }
    };

    // Стиль для печати
    const printStyles = `
        @media print {
            body * {
                visibility: hidden;
            }
            #printable-tech-card, #printable-tech-card * {
                visibility: visible;
            }
            #printable-tech-card {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                color: black !important;
                background: white !important;
                padding: 20px;
            }
            .no-print {
                display: none !important;
            }
        }
    `;

    return (
        <Box id="printable-tech-card" sx={{ p: 4, bgcolor: 'white', color: 'black', fontFamily: 'Times New Roman, serif' }}>
            <style>{printStyles}</style>
            
            {/* Header */}
            <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontSize: '12pt' }}>
                    Наименование организации / фамилия, имя, отчество {organizationName}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontSize: '12pt', whiteSpace: 'nowrap' }}>
                        Источник рецептуры*: 
                    </Typography>
                    {editable ? (
                        <TextField
                            fullWidth
                            variant="standard"
                            size="small"
                            value={dish.recipeSource || ''}
                            onChange={(e) => handleFieldChange('recipeSource', e.target.value)}
                            sx={{ '& .MuiInputBase-input': { p: 0, fontSize: '12pt', fontFamily: 'inherit' } }}
                        />
                    ) : (
                        <Typography variant="body2" sx={{ fontSize: '12pt' }}>
                            {dish.recipeSource || '________________________________________'}
                        </Typography>
                    )}
                </Box>
            </Box>

            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '14pt' }}>
                        Технологическая карта № 
                    </Typography>
                    {editable ? (
                        <TextField
                            variant="standard"
                            size="small"
                            value={dish.recipeNumber || ''}
                            onChange={(e) => handleFieldChange('recipeNumber', e.target.value)}
                            sx={{ width: 80, '& .MuiInputBase-input': { p: 0, fontSize: '14pt', fontWeight: 'bold', textAlign: 'center', fontFamily: 'inherit' } }}
                        />
                    ) : (
                        <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '14pt' }}>
                            {dish.recipeNumber || '___'}
                        </Typography>
                    )}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '14pt' }}>
                    Наименование блюда (изделия): {dish.name}
                </Typography>
            </Box>

            {/* Main Table */}
            <TableContainer component={Box} sx={{ mb: 3 }}>
                <Table sx={{ border: '1px solid black', '& .MuiTableCell-root': { border: '1px solid black', p: 1, fontSize: '10pt', color: 'black' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Наименование сырья, пищевых продуктов</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Масса брутто, г, кг</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Масса нетто или полуфабриката, г, кг</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Масса готового продукта, г, кг</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Масса на 1 порцию</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>Технологический процесс изготовления, оформления и подачи блюда (изделия), условия и сроки реализации</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {dish.ingredients.map((ing, index) => (
                            <TableRow key={index}>
                                <TableCell>{typeof ing.productId === 'string' ? 'Загрузка...' : (ing.productId as any).name}</TableCell>
                                <TableCell align="center">{ing.grossQuantity || ' — '}</TableCell>
                                <TableCell align="center">{ing.quantity} {ing.unit}</TableCell>
                                <TableCell align="center">{ing.producedQuantity || ' — '}</TableCell>
                                <TableCell align="center">{ing.quantity} {ing.unit}</TableCell>
                                {index === 0 && (
                                    <TableCell 
                                        rowSpan={dish.ingredients.length + 3} 
                                        sx={{ verticalAlign: 'top', width: '30%' }}
                                    >
                                        {editable ? (
                                            <TextField
                                                fullWidth
                                                multiline
                                                variant="outlined"
                                                rows={10}
                                                value={dish.technologicalProcess || ''}
                                                onChange={(e) => handleFieldChange('technologicalProcess', e.target.value)}
                                                sx={{ '& .MuiInputBase-input': { fontSize: '10pt', fontFamily: 'inherit' } }}
                                            />
                                        ) : (
                                            dish.technologicalProcess || dish.description || 'Технологический процесс не описан'
                                        )}
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                        <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                            <TableCell sx={{ fontWeight: 'bold' }}>ИТОГО</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{totals.gross.toFixed(2)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{totals.net.toFixed(2)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{totals.produced.toFixed(2)}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>{totals.net.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ВЫХОД на 1 порцию</TableCell>
                            <TableCell align="center"> — </TableCell>
                            <TableCell align="center"> — </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {dish.yield !== undefined ? `${dish.yield} г` : ' — '}
                            </TableCell>
                            <TableCell align="center"> — </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>ВЫХОД на 1 кг</TableCell>
                            <TableCell align="center"> — </TableCell>
                            <TableCell align="center"> — </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                                {dish.yield1kg !== undefined ? `${dish.yield1kg} г` : ' — '}
                            </TableCell>
                            <TableCell align="center"> — </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Nutrition Info */}
            <Box sx={{ border: '1px solid black', p: 1, mb: 3 }}>
                <Typography variant="body2" sx={{ fontSize: '10pt', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                    Информация о пищевой ценности: 
                    белки — {editable ? (
                        <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            value={dish.nutritionalInfo?.proteins ?? ''}
                            onChange={(e) => handleFieldChange('nutritionalInfo.proteins', Number(e.target.value))}
                            sx={{ width: 40, '& .MuiInputBase-input': { p: 0, fontSize: '10pt', textAlign: 'center' } }}
                        />
                    ) : (dish.nutritionalInfo?.proteins ?? '……')}, 
                    
                    жиры — {editable ? (
                        <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            value={dish.nutritionalInfo?.fats ?? ''}
                            onChange={(e) => handleFieldChange('nutritionalInfo.fats', Number(e.target.value))}
                            sx={{ width: 40, '& .MuiInputBase-input': { p: 0, fontSize: '10pt', textAlign: 'center' } }}
                        />
                    ) : (dish.nutritionalInfo?.fats ?? '……')}, 
                    
                    углеводы — {editable ? (
                        <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            value={dish.nutritionalInfo?.carbs ?? ''}
                            onChange={(e) => handleFieldChange('nutritionalInfo.carbs', Number(e.target.value))}
                            sx={{ width: 40, '& .MuiInputBase-input': { p: 0, fontSize: '10pt', textAlign: 'center' } }}
                        />
                    ) : (dish.nutritionalInfo?.carbs ?? '……')}, 
                    
                    калорийность — {editable ? (
                        <TextField
                            variant="standard"
                            size="small"
                            type="number"
                            value={dish.nutritionalInfo?.calories ?? ''}
                            onChange={(e) => handleFieldChange('nutritionalInfo.calories', Number(e.target.value))}
                            sx={{ width: 50, '& .MuiInputBase-input': { p: 0, fontSize: '10pt', textAlign: 'center' } }}
                        />
                    ) : (dish.nutritionalInfo?.calories ?? '……')} ккал
                </Typography>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="body2" sx={{ mb: 2 }}>Подписи:</Typography>
                <Grid container spacing={2}>
                    <Grid item xs={6}>
                        <Typography variant="body2">Зав. производством: _________________</Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="body2">Калькулятор, технолог: _________________</Typography>
                    </Grid>
                </Grid>
            </Box>

            <Box sx={{ mt: 4, fontStyle: 'italic', fontSize: '8pt' }}>
                <Typography variant="caption" display="block">
                    * В качестве источника рецептуры допускается использовать Сборники рецептур блюд...
                </Typography>
            </Box>
        </Box>
    );
};

export default TechnicalCard;
