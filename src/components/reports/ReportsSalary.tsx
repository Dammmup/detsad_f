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
  Add as AddIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import {
  updatePayroll,
  deletePayroll,
  Payroll,
  generatePayrollSheets,
  addFine, // Assuming this is exported from service
} from '../../services/payroll';

interface Props {
  userId?: string;
}

interface CurrentUser {
  id: string | undefined;
  role: string;
}

interface PayrollRow {
  staffName: string;
  accruals: number;
  penalties: number; // Общая сумма штрафов (опоздания + неявки)
  latePenalties: number; // Штрафы за опоздания
  absencePenalties: number; // Штрафы за неявки
  latePenaltyRate: number;
  advance: number; // Аванс
  total: number;
  status: string;
  staffId: string;
  _id?: string;
  baseSalary: number; // New field
  fines?: any[]; // For tooltip
  userFines?: number; // Manual fines total
}

const ReportsSalary: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<PayrollRow>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  );
  const [fineDialogOpen, setFineDialogOpen] = useState(false);
  const [currentFinePayrollId, setCurrentFinePayrollId] = useState<string | null>(null);
  const [newFine, setNewFine] = useState({ amount: '', reason: '' });

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Импортируем сервисы
        const { getCurrentUser } = await import('../../services/auth');
        const { getPayrolls } = await import('../../services/payroll');

        // Получаем информацию о текущем пользователе через сервис
        let currentUserData = null;
        try {
          const userData = getCurrentUser();
          if (userData) {
            currentUserData = {
              id: userData.id || userData._id,
              role: userData.role || 'staff', // Устанавливаем значение по умолчанию
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }

        // Формируем параметры запроса - теперь используем текущий месяц
        const params: any = {
          period: selectedMonth, // используем период формата YYYY-MM
        };

        // Если пользователь не администратор, он может видеть только свои данные
        if (
          currentUserData &&
          currentUserData.role !== 'admin' &&
          currentUserData.id
        ) {
          params.userId = currentUserData.id;
        } else if (userId) {
          // Администратор может фильтровать по userId
          params.userId = userId;
        }

        const payrollsData = await getPayrolls(params);

        if (!mounted) return;
        const data = (payrollsData?.data || payrollsData || []) as any[];

        // Вычисляем сводку на основе данных
        const summaryData = {
          totalEmployees: data.length,
          totalAccruals: data.reduce(
            (sum, p) => sum + (p.accruals || p.baseSalary || 0),
            0,
          ),
          totalPenalties: data.reduce((sum, p) => sum + (p.penalties || 0), 0),
          totalPayout: data.reduce((sum, p) => {
            // Рассчитываем "Итого" для каждой записи (без бонусов)
            const accruals = p.accruals || p.baseSalary || 0;
            const penalties = p.penalties || 0;
            const advance = p.advance || 0;
            const total = accruals - penalties - advance; // Упрощенный расчет
            // Не добавляем отрицательные значения в сумму
            return sum + (total >= 0 ? total : 0);
          }, 0),
        };

        setSummary(summaryData);
        setRows(
          data.map((p: any) => ({
            staffName: p.staffId?.fullName || p.staffId?.name || 'Неизвестно',
            accruals: p.accruals || p.baseSalary || 0,
            // Рассчитываем общую сумму штрафов
            penalties:
              p.penalties || (p.latePenalties || 0) + (p.absencePenalties || 0),
            latePenalties: p.latePenalties || 0,
            absencePenalties: p.absencePenalties || 0,
            latePenaltyRate: p.latePenaltyRate || 500, // Значение по умолчанию
            advance: p.advance || 0, // Аванс
            // Рассчитываем поле "Итого" в реальном времени (без бонусов)
            total:
              (p.accruals || p.baseSalary || 0) -
              ((p.latePenalties || 0) + (p.absencePenalties || 0)) -
              (p.advance || 0), // Упрощенный расчет
            status: p.status && p.status !== 'draft' ? p.status : 'calculated',
            staffId: p.staffId?._id || p.staffId?.id || p.staffId || '',
            _id: p._id || undefined,
            baseSalary: p.baseSalary || 0,
            fines: p.fines || [],
            userFines: p.userFines || 0,
          })),
        );
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Ошибка загрузки зарплат');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [userId, selectedMonth]); // обновляем данные при смене месяца

  const handleEditClick = (row: PayrollRow) => {
    setEditingId(row.staffId);
    setEditData({
      accruals: row.accruals || undefined,
      penalties: row.penalties || undefined,
      advance: row.advance || undefined,
      latePenaltyRate: row.latePenaltyRate || undefined,
      baseSalary: row.baseSalary || undefined,
      status: row.status && row.status !== 'draft' ? row.status : 'calculated',
    });
  };

  const handleSaveClick = async (rowId: string) => {
    try {
      // Найдем оригинальный объект зарплаты для получения полного ID
      const originalRow = rows.find((r) => r.staffId === rowId);
      if (originalRow) {
        // Используем _id записи зарплаты, если он есть, иначе staffId
        const payrollId = originalRow._id || rowId;

        // Рассчитываем поле "Итого" в реальном времени
        const accruals =
          editData.accruals !== undefined
            ? editData.accruals
            : originalRow.accruals || 0;
        const penalties =
          editData.penalties !== undefined
            ? editData.penalties
            : originalRow.penalties || 0;
        const advance =
          editData.advance !== undefined
            ? editData.advance
            : originalRow.advance || 0;
        const status =
          editData.status && editData.status !== 'draft'
            ? editData.status
            : originalRow.status && originalRow.status !== 'draft'
              ? originalRow.status
              : 'calculated';

        // Обновленный расчет итоговой суммы (без бонусов)
        const total = accruals - penalties - advance;

        // Добавляем рассчитанное поле "Итого" в данные для обновления
        const updatedData = {
          ...editData,
          total,
          status,
        };

        // Выведем ID для отладки
        console.log('Updating payroll with ID:', payrollId);
        console.log('Edit data:', updatedData);

        // Обновляем через API
        await updatePayroll(payrollId, updatedData as Partial<Payroll>);
        // Обновляем локальный массив
        setRows((prev) =>
          prev.map((r) =>
            r.staffId === rowId ? ({ ...r, ...updatedData } as PayrollRow) : r,
          ),
        );
        setEditingId(null);
        setEditData({});
        setSnackbarMessage('Зарплата успешно обновлена');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating payroll:', error);
      setSnackbarMessage('Ошибка при обновлении зарплаты');
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

  const handleDeleteClick = async (rowId: string) => {
    if (!currentUser || !currentUser.id || currentUser.role !== 'admin') {
      setSnackbarMessage('Только администратор может удалять расчетные листы');
      setSnackbarOpen(true);
      return;
    }

    if (
      window.confirm(
        'Вы уверены, что хотите удалить этот расчетный лист? Это действие нельзя отменить.',
      )
    ) {
      try {
        // Найдем оригинальный объект зарплаты для получения полного ID
        const originalRow = rows.find((r) => r.staffId === rowId);
        if (originalRow) {
          // Используем _id записи зарплаты, если он есть, иначе staffId
          const payrollId = originalRow._id || rowId;

          // Удаляем через API
          await deletePayroll(payrollId);
          // Обновляем локальный массив
          setRows((prev) => prev.filter((r) => r.staffId !== rowId));
          setSnackbarMessage('Расчетный лист успешно удален');
          setSnackbarOpen(true);
        }
      } catch (error) {
        console.error('Error deleting payroll:', error);
        setSnackbarMessage('Ошибка при удалении расчетного листа');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleExportToExcel = () => {
    // Создаем CSV-данные
    let csvContent = 'data:text/csv;charset=utf-8,';

    // Заголовки
    csvContent +=
      'Сотрудник;Начисления;Аванс;Штрафы;Ставка за опоздание (тг/мин);Итого;Статус\n';

    // Данные
    rows.forEach((row) => {
      csvContent += `${row.staffName};${row.accruals};${row.advance};${row.penalties};${row.latePenaltyRate};${row.total};${row.status}\n`;
    });

    // Создаем ссылку для скачивания
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `расчетный_лист_${new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}.csv`,
    );
    document.body.appendChild(link);

    // Имитируем клик для скачивания
    link.click();

    // Удаляем ссылку
    document.body.removeChild(link);
  };

  const handleGeneratePayrollSheets = async () => {
    if (!currentUser || !currentUser.id || currentUser.role !== 'admin') {
      setSnackbarMessage(
        'Только администратор может генерировать расчетные листы',
      );
      setSnackbarOpen(true);
      return;
    }

    const monthToGenerate = selectedMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    if (
      window.confirm(
        `Вы уверены, что хотите сгенерировать расчетные листы за ${monthToGenerate}? Это действие перезапишет существующие данные.`,
      )
    ) {
      try {
        setGenerating(true);
        await generatePayrollSheets(monthToGenerate);
        setSnackbarMessage('Расчетные листы успешно сгенерированы');
        setSnackbarOpen(true);

        // Обновляем данные
        const { getCurrentUser } = await import('../../services/auth');
        const { getPayrolls } = await import('../../services/payroll');

        let currentUserData = null;
        try {
          const userData = getCurrentUser();
          if (userData) {
            currentUserData = {
              id: userData.id || userData._id,
              role: userData.role || 'staff', // Устанавливаем значение по умолчанию
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }

        const params: any = {
          period: selectedMonth, // используем месяц вместо startDate/endDate
        };

        if (
          currentUserData &&
          currentUserData.role !== 'admin' &&
          currentUserData.id
        ) {
          params.userId = currentUserData.id;
        } else if (userId) {
          // Администратор может фильтровать по userId
          params.userId = userId;
        }

        const payrollsData = await getPayrolls(params);

        const data = (payrollsData?.data || payrollsData || []) as any[];

        // Вычисляем сводку на основе данных
        const summaryData = {
          totalEmployees: data.length,
          totalAccruals: data.reduce(
            (sum, p) => sum + (p.accruals || p.baseSalary || 0),
            0,
          ),
          totalPenalties: data.reduce((sum, p) => sum + (p.penalties || 0), 0),
          totalPayout: data.reduce((sum, p) => {
            // Рассчитываем "Итого" для каждой записи
            const accruals = p.accruals || p.baseSalary || 0;
            const penalties = p.penalties || 0;
            const advance = p.advance || 0;
            const total = accruals - penalties - advance; // Упрощенный расчет (без бонусов)
            // Не добавляем отрицательные значения в сумму
            return sum + (total >= 0 ? total : 0);
          }, 0),
        };

        setSummary(summaryData);
        setRows(
          data.map((p: any) => ({
            staffName: p.staffId?.fullName || p.staffId?.name || 'Неизвестно',
            accruals: p.accruals || p.baseSalary || 0,
            // Рассчитываем общую сумму штрафов
            penalties:
              p.penalties || (p.latePenalties || 0) + (p.absencePenalties || 0),
            latePenalties: p.latePenalties || 0,
            absencePenalties: p.absencePenalties || 0,
            latePenaltyRate: p.latePenaltyRate || 500, // Значение по умолчанию
            advance: p.advance || 0, // Аванс
            // Рассчитываем поле "Итого" в реальном времени (без бонусов)
            total:
              (p.accruals || p.baseSalary || 0) -
              ((p.latePenalties || 0) + (p.absencePenalties || 0)) -
              (p.advance || 0), // Упрощенный расчет
            status: p.status && p.status !== 'draft' ? p.status : 'calculated',
            staffId: p.staffId?._id || p.staffId?.id || p.staffId || '',
            _id: p._id || undefined, // Добавляем ID записи зарплаты
            baseSalary: p.baseSalary || 0,
            fines: p.fines || [],
            userFines: p.userFines || 0,
          })),
        );
      } catch (error: any) {
        console.error('Error generating payroll sheets:', error);
        setSnackbarMessage(
          error?.message || 'Ошибка генерации расчетных листов',
        );
        setSnackbarOpen(true);
      } finally {
        setGenerating(false);
      }
    }
  };

  const handleOpenFineDialog = (payrollId: string) => {
    setCurrentFinePayrollId(payrollId);
    setNewFine({ amount: '', reason: '' });
    setFineDialogOpen(true);
  };

  const handleAddFine = async () => {
    if (!currentFinePayrollId || !newFine.amount || !newFine.reason) return;

    try {
      // Find the payroll object
      const row = rows.find(r => r._id === currentFinePayrollId || r.staffId === currentFinePayrollId);
      const payrollId = row?._id || currentFinePayrollId;

      await import('../../services/payroll').then(m => m.addFine(payrollId, {
        amount: Number(newFine.amount),
        reason: newFine.reason,
        type: 'manual'
      }));

      setSnackbarMessage('Штраф добавлен');
      setSnackbarOpen(true);
      setFineDialogOpen(false);

      // Trigger reload (simple way)
      // Better: updates rows locally. But logic is complex (recalc total).
      // Let's just force reload or partial update.
      // For now, simpler to reload the data.
      const { getPayrolls } = await import('../../services/payroll');
      const params: any = { period: selectedMonth };
      // ... Add user filter logic if needed (simplified here for brevity)
      if (userId) params.userId = userId;

      const payrollsData = await getPayrolls(params);
      const data = (payrollsData?.data || payrollsData || []) as any[];
      // Update rows... (Re-use load logic or just reload page?)
      // Since load logic is inside useEffect, we can maybe trigger it?
      // Or manually update the row in `rows`

      // Manually updating for immediate feedback (simplified)
      // Ideally we should refactor load logic to a function `fetchData` and call it.
      // I'll assume page reload is acceptable or user can refresh, BUT
      // let's try to just update the specific row if we got the updated payroll back.
      // But `addFine` returns updated payroll.

      // Force reload by changing a dependency? Or just alert user.
      window.location.reload(); // Brute force but works for now to ensure consistency.

    } catch (e: any) {
      setSnackbarMessage('Ошибка добавления штрафа: ' + (e.message || 'Unknown'));
      setSnackbarOpen(true);
    }
  };

  const selectedMonthLabel = new Date(`${selectedMonth}-01`).toLocaleString(
    'ru-RU',
    { month: 'long', year: 'numeric' },
  );

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
    <>
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
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              }}
            >
              Расчетные листы
            </Typography>
            <Typography
              variant='h6'
              sx={{
                color: 'text.secondary',
                fontWeight: 'medium',
              }}
            >
              Управление зарплатами сотрудников за {selectedMonthLabel}
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

          {/* Сводная информация */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
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
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
                    color: 'white',
                    fontWeight: 'medium',
                  }}
                >
                  Экспорт
                </Button>
                {currentUser?.id && currentUser?.role === 'admin' && (
                  <Button
                    variant='contained'
                    color='success'
                    startIcon={
                      generating ? <CircularProgress size={20} /> : <SaveIcon />
                    }
                    onClick={handleGeneratePayrollSheets}
                    disabled={generating}
                    sx={{
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' },
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
                      'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 10%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant='h4'
                    sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}
                  >
                    {summary?.totalEmployees ?? 0}
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    Всего сотрудников
                  </Typography>
                </Box>

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
                    {(summary?.totalAccruals ?? 0)?.toLocaleString()} тг
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    Начисления
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background:
                      'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant='h4'
                    sx={{ fontWeight: 'bold', color: 'error.main', mb: 1 }}
                  >
                    {(summary?.totalPenalties ?? 0)?.toLocaleString()} тг
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    Штрафы
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    background:
                      'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 10%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography
                    variant='h4'
                    sx={{ fontWeight: 'bold', color: 'warning.main', mb: 1 }}
                  >
                    {(summary?.totalPayout ?? 0)?.toLocaleString()} тг
                  </Typography>
                  <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                    К выплате
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Таблица расчетных листов */}
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              background: 'white',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <Box
              sx={{
                p: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant='h5' component='h2' sx={{ fontWeight: 'bold' }}>
                Расчетные листы сотрудников
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
                        backgroundColor: '#f8fafc',
                        '& th': {
                          fontWeight: '600',
                          color: '#475569',
                          py: 2,
                          px: 2,
                          fontSize: '0.875rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: '2px solid #e2e8f0'
                        },
                      }}
                    >
                      <TableCell sx={{ minWidth: 250 }}>
                        Сотрудник
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ minWidth: 150 }}
                      >
                        Базовый Оклад
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        Начисления
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        Аванс
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        Штрафы
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        Ставка за опоздание (тг/мин)
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ color: 'primary.main', fontWeight: 'bold' }}
                      >
                        Итого
                      </TableCell>
                      <TableCell
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
                            boxShadow: '0 4px 20px rgba(0, 0, 0.1)',
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
                              {r.staffName.charAt(0).toUpperCase()}
                            </Box>
                            {r.staffName}
                          </Box>
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{ fontSize: '1rem', fontWeight: 'medium' }}
                        >
                          {editingId === r.staffId ? (
                            <TextField
                              size='small'
                              type='number'
                              value={editData.baseSalary ?? ''}
                              onChange={(e) => handleInputChange('baseSalary', Number(e.target.value))}
                              inputProps={{ style: { fontSize: 14, textAlign: 'right' }, min: 0 }}
                              sx={{ width: '100px' }}
                              variant='standard'
                            />
                          ) : (
                            r.baseSalary?.toLocaleString()
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
                          {editingId === r.staffId ? (
                            <TextField
                              size='small'
                              type='number'
                              value={editData.accruals ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === '-') {
                                  handleInputChange('accruals', '');
                                } else {
                                  const numValue = Number(value);
                                  if (numValue >= 0) {
                                    handleInputChange('accruals', numValue);
                                  }
                                }
                              }}
                              inputProps={{
                                style: { fontSize: 14, padding: '4px 8px', textAlign: 'right' },
                                min: 0,
                                step: 'any',
                              }}
                              sx={{ width: '100px' }}
                              variant='standard'
                            />
                          ) : r.accruals ? (
                            r.accruals?.toLocaleString()
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
                          {editingId === r.staffId ? (
                            <TextField
                              size='small'
                              type='number'
                              value={editData.advance ?? ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (value === '' || value === '-') {
                                  handleInputChange('advance', '');
                                } else {
                                  const numValue = Number(value);
                                  if (numValue >= 0) {
                                    handleInputChange('advance', numValue);
                                  }
                                }
                              }}
                              inputProps={{
                                style: { fontSize: 14, padding: '4px 8px', textAlign: 'right' },
                                min: 0,
                                step: 'any',
                              }}
                              sx={{ width: '80px' }}
                              variant='standard'
                            />
                          ) : r.advance ? (
                            r.advance?.toLocaleString()
                          ) : (
                            '0'
                          )}
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            fontSize: '0.95rem',
                            fontWeight: '500',
                            color: 'error.main',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                            {editingId === r.staffId ? (
                              <TextField
                                size='small'
                                type='number'
                                value={editData.penalties ?? ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || value === '-') {
                                    handleInputChange('penalties', '');
                                  } else {
                                    const numValue = Number(value);
                                    if (numValue >= 0) {
                                      handleInputChange('penalties', numValue);
                                    }
                                  }
                                }}
                                inputProps={{
                                  style: { fontSize: 14, padding: '4px 8px', textAlign: 'right' },
                                  min: 0,
                                  step: 'any',
                                }}
                                sx={{ width: '80px' }}
                                variant='standard'
                              />
                            ) : (
                              <Tooltip
                                title={
                                  <Box sx={{ p: 1 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 1, borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                                      Детализация штрафов
                                    </Typography>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                      <span>Опоздания:</span>
                                      <b>{r.latePenalties?.toLocaleString()}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                      <span>Неявки:</span>
                                      <b>{r.absencePenalties?.toLocaleString()}</b>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                                      <span>Ручные:</span>
                                      <b>{r.userFines?.toLocaleString()}</b>
                                    </div>
                                    {r.fines && r.fines.length > 0 && (
                                      <>
                                        <Box sx={{ my: 1, borderTop: '1px dashed rgba(255,255,255,0.2)' }} />
                                        {r.fines.map((f: any, i: number) => (
                                          <div key={i} style={{ fontSize: '0.85rem' }}>
                                            • {f.reason}: {f.amount}
                                          </div>
                                        ))}
                                      </>
                                    )}
                                  </Box>
                                }
                                placement="left"
                                arrow
                              >
                                <span style={{ cursor: 'help', borderBottom: '1px dotted #ef5350' }}>
                                  {r.penalties ? r.penalties?.toLocaleString() : '0'}
                                </span>
                              </Tooltip>
                            )}
                            {currentUser?.role === 'admin' && (
                              <IconButton
                                size="small"
                                onClick={() => handleOpenFineDialog(r.staffId)}
                                sx={{
                                  color: 'error.main',
                                  bgcolor: 'error.lighter',
                                  width: 28,
                                  height: 28,
                                  '&:hover': { bgcolor: 'error.light', color: 'white' }
                                }}
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{ fontSize: '1rem', color: 'text.secondary' }}
                        >
                          {editingId === r.staffId ? (
                            <TextField
                              size='small'
                              type='number'
                              value={editData.latePenaltyRate ?? ''}
                              onChange={(e) =>
                                handleInputChange(
                                  'latePenaltyRate',
                                  e.target.value ? Number(e.target.value) : '',
                                )
                              }
                              inputProps={{
                                style: { fontSize: 14 },
                                step: 'any',
                              }}
                              InputProps={{
                                style: { padding: '4px 8px' },
                                disableUnderline: true,
                              }}
                              style={{ width: '100px' }}
                              variant='outlined'
                            />
                          ) : r.latePenaltyRate ? (
                            r.latePenaltyRate
                          ) : (
                            '500'
                          )}
                        </TableCell>
                        <TableCell
                          align='right'
                          sx={{
                            fontWeight: 'bold',
                            fontSize: '1.1rem',
                            color: r.total >= 0 ? 'success.main' : 'error.main',
                          }}
                        >
                          {editingId === r.staffId
                            ? (() => {
                              const accruals =
                                editData.accruals !== undefined
                                  ? editData.accruals
                                  : r.accruals || 0;
                              const penalties =
                                editData.penalties !== undefined
                                  ? editData.penalties
                                  : r.penalties || 0;
                              const advance =
                                editData.advance !== undefined
                                  ? editData.advance
                                  : r.advance || 0;

                              const total = accruals - penalties - advance;
                              return total?.toLocaleString() || '0';
                            })()
                            : r.total
                              ? r.total?.toLocaleString()
                              : '0'}
                        </TableCell>
                        <TableCell>
                          {editingId === r.staffId ? (
                            <FormControl size='small' style={{ minWidth: 120 }}>
                              <Select
                                value={editData.status ?? r.status}
                                onChange={(e) =>
                                  handleInputChange('status', e.target.value)
                                }
                                style={{ fontSize: 14 }}
                                variant='outlined'
                              >
                                <MenuItem value='calculated'>Рассчитано</MenuItem>
                                <MenuItem value='approved'>Подтвержден</MenuItem>
                                <MenuItem value='paid'>Оплачен</MenuItem>
                              </Select>
                            </FormControl>
                          ) : (
                            <Chip
                              label={
                                r.status === 'calculated'
                                  ? 'Рассчитано'
                                  : r.status === 'approved'
                                    ? 'Подтвержден'
                                    : 'Оплачен'
                              }
                              size='medium'
                              color={
                                r.status === 'calculated'
                                  ? 'info'
                                  : r.status === 'approved'
                                    ? 'primary'
                                    : 'success'
                              }
                              variant='filled'
                              sx={{ fontWeight: 'medium', px: 1.5, py: 0.5 }}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === r.staffId ? (
                            <>
                              <Tooltip title='Сохранить'>
                                <IconButton
                                  color='success'
                                  size='small'
                                  onClick={() => handleSaveClick(r.staffId)}
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
                              <Tooltip title='Удалить'>
                                <IconButton
                                  color='error'
                                  size='small'
                                  onClick={() => handleDeleteClick(r.staffId)}
                                >
                                  <CloseIcon />
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

      <Dialog open={fineDialogOpen} onClose={() => setFineDialogOpen(false)}>
        <DialogTitle>Добавить штраф</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Укажите сумму и причину штрафа.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Сумма"
            type="number"
            fullWidth
            value={newFine.amount}
            onChange={(e) => setNewFine({ ...newFine, amount: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Причина"
            type="text"
            fullWidth
            value={newFine.reason}
            onChange={(e) => setNewFine({ ...newFine, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFineDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleAddFine}>Добавить</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ReportsSalary;
