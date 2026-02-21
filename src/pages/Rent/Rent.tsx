import React, { useEffect, useState, useCallback } from 'react';
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
  Grid,
  Tooltip,
  Chip,
  Divider,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
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
import ExportButton from '../../shared/components/ExportButton';
import AuditLogButton from '../../shared/components/AuditLogButton';
import { exportData } from '../../shared/utils/exportUtils';
import {
  getExternalSpecialists,
  createExternalSpecialist,
  updateExternalSpecialist,
  deleteExternalSpecialist,
  ExternalSpecialist
} from '../../modules/reports/services/externalSpecialists';

const defaultForm: Partial<ExternalSpecialist> = {
  name: '',
  type: 'tenant',
  phone: '',
  email: '',
  description: '',
  active: true,
};

const Rent = () => {
  const [specialists, setSpecialists] = useState<ExternalSpecialist[]>([]);
  const [filteredSpecialists, setFilteredSpecialists] = useState<ExternalSpecialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<ExternalSpecialist>>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const fetchSpecialists = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getExternalSpecialists(false); // fetch all, including inactive
      const tenants = data.filter(s => s.type === 'tenant');
      setSpecialists(tenants);
      setFilteredSpecialists(tenants);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки арендаторов');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpecialists();
  }, [fetchSpecialists]);

  useEffect(() => {
    if (!specialists.length && !searchTerm) {
      setFilteredSpecialists([]);
      return;
    }

    let filtered = specialists;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (member) =>
          member.name?.toLowerCase().includes(search) ||
          member.email?.toLowerCase().includes(search) ||
          member.phone?.toLowerCase().includes(search)
      );
    }

    setFilteredSpecialists(filtered);
  }, [specialists, searchTerm]);

  const handleOpenModal = (member?: ExternalSpecialist) => {
    setForm(member ? { ...member } : defaultForm);
    setEditId(member?._id || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
    setFormErrors({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!form.name) errors.name = 'ФИО/Название обязательно';
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
        await updateExternalSpecialist(editId, form);
      } else {
        await createExternalSpecialist({ ...form, type: 'tenant' });
      }
      handleCloseModal();
      fetchSpecialists();
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (member: ExternalSpecialist) => {
    if (!member._id) {
      console.error('ID is undefined for deletion');
      return;
    }
    if (!window.confirm('Удалить арендатора?')) return;
    setSaving(true);
    try {
      await deleteExternalSpecialist(member._id);
      fetchSpecialists();
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
    await exportData('tenant', exportFormat, {
      name: searchTerm,
    });
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
            <Person style={{ marginRight: 8 }} /> Аренда
          </Typography>
          <Box mb={2}>
            <ExportButton
              exportTypes={[{ value: 'tenant', label: 'Список арендаторов' }]}
              onExport={handleExport}
            />
          </Box>
          <Box mb={2} sx={{ display: 'flex', gap: 1 }}>
            <AuditLogButton entityType="externalSpecialist" />
            <Button
              variant='contained'
              color='primary'
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
            >
              Добавить арендатора
            </Button>
          </Box>
        </Box>

        {/* Поиск */}
        <Box mb={3} display='flex' flexWrap='wrap' gap={2}>
          <TextField
            placeholder='Поиск арендаторов...'
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
        </Box>

        {loading && <CircularProgress />}
        {error && <Alert severity='error'>{error}</Alert>}

        {!loading && !error && (
          <>
            {filteredSpecialists.length === 0 ? (
              <Alert severity='info' style={{ marginTop: 16 }}>
                {specialists.length === 0
                  ? 'Нет арендаторов. Добавьте первого арендатора!'
                  : 'Нет арендаторов, соответствующих критериям поиска.'}
              </Alert>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ФИО / Название</TableCell>
                    <TableCell>Контакты</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell align='right'>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSpecialists.map((member) => (
                    <TableRow key={member._id}>
                      <TableCell>{member.name}</TableCell>
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
                  <Edit style={{ marginRight: 8 }} /> Редактирование арендатора
                </>
              ) : (
                <>
                  <Add style={{ marginRight: 8 }} /> Добавление нового
                  арендатора
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
                  label='ФИО / Название'
                  name='name'
                  value={form.name}
                  onChange={handleChange}
                  fullWidth
                  required
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
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
                  label='Email'
                  name='email'
                  value={form.email || ''}
                  onChange={handleChange}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position='start'>
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Описание / Примечание'
                  name='description'
                  value={form.description || ''}
                  onChange={handleChange}
                  fullWidth
                  multiline
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

export default Rent;
