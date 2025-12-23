import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
} from '@mui/material';
import {
  Add,
  Delete,
  Assessment,
  TableChart,
  Email,
  Schedule,
  AttachMoney,
  People,
  ChildCare,
  BarChart,
  Download,
  Refresh,
  Search,
  Sort,
} from '@mui/icons-material';
import moment from 'moment';
import { useDate } from '../components/context/DateContext';
import {
  getReports,
  deleteReport,
  exportReport,
  generateCustomReport,
  sendReportByEmail,
  getChildrenSummary,
  getAttendanceSummary,
  Report,
} from '../services/reports';
import ReportsSalary from '../components/reports/ReportsSalary';
import ReportsRent from '../components/reports/ReportsRent';
import ReportsChildren from '../components/reports/ReportsChildren';
import { useAuth } from '../components/context/AuthContext';
import { getUsers } from '../services/users';
import { ID, UserRole } from '../types/common';
import childrenApi from '../services/children';

import { getChildAttendance } from '../services/childAttendance';
import { getShifts } from '../services/shifts';
import {
  exportChildrenList,
  exportChildrenAttendance,
  exportStaffAttendance,
  exportSalaryReport,
} from '../utils/excelExport';
import {
  getPayrollsByUsers,
  generatePayrollSheets,
} from '../services/payroll';
import DateNavigator from '../components/DateNavigator';


interface StaffMember {
  id?: ID;
  fullName: string;
  role?: UserRole;
}


interface ReportFilters {
  type?: string;
  status?: string;
  dateRange?: {
    startDate?: string;
    endDate?: string;
  };
  userId?: string;
  groupId?: string;
  search?: string;
}

const Reports: React.FC = () => {
  const { currentDate } = useDate();

  const [reports, setReports] = useState<Report[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);


  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const { user: authUser } = useAuth();


  const [exportType, setExportType] = useState<
    'salary' | 'children' | 'attendance' | 'schedule'
  >('salary');
  const [emailRecipients, setEmailRecipients] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [scheduleFrequency, setScheduleFrequency] = useState<
    'daily' | 'weekly' | 'monthly'
  >('monthly');
  const [scheduleRecipients, setScheduleRecipients] = useState<string>('');


  const selectedUserId = useRef<string>('');
  const selectedGroupId = useRef<string>('');
  const [reportType, setReportType] = useState<string>('attendance');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    type: '',
    status: '',
    dateRange: {
      startDate: '',
      endDate: '',
    },
    userId: '',
    groupId: '',
    search: '',
  });


  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField] = useState<string>('createdAt');
  const [sortOrder] = useState<'asc' | 'desc'>('desc');


  const [childrenSummary, setChildrenSummary] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const fetchData = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    try {

      const reportsData = await getReports();
      setReports(reportsData);

      const staffData = await getUsers();
      setStaff(
        staffData.map((user) => ({
          id: user._id || user.id,
          fullName: user.fullName,
          role: user.role,
        })),
      );



      const [childrenSumm, attendanceSumm] = await Promise.all([
        getChildrenSummary({
          groupId: selectedGroupId.current || undefined,
        }),
        getAttendanceSummary({
          startDate: moment(currentDate).startOf('month').format('YYYY-MM-DD'),
          endDate: moment(currentDate).endOf('month').format('YYYY-MM-DD'),
        }),
      ]);

      setChildrenSummary(childrenSumm);
      setAttendanceSummary(attendanceSumm);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedGroupId]);

  useEffect(() => {

    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/auth/me', {});
        if (response.ok) {
        }
      } catch (err) {
        console.error('Ошибка загрузки информации о пользователе:', err);
      }
    };

    fetchCurrentUser();
    fetchData();


    setReportTitle(
      `Отчет за ${currentDate.toLocaleDateString('ru-RU')} - ${currentDate.toLocaleDateString('ru-RU')}`,
    );
  }, [currentDate, fetchData]);




  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };


  const handleExport = async (
    reportId: string,
    format: 'pdf' | 'excel' | 'csv',
  ) => {
    setLoading(true);

    try {

      await exportReport(reportId, 'excel');

      alert(`Отчет успешно экспортирован в формате Excel`);
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета');
    } finally {
      setLoading(false);
    }
  };


  const handleCreateReport = async () => {
    setLoading(true);

    try {
      const startDate = moment(currentDate).startOf('month');
      const endDate = moment(currentDate).endOf('month');

      const formattedStartDate = startDate.format('YYYY-MM-DD');
      const formattedEndDate = endDate.format('YYYY-MM-DD');


      const newReport = await generateCustomReport({
        type: reportType as any,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        userId: selectedUserId.current || undefined,
        format: 'excel',
      });


      if (newReport)
        setReports([...(reports as Report[]), newReport] as Report[]);


      setDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Ошибка создания отчета');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      return;
    }

    setLoading(true);

    try {
      await deleteReport(id);


      setReports(reports.filter((report) => report.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления отчета');
    } finally {
      setLoading(false);
    }
  };


  const handleReportTypeChange = (e: SelectChangeEvent) => {
    setReportType(e.target.value);


    const typeText =
      e.target.value === 'attendance'
        ? 'посещаемости'
        : e.target.value === 'schedule'
          ? 'расписанию'
          : e.target.value === 'staff'
            ? 'персоналу'
            : 'пользовательский';

    setReportTitle(
      `Отчет по ${typeText} за ${moment(currentDate).startOf('month').format('YYYY-MM-DD')} - ${moment(currentDate).endOf('month').format('YYYY-MM-DD')}`,
    );
  };




  const handleExportSalary = async () => {
    setLoading(true);
    try {
      const period = moment(currentDate).format('YYYY-MM');


      await generatePayrollSheets(period);


      const payrolls = await getPayrollsByUsers({
        period: period,
        userId: selectedUserId.current || undefined,
      });

      await exportSalaryReport(payrolls);
      alert('Отчет по зарплатам успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по зарплатам');
    } finally {
      setLoading(false);
    }
  };


  const handleSendByEmail = async () => {
    if (!emailRecipients.trim()) {
      setError('Введите email получателей');
      return;
    }

    setLoading(true);
    try {
      await sendReportByEmail({
        reportType: exportType,
        recipients: emailRecipients.split(',').map((email) => email.trim()),
        subject: emailSubject || `Отчет по ${exportType}`,
        message: emailMessage,
        format: 'excel',
        reportParams: {
          startDate: moment(currentDate).startOf('month').format('YYYY-MM-DD'),
          endDate: moment(currentDate).endOf('month').format('YYYY-MM-DD'),
          userId: selectedUserId.current || undefined,
        },
      });

      setEmailDialogOpen(false);
      setEmailRecipients('');
      setEmailSubject('');
      setEmailMessage('');
      alert('Отчет успешно отправлен на почту!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка отправки отчета на почту');
    } finally {
      setLoading(false);
    }
  };


  const handleAdvancedExport = async (
    type: 'salary' | 'children' | 'attendance' | 'schedule',
  ) => {


    switch (type) {
      case 'salary':
        return handleExportSalary();
      case 'children':
        return handleExportChildren();
      case 'attendance':
        return handleExportAttendance();
      case 'schedule':
        return handleExportSchedule();
      default:
        setError('Неизвестный тип отчета');
    }
  };


  const handleExportChildren = async () => {
    setLoading(true);
    try {
      const children = await childrenApi.getAll();
      await exportChildrenList(children, selectedGroupId.current || undefined);
      alert('Отчет по детям успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по детям');
    } finally {
      setLoading(false);
    }
  };


  const handleExportAttendance = async () => {
    setLoading(true);
    try {
      const attendanceData = await getChildAttendance({
        startDate: moment(currentDate).startOf('month').format('YYYY-MM-DD'),
        endDate: moment(currentDate).endOf('month').format('YYYY-MM-DD'),
        groupId: selectedGroupId.current || undefined,
      });
      const allChildren = await childrenApi.getAll();
      const children = selectedGroupId.current
        ? allChildren.filter(
          (c) =>
            (typeof c.groupId === 'object' ? c.groupId?._id : c.groupId) ===
            selectedGroupId.current,
        )
        : allChildren;
      const groupName = selectedGroupId.current
        ? staff.find((s) => s.id === selectedGroupId.current)?.fullName
        : 'All_Groups';

      await exportChildrenAttendance(
        attendanceData,
        groupName || 'All Groups',
        `${moment(currentDate).startOf('month').format('YYYY-MM-DD')}_${moment(currentDate).endOf('month').format('YYYY-MM-DD')}`,
        children,
      );
      alert('Отчет по посещаемости успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по посещаемости');
    } finally {
      setLoading(false);
    }
  };


  const handleExportSchedule = async () => {
    setLoading(true);
    try {
      const shifts = await getShifts(
        moment(currentDate).startOf('month').format('YYYY-MM-DD'),
        moment(currentDate).endOf('month').format('YYYY-MM-DD'),
      );
      await exportStaffAttendance(
        shifts,
        `${moment(currentDate).startOf('month').format('YYYY-MM-DD')}_${moment(currentDate).endOf('month').format('YYYY-MM-DD')}`,
      );
      alert('Отчет по расписанию успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по расписанию');
    } finally {
      setLoading(false);
    }
  };


  const getReportTypeText = (
    type:
      | 'attendance'
      | 'schedule'
      | 'staff'
      | 'salary'
      | 'children'
      | 'custom',
  ) => {
    switch (type) {
      case 'attendance':
        return 'Посещаемость';
      case 'schedule':
        return 'Расписание';
      case 'staff':
        return 'Персонал';
      case 'salary':
        return 'Зарплаты';
      case 'children':
        return 'Дети';
      case 'custom':
        return 'Пользовательский';
      default:
        return type;
    }
  };


  const filteredReports = reports.filter((report) => {

    if (filters.type && report.type !== filters.type) return false;


    if (filters.status && report.status !== filters.status) return false;


    if (filters.userId && report.filters?.userId !== filters.userId)
      return false;


    if (filters.groupId && report.filters?.groupId !== filters.groupId)
      return false;


    if (
      filters.dateRange?.startDate &&
      report.dateRange.startDate < filters.dateRange.startDate
    )
      return false;
    if (
      filters.dateRange?.endDate &&
      report.dateRange.endDate > filters.dateRange.endDate
    )
      return false;


    if (
      searchTerm &&
      !report.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !report.description?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    return true;
  });


  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortField === 'createdAt') {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder === 'asc'
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    } else if (sortField === 'title') {
      return sortOrder === 'asc'
        ? a.title.localeCompare(b.title)
        : b.title.localeCompare(a.title);
    } else if (sortField === 'type') {
      return sortOrder === 'asc'
        ? a.type.localeCompare(b.type)
        : b.type.localeCompare(a.type);
    } else if (sortField === 'status') {
      return sortOrder === 'asc'
        ? (a.status || '').localeCompare(b.status || '')
        : (b.status || '').localeCompare(a.status || '');
    }
    return 0;
  });


  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      dateRange: {
        startDate: '',
        endDate: '',
      },
      userId: '',
      groupId: '',
      search: '',
    });
    setSearchTerm('');
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      <DateNavigator />
      {/* Заголовок и кнопки управления */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h5' display='flex' alignItems='center'>
          <Assessment sx={{ mr: 1 }} /> Отчеты
        </Typography>

        <Box>
          {/* Показываем кнопку "Создать отчет" только для администраторов */}
          {authUser?.role === 'admin' && (
            <Button
              variant='contained'
              color='primary'
              startIcon={<Add />}
              onClick={() => setDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              Создать отчет
            </Button>
          )}
          <Button
            variant='contained'
            color='primary'
            startIcon={<Download />}
            onClick={() => handleAdvancedExport('salary')}
          >
            Экспорт
          </Button>
        </Box>
      </Box>

      {/* Фильтры */}
      <Box mb={3} display='flex' flexWrap='wrap' gap={2} alignItems='center'>
        <TextField
          label='Поиск'
          variant='outlined'
          size='small'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />,
          }}
        />

        <FormControl size='small' sx={{ minWidth: 150 }}>
          <InputLabel>Тип отчета</InputLabel>
          <Select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            label='Тип отчета'
          >
            <MenuItem value=''>Все типы</MenuItem>
            <MenuItem value='attendance'>Посещаемость</MenuItem>
            <MenuItem value='schedule'>Расписание</MenuItem>
            <MenuItem value='staff'>Персонал</MenuItem>
            <MenuItem value='salary'>Зарплаты</MenuItem>
            <MenuItem value='children'>Дети</MenuItem>
            <MenuItem value='custom'>Пользовательский</MenuItem>
          </Select>
        </FormControl>

        <FormControl size='small' sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label='Статус'
          >
            <MenuItem value=''>Все статусы</MenuItem>
            <MenuItem value='completed'>Завершен</MenuItem>
            <MenuItem value='scheduled'>Запланирован</MenuItem>
            <MenuItem value='generating'>Генерируется</MenuItem>
            <MenuItem value='failed'>Ошибка</MenuItem>
          </Select>
        </FormControl>

        <FormControl size='small' sx={{ minWidth: 150 }}>
          <InputLabel>Сотрудник</InputLabel>
          <Select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            label='Сотрудник'
          >
            <MenuItem value=''>Все сотрудники</MenuItem>
            {staff.map((member) => (
              <MenuItem key={member.id} value={member.id || ''}>
                {member.fullName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant='outlined'
          startIcon={<Refresh />}
          onClick={resetFilters}
        >
          Сбросить
        </Button>

        <Button variant='outlined' startIcon={<Sort />} onClick={() => { }}>
          Сортировка
        </Button>
      </Box>

      {/* Расширенные кнопки экспорта */}
      <Card
        sx={{
          mb: 3,
          p: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Typography variant='h6' sx={{ mb: 2, fontWeight: 600 }}>
          🚀 Расширенный экспорт отчетов
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant='contained'
            color='primary'
            startIcon={<AttachMoney />}
            onClick={() => handleAdvancedExport('salary')}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Экспорт зарплат
          </Button>

          <Button
            variant='contained'
            color='primary'
            startIcon={<ChildCare />}
            onClick={() => handleAdvancedExport('children')}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Списки детей
          </Button>

          <Button
            variant='contained'
            color='primary'
            startIcon={<People />}
            onClick={() => handleAdvancedExport('attendance')}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Посещаемость
          </Button>

          <Button
            variant='contained'
            color='primary'
            startIcon={<BarChart />}
            onClick={() => handleAdvancedExport('schedule')}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Расписание
          </Button>

          <Button
            variant='contained'
            color='primary'
            startIcon={<Email />}
            onClick={() => setEmailDialogOpen(true)}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Отправить на почту
          </Button>

          <Button
            variant='contained'
            color='primary'
            startIcon={<Schedule />}
            onClick={() => setScheduleDialogOpen(true)}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Запланировать
          </Button>
        </Box>
      </Card>

      {/* Индикатор загрузки и ошибки */}
      {loading && <CircularProgress />}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Вкладки с отчетами */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label='Отчеты' />
        <Tab label='Зарплаты' />
        <Tab label='Дети' />
        {/* Показываем вкладку "Аренда" только для администраторов */}
        {authUser?.role === 'admin' && <Tab label='Аренда' />}
      </Tabs>

      {/* Содержимое вкладок */}
      {tabValue === 0 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Мои отчеты
          </Typography>

          {/* Статистика отчетов */}
          <Card
            sx={{
              mb: 3,
              p: 3,
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
            }}
          >
            <Typography variant='h5' sx={{ fontWeight: 'bold', mb: 2 }}>
              Статистика отчетов
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                  {reports.length}
                </Typography>
                <Typography variant='body2'>Всего отчетов</Typography>
              </Box>
              <Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                  {reports.filter((r) => r.status === 'completed').length}
                </Typography>
                <Typography variant='body2'>Завершенных</Typography>
              </Box>
              <Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                  {reports.filter((r) => r.status === 'scheduled').length}
                </Typography>
                <Typography variant='body2'>Запланированных</Typography>
              </Box>
              <Box>
                <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
                  {reports.filter((r) => r.status === 'generating').length}
                </Typography>
                <Typography variant='body2'>Генерируемых</Typography>
              </Box>
            </Box>
          </Card>

          {/* <Grid container spacing={3} sx={{ mb: 3 }}> */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography
                variant='h6'
                sx={{ fontWeight: 'bold', mb: 2, color: 'primary.main' }}
              >
                Сводка по детям
              </Typography>

              {childrenSummary ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant='h4'
                        sx={{ fontWeight: 'bold', color: 'success.main' }}
                      >
                        {childrenSummary.totalChildren}
                      </Typography>
                      <Typography variant='body2'>Всего детей</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant='h4'
                        sx={{ fontWeight: 'bold', color: 'info.main' }}
                      >
                        {Object.keys(childrenSummary.byGroup).length}
                      </Typography>
                      <Typography variant='body2'>Групп</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 'bold', mt: 1 }}
                    >
                      По группам:
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                    >
                      {Object.entries(childrenSummary.byGroup).map(
                        ([groupName, count]) => (
                          <Chip
                            key={groupName}
                            label={`${groupName}: ${count}`}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                        ),
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 'bold', mt: 1 }}
                    >
                      По возрасту:
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                    >
                      {Object.entries(childrenSummary.ageDistribution).map(
                        ([ageGroup, count]) => (
                          <Chip
                            key={ageGroup}
                            label={`${ageGroup} лет: ${count}`}
                            size='small'
                            color='secondary'
                            variant='outlined'
                          />
                        ),
                      )}
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <CircularProgress size={24} />
              )}
            </Card>
          </Grid>

          {/* Сводка по посещаемости */}
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 2, height: '100%' }}>
              <Typography
                variant='h6'
                sx={{ fontWeight: 'bold', mb: 2, color: 'secondary.main' }}
              >
                Сводка по посещаемости
              </Typography>

              {attendanceSummary ? (
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant='h4'
                        sx={{ fontWeight: 'bold', color: 'success.main' }}
                      >
                        {attendanceSummary.attendanceRate}%
                      </Typography>
                      <Typography variant='body2'>
                        Средняя посещаемость
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Box
                      sx={{
                        textAlign: 'center',
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant='h4'
                        sx={{ fontWeight: 'bold', color: 'info.main' }}
                      >
                        {attendanceSummary.totalRecords}
                      </Typography>
                      <Typography variant='body2'>Всего записей</Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 'bold', mt: 1 }}
                    >
                      По статусам:
                    </Typography>
                    <Box
                      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}
                    >
                      {Object.entries(attendanceSummary.byStatus).map(
                        ([status, count]) => (
                          <Chip
                            key={status}
                            label={`${status}: ${count}`}
                            size='small'
                            color={
                              status === 'present'
                                ? 'success'
                                : status === 'absent'
                                  ? 'error'
                                  : status === 'late'
                                    ? 'warning'
                                    : 'default'
                            }
                            variant='outlined'
                          />
                        ),
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography
                      variant='subtitle1'
                      sx={{ fontWeight: 'bold', mt: 1 }}
                    >
                      По группам:
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1,
                        maxHeight: 100,
                        overflow: 'auto',
                      }}
                    >
                      {Object.entries(attendanceSummary.byGroup).map(
                        ([groupName, count]) => (
                          <Chip
                            key={groupName}
                            label={`${groupName}: ${count}`}
                            size='small'
                            color='primary'
                            variant='outlined'
                          />
                        ),
                      )}
                    </Box>
                  </Grid>
                </Grid>
              ) : (
                <CircularProgress size={24} />
              )}
            </Card>
          </Grid>

          {/* Фильтры для отчетов */}
          <Card sx={{ mb: 3, p: 2 }}>
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <TextField
                label='Поиск отчетов'
                variant='outlined'
                size='small'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ minWidth: 200 }}
              />

              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Тип</InputLabel>
                <Select
                  value={filters.type || ''}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  label='Тип'
                >
                  <MenuItem value=''>Все типы</MenuItem>
                  <MenuItem value='attendance'>Посещаемость</MenuItem>
                  <MenuItem value='schedule'>Расписание</MenuItem>
                  <MenuItem value='staff'>Персонал</MenuItem>
                  <MenuItem value='salary'>Зарплаты</MenuItem>
                  <MenuItem value='children'>Дети</MenuItem>
                  <MenuItem value='custom'>Пользовательский</MenuItem>
                </Select>
              </FormControl>

              <FormControl size='small' sx={{ minWidth: 150 }}>
                <InputLabel>Статус</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label='Статус'
                >
                  <MenuItem value=''>Все статусы</MenuItem>
                  <MenuItem value='completed'>Завершен</MenuItem>
                  <MenuItem value='scheduled'>Запланирован</MenuItem>
                  <MenuItem value='generating'>Генерируется</MenuItem>
                  <MenuItem value='failed'>Ошибка</MenuItem>
                </Select>
              </FormControl>

              <Button
                variant='outlined'
                startIcon={<Refresh />}
                onClick={resetFilters}
              >
                Сбросить
              </Button>
            </Box>
          </Card>

          {/* Список отчетов */}
          {reports.length === 0 ? (
            <Alert severity='info'>У вас пока нет сохраненных отчетов</Alert>
          ) : (
            <Card>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Название</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Период</TableCell>
                    <TableCell>Создан</TableCell>
                    <TableCell>Формат</TableCell>
                    <TableCell>Статус</TableCell>
                    <TableCell>Действия</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          {report.type === 'salary' && (
                            <AttachMoney
                              fontSize='small'
                              sx={{ color: 'success.main' }}
                            />
                          )}
                          {report.type === 'children' && (
                            <ChildCare
                              fontSize='small'
                              sx={{ color: 'primary.main' }}
                            />
                          )}
                          {report.type === 'attendance' && (
                            <People
                              fontSize='small'
                              sx={{ color: 'info.main' }}
                            />
                          )}
                          {report.type === 'schedule' && (
                            <Schedule
                              fontSize='small'
                              sx={{ color: 'warning.main' }}
                            />
                          )}
                          <Typography variant='body2'>
                            {report.title}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{getReportTypeText(report.type)}</TableCell>
                      <TableCell>
                        {report.dateRange?.startDate &&
                          report.dateRange?.endDate
                          ? `${new Date(report.dateRange.startDate).toLocaleDateString('ru-RU')} - ${new Date(report.dateRange.endDate).toLocaleDateString('ru-RU')}`
                          : 'Не указан'}
                      </TableCell>
                      <TableCell>
                        {report.createdAt
                          ? new Date(report.createdAt).toLocaleDateString(
                            'ru-RU',
                          )
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip label='EXCEL' size='small' color='success' />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={
                            report.status === 'completed'
                              ? 'Завершен'
                              : report.status === 'scheduled'
                                ? 'Запланирован'
                                : report.status === 'generating'
                                  ? 'Генерируется'
                                  : 'Ошибка'
                          }
                          size='small'
                          color={
                            report.status === 'completed'
                              ? 'success'
                              : report.status === 'scheduled'
                                ? 'info'
                                : report.status === 'generating'
                                  ? 'warning'
                                  : 'error'
                          }
                          variant='outlined'
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title='Скачать'>
                          <IconButton
                            size='small'
                            onClick={() =>
                              handleExport(report.id || '', 'excel')
                            }
                          >
                            <TableChart fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Удалить'>
                          <IconButton
                            size='small'
                            onClick={() => handleDeleteReport(report.id || '')}
                          >
                            <Delete fontSize='small' color='error' />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Отчеты по зарплатам
          </Typography>
          <ReportsSalary userId={selectedUserId.current || undefined} />
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Отчеты по детям
          </Typography>
          <ReportsChildren userId={selectedUserId.current || undefined} />
        </Box>
      )}

      {/* Вкладка "Аренда" для администраторов */}
      {authUser?.role === 'admin' && tabValue === 3 && (
        <Box>
          <Typography variant='h6' gutterBottom>
            Отчеты по аренде
          </Typography>
          <ReportsRent userId={selectedUserId.current || undefined} />
        </Box>
      )}

      {/* Диалог создания отчета */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Создать новый отчет</DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select
                  value={reportType}
                  onChange={handleReportTypeChange}
                  label='Тип отчета'
                >
                  <MenuItem value='attendance'>Посещаемость</MenuItem>
                  <MenuItem value='schedule'>Расписание</MenuItem>
                  <MenuItem value='staff'>Персонал</MenuItem>
                  <MenuItem value='custom'>Пользовательский</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label='Название отчета'
                fullWidth
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Формат</InputLabel>

                <MenuItem value='excel'>Excel</MenuItem>

              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button
            onClick={handleCreateReport}
            variant='contained'
            color='primary'
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ДИАЛОГ ПЛАНИРОВАНИЯ ===== */}
      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          📅 Планирование автоматического отчета
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as any)}
                  label='Тип отчета'
                >
                  <MenuItem value='salary'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney />
                      Отчет по зарплатам
                    </Box>
                  </MenuItem>
                  <MenuItem value='children'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChildCare />
                      Списки детей
                    </Box>
                  </MenuItem>
                  <MenuItem value='attendance'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People />
                      Отчет посещаемости
                    </Box>
                  </MenuItem>
                  <MenuItem value='schedule'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule />
                      Отчет расписания
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Частота</InputLabel>
                <Select
                  value={scheduleFrequency}
                  onChange={(e) => setScheduleFrequency(e.target.value as any)}
                  label='Частота'
                >
                  <MenuItem value='daily'>Ежедневно</MenuItem>
                  <MenuItem value='weekly'>Еженедельно</MenuItem>
                  <MenuItem value='monthly'>Ежемесячно</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Email получателей'
                placeholder='email1@example.com, email2@example.com'
                value={scheduleRecipients}
                onChange={(e) => setScheduleRecipients(e.target.value)}
                helperText='Введите email адреса через запятую'
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Формат файла</InputLabel>
                <Select
                  value='excel'
                  label='Формат файла'
                  disabled
                >
                  <MenuItem value='excel'>Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setScheduleDialogOpen(false)}
            variant='outlined'
          >
            Отмена
          </Button>
          <Button
            variant='contained'
            color='primary'
            startIcon={<Schedule />}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Запланировать
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ДИАЛОГ ОТПРАВКИ НА ПОЧТУ ===== */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
          }}
        >
          📧 Отправка отчета на почту
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) =>
                    setExportType(
                      e.target.value as
                      | 'salary'
                      | 'children'
                      | 'attendance'
                      | 'schedule',
                    )
                  }
                  label='Тип отчета'
                >
                  <MenuItem value='salary'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney />
                      Отчет по зарплатам
                    </Box>
                  </MenuItem>
                  <MenuItem value='children'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChildCare />
                      Списки детей
                    </Box>
                  </MenuItem>
                  <MenuItem value='attendance'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People />
                      Отчет посещаемости
                    </Box>
                  </MenuItem>
                  <MenuItem value='schedule'>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Schedule />
                      Отчет расписания
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Формат файла</InputLabel>
                <Select
                  value='excel'
                  label='Формат файла'
                  disabled
                >
                  <MenuItem value='excel'>Excel</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Email получателей'
                placeholder='email1@example.com, email2@example.com'
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                helperText='Введите email адреса через запятую'
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Тема письма'
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={`Отчет по ${exportType} за ${moment(currentDate).startOf('month').format('YYYY-MM-DD')} - ${moment(currentDate).endOf('month').format('YYYY-MM-DD')}`}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label='Сообщение (необязательно)'
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder='Добавьте комментарий к отчету...'
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setEmailDialogOpen(false)} variant='outlined'>
            Отмена
          </Button>
          <Button
            onClick={handleSendByEmail}
            variant='contained'
            color='primary'
            startIcon={<Email />}
            disabled={!emailRecipients.trim()}
            sx={{
              '&:hover': { bgcolor: 'primary.dark' },
            }}
          >
            Отправить
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Reports;
