import React, { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    Typography,
    Stepper,
    Step,
    StepLabel,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    Chip,
    Paper,
    Collapse,
    IconButton,
    LinearProgress,
    Tooltip,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    CheckCircle as CheckIcon,
    NewReleases as NewIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    PictureAsPdf as PdfIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import { analyzePdf, confirmPdfImport, PdfAnalysisResult } from '../services/dishes';

interface PdfImportDialogProps {
    open: boolean;
    onClose: () => void;
    onImportComplete: () => void;
}

const FIELD_LABELS: Record<string, string> = {
    technologicalProcess: 'Технология приготовления',
    shelfLifeAndStorage: 'Срок годности и хранение',
    'organoleptic.appearance': 'Внешний вид',
    'organoleptic.consistency': 'Консистенция',
    'organoleptic.color': 'Цвет',
    'organoleptic.tasteAndSmell': 'Вкус и запах',
    'vitaminsAndMinerals.A': 'Витамин A',
    'vitaminsAndMinerals.D': 'Витамин D',
    'vitaminsAndMinerals.E': 'Витамин E',
    'vitaminsAndMinerals.K': 'Витамин K',
    'vitaminsAndMinerals.C': 'Витамин C',
    'vitaminsAndMinerals.dietaryFiber': 'Пищевые волокна',
    'nutritionalInfo.proteins': 'Белки',
    'nutritionalInfo.fats': 'Жиры',
    'nutritionalInfo.carbs': 'Углеводы',
    'nutritionalInfo.calories': 'Калории',
};

const CATEGORY_LABELS: Record<string, string> = {
    breakfast: 'Завтрак',
    lunch: 'Обед',
    snack: 'Полдник',
    dinner: 'Ужин',
};

const steps = ['Загрузка PDF', 'Превью изменений', 'Применение'];

const PdfImportDialog: React.FC<PdfImportDialogProps> = ({ open, onClose, onImportComplete }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [analysisResult, setAnalysisResult] = useState<PdfAnalysisResult | null>(null);
    const [selectedDishIds, setSelectedDishIds] = useState<Set<string>>(new Set());
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [importResult, setImportResult] = useState<{ matched: number; modified: number; message: string } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleReset = useCallback(() => {
        setActiveStep(0);
        setLoading(false);
        setError(null);
        setSelectedFile(null);
        setAnalysisResult(null);
        setSelectedDishIds(new Set());
        setExpandedRows(new Set());
        setImportResult(null);
    }, []);

    const handleClose = () => {
        handleReset();
        onClose();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                setError('Допускаются только PDF-файлы');
                return;
            }
            if (file.size > 20 * 1024 * 1024) {
                setError('Файл слишком большой (макс. 20 МБ)');
                return;
            }
            setSelectedFile(file);
            setError(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type === 'application/pdf') {
            setSelectedFile(file);
            setError(null);
        } else {
            setError('Допускаются только PDF-файлы');
        }
    };

    const handleAnalyze = async () => {
        if (!selectedFile) return;

        setLoading(true);
        setError(null);

        try {
            const result = await analyzePdf(selectedFile);
            setAnalysisResult(result);

            // По умолчанию выбираем все существующие блюда
            const allIds = new Set(result.existing.map(item => item.dish._id));
            setSelectedDishIds(allIds);

            setActiveStep(1);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Ошибка анализа PDF');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleDish = (id: string) => {
        setSelectedDishIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleToggleAll = () => {
        if (!analysisResult) return;
        if (selectedDishIds.size === analysisResult.existing.length) {
            setSelectedDishIds(new Set());
        } else {
            setSelectedDishIds(new Set(analysisResult.existing.map(item => item.dish._id)));
        }
    };

    const handleToggleExpand = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const handleApply = async () => {
        if (!analysisResult || selectedDishIds.size === 0) return;

        setLoading(true);
        setError(null);

        try {
            const updates = analysisResult.existing
                .filter(item => selectedDishIds.has(item.dish._id))
                .map(item => ({
                    dishId: item.dish._id,
                    parsedData: item.parsedData,
                }));

            const result = await confirmPdfImport(updates);
            setImportResult(result);
            setActiveStep(2);
            onImportComplete();
        } catch (err: any) {
            setError(err.response?.data?.error || err.message || 'Ошибка применения изменений');
        } finally {
            setLoading(false);
        }
    };

    const renderStepUpload = () => (
        <Box sx={{ py: 3 }}>
            <Box
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                sx={{
                    border: '2px dashed',
                    borderColor: selectedFile ? 'success.main' : 'divider',
                    borderRadius: 3,
                    p: 5,
                    textAlign: 'center',
                    cursor: 'pointer',
                    bgcolor: selectedFile ? 'success.50' : 'grey.50',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'primary.50',
                    },
                }}
            >
                {selectedFile ? (
                    <>
                        <PdfIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>{selectedFile.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Нажмите, чтобы выбрать другой файл
                        </Typography>
                    </>
                ) : (
                    <>
                        <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" gutterBottom>
                            Перетащите PDF или нажмите для выбора
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Поддерживаются PDF до 20 МБ с технологическими картами
                        </Typography>
                    </>
                )}
            </Box>

            <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            {loading && (
                <Box sx={{ mt: 3 }}>
                    <LinearProgress />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                        ⏳ AI анализирует документ... Это может занять 1-2 минуты
                    </Typography>
                </Box>
            )}
        </Box>
    );

    const renderStepPreview = () => {
        if (!analysisResult) return null;

        return (
            <Box sx={{ py: 2 }}>
                <Alert severity="info" sx={{ mb: 2 }}>
                    {analysisResult.message}
                </Alert>

                {/* Existing dishes with updates */}
                {analysisResult.existing.length > 0 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" fontWeight={600}>
                                ✅ Найденные в базе данных ({analysisResult.existing.length})
                            </Typography>
                            <Button size="small" onClick={handleToggleAll}>
                                {selectedDishIds.size === analysisResult.existing.length ? 'Снять все' : 'Выбрать все'}
                            </Button>
                        </Box>

                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f0f7ff' }}>
                                        <TableCell padding="checkbox">
                                            <Checkbox
                                                checked={selectedDishIds.size === analysisResult.existing.length}
                                                indeterminate={selectedDishIds.size > 0 && selectedDishIds.size < analysisResult.existing.length}
                                                onChange={handleToggleAll}
                                            />
                                        </TableCell>
                                        <TableCell><strong>Блюдо</strong></TableCell>
                                        <TableCell><strong>Категория</strong></TableCell>
                                        <TableCell><strong>Рецепт №</strong></TableCell>
                                        <TableCell align="center"><strong>Полей обновится</strong></TableCell>
                                        <TableCell />
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analysisResult.existing.map((item) => (
                                        <React.Fragment key={item.dish._id}>
                                            <TableRow
                                                hover
                                                sx={{
                                                    bgcolor: selectedDishIds.has(item.dish._id) ? 'rgba(25, 118, 210, 0.04)' : 'inherit'
                                                }}
                                            >
                                                <TableCell padding="checkbox">
                                                    <Checkbox
                                                        checked={selectedDishIds.has(item.dish._id)}
                                                        onChange={() => handleToggleDish(item.dish._id)}
                                                    />
                                                </TableCell>
                                                <TableCell>{item.dish.name}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="small"
                                                        label={CATEGORY_LABELS[item.dish.category] || item.dish.category}
                                                        variant="outlined"
                                                    />
                                                </TableCell>
                                                <TableCell>{item.dish.recipeNumber || '—'}</TableCell>
                                                <TableCell align="center">
                                                    <Chip
                                                        size="small"
                                                        label={Object.keys(item.updates).length}
                                                        color="primary"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleToggleExpand(item.dish._id)}
                                                    >
                                                        {expandedRows.has(item.dish._id) ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                            {/* Detail row: field-by-field comparison */}
                                            <TableRow>
                                                <TableCell colSpan={6} sx={{ p: 0, border: 0 }}>
                                                    <Collapse in={expandedRows.has(item.dish._id)}>
                                                        <Box sx={{ p: 2, bgcolor: '#fafafa' }}>
                                                            <Table size="small">
                                                                <TableHead>
                                                                    <TableRow>
                                                                        <TableCell width="30%"><strong>Поле</strong></TableCell>
                                                                        <TableCell width="35%"><strong>Было</strong></TableCell>
                                                                        <TableCell width="35%"><strong>Станет</strong></TableCell>
                                                                    </TableRow>
                                                                </TableHead>
                                                                <TableBody>
                                                                    {Object.entries(item.updates).map(([field, change]) => (
                                                                        <TableRow key={field}>
                                                                            <TableCell>
                                                                                <Typography variant="body2" fontWeight={500}>
                                                                                    {FIELD_LABELS[field] || field}
                                                                                </Typography>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Tooltip title={String((change as any).old)} placement="top">
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        color="text.secondary"
                                                                                        sx={{
                                                                                            maxWidth: 250,
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            whiteSpace: 'nowrap'
                                                                                        }}
                                                                                    >
                                                                                        {String((change as any).old)}
                                                                                    </Typography>
                                                                                </Tooltip>
                                                                            </TableCell>
                                                                            <TableCell>
                                                                                <Tooltip title={String((change as any).new)} placement="top">
                                                                                    <Typography
                                                                                        variant="body2"
                                                                                        color="success.main"
                                                                                        fontWeight={500}
                                                                                        sx={{
                                                                                            maxWidth: 250,
                                                                                            overflow: 'hidden',
                                                                                            textOverflow: 'ellipsis',
                                                                                            whiteSpace: 'nowrap'
                                                                                        }}
                                                                                    >
                                                                                        {String((change as any).new)}
                                                                                    </Typography>
                                                                                </Tooltip>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </Box>
                                                    </Collapse>
                                                </TableCell>
                                            </TableRow>
                                        </React.Fragment>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {/* New dishes (not in DB) */}
                {analysisResult.newDishes.length > 0 && (
                    <>
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                            🆕 Новые блюда (нет в базе) — {analysisResult.newDishes.length}
                        </Typography>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Эти блюда не найдены в базе данных. Для них обновление не применяется.
                            При необходимости создайте их вручную.
                        </Alert>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#fff3e0' }}>
                                        <TableCell><strong>Название</strong></TableCell>
                                        <TableCell><strong>Рецепт №</strong></TableCell>
                                        <TableCell><strong>КБЖУ</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {analysisResult.newDishes.map((dish, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{dish.name || '—'}</TableCell>
                                            <TableCell>{dish.recipeNumber || '—'}</TableCell>
                                            <TableCell>
                                                {dish.nutritionalInfo
                                                    ? `${dish.nutritionalInfo.calories || 0} ккал, Б: ${dish.nutritionalInfo.proteins || 0}, Ж: ${dish.nutritionalInfo.fats || 0}, У: ${dish.nutritionalInfo.carbs || 0}`
                                                    : '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}

                {loading && (
                    <Box sx={{ mt: 2 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                            Применяю изменения...
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    };

    const renderStepResult = () => (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
                Импорт завершён!
            </Typography>
            {importResult && (
                <>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                        {importResult.message}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 3 }}>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary.main" fontWeight={700}>
                                {importResult.matched}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">найдено</Typography>
                        </Box>
                        <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="success.main" fontWeight={700}>
                                {importResult.modified}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">обновлено</Typography>
                        </Box>
                    </Box>
                </>
            )}
        </Box>
    );

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{ sx: { minHeight: '60vh' } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">📄 Импорт технологических карт из PDF</Typography>
                {!loading && (
                    <IconButton onClick={handleClose} size="small">
                        <CloseIcon />
                    </IconButton>
                )}
            </DialogTitle>

            <DialogContent dividers>
                <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {activeStep === 0 && renderStepUpload()}
                {activeStep === 1 && renderStepPreview()}
                {activeStep === 2 && renderStepResult()}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                {activeStep === 0 && (
                    <>
                        <Button onClick={handleClose} disabled={loading}>Отмена</Button>
                        <Button
                            variant="contained"
                            onClick={handleAnalyze}
                            disabled={!selectedFile || loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <UploadIcon />}
                        >
                            {loading ? 'Анализ...' : 'Анализировать'}
                        </Button>
                    </>
                )}
                {activeStep === 1 && (
                    <>
                        <Button onClick={() => setActiveStep(0)} disabled={loading}>Назад</Button>
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleApply}
                            disabled={selectedDishIds.size === 0 || loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
                        >
                            {loading ? 'Обновление...' : `Обновить ${selectedDishIds.size} блюд`}
                        </Button>
                    </>
                )}
                {activeStep === 2 && (
                    <Button variant="contained" onClick={handleClose}>
                        Готово
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default PdfImportDialog;
