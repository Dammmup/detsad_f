import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    IconButton,
    Tooltip,
    Chip,
    TextField,
    InputAdornment,
    useTheme,
    useMediaQuery,
    Card,
    Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';

interface Fine {
    amount: number;
    reason: string;
    type: string;
    date?: string | Date;
    _id?: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
    fines: Fine[];
    onAddFine: (fine: { amount: number; reason: string; type: 'manual' }) => void;
    onDeleteFine?: (fineId: string) => void;
    staffName: string;
}

const FinesDetailsDialog: React.FC<Props> = ({
    open,
    onClose,
    fines,
    onAddFine,
    onDeleteFine,
    staffName,
}) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showAddForm, setShowAddForm] = useState(false);
    const [newFine, setNewFine] = useState({ amount: '', reason: '' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [fineToDelete, setFineToDelete] = useState<{ index: number; amount: number } | null>(null);

    const handleDeleteClick = (index: number, amount: number) => {
        console.log('🗑️ [FinesDetailsDialog] handleDeleteClick called:', { index, amount });
        setFineToDelete({ index, amount });
        setDeleteConfirmOpen(true);
    };

    const handleConfirmDelete = () => {
        console.log('✅ [FinesDetailsDialog] handleConfirmDelete called');
        if (fineToDelete && onDeleteFine) {
            console.log('📤 [FinesDetailsDialog] Calling onDeleteFine with index:', fineToDelete.index);
            onDeleteFine(String(fineToDelete.index));
        }
        setDeleteConfirmOpen(false);
        setFineToDelete(null);
    };

    const handleCancelDelete = () => {
        console.log('❌ [FinesDetailsDialog] handleCancelDelete called');
        setDeleteConfirmOpen(false);
        setFineToDelete(null);
    };

    const handleAddSubmit = () => {
        if (!newFine.amount || !newFine.reason) return;
        onAddFine({
            amount: Number(newFine.amount),
            reason: newFine.reason,
            type: 'manual',
        });
        setNewFine({ amount: '', reason: '' });
        setShowAddForm(false);
    };

    const getFineLabel = (type: string) => {
        switch (type) {
            case 'late':
                return <Chip label="Опоздание" color="warning" size="small" variant="outlined" />;
            case 'manual':
                return <Chip label="Ручной" color="error" size="small" />;
            case 'absence':
                return <Chip label="Прогул" color="error" size="small" variant="outlined" />;
            default:
                return <Chip label="Другое" size="small" />;
        }
    };

    const totalFines = fines.reduce((sum, f) => sum + f.amount, 0);

    return (
        <>
            <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                    <Box>
                        <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                            Детализация Вычетов: {staffName}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                            Всего Вычетов: <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>{totalFines.toLocaleString()} тг</span>
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddCircleOutlineIcon />}
                        onClick={() => setShowAddForm(!showAddForm)}
                        size={isMobile ? 'small' : 'medium'}
                    >
                        {showAddForm ? 'Отмена' : 'Добавить'}
                    </Button>
                </DialogTitle>

                <DialogContent dividers sx={{ minHeight: '60vh' }}>
                    {showAddForm && (
                        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'grey.50', border: '1px solid #eee', borderRadius: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Новый Вычет</Typography>
                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: { xs: '1fr', sm: 'minmax(120px, 1fr) 2fr auto' }, 
                                gap: 2, 
                                alignItems: 'center' 
                            }}>
                                <TextField
                                    label="Сумма"
                                    type="number"
                                    size="small"
                                    value={newFine.amount}
                                    onChange={(e) => setNewFine({ ...newFine, amount: e.target.value })}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">тг</InputAdornment>,
                                    }}
                                    fullWidth
                                />
                                <TextField
                                    label="Причина"
                                    size="small"
                                    fullWidth
                                    value={newFine.reason}
                                    onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })}
                                />
                                <Button variant="contained" color="success" onClick={handleAddSubmit} disabled={!newFine.amount || !newFine.reason} fullWidth={isMobile}>
                                    Сохранить
                                </Button>
                            </Box>
                        </Paper>
                    )}

                    {fines.length === 0 ? (
                        <Box sx={{ p: { xs: 4, md: 10 }, textAlign: 'center', color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="h6">Вычетов нет</Typography>
                            <Typography variant="body2">У этого сотрудника нет зарегистрированных нарушений за этот период.</Typography>
                        </Box>
                    ) : isMobile ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {fines.map((fine, index) => (
                                <Card key={index} elevation={0} sx={{ 
                                    p: 2, 
                                    border: '1px solid', 
                                    borderColor: 'divider', 
                                    borderRadius: 2,
                                    bgcolor: index % 2 === 0 ? 'background.paper' : 'grey.50'
                                }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">
                                                {fine.date ? new Date(fine.date).toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'short' }) : '-'}
                                                {fine.type === 'late' && fine.date ? ` • ${new Date(fine.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` : ''}
                                            </Typography>
                                            {getFineLabel(fine.type)}
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                                                -{fine.amount.toLocaleString()} ₸
                                            </Typography>
                                            {fine.type === 'manual' && onDeleteFine && (
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleDeleteClick(index, fine.amount)}
                                                    sx={{ mt: 0.5 }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    </Box>
                                    <Divider sx={{ my: 1, borderStyle: 'dotted' }} />
                                    <Typography variant="body2">{fine.reason || 'Нет описания'}</Typography>
                                </Card>
                            ))}
                        </Box>
                    ) : (
                        <TableContainer component={Paper} elevation={0} variant="outlined">
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Дата</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Время</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Тип</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Причина / Детали</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Сумма</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {fines.map((fine, index) => (
                                        <TableRow key={index} hover sx={{ '&:nth-of-type(odd)': { bgcolor: 'background.default' } }}>
                                            <TableCell>
                                                {fine.date ? new Date(fine.date).toLocaleDateString('ru-RU', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {fine.type === 'late' && fine.date ? (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                                                            {new Date(fine.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                                                        </Typography>
                                                    </Box>
                                                ) : '-'}
                                            </TableCell>
                                            <TableCell>{getFineLabel(fine.type)}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">{fine.reason}</Typography>
                                            </TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 'bold', color: 'error.main', fontSize: '1.1rem' }}>
                                                -{fine.amount.toLocaleString()}
                                            </TableCell>
                                            <TableCell align="center">
                                                {fine.type === 'manual' && onDeleteFine ? (
                                                    <IconButton
                                                        size="small"
                                                        color="error"
                                                        onClick={() => handleDeleteClick(index, fine.amount)}
                                                        sx={{
                                                            '&:hover': { backgroundColor: 'error.light', color: 'white' }
                                                        }}
                                                        title="Удалить вычет"
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                ) : null}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог подтверждения удаления */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleCancelDelete}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle>Подтверждение удаления</DialogTitle>
                <DialogContent>
                    <Typography>
                        Вы уверены, что хотите удалить вычет на сумму <strong>{fineToDelete?.amount?.toLocaleString()} тг</strong>?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelDelete} color="inherit">
                        Отмена
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
                        Удалить
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default FinesDetailsDialog;
