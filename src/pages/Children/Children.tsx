import React, { useEffect, useState } from 'react';
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
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import childrenApi, { Child } from '../../services/children';
import { groupsApi } from '../../services/groups';
import { Group } from '../../types/common';
import apiClient from '../../utils/api';
import ChildrenModal from '../../components/ChildrenModal';

import ExportButton from '../../components/ExportButton';

const Children: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Состояния для фильтрации
  const [nameFilter, setNameFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');

  // Фильтрованные дети
  const [filteredChildren, setFilteredChildren] = useState<Child[]>([]);

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

  const handleExport = async (
    exportType: string,
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

  // Загрузка детей
  const fetchChildren = async () => {
    setLoading(true);
    setError(null);
    try {
      const childrenList = await childrenApi.getAll();
      setChildren(childrenList);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка групп
  const fetchGroupsList = async () => {
    try {
      const groupList = await groupsApi.getAll();
      setGroups(groupList);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchChildren();
    fetchGroupsList();
  }, []);

  // Фильтрация детей при изменении данных или фильтров
  useEffect(() => {
    let result = [...children];

    // Фильтрация по имени ребенка
    if (nameFilter) {
      result = result.filter(
        (child) =>
          child.fullName &&
          child.fullName.toLowerCase().includes(nameFilter.toLowerCase()),
      );
    }

    // Фильтрация по группе
    if (groupFilter) {
      result = result.filter((child) => {
        const childGroupId =
          typeof child.groupId === 'object'
            ? child.groupId?._id
            : child.groupId;
        return childGroupId === groupFilter;
      });
    }

    setFilteredChildren(result);
  }, [children, nameFilter, groupFilter]);

  // Обновление filteredChildren при изменении children
  useEffect(() => {
    let result = [...children];

    // Фильтрация по имени ребенка
    if (nameFilter) {
      result = result.filter(
        (child) =>
          child.fullName &&
          child.fullName.toLowerCase().includes(nameFilter.toLowerCase()),
      );
    }

    // Фильтрация по группе
    if (groupFilter) {
      result = result.filter((child) => {
        const childGroupId =
          typeof child.groupId === 'object'
            ? child.groupId?._id
            : child.groupId;
        return childGroupId === groupFilter;
      });
    }

    setFilteredChildren(result);
  }, [children, groupFilter,nameFilter]);

  // Инициализация filteredChildren после загрузки данных
  useEffect(() => {
    setFilteredChildren([...children]);
  }, [children]);

  const handleOpenModal = (child?: Child) => {
    setEditingChild(child || null);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingChild(null);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!window.confirm('Удалить ребёнка?')) return;
    try {
      await childrenApi.deleteItem(id);
      fetchChildren();
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления');
    }
  };

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
          display={isMobile ? 'flex' : 'block'}
          flexDirection={isMobile ? 'column' : 'row'}
          gap={isMobile ? 1 : 0}
        >
          <ExportButton
            exportTypes={[{ value: 'children', label: 'Список детей' }]}
            onExport={handleExport}
          />
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{ width: isMobile ? '10%' : 'auto', mt: isMobile ? 1 : 0 }}
          >
            Добавить ребёнка
          </Button>
        </Box>
      </Box>

      {/* Вкладки для активных и неактивных детей */}
      <Box mb={3} display='flex' gap={1}>
        <Button
          variant={
            nameFilter === '' && groupFilter === '' ? 'contained' : 'outlined'
          }
          onClick={() => {
            setNameFilter('');
            setGroupFilter('');
          }}
        >
          Все
        </Button>
        <Button
          variant={
            nameFilter === '' &&
            groupFilter === '' &&
            children.some((c) => c.active !== false)
              ? 'contained'
              : 'outlined'
          }
          onClick={() => {
            setNameFilter('');
            setGroupFilter('');
            setTimeout(() => {
              const activeChildren = children.filter(
                (child) => child.active !== false,
              );
              setFilteredChildren(activeChildren);
            }, 0);
          }}
        >
          Активные
        </Button>
        <Button
          variant={
            nameFilter === '' &&
            groupFilter === '' &&
            children.some((c) => c.active === false)
              ? 'contained'
              : 'outlined'
          }
          onClick={() => {
            setNameFilter('');
            setGroupFilter('');
            setTimeout(() => {
              const inactiveChildren = children.filter(
                (child) => child.active === false,
              );
              setFilteredChildren(inactiveChildren);
            }, 0);
          }}
        >
          Неактивные
        </Button>
      </Box>

      {/* Фильтры */}
      <Box
        display='flex'
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        gap={2}
        mb={2}
        sx={{ p: 2, backgroundColor: '#f5f5', borderRadius: 1 }}
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
              // Определяем цветовую индикацию на основе группы
              const childGroupId =
                typeof child.groupId === 'object'
                  ? child.groupId?._id
                  : child.groupId;
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
                      ? child.groupId.name
                      : child.groupId}
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
        child={editingChild as any} // Временное решение для совместимости типов
      />
    </Box>
  );
};

export default Children;
