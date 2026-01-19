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
  Button,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Close as CloseIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { getGroups } from '../../services/groups';

interface Props {
  userId?: string;
}

interface ChildReportRow {
  id: string;
  fullName: string;
  groupName: string;
  groupId: string;
  parentName: string;
  parentPhone: string;
  attendanceRate: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  healthStatus: 'good' | 'needs_attention' | 'requires_care';
  age: number;
  status: string;
}

interface Summary {
  totalChildren: number;
  totalGroups: number;
  attendanceRate: number;
  paidChildren: number;
  unpaidChildren: number;
}

const ReportsChildren: React.FC<Props> = ({ userId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [rows, setRows] = useState<ChildReportRow[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ChildReportRow>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [filterGroup, setFilterGroup] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {

        const childrenApi = await import('../../services/children');
        const { getChildAttendance } = await import(
          '../../services/childAttendance'
        );


        const [childrenData, groupsData, attendanceData] = await Promise.all([
          childrenApi.default.getAll(),
          getGroups(),
          getChildAttendance(),
        ]);

        if (!mounted) return;

        setGroups(groupsData);


        const processedChildren = childrenData.map((child: any) => {

          const group = groupsData.find((g: any) => g._id === child.groupId);


          const childAttendance = attendanceData.filter(
            (att: any) => att.childId === child._id,
          );

          const totalDays = childAttendance.length;
          const attendedDays = childAttendance.filter(
            (att: any) => att.status === 'present',
          ).length;

          const attendanceRate =
            totalDays > 0 ? Math.round((attendedDays / totalDays) * 100) : 100;


          const birthDate = new Date(child.birthDate);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();


          let paymentStatus: 'paid' | 'partial' | 'unpaid' = 'unpaid';
          if (child.payments && child.payments.length > 0) {
            const latestPayment = child.payments[child.payments.length - 1];
            if (latestPayment.status === 'paid') {
              paymentStatus = 'paid';
            } else if (latestPayment.status === 'partial') {
              paymentStatus = 'partial';
            } else {
              paymentStatus = 'unpaid';
            }
          }


          let healthStatus: 'good' | 'needs_attention' | 'requires_care' =
            'good';
          if (child.healthStatus) {
            if (child.healthStatus === 'requires_care') {
              healthStatus = 'requires_care';
            } else if (child.healthStatus === 'needs_attention') {
              healthStatus = 'needs_attention';
            } else {
              healthStatus = 'good';
            }
          }

          return {
            id: child._id,
            fullName: child.fullName,
            groupName: group?.name || 'Не указана',
            groupId: group?._id || '',
            parentName: child.parentName || 'Не указан',
            parentPhone: child.parentPhone || 'Не указан',
            attendanceRate,
            paymentStatus,
            healthStatus,
            age,
            status: child.status || 'active',
          };
        });


        const summaryData: Summary = {
          totalChildren: processedChildren.length,
          totalGroups: groupsData.length,
          attendanceRate:
            processedChildren.length > 0
              ? Math.round(
                processedChildren.reduce(
                  (sum: number, child: ChildReportRow) =>
                    sum + child.attendanceRate,
                  0,
                ) / processedChildren.length,
              )
              : 0,
          paidChildren: processedChildren.filter(
            (child: ChildReportRow) => child.paymentStatus === 'paid',
          ).length,
          unpaidChildren: processedChildren.filter(
            (child: ChildReportRow) => child.paymentStatus === 'unpaid',
          ).length,
        };

        setSummary(summaryData);
        setRows(processedChildren);
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Ошибка загрузки данных детей');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleEditClick = (row: ChildReportRow) => {
    setEditingId(row.id);
    setEditData({
      status: row.status,
      paymentStatus: row.paymentStatus,
      healthStatus: row.healthStatus,
    });
  };

  const handleSaveClick = async (rowId: string) => {
    try {

      const originalRow = rows.find((r) => r.id === rowId);
      if (originalRow) {

        const updatedData: any = {
          ...editData,
        };


        const childrenApi = await import('../../services/children');
        await childrenApi.default.update(rowId, updatedData);


        setRows((prev) =>
          prev.map((r) =>
            r.id === rowId ? ({ ...r, ...updatedData } as ChildReportRow) : r,
          ),
        );


        if (summary) {
          setSummary((prev) => {
            if (!prev) return null;

            const updatedRows = rows.map((r) =>
              r.id === rowId ? ({ ...r, ...updatedData } as ChildReportRow) : r,
            );

            return {
              ...prev,
              paidChildren: updatedRows.filter(
                (child: ChildReportRow) => child.paymentStatus === 'paid',
              ).length,
              unpaidChildren: updatedRows.filter(
                (child: ChildReportRow) => child.paymentStatus === 'unpaid',
              ).length,
            };
          });
        }

        setEditingId(null);
        setEditData({});
        setSnackbarMessage('Информация о ребенке успешно обновлена');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error updating child:', error);
      setSnackbarMessage('Ошибка при обновлении информации о ребенке');
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

  const handleExportToExcel = async () => {
    try {
      const { utils, writeFile } = await import('xlsx');

      // Подготавливаем данные для экспорта
      const exportData = rows.map(row => ({
        'ФИО ребенка': row.fullName,
        'Группа': row.groupName,
        'ФИО родителя': row.parentName,
        'Телефон родителя': row.parentPhone,
        'Посещаемость (%)': `${row.attendanceRate}%`,
        'Статус оплаты': row.paymentStatus,
        'Статус здоровья': row.healthStatus,
        'Возраст': `${row.age} лет`,
        'Статус': row.status,
      }));

      // Создаем worksheet
      const worksheet = utils.json_to_sheet(exportData);

      // Устанавливаем ширину колонок для лучшего отображения
      const columnWidths = [
        { wch: 25 }, // ФИО ребенка
        { wch: 15 }, // Группа
        { wch: 25 }, // ФИО родителя
        { wch: 15 }, // Телефон родителя
        { wch: 15 }, // Посещаемость
        { wch: 15 }, // Статус оплаты
        { wch: 15 }, // Статус здоровья
        { wch: 10 }, // Возраст
        { wch: 12 }, // Статус
      ];
      worksheet['!cols'] = columnWidths;

      // Создаем workbook и добавляем worksheet
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, 'Отчет по детям');

      // Генерируем имя файла с датой
      const fileName = `отчет_по_детям_${new Date().toLocaleString('ru-RU', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\./g, '-')}.xlsx`;

      // Сохраняем файл
      writeFile(workbook, fileName);
    } catch (error) {
      console.error('Ошибка при экспорте в Excel:', error);
      setSnackbarMessage('Ошибка при экспорте файла');
      setSnackbarOpen(true);
    }
  };


  const filteredRows = rows.filter((row) => {
    const matchesGroup = !filterGroup || row.groupId === filterGroup;
    const matchesSearch =
      !searchTerm ||
      row.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.groupName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesGroup && matchesSearch;
  });

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
            Отчеты по детям
          </Typography>
          <Typography
            variant='h6'
            sx={{
              color: 'text.secondary',
              fontWeight: 'medium',
            }}
          >
            Статистика по детям, группам и посещаемости
          </Typography>
        </Box>

        {/* Фильтры */}
        <Card
          elevation={0}
          sx={{
            borderRadius: 3,
            overflow: 'hidden',
            background: 'white',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: '1px solid rgba(255,255,255,0.2)',
            p: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <TextField
              label='Поиск'
              variant='outlined'
              size='small'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: 200 }}
            />

            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Группа</InputLabel>
              <Select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                label='Группа'
              >
                <MenuItem value=''>Все группы</MenuItem>
                {groups.map((group: any) => (
                  <MenuItem key={group._id} value={group._id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant='outlined'
              color='primary'
              onClick={() => {
                setFilterGroup('');
                setSearchTerm('');
              }}
            >
              Сбросить фильтры
            </Button>
          </Box>
        </Card>

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
          </Box>

          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                  {summary?.totalChildren ?? 0}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Всего детей
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 'bold', color: 'secondary.main', mb: 1 }}
                >
                  {summary?.totalGroups ?? 0}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Всего групп
                </Typography>
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  background:
                    'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 10%)',
                  textAlign: 'center',
                }}
              >
                <Typography
                  variant='h4'
                  sx={{ fontWeight: 'bold', color: 'success.main', mb: 1 }}
                >
                  {summary?.attendanceRate ?? 0}%
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Средняя посещаемость
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
                  {summary?.paidChildren ?? 0}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  С оплатой
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
                  {summary?.unpaidChildren ?? 0}
                </Typography>
                <Typography variant='body2' sx={{ color: 'text.secondary' }}>
                  Без оплаты
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Таблица детей */}
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h5' component='h2' sx={{ fontWeight: 'bold' }}>
              Список детей
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
                      ФИО ребенка
                    </TableCell>
                    <TableCell
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Группа
                    </TableCell>
                    <TableCell
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      ФИО родителя
                    </TableCell>
                    <TableCell
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Телефон родителя
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Посещаемость (%)
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Статус оплаты
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Статус здоровья
                    </TableCell>
                    <TableCell
                      align='right'
                      sx={{ color: 'primary.main', fontWeight: 'bold' }}
                    >
                      Возраст
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
                  {filteredRows.map((r, idx) => (
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
                            {r.fullName.charAt(0).toUpperCase()}
                          </Box>
                          {r.fullName}
                        </Box>
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: '1rem', color: 'text.secondary' }}
                      >
                        {r.groupName}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: '1rem', color: 'text.secondary' }}
                      >
                        {r.parentName}
                      </TableCell>
                      <TableCell
                        sx={{ fontSize: '1rem', color: 'text.secondary' }}
                      >
                        {r.parentPhone}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontWeight: 'medium',
                          fontSize: '1rem',
                          color:
                            r.attendanceRate >= 80
                              ? 'success.main'
                              : r.attendanceRate >= 60
                                ? 'warning.main'
                                : 'error.main',
                        }}
                      >
                        {r.attendanceRate}%
                      </TableCell>
                      <TableCell align='right'>
                        {editingId === r.id ? (
                          <FormControl size='small' style={{ minWidth: 100 }}>
                            <Select
                              value={editData.paymentStatus ?? r.paymentStatus}
                              onChange={(e) =>
                                handleInputChange(
                                  'paymentStatus',
                                  e.target.value,
                                )
                              }
                              style={{ fontSize: 12 }}
                              variant='outlined'
                            >
                              <MenuItem value='paid'>Оплачено</MenuItem>
                              <MenuItem value='partial'>Частично</MenuItem>
                              <MenuItem value='unpaid'>Не оплачено</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={
                              r.paymentStatus === 'paid'
                                ? 'Оплачено'
                                : r.paymentStatus === 'partial'
                                  ? 'Частично'
                                  : 'Не оплачено'
                            }
                            size='medium'
                            color={
                              r.paymentStatus === 'paid'
                                ? 'success'
                                : r.paymentStatus === 'partial'
                                  ? 'warning'
                                  : 'error'
                            }
                            variant='filled'
                            sx={{ fontWeight: 'medium', px: 1.5, py: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell align='right'>
                        {editingId === r.id ? (
                          <FormControl size='small' style={{ minWidth: 120 }}>
                            <Select
                              value={editData.healthStatus ?? r.healthStatus}
                              onChange={(e) =>
                                handleInputChange(
                                  'healthStatus',
                                  e.target.value,
                                )
                              }
                              style={{ fontSize: 12 }}
                              variant='outlined'
                            >
                              <MenuItem value='good'>Хорошее</MenuItem>
                              <MenuItem value='needs_attention'>
                                Требует внимания
                              </MenuItem>
                              <MenuItem value='requires_care'>
                                Требует ухода
                              </MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={
                              r.healthStatus === 'good'
                                ? 'Хорошее'
                                : r.healthStatus === 'needs_attention'
                                  ? 'Требует внимания'
                                  : 'Требует ухода'
                            }
                            size='medium'
                            color={
                              r.healthStatus === 'good'
                                ? 'success'
                                : r.healthStatus === 'needs_attention'
                                  ? 'warning'
                                  : 'error'
                            }
                            variant='filled'
                            sx={{ fontWeight: 'medium', px: 1.5, py: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{ fontSize: '1rem', color: 'text.secondary' }}
                      >
                        {r.age} лет
                      </TableCell>
                      <TableCell>
                        {editingId === r.id ? (
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
                              <MenuItem value='inactive'>Неактивен</MenuItem>
                              <MenuItem value='graduated'>Выпустился</MenuItem>
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={
                              r.status === 'active'
                                ? 'Активен'
                                : r.status === 'inactive'
                                  ? 'Неактивен'
                                  : 'Выпустился'
                            }
                            size='medium'
                            color={
                              r.status === 'active'
                                ? 'info'
                                : r.status === 'inactive'
                                  ? 'default'
                                  : 'success'
                            }
                            variant='filled'
                            sx={{ fontWeight: 'medium', px: 1.5, py: 0.5 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === r.id ? (
                          <>
                            <Tooltip title='Сохранить'>
                              <IconButton
                                color='success'
                                size='small'
                                onClick={() => handleSaveClick(r.id)}
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

        {/* Статистика по группам */}
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
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant='h5' component='h2' sx={{ fontWeight: 'bold' }}>
              Статистика по группам
            </Typography>
          </Box>

          <CardContent>
            <Grid container spacing={3}>
              {groups.map((group: any) => {
                const groupChildren = rows.filter(
                  (r) => r.groupName === group.name,
                );
                const totalChildren = groupChildren.length;
                const avgAttendance =
                  totalChildren > 0
                    ? Math.round(
                      groupChildren.reduce(
                        (sum, child) => sum + child.attendanceRate,
                        0,
                      ) / totalChildren,
                    )
                    : 0;
                const paidChildren = groupChildren.filter(
                  (child) => child.paymentStatus === 'paid',
                ).length;

                return (
                  <Grid item xs={12} sm={6} md={4} key={group._id}>
                    <Paper
                      sx={{
                        p: 3,
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        background:
                          'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      }}
                    >
                      <Typography
                        variant='h6'
                        sx={{
                          fontWeight: 'bold',
                          mb: 1,
                          color: 'primary.main',
                        }}
                      >
                        {group.name}
                      </Typography>
                      <Typography
                        variant='body2'
                        color='text.secondary'
                        sx={{ mb: 2 }}
                      >
                        {group.description || 'Без описания'}
                      </Typography>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-around',
                          flexWrap: 'wrap',
                          gap: 1,
                        }}
                      >
                        <Box>
                          <Typography
                            variant='h6'
                            sx={{ fontWeight: 'bold', color: 'primary.main' }}
                          >
                            {totalChildren}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Детей
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant='h6'
                            sx={{
                              fontWeight: 'bold',
                              color:
                                avgAttendance >= 80
                                  ? 'success.main'
                                  : avgAttendance >= 60
                                    ? 'warning.main'
                                    : 'error.main',
                            }}
                          >
                            {avgAttendance}%
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Посещаемость
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant='h6'
                            sx={{ fontWeight: 'bold', color: 'success.main' }}
                          >
                            {paidChildren}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            С оплатой
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ReportsChildren;
