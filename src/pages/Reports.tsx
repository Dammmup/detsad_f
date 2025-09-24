import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton,
  Tooltip, Chip, CircularProgress, Alert, SelectChangeEvent, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent
} from '@mui/material';
import { 
  Add, Delete, Assessment, PictureAsPdf, TableChart, 
  InsertDriveFile, FilterList, Email, Schedule,
  GetApp, AttachMoney, People, ChildCare, BarChart, PieChart, TrendingUp, 
  Download, Refresh, Search, Sort
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { 
  getReports, deleteReport, exportReport, generateCustomReport,
  exportSalaryReport, exportChildrenReport, exportAttendanceReport, sendReportByEmail, scheduleReport,
  Report
} from '../services/api/reports';
import ReportsAnalytics from '../components/reports/ReportsAnalytics';
import ReportsSalary from '../components/reports/ReportsSalary';
import { getUsers } from '../services/api/users';
import { getGroups } from '../services/api/groups';
import { ID, UserRole } from '../types/common';
import Analytics from './Analytics';

// Интерфейс для сотрудника
interface StaffMember {
  id?: ID;
  fullName: string;
 role?: UserRole;
}

// Интерфейс для фильтрации отчетов
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
  // Состояния для данных
 const [reports, setReports] = useState<Report[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  
  // Состояния для UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  
  // Новые состояния для расширенного экспорта
  const [exportType, setExportType] = useState<'salary' | 'children' | 'attendance' | 'schedule'>('salary');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('excel');
  const [emailRecipients, setEmailRecipients] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [scheduleRecipients, setScheduleRecipients] = useState<string>('');
  
  // Состояния для фильтров
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [reportType, setReportType] = useState<string>('attendance');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [reportTitle, setReportTitle] = useState<string>('');
  const [filters, setFilters] = useState<ReportFilters>({
    type: '',
    status: '',
    dateRange: {
      startDate: '',
      endDate: ''
    },
    userId: '',
    groupId: '',
    search: ''
  });
  
  // Состояния для сортировки и поиска
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Загрузка данных при монтировании компонента
  useEffect(() => {
    fetchData();
    
    // Устанавливаем начальное название отчета
    setReportTitle(`Отчет за ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`);
  }, []);

  // Загрузка всех необходимых данных
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Получение списка отчетов
      const reportsData = await getReports();
      setReports(reportsData);
      
      // Получение списка сотрудников
      const staffData = await getUsers();
      setStaff(staffData.map(user => ({
        id: user._id || user.id,
        fullName: user.fullName,
        role: user.role
      })));
      
      // Получение списка групп
      const groupsData = await getGroups();
      setGroups(groupsData);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  
  // Обработчик изменения вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Если переключаемся на вкладку "Аналитика", переходим на отдельную страницу аналитики
    if (newValue === 2) {
      navigate('/reports/analytics');
    }
  };

  // Обработчик экспорта отчета
  const handleExport = async (reportId: string, format: 'pdf' | 'excel' | 'csv') => {
    setLoading(true);
    
    try {
      await exportReport(reportId, format);
      // В реальном приложении здесь будет скачивание файла
      alert(`Отчет успешно экспортирован в формате ${format}`);
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик создания отчета
  const handleCreateReport = async () => {
    setLoading(true);
    
    try {
      // Форматируем даты для API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Создаем отчет
      const newReport = await generateCustomReport({
        type: reportType as any,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        userId: selectedUserId || undefined,
        format: reportFormat,
        
      });
      
      // Обновляем список отчетов
      if (newReport) setReports([...reports as Report[], newReport] as Report[]);
      
      // Закрываем диалог
      setDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Ошибка создания отчета');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик удаления отчета
  const handleDeleteReport = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот отчет?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      await deleteReport(id);
      
      // Обновляем список отчетов
      setReports(reports.filter(report => report.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления отчета');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик изменения типа отчета
  const handleReportTypeChange = (e: SelectChangeEvent) => {
    setReportType(e.target.value);
    
    // Обновляем название отчета в зависимости от типа
    const typeText =
      e.target.value === 'attendance' ? 'посещаемости' :
      e.target.value === 'schedule' ? 'расписанию' :
      e.target.value === 'staff' ? 'персоналу' : 'пользовательский';
    
    setReportTitle(`Отчет по ${typeText} за ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`);
  };


  // ===== НОВЫЕ ОБРАБОТЧИКИ ДЛЯ РАСШИРЕННОГО ЭКСПОРТА =====
  
  // Обработчик экспорта зарплат
  const handleExportSalary = async () => {
    setLoading(true);
    try {
      const blob = await exportSalaryReport({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        userId: selectedUserId || undefined,
        format: exportFormat,
        includeDeductions: true,
        includeBonus: true
      });
      
      // Скачиваем файл
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `salary_report_${startDate.toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportDialogOpen(false);
      alert('Отчет по зарплатам успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по зарплатам');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик планирования отчета
  const handleScheduleReport = async () => {
    setLoading(true);
    try {
      // В реальном приложении здесь будет запрос к API
      const response = await scheduleReport({
        reportType: exportType,
        frequency: scheduleFrequency,
        recipients: scheduleRecipients.split(',').map(email => email.trim()),
        format: exportFormat,
        reportParams: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          userId: selectedUserId || undefined
        }
      });
      
      alert(`Отчет по ${exportType} успешно запланирован!`);
      setScheduleDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Ошибка планирования отчета');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик отправки отчета на почту
  const handleSendByEmail = async () => {
    if (!emailRecipients.trim()) {
      setError('Введите email получателей');
      return;
    }
    
    setLoading(true);
    try {
      await sendReportByEmail({
        reportType: exportType,
        recipients: emailRecipients.split(',').map(email => email.trim()),
        subject: emailSubject || `Отчет по ${exportType}`,
        message: emailMessage,
        format: exportFormat,
        reportParams: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          userId: selectedUserId || undefined
        }
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

  // Универсальный обработчик расширенного экспорта
  const handleAdvancedExport = async () => {
    switch (exportType) {
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

  // Обработчик экспорта отчета по детям
  const handleExportChildren = async () => {
    setLoading(true);
    try {
      const blob = await exportChildrenReport({
        groupId: selectedGroupId || undefined,
        format: exportFormat,
        includeParentInfo: true,
        includeHealthInfo: true
      });
      
      // Скачиваем файл
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `children_report_${new Date().toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportDialogOpen(false);
      alert('Отчет по детям успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по детям');
    } finally {
      setLoading(false);
    }
 };

  // Обработчик экспорта отчета посещаемости
 const handleExportAttendance = async () => {
    setLoading(true);
    try {
      const blob = await exportAttendanceReport({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        userId: selectedUserId || undefined,
        groupId: selectedGroupId || undefined,
        format: exportFormat,
        includeStatistics: true,
        includeCharts: true
      });
      
      // Скачиваем файл
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance_report_${startDate.toISOString().split('T')[0]}.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExportDialogOpen(false);
      alert('Отчет по посещаемости успешно экспортирован!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по посещаемости');
    } finally {
      setLoading(false);
    }
  };

  // Обработчик экспорта отчета по расписанию
  const handleExportSchedule = async () => {
    setLoading(true);
    try {
      // В реальном приложении здесь будет вызов соответствующей функции экспорта
      // Для моковой реализации используем alert
      alert(`Экспорт отчета по расписанию в формате ${exportFormat} запущен!`);
      setExportDialogOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Ошибка экспорта отчета по расписанию');
    } finally {
      setLoading(false);
    }
 };

  // Получение текста для типа отчета
  const getReportTypeText = (type: 'attendance' | 'schedule' | 'staff' | 'salary' | 'children' | 'custom') => {
    switch (type) {
      case 'attendance': return 'Посещаемость';
      case 'schedule': return 'Расписание';
      case 'staff': return 'Персонал';
      case 'salary': return 'Зарплаты';
      case 'children': return 'Дети';
      case 'custom': return 'Пользовательский';
      default: return type;
    }
  };

  // Фильтрация отчетов
  const filteredReports = reports.filter(report => {
    // Фильтрация по типу
    if (filters.type && report.type !== filters.type) return false;
    
    // Фильтрация по статусу
    if (filters.status && report.status !== filters.status) return false;
    
    // Фильтрация по пользователю
    if (filters.userId && report.filters?.userId !== filters.userId) return false;
    
    // Фильтрация по группе
    if (filters.groupId && report.filters?.groupId !== filters.groupId) return false;
    
    // Фильтрация по дате
    if (filters.dateRange?.startDate && report.dateRange.startDate < filters.dateRange.startDate) return false;
    if (filters.dateRange?.endDate && report.dateRange.endDate > filters.dateRange.endDate) return false;
    
    // Фильтрация по поиску
    if (searchTerm && 
        !report.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !report.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Сортировка отчетов
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortField === 'createdAt') {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return sortOrder === 'asc' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
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

  // Обработчик изменения фильтров
  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Обработчик сброса фильтров
  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      dateRange: {
        startDate: '',
        endDate: ''
      },
      userId: '',
      groupId: '',
      search: ''
    });
    setSearchTerm('');
  };

  // Обработчик сортировки
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок и кнопки управления */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Assessment sx={{ mr: 1 }} /> Отчеты и аналитика
        </Typography>
        
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Создать отчет
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Download />}
            onClick={() => setExportDialogOpen(true)}
          >
            Экспорт
          </Button>
        </Box>
      </Box>

      {/* Фильтры */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <TextField
          label="Поиск"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ minWidth: 200 }}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1 }} />
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Тип отчета</InputLabel>
          <Select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            label="Тип отчета"
          >
            <MenuItem value="">Все типы</MenuItem>
            <MenuItem value="attendance">Посещаемость</MenuItem>
            <MenuItem value="schedule">Расписание</MenuItem>
            <MenuItem value="staff">Персонал</MenuItem>
            <MenuItem value="salary">Зарплаты</MenuItem>
            <MenuItem value="children">Дети</MenuItem>
            <MenuItem value="custom">Пользовательский</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            label="Статус"
          >
            <MenuItem value="">Все статусы</MenuItem>
            <MenuItem value="completed">Завершен</MenuItem>
            <MenuItem value="scheduled">Запланирован</MenuItem>
            <MenuItem value="generating">Генерируется</MenuItem>
            <MenuItem value="failed">Ошибка</MenuItem>
          </Select>
        </FormControl>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Сотрудник</InputLabel>
          <Select
            value={filters.userId || ''}
            onChange={(e) => handleFilterChange('userId', e.target.value)}
            label="Сотрудник"
          >
            <MenuItem value="">Все сотрудники</MenuItem>
            {staff.map((member) => (
              <MenuItem key={member.id} value={member.id || ''}>{member.fullName}</MenuItem>
            ))}
          </Select>
        </FormControl>
        
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={resetFilters}
        >
          Сбросить
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<Sort />}
          onClick={() => {}}
        >
          Сортировка
        </Button>
      </Box>

      {/* Расширенные кнопки экспорта */}
      <Card sx={{ mb: 3, p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          🚀 Расширенный экспорт отчетов
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<AttachMoney />}
            onClick={() => { setExportType('salary'); setExportDialogOpen(true); }}
            sx={{ 
              bgcolor: 'rgba(255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Экспорт зарплат
          </Button>
          
          <Button
            variant="contained"
            startIcon={<ChildCare />}
            onClick={() => { setExportType('children'); setExportDialogOpen(true); }}
            sx={{ 
              bgcolor: 'rgba(255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Списки детей
          </Button>
          
          <Button
            variant="contained"
            startIcon={<People />}
            onClick={() => { setExportType('attendance'); setExportDialogOpen(true); }}
            sx={{ 
              bgcolor: 'rgba(255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Посещаемость
          </Button>
          
          <Button
            variant="contained"
            startIcon={<BarChart />}
            onClick={() => { setExportType('schedule'); setExportDialogOpen(true); }}
            sx={{ 
              bgcolor: 'rgba(255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Расписание
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Email />}
            onClick={() => setEmailDialogOpen(true)}
            sx={{ 
              bgcolor: 'rgba(255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Отправить на почту
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Schedule />}
            onClick={() => setScheduleDialogOpen(true)}
            sx={{
              bgcolor: 'rgba(255,255,0.2)',
              '&:hover': { bgcolor: 'rgba(255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Запланировать
          </Button>
        </Box>
      </Card>

      {/* Индикатор загрузки и ошибки */}
      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {/* Вкладки с отчетами */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Отчеты" />
        <Tab label="Зарплаты" />
        <Tab label="Аналитика" />
      </Tabs>

      {/* Содержимое вкладок */}
      {tabValue === 0 && (
        <Box>
          <Typography variant="h6" gutterBottom>Мои отчеты</Typography>
          
          {reports.length === 0 ? (
            <Alert severity="info">У вас пока нет сохраненных отчетов</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Тип</TableCell>
                  <TableCell>Период</TableCell>
                  <TableCell>Создан</TableCell>
                  <TableCell>Формат</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>
                      {getReportTypeText(report.type)}
                    </TableCell>
                    <TableCell>
                      {new Date(report.dateRange.startDate).toLocaleDateString('ru-RU')} - 
                      {new Date(report.dateRange.endDate).toLocaleDateString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      {report.createdAt ? new Date(report.createdAt).toLocaleDateString('ru-RU') : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={report.format?.toUpperCase() || 'PDF'} 
                        size="small"
                        color={report.format === 'pdf' ? 'error' : report.format === 'excel' ? 'success' : 'primary'}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Скачать">
                        <IconButton 
                          size="small" 
                          onClick={() => handleExport(report.id || '', report.format || 'pdf')}
                        >
                          {report.format === 'pdf' ? <PictureAsPdf fontSize="small" /> : 
                           report.format === 'excel' ? <TableChart fontSize="small" /> : 
                           <InsertDriveFile fontSize="small" />}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Удалить">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteReport(report.id || '')}
                        >
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>Отчеты по зарплатам</Typography>
          <ReportsSalary 
            startDate={startDate.toISOString().split('T')[0]} 
            endDate={endDate.toISOString().split('T')[0]} 
            userId={selectedUserId || undefined}
          />
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Аналитика</Typography>
          <Analytics 
           
          />
        </Box>
      )}

      {/* Диалог создания отчета */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Создать новый отчет</DialogTitle>
        
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select
                  value={reportType}
                  onChange={handleReportTypeChange}
                  label="Тип отчета"
                >
                  <MenuItem value="attendance">Посещаемость</MenuItem>
                  <MenuItem value="schedule">Расписание</MenuItem>
                  <MenuItem value="staff">Персонал</MenuItem>
                  <MenuItem value="custom">Пользовательский</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Название отчета"
                fullWidth
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Формат</InputLabel>
                <Select
                  value={reportFormat}
                  onChange={(e) => setReportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                  label="Формат"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Отмена</Button>
          <Button 
            onClick={handleCreateReport} 
            variant="contained" 
            color="primary"
          >
            Создать
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ДИАЛОГ НАСТРОЙКИ ЭКСПОРТА ===== */}
      <Dialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          textAlign: 'center'
        }}>
          🚀 Экспорт отчета: {exportType === 'salary' ? 'Зарплаты' : exportType === 'children' ? 'Списки детей' : exportType === 'attendance' ? 'Посещаемость' : 'Расписание'}
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Формат файла</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                  label="Формат файла"
                >
                  <MenuItem value="pdf">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PictureAsPdf color="error" />
                      PDF - Для печати и просмотра
                    </Box>
                  </MenuItem>
                  <MenuItem value="excel">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableChart color="success" />
                      Excel - Для анализа данных
                    </Box>
                  </MenuItem>
                  <MenuItem value="csv">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InsertDriveFile color="primary" />
                      CSV - Для импорта в другие системы
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {exportType === 'salary' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#667eea' }}>
                    💰 Настройки отчета по зарплатам
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Отчет будет включать базовую зарплату, надбавки, удержания и итоговую сумму к выплате
                  </Typography>
                </Grid>
              </>
            )}
            
            {exportType === 'children' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#667eea' }}>
                    👶 Настройки списка детей
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Отчет будет включать ФИО детей, возраст, группу, контактную информацию родителей и медицинские данные
                  </Typography>
                </Grid>
              </>
            )}
            
            {exportType === 'attendance' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#667eea' }}>
                    📊 Настройки отчета посещаемости
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Отчет будет включать статистику посещений, опоздания, ранние уходы и графики
                  </Typography>
                </Grid>
              </>
            )}
            
            {exportType === 'schedule' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 1, color: '#667eea' }}>
                    📅 Настройки отчета расписания
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Отчет будет включать расписание смен, количество часов и эффективность работы
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setExportDialogOpen(false)}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button
            onClick={() => {
              setScheduleDialogOpen(true);
              setExportDialogOpen(false);
            }}
            variant="contained"
            startIcon={<Schedule />}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)' }
            }}
          >
            Планировать
          </Button>
          <Button
            onClick={handleAdvancedExport}
            variant="contained"
            startIcon={<GetApp />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' }
            }}
          >
            Скачать отчет
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ДИАЛОГ ПЛАНИРОВАНИЯ ===== */}
      <Dialog open={scheduleDialogOpen} onClose={() => setScheduleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          textAlign: 'center'
        }}>
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
                  label="Тип отчета"
                >
                  <MenuItem value="salary">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney />
                      Отчет по зарплатам
                    </Box>
                  </MenuItem>
                  <MenuItem value="children">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChildCare />
                      Списки детей
                    </Box>
                  </MenuItem>
                  <MenuItem value="attendance">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People />
                      Отчет посещаемости
                    </Box>
                  </MenuItem>
                  <MenuItem value="schedule">
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
                  label="Частота"
                >
                  <MenuItem value="daily">Ежедневно</MenuItem>
                  <MenuItem value="weekly">Еженедельно</MenuItem>
                  <MenuItem value="monthly">Ежемесячно</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email получателей"
                placeholder="email1@example.com, email2@example.com"
                value={scheduleRecipients}
                onChange={(e) => setScheduleRecipients(e.target.value)}
                helperText="Введите email адреса через запятую"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Формат файла</InputLabel>
                <Select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                  label="Формат файла"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button
            onClick={() => setScheduleDialogOpen(false)}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button
            onClick={handleScheduleReport}
            variant="contained"
            startIcon={<Schedule />}
            sx={{
              background: 'linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #43A047 0%, #1B5E20 100%)' }
            }}
          >
            Запланировать
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== ДИАЛОГ ОТПРАВКИ НА ПОЧТУ ===== */}
      <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          textAlign: 'center'
        }}>
          📧 Отправка отчета на почту
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Тип отчета</InputLabel>
                <Select
                  value={exportType}
                  onChange={(e) => setExportType(e.target.value as 'salary' | 'children' | 'attendance' | 'schedule')}
                  label="Тип отчета"
                >
                  <MenuItem value="salary">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachMoney />
                      Отчет по зарплатам
                    </Box>
                  </MenuItem>
                  <MenuItem value="children">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChildCare />
                      Списки детей
                    </Box>
                  </MenuItem>
                  <MenuItem value="attendance">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <People />
                      Отчет посещаемости
                    </Box>
                  </MenuItem>
                  <MenuItem value="schedule">
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
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'excel' | 'csv')}
                  label="Формат файла"
                >
                  <MenuItem value="pdf">PDF</MenuItem>
                  <MenuItem value="excel">Excel</MenuItem>
                  <MenuItem value="csv">CSV</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email получателей"
                placeholder="email1@example.com, email2@example.com"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                helperText="Введите email адреса через запятую"
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Тема письма"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder={`Отчет по ${exportType} за ${startDate.toLocaleDateString('ru-RU')} - ${endDate.toLocaleDateString('ru-RU')}`}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Сообщение (необязательно)"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                placeholder="Добавьте комментарий к отчету..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button 
            onClick={() => setEmailDialogOpen(false)}
            variant="outlined"
          >
            Отмена
          </Button>
          <Button 
            onClick={handleSendByEmail}
            variant="contained"
            startIcon={<Email />}
            disabled={!emailRecipients.trim()}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)' }
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
