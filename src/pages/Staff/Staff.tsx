import React, { useEffect, useState, useCallback } from 'react';
import {
  getUsers,
  updateUser,
  deleteUser,
  usersApi,
  createUser,
} from '../../services/users';
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Tooltip,
  Chip,
  Divider,
  Box,
  Typography,
  OutlinedInput,
  SelectChangeEvent,
  Checkbox,
  ListItemText,
  FormControlLabel,
} from '@mui/material';
import {
  Edit,
  Delete,
  Add,
  Search,
  Email,
  Phone,
  Badge,
  Person,
} from '@mui/icons-material';
import { User as StaffMember, UserRole } from '../../types/common';
import { getGroups } from '../../services/groups';
import { useAuth } from '../../components/context/AuthContext';
import ExportButton from '../../components/ExportButton';
import { exportData } from '../../utils/exportUtils';


const roleTranslations: Record<string, string> = {

  admin: 'Администратор',
  manager: 'Менеджер',
  director: 'Директор',


  teacher: 'Воспитатель',
  assistant: 'Помощник воспитателя',
  psychologist: 'Психолог',
  speech_therapist: 'Логопед',
  music_teacher: 'Музыкальный руководитель',
  physical_education: 'Инструктор по физкультуре',


  nurse: 'Медсестра',
  doctor: 'Врач',


  cook: 'Повар',
  cleaner: 'Уборщица',
  security: 'Охранник',
  maintenance: 'Завхоз',
  laundry: 'Прачка',


  staff: 'Сотрудник',
  substitute: 'Подменный сотрудник',
  intern: 'Стажер',
  tenant: 'Арендатор',
};


const translateRole = (role: string): string => {
  return roleTranslations[role] || role;
};


const getRoleByTranslation = (translation: string): string => {
  const entry = Object.entries(roleTranslations).find(
    ([_, value]) => value === translation,
  );
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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showRentTab, setShowRentTab] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');
  const { user: currentUser } = useAuth();

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);


  useEffect(() => {
    const roles = showRentTab
      ? [roleTranslations['tenant']].sort()
      : Object.values(roleTranslations)
        .filter((role) => role !== roleTranslations['tenant'])
        .sort();
    setAvailableRoles(roles);
  }, [showRentTab]);

  const fetchStaff = useCallback(() => {
    setLoading(true);
    setError(null);
    const includePasswords = currentUser?.role === 'admin';
    getUsers(includePasswords)
      .then((data) => {
        setStaff(data);
        setFilteredStaff(data);
      })
      .catch((err) => setError(err?.message || 'Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [currentUser?.role]);


  const fetchGroups = async () => {
    try {
      await getGroups();
    } catch (err) {
      console.error('Ошибка при загрузке групп:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchGroups();
  }, [fetchStaff]);


  useEffect(() => {
    if (!staff.length) return;

    let filtered = staff;


    if (showRentTab) {
      filtered = staff.filter((member) => member.role === 'tenant');
    } else {

      filtered = staff.filter((member) => member.role !== 'tenant');


      if (activeFilter === 'active') {
        filtered = filtered.filter((member) => member.active !== false);
      } else {
        filtered = filtered.filter((member) => member.active === false);
      }


      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        filtered = filtered.filter(
          (member) =>
            member.fullName?.toLowerCase().includes(search) ||
            member.email?.toLowerCase().includes(search) ||
            member.phone?.toLowerCase().includes(search) ||
            translateRole(member.role || '')
              .toLowerCase()
              .includes(search),
        );
      }



      if (filterRole.length > 0 && !showRentTab) {
        filtered = filtered.filter((member) => {
          const russianRole = translateRole(member.role || '');
          return filterRole.includes(russianRole) && member.tenant !== true;
        });
      }
    }

    setFilteredStaff(filtered);
  }, [staff, searchTerm, filterRole, showRentTab, activeFilter, currentUser?.role]);

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


    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };


  const handleFilterRoleChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFilterRole(typeof value === 'string' ? value.split(',') : value);
  };


  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!form.fullName) errors.fullName = 'ФИО обязательно';
    if (!form.role) errors.role = 'Должность обязательна';
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = 'Неверный формат email';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {

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
        });
        handleCloseModal();
      } else {

        await createUser(form);
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

  const handleExport = async (
    exportType: string,
    exportFormat: 'excel',
  ) => {

    const params = showRentTab
      ? { name: searchTerm, type: 'tenant' }
      : {
        name: searchTerm,
        role: filterRole.length > 0 ? filterRole : undefined,
      };
    await exportData('staff', exportFormat, params);
  };

  return (
    <>
      <Paper style={{ margin: 24, padding: 24 }}>
        <Box
          display='flex'
          justifyContent='space-between'
          alignItems='center'
          mb={2}
        >
          <Typography
            variant='h5'
            style={{ color: '#1890ff', display: 'flex', alignItems: 'center' }}
          >
            <Person style={{ marginRight: 8 }} /> Сотрудники
          </Typography>
          <Box mb={2}>
            <ExportButton
              exportTypes={[{ value: 'staff', label: 'Список сотрудников' }]}
              onExport={handleExport}
            />
          </Box>
          <Button
            variant='contained'
            color='primary'
            startIcon={<Add />}
            onClick={() => {
              if (showRentTab) {

                setForm({ ...defaultForm, role: 'tenant' as UserRole });
                setModalOpen(true);
              } else {
                handleOpenModal();
              }
            }}
          >
            {showRentTab ? 'Добавить арендатора' : 'Добавить сотрудника'}
          </Button>
        </Box>

        {/* Поиск и фильтры */}
        <Box mb={3} display='flex' flexWrap='wrap' gap={2} alignItems='center'>
          <TextField
            placeholder='Поиск сотрудников...'
            variant='outlined'
            size='small'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flexGrow: 1, minWidth: '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size='small' sx={{ minWidth: '200px' }}>
            <InputLabel id='role-filter-label'>Фильтр по должности</InputLabel>
            <Select
              labelId='role-filter-label'
              multiple
              value={filterRole}
              onChange={handleFilterRoleChange}
              input={<OutlinedInput label='Фильтр по должности' />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} size='small' />
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

          {/* Кнопки фильтрации по активности и арендаторам */}
          <Box display='flex' gap={1}>
            <Button
              variant={!showRentTab && activeFilter === 'active' ? 'contained' : 'outlined'}
              color='success'
              size='small'
              onClick={() => {
                setShowRentTab(false);
                setActiveFilter('active');
              }}
            >
              Активные
            </Button>
            <Button
              variant={!showRentTab && activeFilter === 'inactive' ? 'contained' : 'outlined'}
              color='error'
              size='small'
              onClick={() => {
                setShowRentTab(false);
                setActiveFilter('inactive');
              }}
            >
              Неактивные
            </Button>
            <Button
              variant={showRentTab ? 'contained' : 'outlined'}
              size='small'
              onClick={() => {
                setShowRentTab(true);
                setFilterRole([]);
              }}
              sx={{
                backgroundColor: showRentTab ? '#FF9800' : 'transparent',
                color: showRentTab ? 'white' : '#FF9800',
                borderColor: '#FF9800',
                '&:hover': {
                  backgroundColor: showRentTab ? '#F57C00' : 'rgba(255, 152, 0, 0.1)',
                }
              }}
            >
              Арендаторы
            </Button>
          </Box>
        </Box>

        {loading && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}

        {!loading && !error && (
          <>
            {filteredStaff.length === 0 ? (
              <Alert severity='info' style={{ marginTop: 16 }}>
                {staff.length === 0
                  ? 'Нет сотрудников. Добавьте первого сотрудника!'
                  : 'Нет сотрудников, соответствующих критериям поиска.'}
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
                    <TableCell align='right'>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStaff.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.fullName}</TableCell>
                      <TableCell>{member.iin || '—'}</TableCell>
                      <TableCell>{translateRole(member.role || '')}</TableCell>
                      <TableCell>
                        <Box display='flex' flexDirection='column'>
                          {member.phone && (
                            <Box display='flex' alignItems='center'>
                              <Phone
                                fontSize='small'
                                style={{ marginRight: 4, opacity: 0.6 }}
                              />
                              {member.phone}
                            </Box>
                          )}
                          {member.email && (
                            <Box display='flex' alignItems='center'>
                              <Email
                                fontSize='small'
                                style={{ marginRight: 4, opacity: 0.6 }}
                              />
                              {member.email}
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      {currentUser?.role === 'admin' ? (
                        <TableCell>{member.initialPassword || '—'}</TableCell>
                      ) : (
                        <TableCell>—</TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={member.active ? 'Активен' : 'Неактивен'}
                          color={member.active ? 'success' : 'default'}
                          size='small'
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Tooltip title='Редактировать'>
                          <IconButton onClick={() => handleOpenModal(member)}>
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Удалить'>
                          <IconButton onClick={() => handleDelete(member)}>
                            <Delete color='error' />
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
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth='md'
          fullWidth
        >
          <DialogTitle>
            <Box display='flex' alignItems='center' flexDirection='row'>
              {editId ? (
                <>
                  <Edit style={{ marginRight: 8 }} /> Редактирование сотрудника
                </>
              ) : (
                <>
                  <Add style={{ marginRight: 8 }} /> Добавление нового
                  сотрудника
                </>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Основная информация */}
              <Grid item xs={12}>
                <Typography variant='subtitle1' gutterBottom>
                  <Badge style={{ marginRight: 8 }} /> Основная информация
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='ФИО'
                  name='fullName'
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
                    name='role'
                    value={translateRole(form.role || '')}
                    onChange={(e) => {
                      const russianRole = e.target.value as string;
                      const englishRole = getRoleByTranslation(russianRole);
                      setForm({
                        ...form,
                        role: englishRole as StaffMember['role'],
                      });
                    }}
                    label='Должность'
                  >
                    {(() => {


                      if (form.role === 'tenant') {
                        return (
                          <MenuItem
                            key={roleTranslations['tenant']}
                            value={roleTranslations['tenant']}
                          >
                            {roleTranslations['tenant']}
                          </MenuItem>
                        );
                      } else if (showRentTab) {

                        return (
                          <MenuItem
                            key={roleTranslations['tenant']}
                            value={roleTranslations['tenant']}
                          >
                            {roleTranslations['tenant']}
                          </MenuItem>
                        );
                      } else {
                        return availableRoles.map((russianRole) => (
                          <MenuItem key={russianRole} value={russianRole}>
                            {russianRole}
                          </MenuItem>
                        ));
                      }
                    })()}
                  </Select>
                  {formErrors.role && (
                    <FormHelperText>{formErrors.role}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Телефон'
                  name='phone'
                  value={form.phone || ''}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='ИИН'
                  name='iin'
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
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                    />
                  }
                  label='Активен'
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions>
            <Button onClick={handleCloseModal} color='secondary'>
              Отмена
            </Button>
            <Button
              onClick={handleSave}
              color='primary'
              variant='contained'
              disabled={saving}
            >
              {editId ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </>
  );
};

export default Staff;
