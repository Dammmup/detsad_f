import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
  useMediaQuery,
  Avatar,
  Chip,
  Snackbar,
  Autocomplete,
  TableSortLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  FileUpload,
} from '@mui/icons-material';
import { useDate } from '../../../app/context/DateContext';
import childPaymentApi from '../services/childPayment';
import childrenApi from '../services/children';
import groupsApi from '../services/groups';
import { IChildPayment, Child, Group } from '../../../shared/types/common';
import moment from 'moment';
import { exportChildPayments } from '../../../shared/utils/excelExport';
import { importChildPayments } from '../../../shared/services/importService';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import DateNavigator from '../../../shared/components/DateNavigator';
import { useSort } from '../../../shared/hooks/useSort';

// Мемоизированная строка таблицы для предотвращения лишних рендеров
const PaymentRow = React.memo(({ 
  payment, 
  child, 
  groupName, 
  isMobile, 
  onMarkAsPaid, 
  onCancelPayment, 
  onOpenModal, 
  onDelete,
  getPaymentStatusColor,
  index
}: any) => {
  const handlePaidClick = useCallback(() => onMarkAsPaid(payment._id), [payment._id, onMarkAsPaid]);
  const handleCancelClick = useCallback(() => onCancelPayment(payment._id), [payment._id, onCancelPayment]);
  const handleEditClick = useCallback(() => onOpenModal(payment), [payment, onOpenModal]);
  const handleDeleteClick = useCallback(() => onDelete(payment._id), [payment._id, onDelete]);

  const debt = useMemo(() => 
    (payment.total + (payment.accruals || 0) - (payment.paidAmount || 0)), 
    [payment.total, payment.accruals, payment.paidAmount]
  );

  return (
    <TableRow hover>
      <TableCell sx={{ p: isMobile ? 1 : 2, fontWeight: 'bold', width: 40 }}>{index + 1}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <Avatar src={child?.photo} sx={{ width: 32, height: 32 }}>
            {child?.fullName?.charAt(0)}
          </Avatar>
          <Typography variant="body2" fontWeight="bold">
            {child?.fullName || 'Неизвестный'}
          </Typography>
        </Box>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Chip label={groupName} size="small" variant="outlined" />
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        {moment(payment.period.start).format('DD.MM')} - {moment(payment.period.end).format('DD.MM.YYYY')}
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Typography variant="body2" color="success.main" fontWeight="bold">
          {payment.paidAmount?.toLocaleString()} ₸
        </Typography>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Typography variant="body2" color="error.main">
          {debt.toLocaleString()} ₸
        </Typography>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.accruals?.toLocaleString() || 0} ₸</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.deductions?.toLocaleString() || 0} ₸</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Tooltip title={payment.comments || ''}>
          <Typography variant="caption" noWrap sx={{ maxWidth: 100, display: 'block' }}>
            {payment.comments}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Chip 
          label={payment.status === 'paid' ? 'Оплачено' : payment.status === 'active' ? 'Активно' : 'Просрочено'} 
          size="small" 
          sx={{ bgcolor: getPaymentStatusColor(payment.status), color: '#fff' }}
        />
      </TableCell>
      <TableCell align="right" sx={{ p: isMobile ? 1 : 2 }}>
        <Box display="flex" justifyContent="flex-end" gap={0.5}>
          {payment.status !== 'paid' ? (
            <Button size="small" variant="contained" color="success" onClick={handlePaidClick}>
              Оплатить
            </Button>
          ) : (
            <Button size="small" variant="outlined" color="warning" onClick={handleCancelClick}>
              Отмена
            </Button>
          )}
          <IconButton size="small" onClick={handleEditClick} color="primary">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleDeleteClick} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
});

const ChildPayments: React.FC = () => {
  const { currentDate } = useDate();
  const [payments, setPayments] = useState<IChildPayment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IChildPayment | null>(null);
  const [newPayment, setNewPayment] = useState({
    childId: '',
    period: { start: '', end: '' },
    amount: 0,
    total: 0,
    paidAmount: 0,
    status: 'active' as 'active' | 'overdue' | 'paid' | 'draft',
    accruals: 0,
    deductions: 0,
    comments: '',
  });

  const [nameFilter, setNameFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [groupsLoaded, setGroupsLoaded] = useState(false);
  const isMobile = useMediaQuery('(max-width:900px)');

  const childrenMap = useMemo(() => {
    const map = new Map<string, Child>();
    children.forEach(c => map.set(c._id || c.id || '', c));
    return map;
  }, [children]);

  const groupsMap = useMemo(() => {
    const map = new Map<string, Group>();
    groups.forEach(g => map.set(g._id || g.id || '', g));
    return map;
  }, [groups]);

  const getPaymentStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50';
      case 'overdue': return '#F44336';
      case 'active': return '#FFC107';
      case 'draft': return '#9E9E9E';
      default: return '#B0B0B0';
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'active': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const monthPeriod = moment(currentDate).format('YYYY-MM');
      const paymentsList = await childPaymentApi.getAll({ monthPeriod });
      setPayments(paymentsList);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки оплат');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  const fetchChildren = useCallback(async () => {
    if (childrenLoaded) return;
    try {
      const childrenList = await childrenApi.getAll();
      setChildren(childrenList);
      setChildrenLoaded(true);
    } catch {
      setChildren([]);
    }
  }, [childrenLoaded]);

  const fetchGroups = useCallback(async () => {
    if (groupsLoaded) return;
    try {
      const groupsList = await groupsApi.getAll();
      setGroups(groupsList);
      setGroupsLoaded(true);
    } catch {
      setGroups([]);
    }
  }, [groupsLoaded]);

  const handleGeneratePayments = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await childPaymentApi.generate(currentDate);
      await fetchPayments();
    } catch (e: any) {
      setError(e?.message || 'Ошибка генерации оплат');
    } finally {
      setIsGenerating(false);
    }
  }, [currentDate, fetchPayments]);

  useEffect(() => {
    fetchChildren();
    fetchGroups();
  }, [fetchChildren, fetchGroups]);

  useEffect(() => {
    fetchPayments();
  }, [currentDate, fetchPayments]);

  const [searchQuery, setSearchQuery] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setNameFilter(value);
    }, 500);
  }, []);

  const processedPayments = useMemo(() => {
    const search = nameFilter.toLowerCase();
    return payments
      .filter((payment) => {
        const childId = typeof payment.childId === 'string' ? payment.childId : payment.childId?._id;
        if (!childId) return false;
        const child = childrenMap.get(childId);
        const matchesName = !search || (child?.fullName.toLowerCase().includes(search));
        let matchesGroup = true;
        if (groupFilter) {
          const gId = child ? (typeof child.groupId === 'object' ? (child.groupId as any)._id || (child.groupId as any).id : child.groupId) : null;
          matchesGroup = gId === groupFilter;
        }
        return matchesName && matchesGroup;
      })
      .map(p => {
        const childId = typeof p.childId === 'string' ? p.childId : p.childId?._id;
        const child = childrenMap.get(childId || '');
        const gId = child ? (typeof child.groupId === 'object' ? (child.groupId as any)._id || (child.groupId as any).id : child.groupId) : null;
        const groupName = gId ? groupsMap.get(gId)?.name || 'Нет группы' : 'Нет группы';
        return {
          ...p,
          _childName: child?.fullName || '',
          _groupName: groupName,
          _debt: (p.total || 0) + (p.accruals || 0) - (p.paidAmount || 0),
          _periodStart: p.period?.start ? new Date(p.period.start).getTime() : 0
        };
      });
  }, [payments, childrenMap, groupsMap, nameFilter, groupFilter]);

  const { items: sortedPayments, requestSort, sortConfig } = useSort(processedPayments);

  const handleMarkAsPaid = useCallback(async (paymentId: string) => {
    try {
      const payment = payments.find(p => p._id === paymentId);
      if (!payment) return;
      const totalAmount = (payment.total || 0) + (payment.accruals || 0);
      await childPaymentApi.update(paymentId, {
        status: 'paid',
        paidAmount: totalAmount,
        paymentDate: new Date()
      });
      fetchPayments();
    } catch (e: any) {
      setError(e?.message || 'Ошибка обновления статуса');
    }
  }, [payments, fetchPayments]);

  const handleCancelPayment = useCallback(async (paymentId: string) => {
    try {
      await childPaymentApi.update(paymentId, {
        status: 'active',
        paidAmount: 0,
        paymentDate: undefined
      });
      fetchPayments();
    } catch (e: any) {
      setError(e?.message || 'Ошибка отмены оплаты');
    }
  }, [fetchPayments]);

  const handleOpenModal = useCallback((payment?: IChildPayment) => {
    if (payment) {
      setEditingPayment(payment);
      const childIdValue = typeof payment.childId === 'object' ? (payment.childId as any)._id : payment.childId;
      setNewPayment({
        childId: childIdValue || '',
        period: {
          start: payment.period?.start ? moment(payment.period.start).format('YYYY-MM-DD') : '',
          end: payment.period?.end ? moment(payment.period.end).format('YYYY-MM-DD') : '',
        },
        amount: payment.amount || 0,
        total: payment.total || 0,
        paidAmount: payment.paidAmount || 0,
        status: payment.status || 'active',
        accruals: payment.accruals || 0,
        deductions: payment.deductions || 0,
        comments: payment.comments || '',
      });
    } else {
      setEditingPayment(null);
      setNewPayment({
        childId: '',
        period: { start: '', end: '' },
        amount: 0,
        total: 0,
        paidAmount: 0,
        status: 'active',
        accruals: 0,
        deductions: 0,
        comments: '',
      });
    }
    setModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalOpen(false);
    setEditingPayment(null);
  }, []);

  const handleSavePayment = useCallback(async () => {
    try {
      if (editingPayment) {
        await childPaymentApi.update(editingPayment._id, {
          ...newPayment,
          childId: newPayment.childId || undefined,
        });
      } else {
        await childPaymentApi.create({
          ...newPayment,
          childId: newPayment.childId || undefined,
        });
      }
      fetchPayments();
      handleCloseModal();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения оплаты');
    }
  }, [editingPayment, newPayment, fetchPayments, handleCloseModal]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Удалить запись оплаты?')) return;
    try {
      await childPaymentApi.deleteItem(id);
      fetchPayments();
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления оплаты');
    }
  }, [fetchPayments]);

  const handleExport = () => {
    exportChildPayments(sortedPayments, children, groups);
  };

  const handleImportChildPayments = async () => {
    try {
      setIsImporting(true);
      const year = moment(currentDate).year();
      const month = moment(currentDate).month();
      const result = await importChildPayments(year, month);
      if (result.success) {
        setSnackbar({
          open: true,
          message: `Импорт завершён: создано ${result.stats.created || 0}, обновлено ${result.stats.updated || 0}`
        });
        await fetchPayments();
      } else {
        setSnackbar({ open: true, message: result.error || 'Ошибка импорта' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: error?.message || 'Ошибка импорта' });
    } finally {
      setIsImporting(false);
    }
  };

  const [showInitialTooltip, setShowInitialTooltip] = useState(false);

  useEffect(() => {
    setShowInitialTooltip(true);
    const timer = setTimeout(() => setShowInitialTooltip(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Box>
      <DateNavigator />
      <Snackbar
        open={showInitialTooltip}
        message='Нажмите на кнопку для отметки оплаты'
        autoHideDuration={4000}
        onClose={() => setShowInitialTooltip(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      <Box
        display='flex'
        flexDirection={isMobile ? 'column' : 'row'}
        flexWrap='wrap'
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent='space-between'
        mb={2}
        gap={2}
      >
        <Box display='flex' alignItems='center' gap={2}>
          <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: isMobile ? 1 : 0 }}>
            Оплаты за посещение детей
          </Typography>
          {!loading && !error && (
            <Typography variant='h6' color='textSecondary' sx={{ mb: isMobile ? 1 : 0 }}>
              ({sortedPayments.length} {sortedPayments.length === 1 ? 'оплата' : sortedPayments.length < 5 ? 'оплаты' : 'оплат'})
            </Typography>
          )}
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <AuditLogButton entityType="childPayment" />
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={() => handleOpenModal()}
            sx={{ width: isMobile ? '100%' : 'auto' }}
          >
            Добавить оплату
          </Button>
          <Button
            variant='outlined'
            color='primary'
            startIcon={isImporting ? <CircularProgress size={20} /> : <FileUpload />}
            onClick={handleImportChildPayments}
            disabled={isImporting || loading}
          >
            Импорт из Excel
          </Button>
          <Button
            variant='outlined'
            color='secondary'
            startIcon={isGenerating ? <CircularProgress size={20} /> : <Refresh />}
            onClick={handleGeneratePayments}
            disabled={isGenerating || loading}
          >
            Обновить платежи
          </Button>
          <Button variant="outlined" onClick={handleExport}>Экспорт</Button>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      <Box
        display='flex'
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        gap={2}
        mb={2}
        sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}
      >
        <TextField
          label='Фильтр по имени'
          variant='outlined'
          fullWidth={isMobile}
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ minWidth: isMobile ? '100%' : 250 }}
        />

        <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 250 }}>
          <InputLabel>Фильтр по группе</InputLabel>
          <Select
            value={groupFilter}
            label='Фильтр по группе'
            onChange={(e) => setGroupFilter(e.target.value as string)}
          >
            <MenuItem value=''>Все группы</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                {group.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {(loading || isGenerating) && <CircularProgress sx={{ m: 2 }} />}
      {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}

      {!loading && !isGenerating && (
        <>
          {sortedPayments.length > 0 ? (
            <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3 }}>
              <Table size={isMobile ? 'small' : 'medium'} sx={{ minWidth: 650 }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === '_childName'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_childName')}
                      >
                        Ребенок
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === '_groupName'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_groupName')}
                      >
                        Группа
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === '_periodStart'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_periodStart')}
                      >
                        Период
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'paidAmount'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('paidAmount')}
                      >
                        Оплачено
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === '_debt'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_debt')}
                      >
                        Долг
                      </TableSortLabel>
                    </TableCell>
                    <TableCell>Надбавки</TableCell>
                    <TableCell>Вычеты</TableCell>
                    <TableCell>Комментарии</TableCell>
                    <TableCell>
                      <TableSortLabel
                        active={sortConfig.key === 'status'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('status')}
                      >
                        Статус
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align='right'>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                    {sortedPayments.map((payment, index) => {
                      const childId = typeof payment.childId === 'string' ? payment.childId : payment.childId?._id;
                      const child = childrenMap.get(childId || '');
                      const gId = child ? (typeof child.groupId === 'object' ? (child.groupId as any)._id || (child.groupId as any).id : child.groupId) : null;
                      const groupName = gId ? groupsMap.get(gId)?.name || 'Нет группы' : 'Нет группы';

                      return (
                        <PaymentRow
                          key={payment._id}
                          payment={payment}
                          child={child}
                          groupName={groupName}
                          isMobile={isMobile}
                          onMarkAsPaid={handleMarkAsPaid}
                          onCancelPayment={handleCancelPayment}
                          onOpenModal={handleOpenModal}
                          onDelete={handleDelete}
                          getPaymentStatusColor={getPaymentStatusColor}
                          index={index}
                        />
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity='info' sx={{ m: 2 }}>Нет данных об оплатах</Alert>
          )}
        </>
      )}

      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth='sm' fullWidth>
        <DialogTitle>{editingPayment ? 'Редактировать оплату' : 'Добавить оплату'}</DialogTitle>
        <DialogContent>
          <Box mt={2} display='flex' flexDirection='column' gap={2}>
            <Autocomplete
              options={children}
              getOptionLabel={(option) => {
                const gId = typeof option.groupId === 'object' ? (option.groupId as any)?._id : option.groupId;
                const group = groupsMap.get(gId || '');
                return `${option.fullName} (${group ? group.name : 'Без группы'})`;
              }}
              value={childrenMap.get(newPayment.childId) || null}
              onChange={(_, newValue) => setNewPayment({ ...newPayment, childId: newValue?._id || '' })}
              renderInput={(params) => <TextField {...params} label='Ребенок' variant='outlined' />}
            />
            <TextField
              label='Начало периода'
              type='date'
              value={newPayment.period.start}
              onChange={(e) => setNewPayment({ ...newPayment, period: { ...newPayment.period, start: e.target.value } })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label='Конец периода'
              type='date'
              value={newPayment.period.end}
              onChange={(e) => setNewPayment({ ...newPayment, period: { ...newPayment.period, end: e.target.value } })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label='Сумма (Всего)'
              type='number'
              value={newPayment.total}
              onChange={(e) => setNewPayment({ ...newPayment, total: Number(e.target.value) })}
            />
            <TextField
              label='Оплачено'
              type='number'
              value={newPayment.paidAmount}
              onChange={(e) => setNewPayment({ ...newPayment, paidAmount: Number(e.target.value) })}
            />
            <TextField
              label='Надбавки'
              type='number'
              value={newPayment.accruals}
              onChange={(e) => setNewPayment({ ...newPayment, accruals: Number(e.target.value) })}
            />
            <TextField
              label='Вычеты'
              type='number'
              value={newPayment.deductions}
              onChange={(e) => setNewPayment({ ...newPayment, deductions: Number(e.target.value) })}
            />
            <TextField
              label='Комментарии'
              value={newPayment.comments}
              onChange={(e) => setNewPayment({ ...newPayment, comments: e.target.value })}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button onClick={handleSavePayment} variant='contained' color="primary">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChildPayments;
