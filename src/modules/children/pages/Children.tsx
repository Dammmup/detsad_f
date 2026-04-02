import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
  Chip,
  Snackbar,
  Tooltip,
  TableSortLabel,
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { Child } from '../services/children';
import { Group } from '../../../shared/types/common';
import apiClient from '../../../shared/utils/api';
import ChildrenModal from '../components/ChildrenModal';
import { useSort } from '../../../shared/hooks/useSort';

import ExportButton from '../../../shared/components/ExportButton';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import { useAuth } from '../../../app/context/AuthContext';
import { useChildren } from '../../../app/context/ChildrenContext';
import { useGroups } from '../../../app/context/GroupsContext';



const ChildRow = React.memo(({
  child,
  index,
  isMobile,
  currentUser,
  getGroupColor,
  handleOpenModal,
  handleDelete,
  groups,
  onGroupChange,
}: {
  child: Child;
  index: number;
  isMobile: boolean;
  currentUser: any;
  getGroupColor: (id: string) => string;
  handleOpenModal: (child: Child) => void;
  handleDelete: (id: string) => void;
  groups: Group[];
  onGroupChange: (childId: string, groupId: string) => void;
}) => {
  const childGroupId = typeof child.groupId === 'object' ? child.groupId?._id : child.groupId;
  const groupColor = childGroupId ? getGroupColor(childGroupId) : '#B0B0B0';

  return (
    <TableRow
      sx={{
        borderLeft: `4px solid ${groupColor}`,
        '&:hover': { backgroundColor: '#f9f9f9' },
      }}
    >
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{index + 1}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        {child.photo ? (
          <Avatar src={child.photo} alt={child.fullName} sx={{ width: 50, height: 50 }} />
        ) : (
          <Avatar sx={{ width: 50, height: 50, bgcolor: '#e0e0e0', color: '#666' }}>
            {child.fullName?.charAt(0) || '?'}
          </Avatar>
        )}
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.fullName}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        {child.birthday ? new Date(child.birthday).toISOString().split('T')[0] : ''}
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.parentPhone}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.iin}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Select
          size='small'
          value={childGroupId || ''}
          onChange={(e) => onGroupChange(child.id || (child._id as string), e.target.value as string)}
          displayEmpty
          sx={{ minWidth: 140, fontSize: '0.85rem' }}
        >
          <MenuItem value=''><em>Не указана</em></MenuItem>
          {groups.filter(g => g.name !== 'Все группы' && g.name !== 'Default Group').map((g) => (
            <MenuItem key={g._id} value={g._id}>
              <Box display='flex' alignItems='center' gap={1}>
                <Avatar sx={{ width: 18, height: 18, bgcolor: getGroupColor(g._id as string), fontSize: '0.6rem' }}>
                  {g.name.charAt(0)}
                </Avatar>
                {g.name}
              </Box>
            </MenuItem>
          ))}
        </Select>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2, fontWeight: 'bold', color: '#1890ff' }}>
        {child.paymentAmount?.toLocaleString() || 0} ₸
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.notes}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{child.active ? 'Активен' : 'Неактивен'}</TableCell>
      <TableCell align='right' sx={{ p: isMobile ? 1 : 2 }}>
        <AuditLogButton entityType="child" entityId={child._id} entityName={child.fullName} />
        <IconButton size={isMobile ? 'small' : 'medium'} onClick={() => handleOpenModal(child)}>
          <Edit fontSize={isMobile ? 'small' : 'medium'} />
        </IconButton>
        <IconButton
          size={isMobile ? 'small' : 'medium'}
          onClick={() => handleDelete(child.id || (child._id as string))}
          sx={{ visibility: currentUser?.role === 'admin' ? 'visible' : 'hidden' }}
        >
          <Delete fontSize={isMobile ? 'small' : 'medium'} />
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

const Children: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { 
    children: allChildren, 
    loading: childrenLoading, 
    error: childrenError, 
    fetchChildren,
    deleteChild,
    updateChild,
    generatePayments
  } = useChildren();
  
  const { 
    groups, 
    loading: groupsLoading, 
    fetchGroups 
  } = useGroups();

  const loading = childrenLoading || groupsLoading;
  const error = childrenError;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const [nameFilter, setNameFilter] = useState('');
  const [localSearchName, setLocalSearchName] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [activeFilter, setActiveFilter] = useState<'active' | 'inactive'>('active');

  const [isGeneratingPayments, setIsGeneratingPayments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const handleSearchChange = (val: string) => {
    setLocalSearchName(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setNameFilter(val);
    }, 500);
  };

  const getGroupColor = useCallback((groupId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'];
    const groupIndex = groups.findIndex((g) => g._id === groupId);
    return groupIndex !== -1 ? colors[groupIndex % colors.length] : '#B0B0B0';
  }, [groups]);

  useEffect(() => {
    fetchGroups();
    fetchChildren();
  }, [fetchGroups, fetchChildren]);

  const childrenForUser = useMemo(() => {
    if (currentUser && ['teacher', 'substitute', 'assistant'].includes(currentUser.role)) {
      const userGroups = groups.filter(
        (group) =>
          group.teacher === currentUser.id ||
          group.teacherId === currentUser.id ||
          group.teacher === currentUser._id ||
          group.teacherId === currentUser._id ||
          (group as any).assistantId === currentUser.id ||
          (group as any).assistantId === currentUser._id
      );
      const userGroupIds = userGroups.map(group => group._id || group.id).filter(id => id !== undefined) as string[];
      return allChildren.filter(child => {
        const childGroupId = typeof child.groupId === 'object' ? child.groupId?._id : child.groupId;
        return childGroupId && userGroupIds.includes(childGroupId);
      });
    }
    return allChildren;
  }, [allChildren, groups, currentUser]);

  const filteredChildren = useMemo(() => {
    let result = [...childrenForUser];
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
    if (groupFilter.length > 0) {
      result = result.filter((child) => {
        const childGroupId = typeof child.groupId === 'object' ? child.groupId?._id : child.groupId;
        return childGroupId && groupFilter.includes(childGroupId);
      });
    }
    return result;
  }, [childrenForUser, nameFilter, groupFilter, activeFilter]);

  const { items: sortedChildren, requestSort, sortConfig } = useSort(filteredChildren);

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
      await deleteChild(id);
    } catch (e: any) {
      // Error is already set in context, but we can add local handling if needed
    }
  }, [deleteChild]);

  const handleGroupChange = useCallback(async (childId: string, groupId: string) => {
    try {
      await updateChild(childId, { groupId } as any);
      setSnackbar({ open: true, message: 'Группа обновлена', severity: 'success' });
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.message || 'Ошибка обновления группы', severity: 'error' });
    }
  }, [updateChild]);

  const handleExport = useCallback(async (_exportType: string, exportFormat: 'xlsx') => {
    setIsExporting(true);
    setExportError(null);
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
      setExportError(e?.message || 'Ошибка экспорта');
    } finally {
      setIsExporting(false);
    }
  }, [nameFilter, groupFilter]);

  const handleGeneratePayments = useCallback(async () => {
    setIsGeneratingPayments(true);
    try {
      const result = await generatePayments(new Date());
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
  }, [generatePayments]);

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
          <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: isMobile ? 1 : 0 }}>
            Список детей
          </Typography>
          {!loading && !error && (
            <Typography variant='h6' color='textSecondary' sx={{ mb: isMobile ? 1 : 0 }}>
              ({filteredChildren.length} {filteredChildren.length === 1 ? 'ребенок' : filteredChildren.length < 5 ? 'ребенка' : 'детей'})
            </Typography>
          )}
        </Box>
        <Box mb={isMobile ? 0 : 2} display='flex' flexDirection={isMobile ? 'column' : 'row'} gap={1}>
          <AuditLogButton entityType="child" />
          <ExportButton exportTypes={[{ value: 'children', label: 'Список детей' }]} onExport={handleExport} />
          <Tooltip title="Сгенерировать недостающие платежи за текущий month">
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
          <Button variant='contained' startIcon={<Add />} onClick={() => handleOpenModal()} sx={{ width: isMobile ? '100%' : 'auto' }}>
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
          label='Фильтр по имени (быстрый поиск)'
          variant='outlined'
          fullWidth={isMobile}
          value={localSearchName}
          onChange={(e) => handleSearchChange(e.target.value)}
          sx={{ minWidth: isMobile ? '100%' : 250 }}
        />

        <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 250 }}>
          <InputLabel>Фильтр по группам</InputLabel>
          <Select
            multiple
            value={groupFilter}
            label='Фильтр по группам'
            onChange={(e) => {
              const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
              setGroupFilter(value.includes('') ? [] : value);
            }}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.length === 0 ? 'Все группы' : selected.map((value) => (
                  <Chip
                    key={value}
                    label={groups.find(g => g._id === value)?.name || value}
                    size="small"
                    avatar={
                      <Avatar sx={{ bgcolor: getGroupColor(value) }}>
                        {groups.find(g => g._id === value)?.name?.charAt(0)}
                      </Avatar>
                    }
                  />
                ))}
              </Box>
            )}
          >
            <MenuItem value="">
              <em>Все группы</em>
            </MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                <Box display='flex' alignItems='center' gap={1}>
                  <Avatar sx={{ width: 20, height: 20, bgcolor: getGroupColor(group._id as string), fontSize: '0.7rem' }}>
                    {group.name.charAt(0)}
                  </Avatar>
                  {group.name}
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box display='flex' gap={1} sx={{ ml: isMobile ? 0 : 'auto' }}>
          <Button variant={activeFilter === 'active' ? 'contained' : 'outlined'} color='success' size='small' onClick={() => setActiveFilter('active')}>
            Активные
          </Button>
          <Button variant={activeFilter === 'inactive' ? 'contained' : 'outlined'} color='error' size='small' onClick={() => setActiveFilter('inactive')}>
            Неактивные
          </Button>
        </Box>
      </Box>

      {loading && (
        <Box display='flex' justifyContent='center' alignItems='center' minHeight='200px' width='100%'>
          <CircularProgress size={60} />
        </Box>
      )}
      {error && <Alert severity='error'>{error}</Alert>}
      {exportError && <Alert severity='error' onClose={() => setExportError(null)}>{exportError}</Alert>}
      {!loading && allChildren.length === 0 && <Alert severity='info'>Нет данных о детях</Alert>}

      {!loading && filteredChildren.length > 0 && (
        <Box display='flex' flexWrap='wrap' gap={2} mb={2} p={2} sx={{ backgroundColor: '#f9f9f9', borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Box flex='1 1 200px' p={2} sx={{ backgroundColor: '#E8F5E9', borderRadius: 1, borderLeft: '4px solid #4CAF50' }}>
            <Typography variant='h6' color='textSecondary'>Всего детей</Typography>
            <Typography variant='h4' color='success.main'>{filteredChildren.length}</Typography>
          </Box>
          <Box flex='1 1 200px' p={2} sx={{ backgroundColor: '#FFF3E0', borderRadius: 1, borderLeft: '4px solid #FFC107' }}>
            <Typography variant='h6' color='textSecondary'>С группой</Typography>
            <Typography variant='h4' color='warning.main'>{filteredChildren.filter((c) => c.groupId).length}</Typography>
          </Box>
          <Box flex='1 1 200px' p={2} sx={{ backgroundColor: '#FFEBEE', borderRadius: 1, borderLeft: '4px solid #F44336' }}>
            <Typography variant='h6' color='textSecondary'>Без группы</Typography>
            <Typography variant='h4' color='error.main'>{filteredChildren.filter((c) => !c.groupId).length}</Typography>
          </Box>
          <Box flex='1 1 200px' p={2} sx={{ backgroundColor: '#E0E0E0', borderRadius: 1, borderLeft: '4px solid #9E9E9E' }}>
            <Typography variant='h6' color='textSecondary'>Активных</Typography>
            <Typography variant='h4' color='textPrimary'>{filteredChildren.filter((c) => c.active !== false).length}</Typography>
          </Box>
        </Box>
      )}

      <TableContainer component={Paper} sx={{ mt: 2, width: '100%', overflowX: isMobile ? 'auto' : 'visible', boxShadow: isMobile ? 1 : 3 }}>
        <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>#</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Фото</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>
                <TableSortLabel
                  active={sortConfig.key === 'fullName'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('fullName')}
                >
                  ФИО
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>
                <TableSortLabel
                  active={sortConfig.key === 'birthday'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('birthday')}
                >
                  Дата рождения
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Телефон родителя</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>ИИН</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>
                <TableSortLabel
                  active={sortConfig.key === 'groupId.name'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('groupId.name')}
                >
                  Группа
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>
                <TableSortLabel
                  active={sortConfig.key === 'paymentAmount'}
                  direction={sortConfig.direction || 'asc'}
                  onClick={() => requestSort('paymentAmount')}
                >
                  Сумма оплаты
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Заметки</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Статус</TableCell>
              <TableCell align='right' sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedChildren.map((child, index) => (
              <ChildRow
                key={child.id || child._id}
                child={child}
                index={index}
                isMobile={isMobile}
                currentUser={currentUser}
                getGroupColor={getGroupColor}
                handleOpenModal={handleOpenModal}
                handleDelete={handleDelete}
                groups={groups}
                onGroupChange={handleGroupChange}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ChildrenModal open={modalOpen} onClose={handleCloseModal} onSaved={fetchChildren} child={editingChild as any} />
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
