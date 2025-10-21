import React, { useEffect, useState, useCallback } from 'react';
import {
  Paper, Button, Table, TableHead, TableRow, TableCell, TableBody,
    IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  Alert, CircularProgress, Typography, Box
} from '@mui/material';
import { Add, Edit, Delete, Group, Visibility, ExpandLess } from '@mui/icons-material';
import { useGroups } from '../../components/context/GroupsContext';
import  { Child } from '../../services/children';
// User импорт не нужен для детей
import { useAuth } from '../../components/context/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import { getChildrenByGroup } from '../../services';
interface TeacherOption {
  id: string;
  fullName: string;
}
const options=['1','2','3','4','5','6']
interface GroupFormData {
  id?: string;
  name: string;
  description: string;
  maxStudents: number;
  ageGroup: string[];
  teacher?: string;
}

const defaultForm: GroupFormData = { 
  name: '', 
  description: '', 
  maxStudents: 20, 
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

  // Состояние для разворачивания групп с детьми
  const [expandedGroups, setExpandedGroups] = useState<{
    [groupId: string]: {
      expanded: boolean;
  children: Child[];
      loading: boolean;
    };
  }>({});

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const fetchTeachers = async () => {
    try {
  // Для учителей оставляем getUsers, для детей используем Child
  const users = await import('../../services/users').then(m => m.getUsers());
  const filtered = users.filter((u: any) => ['teacher', 'assistant'].includes(u.role as any));
  setTeacherList(filtered.map((u: any) => ({ id: u.id || u._id, fullName: u.fullName })));
    } catch (e) {
      setTeacherList([]);
    }
  };
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
      const formattedData: any[] = Array.isArray(data)
        ? data.map(group => ({
            id: group.id || group._id,
            name: group.name,
            description: group.description || '',
            ageGroup: Object(group.ageGroup || ''),
            isActive: group.isActive ?? true,
            teacher: typeof group.teacher === 'object' && group.teacher !== null ? ((group.teacher as any).id || (group.teacher as any)._id || '') : String(group.teacher || ''),
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
  
  const fetchGroupsCallback = useCallback(fetchGroups, [groupsContext]);
  
  // Загрузка групп только после успешной авторизации
  useEffect(() => {
    if (isLoggedIn && currentUser && !authLoading) {
      console.log('User authenticated, loading groups and teachers...');
      fetchGroupsCallback();
      fetchTeachers();
    }
  }, [isLoggedIn, currentUser, authLoading, fetchGroupsCallback]);

  // Получение списка воспитателей

  const teachers = teacherList.map((t) => t.fullName);



  // Открытие модального окна для добавления/редактирования
  const handleOpenModal = (group?: any) => {
    if (group) {
      setForm({
        id: group.id,
        name: group.name,
        description: group.description || '',
        maxStudents: group.maxStudents || 20,
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
        maxStudents: form.maxStudents, // backend ожидает maxStudents, а не maxStudents
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

  // Обработка клика на "глазок" для разворачивания/сворачивания группы
  const handleToggleGroupChildren = async (event: React.MouseEvent<HTMLElement>, groupId: string) => {
    event.preventDefault();
    event.stopPropagation();
    
    const currentState = expandedGroups[groupId];
    
    if (currentState?.expanded) {
      // Сворачиваем группу
      setExpandedGroups(prev => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          expanded: false
        }
      }));
    } else {
      // Разворачиваем группу
      setExpandedGroups(prev => ({
        ...prev,
        [groupId]: {
          expanded: true,
          children: currentState?.children || [],
          loading: !currentState?.children?.length
        }
      }));

      // Загружаем детей, если они еще не загружены
      if (!currentState?.children?.length) {
        try {
          const children = await getChildrenByGroup(groupId);
          setExpandedGroups(prev => ({
            ...prev,
            [groupId]: {
              expanded: true,
              children,
              loading: false
            }
          }));
        } catch (error) {
          console.error('Ошибка при загрузке детей группы:', error);
          setExpandedGroups(prev => ({
            ...prev,
            [groupId]: {
              expanded: true,
              children: [],
              loading: false
            }
          }));
        }
      }
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
                  <React.Fragment key={group.id}>
                    <TableRow>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.description}</TableCell>
                      <TableCell>{Array.isArray(group.ageGroup) ? group.ageGroup.join(', ') : String(group.ageGroup)}</TableCell>
                      <TableCell>{group.maxStudents}</TableCell>
                      <TableCell>{teacherList.find(t => t.id === group.teacher)?.fullName || '—'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={(e) => handleToggleGroupChildren(e, group.id)}
                          title="Просмотреть детей группы"
                        >
                          {expandedGroups[group.id]?.expanded ? <ExpandLess color="primary" /> : <Visibility color="primary" />}
                        </IconButton>
                        <IconButton onClick={() => handleOpenModal(group)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(group.id)}>
                          <Delete color="error" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {/* Разворачивающаяся строка с детьми */}
                    {expandedGroups[group.id]?.expanded && (
                      <TableRow>
                        <TableCell colSpan={6} sx={{ paddingTop: 0, paddingBottom: 0 }}>
                          <Box sx={{ margin: 1 }}>
                            <Typography variant="h6" gutterBottom component="div" sx={{ color: '#1890ff' }}>
                              Дети группы "{group.name}"
                            </Typography>
                            {expandedGroups[group.id]?.loading ? (
                              <Box display="flex" justifyContent="center" alignItems="center" py={2}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" sx={{ ml: 2 }}>
                                  Загрузка детей...
                                </Typography>
                              </Box>
                            ) : expandedGroups[group.id]?.children?.length === 0 ? (
                              <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                                В группе нет детей
                              </Typography>
                            ) : (
                              <Table size="small" sx={{ backgroundColor: '#f8f9fa' }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell><strong>Имя ребенка</strong></TableCell>
                                    <TableCell><strong>Родитель</strong></TableCell>
                                    <TableCell><strong>Телефон</strong></TableCell>
                                    <TableCell><strong>Дата рождения</strong></TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {expandedGroups[group.id]?.children?.map((child, index) => (
                                    <TableRow key={child.id || index}>
                                      <TableCell>{child.fullName}</TableCell>
                                      <TableCell>{child.parentName || '—'}</TableCell>
                                      <TableCell>{child.parentPhone || '—'}</TableCell>
                                      <TableCell>
                                        {child.birthday
                                          ? new Date(child.birthday).toLocaleDateString('ru-RU')
                                          : '—'
                                        }
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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
            name="maxStudents"
            fullWidth
            value={form.maxStudents}
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
