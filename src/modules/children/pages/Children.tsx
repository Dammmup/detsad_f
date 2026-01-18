import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useMediaQuery,
  Avatar,
  Snackbar,
  Tooltip,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import childrenApi, { Child } from '../services/children';
import { groupsApi } from '../services/groups';
import { Group } from '../../../shared/types/common';
import apiClient from '../../../shared/utils/api';
import ChildrenModal from '../components/ChildrenModal';

import ExportButton from '../../../shared/components/ExportButton';
import { useAuth } from '../../../app/context/AuthContext';

const Children: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);


  const [nameFilter, setNameFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');


  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);
  const [isGeneratingPayments, setIsGeneratingPayments] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const getGroupColor = (groupId: string) => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#96CEB4',
      '#FFEAA7',
      '#DDA0DD',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E9',
      '#F8C471',
      '#82E0AA',
    ];
    const groupIndex = groups.findIndex((g) => g._id === groupId);
    return groupIndex !== -1 ? colors[groupIndex % colors.length] : '#B0B0B0';
  };

  const getChildGroupId = (child: Child): string | undefined => {
    return typeof child.groupId === 'object' ? child.groupId?._id : child.groupId;
  };

  const handleExport = async (
    _exportType: string,
    exportFormat: 'pdf' | 'excel' | 'csv',
  ) => {
    setLoading(true);
    try {
      const response = await apiClient.post(
        '/export/children',
        {
          format: exportFormat,
          filters: { name: nameFilter, group: groupFilter },
        },
        { responseType: 'blob' },
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `children.${exportFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e: any) {
      setError(e?.message || 'Ошибка экспорта');
    } finally {
      setLoading(false);
    }
  };


  const fetchGroupsList = useCallback(async () => {
    try {
      const groupList = await groupsApi.getAll();
      setGroups(groupList);
    } catch {
      setGroups([]);
    }
  }, []);


  const fetchChildren = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const childrenList = await childrenApi.getAll();

      if (currentUser && (currentUser.role === 'teacher' || currentUser.role === 'substitute')) {


        const allGroups = await groupsApi.getAll();
        const userGroups = allGroups.filter((group: Group) => group.teacher === currentUser.id || group.teacherId === currentUser.id);
        const userGroupIds = userGroups.map((group: Group) => group._id).filter((id: string | undefined) => id !== undefined) as string[];

        const filteredChildren = childrenList.filter((child: Child) => {
          const childGroupId = typeof child.groupId === 'object' ? child.groupId?._id : child.groupId;
          return childGroupId && userGroupIds.includes(childGroupId);
        });
        setChildren(filteredChildren);
      } else {

        setChildren(childrenList);
      }
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    (async () => {

      await fetchGroupsList();


      await fetchChildren();
    })();
  }, [fetchGroupsList, fetchChildren]);






  useEffect(() => {
    let result = [...children];


    if (activeFilter === 'active') {
      result = result.filter((child) => child.active !== false);
    } else {
      result = result.filter((child) => child.active === false);
    }


    if (nameFilter) {
      result = result.filter(
        (child) =>
          child.fullName &&
          child.fullName.toLowerCase().includes(nameFilter.toLowerCase()),
      );
    }


    if (groupFilter) {
      result = result.filter((child) => {
        const childGroupId =
          typeof child.groupId === 'object'
            ? child.groupId?._id
            : child.groupId;
        return childGroupId && childGroupId === groupFilter;
      });
    }

    setFilteredChildren(result);
  }, [children, nameFilter, groupFilter, activeFilter]);



  useEffect(() => {
    setFilteredChildren([...children]);
  }, [children]);

  const handleOpenModal = useCallback((child?: Child) => {
    setEditingChild(child || null);
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingChild(null);
  }, []);

  const handleDelete = useCallback(async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Удалить ребёнка?')) return;
    try {
      await childrenApi.deleteItem(id);
      await fetchChildren();
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления');
    }
  }, [fetchChildren]);

  const handleGeneratePayments = useCallback(async () => {
    setIsGeneratingPayments(true);
    try {
      const result = await childrenApi.generatePayments(new Date());
      setSnackbar({
        open: true,
        message: `${result.message}. Создано: ${result.stats.created}, пропущено: ${result.stats.skipped}`,
        severity: result.stats.errors > 0 ? 'error' : 'success',
      });
    } catch (e: any) {
      setSnackbar({
        open: true,
        message: e?.message || 'Ошибка генерации платежей',
        severity: 'error',
      });
    } finally {
      setIsGeneratingPayments(false);
    }
  }, []);

  const isMobile = useMediaQuery('(max-width:900px)');

  return (
    <Box>
      <Box
        display='flex'
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent='space-between'
        mb={2}
        gap={isMobile ? 2 : 0}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Typography
            variant={isMobile ? 'h5' : 'h4'}
            gutterBottom
            sx={{ mb: isMobile ? 1 : 0 }}
          >
            Список детей
          </Typography>
          {!loading && !error && (
            <Typography
              variant='h6'
              color='textSecondary'
              sx={{ mb: isMobile ? 1 : 0 }}
            >
              ({filteredChildren.length}{' '}
              {filteredChildren.length === 1
                ? 'ребенок'
                : filteredChildren.length < 5
                  ? 'ребенка'
                  : 'детей'}
              )
            </Typography>
          )}
        </Box>
        <Box
          mb={isMobile ? 0 : 2}
          display='flex'
          flexDirection={isMobile ? 'column' : 'row'}
          gap={1}
        >
          <ExportButton
            exportTypes={[{ value: 'children', label: 'Список детей' }]}
            onExport={handleExport}
          />
          <Tooltip title="Сгенерировать недостающие платежи за текущий месяц">
            <Button
              variant='outlined'
              color='secondary'
              startIcon={isGeneratingPayments ? <CircularProgress size={20} /> : <Refresh />}
              onClick={handleGeneratePayments}
              disabled={isGeneratingPayments || loading}
              sx={{ width: isMobile ? '100%' : 'auto' }}
            >
              {isGeneratingPayments ? 'Генерация...' : 'Сгенерировать платежи'}
            </Button>
          </Tooltip>
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            Добавить ребёнка
          </Button>
        </Box>
      </Box>

      {/* Фильтры */}
      <Box
        display='flex'
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        gap={2}
        mb={2}
        sx={{ p: 2, backgroundColor: '#f8f9fa', borderRadius: 1, border: '1px solid #e0e0e0' }}
      >
        <TextField
          label='Фильтр по имени'
          variant='outlined'
          fullWidth={isMobile}
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          sx={{ minWidth: isMobile ? '100%' : 250 }}
        />

        <FormControl
          fullWidth={isMobile}
          sx={{ minWidth: isMobile ? '100%' : 250 }}
        >
          <InputLabel>Фильтр по группе</InputLabel>
          <Select
            value={groupFilter}
            label='Фильтр по группе'
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <MenuItem value=''>Все группы</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: getGroupColor(group._id),
                      fontSize: '0.7rem',
                    }}
                  >
                    {group.name.charAt(0)}
                  </Avatar>
                  {group.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Кнопки фильтрации по активности */}
        <Box display='flex' gap={1} sx={{ ml: isMobile ? 0 : 'auto' }}>
          <Button
            variant={activeFilter === 'active' ? 'contained' : 'outlined'}
            color='success'
            size='small'
            onClick={() => setActiveFilter('active')}
          >
            Активные
          </Button>
          <Button
            variant={activeFilter === 'inactive' ? 'contained' : 'outlined'}
            color='error'
            size='small'
            onClick={() => setActiveFilter('inactive')}
          >
            Неактивные
          </Button>
        </Box>
      </Box>
      {loading && (
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
      {!loading && children.length === 0 && (
        <Alert severity='info'>Нет данных о детях</Alert>
      )}

      {/* Статистика по группам */}
      {!loading && filteredChildren.length > 0 && (
        <Box
          display='flex'
          flexWrap='wrap'
          gap={2}
          mb={2}
          p={2}
          sx={{
            backgroundColor: '#f9',
            borderRadius: 1,
            border: '1px solid #e0e0e0',
          }}
        >
          <Box
            flex='1 1 200px'
            p={2}
            sx={{
              backgroundColor: '#E8F5E9',
              borderRadius: 1,
              borderLeft: '4px solid #4CAF50',
            }}
          >
            <Typography variant='h6' color='textSecondary'>
              Всего детей
            </Typography>
            <Typography variant='h4' color='success.main'>
              {filteredChildren.length}
            </Typography>
          </Box>

          <Box
            flex='1 1 200px'
            p={2}
            sx={{
              backgroundColor: '#FFF3E0',
              borderRadius: 1,
              borderLeft: '4px solid #FFC107',
            }}
          >
            <Typography variant='h6' color='textSecondary'>
              С группой
            </Typography>
            <Typography variant='h4' color='warning.main'>
              {filteredChildren.filter((c) => c.groupId).length}
            </Typography>
          </Box>

          <Box
            flex='1 1 200px'
            p={2}
            sx={{
              backgroundColor: '#FFEBEE',
              borderRadius: 1,
              borderLeft: '4px solid #F44336',
            }}
          >
            <Typography variant='h6' color='textSecondary'>
              Без группы
            </Typography>
            <Typography variant='h4' color='error.main'>
              {filteredChildren.filter((c) => !c.groupId).length}
            </Typography>
          </Box>

          <Box
            flex='1 1 200px'
            p={2}
            sx={{
              backgroundColor: '#E0E0E0',
              borderRadius: 1,
              borderLeft: '4px solid #9E9E9E',
            }}
          >
            <Typography variant='h6' color='textSecondary'>
              Активных
            </Typography>
            <Typography variant='h4' color='textPrimary'>
              {filteredChildren.filter((c) => c.active !== false).length}
            </Typography>
          </Box>
        </Box>
      )}

      <TableContainer
        component={Paper}
        sx={{
          mt: 2,
          width: '100%',
          overflowX: isMobile ? 'auto' : 'visible',
          boxShadow: isMobile ? 1 : 3,
        }}
      >
        <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                #
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Фото
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                ФИО
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Дата рождения
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Телефон родителя
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                ИИН
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Группа
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Заметки
              </TableCell>
              <TableCell
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Статус
              </TableCell>
              <TableCell
                align='right'
                sx={{
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  p: isMobile ? 1 : 2,
                }}
              >
                Действия
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredChildren.map((child, index) => {

              const childGroupId = getChildGroupId(child);
              const groupColor = childGroupId
                ? getGroupColor(childGroupId)
                : '#B0B0B0';

              return (
                <TableRow
                  key={child.id || child._id}
                  sx={{
                    borderLeft: `4px solid ${groupColor}`,
                    '&:hover': { backgroundColor: '#f9f9f9' },
                  }}
                >
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {index + 1}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.photo ? (
                      <Avatar
                        src={child.photo}
                        alt={child.fullName}
                        sx={{ width: 50, height: 50 }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          bgcolor: '#e0e0',
                          color: '#66',
                        }}
                      >
                        {child.fullName?.charAt(0) || '?'}
                      </Avatar>
                    )}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.fullName}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.birthday
                      ? new Date(child.birthday).toISOString().split('T')[0]
                      : ''}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.parentPhone}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.iin}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {typeof child.groupId === 'object' && child.groupId
                      ? (child.groupId as Group).name
                      : child.groupId ? child.groupId : 'Не указана'}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.notes}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child.active ? 'Активен' : 'Неактивен'}
                  </TableCell>
                  <TableCell align='right' sx={{ p: isMobile ? 1 : 2 }}>
                    <IconButton
                      size={isMobile ? 'small' : 'medium'}
                      onClick={() => handleOpenModal(child)}
                    >
                      <Edit fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                    <IconButton
                      size={isMobile ? 'small' : 'medium'}
                      onClick={() => handleDelete(child.id || child._id)}
                    >
                      <Delete fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <ChildrenModal
        open={modalOpen}
        onClose={handleCloseModal}
        onSaved={fetchChildren}
        child={editingChild as any}
      />
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  );
};

export default Children;
