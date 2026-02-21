import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  TextField,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  Snackbar,
  Chip,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
  Delete as DeleteIcon,
  AccountBalanceWallet as DebtIcon,
} from '@mui/icons-material';
import RentTenantSelector from './RentTenantSelector';
import AddExternalSpecialistModal from './AddExternalSpecialistModal';
import AuditLogButton from '../../../shared/components/AuditLogButton';

interface Props {
  userId?: string;
}

interface CurrentUser {
  id?: string;
  role: string;
}

interface Summary {
  totalTenants: number;
  totalAmount: number;
  totalReceivable: number;
  totalDebt: number;
  totalOverpayment: number;
}

interface RentRow {
  tenantName: string;
  amount: number;
  paidAmount: number;
  debt: number;
  overpayment: number;
  status: string;
  tenantId: string;
  _id?: string;
  paymentDate?: string;
  accruals?: number;
}

const isOverduePayment = (paymentDate: string | undefined): boolean => {
  if (!paymentDate) {
    return false;
  }

  const paymentDateObj = new Date(paymentDate);
  const currentDate = new Date();

  // Убираем время из дат для корректного сравнения
  const paymentDateOnly = new Date(paymentDateObj.getFullYear(), paymentDateObj.getMonth(), paymentDateObj.getDate());
  const currentDateOnly = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());

  return paymentDateOnly < currentDateOnly;
};

const RentReport: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<RentRow[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<RentRow>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedTenantIds, setSelectedTenantIds] = useState<string[]>([]);
  const [addSpecialistModalOpen, setAddSpecialistModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { getCurrentUser } = await import('../../staff/services/auth');
        const { getRents } = await import('../services/reports');

        let currentUserData = null;
        try {
          const userData = getCurrentUser();
          if (userData) {
            currentUserData = {
              id: userData.id || userData._id,
              role: userData.role || 'staff',
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }

        const params: any = {
          month: selectedMonth,
        };

        if (currentUserData && currentUserData.role !== 'admin') {
          params.userId = currentUserData.id;
        } else if (userId) {
          params.userId = userId;
        }


        const rentsData = await getRents(params);

        if (!mounted) return;
        const data = (rentsData?.data || rentsData || []) as any[];

        const summaryData: Summary = {
          totalTenants: data.length,
          totalAmount: data.reduce((sum: number, p: any) => {
            const amount = p.amount || p.accruals || 0;
            return sum + (typeof amount === 'number' ? amount : 0);
          }, 0),
          totalReceivable: data.reduce((sum: number, p: any) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const receivable = Math.max(0, (typeof amount === 'number' ? amount : 0) - (typeof paid === 'number' ? paid : 0));
            return sum + receivable;
          }, 0),
          totalDebt: data.reduce((sum: number, p: any) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const debt = (typeof paid === 'number' && typeof amount === 'number' && paid < amount) ? amount - paid : 0;
            return sum + debt;
          }, 0),
          totalOverpayment: data.reduce((sum: number, p: any) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const overpayment = (typeof paid === 'number' && typeof amount === 'number' && paid > amount) ? paid - amount : 0;
            return sum + overpayment;
          }, 0),
        };
        setSummary(summaryData);
        setRows(
          data.map((p: any) => {
            const amount = typeof p.amount === 'number' ? p.amount : (typeof p.accruals === 'number' ? p.accruals : 0);
            const paidAmount = Math.max(
              0,
              typeof p.paidAmount === 'number' ? p.paidAmount : (typeof p.accruals === 'number' && typeof p.total === 'number' ? p.accruals - p.total : 0)
            );
            return {
              tenantName: p.tenantId?.fullName || p.tenantId?.name || 'Неизвестно',
              amount,
              paidAmount,
              debt: (typeof paidAmount === 'number' && typeof amount === 'number' && paidAmount < amount) ? amount - paidAmount : 0,
              overpayment: (typeof paidAmount === 'number' && typeof amount === 'number' && paidAmount > amount) ? paidAmount - amount : 0,
              accruals: typeof p.accruals === 'number' ? p.accruals : (typeof p.amount === 'number' ? p.amount : 0),
              status: p.status && p.status !== 'draft' ? p.status : 'active',
              tenantId: p.tenantId?._id || p.tenantId?.id || p.tenantId || '',
              _id: p._id || undefined,
              paymentDate: p.paymentDate || undefined,
            };
          }),
        );
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Ошибка загрузки аренды');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId, selectedMonth]);

  const handleEditClick = (row: RentRow) => {
    setEditingId(row.tenantId);
    setEditData({
      amount: row.amount || undefined,
      paidAmount: row.paidAmount || undefined,
      status: row.status,
      paymentDate: row.paymentDate || undefined,
    });
  };

  const handleSaveClick = async (rowId: string) => {
    try {
      const originalRow = rows.find((r) => r.tenantId === rowId);
      if (originalRow) {
        const rentId = originalRow._id;
        if (!rentId) {
          setSnackbarMessage('Ошибка: не найден ID арендной записи');
          setSnackbarOpen(true);
          return;
        }

        const amount = editData.amount !== undefined ? editData.amount : originalRow.amount;
        const paidAmount = editData.paidAmount !== undefined ? editData.paidAmount : originalRow.paidAmount;

        const updatedData = {
          ...editData,
          amount,
          paidAmount,
          debt: paidAmount < amount ? amount - paidAmount : 0,
          overpayment: paidAmount > amount ? paidAmount - amount : 0,
          total: Math.max(0, amount - paidAmount),
          paymentDate: editData.paymentDate || originalRow.paymentDate
        };

        const { updateRent } = await import('../services/reports');
        await updateRent(rentId, updatedData);

        const updatedRows = rows.map((r) =>
          r.tenantId === rowId
            ? ({
              ...r,
              ...updatedData,
              paidAmount: updatedData.paidAmount !== undefined ? updatedData.paidAmount : r.paidAmount,
            } as RentRow)
            : r,
        );

        setRows(updatedRows);

        setSummary((prev) => {
          if (!prev) return null;
          const updatedTotalReceivable = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const diff = amount - paid;
            return sum + Math.max(0, diff);
          }, 0);

          const updatedTotalAmount = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            return sum + (typeof amount === 'number' ? amount : 0);
          }, 0);

          const updatedTotalDebt = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const debt = (typeof paid === 'number' && typeof amount === 'number' && paid < amount) ? amount - paid : 0;
            return sum + debt;
          }, 0);

          const updatedTotalOverpayment = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const overpayment = (typeof paid === 'number' && typeof amount === 'number' && paid > amount) ? paid - amount : 0;
            return sum + overpayment;
          }, 0);

          return {
            totalTenants: prev.totalTenants,
            totalAmount: updatedTotalAmount,
            totalReceivable: updatedTotalReceivable,
            totalDebt: updatedTotalDebt,
            totalOverpayment: updatedTotalOverpayment,
          };
        });

        setEditingId(null);
        setEditData({});
        setSnackbarMessage('Аренда успешно обновлена');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating rent:', error);
      setSnackbarMessage('Ошибка при обновлении аренды');
      setSnackbarOpen(true);
    }
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleDeleteClick = async (row: RentRow) => {
    const rentId = row._id;
    if (!rentId) return;

    if (window.confirm(`Вы уверены, что хотите удалить арендный платеж для ${row.tenantName}?`)) {
      try {
        const { deleteRent } = await import('../services/reports');
        await deleteRent(rentId);

        const updatedRows = rows.filter((r) => r._id !== rentId);
        setRows(updatedRows);

        setSummary((prev) => {
          if (!prev) return null;
          const updatedTotalAmount = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            return sum + (typeof amount === 'number' ? amount : 0);
          }, 0);

          const updatedTotalReceivable = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const receivable = Math.max(0, (typeof amount === 'number' ? amount : 0) - (typeof paid === 'number' ? paid : 0));
            return sum + receivable;
          }, 0);

          const updatedTotalDebt = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const debt = (typeof paid === 'number' && typeof amount === 'number' && paid < amount) ? amount - paid : 0;
            return sum + debt;
          }, 0);

          const updatedTotalOverpayment = updatedRows.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            const overpayment = (typeof paid === 'number' && typeof amount === 'number' && paid > amount) ? paid - amount : 0;
            return sum + overpayment;
          }, 0);

          return {
            totalTenants: updatedRows.length,
            totalAmount: updatedTotalAmount,
            totalReceivable: updatedTotalReceivable,
            totalDebt: updatedTotalDebt,
            totalOverpayment: updatedTotalOverpayment,
          };
        });

        setSnackbarMessage('Арендный платеж удален');
        setSnackbarOpen(true);
      } catch (error) {
        console.error('Error deleting rent:', error);
        setSnackbarMessage('Ошибка при удалении аренды');
        setSnackbarOpen(true);
      }
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleExportToExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');

      const exportData = rows.map(row => {
        const total = Math.max(0, (row.amount || row.accruals || 0) - row.paidAmount);
        return {
          'Арендатор': row.tenantName,
          'Сумма аренды': row.amount || row.accruals || 0,
          'Оплачено': row.paidAmount,
          'Долг': row.debt,
          'Переплата': row.overpayment,
          'Статус': row.status,
          'Дата оплаты': row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('ru-RU') : 'Не оплачено',
        };
      });

      const worksheet = utils.json_to_sheet(exportData);

      const colWidths = [
        { wch: 25 },
        { wch: 15 },
        { wch: 20 },
        { wch: 18 },
        { wch: 12 },
        { wch: 15 },
      ];
      worksheet['!cols'] = colWidths;

      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Арендные платежи');

      const fileName = `арендные_платежи_${new Date().toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-')}.xlsx`;
      writeFile(workbook, fileName);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      setSnackbarMessage('Ошибка при экспорте файла');
      setSnackbarOpen(true);
    }
  };

  const handleGenerateRentSheets = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setSnackbarMessage('Только администратор может генерировать арендные листы');
      setSnackbarOpen(true);
      return;
    }

    try {
      setGenerating(true);
      const { generateRentSheets } = await import('../services/reports');
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      await generateRentSheets({
        period: currentMonth,
        tenantIds: selectedTenantIds.length > 0 ? selectedTenantIds : undefined
      });
      setSnackbarMessage('Арендные листы успешно сгенерированы');
      setSnackbarOpen(true);
      window.location.reload();
    } catch (error: any) {
      console.error('Error generating rent sheets:', error);
      setSnackbarMessage(error?.message || 'Ошибка генерации арендных листов');
      setSnackbarOpen(true);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' height={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton size='small' aria-label='close' color='inherit' onClick={handleSnackbarClose}>
            <CloseIcon fontSize='small' />
          </IconButton>
        }
      />

      <Box sx={{ minHeight: '100vh', background: '#f5f7fa', p: 3, width: '100%' }}>
        <Box sx={{ maxWidth: '1400px', mx: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant='h3' sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
              Арендные платежи
            </Typography>
            <Typography variant='h6' sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
              Управление арендой за {(() => {
                const [y, m] = selectedMonth.split('-');
                return new Date(Number(y), Number(m) - 1).toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
              })()}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <TextField
                label='Выберите месяц'
                type='month'
                size='small'
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          </Box>

          <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
            <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
              {[
                { label: 'Арендаторов', value: summary?.totalTenants || 0, color: '#6366f1', icon: <PeopleIcon /> },
                { label: 'Сумма аренды', value: (summary?.totalAmount || 0).toLocaleString('ru-RU') + ' ₸', color: '#10b981', icon: <EditIcon /> },
                { label: 'Оплачено', value: (rows.reduce((sum, r) => sum + (r.paidAmount || 0), 0)).toLocaleString('ru-RU') + ' ₸', color: '#2196f3', icon: <DebtIcon /> },
                { label: 'Долг', value: (summary?.totalDebt || 0).toLocaleString('ru-RU') + ' ₸', color: '#f43f5e', icon: <CancelIcon /> },
                { label: 'Переплата', value: (summary?.totalOverpayment || 0).toLocaleString('ru-RU') + ' ₸', color: '#8b5cf6', icon: <VisibilityIcon /> },
              ].map((stat, idx) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: `${stat.color}15`, color: stat.color }}>{stat.icon}</Box>
                  <Box>
                    <Typography variant='caption' color='text.secondary'>{stat.label}</Typography>
                    <Typography variant='h6' sx={{ fontWeight: 'bold' }}>{stat.value}</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Card>

          {currentUser?.role === 'admin' && (
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button variant='contained' startIcon={generating ? <CircularProgress size={20} /> : <EditIcon />} onClick={handleGenerateRentSheets} disabled={generating}>
                {generating ? 'Генерация...' : 'Сгенерировать'}
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<PeopleIcon />}
                onClick={() => setAddSpecialistModalOpen(true)}
              >
                Добавить специалиста
              </Button>
              <Button variant='outlined' color='info' startIcon={<VisibilityIcon />} onClick={handleExportToExcel}>Экспорт</Button>
              <AuditLogButton entityType="rent" />
            </Box>
          )}

          <AddExternalSpecialistModal
            open={addSpecialistModalOpen}
            onClose={() => setAddSpecialistModalOpen(false)}
            onSuccess={(specialist) => {
              setSnackbarMessage(`Специалист ${specialist.name} добавлен`);
              setSnackbarOpen(true);
              // Можно добавить обновление списка если это необходимо, но список арендаторов обновляется в селекторе
            }}
          />

          <Box sx={{ mb: 2 }}>
            <RentTenantSelector
              selectedTenantIds={selectedTenantIds}
              onTenantSelect={setSelectedTenantIds}
            />
          </Box>

          <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', mb: 4 }}>
            <CardContent sx={{ p: 0 }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table>
                  <TableHead sx={{ bgcolor: 'grey.50' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Арендатор</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Сумма аренды</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Оплачено</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Долг</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Переплата</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Дата оплаты</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Статус</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((r, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 'medium' }}>{r.tenantName}</TableCell>
                        <TableCell>
                          {editingId === r.tenantId ? (
                            <TextField
                              size='small'
                              type='number'
                              value={editData.amount ?? r.amount}
                              onChange={(e) => handleInputChange('amount', Number(e.target.value))}
                              inputProps={{ style: { fontSize: 14, textAlign: 'right' } }}
                              variant='standard'
                              sx={{ width: 100 }}
                            />
                          ) : (
                            <Typography variant='body2' sx={{ fontWeight: 'medium' }}>
                              {r.amount.toLocaleString('ru-RU')} тг
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === r.tenantId ? (
                            <TextField
                              size='small'
                              type='number'
                              value={editData.paidAmount ?? r.paidAmount}
                              onChange={(e) => handleInputChange('paidAmount', Number(e.target.value))}
                              inputProps={{ style: { fontSize: 14, textAlign: 'right' } }}
                              variant='standard'
                              sx={{ width: 100 }}
                            />
                          ) : (
                            <Typography variant='body2' color='success.main' sx={{ fontWeight: 'medium' }}>
                              +{r.paidAmount.toLocaleString('ru-RU')}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant='body2'
                            sx={{
                              fontWeight: '900',
                              color: r.debt > 0 ? 'error.main' : 'text.secondary',
                            }}
                          >
                            {r.debt.toLocaleString('ru-RU')} ₸
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant='body2'
                            sx={{
                              fontWeight: '900',
                              color: r.overpayment > 0 ? 'success.main' : 'text.secondary',
                            }}
                          >
                            {r.overpayment.toLocaleString('ru-RU')} ₸
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {editingId === r.tenantId ? (
                            <TextField
                              size='small'
                              type='date'
                              value={editData.paymentDate || r.paymentDate || ''}
                              onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                              variant='standard'
                            />
                          ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                              <Chip
                                label={r.paymentDate ? new Date(r.paymentDate).toLocaleDateString('ru-RU') : '—'}
                                size='small'
                                variant='outlined'
                                color={isOverduePayment(r.paymentDate) && (r.amount - r.paidAmount > 0) ? 'error' : 'default'}
                              />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === r.tenantId ? (
                            <Select
                              size='small'
                              value={editData.status ?? r.status}
                              onChange={(e) => handleInputChange('status', e.target.value)}
                              variant='standard'
                            >
                              <MenuItem value='active'>Активен</MenuItem>
                              <MenuItem value='paid_rent'>Оплачено</MenuItem>
                              <MenuItem value='overdue'>Просрочено</MenuItem>
                            </Select>
                          ) : (
                            <Chip
                              label={r.status === 'paid_rent' ? 'Оплачено' : r.status === 'overdue' ? 'Просрочено' : 'Активен'}
                              color={r.status === 'paid_rent' ? 'success' : r.status === 'overdue' ? 'error' : 'warning'}
                              size='small'
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === r.tenantId ? (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <IconButton color='success' onClick={() => handleSaveClick(r.tenantId)}>
                                <SaveIcon />
                              </IconButton>
                              <IconButton onClick={handleCancelClick}>
                                <CancelIcon />
                              </IconButton>
                            </Box>
                          ) : (
                            <Box sx={{ display: 'flex' }}>
                              <IconButton color='primary' onClick={() => handleEditClick(r)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton><VisibilityIcon /></IconButton>
                              {currentUser?.role === 'admin' && (
                                <IconButton color='error' onClick={() => handleDeleteClick(r)}>
                                  <CloseIcon />
                                </IconButton>
                              )}
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </>
  );
};

export default RentReport;
