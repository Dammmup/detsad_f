import React, { useEffect, useState } from 'react';
import { getUsers, createUser, updateUser, deleteUser, User as StaffMember,  } from '../components/services/api/users';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Alert, Button, Dialog, 
  DialogTitle, DialogContent, DialogActions, TextField, IconButton, InputAdornment, FormControl,
  InputLabel, Select, MenuItem, FormHelperText, Grid, Tooltip, Chip, Divider, Box, Typography,
  OutlinedInput, SelectChangeEvent, Checkbox, ListItemText, 
} from '@mui/material';
import { 
  Edit, Delete, Add, Search, Email, Phone, Badge, 
 Person
} from '@mui/icons-material';

import { getGroups } from '../components/services/api/groups';
import { useAuth } from '../components/context/AuthContext';
import ExportMenuButton from '../components/ExportMenuButton';
import { exportStaffList } from '../components/services/api/excelExport';
import axios from 'axios';

// 🇷🇺 Переводы ролей с английского на русский
const roleTranslations: Record<string, string> = {
  // Административные роли
  'admin': 'Администратор',
  'manager': 'Менеджер',
  'director': 'Директор',
  
  // Педагогические роли
  'teacher': 'Воспитатель',
  'assistant': 'Помощник воспитателя',
  'psychologist': 'Психолог',
  'speech_therapist': 'Логопед',
  'music_teacher': 'Музыкальный руководитель',
  'physical_education': 'Инструктор по физкультуре',
  
  // Медицинские роли
  'nurse': 'Медсестра',
  'doctor': 'Врач',
  
  // Обслуживающий персонал
  'cook': 'Повар',
  'cleaner': 'Уборщица',
  'security': 'Охранник',
  'maintenance': 'Завхоз',
  'laundry': 'Прачка',
  
  // Дополнительные роли
  'staff': 'Сотрудник',
  'substitute': 'Подменный сотрудник',
  'intern': 'Стажер'
};

// Функция для перевода роли на русский
const translateRole = (role: string): string => {
  return roleTranslations[role] || role; // Если перевода нет, возвращаем оригинал
};

// Функция для получения английской роли по русскому названию
const getRoleByTranslation = (translation: string): string => {
  const entry = Object.entries(roleTranslations).find(([_, value]) => value === translation);
  return entry ? entry[0] : translation;
};

const defaultForm: StaffMember = { 
  fullName: '',
  role: '',
  phone: '',
  email: '',
  active: true,
  type: 'adult'
};

const Staff = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StaffMember>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [newPersonalCode, setNewPersonalCode] = useState<string | null>(null);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const { user: currentUser } = useAuth();
  // 🇷🇺 Список доступных ролей на русском языке (автоматически из переводов)
  const availableRoles = Object.values(roleTranslations).sort();
  
  const fetchStaff = () => {
    setLoading(true);
    setError(null);
    const includePasswords = currentUser?.role === 'admin';
    getUsers(includePasswords)
      .then(data => {
        setStaff(data.filter(u => u.type === 'adult'));
        setFilteredStaff(data);
      })
      .catch(err => setError(err?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  };
  
  // Загрузка списка групп
  const fetchGroups = async () => {
    try {
      await getGroups()
      
    } catch (err) {
      console.error('Ошибка при загрузке групп:', err);
    }
  };

  useEffect(() => {
    
    fetchStaff();
    fetchGroups();
  }, []);
  
  // Фильтрация сотрудников при изменении поисковой строки или фильтра ролей
  useEffect(() => {
    if (!staff.length) return;
    
    let filtered = [...staff];
  console.log(currentUser?.role)
    // Фильтрация по поисковой строке
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(member => 
        member.fullName?.toLowerCase().includes(search) ||
        member.email?.toLowerCase().includes(search) ||
        member.phone?.toLowerCase().includes(search) ||
        translateRole(member.role || '').toLowerCase().includes(search)
      );
    }
    
    // 🇷🇺 Фильтрация по роли (сравниваем русские переводы)
    if (filterRole.length > 0) {
      filtered = filtered.filter(member => {
        const russianRole = translateRole(member.role || '');
        return filterRole.includes(russianRole);
      });
    }
    
    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterRole]);

  const handleOpenModal = (member?: StaffMember) => {
    setForm(member ? { ...member } : defaultForm);
    setEditId(member?.id || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Очистка ошибки при изменении поля
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Обработчик для Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Очистка ошибки при изменении поля
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  // Обработчик для чекбоксов
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm({ ...form, [name]: checked });
  };
  
  // Обработчик для фильтра ролей
  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };
  
  // Валидация формы
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!form.fullName) errors.fullName = 'ФИО обязательно';
    if (!form.role) errors.role = 'Должность обязательна';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = 'Неверный формат email';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    // Валидация формы перед сохранением
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      if (editId) {
        await updateUser(editId, form);
        handleCloseModal();
      } else {
        // Создание нового сотрудника
        const newUser = await createUser(form);
        
        // Показываем персональный код для сотрудников
        if (newUser.personalCode) {
          setNewPersonalCode(newUser.personalCode);
          setShowCodeDialog(true);
        }
        
        handleCloseModal();
      }
      fetchStaff();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    if (!window.confirm('Удалить сотрудника?')) return;
    setSaving(true);
    try {
      await deleteUser(id);
      fetchStaff();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };

  const handleExportDownload = () => {
    exportStaffList(staff);
  };

  const handleExportEmail = async () => {
    try {
      await axios.post('/exports/staff', { action: 'email' });
      alert('Документ отправлен на почту администратора');
    } catch (e) {
      alert('Ошибка отправки на почту');
    }
  };

  return (
    <Paper style={{ margin: 24, padding: 24 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" style={{ color: '#1890ff', display: 'flex', alignItems: 'center' }}>
          <Person style={{ marginRight: 8 }} /> Сотрудники
        </Typography>
        <Box mb={2}>
          <ExportMenuButton
            onDownload={handleExportDownload}
            onSendEmail={handleExportEmail}
            label="Экспортировать"
          />
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />} 
          onClick={() => handleOpenModal()}
        >
          Добавить сотрудника
        </Button>
      </Box>
      
      {/* Поиск и фильтры */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
        <TextField
          placeholder="Поиск сотрудников..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: '200px' }}>
          <InputLabel id="role-filter-label">Фильтр по должности</InputLabel>
          <Select
            labelId="role-filter-label"
            multiple
            value={filterRole}
            onChange={handleFilterRoleChange}
            input={<OutlinedInput label="Фильтр по должности" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={value} size="small" />
                ))}
              </Box>
            )}
          >
            {availableRoles.map((role) => (
              <MenuItem key={role} value={role}>
                <Checkbox checked={filterRole.indexOf(role) > -1} />
                <ListItemText primary={role} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      
      {!loading && !error && (
        <>
          {filteredStaff.length === 0  ? (
            <Alert severity="info" style={{ marginTop: 16 }}>
              {staff.length === 0 ? 'Нет сотрудников. Добавьте первого сотрудника!' : 'Нет сотрудников, соответствующих критериям поиска.'}
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ФИО</TableCell>
                  <TableCell>Должность</TableCell>
                  <TableCell>Контакты</TableCell>
                  <TableCell>Пароль</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.fullName}</TableCell>
                    <TableCell>{translateRole(member.role || '')}</TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column">
                        {member.phone && (
                          <Box display="flex" alignItems="center">
                            <Phone fontSize="small" style={{ marginRight: 4, opacity: 0.6 }} />
                            {member.phone}
                          </Box>
                        )}
                        {member.email && (
                          <Box display="flex" alignItems="center">
                            <Email fontSize="small" style={{ marginRight: 4, opacity: 0.6 }} />
                            {member.email}
                          </Box>
                        )}
                      </Box>
                    </TableCell>{currentUser?.role === 'admin' ? (
                    <TableCell>{member.initialPassword || '—'}</TableCell>
  ) : (
    <TableCell>—</TableCell>
  )}
                    <TableCell>
                       <Chip 
                        label={member.active ? 'Активен' : 'Неактивен'} 
                        color={member.active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Редактировать">
                        <IconButton onClick={() => handleOpenModal(member)}>
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton onClick={() => handleDelete(member.id)}>
                          <Delete color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Модальное окно для добавления/редактирования */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            {editId ? (
              <>
                <Edit style={{ marginRight: 8 }} /> Редактирование сотрудника
              </>
            ) : (
              <>
                <Add style={{ marginRight: 8 }} /> Добавление нового сотрудника
              </>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Основная информация */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom>
                <Badge style={{ marginRight: 8 }} /> Основная информация
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="ФИО"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                fullWidth
                required
                error={!!formErrors.fullName}
                helperText={formErrors.fullName}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!formErrors.role}>
                <InputLabel>Должность</InputLabel>
                <Select
                  name="role"
                  value={translateRole(form.role || '')}
                  onChange={(e) => {
                    const russianRole = e.target.value as string;
                    const englishRole = getRoleByTranslation(russianRole);
                    setForm({ ...form, role: englishRole });
                  }}
                  label="Должность"
                >
                  {availableRoles.map(russianRole => (
                    <MenuItem key={russianRole} value={russianRole}>{russianRole}</MenuItem>
                  ))}
                </Select>
                {formErrors.role && <FormHelperText>{formErrors.role}</FormHelperText>}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email || ''}
                onChange={handleChange}
                fullWidth
                error={!!formErrors.email}
                helperText={formErrors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                label="Телефон"
                name="phone"
                value={form.phone || ''}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal} color="secondary">
            Отмена
          </Button>
          <Button onClick={handleSave} color="primary" variant="contained" disabled={saving}>
            {editId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Диалог отображения персонального кода */}
      <Dialog 
        open={showCodeDialog} 
        onClose={() => setShowCodeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center', bgcolor: 'primary.main', color: 'white' }}>
          🔑 Персональный код сотрудника
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Сотрудник успешно создан!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Персональный код для входа в систему:
            </Typography>
            
            <Box 
              sx={{ 
                p: 3, 
                bgcolor: 'grey.100', 
                borderRadius: 2, 
                border: '2px dashed #1976d2',
                my: 2
              }}
            >
              <Typography 
                variant="h4" 
                sx={{ 
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  letterSpacing: '0.5rem',
                  color: 'primary.main'
                }}
              >
                {newPersonalCode}
              </Typography>
            </Box>
            
            <Alert severity="info" sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="body2">
                📝 <strong>Важно:</strong><br/>
                • Передайте этот код сотруднику<br/>
                • Код используется для входа вместе с номером телефона<br/>
                • Сохраните код в безопасном месте
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              navigator.clipboard.writeText(newPersonalCode || '');
              alert('Код скопирован в буфер обмена!');
            }}
            variant="outlined"
          >
            📋 Копировать код
          </Button>
          <Button 
            onClick={() => setShowCodeDialog(false)} 
            variant="contained" 
            color="primary"
          >
            Понятно
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Staff;

