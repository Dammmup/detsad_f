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
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Group as SingleGroupIcon,
  Visibility,
  ExpandLess,
  Person,
  Groups as GroupsIcon,
} from '@mui/icons-material';
import { useGroups } from '../../../app/context/GroupsContext';
import { Child } from '../../../shared/types/common';

import { useAuth } from '../../../app/context/AuthContext';
import { SelectChangeEvent } from '@mui/material/Select';
import apiClient from '../../../shared/utils/api';
import ExportButton from '../../../shared/components/ExportButton';
import AuditLogButton from '../../../shared/components/AuditLogButton';



interface GroupInternal {
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
  ageGroup: [],
  teacher: '',
};

const Groups = () => {
  const isMobile = useMediaQuery('(max-width:900px)');
  const groupsContext = useGroups();
  const {
    groups: contextGroups,
    loading: contextLoading,
    error: contextError,
    fetchGroups: contextFetchGroups,
    updateGroup: contextUpdateGroup,
    createGroup: contextCreateGroup,
    deleteGroup: contextDeleteGroup,
    getGroup: contextGetGroup
  } = groupsContext;

  const [teacherList, setTeacherList] = useState<TeacherOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GroupFormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [teachersLoaded, setTeachersLoaded] = useState(false);

  const [expandedGroups, setExpandedGroups] = useState<{
    [groupId: string]: {
      expanded: boolean;
      children: Child[];
      loading: boolean;
    };
  }>({});

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const isAdminOrManager = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // Стабильные ссылки на функции контекста - удалено дублирование

  const handleExport = async (
    _exportType: string,
    exportFormat: 'xlsx',
  ) => {
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
      alert(e?.message || 'Ошибка экспорта');
    }
  };

  const fetchTeachers = async () => {
    if (teachersLoaded) return;
    try {
      const { getUsers } = await import('../../staff/services/userService');
      const users = await getUsers();
      const filtered = users.filter((u: any) =>
        ['teacher', 'assistant'].includes(u.role as any),
      );
      setTeacherList(
        filtered.map((u: any) => ({ id: u.id || u._id, fullName: u.fullName })),
      );
      setTeachersLoaded(true);
    } catch (e) {
      setTeacherList([]);
    }
  };

  const fetchGroupsInternal = useCallback(async (force = false) => {
    if (!isLoggedIn || !currentUser || authLoading) return;
    try {
      await contextFetchGroups(force);
    } catch (err: any) {
      console.error('Ошибка загрузки групп:', err);
    }
  }, [isLoggedIn, currentUser, authLoading, contextFetchGroups]);

  // Загрузка данных при первом рендере
  useEffect(() => {
    if (isLoggedIn && currentUser && !authLoading) {
      fetchGroupsInternal();
      fetchTeachers();
    }
  }, [isLoggedIn, currentUser, authLoading, fetchGroupsInternal]);




  const teacherMap = new Map(teacherList.map((t) => [t.id, t.fullName]));


  const handleOpenModal = (group?: GroupInternal) => {
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


  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
    setSaving(false);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name) {
      setForm((prev) => ({
        ...prev,
        [name]: name === 'maxStudents' ? Number(value) : value,
      }));
    }
  };


  const handleAgeGroupChange = (e: SelectChangeEvent<unknown>) => {
    const { value } = e.target;
    const arr = typeof value === 'string' ? value.split(',') : value as string[];
    setForm((prev) => ({ ...prev, ageGroup: arr }));
  };


  const handleTeacherChange = (e: SelectChangeEvent<string>) => {
    const { value } = e.target;
    setForm((prev) => ({ ...prev, teacher: value }));
  };


  const handleSave = async () => {
    setSaving(true);
    try {

      const groupData = {
        name: form.name,
        description: form.description,
        maxStudents: Number(form.maxStudents) || 0,

        ageGroup: Array.isArray(form.ageGroup) ? form.ageGroup : [],

        teacher:
          typeof form.teacher === 'string'
            ? form.teacher
            : String(form.teacher || ''),
        isActive: true,
      };

      if (editId) {
        await contextUpdateGroup(editId, groupData);
      } else {
        await contextCreateGroup(groupData);
      }

      handleCloseModal();
      // Либо доверяем обновлению в контексте, либо форсируем перезагрузку
      await contextFetchGroups(true);
    } catch (e: any) {
      alert(e?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!window.confirm('Удалить группу?')) return;
    setSaving(true);
    try {
      await contextDeleteGroup(id);
      await contextFetchGroups(true);
    } catch (e: any) {
      alert(e?.message || 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };


  const handleToggleGroupChildren = async (
    event: React.MouseEvent<HTMLElement>,
    groupId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const currentState = expandedGroups[groupId];

    if (currentState?.expanded) {

      setExpandedGroups((prev) => ({
        ...prev,
        [groupId]: {
          ...prev[groupId],
          expanded: false,
        },
      }));
    } else {

      setExpandedGroups((prev) => ({
        ...prev,
        [groupId]: {
          expanded: true,
          children: currentState?.children || [],
          loading: !currentState?.children?.length,
        },
      }));


      if (!currentState?.children?.length) {
        try {

          const group = contextGroups.find((g) => g.id === groupId);
          let children: Child[] = (group && (group as any).children) || [];
          if (!children.length) {

            const fullGroup = await contextGetGroup(groupId);
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

  const renderGroupChildren = (groupId: string, groupName: string) => {
    const groupState = expandedGroups[groupId];
    if (!groupState?.expanded) return null;

    return (
      <Box sx={{ mt: 2, mb: 1, px: isMobile ? 1 : 2 }}>
        <Typography
          variant='h6'
          gutterBottom
          component='div'
          sx={{ color: '#1890ff', fontSize: isMobile ? '1rem' : '1.25rem' }}
        >
          {isMobile ? `Дети: ${groupName}` : `Дети группы "${groupName}"`}
        </Typography>
        
        {groupState.loading ? (
          <Box display="flex" justifyContent="center" alignItems='center' py={2}>
            <CircularProgress size={24} />
            <Typography variant='body2' sx={{ ml: 2 }}>Загрузка...</Typography>
          </Box>
        ) : !groupState.children?.length ? (
          <Typography variant="body2" color='text.secondary' sx={{ py: 1 }}>
            В группе нет детей
          </Typography>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {groupState.children.map((child: Child, index: number) => (
              <Box key={child.id || index} sx={{ p: 1, bgcolor: '#f8f9fa', borderRadius: 1, border: '1px solid #eee' }}>
                <Typography variant="subtitle2">{child.fullName}</Typography>
                <Typography variant="caption" display="block">Родитель: {child.parentName || '—'}</Typography>
                <Typography variant="caption" display="block">Тел: {child.parentPhone || '—'}</Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Table size='small' sx={{ backgroundColor: '#f8f9fa' }}>
            <TableHead>
              <TableRow>
                <TableCell><strong>Имя ребенка</strong></TableCell>
                <TableCell><strong>Родитель</strong></TableCell>
                <TableCell><strong>Телефон</strong></TableCell>
                <TableCell><strong>Дата рождения</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groupState.children.map((child: Child, index: number) => (
                <TableRow key={child.id || index}>
                  <TableCell>{child.fullName}</TableCell>
                  <TableCell>{child.parentName || '—'}</TableCell>
                  <TableCell>{child.parentPhone || '—'}</TableCell>
                  <TableCell>
                    {child.birthday ? new Date(child.birthday).toLocaleDateString('ru-RU') : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Paper elevation={isMobile ? 1 : 3} sx={{ p: isMobile ? 2 : 3, borderRadius: 2 }}>
        <Box display="flex" flexDirection={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems={isMobile ? 'flex-start' : 'center'} mb={3} gap={2}>
          <h1 style={{ color: '#1890ff', marginBottom: '16px' }}>
            <GroupsIcon style={{ marginRight: 8, verticalAlign: 'middle' }} />
            Группы
          </h1>
          <Box sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto', flexWrap: 'wrap' }}>
            <AuditLogButton entityType="group" />
            <ExportButton
              exportTypes={[{ value: 'groups', label: 'Список групп' }]}
              onExport={handleExport}
            />
            {isAdminOrManager && (
              <Button
                variant='contained'
                color='primary'
                startIcon={<Add />}
                onClick={() => handleOpenModal()}
                fullWidth={isMobile}
                sx={{ ml: isMobile ? 0 : 1 }}
              >
                Добавить
              </Button>
            )}
          </Box>
        </Box>

        {contextLoading && (
          <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px' width='100%'>
            <CircularProgress size={60} />
          </Box>
        )}
        
        {contextError && <Alert severity='error' sx={{ mb: 2 }}>{contextError}</Alert>}

        {!contextLoading && !contextError && (
          <>
            {contextGroups.length === 0 ? (
              <Alert severity='info'>Группы не найдены. Добавьте первую группу!</Alert>
            ) : isMobile ? (
              <Grid container spacing={2}>
                {contextGroups.map((group) => (
                  <Grid item xs={12} key={group.id}>
                    <Card variant="outlined" sx={{ borderRadius: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                      <CardContent sx={{ pb: 1 }}>
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                          <Typography variant="h6" color="primary">{group.name}</Typography>
                          <Box>
                            <IconButton size="small" onClick={(e) => handleToggleGroupChildren(e, group.id || "")}>
                              {(group.id && expandedGroups[group.id]?.expanded) ? <ExpandLess color="primary" /> : <Visibility color="primary" />}
                            </IconButton>
                            {isAdminOrManager && (
                              <>
                                <IconButton size="small" onClick={() => handleOpenModal(group as any)}><Edit fontSize="small" /></IconButton>
                                <IconButton size="small" onClick={() => handleDelete(group.id!)}><Delete fontSize="small" color='error' /></IconButton>
                              </>
                            )}
                          </Box>
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Box display="flex" flexDirection="column" gap={0.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Person sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Воспитатель: <strong>{group.teacher ? teacherMap.get(group.teacher) || '—' : '—'}</strong>
                            </Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <SingleGroupIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                            <Typography variant="body2">
                              Мест: <strong>{group.maxStudents || 0}</strong>
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{group.description}</Typography>
                        </Box>
                        {group.id && renderGroupChildren(group.id, group.name)}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Table>
                <TableHead>
                  <TableRow hover>
                    <TableCell>Название</TableCell>
                    <TableCell>Описание</TableCell>
                    <TableCell>Возраст</TableCell>
                    <TableCell>Мест</TableCell>
                    <TableCell>Воспитатель</TableCell>
                    <TableCell align='right'>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {contextGroups.map((group) => (
                    <React.Fragment key={group.id}>
                      <TableRow hover>
                        <TableCell><strong>{group.name}</strong></TableCell>
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
                          <IconButton onClick={(e) => handleToggleGroupChildren(e, group.id || "")}>
                            {(group.id && expandedGroups[group.id]?.expanded) ? <ExpandLess color="primary" /> : <Visibility color="primary" />}
                          </IconButton>
                          <AuditLogButton entityType="group" entityId={group._id || group.id} entityName={group.name} />
                          {isAdminOrManager && (
                            <>
                              <IconButton onClick={() => handleOpenModal(group as any)}><Edit /></IconButton>
                              <IconButton onClick={() => handleDelete(group.id || "")}><Delete color='error' /></IconButton>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                      {group.id && expandedGroups[group.id]?.expanded && (
                        <TableRow>
                          <TableCell colSpan={6} sx={{ p: 0, bgcolor: '#fcfcfc' }}>
                            {renderGroupChildren(group.id, group.name)}
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
      </Paper>

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
    </Box>
  );
};

export default Groups;
