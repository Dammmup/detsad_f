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
  Checkbox,
  ListItemText,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Refresh,
  FileUpload,
  SpaceBar,
} from '@mui/icons-material';
import { useDate } from '../../../app/context/DateContext';
import { useChildren } from '../../../app/context/ChildrenContext';
import { useGroups } from '../../../app/context/GroupsContext';
import childPaymentApi from '../services/childPayment';
import { IChildPayment, Child, Group } from '../../../shared/types/common';
import moment from 'moment';
import { exportChildPayments } from '../../../shared/utils/excelExport';
import { importChildPayments } from '../../../shared/services/importService';
import AuditLogButton from '../../../shared/components/AuditLogButton';
import DateNavigator from '../../../shared/components/DateNavigator';
import { useSort } from '../../../shared/hooks/useSort';
import { useAuth } from '../../../app/context/AuthContext';

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
  const handleKaspiPaidClick = useCallback(() => onMarkAsPaid(payment._id, 'kaspi'), [payment._id, onMarkAsPaid]);
  const handleCashPaidClick = useCallback(() => onMarkAsPaid(payment._id, 'cash'), [payment._id, onMarkAsPaid]);
  const handleCancelClick = useCallback(() => onCancelPayment(payment._id), [payment._id, onCancelPayment]);
  const handleEditClick = useCallback(() => onOpenModal(payment), [payment, onOpenModal]);
  const handleDeleteClick = useCallback(() => onDelete(payment._id), [payment._id, onDelete]);

  const debt = useMemo(() =>
    (payment.total + (payment.accruals || 0) - (payment.paidAmount || 0) - (payment.deductions || 0)),
    [payment.total, payment.accruals, payment.paidAmount, payment.deductions]
  );

  return (
    <TableRow hover>
      <TableCell sx={{ p: isMobile ? 1 : 2, fontWeight: 'bold', width: 40 }}>{index + 1}</TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2, textAlign: 'center', width: 120 }}>
        <Box display="flex" gap={0.5} justifyContent="center">
          {payment.status === 'paid' ? (
            <Tooltip title="Отменить оплату">
              <IconButton
                size="small"
                onClick={handleCancelClick}
                sx={{
                  bgcolor: 'warning.main',
                  color: '#fff',
                  '&:hover': { bgcolor: 'warning.dark' },
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          ) : (
            <>
              <Tooltip title="Оплатить (Kaspi)">
                <IconButton
                  size="small"
                  onClick={handleKaspiPaidClick}
                  sx={{
                    p: 0.5,
                    bgcolor: 'transparent',
                    border: 'none',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <img src="/templates/kaspi.svg" alt="Kaspi" style={{ width: 28, height: 28 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Оплатить (Наличные)">
                <IconButton
                  size="small"
                  onClick={handleCashPaidClick}
                  sx={{
                    p: 0.5,
                    bgcolor: 'transparent',
                    border: 'none',
                    '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' },
                  }}
                >
                  <img src="/templates/cash.svg" alt="Cash" style={{ width: 28, height: 28 }} />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar src={child?.photo} sx={{ width: 28, height: 28 }}>
            {child?.fullName?.charAt(0)}
          </Avatar>
          <Box display="flex" flexDirection="row">
            <Typography
              variant="body2"
              fontWeight="bold"
              noWrap
              sx={{
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block'
              }}
            >
              {child?.fullName || 'Загрузка...'}
              <div> </div>
              {payment.status === 'paid' && (
                <Typography variant="caption" sx={{ color: 'text.primary', fontSize: '0.9rem' }}>
                  {payment.paymentType === 'kaspi' ? '(Kaspi)' :
                    payment.paymentType === 'cash' ? '(Наличные)' :
                      '(Не указан тип оплаты)'}
                </Typography>
              )}
            </Typography>

          </Box>
        </Box>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1 }}>
        <Chip label={groupName} size="small" variant="outlined" sx={{ maxWidth: 110 }} />
      </TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1, whiteSpace: 'nowrap' }}>
        {moment(payment.period.start).format('DD.MM')} - {moment(payment.period.end).format('DD.MM.YY')}
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2, fontWeight: 'bold' }}>
        <Typography variant="body2" color="success.main" fontWeight="bold">
          {payment.paidAmount?.toLocaleString()} ₸
        </Typography>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 1 : 2 }}>
        <Typography variant="body2" color="error.main" fontWeight="bold">
          {debt.toLocaleString()} ₸
        </Typography>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1, textAlign: 'center', width: 80 }}>{payment.accruals?.toLocaleString() || 0} ₸</TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1, textAlign: 'center', width: 80 }}>{payment.deductions?.toLocaleString() || 0} ₸</TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1 }}>
        <Tooltip title={payment.comments || ''}>
          <Typography variant="caption" noWrap sx={{ maxWidth: 150, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {payment.comments}
          </Typography>
        </Tooltip>
      </TableCell>
      <TableCell sx={{ p: isMobile ? 0.5 : 1, width: 100 }}>
        <Chip
          label={payment.status === 'paid' ? 'Оплачено' : payment.status === 'active' ? 'Активно' : 'Просрочено'}
          size="small"
          sx={{ bgcolor: getPaymentStatusColor(payment.status), color: '#fff' }}
        />
      </TableCell>
      <TableCell align="right" sx={{ p: isMobile ? 0.5 : 1, width: 80 }}>
        <Box display="flex" justifyContent="flex-end" gap={0.5}>
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

// Новый компонент для мобильных карточек
const PaymentCard = React.memo(({
  payment,
  child,
  groupName,
  onMarkAsPaid,
  onCancelPayment,
  onOpenModal,
  onDelete,
  getPaymentStatusColor,
  index
}: any) => {
  const handleCancelClick = useCallback(() => onCancelPayment(payment._id), [payment._id, onCancelPayment]);
  const handleKaspiPaidClick = useCallback(() => onMarkAsPaid(payment._id, 'kaspi'), [payment._id, onMarkAsPaid]);
  const handleCashPaidClick = useCallback(() => onMarkAsPaid(payment._id, 'cash'), [payment._id, onMarkAsPaid]);
  const handleEditClick = useCallback(() => onOpenModal(payment), [payment, onOpenModal]);
  const handleDeleteClick = useCallback(() => onDelete(payment._id), [payment._id, onDelete]);

  const debt = useMemo(() =>
    (payment.total + (payment.accruals || 0) - (payment.paidAmount || 0) - (payment.deductions || 0)),
    [payment.total, payment.accruals, payment.paidAmount, payment.deductions]
  );

  return (
    <Paper sx={{ mb: 2, p: 2, borderRadius: 2, boxShadow: 1, border: '1px solid #eee' }}>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Avatar src={child?.photo} sx={{ width: 40, height: 40 }}>
            {child?.fullName?.charAt(0)}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="bold" sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {child?.fullName || 'Загрузка...'}
            </Typography>
            <Chip label={groupName} size="small" variant="outlined" sx={{ mt: 0.5, height: 20, fontSize: '0.7rem' }} />
          </Box>
        </Box>
        <Chip
          label={payment.status === 'paid' ? 'Оплачено' : payment.status === 'active' ? 'Активно' : 'Просрочено'}
          size="small"
          sx={{ bgcolor: getPaymentStatusColor(payment.status), color: '#fff', fontSize: '0.7rem' }}
        />
      </Box>

      <Box display="grid" gridTemplateColumns="1fr 1fr" gap={1} mb={1.5}>
        <Box>
          <Typography variant="caption" color="textSecondary" display="block">Период</Typography>
          <Typography variant="caption" fontWeight="medium">
            {moment(payment.period.start).format('DD.MM')} - {moment(payment.period.end).format('DD.MM')}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="textSecondary" display="block">Долг</Typography>
          <Typography variant="body2" color="error.main" fontWeight="bold">
            {debt.toLocaleString()} ₸
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="textSecondary" display="block">Оплачено</Typography>
          <Typography variant="body2" color="success.main" fontWeight="bold">
            {payment.paidAmount?.toLocaleString()} ₸
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="caption" color="textSecondary" display="block">Тип</Typography>
          <Typography variant="caption">
            {payment.status === 'paid' ? (
              payment.paymentType === 'kaspi' ? 'Kaspi' :
              payment.paymentType === 'cash' ? 'Наличные' : 'Не указан'
            ) : '-'}
          </Typography>
        </Box>
      </Box>

      <Box display="flex" justifyContent="space-between" alignItems="center" pt={1} sx={{ borderTop: '1px solid #f0f0f0' }}>
        <Box display="flex" gap={1}>
          {payment.status === 'paid' ? (
            <IconButton size="small" onClick={handleCancelClick} sx={{ color: 'warning.main', border: '1px solid currentColor' }}>
              <Refresh fontSize="small" />
            </IconButton>
          ) : (
            <>
              <IconButton size="small" onClick={handleKaspiPaidClick} sx={{ p: 0.5, border: '1px solid #efefef' }}>
                <img src="/templates/kaspi.svg" alt="" style={{ width: 20 }} />
              </IconButton>
              <IconButton size="small" onClick={handleCashPaidClick} sx={{ p: 0.5, border: '1px solid #efefef' }}>
                <img src="/templates/cash.svg" alt="" style={{ width: 20 }} />
              </IconButton>
            </>
          )}
        </Box>
        <Box display="flex" gap={0.5}>
          <IconButton size="small" onClick={handleEditClick} color="primary">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={handleDeleteClick} color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
});

const ChildPayments: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { currentDate } = useDate();
  const { children, fetchChildren } = useChildren();
  const { groups, fetchGroups } = useGroups();
  const [payments, setPayments] = useState<IChildPayment[]>([]);
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
    paymentType: 'none' as 'none' | 'kaspi' | 'cash',
  });

  const [nameFilter, setNameFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'kaspi' | 'cash' | 'none'>('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const isMobile = useMediaQuery('(max-width:640px)');
  const isTablet = useMediaQuery('(max-width:1100px)');

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
        const matchesName = !search || (child?.fullName?.toLowerCase().includes(search));
        
        const gId = child ? (typeof child.groupId === 'object' ? (child.groupId as any)._id || (child.groupId as any).id : child.groupId) : null;
        const matchesGroup = groupFilter.length === 0 || groupFilter.includes(gId || '');
        
        const matchesType = paymentTypeFilter === 'all' || payment.paymentType === paymentTypeFilter;
        const matchesStatus = statusFilter === 'all' || 
          (statusFilter === 'paid' ? payment.status === 'paid' : payment.status !== 'paid');
        
        return matchesName && matchesGroup && matchesType && matchesStatus;
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
          _debt: (p.total || 0) + (p.accruals || 0) - (p.paidAmount || 0) - (p.deductions || 0),
          _periodStart: p.period?.start ? new Date(p.period.start).getTime() : 0
        };
      });
  }, [payments, childrenMap, groupsMap, nameFilter, groupFilter]);

  const { items: sortedPayments, requestSort, sortConfig } = useSort(processedPayments);

  const handleMarkAsPaid = useCallback(async (paymentId: string, paymentType: 'kaspi' | 'cash' = 'kaspi') => {
    try {
      const payment = payments.find(p => p._id === paymentId);
      if (!payment) return;
      const totalAmount = (payment.total || 0) + (payment.accruals || 0) - (payment.deductions || 0);
      await childPaymentApi.update(paymentId, {
        status: 'paid',
        paidAmount: totalAmount,
        paymentDate: new Date(),
        paymentType: paymentType
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
        paymentType: payment.paymentType || 'none',
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
        paymentType: 'none',
      });
    }
    setModalOpen(true);
  }, [childrenMap]);

  // Автоматический перенос переплаты в надбавки
  useEffect(() => {
    if (modalOpen) {
      const netTotal = (newPayment.total || 0) - (newPayment.deductions || 0);
      if (newPayment.paidAmount > netTotal) {
        const diff = newPayment.paidAmount - netTotal;
        if (newPayment.accruals !== diff) {
          setNewPayment(prev => ({ ...prev, accruals: diff }));
        }
      }
    }
  }, [newPayment.paidAmount, newPayment.total, newPayment.deductions, modalOpen]);

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
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent='space-between'
        mb={2}
        gap={isMobile ? 1.5 : 2}
      >
        <Box display='flex' alignItems='center' gap={2} width={isMobile ? '100%' : 'auto'} justifyContent="space-between">
          <Typography variant={isMobile ? 'h5' : 'h4'} fontWeight="bold">
            Оплаты
          </Typography>
          {!loading && !error && (
            <Chip 
              label={sortedPayments.length} 
              size="small" 
              color="primary" 
              variant="outlined" 
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap" width={isMobile ? '100%' : 'auto'}>
          <Box display="flex" gap={1} width="100%" justifyContent={isMobile ? 'space-between' : 'flex-start'}>
            <AuditLogButton entityType="childPayment" />
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={() => handleOpenModal()}
              fullWidth={isMobile}
              size={isMobile ? "medium" : "medium"}
              sx={{ flexGrow: isMobile ? 1 : 0 }}
            >
              Добавить
            </Button>
          </Box>
          <Box display="flex" gap={1} width="100%" flexWrap={isMobile ? 'nowrap' : 'wrap'} overflow={isMobile ? 'auto' : 'visible'} sx={{ pb: isMobile ? 1 : 0 }}>
            <Button
              variant='outlined'
              size="small"
              startIcon={isImporting ? <CircularProgress size={16} /> : <FileUpload />}
              onClick={handleImportChildPayments}
              disabled={isImporting || loading}
              sx={{ minWidth: isMobile ? 'fit-content' : 'auto', whiteSpace: 'nowrap' }}
            >
              Импорт
            </Button>
            <Button
              variant='outlined'
              size="small"
              color='secondary'
              startIcon={isGenerating ? <CircularProgress size={16} /> : <Refresh />}
              onClick={handleGeneratePayments}
              disabled={isGenerating || loading}
              sx={{ minWidth: isMobile ? 'fit-content' : 'auto', whiteSpace: 'nowrap' }}
            >
              Обновить
            </Button>
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleExport}
              sx={{ minWidth: isMobile ? 'fit-content' : 'auto' }}
            >
              Экспорт
            </Button>
          </Box>
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
        gap={isMobile ? 1.5 : 2}
        mb={2}
        sx={{ 
          p: isMobile ? 1.5 : 2, 
          backgroundColor: '#f8f9fa', 
          borderRadius: 2,
          border: '1px solid #eee'
        }}
      >
        <TextField
          label='Поиск по имени'
          variant='outlined'
          size={isMobile ? "small" : "medium"}
          fullWidth={isMobile}
          value={searchQuery}
          onChange={handleSearchChange}
          sx={{ minWidth: isMobile ? '100%' : 250 }}
        />

        <FormControl fullWidth={isMobile} size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? '100%' : 250 }}>
          <InputLabel>Группы</InputLabel>
          <Select
            multiple
            value={groupFilter}
            label='Группы'
            onChange={(e) => {
              const value = e.target.value;
              const values = typeof value === 'string' ? value.split(',') : value;
              if (values.includes('')) {
                setGroupFilter([]);
              } else {
                setGroupFilter(values);
              }
            }}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.length === 0 ? 'Все' : (
                  isMobile && selected.length > 1 ? (
                    <Typography variant="body2">{`Выбрано: ${selected.length}`}</Typography>
                  ) : (
                    selected.map((value) => (
                      <Chip
                        key={value}
                        label={groupsMap.get(value)?.name || value}
                        size="small"
                        onDelete={() => setGroupFilter(groupFilter.filter((id) => id !== value))}
                        onMouseDown={(e) => e.stopPropagation()}
                      />
                    ))
                  )
                )}
              </Box>
            )}
          >
            <MenuItem value="">
              <em>Все группы</em>
            </MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                <Checkbox checked={groupFilter.indexOf(group._id) > -1} />
                <ListItemText primary={group.name} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth={isMobile} size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? '100%' : 180 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={statusFilter}
            label='Статус'
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="paid">Оплачено</MenuItem>
            <MenuItem value="unpaid">Не оплачено</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth={isMobile} size={isMobile ? "small" : "medium"} sx={{ minWidth: isMobile ? '100%' : 200 }}>
          <InputLabel>Тип оплаты</InputLabel>
          <Select
            value={paymentTypeFilter}
            label='Тип оплаты'
            onChange={(e) => setPaymentTypeFilter(e.target.value as any)}
          >
            <MenuItem value="all">Все</MenuItem>
            <MenuItem value="kaspi">Kaspi</MenuItem>
            <MenuItem value="cash">Наличные</MenuItem>
            <MenuItem value="none">Не указано</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {(loading || isGenerating) && <CircularProgress sx={{ m: 2 }} />}
      {error && <Alert severity='error' sx={{ m: 2 }}>{error}</Alert>}

      {!loading && !isGenerating && (
        <Box sx={{ px: isMobile ? 1 : 0 }}>
          {sortedPayments.length > 0 ? (
            isMobile ? (
              <Box mt={2}>
                {sortedPayments.map((payment, index) => {
                  const childId = typeof payment.childId === 'string' ? payment.childId : payment.childId?._id;
                  const child = childrenMap.get(childId || '');
                  const gId = child ? (typeof child.groupId === 'object' ? (child.groupId as any)._id || (child.groupId as any).id : child.groupId) : null;
                  const groupName = gId ? groupsMap.get(gId)?.name || 'Нет группы' : 'Нет группы';

                  return (
                    <PaymentCard
                      key={payment._id}
                      payment={payment}
                      child={child}
                      groupName={groupName}
                      onMarkAsPaid={handleMarkAsPaid}
                      onCancelPayment={handleCancelPayment}
                      onOpenModal={handleOpenModal}
                      onDelete={handleDelete}
                      getPaymentStatusColor={getPaymentStatusColor}
                      index={index}
                    />
                  );
                })}
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ mt: 2, boxShadow: 3, maxWidth: 1600, ml: 'auto', mr: 'auto', overflowX: 'auto' }}>
              <Table size={isMobile ? 'small' : 'medium'} sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', width: 40, p: isMobile ? 0.5 : 1 }}>#</TableCell>
                    <TableCell align='center' sx={{ fontWeight: 'bold', width: 100, p: isMobile ? 0.5 : 1 }}>Оплата</TableCell>
                    <TableCell sx={{ p: isMobile ? 0.5 : 1 }}>
                      <TableSortLabel
                        active={sortConfig.key === '_childName'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_childName')}
                      >
                        Ребенок
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 120, p: isMobile ? 0.5 : 1 }}>
                      <TableSortLabel
                        active={sortConfig.key === '_groupName'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_groupName')}
                      >
                        Группа
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 160, p: isMobile ? 0.5 : 1 }}>
                      <TableSortLabel
                        active={sortConfig.key === '_periodStart'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_periodStart')}
                      >
                        Период
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 110, p: isMobile ? 0.5 : 1 }}>
                      <TableSortLabel
                        active={sortConfig.key === 'paidAmount'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('paidAmount')}
                      >
                        Оплачено
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 110, p: isMobile ? 0.5 : 1 }}>
                      <TableSortLabel
                        active={sortConfig.key === '_debt'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('_debt')}
                      >
                        Долг
                      </TableSortLabel>
                    </TableCell>
                    <TableCell sx={{ width: 90, textAlign: 'center', p: isMobile ? 0.5 : 1 }}>Надбавки</TableCell>
                    <TableCell sx={{ width: 90, textAlign: 'center', p: isMobile ? 0.5 : 1 }}>Вычеты</TableCell>
                    <TableCell sx={{ width: 150, p: isMobile ? 0.5 : 1 }}>Комментарии</TableCell>
                    <TableCell sx={{ width: 120, p: isMobile ? 0.5 : 1 }}>
                      <TableSortLabel
                        active={sortConfig.key === 'status'}
                        direction={sortConfig.direction || 'asc'}
                        onClick={() => requestSort('status')}
                      >
                        Статус
                      </TableSortLabel>
                    </TableCell>
                    <TableCell align='right' sx={{ width: 90, p: isMobile ? 0.5 : 1 }}>Действия</TableCell>
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
          )
        ) : (
          <Box mt={4} textAlign='center'>
            <Typography variant='h6' color='text.secondary'>
              Платежи не найдены
            </Typography>
          </Box>
        )}
      </Box>
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
              value={newPayment.total === 0 && !editingPayment ? '' : newPayment.total}
              onChange={(e) => setNewPayment({ ...newPayment, total: e.target.value === '' ? 0 : Number(e.target.value) })}
              disabled={currentUser?.role !== 'admin'}
            />
            <TextField
              label='Оплачено'
              type='number'
              value={newPayment.paidAmount === 0 ? '' : newPayment.paidAmount}
              onChange={(e) => setNewPayment({ ...newPayment, paidAmount: e.target.value === '' ? 0 : Number(e.target.value) })}
              disabled={currentUser?.role !== 'admin'}
            />
            <TextField
              label='Надбавки'
              type='number'
              value={newPayment.accruals === 0 ? '' : newPayment.accruals}
              onChange={(e) => setNewPayment({ ...newPayment, accruals: e.target.value === '' ? 0 : Number(e.target.value) })}
              disabled={currentUser?.role !== 'admin'}
            />
            <TextField
              label='Вычеты'
              type='number'
              value={newPayment.deductions === 0 ? '' : newPayment.deductions}
              onChange={(e) => setNewPayment({ ...newPayment, deductions: e.target.value === '' ? 0 : Number(e.target.value) })}
              disabled={currentUser?.role !== 'admin'}
            />
            <FormControl fullWidth>
              <InputLabel>Тип оплаты</InputLabel>
              <Select
                value={newPayment.paymentType}
                label="Тип оплаты"
                onChange={(e) => setNewPayment({ ...newPayment, paymentType: e.target.value as any })}
              >
                <MenuItem value="none">Не указано</MenuItem>
                <MenuItem value="kaspi">Kaspi</MenuItem>
                <MenuItem value="cash">Наличные</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label='Комментарии'
              value={newPayment.comments}
              onChange={(e) => setNewPayment({ ...newPayment, comments: e.target.value })}
              multiline
              rows={2}
            />
            <Box sx={{ p: 2, bgcolor: '#f0f7ff', borderRadius: 1, border: '1px solid #cce3ff' }}>
              <Box display='flex' justifyContent='space-between' mb={1}>
                <Typography variant='body2'>Итого к оплате (с учетом корректировок):</Typography>
                <Typography variant='body2' fontWeight='bold'>
                  {(newPayment.total + (newPayment.accruals || 0) - (newPayment.deductions || 0)).toLocaleString()} ₸
                </Typography>
              </Box>
              <Box display='flex' justifyContent='space-between'>
                <Typography variant='body2'>Баланс (Долг / Переплата):</Typography>
                <Typography
                  variant='body2'
                  fontWeight='bold'
                  color={(newPayment.total + (newPayment.accruals || 0) - (newPayment.deductions || 0) - newPayment.paidAmount) > 0 ? 'error.main' : 'success.main'}
                >
                  {(newPayment.total + (newPayment.accruals || 0) - (newPayment.deductions || 0) - newPayment.paidAmount).toLocaleString()} ₸
                </Typography>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          {editingPayment && editingPayment.status !== 'paid' && (
            <Button
              onClick={async () => {
                await handleMarkAsPaid(editingPayment._id);
                handleCloseModal();
              }}
              color="success"
              variant="outlined"
            >
              Мгновенная оплата
            </Button>
          )}
          <Button onClick={handleSavePayment} variant='contained' color="primary">Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChildPayments;
