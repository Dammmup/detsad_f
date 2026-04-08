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
  Avatar,
  useMediaQuery,
  TableContainer,
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
import { User as StaffMember } from '../../../shared/types/staff';
import { UserRole, STAFF_ROLES, EXTERNAL_ROLES, IExternalSpecialist } from '../../../shared/types/common';
import { UserRole as CommonUserRole } from '../../../shared/types/common';
import { getGroups } from '../../children/services/groups';
import { useAuth } from '../../../app/context/AuthContext';
import ExportButton from '../../../shared/components/ExportButton';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import { exportData } from '../../../shared/utils/exportUtils';
import { useSort } from '../../../shared/hooks/useSort';
import { useStaff } from '../../../app/context/StaffContext';
import { useGroups } from '../../../app/context/GroupsContext';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';
import { showSnackbar } from '../../../shared/components/Snackbar';


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
  rentAmount: 0,
  allowToSeePayroll: false,
  photo: '',
};



const StaffRow = React.memo(({
  member,
  currentUser,
  translateRole,
  handleOpenModal,
  handleDelete,
  index,
  isExternal
}: {
  member: any;
  currentUser: any;
  translateRole: (role: string) => string;
  handleOpenModal: (member: StaffMember) => void;
  handleDelete: (member: StaffMember) => void;
  index: number;
  isExternal?: boolean;
}) => {
  return (
    <TableRow key={member.id || member._id}>
      <TableCell style={{ fontWeight: 'bold', width: 50 }}>{index + 1}</TableCell>
      <TableCell>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar 
            src={member.photo || member.avatar} 
            sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '1rem' }}
          >
            {!(member.photo || member.avatar) && ((member.fullName || member.name)?.[0] || 'S')}
          </Avatar>
          {member.fullName || member.name}
        </Box>
      </TableCell>
      {!isExternal && <TableCell>{member.iin || '—'}</TableCell>}
      <TableCell>{translateRole(member.role || member.type || '')}</TableCell>
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
      {!isExternal && (
        <>
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
        </>
      )}
      <TableCell align='right'>
        <AuditLogButton entityType="staff" entityId={member._id || member.id} entityName={member.fullName || member.name} />
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

const StaffCard = React.memo(({
  member,
  handleOpenModal,
  handleDelete,
  currentUser,
  translateRole
}: any) => {
  const isExternal = member.type === 'external' || member.isExternal;

  return (
    <Paper sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #eee' }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Avatar 
          src={member.photo || member.avatar} 
          sx={{ width: 50, height: 50, bgcolor: 'primary.main' }}
        >
          {!(member.photo || member.avatar) && ((member.fullName || member.name)?.[0] || 'S')}
        </Avatar>
        <Box>
          <Typography variant="body1" fontWeight="bold">
            {member.fullName || member.name}
          </Typography>
          <Typography variant="caption" color="textSecondary" display="block">
            {translateRole(member.role || member.type || '')}
          </Typography>
          {!isExternal && (
            <Chip
              label={member.active ? 'Активен' : 'Неактивен'}
              size="small"
              color={member.active ? 'success' : 'default'}
              sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }}
            />
          )}
        </Box>
      </Box>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={2}>
        <Box>
          <Typography variant="caption" color="textSecondary" display="block">Телефон</Typography>
          <Typography variant="body2">{member.phone || '-'}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary" display="block">Email</Typography>
          <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{member.email || '-'}</Typography>
        </Box>
        {!isExternal && (
          <>
            <Box>
              <Typography variant="caption" color="textSecondary" display="block">ИИН</Typography>
              <Typography variant="body2">{member.iin || '-'}</Typography>
            </Box>
            {currentUser?.role === 'admin' && (
              <Box>
                <Typography variant="caption" color="textSecondary" display="block">Пароль</Typography>
                <Typography variant="body2">{member.initialPassword || '-'}</Typography>
              </Box>
            )}
          </>
        )}
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" pt={1.5} sx={{ borderTop: '1px solid #f0f0f0' }}>
        <AuditLogButton entityType="staff" entityId={member._id || member.id} entityName={member.fullName || member.name} />
        <Box display="flex" gap={1}>
          <IconButton size="small" onClick={() => handleOpenModal(member)} color="primary">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => handleDelete(member)} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
});

const Staff = () => {
  const isMobile = useMediaQuery('(max-width:640px)');
  const {
    staff: allStaff,
    loading: staffLoading,
    error: staffError,
    fetchStaff,
    createUser,
    updateUser,
    deleteUser,
    updatePayrollSettings,
    updateAllowToSeePayroll,
    // New fields
    externalSpecialists,
    fetchExternalSpecialists,
    createExternalSpecialist,
    updateExternalSpecialist,
    deleteExternalSpecialist
  } = useStaff();

  const {
    groups,
    loading: groupsLoading,
    fetchGroups
  } = useGroups();

  const loading = staffLoading || groupsLoading;
  const error = staffError;

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<StaffMember>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchStaff({ includePasswords: currentUser?.role === 'admin' });
    fetchExternalSpecialists();
    fetchGroups();
  }, [fetchStaff, fetchExternalSpecialists, fetchGroups, currentUser?.role]);

  const filteredStaff = useMemo(() => {
    if (!allStaff.length && !externalSpecialists.length) return [];

    let filtered: any[] = allStaff;
    const externalRoles = EXTERNAL_ROLES;

    if (activeTab === 'external') {
      filtered = externalSpecialists;
    } else if (activeTab === 'inactive') {
      filtered = allStaff.filter((member) => member.active === false && !externalRoles.includes(member.role as any));
    } else {
      filtered = allStaff.filter((member) => member.active !== false && !externalRoles.includes(member.role as any));
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
  }, [allStaff, externalSpecialists, searchTerm, filterRole, activeTab]);

  const { items: sortedStaff, requestSort, sortConfig } = useSort(filteredStaff);

  const handleOpenModal = useCallback((member?: any) => {
    if (member && !member.fullName && member.name) {
      member.fullName = member.name;
    }
    setForm(member ? { ...member, allowToSeePayroll: member.allowToSeePayroll || false } : defaultForm);
    setEditId(member?.id || member?._id || null);
    setModalOpen(true);
    setSaveError(null);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
    setSaveError(null);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'contactInfo') {
      setForm({ ...form, [name]: value, phone: value } as any);
    } else {
      setForm({ ...form, [name]: value });
    }
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();

      reader.onloadend = () => {
        setForm(prev => ({ ...prev, photo: reader.result as string }));
      };

      reader.readAsDataURL(file);
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
    const values = typeof value === 'string' ? value.split(',') : value;
    if (values.includes('all')) {
      setFilterRole([]);
    } else {
      setFilterRole(values);
    }
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
      if (activeTab === 'external') {
        const specialistData = {
          name: form.fullName,
          type: form.role as any,
          phone: form.phone || '',
          email: form.email || '',
          description: form.notes || '',
          rentAmount: form.rentAmount || 0,
          active: form.active
        };
        if (editId) {
          await updateExternalSpecialist(editId, specialistData);
        } else {
          await createExternalSpecialist(specialistData);
        }
        handleCloseModal();
        return;
      }

      if (editId) {
        await updateUser(editId, form);
        await updatePayrollSettings(editId, {
          salary: form.salary,
          salaryType: form.salaryType,
        });
        await updateAllowToSeePayroll(editId, !!form.allowToSeePayroll);
        handleCloseModal();
      } else {
        await createUser(form);
        handleCloseModal();
      }
    } catch (e: any) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = useCallback(async (member: any) => {
    const id = member.id || member._id;
    if (!id) return;
    if (!window.confirm('Вы уверены, что хотите удалить эту запись?')) return;
    setSaving(true);
    try {
      if (activeTab === 'external') {
        await deleteExternalSpecialist(id);
      } else {
        await deleteUser(id);
      }
    } catch (e: any) {
      showSnackbar({ message: getErrorMessage(e), type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [deleteUser, deleteExternalSpecialist, activeTab]);

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
          flexDirection={isMobile ? 'column' : 'row'}
          justifyContent='space-between'
          alignItems={isMobile ? 'stretch' : 'center'}
          gap={isMobile ? 2 : 0}
          mb={2}
        >
          <Typography
            variant={isMobile ? 'h6' : 'h5'}
            style={{ color: '#1890ff', display: 'flex', alignItems: 'center' }}
          >
            <Person style={{ marginRight: 8 }} /> Сотрудники
          </Typography>
          <Box display='flex' alignItems='center' gap={1} justifyContent={isMobile ? 'space-between' : 'flex-start'}>
            <AuditLogButton entityType="staff" />
            <ExportButton
              exportTypes={[{ value: 'staff', label: 'Список сотрудников' }]}
              onExport={handleExport}
            />
          </Box>
          <Button
            variant='contained'
            color='primary'
            fullWidth={isMobile}
            startIcon={<Add />}
            onClick={() => {
              if (activeTab === 'external') {
                setForm({ ...defaultForm, role: 'tenant' as UserRole });
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
        <Box mb={3} display='flex' flexDirection={isMobile ? 'column' : 'row'} flexWrap='wrap' gap={2} alignItems={isMobile ? 'stretch' : 'center'}>
          <TextField
            placeholder='Поиск сотрудников (быстрый поиск)...'
            variant='outlined'
            size='small'
            value={localSearchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            sx={{ flexGrow: 1, minWidth: isMobile ? '100%' : '200px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Search />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size='small' sx={{ minWidth: isMobile ? '100% ' : '200px' }}>
            <InputLabel id='role-filter-label'>Фильтр по должности</InputLabel>
            <Select
              labelId='role-filter-label'
              multiple
              value={filterRole}
              onChange={handleFilterRoleChange}
              input={<OutlinedInput label='Фильтр по должности' />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.length === 0 ? 'Все должности' : selected.map((value) => (
                    <Chip
                      key={value}
                      label={value}
                      size='small'
                      onDelete={() => setFilterRole(filterRole.filter(r => r !== value))}
                      onMouseDown={(e) => e.stopPropagation()}
                    />
                  ))}
                </Box>
              )}
            >
              <MenuItem value='all'>
                <em>Все должности</em>
              </MenuItem>
              {availableRoles.map((role) => (
                <MenuItem key={role} value={role}>
                  <Checkbox checked={filterRole.indexOf(role) > -1} />
                  <ListItemText primary={role} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Кнопки фильтрации по активности и арендаторам */}
          <Box display='flex' gap={1} flexWrap={isMobile ? 'wrap' : 'nowrap'}>
            <Button
              variant={activeTab === 'active' ? 'contained' : 'outlined'}
              color='success'
              size='small'
              fullWidth={isMobile}
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
              fullWidth={isMobile}
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
              fullWidth={isMobile}
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
              Внешние специалисты
            </Button>
          </Box>
        </Box>

        {loading && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}

        {!loading && !error && (
          <>
            {filteredStaff.length === 0 ? (
              <Alert severity='info' style={{ marginTop: 16 }}>
                {allStaff.length === 0
                  ? 'Нет сотрудников. Добавьте первого сотрудника!'
                  : 'Нет сотрудников, соответствующих критериям поиска.'}
              </Alert>
            ) : isMobile ? (
              <Box mt={2}>
                {sortedStaff.map((member) => (
                  <StaffCard
                    key={member.id || member._id}
                    member={member}
                    currentUser={currentUser}
                    translateRole={translateRole}
                    handleOpenModal={handleOpenModal}
                    handleDelete={handleDelete}
                  />
                ))}
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2, overflowX: 'auto' }}>
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
                          Сотрудник
                        </TableSortLabel>
                      </TableCell>
                      {activeTab !== 'external' && <TableCell>ИИН</TableCell>}
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
                      {activeTab !== 'external' && (
                        <>
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
                        </>
                      )}
                      <TableCell align='right'>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Array.isArray(sortedStaff) ? sortedStaff.map((member, index) => (
                      <StaffRow
                        key={member.id || member._id}
                        member={member}
                        currentUser={currentUser}
                        translateRole={translateRole}
                        handleOpenModal={handleOpenModal}
                        handleDelete={handleDelete}
                        index={index}
                        isExternal={activeTab === 'external'}
                      />
                    )) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">Список пуст или не удалось загрузить данные</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
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
                  <Edit style={{ marginRight: 8 }} /> {activeTab === 'external' ? 'Редактирование специалиста' : 'Редактирование сотрудника'}
                </>
              ) : (
                <>
                  <Add style={{ marginRight: 8 }} /> {activeTab === 'external' ? 'Добавление специалиста' : 'Добавление нового сотрудника'}
                </>
              )}
            </Box>
          </DialogTitle>
          <DialogContent>
            <FormErrorAlert error={saveError} onClose={() => setSaveError(null)} />
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* Фотография */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <Box sx={{ position: 'relative', textAlign: 'center' }}>
                    <Avatar
                      src={form.photo || form.avatar}
                      alt={form.fullName || 'Фото сотрудника'}
                      sx={{
                        width: 100,
                        height: 100,
                        mb: 1,
                        border: '2px solid #e0e0e0',
                        cursor: 'pointer',
                      }}
                    />
                    <input
                      accept='image/*'
                      id='staff-photo-upload'
                      type='file'
                      style={{ display: 'none' }}
                      onChange={handlePhotoChange}
                    />
                    <label htmlFor='staff-photo-upload'>
                      <Button variant='outlined' component='span' size='small'>
                        {form.photo || form.avatar ? 'Изменить фото' : 'Загрузить фото'}
                      </Button>
                    </label>
                  </Box>
                </Box>
              </Grid>

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
              {activeTab !== 'external' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label='ИИН'
                    name='iin'
                    value={form.iin || ''}
                    onChange={handleChange}
                    fullWidth
                  />
                </Grid>
              )}
              {activeTab === 'external' && (
                <Grid item xs={12} md={6}>
                  <TextField
                    label='Сумма аренды по умолчанию'
                    name='rentAmount'
                    type='number'
                    value={form.rentAmount === 0 ? '' : form.rentAmount}
                    onChange={(e) => setForm({ ...form, rentAmount: e.target.value === '' ? 0 : Number(e.target.value) })}
                    fullWidth
                    helperText="Используется для генерации расчетных листов"
                  />
                </Grid>
              )}
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
              {/* Поля для штатных сотрудников (только если не вкладка external) */}
              {activeTab !== 'external' && (
                <>
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
                </>
              )}

              {/* Поле описания для внешних специалистов */}
              {activeTab === 'external' && (
                <Grid item xs={12}>
                  <TextField
                    label='Описание / Заметки'
                    name='notes'
                    value={form.notes || ''}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>
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
