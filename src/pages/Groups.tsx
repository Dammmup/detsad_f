import React, { useEffect, useState } from 'react';
import { useGroups } from '../components/context/GroupsContext';
import {
  Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, IconButton, MenuItem, Select, FormControl, InputLabel, FormHelperText, SelectChangeEvent
} from '@mui/material';
import { Edit, Delete, Add, Group, Check, CheckBox } from '@mui/icons-material';

import { Group as GroupData } from '../components/services/api/groups';
import { getUsers, User } from '../components/services/api/users';

interface TeacherOption {
  id: string;
  fullName: string;
}
const options=['1','2','3','4','5','6']
interface GroupFormData {
  id?: string;
  name: string;
  description: string;
  maxCapacity: number;
  ageGroup: string[];
  teacher?: string;
}

const defaultForm: GroupFormData = { 
  name: '', 
  description: '', 
  maxCapacity: 20, 
  ageGroup: [], // по умолчанию пустой массив
  teacher: '' // Обязательное поле для backend
};

const Groups = () => {
  const groupsContext = useGroups();
  const [groups, setGroups] = useState<any[]>([]);
  const [teacherList, setTeacherList] = useState<TeacherOption[]>([]); // [{id, fullName}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GroupFormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Загрузка групп при монтировании компонента
  useEffect(() => {
    fetchGroups();
    fetchTeachers();
  }, []);

  // Получение списка воспитателей
  const fetchTeachers = async () => {
    try {
      const users: User[] = await getUsers();
      const filtered = users.filter((u) => ['teacher', 'assistant'].includes(u.role));
      setTeacherList(filtered.map((u) => ({ id: u.id || (u as any)._id, fullName: u.fullName })));
    } catch (e) {
      setTeacherList([]);
    }
  };
  const teachers = teacherList.map((t) => t.fullName);

  // Получение списка групп
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Запрашиваю список групп...');
      const data = await groupsContext.fetchGroups(true);
      console.log('Получены данные групп:', data);
      
      // Преобразуем данные, если нужно
      // Приводим к типу Group
      const formattedData: GroupData[] = Array.isArray(data)
        ? data.map(group => ({
            id: group.id || group._id,
            name: group.name,
            description: group.description || '',
            ageGroup: Object(group.ageGroup || ''),
            maxCapacity: group.maxCapacity || group.maxStudents || 0,
            isActive: group.isActive ?? true,
            teacher: typeof group.teacher === 'object' ? (group.teacher.id as any || group.teacher._id as any) : String(group.teacher || ''),
            // isActive: group.isActive, // убрано, если не используется в UI
            // createdBy: group.createdBy, // убрано, если не используется в UI
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            maxStudents: group.maxStudents
          }))
        : [];
      
      console.log('Отформатированные данные:', formattedData);
      setGroups(formattedData);
    } catch (err: any) {
      console.error('Ошибка при загрузке групп:', err);
      setError(err?.message || 'Ошибка загрузки групп');
    } finally {
      setLoading(false);
    }
  };

  // Открытие модального окна для добавления/редактирования
  const handleOpenModal = (group?: any) => {
    if (group) {
      setForm({
        id: group.id,
        name: group.name,
        description: group.description || '',
        maxCapacity: group.maxCapacity || 20,
        ageGroup: Array.isArray(group.ageGroup) ? group.ageGroup : typeof group.ageGroup === 'string' ? [group.ageGroup] : [],
        teacher: group.teacher
      });
      setEditId(group.id);
    } else {
      setForm(defaultForm);
      setEditId(null);
    }
    setModalOpen(true);
  };

  // Закрытие модального окна
  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
  };

  // Обработка изменений в форме для текстовых полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setForm({ ...form, [name]: value });
    }
  };

  // Обработка изменений в форме для Select
  const handleSelectChange = (e: SelectChangeEvent<string[]>) => {
    const { name, value } = e.target;
    if (name) {
      setForm({ ...form, [name]: typeof value === 'string' ? value.split(',') : value });
    }
  };

  // Сохранение группы (создание или обновление)
  const handleSave = async () => {
    setSaving(true);
    try {
      // Подготавливаем данные для backend
      const groupData = {
        name: form.name,
        description: form.description,
        maxStudents: form.maxCapacity, // backend ожидает maxStudents, а не maxCapacity
        ageGroup: form.ageGroup, // теперь массив строк
        teacher: form.teacher, // теперь это id выбранного воспитателя
        isActive: true
      };
      
      console.log('📤 Отправляю данные группы на backend:', groupData);
      
      if (editId) {
        await groupsContext.updateGroup(editId, groupData);
      } else {
        await groupsContext.createGroup(groupData);
      }
      handleCloseModal();
      fetchGroups();
    } catch (e: any) {
      console.error('❌ Ошибка сохранения группы:', e);
      alert(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  // Удаление группы
  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Удалить группу?')) return;
    setSaving(true);
    try {
      await groupsContext.deleteGroup(id);
      fetchGroups();
    } catch (e: any) {
      alert(e?.message || 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper style={{ margin: 24, padding: 24 }}>
      <h1 style={{ color: '#1890ff', marginBottom: '16px' }}>
        <Group style={{ marginRight: 8, verticalAlign: 'middle' }} />
        Группы
      </h1>
      <Button 
        variant="contained" 
        color="primary" 
        startIcon={<Add />} 
        style={{ marginBottom: 16 }} 
        onClick={() => handleOpenModal()}
      >
        Добавить группу
      </Button>
      
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      
      {!loading && !error && (
        <>
          {groups.length === 0 ? (
            <Alert severity="info" style={{ marginTop: 16 }}>Группы не найдены. Добавьте первую группу!</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Описание</TableCell>
                  <TableCell>Возрастная группа</TableCell>
                  <TableCell>Вместимость</TableCell>
                  <TableCell>Воспитатель</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>{group.name}</TableCell>
                    <TableCell>{group.description}</TableCell>
                    <TableCell>{group.ageGroup.join(', ')}</TableCell>
                    <TableCell>{group.maxCapacity}</TableCell>
                    <TableCell>{teacherList.find(t => t.id === group.teacher)?.fullName || '—'}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => handleOpenModal(group)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(group.id)}>
                        <Delete color="error" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </>
      )}

      {/* Модальное окно для добавления/редактирования группы */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editId ? 'Редактировать' : 'Добавить'} группу
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Название группы"
            type="text"
            name="name"
            fullWidth
            value={form.name}
            onChange={handleChange}
          />
          <TextField
            margin="dense"
            label="Описание"
            type="text"
            name="description"
            fullWidth
            value={form.description}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Возрастная группа</InputLabel>
            <Select
              value={form.ageGroup}
              label="Возрастная группа"
              name="ageGroup"
              onChange={handleSelectChange}
              multiple
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            margin="normal"
            label="Вместимость"
            type="number"
            name="maxCapacity"
            fullWidth
            value={form.maxCapacity}
            onChange={handleChange}
          />
          {teachers.length > 0 && (
          <FormControl fullWidth margin="dense">
            <InputLabel>Воспитатель</InputLabel>
            <Select
              value={form.teacher || ''}
              label="Воспитатель"
              name="teacher"
              onChange={handleSelectChange as any}
            >
              {teacherList.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>
              ))}
            </Select>
          </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            color="primary" 
            disabled={saving || !form.name}
          >
            {editId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Groups;
