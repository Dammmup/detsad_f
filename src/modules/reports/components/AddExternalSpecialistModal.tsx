
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    CircularProgress
} from '@mui/material';
import { createExternalSpecialist, ExternalSpecialist } from '../services/externalSpecialists';

interface Props {
    open: boolean;
    onClose: () => void;
    onSuccess: (specialist: ExternalSpecialist) => void;
}

const AddExternalSpecialistModal: React.FC<Props> = ({ open, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: 'tenant',
        phone: '',
        description: ''
    });
    const [error, setError] = useState<string | null>(null);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        if (!formData.name) {
            setError('Имя обязательно');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const result = await createExternalSpecialist({
                name: formData.name,
                type: formData.type as any,
                phone: formData.phone,
                description: formData.description,
                active: true
            });
            onSuccess(result);
            onClose();
            setFormData({ name: '', type: 'tenant', phone: '', description: '' });
        } catch (err: any) {
            setError(err.message || 'Ошибка при создании специалиста');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Добавить внешнего специалиста</DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Имя / Название"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        fullWidth
                        required
                        error={!!error && !formData.name}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Тип</InputLabel>
                        <Select
                            value={formData.type}
                            label="Тип"
                            onChange={(e) => handleChange('type', e.target.value)}
                        >
                            <MenuItem value="tenant">Арендатор</MenuItem>
                            <MenuItem value="speech_therapist">Логопед</MenuItem>
                            <MenuItem value="other">Другое</MenuItem>
                        </Select>
                    </FormControl>

                    <TextField
                        label="Телефон"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Описание / Примечание"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        fullWidth
                        multiline
                        rows={3}
                    />

                    {error && (
                        <Box color="error.main" sx={{ mt: 1 }}>
                            {error}
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={loading}>Отмена</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Сохранение...' : 'Создать'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddExternalSpecialistModal;
