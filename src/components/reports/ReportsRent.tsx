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

  const handleInputChange = (field: string, value: any) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleExportToExcel = () => {

    let csvContent = 'data:text/csv;charset=utf-8,';


    csvContent +=
      'Арендатор;Сумма аренды;Оплачено/Предоплачено;Остаток к оплате;Статус;Дата оплаты\n';


    rows.forEach((row) => {
      const total = Math.max(
        0,
        (row.amount || row.accruals || 0) - row.paidAmount,
      );
      csvContent += `${row.tenantName};${row.amount || row.accruals || 0};${row.paidAmount};${total};${row.status};${row.paymentDate || ''}\n`;
    });


    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `арендные_платежи_${new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}.csv`,
    );
    document.body.appendChild(link);


    link.click();


    document.body.removeChild(link);
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
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e4edf5 100%)',
        p: 3,
      }}
    >
      {/* Добавляем Snackbar для отображения сообщений */}
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
        {/* Заголовок страницы */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            px: 2,
          }}
        >
          <Typography
            variant='h3'
            sx={{
              fontWeight: 'bold',
              color: 'primary.main',
              mb: 1,
              textShadow: '0 2px 4px rgba(0,0,0.1)',
            }}
          >
            Арендные платежи
          </Typography>
          <Typography
            variant='h6'
            sx={{
              color: 'text.secondary',
              fontWeight: 'medium',
            }}
          >
            Управление арендными платежами за{' '}
            {new Date().toLocaleString('ru-RU', {
              month: 'long',
              year: 'numeric',
            })}
          </Typography>
        </Box>

        {/* Компонент выбора арендаторов */}
        <RentTenantSelector
          selectedTenantIds={selectedTenantIds}
          onTenantSelect={setSelectedTenantIds}
        />

        {/* Отображение выбранных арендаторов */}
        {selectedTenantIds.length > 0 && (
          <Box
            sx={{
              mb: 2,
              p: 2,
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderRadius: 2,
            }}
          >
            <Typography
              variant='h6'
              sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}
            >
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
                    sx={{ m: 0.5 }}
                  />
                ))}
            </Box>
          </Box>
        )}

        {/* Сводная информация */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,0.2)',
          }}
        >
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h5' component='h2' sx={{ fontWeight: 'bold' }}>
              Сводная информация
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant='contained'
                color='secondary'
                startIcon={<SaveIcon />}
                onClick={handleExportToExcel}
                sx={{
                  backgroundColor: 'rgba(255,255,0.2)',
                  '&:hover': { backgroundColor: 'rgba(255,255,0.3)' },
                  color: 'white',
                  fontWeight: 'medium',
                }}
              >
                Экспорт
              </Button>
              {currentUser?.role === 'admin' && (
                <Button
                  variant='contained'
                  color='success'
                  startIcon={
                    generating ? <CircularProgress size={20} /> : <SaveIcon />
                  }
                  onClick={handleGenerateRentSheets}
                  disabled={generating}
                  sx={{
                    backgroundColor: 'rgba(255,255,0.2)',
                    '&:hover': { backgroundColor: 'rgba(255,255,0.3)' },
                    color: 'white',
                    fontWeight: 'medium',
                  }}
                >
                  {generating ? 'Генерация...' : 'Сгенерировать'}
                </Button>
              )}
            </Box>
          </Box>

          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 3,
              }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}
                >
                  {(summary?.totalAmount ?? 0)?.toLocaleString()} тг
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Общая сумма аренды
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}
                >
                  {rows
                    .reduce((sum, r) => {
                      const diff = (r.amount || r.accruals || 0) - r.paidAmount;
                      return sum + Math.max(0, diff);
                    }, 0)
                    .toLocaleString()}{' '}
                  тг
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  К получению
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #ffebee 0%, #ffcdd2 10%)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}
                >
                  {rows
                    .filter((r) => isOverduePayment(r.paymentDate))
                    .reduce((sum, r) => {
                      const diff = (r.amount || r.accruals || 0) - r.paidAmount;
                      return sum + Math.max(0, diff);
                    }, 0)
                    .toLocaleString()}{' '}
                  тг
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Просрочено
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Таблица арендных платежей */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,0.2)',
          }}
        >
          <Box
            sx={{
              p: 3,
              background: 'linear-gradient(135deg, #67eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h5' component='h2' sx={{ fontWeight: 'bold' }}>
              Арендные платежи
            </Typography>
          </Box>

          <CardContent sx={{ p: 0 }}>
            <Box sx={{ overflowX: 'auto' }}>
              <Table
                size='medium'
                sx={{
                  minWidth: 1200,
                  '& .MuiTableCell-root': {
                    borderBottom: '1px solid #e0e0e0',
                    py: 2.5,
                    px: 2,
                  },
                }}
              >
                <TableHead>
                  <TableRow
                    sx={{
                      backgroundColor: 'grey.100',
                      '& th': {
                        fontWeight: 'bold',
                        color: 'text.primary',
                        py: 2,
                        fontSize: '0.9rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      },
                    }}
                  >
                    <TableCell
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Арендатор
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Сумма аренды
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Оплачено/Предоплачено
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Остаток к оплате
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Дата оплаты
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Статус
                    </TableCell>
                    <TableCell
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Действия
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((r, idx) => (
                    <TableRow
                      key={idx}
                      sx={{
                        '&:nth-of-type(odd)': {
                          backgroundColor: 'grey.50',
                        },
                        '&:nth-of-type(even)': {
                          backgroundColor: 'white',
                        },
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          boxShadow: '0 4px 20px rgba(0, 0.1)',
                          transform: 'translateY(-2px)',
                          transition: 'all 0.3s ease',
                          zIndex: 1,
                          position: 'relative',
                        },
                        height: '70px',
                        borderRadius: '12px',
                        mb: 1,
                      }}
                    >
                      <TableCell
                        sx={{
                          fontWeight: 'medium',
                          fontSize: '1rem',
                          color: 'text.primary',
                        }}
                      >
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: 'primary.light',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'primary.contrastText',
                              fontWeight: 'bold',
                            }}
                          >
                            {r.tenantName.charAt(0).toUpperCase()}
                          </Box>
                          {r.tenantName}
                        </Box>
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 'medium',
                          color: 'success.main',
                        }}
                      >
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
                            inputProps={{ style: { fontSize: 12 } }}
                            InputProps={{ style: { padding: '2px 4px' } }}
                            style={{ width: '80px' }}
                            variant='outlined'
                          />
                        ) : r.amount ? (
                          r.amount?.toLocaleString()
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontSize: '1rem',
                          fontWeight: 'medium',
                          color: 'success.main',
                        }}
                      >
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
                            inputProps={{ style: { fontSize: 12 } }}
                            InputProps={{ style: { padding: '2px 4px' } }}
                            style={{ width: '80px' }}
                            variant='outlined'
                          />
                        ) : r.paidAmount ? (
                          r.paidAmount?.toLocaleString()
                        ) : (
                          '0'
                        )}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          color:
                            (r.amount || r.accruals || 0) - r.paidAmount >= 0
                              ? 'success.main'
                              : 'error.main',
                        }}
                      >
                        {Math.max(
                          0,
                          (r.amount || r.accruals || 0) - r.paidAmount,
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ fontSize: '1rem', color: 'text.secondary' }}
                      >
                        {editingId === r.tenantId ? (
                          <TextField
                            size='small'
                            type='date'
                            value={editData.paymentDate || r.paymentDate || ''}
                            onChange={(e) =>
                              handleInputChange('paymentDate', e.target.value)
                            }
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ style: { fontSize: 12 } }}
                            InputProps={{ style: { padding: '2px 4px' } }}
                            style={{ width: '120px' }}
                            variant='outlined'
                          />
                        ) : r.paymentDate ? (
                          new Date(r.paymentDate).toLocaleDateString('ru-RU')
                        ) : (
                          'Не оплачено'
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === r.tenantId ? (
                          <FormControl size='small' style={{ minWidth: 100 }}>
                            <Select
                              value={editData.status ?? r.status}
                              onChange={(e) =>
                                handleInputChange('status', e.target.value)
                              }
                              style={{ fontSize: 12 }}
                              variant='outlined'
                            >
                              <MenuItem value='active'>Активен</MenuItem>
                              <MenuItem value='paid'>Оплачен</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={
                              isOverduePayment(r.paymentDate)
                                ? 'Просрочен'
                                : r.status === 'active'
                                  ? 'Активен'
                                  : 'Оплачен'
                            }
                            size='medium'
                            color={
                              isOverduePayment(r.paymentDate)
                                ? 'warning'
                                : r.status === 'active'
                                  ? 'info'
                                  : 'success'
                            }
                            variant='filled'
                            sx={{
                              fontWeight: 'medium',
                              px: 1.5,
                              py: 0.5,

                              backgroundColor: isOverduePayment(r.paymentDate)
                                ? 'error.light'
                                : r.status === 'paid'
                                  ? 'success.light'
                                  : 'default',
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
                            <Tooltip title='Просмотр'>
                              <IconButton color='default' size='small'>
                                <VisibilityIcon />
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
