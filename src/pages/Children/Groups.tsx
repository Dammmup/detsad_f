import React, { useEffect, useState, useCallback } from 'react';
import {
  Paper,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Typography,
  Box,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group,
  Visibility,
  ExpandLess,
} from '@mui/icons-material';
import { useGroups } from '../../components/context/GroupsContext';
import { Child } from '../../types/common';
// User импорт не нужен для детей
import { useAuth } from '../../components/context/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import apiClient from '../../utils/api';
import ExportButton from '../../components/ExportButton';
// import { getChildrenByGroup } from '../../services'; // больше не используем отдельный маршрут, берём детей из /groups

// Определяем интерфейс для группы с возможными свойствами
interface Group {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  ageGroup?: string | string[];
  isActive?: boolean;
  teacher?: string;
  teacherId?: string;
  createdAt?: string;
  updatedAt?: string;
  maxStudents?: number;
  children?: Child[];
}

interface TeacherOption {
  id: string;
  fullName: string;
}
const options = ['1', '2', '3', '4', '5', '6'];
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
  teacher: '', // Обязательное поле для backend
};

const Groups = () => {
  const groupsContext = useGroups();
  const [groups, setGroups] = useState<Group[]>([]);
  const [teacherList, setTeacherList] = useState<TeacherOption[]>([]); // [{id, fullName}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GroupFormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Состояние для отслеживания первоначальной загрузки
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Состояние для разворачивания групп с детьми
  const [expandedGroups, setExpandedGroups] = useState<{
    [groupId: string]: {
      expanded: boolean;
      children: Child[];
      loading: boolean;
    };
  }>({});

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();

  const handleExport = async (
    _exportType: string, // Переменная _exportType не используется, но сохраняем для совместимости сигнатуры
    exportFormat: 'pdf' | 'excel' | 'csv',
  ) => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        '/export/groups',
        { format: exportFormat },
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `groups.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      setError(e?.message || 'Ошибка экспорта');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      // Для учителей оставляем getUsers, для детей используем Child
      const { getUsers } = await import('../../services/users');
      const users = await getUsers();
      const filtered = users.filter((u: any) =>
        ['teacher', 'assistant'].includes(u.role as any),
      );
      setTeacherList(
        filtered.map((u: any) => ({ id: u.id || u._id, fullName: u.fullName })),
      );
    } catch (e) {
      setTeacherList([]);
    }
  };
  // Получение списка групп
  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await groupsContext.fetchGroups(true);

      // Преобразуем данные, если нужно
      const formattedData = Array.isArray(data)
        ? data.map((group) => ({
            id: group.id || group._id,
            name: group.name,
            description: group.description || '',
            // backend хранит ageGroup как строку; в UI используем массив для multiple UI
            ageGroup: Array.isArray(group.ageGroup)
                ? [String(group.ageGroup)]
                : [],
            isActive: group.isActive ?? true,
            // сервер хранит teacherId; приводим к строке id
            teacher: group.teacher || (group.teacherId ? String(group.teacherId) : ''),
            // isActive: group.isActive, // убрано, если не используется в UI
            // createdBy: group.createdBy, // убрано, если не используется в UI
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
            maxStudents: group.maxStudents,
            // добавляем детей, если backend их уже вернул
            children: group.children || [],
          }))
        : [];

      setGroups(formattedData);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки групп');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupsCallback = useCallback(fetchGroups, [groupsContext]);

  // Загрузка групп только после успешной авторизации
 useEffect(() => {
    (async () => {
      if (isLoggedIn && currentUser && !authLoading) {
        if (process.env.NODE_ENV !== 'production')
          console.log('User authenticated, loading groups and teachers...');
        await fetchGroupsCallback();
        await fetchTeachers();
      }
    })();
  }, [isLoggedIn, currentUser, authLoading, fetchGroupsCallback]);

  // Улучшенная обработка состояния загрузки
  useEffect(() => {
    // Когда данные загружены, устанавливаем флаг завершения первоначальной загрузки
    if (!loading && !initialLoadComplete) {
      setInitialLoadComplete(true);
    }
  }, [loading, initialLoadComplete]);

  // Получение списка воспитателей

  // Создаем карту для быстрого поиска воспитателей по id
  const teacherMap = new Map(teacherList.map((t) => [t.id, t.fullName]));

  // Открытие модального окна для добавления/редактирования
    const handleOpenModal = (group?: Group) => {
      if (group) {
        setForm({
          id: group.id,
          name: group.name,
          description: group.description || '',
          maxStudents: group.maxStudents || 20,
          ageGroup: Array.isArray(group.ageGroup)
            ? group.ageGroup
            : typeof group.ageGroup === 'string'
              ? [group.ageGroup]
              : [],
          teacher: group.teacher || group.teacherId || '',
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
    setSaving(false); // Сбрасываем состояние сохранения
  };

  // Обработка изменений в форме для текстовых/числовых полей
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setForm((prev) => ({
        ...prev,
        [name]: name === 'maxStudents' ? Number(value) : value,
      }));
    }
  };

  // Обработка изменений в Select для ageGroup (multiple)
  const handleAgeGroupChange = (e: SelectChangeEvent<unknown>) => {
    const { value } = e.target;
    const arr = typeof value === 'string' ? value.split(',') : value as string[];
    setForm((prev) => ({ ...prev, ageGroup: arr }));
  };

  // Обработка изменений в Select для teacher (single)
  const handleTeacherChange = (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, teacher: value }));
  };

  // Сохранение группы (создание или обновление)
  const handleSave = async () => {
    setSaving(true);
    try {
      // Подготавливаем данные для backend
      const groupData = {
        name: form.name,
        description: form.description,
        maxStudents: Number(form.maxStudents) || 0, // число
        // в UI держим массив строк; конвертацию в строку делает сервис groups
        ageGroup: Array.isArray(form.ageGroup) ? form.ageGroup : [],
        // backend ждёт строку id; сервис преобразует без изменений
        teacher:
          typeof form.teacher === 'string'
            ? form.teacher
            : String(form.teacher || ''),
        isActive: true,
      };

      if (editId) {
        await groupsContext.updateGroup(editId, groupData);
      } else {
        await groupsContext.createGroup(groupData);
      }
      // Успешное сохранение: закрываем модальное окно и обновляем список
      handleCloseModal();
      await fetchGroups();
    } catch (e: any) {
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
      await fetchGroups();
    } catch (e: any) {
      alert(e?.message || 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };

  // Обработка клика на "глазок" для разворачивания/сворачивания группы
  const handleToggleGroupChildren = async (
    event: React.MouseEvent<HTMLElement>,
    groupId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const currentState = expandedGroups[groupId];

    if (currentState?.expanded) {
      // Сворачиваем группу
      setExpandedGroups((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          expanded: false,
        },
      }));
    } else {
      // Разворачиваем группу
      setExpandedGroups((prev) => ({
        ...prev,
        [groupId]: {
          expanded: true,
          children: currentState?.children || [],
          loading: !currentState?.children?.length,
        },
      }));

      // Загружаем детей, если они еще не загружены
      if (!currentState?.children?.length) {
        try {
          // сначала пробуем взять детей из уже загруженных групп
          const group = groups.find((g) => g.id === groupId);
          let children: Child[] = (group && (group as any).children) || [];
          if (!children.length) {
            // если в списке нет детей, запрашиваем полные данные группы
            const fullGroup = await groupsContext.getGroup(groupId);
            children = ((fullGroup as any).children || []) as Child[];
          }
          setExpandedGroups((prev) => ({
            ...prev,
            [groupId]: {
              expanded: true,
              children,
              loading: false,
            },
          }));
        } catch (error) {
          console.error('Ошибка при загрузке детей группы:', error);
          setExpandedGroups((prev) => ({
            ...prev,
            [groupId]: {
              expanded: true,
              children: [],
              loading: false,
            },
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
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <ExportButton
          exportTypes={[{ value: 'groups', label: 'Список групп' }]}
          onExport={handleExport}
        />
        <Button
          variant='contained'
          color='primary'
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
        >
          Добавить группу
        </Button>
      </Box>

      {/* Улучшенная обработка загрузки: показываем данные даже при загрузке, если они уже есть */}
      {loading && !initialLoadComplete && (
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='200px'
          width='100%'
        >
          <CircularProgress size={60} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
      
      {/* Показываем данные сразу, если они уже загружены или есть в кэше */}
      {(!loading || initialLoadComplete) && !error && (
        <>
          {groups.length === 0 ? (
            <Alert severity='info' style={{ marginTop: 16 }}>
              Группы не найдены. Добавьте первую группу!
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow hover>
                  <TableCell>Название</TableCell>
                  <TableCell>Описание</TableCell>
                  <TableCell>Возрастная группа</TableCell>
                  <TableCell>Вместимость</TableCell>
                  <TableCell>Воспитатель</TableCell>
                  <TableCell align='right'>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {groups.map((group) => (
                  <React.Fragment key={group.id}>
                    <TableRow hover>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>{group.description}</TableCell>
                      <TableCell>
                        {group.ageGroup && Array.isArray(group.ageGroup)
                          ? group.ageGroup.join(', ')
                          : group.ageGroup
                            ? String(group.ageGroup)
                            : ''}
                      </TableCell>
                      <TableCell>{group.maxStudents}</TableCell>
                      <TableCell>
                        {group.teacher ? teacherMap.get(group.teacher) || '—' : '—'}
                      </TableCell>
                      <TableCell align='right'>
                        <IconButton
                          onClick={(e) =>
                            handleToggleGroupChildren(e, group.id!)
                          }
                          title='Просмотреть детей группы'
                        >
                          {group.id && expandedGroups[group.id]?.expanded ? (
                            <ExpandLess color="primary" />
                          ) : (
                            <Visibility color="primary" />
                          )}
                        </IconButton>
                        <IconButton onClick={() => handleOpenModal(group)}>
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(group.id!)}>
                          <Delete color='error' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    {/* Разворачивающаяся строка с детьми */}
                    {group.id && expandedGroups[group.id]?.expanded && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          sx={{ paddingTop: 0, paddingBottom: 0 }}
                        >
                          <Box sx={{ margin: 1 }}>
                            <Typography
                              variant='h6'
                              gutterBottom
                              component='div'
                              sx={{ color: '#1890ff' }}
                            >
                              Дети группы "{group.name}"
                            </Typography>
                            {group.id && expandedGroups[group.id]?.loading ? (
                              <Box
                                display="flex"
                                justifyContent="center"
                                alignItems='center'
                                py={2}
                              >
                                <CircularProgress size={24} />
                                <Typography variant='body2' sx={{ ml: 2 }}>
                                  Загрузка детей...
                                </Typography>
                              </Box>
                            ) : !(group.id && expandedGroups[group.id]?.children?.length) ? (
                              <Typography
                                variant="body2"
                                color='text.secondary'
                                sx={{ py: 2 }}
                              >
                                В группе нет детей
                              </Typography>
                            ) : (
                              <Table
                                size='small'
                                sx={{ backgroundColor: '#f8f9fa' }}
                              >
                                <TableHead>
                                  <TableRow>
                                    <TableCell>
                                      <strong>Имя ребенка</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Родитель</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Телефон</strong>
                                    </TableCell>
                                    <TableCell>
                                      <strong>Дата рождения</strong>
                                    </TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {group.id && expandedGroups[group.id]?.children?.map(
                                    (child: Child, index: number) => (
                                      <TableRow key={child.id || index}>
                                        <TableCell>{child.fullName}</TableCell>
                                        <TableCell>
                                          {child.parentName || '—'}
                                        </TableCell>
                                        <TableCell>
                                          {child.parentPhone || '—'}
                                        </TableCell>
                                        <TableCell>
                                          {child.birthday
                                            ? new Date(
                                                child.birthday,
                                              ).toLocaleDateString('ru-RU')
                                            : '—'}
                                        </TableCell>
                                      </TableRow>
                                    ),
                                  )}
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
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editId ? 'Редактировать' : 'Добавить'} группу
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin='dense'
            label='Название группы'
            type='text'
            name='name'
            fullWidth
            value={form.name}
            onChange={handleChange}
          />
          <TextField
            margin='dense'
            label='Описание'
            type='text'
            name='description'
            fullWidth
            value={form.description}
            onChange={handleChange}
          />
          <FormControl fullWidth margin='dense'>
            <InputLabel>Возрастная группа</InputLabel>
            <Select
              value={form.ageGroup}
              label='Возрастная группа'
              name='ageGroup'
              onChange={handleAgeGroupChange}
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
            margin='normal'
            label='Вместимость'
            type='number'
            name='maxStudents'
            fullWidth
            value={form.maxStudents}
            onChange={handleChange}
          />
          {teacherList.length > 0 && (
            <FormControl fullWidth margin='dense'>
              <InputLabel>Воспитатель</InputLabel>
              <Select
                value={form.teacher || ''}
                label='Воспитатель'
                name='teacher'
                onChange={handleTeacherChange}
              >
                {teacherList.map((t) => (
                  <MenuItem key={t.id} value={t.id}>
                    {t.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button
            onClick={handleSave}
            variant='contained'
            color='primary'
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
