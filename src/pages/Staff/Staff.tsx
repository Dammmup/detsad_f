import React, { useEffect, useState, useCallback } from 'react';
import { getUsers, updateUser, deleteUser, usersApi } from '../../services/users';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Alert, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField, IconButton, InputAdornment, FormControl,
  InputLabel, Select, MenuItem, FormHelperText, Grid, Tooltip, Chip, Divider, Box, Typography,
  OutlinedInput, SelectChangeEvent, Checkbox, ListItemText, FormControlLabel
} from '@mui/material';
import { 
  Edit, Delete, Add, Search, Email, Phone, Badge, 
 Person
} from '@mui/icons-material';
import { User as StaffMember, UserRole } from '../../types/common';
import { getGroups } from '../../services/groups';
import { useAuth } from '../../components/context/AuthContext';
import ExportMenuButton from '../../components/ExportMenuButton';
import { exportStaffList } from '../../utils/excelExport';
import { apiClient } from '../../utils/api';

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
  _id: '',
 id: '',
  phone: '',
  fullName: '',
  role: 'staff' as UserRole,
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  salaryType: 'day',
  salary: 0,
  penaltyType: 'fixed',
  penaltyAmount: 0
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
  const { user: currentUser } = useAuth();
  // 🇷🇺 Список доступных ролей на русском языке (автоматически из переводов)
  const availableRoles = Object.values(roleTranslations).sort();
  
  const fetchStaff = useCallback(() => {
    setLoading(true);
    setError(null);
    const includePasswords = currentUser?.role === 'admin';
    getUsers(includePasswords)
      .then(data => {
setStaff(data);
        setFilteredStaff(data);
      })
      .catch(err => setError(err?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [currentUser?.role]);
  
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
  }, [fetchStaff]);
  
  // Фильтрация сотрудников при изменении поисковой строки или фильтра ролей
  useEffect(() => {
    if (!staff.length) return;
    
    let filtered = staff.filter(member => member.role !== 'rent');
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
  }, [staff, searchTerm, filterRole,currentUser?.role]);

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
        await usersApi.updatePayrollSettings(editId, {
          salary: form.salary,
          salaryType: form.salaryType,
          penaltyType: form.penaltyType,
          penaltyAmount: form.penaltyAmount
        });
        handleCloseModal();
      } else {
        // Создание нового сотрудника
        handleCloseModal();
      }
      fetchStaff();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member: StaffMember) => {
    if (!member.id) {
      console.error('ID is undefined for deletion');
      return;
    }
    if (!window.confirm('Удалить сотрудника?')) return;
    setSaving(true);
    try {
      console.log('Attempting to delete user with ID:', member.id);
      await deleteUser(member.id);
      fetchStaff();
    } catch (e: any) {
      console.error('Error during deletion:', e);
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
      await apiClient.post('/exports/staff', { action: 'email' });
      alert('Документ отправлен на почту администратора');
    } catch (e) {
      alert('Ошибка отправки на почту');
    }
  };

  return (
    <>
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
      
      {/* Вкладки для активных и неактивных сотрудников */}
      <Box mb={3} display="flex" gap={1}>
        <Button
          variant={filterRole.length === 0 && searchTerm === '' ? "contained" : "outlined"}
          onClick={() => {setFilterRole([]); setSearchTerm('');}}
        >
          Все
        </Button>
        <Button
          variant={!searchTerm && filterRole.length === 0 && filteredStaff.some(m => m.active) ? "contained" : "outlined"}
          onClick={() => {
            setFilterRole([]);
            setSearchTerm('');
            setTimeout(() => {
              const activeStaff = staff.filter(member => member.active);
              setFilteredStaff(activeStaff);
            }, 0);
          }}
        >
          Активные
        </Button>
        <Button
          variant={!searchTerm && filterRole.length === 0 && filteredStaff.some(m => !m.active) ? "contained" : "outlined"}
          onClick={() => {
            setFilterRole([]);
            setSearchTerm('');
            setTimeout(() => {
              const inactiveStaff = staff.filter(member => !member.active);
              setFilteredStaff(inactiveStaff);
            }, 0);
          }}
        >
          Неактивные
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
                  <TableCell>ИИН</TableCell>
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
                    <TableCell>{member.iin || '—'}</TableCell>
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
                        <IconButton onClick={() => handleDelete(member)}>
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
          <Box display="flex" alignItems="center" flexDirection='row'>
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
                    setForm({ ...form, role: englishRole as StaffMember['role'] });
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
            <Grid item xs={12} md={6}>
              <TextField
                label="ИИН"
                name="iin"
                value={form.iin || ''}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.active}
                    onChange={(e) => setForm({...form, active: e.target.checked})}
                  />
                }
                label="Активен"
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

    </Paper>
    </>
  );
};

export default Staff;

