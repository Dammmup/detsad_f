import React, { useEffect, useState } from 'react';
import {
 Box,
  Grid,
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
  InputLabel,
  Snackbar,
  Chip,
  Button
} from '@mui/material';
import {
 Edit as EditIcon,
  Save as SaveIcon,
 Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { updatePayroll, Payroll } from '../../services/payroll';

interface Props {
  userId?: string;
}

interface CurrentUser {
  id: string;
 role: string;
}

interface PayrollRow {
  staffName: string;
 accruals: number;
  bonuses: number;
  penalties: number;
  latePenalties: number;
  absencePenalties: number;
  userFines: number;
  latePenaltyRate: number;
  total: number;
 status: string;
 staffId: string;
  _id?: string;
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
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    let mounted = true;
    
    // Определяем текущий месяц
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
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
              id: userData.id,
              role: userData.role || 'staff'  // Устанавливаем значение по умолчанию
            };
            setCurrentUser(currentUserData);
          }
        } catch (userError) {
          console.error('Ошибка получения данных пользователя:', userError);
        }
        
        // Формируем параметры запроса - теперь используем текущий месяц
        const params: any = {
          month: currentMonth  // используем месяц вместо startDate/endDate
        };
        
        // Если пользователь не администратор, он может видеть только свои данные
        if (currentUserData && currentUserData.role !== 'admin') {
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
          totalAccruals: data.reduce((sum, p) => sum + (p.accruals || p.baseSalary || 0), 0),
          totalPenalties: data.reduce((sum, p) => sum + (p.penalties || 0), 0),
          totalPayout: data.reduce((sum, p) => {
            // Рассчитываем "Итого" для каждой записи
            const accruals = p.accruals || p.baseSalary || 0;
            const bonuses = p.bonuses || 0;
            const penalties = p.penalties || 0;
            const latePenaltyRate = p.latePenaltyRate || 500;
            const total = accruals + bonuses - penalties - (latePenaltyRate * 0); // Упрощенный расчет
            return sum + total;
          }, 0)
        };
        
        setSummary(summaryData);
        setRows(data.map((p: any) => ({
          staffName: p.staffId?.fullName || p.staffId?.name || 'Неизвестно',
          accruals: p.accruals || p.baseSalary || 0,
          bonuses: p.bonuses || 0,
          penalties: p.penalties || 0,
          latePenalties: p.latePenalties || 0,
          absencePenalties: p.absencePenalties || 0,
          userFines: p.userFines || 0,
          latePenaltyRate: p.latePenaltyRate || 500, // Значение по умолчанию
          // Рассчитываем поле "Итого" в реальном времени
          total: (p.accruals || p.baseSalary || 0) + (p.bonuses || 0) - (p.penalties || 0) - ((p.latePenaltyRate || 500) * 0), // Упрощенный расчет
          status: p.status || 'draft',
          staffId: p.staffId?._id || p.staffId?.id || p.staffId || '',
          _id: p._id || undefined // Добавляем ID записи зарплаты
        })));
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Ошибка загрузки зарплат');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [userId]); // убрали startDate и endDate из зависимостей

const handleEditClick = (row: PayrollRow) => {
  setEditingId(row.staffId);
  setEditData({
    accruals: row.accruals || undefined,
    bonuses: row.bonuses || undefined,
    penalties: row.penalties || undefined,
    latePenalties: row.latePenalties || undefined,
    absencePenalties: row.absencePenalties || undefined,
    userFines: row.userFines || undefined,
    latePenaltyRate: row.latePenaltyRate || undefined,
    status: row.status
  });
};

const handleSaveClick = async (rowId: string) => {
  try {
    // Найдем оригинальный объект зарплаты для получения полного ID
    const originalRow = rows.find(r => r.staffId === rowId);
    if (originalRow) {
      // Используем _id записи зарплаты, если он есть, иначе staffId
      const payrollId = originalRow._id || rowId;
      
      // Рассчитываем поле "Итого" в реальном времени
      const accruals = editData.accruals !== undefined ? editData.accruals : originalRow.accruals || 0;
      const bonuses = editData.bonuses !== undefined ? editData.bonuses : originalRow.bonuses || 0;
      const penalties = editData.penalties !== undefined ? editData.penalties : originalRow.penalties || 0;
      const latePenalties = editData.latePenalties !== undefined ? editData.latePenalties : originalRow.latePenalties || 0;
      const absencePenalties = editData.absencePenalties !== undefined ? editData.absencePenalties : originalRow.absencePenalties || 0;
      const userFines = editData.userFines !== undefined ? editData.userFines : originalRow.userFines || 0;
      const latePenaltyRate = editData.latePenaltyRate !== undefined ? editData.latePenaltyRate : originalRow.latePenaltyRate || 500;
      
      // Обновленный расчет итоговой суммы
      const total = accruals + bonuses - penalties;
      
      // Добавляем рассчитанное поле "Итого" в данные для обновления
      const updatedData = {
        ...editData,
        total
      };
      
      // Выведем ID для отладки
      console.log('Updating payroll with ID:', payrollId);
      console.log('Edit data:', updatedData);
      
      // Обновляем через API
      await updatePayroll(payrollId, updatedData as Partial<Payroll>);
      // Обновляем локальный массив
      setRows(prev => prev.map(r =>
        r.staffId === rowId ? { ...r, ...updatedData } as PayrollRow : r
      ));
      setEditingId(null);
      setEditData({});
      setSnackbarMessage('Зарплата успешно обновлена');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    }
  } catch (error) {
    console.error('Error updating payroll:', error);
    setSnackbarMessage('Ошибка при обновлении зарплаты');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  }
};

const handleCancelClick = () => {
  setEditingId(null);
  setEditData({});
};

const handleInputChange = (field: string, value: any) => {
  setEditData(prev => ({
    ...prev,
    [field]: value === '' ? undefined : value
  }));
};

const handleSnackbarClose = () => {
  setSnackbarOpen(false);
};

const handleExportToExcel = () => {
  // Создаем CSV-данные
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Заголовки
  csvContent += "Сотрудник;Начисления;Бонусы;Штрафы;Штрафы за опоздания;Штрафы за неявки;Штрафы пользователя;Ставка за опоздание (тг/мин);Итого;Статус\n";
  
  // Данные
  rows.forEach(row => {
    csvContent += `${row.staffName};${row.accruals};${row.bonuses};${row.penalties};${row.latePenalties};${row.absencePenalties};${row.userFines};${row.latePenaltyRate};${row.total};${row.status}\n`;
  });
  
  // Создаем ссылку для скачивания
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `расчетный_лист_${new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}.csv`);
  document.body.appendChild(link);
  
  // Имитируем клик для скачивания
  link.click();
  
  // Удаляем ссылку
  document.body.removeChild(link);
};

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      {/* Добавляем Snackbar для отображения сообщений */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        message={snackbarMessage}
        action={
          <IconButton size="small" aria-label="close" color="inherit" onClick={handleSnackbarClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
      <Card
        elevation={4}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium' }}>
            Сводная информация по зарплатам
          </Typography>
        </Box>
        <CardContent>
          <Table size="small">
            <TableHead>
              <TableRow sx={{
                backgroundColor: 'primary.light',
                '& th': {
                  fontWeight: 'bold',
                  color: 'primary.contrastText',
                  py: 1.5
                }
              }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Показатель</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Значение</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: 'grey.50',
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
                height: '56px'
              }}>
                <TableCell sx={{ fontWeight: 'medium' }}>Общее количество сотрудников</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {summary?.totalEmployees ?? 0}
                </TableCell>
              </TableRow>
              <TableRow sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: 'grey.50',
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
                height: '56px'
              }}>
                <TableCell sx={{ fontWeight: 'medium' }}>Общая сумма начислений</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {(summary?.totalAccruals ?? 0)?.toLocaleString()} тг
                </TableCell>
              </TableRow>
              <TableRow sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: 'grey.50',
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
                height: '56px'
              }}>
                <TableCell sx={{ fontWeight: 'medium' }}>Общая сумма штрафов</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {(summary?.totalPenalties ?? 0)?.toLocaleString()} тг
                </TableCell>
              </TableRow>
              <TableRow sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: 'grey.50',
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
                height: '56px'
              }}>
                <TableCell sx={{ fontWeight: 'medium' }}>Ставка за опоздание на минуту</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  500 тг/мин
                </TableCell>
              </TableRow>
              <TableRow sx={{
                '&:nth-of-type(odd)': {
                  backgroundColor: 'grey.50',
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
                height: '56px'
              }}>
                <TableCell sx={{ fontWeight: 'medium' }}>Общая сумма к выплате</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {(summary?.totalPayout ?? 0)?.toLocaleString()} тг
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card
        elevation={4}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          mt: 3,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderBottom: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'medium' }}>
            Расчетный лист за {new Date().toLocaleString('ru-RU', { month: 'long', year: 'numeric' })}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={handleExportToExcel}
          >
            Экспорт в Excel
          </Button>
        </Box>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{
                  backgroundColor: 'primary.light',
                  '& th': {
                    fontWeight: 'bold',
                    color: 'primary.contrastText',
                    py: 1.5
                  }
                }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Сотрудник</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Начисления</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Бонусы</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Штрафы</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Штрафы за опоздания</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Штрафы за неявки</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Штрафы пользователя</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Ставка за опоздание (тг/мин)</TableCell>
                <TableCell align="right" sx={{ color: 'white', fontWeight: 'bold' }}>Итого</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Статус</TableCell>
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
                    '&:hover': {
                      backgroundColor: 'grey.100',
                      transform: 'scale(1.01)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    height: '56px'
                  }}
                >
                  <TableCell sx={{ fontWeight: 'medium' }}>{r.staffName}</TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.accruals ?? ''}
                        onChange={(e) => handleInputChange('accruals', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.accruals ? r.accruals?.toLocaleString() : ''
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.bonuses ?? ''}
                        onChange={(e) => handleInputChange('bonuses', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.bonuses ? r.bonuses?.toLocaleString() : ''
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.penalties ?? ''}
                        onChange={(e) => handleInputChange('penalties', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.penalties ? r.penalties?.toLocaleString() : ''
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.latePenalties ?? ''}
                        onChange={(e) => handleInputChange('latePenalties', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.latePenalties ? r.latePenalties?.toLocaleString() : ''
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.absencePenalties ?? ''}
                        onChange={(e) => handleInputChange('absencePenalties', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.absencePenalties ? r.absencePenalties?.toLocaleString() : ''
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.userFines ?? ''}
                        onChange={(e) => handleInputChange('userFines', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.userFines ? r.userFines?.toLocaleString() : ''
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {editingId === r.staffId ? (
                      <TextField
                        size="small"
                        type="number"
                        value={editData.latePenaltyRate ?? ''}
                        onChange={(e) => handleInputChange('latePenaltyRate', e.target.value ? Number(e.target.value) : '')}
                        inputProps={{ style: { fontSize: 12 } }}
                        InputProps={{ style: { padding: '2px 4px' } }}
                        style={{ width: '80px' }}
                        variant="outlined"
                      />
                    ) : (
                      r.latePenaltyRate ? r.latePenaltyRate : '500' // Значение по умолчанию
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    {editingId === r.staffId ? (
                      // При редактировании рассчитываем "Итого" в реальном времени
                      (() => {
                        const accruals = editData.accruals !== undefined ? editData.accruals : r.accruals || 0;
                        const bonuses = editData.bonuses !== undefined ? editData.bonuses : r.bonuses || 0;
                        const penalties = editData.penalties !== undefined ? editData.penalties : r.penalties || 0;
                        const latePenalties = editData.latePenalties !== undefined ? editData.latePenalties : r.latePenalties || 0;
                        const absencePenalties = editData.absencePenalties !== undefined ? editData.absencePenalties : r.absencePenalties || 0;
                        const userFines = editData.userFines !== undefined ? editData.userFines : r.userFines || 0;
                        const latePenaltyRate = editData.latePenaltyRate !== undefined ? editData.latePenaltyRate : r.latePenaltyRate || 500;
                        
                        // Обновленный расчет итоговой суммы
                        const total = accruals + bonuses - penalties;
                        return total?.toLocaleString() || '0';
                      })()
                    ) : (
                      // При отображении используем рассчитанное значение
                      r.total ? r.total?.toLocaleString() : '0'
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === r.staffId ? (
                      <FormControl size="small" style={{ minWidth: 100 }}>
                        <Select
                          value={editData.status ?? r.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          style={{ fontSize: 12 }}
                          variant="outlined"
                        >
                          <MenuItem value="draft">Черновик</MenuItem>
                          <MenuItem value="calculated">Рассчитано</MenuItem>
                          <MenuItem value="approved">Подтвержден</MenuItem>
                          <MenuItem value="paid">Оплачен</MenuItem>
                        </Select>
                      </FormControl>
                    ) : (
                      <Chip
                        label={
                          r.status === 'draft' ? 'Черновик' :
                          r.status === 'calculated' ? 'Рассчитано' :
                          r.status === 'approved' ? 'Подтвержден' : 'Оплачен'
                        }
                        size="small"
                        color={
                          r.status === 'draft' ? 'default' :
                          r.status === 'calculated' ? 'info' :
                          r.status === 'approved' ? 'primary' : 'success'
                        }
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === r.staffId ? (
                      <>
                        <Tooltip title="Сохранить">
                          <IconButton
                            color="success"
                            size="small"
                            onClick={() => handleSaveClick(r.staffId)}
                            sx={{ mr: 1 }}
                          >
                            <SaveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Отменить">
                          <IconButton
                            color="error"
                            size="small"
                            onClick={handleCancelClick}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </>
                    ) : (
                      <>
                        <Tooltip title="Редактировать">
                          <IconButton
                            color="primary"
                            size="small"
                            onClick={() => handleEditClick(r)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Просмотр">
                          <IconButton color="default" size="small">
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
  );
};

export default ReportsSalary;
