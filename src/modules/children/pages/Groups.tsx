import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
import { useAuth } from '../../../app/context/AuthContext';
import { useStaff } from '../../../app/context/StaffContext';
import { useGroups } from '../../../app/context/GroupsContext';
import { SelectChangeEvent } from '@mui/material/Select';
import apiClient from '../../../shared/utils/api';
import ExportButton from '../../../shared/components/ExportButton';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';
import { showSnackbar } from '../../../shared/components/Snackbar';

import { Child } from '../../../shared/types/common';

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

  const { staff, fetchStaff } = useStaff();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<GroupFormData>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [childSearchTerms, setChildSearchTerms] = useState<{ [groupId: string]: string }>({});

  const [expandedGroups, setExpandedGroups] = useState<{
    [groupId: string]: {
      expanded: boolean;
      children: Child[];
      loading: boolean;
    };
  }>({});

  const { user: currentUser, isLoggedIn, loading: authLoading } = useAuth();
  const isAdminOrManager = ['admin', 'manager', 'director'].includes(currentUser?.role || '');
  const canViewSensitiveChildren = isAdminOrManager;

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
      showSnackbar({ message: getErrorMessage(e), type: 'error' });
    }
  };

  const teacherList = useMemo(() => {
    return staff
      .map((u) => ({
        id: u.id || (u as any)._id,
        fullName: u.fullName,
      }));
  }, [staff]);

  const teacherMap = useMemo(() => {
    return new Map(teacherList.map((t) => [t.id, t.fullName]));
  }, [teacherList]);

  const fetchTeachers = async () => {
    await fetchStaff();
  };

  const fetchGroupsInternal = useCallback(async (force = false) => {
    if (!isLoggedIn || !currentUser || authLoading) return;
    try {
      await contextFetchGroups(force);
    } catch (err: any) {
      console.error('Ошибка загрузки групп:', err);
    }
  }, [isLoggedIn, currentUser, authLoading, contextFetchGroups]);

  useEffect(() => {
    if (isLoggedIn && currentUser && !authLoading) {
      fetchGroupsInternal();
      fetchTeachers();
    }
  }, [isLoggedIn, currentUser, authLoading, fetchGroupsInternal]);

  const handleOpenModal = (group?: GroupInternal) => {
    if (!isAdminOrManager) {
      showSnackbar({ message: 'Недостаточно прав для управления группами', type: 'error' });
      return;
    }
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
    setSaveError(null);
  };


  const handleCloseModal = () => {
    setModalOpen(false);
    setForm(defaultForm);
    setEditId(null);
    setSaving(false);
    setSaveError(null);
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
    if (!isAdminOrManager) {
      setSaveError('Недостаточно прав для сохранения группы');
      return;
    }
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
      await contextFetchGroups(true);
    } catch (e: any) {
      setSaveError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!isAdminOrManager) {
      showSnackbar({ message: 'Недостаточно прав для удаления группы', type: 'error' });
      return;
    }
    if (!id) return;
    if (!window.confirm('Удалить группу?')) return;
    setSaving(true);
    try {
      await contextDeleteGroup(id);
      await contextFetchGroups(true);
    } catch (e: any) {
      showSnackbar({ message: getErrorMessage(e), type: 'error' });
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

  const handleChildSearchChange = (groupId: string, value: string) => {
    setChildSearchTerms(prev => ({
      ...prev,
      [groupId]: value
    }));
  };

  const filteredGroups = useMemo(() => {
    if (!searchTerm) return contextGroups;
    const lowerSearch = searchTerm.toLowerCase();
    return contextGroups.filter(g => 
      g.name.toLowerCase().includes(lowerSearch) || 
      (g.description && g.description.toLowerCase().includes(lowerSearch))
    );
  }, [contextGroups, searchTerm]);

  const renderGroupChildren = (groupId: string, groupName: string) => {
    const groupState = expandedGroups[groupId];
    if (!groupState?.expanded) return null;

    const childSearch = (childSearchTerms[groupId] || '').toLowerCase();
    const visibleChildren = canViewSensitiveChildren
      ? (groupState.children || [])
      : (groupState.children || []).map(child => ({ ...child, parentName: '', parentPhone: '' }));

    const filteredChildren = (visibleChildren || []).filter(child => {
      const name = child.fullName.toLowerCase();
      // Исключаем итоговые строки (регистронезависимо)
      if (name.includes('итого') || name.includes('всего')) {
        return false;
      }
      
      if (!childSearch) return true;
      return child.fullName.toLowerCase().includes(childSearch) || 
             (child.parentName && child.parentName.toLowerCase().includes(childSearch));
    });

    return (
      <Box sx={{ mt: 2, mb: 1, px: isMobile ? 1 : 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1} flexWrap="wrap" gap={1}>
          <Typography
            variant='h6'
            gutterBottom
            component='div'
            sx={{ color: '#1890ff', fontSize: isMobile ? '1rem' : '1.25rem', mb: 0 }}
          >
            {isMobile ? `Дети: ${groupName}` : `Дети группы "${groupName}"`}
          </Typography>
          <TextField
            size="small"
            placeholder="Поиск ребенка..."
            value={childSearchTerms[groupId] || ''}
            onChange={(e) => handleChildSearchChange(groupId, e.target.value)}
            sx={{ width: isMobile ? '100%' : '250px' }}
          />
        </Box>
        
        {groupState.loading ? (
          <Box display="flex" justifyContent="center" alignItems='center' py={2}>
            <CircularProgress size={24} />
            <Typography variant='body2' sx={{ ml: 2 }}>Загрузка...</Typography>
          </Box>
        ) : !filteredChildren.length ? (
          <Typography variant="body2" color='text.secondary' sx={{ py: 1 }}>
            {childSearch ? 'Дети не найдены' : 'В группе нет детей'}
          </Typography>
        ) : isMobile ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filteredChildren.map((child: Child, index: number) => (
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
              {filteredChildren.map((child: Child, index: number) => (
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
          <Box sx={{ display: 'flex', gap: 1, width: isMobile ? '100%' : 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Поиск группы..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: '200px' }}
            />
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
            {filteredGroups.length === 0 ? (
              <Alert severity='info'>Группы не найдены.</Alert>
            ) : isMobile ? (
              <Grid container spacing={2}>
                {filteredGroups.map((group) => (
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
                              Воспитатель: <strong>{teacherMap.get(group.teacherId!) || teacherMap.get(group.teacher!) || group.teacher || '—'}</strong>
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
                  {filteredGroups.map((group) => (
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
                          {teacherMap.get(group.teacherId!) || teacherMap.get(group.teacher!) || group.teacher || '—'}
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
          <FormErrorAlert error={saveError} onClose={() => setSaveError(null)} />
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
            disabled={saving || !form.name || !isAdminOrManager}
          >
            {editId ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Groups;
