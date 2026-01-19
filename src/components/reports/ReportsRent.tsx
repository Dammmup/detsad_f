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
} from '@mui/icons-material';
import { generateRentSheets } from '../../services/reports';
import RentTenantSelector from './RentTenantSelector';

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
}

interface RentRow {
  tenantName: string;
  amount: number;
  paidAmount: number;
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


  const paymentDateOnly = new Date(
    paymentDateObj.getFullYear(),
    paymentDateObj.getMonth(),
    paymentDateObj.getDate(),
  );
  const currentDateOnly = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
  );

  return paymentDateOnly < currentDateOnly;
};

const ReportsRent: React.FC<Props> = ({ userId }) => {
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

  useEffect(() => {
    let mounted = true;


    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {

        const { getCurrentUser } = await import('../../services/auth');

        const { getRents } = await import('../../services/reports');


        let currentUserData = null;
        try {
          const userData = getCurrentUser();
          if (userData) {
            currentUserData = {
              id: userData.id,
              role: userData.role || 'staff',
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }


        const params: any = {
          month: currentMonth,
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
          totalAmount: data.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            return sum + amount;
          }, 0),
          totalReceivable: data.reduce((sum, p) => {

            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            return sum + Math.max(0, amount - paid);
          }, 0),
        };

        setSummary(summaryData);
        setRows(
          data.map((p: any) => ({
            tenantName:
              p.tenantId?.fullName || p.tenantId?.name || 'Неизвестно',
            amount: p.amount || p.accruals || 0,
            paidAmount: Math.max(
              0,
              p.paidAmount ||
              (p.accruals && p.total ? p.accruals - p.total : 0) ||
              0,
            ),
            accruals: p.accruals || p.amount || 0,
            status: p.status && p.status !== 'draft' ? p.status : 'active',
            tenantId: p.tenantId?._id || p.tenantId?.id || p.tenantId || '',
            _id: p._id || undefined,
            paymentDate: p.paymentDate || undefined,
          })),
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
  }, [userId]);

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

        const rentId = originalRow._id || rowId;


        const updatedData = {
          ...editData,

          paidAmount: Math.max(
            0,
            editData.paidAmount !== undefined
              ? editData.paidAmount
              : originalRow.paidAmount,
          ),

          total: Math.max(
            0,
            (editData.amount !== undefined
              ? editData.amount
              : originalRow.amount) -
            (editData.paidAmount !== undefined
              ? editData.paidAmount
              : originalRow.paidAmount),
          ),
        };


        console.log('Updating rent with ID:', rentId);
        console.log('Edit data:', updatedData);


        const { updateRent } = await import('../../services/reports');


        await updateRent(rentId, updatedData);

        const updatedRows = rows.map((r) =>
          r.tenantId === rowId
            ? ({
              ...r,
              ...updatedData,

              paidAmount:
                updatedData.paidAmount !== undefined
                  ? updatedData.paidAmount
                  : r.paidAmount,
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
            return sum + amount;
          }, 0);

          return {
            totalTenants: prev.totalTenants,
            totalAmount: updatedTotalAmount,
            totalReceivable: updatedTotalReceivable,
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
        const { deleteRent } = await import('../../services/reports');
        await deleteRent(rentId);

        const updatedRows = rows.filter((r) => r._id !== rentId);
        setRows(updatedRows);

        // Пересчитываем сводку
        setSummary((prev) => {
          if (!prev) return null;
          return {
            totalTenants: updatedRows.length,
            totalAmount: updatedRows.reduce((sum, p) => sum + (p.amount || p.accruals || 0), 0),
            totalReceivable: updatedRows.reduce((sum, p) => sum + Math.max(0, (p.amount || p.accruals || 0) - p.paidAmount), 0),
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
      // Динамически импортируем библиотеку xlsx
      const { utils, writeFile } = await import('xlsx');

      // Подготавливаем данные для экспорта
      const exportData = rows.map(row => {
        const total = Math.max(
          0,
          (row.amount || row.accruals || 0) - row.paidAmount,
        );
        return {
          'Арендатор': row.tenantName,
          'Сумма аренды': row.amount || row.accruals || 0,
          'Оплачено/Предоплачено': row.paidAmount,
          'Остаток к оплате': total,
          'Статус': row.status,
          'Дата оплаты': row.paymentDate ? new Date(row.paymentDate).toLocaleDateString('ru-RU') : 'Не оплачено',
        };
      });

      // Создаем worksheet
      const worksheet = utils.json_to_sheet(exportData);

      // Устанавливаем ширину колонок для лучшего отображения
      const colWidths = [
        { wch: 25 }, // Арендатор
        { wch: 15 }, // Сумма аренды
        { wch: 20 }, // Оплачено/Предоплачено
        { wch: 18 }, // Остаток к оплате
        { wch: 12 }, // Статус
        { wch: 15 }, // Дата оплаты
      ];
      worksheet['!cols'] = colWidths;

      // Создаем workbook и добавляем worksheet
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Арендные платежи');

      // Генерируем имя файла с датой
      const fileName = `арендные_платежи_${new Date().toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-')}.xlsx`;

      // Сохраняем файл
      writeFile(workbook, fileName);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      setSnackbarMessage('Ошибка при экспорте файла');
      setSnackbarOpen(true);
    }
  };

  const handleGenerateRentSheets = async () => {
    if (!currentUser || currentUser.role !== 'admin') {
      setSnackbarMessage(
        'Только администратор может генерировать арендные листы',
      );
      setSnackbarOpen(true);
      return;
    }

    const monthToGenerate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;


    const generationParams: any = {
      period: monthToGenerate,
    };


    if (selectedTenantIds.length > 0) {
      generationParams.tenantIds = selectedTenantIds;
    }

    if (
      window.confirm(
        `Вы уверены, что хотите сгенерировать арендные листы за ${monthToGenerate}? Это действие создаст новые листы для ${selectedTenantIds.length > 0 ? 'выбранных арендаторов' : 'всех арендаторов'}.`,
      )
    ) {
      try {
        setGenerating(true);

        await generateRentSheets(generationParams);
        setSnackbarMessage(
          `Арендные листы успешно сгенерированы за ${monthToGenerate}`,
        );
        setSnackbarOpen(true);


        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        const { getCurrentUser } = await import('../../services/auth');

        const { getRents } = await import('../../services/reports');

        let currentUserData = null;
        try {
          const userData = getCurrentUser();
          if (userData) {
            currentUserData = {
              id: userData.id,
              role: userData.role || 'staff',
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }

        const params: any = {
          month: currentMonth,
        };

        if (currentUserData && currentUserData.role !== 'admin') {
          params.userId = currentUserData.id;
        } else if (userId) {

          params.userId = userId;
        }


        const rentsData = await getRents(params);

        const data = (rentsData?.data || rentsData || []) as any[];


        const summaryData: Summary = {
          totalTenants: data.length,
          totalAmount: data.reduce((sum, p) => {
            const amount = p.amount || p.accruals || 0;
            return sum + amount;
          }, 0),
          totalReceivable: data.reduce((sum, p) => {

            const amount = p.amount || p.accruals || 0;
            const paid = p.paidAmount || 0;
            return sum + Math.max(0, amount - paid);
          }, 0),
        };

        setSummary(summaryData);
        setRows(
          data.map((p: any) => ({
            tenantName:
              p.tenantId?.fullName || p.tenantId?.name || 'Неизвестно',
            amount: p.amount || p.accruals || 0,
            paidAmount: Math.max(
              0,
              p.paidAmount ||
              (p.accruals && p.total ? p.accruals - p.total : 0) ||
              0,
            ),
            accruals: p.accruals || p.amount || 0,
            status: p.status && p.status !== 'draft' ? p.status : 'active',
            tenantId: p.tenantId?._id || p.tenantId?.id || p.tenantId || '',
            _id: p._id || undefined,
            paymentDate: p.paymentDate || undefined,
          })),
        );
      } catch (error: any) {
        console.error('Error generating rent sheets:', error);
        setSnackbarMessage(
          error?.message || 'Ошибка генерации арендных листов',
        );
        setSnackbarOpen(true);
      } finally {
        setGenerating(false);
      }
    }
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity='error'>{error}</Alert>;
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: '#f5f7fa',
        p: 3,
      }}
    >
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton
            size='small'
            aria-label='close'
            color='inherit'
            onClick={handleSnackbarClose}
          >
            <CloseIcon fontSize='small' />
          </IconButton>
        }
      />

      <Box
        sx={{
          maxWidth: '1400px',
          mx: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 1 }}>
          <Typography variant='h3' sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
            Арендные платежи
          </Typography>
          <Typography variant='h6' sx={{ color: 'text.secondary', fontWeight: 'medium' }}>
            Управление арендными платежами за {new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </Typography>
        </Box>

        <RentTenantSelector
          selectedTenantIds={selectedTenantIds}
          onTenantSelect={setSelectedTenantIds}
        />

        {selectedTenantIds.length > 0 && (
          <Box
            sx={{
              mb: 1,
              p: 2,
              background: '#eff6ff',
              borderRadius: 3,
              border: '1px solid #dbeafe'
            }}
          >
            <Typography variant='subtitle2' sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
              Выбрано арендаторов: {selectedTenantIds.length}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {rows
                .filter((row) => selectedTenantIds.includes(row.tenantId))
                .map((row, index) => (
                  <Chip
                    key={index}
                    label={row.tenantName}
                    size='small'
                    color='primary'
                    variant='outlined'
                  />
                ))}
            </Box>
          </Box>
        )}

        <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <Box sx={{ p: 3, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 3 }}>
            {[
              { label: 'Арендаторов', value: summary?.totalTenants || 0, color: '#6366f1', icon: <PeopleIcon /> },
              { label: 'Общая сумма', value: (summary?.totalAmount || 0).toLocaleString('ru-RU') + ' ₸', color: '#10b981', icon: <EditIcon /> },
              { label: 'К получению', value: (rows.reduce((sum, r) => sum + Math.max(0, (r.amount || r.accruals || 0) - r.paidAmount), 0)).toLocaleString('ru-RU') + ' ₸', color: '#8b5cf6', icon: <VisibilityIcon /> },
              { label: 'Просрочено', value: (rows.filter(r => isOverduePayment(r.paymentDate)).reduce((sum, r) => sum + Math.max(0, (r.amount || r.accruals || 0) - r.paidAmount), 0)).toLocaleString('ru-RU') + ' ₸', color: '#f43f5e', icon: <CancelIcon /> },
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

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Tooltip title="Экспортировать данные в формате XLSX">
            <Button variant='contained' color='success' startIcon={<VisibilityIcon />} onClick={handleExportToExcel}>Экспорт XLSX</Button>
          </Tooltip>
          {currentUser?.role === 'admin' && (
            <Tooltip title="Сгенерировать арендные листы">
              <Button variant='contained' startIcon={generating ? <CircularProgress size={20} /> : <EditIcon />} onClick={handleGenerateRentSheets} disabled={generating}>
                {generating ? 'Генерация...' : 'Сгенерировать'}
              </Button>
            </Tooltip>
          )}
        </Box>

        <Card elevation={0} sx={{ borderRadius: 3, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', mb: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Арендатор</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>Сумма аренды</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>Оплачено</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>Остаток</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>Дата оплаты</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }} align='right'>Статус</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{ width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'primary.main', color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>
                            {r.tenantName.charAt(0).toUpperCase()}
                          </Box>
                          {r.tenantName}
                        </Box>
                      </TableCell>
                      <TableCell align='right'>
                        {editingId === r.tenantId ? (
                          <TextField
                            size='small'
                            type='number'
                            value={editData.amount ?? ''}
                            onChange={(e) =>
                              handleInputChange(
                                'amount',
                                e.target.value ? Number(e.target.value) : '',
                              )
                            }
                            sx={{ width: 100 }}
                          />
                        ) : (
                          (r.amount || 0).toLocaleString()
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        {editingId === r.tenantId ? (
                          <TextField
                            size='small'
                            type='number'
                            value={editData.paidAmount ?? ''}
                            onChange={(e) =>
                              handleInputChange(
                                'paidAmount',
                                e.target.value ? Number(e.target.value) : '',
                              )
                            }
                            sx={{ width: 100 }}
                          />
                        ) : (
                          (r.paidAmount || 0).toLocaleString()
                        )}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontWeight: 'bold',
                          color: (r.amount || r.accruals || 0) - r.paidAmount > 0 ? 'error.main' : 'success.main',
                        }}
                      >
                        {Math.max(0, (r.amount || r.accruals || 0) - r.paidAmount).toLocaleString()}
                      </TableCell>
                      <TableCell align='right'>
                        {editingId === r.tenantId ? (
                          <TextField
                            size='small'
                            type='date'
                            value={editData.paymentDate || r.paymentDate || ''}
                            onChange={(e) => handleInputChange('paymentDate', e.target.value)}
                            InputLabelProps={{ shrink: true }}
                          />
                        ) : r.paymentDate ? (
                          new Date(r.paymentDate).toLocaleDateString('ru-RU')
                        ) : (
                          '—'
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        {editingId === r.tenantId ? (
                          <FormControl size='small' sx={{ minWidth: 120 }}>
                            <Select
                              value={editData.status ?? r.status}
                              onChange={(e) => handleInputChange('status', e.target.value)}
                            >
                              <MenuItem value='active'>Активен</MenuItem>
                              <MenuItem value='paid'>Оплачен</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={isOverduePayment(r.paymentDate) ? 'Просрочен' : r.status === 'active' ? 'Активен' : 'Оплачен'}
                            size='small'
                            sx={{
                              fontWeight: 'bold',
                              borderRadius: 1.5,
                              bgcolor: isOverduePayment(r.paymentDate) ? '#fff1f2' : r.status === 'paid' ? '#f0fdf4' : '#eff6ff',
                              color: isOverduePayment(r.paymentDate) ? '#e11d48' : r.status === 'paid' ? '#166534' : '#1e40af',
                              border: 'none',
                              px: 1
                            }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === r.tenantId ? (
                          <>
                            <Tooltip title='Сохранить'>
                              <IconButton
                                color='success'
                                size='small'
                                onClick={() => handleSaveClick(r.tenantId)}
                                sx={{ mr: 1 }}
                              >
                                <SaveIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Отменить'>
                              <IconButton
                                color='error'
                                size='small'
                                onClick={handleCancelClick}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        ) : (
                          <>
                            <Tooltip title='Редактировать'>
                              <IconButton
                                color='primary'
                                size='small'
                                onClick={() => handleEditClick(r)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title='Удалить'>
                              <IconButton
                                color='error'
                                size='small'
                                onClick={() => handleDeleteClick(r)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </>
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
  );
};

export default ReportsRent;
