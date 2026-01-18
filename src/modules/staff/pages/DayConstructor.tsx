import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Divider,
    CircularProgress,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
} from '@mui/material';
import {
    Add,
    Delete,
    DragIndicator,
    ExpandMore,
    Save,
    ContentCopy,
    AccessTime,
    School,
    DirectionsRun,
    Restaurant,
    Hotel,
    Palette,
    Nature,
    PlayArrow,
    NightsStay,
    WbSunny,
    FamilyRestroom,
} from '@mui/icons-material';
import {
    getActivityTemplates,
    getActivityTypes,
    createDailySchedule,
    updateDailyScheduleBlocks,
    getDailySchedules,
} from '../services/cyclogram';
import {
    ActivityTemplate,
    ScheduleBlock,
    DailySchedule,
} from '../../../shared/types/staff';
import { getGroups } from '../../children/services/groups';
import { Group } from '../../../shared/types/common';

const ACTIVITY_TYPE_ICONS: { [key: string]: React.ReactNode } = {
    reception: <WbSunny />,
    parents_work: <FamilyRestroom />,
    independent_activity: <Palette />,
    morning_gymnastics: <DirectionsRun />,
    breakfast: <Restaurant />,
    preparation_OD: <AccessTime />,
    OD: <School />,
    second_breakfast: <Restaurant />,
    walk: <Nature />,
    return_from_walk: <Nature />,
    lunch: <Restaurant />,
    day_sleep: <Hotel />,
    awakening: <NightsStay />,
    snack: <Restaurant />,
    evening_activity: <PlayArrow />,
    home_departure: <WbSunny />,
    other: <AccessTime />,
};

const ACTIVITY_TYPE_COLORS: { [key: string]: string } = {
    reception: '#4caf50',
    parents_work: '#9c27b0',
    independent_activity: '#ff9800',
    morning_gymnastics: '#2196f3',
    breakfast: '#f44336',
    preparation_OD: '#607d8b',
    OD: '#3f51b5',
    second_breakfast: '#f44336',
    walk: '#4caf50',
    return_from_walk: '#4caf50',
    lunch: '#f44336',
    day_sleep: '#673ab7',
    awakening: '#9c27b0',
    snack: '#f44336',
    evening_activity: '#ff5722',
    home_departure: '#795548',
    other: '#9e9e9e',
};

const DayConstructor: React.FC = () => {
    const [templates, setTemplates] = useState<ActivityTemplate[]>([]);
    const [activityTypes, setActivityTypes] = useState<{ value: string; label: string }[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
    const [currentSchedule, setCurrentSchedule] = useState<DailySchedule | null>(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string>('');
    const [expandedType, setExpandedType] = useState<string | false>(false);
    const [addBlockDialog, setAddBlockDialog] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ActivityTemplate | null>(null);
    const [blockTime, setBlockTime] = useState('');
    const [blockTopic, setBlockTopic] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedGroup && selectedDate) {
            loadSchedule();
        }
    }, [selectedGroup, selectedDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [templatesData, typesData, groupsData] = await Promise.all([
                getActivityTemplates(),
                getActivityTypes(),
                getGroups(),
            ]);
            setTemplates(templatesData);
            setActivityTypes(typesData);
            setGroups(groupsData);
            if (groupsData.length > 0) {
                setSelectedGroup(groupsData[0].id || groupsData[0]._id || '');
            }
        } catch (err: any) {
            setError(err.message || 'Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const loadSchedule = async () => {
        try {
            const schedules = await getDailySchedules({ groupId: selectedGroup, date: selectedDate });
            if (schedules.length > 0) {
                setCurrentSchedule(schedules[0]);
                setScheduleBlocks(schedules[0].blocks || []);
            } else {
                setCurrentSchedule(null);
                setScheduleBlocks([]);
            }
        } catch (err: any) {
            console.error('Error loading schedule:', err);
        }
    };

    const getTemplatesByType = (type: string) => {
        return templates.filter(t => t.type === type);
    };

    const handleAddBlock = (template: ActivityTemplate) => {
        setSelectedTemplate(template);
        setBlockTime('');
        setBlockTopic('');
        setAddBlockDialog(true);
    };

    const confirmAddBlock = () => {
        if (!selectedTemplate) return;

        const newBlock: ScheduleBlock = {
            order: scheduleBlocks.length,
            time: blockTime,
            activityType: selectedTemplate.type,
            templateId: selectedTemplate._id,
            content: selectedTemplate.content,
            topic: blockTopic || selectedTemplate.name,
            goal: selectedTemplate.goal,
        };

        setScheduleBlocks([...scheduleBlocks, newBlock]);
        setAddBlockDialog(false);
        setSuccess('Блок добавлен');
        setTimeout(() => setSuccess(null), 2000);
    };

    const handleRemoveBlock = (index: number) => {
        const updatedBlocks = scheduleBlocks.filter((_, i) => i !== index);
        updatedBlocks.forEach((block, i) => {
            block.order = i;
        });
        setScheduleBlocks(updatedBlocks);
    };

    const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
        if (
            (direction === 'up' && index === 0) ||
            (direction === 'down' && index === scheduleBlocks.length - 1)
        ) {
            return;
        }

        const newIndex = direction === 'up' ? index - 1 : index + 1;
        const updatedBlocks = [...scheduleBlocks];
        [updatedBlocks[index], updatedBlocks[newIndex]] = [updatedBlocks[newIndex], updatedBlocks[index]];
        updatedBlocks.forEach((block, i) => {
            block.order = i;
        });
        setScheduleBlocks(updatedBlocks);
    };

    const handleSave = async () => {
        if (!selectedGroup || !selectedDate) {
            setError('Выберите группу и дату');
            return;
        }

        setSaving(true);
        try {
            if (currentSchedule) {
                if (currentSchedule && currentSchedule._id) {
                    await updateDailyScheduleBlocks(currentSchedule._id, scheduleBlocks);
                }
            } else {
                await createDailySchedule({
                    groupId: selectedGroup,
                    date: selectedDate,
                    blocks: scheduleBlocks,
                });
            }
            setSuccess('Расписание сохранено!');
            await loadSchedule();
        } catch (err: any) {
            setError(err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
            setTimeout(() => setSuccess(null), 3000);
        }
    };

    const getTypeLabel = (type: string) => {
        const found = activityTypes.find(t => t.value === type);
        return found ? found.label : type;
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}
            {success && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            )}

            {/* Панель выбора группы и даты */}
            <Paper sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Группа</InputLabel>
                            <Select
                                value={selectedGroup}
                                onChange={(e) => setSelectedGroup(e.target.value)}
                                label="Группа"
                            >
                                {groups.map((g) => (
                                    <MenuItem key={g.id} value={g.id}>{g.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <TextField
                            type="date"
                            label="Дата"
                            size="small"
                            fullWidth
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            onClick={handleSave}
                            disabled={saving}
                            fullWidth
                        >
                            {saving ? 'Сохранение...' : 'Сохранить расписание'}
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            <Grid container spacing={2}>
                {/* Левая панель - шаблоны активностей */}
                <Grid item xs={12} md={5}>
                    <Paper sx={{ p: 2, maxHeight: '70vh', overflow: 'auto' }}>
                        <Typography variant="h6" gutterBottom>
                            Шаблоны активностей
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Нажмите на активность, чтобы добавить в расписание
                        </Typography>

                        {activityTypes.map((type) => {
                            const typeTemplates = getTemplatesByType(type.value);
                            if (typeTemplates.length === 0) return null;

                            return (
                                <Accordion
                                    key={type.value}
                                    expanded={expandedType === type.value}
                                    onChange={(_, expanded) => setExpandedType(expanded ? type.value : false)}
                                    sx={{ mb: 1 }}
                                >
                                    <AccordionSummary expandIcon={<ExpandMore />}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <Box
                                                sx={{
                                                    color: ACTIVITY_TYPE_COLORS[type.value] || '#666',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                {ACTIVITY_TYPE_ICONS[type.value] || <AccessTime />}
                                            </Box>
                                            <Typography>{type.label}</Typography>
                                            <Chip label={typeTemplates.length} size="small" />
                                        </Box>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <List dense>
                                            {typeTemplates.map((template) => (
                                                <ListItem
                                                    key={template._id}
                                                    button
                                                    onClick={() => handleAddBlock(template)}
                                                    sx={{
                                                        borderLeft: `3px solid ${ACTIVITY_TYPE_COLORS[template.type] || '#666'}`,
                                                        mb: 0.5,
                                                        borderRadius: 1,
                                                        '&:hover': { bgcolor: 'action.hover' },
                                                    }}
                                                >
                                                    <ListItemText
                                                        primary={template.name}
                                                        secondary={template.category}
                                                    />
                                                    <ListItemSecondaryAction>
                                                        <IconButton size="small" onClick={() => handleAddBlock(template)}>
                                                            <Add />
                                                        </IconButton>
                                                    </ListItemSecondaryAction>
                                                </ListItem>
                                            ))}
                                        </List>
                                    </AccordionDetails>
                                </Accordion>
                            );
                        })}
                    </Paper>
                </Grid>

                {/* Правая панель - расписание дня */}
                <Grid item xs={12} md={7}>
                    <Paper sx={{ p: 2, minHeight: 400 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                Расписание на {new Date(selectedDate).toLocaleDateString('ru-RU', {
                                    weekday: 'long',
                                    day: 'numeric',
                                    month: 'long',
                                })}
                            </Typography>
                            <Chip
                                label={`${scheduleBlocks.length} блоков`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>

                        {scheduleBlocks.length === 0 ? (
                            <Box
                                sx={{
                                    p: 4,
                                    textAlign: 'center',
                                    border: '2px dashed',
                                    borderColor: 'divider',
                                    borderRadius: 2,
                                }}
                            >
                                <Typography color="text.secondary">
                                    Добавьте активности из списка слева
                                </Typography>
                            </Box>
                        ) : (
                            <List>
                                {scheduleBlocks.map((block, index) => (
                                    <React.Fragment key={index}>
                                        <ListItem
                                            sx={{
                                                borderLeft: `4px solid ${ACTIVITY_TYPE_COLORS[block.activityType] || '#666'}`,
                                                bgcolor: 'background.paper',
                                                mb: 1,
                                                borderRadius: 1,
                                                boxShadow: 1,
                                            }}
                                        >
                                            <Box sx={{ mr: 1, cursor: 'grab', color: 'text.disabled' }}>
                                                <DragIndicator />
                                            </Box>
                                            <Box sx={{ mr: 2, color: ACTIVITY_TYPE_COLORS[block.activityType] || '#666' }}>
                                                {ACTIVITY_TYPE_ICONS[block.activityType] || <AccessTime />}
                                            </Box>
                                            <ListItemText
                                                primary={
                                                    <Box display="flex" alignItems="center" gap={1}>
                                                        {block.time && (
                                                            <Chip label={block.time} size="small" variant="outlined" />
                                                        )}
                                                        <Typography variant="subtitle1">{block.topic || block.content}</Typography>
                                                    </Box>
                                                }
                                                secondary={
                                                    <Typography variant="body2" color="text.secondary">
                                                        {getTypeLabel(block.activityType)}
                                                        {block.goal && ` • ${block.goal}`}
                                                    </Typography>
                                                }
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleMoveBlock(index, 'up')}
                                                    disabled={index === 0}
                                                >
                                                    ▲
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleMoveBlock(index, 'down')}
                                                    disabled={index === scheduleBlocks.length - 1}
                                                >
                                                    ▼
                                                </IconButton>
                                                <IconButton
                                                    size="small"
                                                    color="error"
                                                    onClick={() => handleRemoveBlock(index)}
                                                >
                                                    <Delete />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Диалог добавления блока */}
            <Dialog open={addBlockDialog} onClose={() => setAddBlockDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить активность</DialogTitle>
                <DialogContent>
                    {selectedTemplate && (
                        <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                {selectedTemplate.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {selectedTemplate.content}
                            </Typography>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Время (опционально)"
                                        placeholder="08:00"
                                        size="small"
                                        fullWidth
                                        value={blockTime}
                                        onChange={(e) => setBlockTime(e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        label="Тема (опционально)"
                                        size="small"
                                        fullWidth
                                        value={blockTopic}
                                        onChange={(e) => setBlockTopic(e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAddBlockDialog(false)}>Отмена</Button>
                    <Button variant="contained" onClick={confirmAddBlock}>
                        Добавить
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default DayConstructor;
