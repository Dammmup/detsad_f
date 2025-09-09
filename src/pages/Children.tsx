import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress, Alert,
  FormControl, InputLabel, Select, MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { getUsers, createUser, updateUser, deleteUser, User } from '../components/services/api/users';
import { getGroups, Group } from '../components/services/api/groups';

const defaultForm: Partial<User> = {
  fullName: '',
  birthday: '',
  parentPhone: '',
  notes: '',
  iin: '',
  groupId: '',
  parentName: '',
  type: 'child',
  active: true,
  phone: '', // для совместимости с API
  role: '', // для совместимости с API
};

const Children: React.FC = () => {
  const [children, setChildren] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<Partial<User>>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Загрузка детей
  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const users = await getUsers();
      setChildren(users.filter(u => u.type === 'child'));
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка групп
  const fetchGroupsList = async () => {
    try {
      const groupList = await getGroups();
      setGroups(groupList);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchGroupsList();
  }, []);

  const handleOpenModal = (child?: User) => {
    if (child) {
      setForm({
        ...defaultForm,
        ...child,
        fullName: child.fullName || '',
        phone: child.phone || '',
        role: '',
        iin: child.iin || '',
        groupId: child.groupId || '',
        parentName: child.parentName || '',
        parentPhone: child.parentPhone || '',
        birthday: child.birthday || '',
        notes: child.notes || '',
      });
      setEditId(child.id || child._id || null);
    } else {
      setForm(defaultForm);
      setEditId(null);
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
  };
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name!]: value });
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const data: User = {
        ...form,
        type: 'child',
        fullName: form.fullName || '',
        phone: form.parentPhone || '', // Для детей phone = parentPhone!
        parentPhone: form.parentPhone || '',
        birthday: form.birthday || '',
        iin: form.iin || '',
        groupId: form.groupId || '',
        parentName: form.parentName || '',
        notes: form.notes || '',
        role: 'null', // для детей
        active: form.active !== false,

      };
      console.log('Данные для отправки ребенка:', data);
      if (editId) {
        await updateUser(editId, data);
      } else {
        await createUser(data);
      }
      handleCloseModal();
      fetchChildren();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Удалить ребёнка?')) return;
    setLoading(true);
    try {
      await deleteUser(id);
      fetchChildren();
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления');
    } finally {
      setLoading(false);
    }
  };


  const findGroupById = (groupId: string | undefined): React.ReactNode => {
    const group = groups.find(group => group.id === groupId);
    return group ? group.name : 'Неизвестная группа';
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Список детей</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
          Добавить ребёнка
        </Button>
      </Box>
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ФИО</TableCell>
              <TableCell>Дата рождения</TableCell>
              <TableCell>Телефон родителя</TableCell>
              <TableCell>ИИН</TableCell>
              <TableCell>Группа</TableCell>
              <TableCell>Заметки</TableCell>
              <TableCell>Статус</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {children.map(child => (
              <TableRow key={child.id || child._id}>
                <TableCell>{child.fullName}</TableCell>
                <TableCell>
                  {child.birthday
                    ? new Date(child.birthday).toISOString().split("T")[0] // YYYY-MM-DD
                    : ""}
                </TableCell>
                <TableCell>{child.phone}</TableCell>
                <TableCell>{child.iin}</TableCell>
                <TableCell>{findGroupById(child.groupId)}</TableCell>
                <TableCell>{child.notes}</TableCell>
                <TableCell>{child.active ? 'Активен' : 'Неактивен'}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenModal(child)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(child.id || child._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Редактировать ребёнка' : 'Добавить ребёнка'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="fullName"
            label="ФИО"
            value={form.fullName}
            onChange={handleChange}
            fullWidth
            required
          />
          <TextField
            margin="dense"
            name="birthday"
            label="Дата рождения"
            type="date"
            value={form.birthday ? String(form.birthday).slice(0, 10) : ''}
            onChange={handleChange}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            margin="dense"
            name="parentPhone"
            label="Телефон родителя"
            value={form.parentPhone}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            name="iin"
            label="ИИН"
            value={form.iin}
            onChange={handleChange}
            fullWidth
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Группа</InputLabel>
            <Select
  name="groupId"
  value={form.groupId || ''}
  onChange={handleSelectChange}
  label="Группа"
>
  <MenuItem value="">Не выбрано</MenuItem>
  {groups.map((g) => (
    <MenuItem key={g.id || g._id} value={g.id || g._id}>{g.name}</MenuItem>
  ))}
</Select>
          </FormControl>
          <TextField
            margin="dense"
            name="parentName"
            label="ФИО родителя"
            value={form.parentName}
            onChange={handleChange}
            fullWidth
          />
          <TextField
            margin="dense"
            name="notes"
            label="Заметки"
            value={form.notes}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {editId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Children;
