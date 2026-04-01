import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  getUsers,
  updateUser,
  deleteUser,
  usersApi,
  createUser,
} from '../services/users';
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
  TableSortLabel,
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
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { User as StaffMember, UserRole, STAFF_ROLES, EXTERNAL_ROLES } from '../../../shared/types/common';
import { getGroups } from '../../children/services/groups';
import { useAuth } from '../../../app/context/AuthContext';
import ExportButton from '../../../shared/components/ExportButton';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import { exportData } from '../../../shared/utils/exportUtils';
import { useSort } from '../../../shared/hooks/useSort';


const roleTranslations: Record<string, string> = {

  admin: 'Администратор',
  manager: 'Менеджер',
  director: 'Директор',


  teacher: 'Воспитатель',
  assistant: 'Помощник воспитателя',
  psychologist: 'Психолог',
  speech_therapist: 'Логопед',
  music_teacher: 'Музыкальный руководитель',
  physical_teacher: 'Инструктор по физкультуре',


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
  allowToSeePayroll: false,
};



const StaffRow = React.memo(({
  member,
  currentUser,
  translateRole,
  handleOpenModal,
  handleDelete,
  index
}: {
  member: any;
  currentUser: any;
  translateRole: (role: string) => string;
  handleOpenModal: (member: StaffMember) => void;
  handleDelete: (member: StaffMember) => void;
  index: number;
}) => {
  return (
    <TableRow key={member.id}>
      <TableCell style={{ fontWeight: 'bold', width: 50 }}>{index + 1}</TableCell>
      <TableCell>{member.fullName}</TableCell>
      <TableCell>{member.iin || '—'}</TableCell>
      <TableCell>{translateRole(member.role || '')}</TableCell>
      <TableCell>
        <Box display='flex' flexDirection='column'>
          {member.phone && (
            <Box display='flex' alignItems='center'>
              <Phone fontSize='small' style={{ marginRight: 4, opacity: 0.6 }} />
              {member.phone}
            </Box>
          )}
          {member.email && (
            <Box display='flex' alignItems='center'>
              <Email fontSize='small' style={{ marginRight: 4, opacity: 0.6 }} />
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
      <TableCell>
        {member.lastLogin
          ? new Date(member.lastLogin).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
          : '—'}
      </TableCell>
      <TableCell align='right'>
        <AuditLogButton entityType="staff" entityId={member._id} entityName={member.fullName} />
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
  );
});

const Staff = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StaffMember>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState<'active' | 'inactive' | 'external'>('active');
  const { user: currentUser } = useAuth();

  const [availableRoles, setAvailableRoles] = useState<string[]>([]);

  const handleSearchChange = (val: string) => {
    setLocalSearchTerm(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setSearchTerm(val);
    }, 500);
  };

  useEffect(() => {
    let roles: string[] = [];
    if (activeTab === 'external') {
      roles = EXTERNAL_ROLES.map(role => roleTranslations[role]).sort();
    } else {
      roles = STAFF_ROLES.map(role => roleTranslations[role]).sort();
    }
    setAvailableRoles(roles);
  }, [activeTab]);

  const fetchStaff = useCallback(() => {
    setLoading(true);
    setError(null);
    const includePasswords = currentUser?.role === 'admin';
    getUsers(includePasswords)
      .then((data) => {
        setStaff(data);
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

  const filteredStaff = useMemo(() => {
    if (!staff.length) return [];

    let filtered = staff;
    const externalRoles = EXTERNAL_ROLES;

    if (activeTab === 'external') {
      filtered = staff.filter((member) => externalRoles.includes(member.role as any));
    } else if (activeTab === 'inactive') {
      filtered = staff.filter((member) => member.active === false && !externalRoles.includes(member.role as any));
    } else {
      filtered = staff.filter((member) => member.active !== false && !externalRoles.includes(member.role as any));
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

    if (filterRole.length > 0) {
      filtered = filtered.filter((member) => {
        const russianRole = translateRole(member.role || '');
        return filterRole.includes(russianRole);
      });
    }

    return filtered;
  }, [staff, searchTerm, filterRole, activeTab]);

  const { items: sortedStaff, requestSort, sortConfig } = useSort(filteredStaff);

  const handleOpenModal = useCallback((member?: StaffMember) => {
    setForm(member ? { ...member, allowToSeePayroll: member.allowToSeePayroll || false } : defaultForm);
    setEditId(member?.id || null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleAccessControlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm((prevForm) => ({
      ...prevForm,
      accessControls: {
        ...(prevForm.accessControls || {}),
        [name]: checked
      }
    }));
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
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editId) {
        await updateUser(editId, form);
        await usersApi.updatePayrollSettings(editId, {
          salary: form.salary,
          salaryType: form.salaryType,
        });
        await usersApi.updateAllowToSeePayroll(editId, !!form.allowToSeePayroll);
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

  const handleDelete = useCallback(async (member: StaffMember) => {
    if (!member.id) return;
    if (!window.confirm('Удалить сотрудника?')) return;
    setSaving(true);
    try {
      await deleteUser(member.id);
      fetchStaff();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  }, [fetchStaff]);

  const handleExport = async (
    exportType: string,
    exportFormat: 'xlsx',
  ) => {
    const params = activeTab === 'external'
      ? { name: searchTerm, type: 'external' }
      : {
        name: searchTerm,
        role: filterRole.length > 0 ? filterRole : undefined,
        active: activeTab === 'active'
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
          <Box mb={2} display='flex' alignItems='center' gap={1}>
            <AuditLogButton entityType="staff" />
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
              if (activeTab === 'external') {
                setForm({ ...defaultForm, role: 'speech_therapist' as UserRole });
                setModalOpen(true);
              } else {
                handleOpenModal();
              }
            }}
          >
            {activeTab === 'external' ? 'Добавить специалиста' : 'Добавить сотрудника'}
          </Button>
        </Box>

        {/* Поиск и фильтры */}
        <Box mb={3} display='flex' flexWrap='wrap' gap={2} alignItems='center'>
          <TextField
            placeholder='Поиск сотрудников (быстрый поиск)...'
            variant='outlined'
            size='small'
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
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
              variant={activeTab === 'active' ? 'contained' : 'outlined'}
              color='success'
              size='small'
              onClick={() => {
                setActiveTab('active');
                setFilterRole([]);
              }}
            >
              Штат (Активные)
            </Button>
            <Button
              variant={activeTab === 'inactive' ? 'contained' : 'outlined'}
              color='error'
              size='small'
              onClick={() => {
                setActiveTab('inactive');
                setFilterRole([]);
              }}
            >
              Архив
            </Button>
            <Button
              variant={activeTab === 'external' ? 'contained' : 'outlined'}
              size='small'
              onClick={() => {
                setActiveTab('external');
                setFilterRole([]);
              }}
              sx={{
                backgroundColor: activeTab === 'external' ? '#FF9800' : 'transparent',
                color: activeTab === 'external' ? 'white' : '#FF9800',
                borderColor: '#FF9800',
                '&:hover': {
                  backgroundColor: activeTab === 'external' ? '#F57C00' : 'rgba(255, 152, 0, 0.1)',
                }
              }}
            >
              Внешние специалисты / Услуги
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
                    <TableCell style={{ fontWeight: 'bold', width: 50 }}>#</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'fullName'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('fullName')}
                      >
                        ФИО
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>ИИН</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'role'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('role')}
                      >
                        Должность
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Контакты</TableCell>
                    <TableCell>Пароль</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'lastLogin'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('lastLogin')}
                      >
                        Последняя активность
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align='right'>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedStaff.map((member, index) => (
                    <StaffRow
                      key={member.id || member._id}
                      member={member}
                      currentUser={currentUser}
                      translateRole={translateRole}
                      handleOpenModal={handleOpenModal}
                      handleDelete={handleDelete}
                      index={index}
                    />
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
                      const isExternal = EXTERNAL_ROLES.includes(form.role as any);

                      if (activeTab === 'external' || isExternal) {
                        return EXTERNAL_ROLES.map((role) => (
                          <MenuItem key={role} value={roleTranslations[role]}>
                            {roleTranslations[role]}
                          </MenuItem>
                        ));
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
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.allowToSeePayroll || false}
                      onChange={(e) =>
                        setForm({ ...form, allowToSeePayroll: e.target.checked })
                      }
                    />
                  }
                  label='Разрешить просмотр зарплаты'
                />
              </Grid>

              {/* Индивидуальные доступы */}
              {currentUser?.role === 'admin' && (
                <>
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant='subtitle1' gutterBottom>
                      <SettingsIcon style={{ marginRight: 8, verticalAlign: 'middle' }} /> Индивидуальные права доступа
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="canSeeChildren"
                          checked={form.accessControls?.canSeeChildren === true}
                          indeterminate={form.accessControls?.canSeeChildren === null || form.accessControls?.canSeeChildren === undefined}
                          onChange={handleAccessControlChange}
                        />
                      }
                      label='Раздел "Дети"'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="canSeeFood"
                          checked={form.accessControls?.canSeeFood === true}
                          indeterminate={form.accessControls?.canSeeFood === null || form.accessControls?.canSeeFood === undefined}
                          onChange={handleAccessControlChange}
                        />
                      }
                      label='Раздел "Склад и Питание"'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="canSeeRent"
                          checked={form.accessControls?.canSeeRent === true}
                          indeterminate={form.accessControls?.canSeeRent === null || form.accessControls?.canSeeRent === undefined}
                          onChange={handleAccessControlChange}
                        />
                      }
                      label='Раздел "Аренда"'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="canSeeStaff"
                          checked={form.accessControls?.canSeeStaff === true}
                          indeterminate={form.accessControls?.canSeeStaff === null || form.accessControls?.canSeeStaff === undefined}
                          onChange={handleAccessControlChange}
                        />
                      }
                      label='Раздел "Сотрудники"'
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="canSeeSettings"
                          checked={form.accessControls?.canSeeSettings === true}
                          indeterminate={form.accessControls?.canSeeSettings === null || form.accessControls?.canSeeSettings === undefined}
                          onChange={handleAccessControlChange}
                        />
                      }
                      label='Настройки организации'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mt: 1 }}>
                      Indeterminate статус (-) означает, что доступ определяется по умолчанию из должности сотрудника. Галочка дает доступ даже если по должности нельзя. Пустой квадрат - явно запрещает.
                    </Alert>
                  </Grid>
                </>
              )}
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
      </Paper >
    </>
  );
};

export default Staff;
