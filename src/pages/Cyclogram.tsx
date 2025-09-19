import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton,
  Tooltip, Chip, CircularProgress, Alert, SelectChangeEvent, Tabs, Tab,
  Card, CardContent,
  List, ListItem, ListItemText, ListItemIcon, Divider,
} from '@mui/material';
import { 
  Add, Edit, Delete, Schedule as ScheduleIcon, ContentCopy,
 AccessTime, School, DirectionsRun,
  Restaurant, Hotel, Palette, Nature
} from '@mui/icons-material';

import {
  getCyclograms, createCyclogram, updateCyclogram, deleteCyclogram,
  getCyclogramTemplates, createCyclogramFromTemplate,
  WeeklyCyclogram, CyclogramTemplate
} from '../components/services/api/cyclogram';
import { getUsers, User as StaffMember, } from '../components/services/api/users';
import {   Group } from '../components/services/api/types';
import { getGroups } from '../components/services/api/groups';

const Cyclogram: React.FC = () => {
  // Состояния для данных
  const [cyclograms, setCyclograms] = useState<WeeklyCyclogram[]>([]);
  const [templates, setTemplates] = useState<CyclogramTemplate[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  
  // Состояния для UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [cyclogramDialogOpen, setCyclogramDialogOpen] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedCyclogram, setSelectedCyclogram] = useState<WeeklyCyclogram | null>(null);
  
  // Состояния для фильтров
  const [filterGroupId, setFilterGroupId] = useState<string>('');
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('');
  
  // Состояние для формы циклограммы
  const [cyclogramForm, setCyclogramForm] = useState<WeeklyCyclogram>({
    title: '',
    description: '',
    ageGroup: '4-5',
    groupId: '',
    teacherId: '',
    weekStartDate: new Date().toISOString().split('T')[0],
    timeSlots: [],
    status: 'draft'
  });
  const [cyclogramFormErrors, setCyclogramFormErrors] = useState<{[key: string]: string}>({});
  
  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
  }, []);
  
  // Загрузка всех необходимых данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получение всех данных
      const [cyclogramsData, templatesData, staffData, groupsData] = await Promise.all([
        getCyclograms(),
        getCyclogramTemplates(),
        getUsers(),
        getGroups()
      ]);
      
      setCyclograms(cyclogramsData);
      setTemplates(templatesData);
      setStaff(staffData);
      setGroups(groupsData);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик изменения вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Обработчик изменения полей формы циклограммы
  const handleCyclogramFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCyclogramForm({ ...cyclogramForm, [name]: value });
    
    // Очищаем ошибку для измененного поля
    if (cyclogramFormErrors[name]) {
      setCyclogramFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Обработчик изменения полей Select в форме циклограммы
  const handleCyclogramFormSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setCyclogramForm({ ...cyclogramForm, [name]: value });
    
    // Очищаем ошибку для измененного поля
    if (cyclogramFormErrors[name]) {
      setCyclogramFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Валидация формы циклограммы
  const validateCyclogramForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!cyclogramForm.title) errors.title = 'Введите название циклограммы';
    if (!cyclogramForm.ageGroup) errors.ageGroup = 'Выберите возрастную группу';
    if (!cyclogramForm.groupId) errors.groupId = 'Выберите группу';
    if (!cyclogramForm.teacherId) errors.teacherId = 'Выберите воспитателя';
    if (!cyclogramForm.weekStartDate) errors.weekStartDate = 'Выберите дату начала недели';
    
    setCyclogramFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Обработчик сохранения циклограммы
  const handleSaveCyclogram = async () => {
    // Валидация формы
    if (!validateCyclogramForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      if (cyclogramForm.id) {
        // Обновление существующей циклограммы
        const updatedCyclogram = await updateCyclogram(cyclogramForm.id, cyclogramForm);
        setCyclograms(cyclograms.map(c => c.id === updatedCyclogram.id ? updatedCyclogram : c));
      } else {
        // Создание новой циклограммы
        const newCyclogram = await createCyclogram(cyclogramForm);
        setCyclograms([...cyclograms, newCyclogram]);
      }
      
      // Закрываем диалог
      setCyclogramDialogOpen(false);
      setSelectedCyclogram(null);
      setCyclogramForm({
        title: '',
        description: '',
        ageGroup: '4-5',
        groupId: '',
        teacherId: '',
        weekStartDate: new Date().toISOString().split('T')[0],
        timeSlots: [],
        status: 'draft'
      });
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения циклограммы');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик удаления циклограммы
  const handleDeleteCyclogram = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту циклограмму?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteCyclogram(id);
      setCyclograms(cyclograms.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления циклограммы');
    } finally {
      setLoading(false);
    }
  };
  
  // Обработчик редактирования циклограммы
  const handleEditCyclogram = (cyclogram: WeeklyCyclogram) => {
    setSelectedCyclogram(cyclogram);
    setCyclogramForm(cyclogram);
    setCyclogramDialogOpen(true);
  };
  
  // Обработчик создания циклограммы из шаблона
  const handleCreateFromTemplate = async (template: CyclogramTemplate) => {
    if (!template.id) {
      setError('ID шаблона не найден');
      return;
    }
    
    if (groups.length === 0 || staff.length === 0) {
      setError('Необходимо загрузить данные о группах и сотрудниках');
      return;
    }
    
    setLoading(true);
    
    try {
      const newCyclogram = await createCyclogramFromTemplate(template.id, {
        title: `${template.name} - ${new Date().toLocaleDateString('ru-RU')}`,
        groupId: filterGroupId || groups[0]?.id || '',
        teacherId: staff[0]?.id || '',
        weekStartDate: new Date().toISOString().split('T')[0]
      });
      
      setCyclograms([...cyclograms, newCyclogram]);
      setTemplateDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Ошибка создания циклограммы из шаблона');
    } finally {
      setLoading(false);
    }
  };
  
  // Получение иконки для типа активности
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'educational': return <School />;
      case 'physical': return <DirectionsRun />;
      case 'creative': return <Palette />;
      case 'rest': return <Hotel />;
      case 'meal': return <Restaurant />;
      case 'outdoor': return <Nature />;
      default: return <AccessTime />;
    }
  };

  // Получение текста статуса
  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return 'Черновик';
      case 'active': return 'Активна';
      case 'archived': return 'Архивная';
      default: return status;
    }
  };
  
  // Получение цвета статуса
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'default';
      case 'active': return 'success';
      case 'archived': return 'secondary';
      default: return 'default';
    }
  };
  
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок и кнопки управления */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <ScheduleIcon sx={{ mr: 1 }} /> Циклограмма (по стандартам РК)
        </Typography>
        
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ContentCopy />}
            onClick={() => setTemplateDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Из шаблона
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => {
              setSelectedCyclogram(null);
              setCyclogramForm({
                title: '',
                description: '',
                ageGroup: '4-5',
                groupId: '',
                teacherId: '',
                weekStartDate: new Date().toISOString().split('T')[0],
                timeSlots: [],
                status: 'draft'
              });
              setCyclogramDialogOpen(true);
            }}
          >
            Создать циклограмму
          </Button>
        </Box>
      </Box>
      
      {/* Фильтры */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Группа</InputLabel>
          <Select
            value={filterGroupId}
            onChange={(e) => setFilterGroupId(e.target.value)}
            label="Группа"
          >
            <MenuItem value="">Все группы</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Возрастная группа</InputLabel>
          <Select
            value={filterAgeGroup}
            onChange={(e) => setFilterAgeGroup(e.target.value)}
            label="Возрастная группа"
          >
            <MenuItem value="">Все возрасты</MenuItem>
            <MenuItem value="3-4">3-4 года</MenuItem>
            <MenuItem value="4-5">4-5 лет</MenuItem>
            <MenuItem value="5-6">5-6 лет</MenuItem>
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          onClick={fetchData}
        >
          Применить фильтры
        </Button>
      </Box>
      
      {/* Индикатор загрузки и ошибки */}
      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Вкладки */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Активные циклограммы" />
        <Tab label="Шаблоны" />
      </Tabs>
      
      {/* Содержимое вкладок */}
      {tabValue === 0 && (
        <Box>
          {cyclograms.length === 0 ? (
            <Alert severity="info">Нет циклограмм для отображения</Alert>
          ) : (
            <Grid container spacing={2}>
              {cyclograms.map((cyclogram) => {
                const group = groups.find(g => g.id === cyclogram.groupId);
                const teacher = staff.find(s => s.id === cyclogram.teacherId);
                
                return (
                  <Grid item xs={12} md={6} lg={4} key={cyclogram.id}>
                    <Card>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                          <Typography variant="h6" component="div">
                            {cyclogram.title}
                          </Typography>
                          <Chip 
                            label={getStatusText(cyclogram.status)} 
                            size="small"
                            color={getStatusColor(cyclogram.status) as any}
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          {cyclogram.description}
                        </Typography>
                        
                        <Box mb={2}>
                          <Typography variant="body2">
                            <strong>Группа:</strong> {group?.name || 'Не указана'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Воспитатель:</strong> {teacher?.fullName || 'Не указан'}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Возраст:</strong> {cyclogram.ageGroup} лет
                          </Typography>
                          <Typography variant="body2">
                            <strong>Неделя:</strong> {new Date(cyclogram.weekStartDate).toLocaleDateString('ru-RU')}
                          </Typography>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" gutterBottom>
                          Активности ({cyclogram.timeSlots.length}):
                        </Typography>
                        
                        <Box mb={2}>
                          {cyclogram.timeSlots.slice(0, 3).map((slot, index) => (
                            <Box key={index} display="flex" alignItems="center" mb={1}>
                              {getActivityIcon(slot.activity.type)}
                              <Typography variant="body2" sx={{ ml: 1 }}>
                                {slot.startTime} - {slot.activity.name}
                              </Typography>
                            </Box>
                          ))}
                          {cyclogram.timeSlots.length > 3 && (
                            <Typography variant="body2" color="text.secondary">
                              ... и еще {cyclogram.timeSlots.length - 3} активностей
                            </Typography>
                          )}
                        </Box>
                        
                        <Box display="flex" justifyContent="flex-end" gap={1}>
                          <Tooltip title="Редактировать">
                            <IconButton 
                              size="small" 
                              onClick={() => handleEditCyclogram(cyclogram)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Удалить">
                            <IconButton 
                              size="small" 
                              onClick={() => handleDeleteCyclogram(cyclogram.id || '')}
                            >
                              <Delete fontSize="small" color="error" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
      
      {tabValue === 1 && (
        <Box>
          {templates.length === 0 ? (
            <Alert severity="info">Нет шаблонов для отображения</Alert>
          ) : (
            <Grid container spacing={2}>
              {templates.map((template) => (
                <Grid item xs={12} md={6} key={template.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" component="div">
                          {template.name}
                        </Typography>
                        {template.isDefault && (
                          <Chip label="По умолчанию" size="small" color="primary" />
                        )}
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {template.description}
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Возрастная группа:</strong> {template.ageGroup} лет
                      </Typography>
                      
                      <Typography variant="body2" gutterBottom>
                        <strong>Активностей:</strong> {template.timeSlots.length}
                      </Typography>
                      
                      <Box mt={2}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleCreateFromTemplate(template)}
                        >
                          Создать из шаблона
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
      
      {/* Диалог создания/редактирования циклограммы */}
      <Dialog open={cyclogramDialogOpen} onClose={() => setCyclogramDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedCyclogram ? 'Редактировать циклограмму' : 'Создать новую циклограмму'}
        </DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Название циклограммы"
                name="title"
                fullWidth
                value={cyclogramForm.title}
                onChange={handleCyclogramFormChange}
                error={!!cyclogramFormErrors.title}
                helperText={cyclogramFormErrors.title}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Описание"
                name="description"
                fullWidth
                multiline
                rows={3}
                value={cyclogramForm.description}
                onChange={handleCyclogramFormChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!cyclogramFormErrors.ageGroup}>
                <InputLabel>Возрастная группа</InputLabel>
                <Select
                  name="ageGroup"
                  value={cyclogramForm.ageGroup}
                  onChange={handleCyclogramFormSelectChange}
                  label="Возрастная группа"
                >
                  <MenuItem value="3-4">3-4 года</MenuItem>
                  <MenuItem value="4-5">4-5 лет</MenuItem>
                  <MenuItem value="5-6">5-6 лет</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!cyclogramFormErrors.groupId}>
                <InputLabel>Группа</InputLabel>
                <Select
                  name="groupId"
                  value={cyclogramForm.groupId || ''}
                  onChange={handleCyclogramFormSelectChange}
                  label="Группа"
                >
                  {groups.map((group) => (
                    <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!cyclogramFormErrors.teacherId}>
                <InputLabel>Воспитатель</InputLabel>
                <Select
                  name="teacherId"
                  value={cyclogramForm.teacherId || ''}
                  onChange={(e) => setCyclogramForm({ ...cyclogramForm, teacherId: e.target.value })}
                  label="Воспитатель"
                >
                  {staff.map((member) => (
                    <MenuItem key={member.id} value={member.id}>{member.fullName}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Дата начала недели"
                name="weekStartDate"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={cyclogramForm.weekStartDate}
                onChange={handleCyclogramFormChange}
                error={!!cyclogramFormErrors.weekStartDate}
                helperText={cyclogramFormErrors.weekStartDate}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Статус</InputLabel>
                <Select
                  name="status"
                  value={cyclogramForm.status}
                  onChange={handleCyclogramFormSelectChange}
                  label="Статус"
                >
                  <MenuItem value="draft">Черновик</MenuItem>
                  <MenuItem value="active">Активна</MenuItem>
                  <MenuItem value="archived">Архивная</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setCyclogramDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleSaveCyclogram} 
            variant="contained" 
            color="primary"
          >
            {selectedCyclogram ? 'Сохранить' : 'Создать'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог выбора шаблона */}
      <Dialog open={templateDialogOpen} onClose={() => setTemplateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Выберите шаблон циклограммы</DialogTitle>
        
        <DialogContent>
          <List>
            {templates.map((template) => (
              <ListItem 
                key={template.id}
                button
                onClick={() => handleCreateFromTemplate(template)}
              >
                <ListItemIcon>
                  <ContentCopy />
                </ListItemIcon>
                <ListItemText 
                  primary={template.name}
                  secondary={`${template.ageGroup} лет • ${template.timeSlots.length} активностей`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setTemplateDialogOpen(false)}>Отмена</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Cyclogram;
