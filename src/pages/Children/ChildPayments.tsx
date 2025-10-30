import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Alert, Button, useMediaQuery, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Select, InputLabel, FormControl, Avatar, Tooltip, Snackbar, Autocomplete
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { IChildPayment, Child, Group } from '../../types/common';
import childPaymentApi from '../../services/childPayment';
import childrenApi from '../../services/children';
import { groupsApi } from '../../services/groups';

const ChildPayments: React.FC = () => {
  const [payments, setPayments] = useState<IChildPayment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<IChildPayment | null>(null);
  const [newPayment, setNewPayment] = useState({
    childId: '',
    period: {
      start: '',
      end: ''
    },
    amount: 0,
    total: 0,
    status: 'active' as 'active' | 'overdue' | 'paid' | 'draft',
    accruals: 0,
    deductions: 0,
    comments: ''
  });
  
  // Состояния для фильтрации
  const [nameFilter, setNameFilter] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  
  // Фильтрованные платежи
  const [filteredPayments, setFilteredPayments] = useState<IChildPayment[]>([]);
  const [childSearch, setChildSearch] = useState('');

  const isMobile = useMediaQuery('(max-width:900px)');

  // Загрузка оплат, детей и групп
  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const paymentsList = await childPaymentApi.getAll();
      setPayments(paymentsList);
    } catch (e: any) {
      setError(e?.message || 'Ошибка загрузки оплат');
    } finally {
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const childrenList = await childrenApi.getAll();
      setChildren(childrenList);
    } catch {
      setChildren([]);
    }
  };

  const fetchGroups = async () => {
    try {
      const groupsList = await groupsApi.getAll();
      setGroups(groupsList);
    } catch {
      setGroups([]);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchChildren();
    fetchGroups();
  }, []);

  // Инициализация filteredPayments после загрузки данных
 useEffect(() => {
    setFilteredPayments([...payments]);
  }, [payments]);

  // Фильтрация платежей при изменении данных или фильтров
 useEffect(() => {
    let result = [...payments];
    
    // Фильтрация по имени ребенка
    if (nameFilter) {
      result = result.filter(payment => {
        const child = children.find(c => c._id === (typeof payment.childId === 'string' ? payment.childId : payment.childId?._id));
        return child && child.fullName.toLowerCase().includes(nameFilter.toLowerCase());
      });
    }
    
    // Фильтрация по группе
    if (groupFilter) {
      result = result.filter(payment => {
        const child = children.find(c => c._id === (typeof payment.childId === 'string' ? payment.childId : payment.childId?._id));
        return child && ((typeof child.groupId === 'object' ? child.groupId?._id : child.groupId) === groupFilter);
      });
    }
    
    setFilteredPayments(result);
 }, [payments, children, nameFilter, groupFilter]);

  const handleOpenModal = (payment?: IChildPayment) => {
    if (payment) {
      setEditingPayment(payment);
      // При редактировании платежа, если childId является объектом, извлекаем _id
      const childIdValue = typeof payment.childId === 'object' ? payment.childId._id : payment.childId;
      
      setNewPayment({
        childId: childIdValue as any || '',
        period: payment.period || { start: '', end: '' },
        amount: payment.amount || 0,
        total: payment.total || 0,
        status: payment.status || 'active',
        accruals: payment.accruals || 0,
        deductions: payment.deductions || 0,
        comments: payment.comments || ''
      });
    } else {
      setEditingPayment(null);
      setNewPayment({
        childId: '',
        period: {
          start: '',
          end: ''
        },
        amount: 0,
        total: 0,
        status: 'active' as const,
        accruals: 0,
        deductions: 0,
        comments: ''
      });
    }
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingPayment(null);
  };

  const handleSavePayment = async () => {
    try {
      if (editingPayment) {
        await childPaymentApi.update(editingPayment._id, {
          ...newPayment,
          childId: newPayment.childId || undefined
        });
      } else {
        await childPaymentApi.create({
          ...newPayment,
          childId: newPayment.childId || undefined
        });
      }
      fetchPayments();
      handleCloseModal();
    } catch (e: any) {
      setError(e?.message || 'Ошибка сохранения оплаты');
    }
 };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Удалить запись оплаты?')) return;
    try {
      await childPaymentApi.deleteItem(id);
      fetchPayments();
    } catch (e: any) {
      setError(e?.message || 'Ошибка удаления оплаты');
    }
 };

  const getChildName = (childId: string) => {
    const child = children.find(c => c._id === childId || c.id === childId);
    return child ? child.fullName : 'Неизвестный ребенок';
  };

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g._id === groupId);
    return group ? group.name : 'Группа не указана';
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#4CAF50'; // зеленый для оплачено
      case 'overdue': return '#F44336'; // красный для просрочено
      case 'active': return '#FFC107'; // желтый для активно
      case 'draft': return '#9E9E9E'; // серый для черновика
      default: return '#B0B0B0'; // стандартный цвет
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'overdue': return 'error';
      case 'active': return 'warning';
      case 'draft': return 'info';
      default: return 'default';
    }
  };

  // Состояние для управления всплывающим сообщением
  const [showInitialTooltip, setShowInitialTooltip] = useState(false);

  // Автоматическое отображение подсказки при загрузке страницы
  useEffect(() => {
    setShowInitialTooltip(true);
    const timer = setTimeout(() => {
      setShowInitialTooltip(false);
    }, 4000);
    
    return () => clearTimeout(timer);
  }, []);

  // Функция для установки статуса оплаты в "Оплачено"
  const markAsPaid = async (paymentId: string) => {
    try {
      await childPaymentApi.update(paymentId, { status: 'paid' });
      // Обновляем список оплат
      fetchPayments();
    } catch (error) {
      console.error('Ошибка при установке статуса "Оплачено"', error);
      setError('Ошибка при изменении статуса оплаты');
    }
  };

  // Функция для отмены оплаты
  const cancelPayment = async (paymentId: string) => {
    try {
      await childPaymentApi.update(paymentId, { status: 'active' });
      // Обновляем список оплат
      fetchPayments();
    } catch (error) {
      console.error('Ошибка при отмене оплаты', error);
      setError('Ошибка при отмене оплаты');
    }
  };

  return (
    <Box>
      {/* Всплывающее сообщение при загрузке */}
      <Snackbar
        open={showInitialTooltip}
        message="Нажмите на кнопку для отметки оплаты"
        autoHideDuration={4000}
        onClose={() => setShowInitialTooltip(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        justifyContent="space-between"
        mb={2}
        gap={isMobile ? 2 : 0}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <Typography variant={isMobile ? 'h5' : 'h4'} gutterBottom sx={{ mb: isMobile ? 1 : 0 }}>
            Оплаты за посещение детей
          </Typography>
          {!loading && !error && (
            <Typography variant="h6" color="textSecondary" sx={{ mb: isMobile ? 1 : 0 }}>
              ({filteredPayments.length} {filteredPayments.length === 1 ? 'оплата' : filteredPayments.length < 5 ? 'оплаты' : 'оплат'})
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenModal()}
          sx={{ width: isMobile ? '100%' : 'auto', mt: isMobile ? 1 : 0 }}
        >
          Добавить оплату
        </Button>
      </Box>
      
      {/* Фильтры */}
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        alignItems={isMobile ? 'stretch' : 'center'}
        gap={2}
        mb={2}
        sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}
      >
        <TextField
          label="Фильтр по имени"
          variant="outlined"
          fullWidth={isMobile}
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          sx={{ minWidth: isMobile ? '100%' : 250 }}
        />
        
        <FormControl fullWidth={isMobile} sx={{ minWidth: isMobile ? '100%' : 250 }}>
          <InputLabel>Фильтр по группе</InputLabel>
          <Select
            value={groupFilter}
            label="Фильтр по группе"
            onChange={(e) => setGroupFilter(e.target.value)}
          >
            <MenuItem value="">Все группы</MenuItem>
            {groups.map((group) => (
              <MenuItem key={group._id} value={group._id}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar
                    sx={{
                      width: 20,
                      height: 20,
                      bgcolor: '#B0B0B0',
                      fontSize: '0.7rem'
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
      {loading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!loading && payments.length === 0 && (
        <Alert severity="info">Нет данных об оплатах</Alert>
      )}
      
      {/* Статистика по оплатам */}
      
      {/* Статистика по оплатам */}
      {!loading && filteredPayments.length > 0 && (
        <Box
          display="flex"
          flexWrap="wrap"
          gap={2}
          mb={2}
          p={2}
          sx={{
            backgroundColor: '#f9',
            borderRadius: 1,
            border: '1px solid #e0e0'
          }}
        >
          <Box
            flex="1 1 200px"
            p={2}
            sx={{
              backgroundColor: '#E8F5E9',
              borderRadius: 1,
              borderLeft: '4px solid #4CAF50'
            }}
          >
            <Typography variant="h6" color="textSecondary">Оплачено</Typography>
            <Typography variant="h4" color="success.main">
              {filteredPayments.filter(p => p.status === 'paid').length}
            </Typography>
          </Box>
          
          <Box
            flex="1 1 200px"
            p={2}
            sx={{
              backgroundColor: '#FFF3E0',
              borderRadius: 1,
              borderLeft: '4px solid #FFC107'
            }}
          >
            <Typography variant="h6" color="textSecondary">Активно</Typography>
            <Typography variant="h4" color="warning.main">
              {filteredPayments.filter(p => p.status === 'active').length}
            </Typography>
          </Box>
          
          <Box
            flex="1 1 200px"
            p={2}
            sx={{
              backgroundColor: '#FFEBEE',
              borderRadius: 1,
              borderLeft: '4px solid #F44336'
            }}
          >
            <Typography variant="h6" color="textSecondary">Просрочено</Typography>
            <Typography variant="h4" color="error.main">
              {filteredPayments.filter(p => p.status === 'overdue').length}
            </Typography>
          </Box>
          
          <Box
            flex="1 1 200px"
            p={2}
            sx={{
              backgroundColor: '#E0E0E0',
              borderRadius: 1,
              borderLeft: '4px solid #9E9E9E'
            }}
          >
            <Typography variant="h6" color="textSecondary">Всего</Typography>
            <Typography variant="h4" color="textPrimary">
              {filteredPayments.length}
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
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}></TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Ребенок</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Группа</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Период</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Сумма</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Всего</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Надбавки</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Вычеты</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Комментарии</TableCell>
              <TableCell sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Статус</TableCell>
              <TableCell align="right" sx={{ fontSize: isMobile ? '0.9rem' : '1rem', p: isMobile ? 1 : 2 }}>Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPayments.map(payment => {
              const child = children.find(c => c._id === (typeof payment.childId === 'string' ? payment.childId : payment.childId?._id));
              const paymentStatusColor = getPaymentStatusColor(payment.status);
              
              return (
                <TableRow
                  key={payment._id}
                  sx={{
                    borderLeft: `4px solid ${paymentStatusColor}`,
                    '&:hover': { backgroundColor: '#f9f9f9' }
                  }}
                >
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    <Tooltip
                      title={payment.status === 'paid' ? 'Отменить оплату' : 'Нажмите на кнопку для отметки оплаты'}
                      placement="right"
                    >
                      <IconButton
                        size={isMobile ? 'small' : 'medium'}
                        onClick={() => payment.status === 'paid' ? cancelPayment(payment._id) : markAsPaid(payment._id)}
                        disabled={false}
                        sx={{
                          width: 44,
                          height: 44,
                          minWidth: 44,
                          minHeight: 44,
                          borderRadius: '50%',
                          bgcolor: payment.status === 'paid' ? 'error.light' : 'primary.main',
                          color: payment.status === 'paid' ? 'error.main' : 'white',
                          '&:hover': {
                            bgcolor: payment.status === 'paid' ? 'error.light' : 'primary.dark',
                          },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {payment.status === 'paid' ? (
                          <span style={{ fontSize: '22px', color: 'white' }}>✕</span>
                        ) : (
                          <span style={{ fontSize: '22px' }}>₸</span>
                        )}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {payment.childId ? (
                      typeof payment.childId === 'object'
                        ? payment.childId.fullName
                        : getChildName(payment.childId)
                    ) : 'Не указан'}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {child ? (
                      typeof child.groupId === 'object'
                        ? child.groupId.name
                        : getGroupName(child.groupId as string)
                    ) : 'Не указана'}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    {payment.period.start} - {payment.period.end}
                  </TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.amount} ₸</TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.total} ₸</TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.accruals || 0} ₸</TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.deductions || 0} ₸</TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>{payment.comments || ''}</TableCell>
                  <TableCell sx={{ p: isMobile ? 1 : 2 }}>
                    <Typography color={getStatusColor(payment.status)} variant="body2">
                      {payment.status === 'paid' ? 'Оплачено' :
                       payment.status === 'overdue' ? 'Просрочено' :
                       payment.status === 'active' ? 'Активно' : 'Черновик'}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ p: isMobile ? 1 : 2 }}>
                    <IconButton size={isMobile ? 'small' : 'medium'} onClick={() => handleOpenModal(payment)}>
                      <Edit fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                    <IconButton size={isMobile ? 'small' : 'medium'} onClick={() => payment._id && handleDelete(payment._id)}>
                      <Delete fontSize={isMobile ? 'small' : 'medium'} />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Модальное окно для добавления/редактирования оплаты */}
      <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPayment ? 'Редактировать оплату' : 'Добавить оплату'}
        </DialogTitle>
        <DialogContent>
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <Autocomplete
              options={children}
              getOptionLabel={(option) => {
                const group = groups.find(g => g._id === (typeof option.groupId === 'object' ? option.groupId?._id : option.groupId));
                return `${option.fullName} (${group ? group.name : 'Без группы'})`;
              }}
              value={children.find(c => c._id === newPayment.childId) || null}
              onChange={(_, newValue) => {
                setNewPayment({ ...newPayment, childId: newValue?._id || '' });
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Ребенок"
                  variant="outlined"
                  onChange={(e) => setChildSearch(e.target.value)}
                />
              )}
              noOptionsText="Ребенок не найден"
            />
            <TextField
              label="Период начала (например, 2025-10-01)"
              type="date"
              value={newPayment.period.start}
              onChange={(e) => setNewPayment({
                ...newPayment,
                period: {
                  ...newPayment.period,
                  start: e.target.value
                }
              })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Период окончания (например, 2025-10-31)"
              type="date"
              value={newPayment.period.end}
              onChange={(e) => setNewPayment({
                ...newPayment,
                period: {
                  ...newPayment.period,
                  end: e.target.value
                }
              })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Сумма"
              type="number"
              value={newPayment.amount}
              onChange={(e) => setNewPayment({...newPayment, amount: Number(e.target.value)})}
            />
            <TextField
              label="Всего"
              type="number"
              value={newPayment.total}
              onChange={(e) => setNewPayment({...newPayment, total: Number(e.target.value)})}
            />
            <TextField
              label="Надбавки"
              type="number"
              value={newPayment.accruals}
              onChange={(e) => setNewPayment({...newPayment, accruals: Number(e.target.value)})}
            />
            <TextField
              label="Вычеты"
              type="number"
              value={newPayment.deductions}
              onChange={(e) => setNewPayment({...newPayment, deductions: Number(e.target.value)})}
            />
            <TextField
              label="Комментарии"
              value={newPayment.comments}
              onChange={(e) => setNewPayment({...newPayment, comments: e.target.value})}
              multiline
              rows={3}
            />
            <TextField
              select
              label="Статус"
              value={newPayment.status}
              onChange={(e) => setNewPayment({
                ...newPayment,
                status: e.target.value as 'active' | 'overdue' | 'paid' | 'draft'
              })}
              SelectProps={{
                native: true,
              }}
            >
              <option value="active">Активно</option>
              <option value="paid">Оплачено</option>
              <option value="overdue">Просрочено</option>
              <option value="draft">Черновик</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Отмена</Button>
          <Button onClick={handleSavePayment} variant="contained">
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ChildPayments;