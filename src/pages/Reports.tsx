import React, { useState, useEffect } from 'react';
import {
  Paper, Typography, Box, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, Grid, IconButton,
  Tooltip, Chip, CircularProgress, Alert, SelectChangeEvent, Tabs, Tab,
  Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent
} from '@mui/material';
import { 
  Add, Delete, Assessment, PictureAsPdf, TableChart, 
  InsertDriveFile, FilterList, Email, Schedule,
  GetApp, AttachMoney, People, ChildCare
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  getReports, deleteReport, getAttendanceStatistics,
  getScheduleStatistics, exportReport, generateCustomReport,
  exportSalaryReport, exportChildrenReport, exportAttendanceReport,
  sendReportByEmail, scheduleReport, downloadReport,
  Report, AttendanceStats, ScheduleStats
} from '../components/services/api/reports';
import { getUsers } from '../components/services/api/users';

// Интерфейс для сотрудника
interface StaffMember {
  id?: string;
  fullName: string;
  role: string;
}

const Reports: React.FC = () => {
  // Состояния для данных
  const [reports, setReports] = useState<Report[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStats | null>(null);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  
  // Состояния для UI
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Новые состояния для расширенного экспорта
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [exportType, setExportType] = useState<'salary' | 'children' | 'attendance'>('salary');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [emailRecipients, setEmailRecipients] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailMessage, setEmailMessage] = useState<string>('');
  
  // Состояния для фильтров
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [reportType, setReportType] = useState<string>('attendance');
  const [reportFormat, setReportFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
  const [reportTitle, setReportTitle] = useState<string>('');
  
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
      setStaff(staffData);
      
      // Получение статистики
      await fetchStatistics();
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };
  
  // Получение статистики
  const fetchStatistics = async () => {
    try {
      // Форматируем даты для API
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      // Получаем статистику посещаемости
      const attendanceStatsData = await getAttendanceStatistics(
        formattedStartDate, 
        formattedEndDate, 
        selectedUserId || undefined
      );
      setAttendanceStats(attendanceStatsData);
      
      // Получаем статистику расписания
      const scheduleStatsData = await getScheduleStatistics(
        formattedStartDate, 
        formattedEndDate, 
        selectedUserId || undefined
      );
      setScheduleStats(scheduleStatsData);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки статистики');
    }
  };
  
  // Обработчик изменения вкладки
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
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
  
  // Обработчик экспорта списков детей
  const handleExportChildren = async () => {
    setLoading(true);
    try {
      const blob = await exportChildrenReport({
        groupId: selectedUserId || undefined, // Используем как groupId
        format: exportFormat,
        includeParentInfo: true,
        includeHealthInfo: true
      });
      
      // Скачиваем файл
      const url = window.URL.createObjectURL(blob as Blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `children_report.${exportFormat === 'excel' ? 'xlsx' : exportFormat}`;
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
  
  // Обработчик экспорта посещаемости
  const handleExportAttendance = async () => {
    setLoading(true);
    try {
      const blob = await exportAttendanceReport({
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        userId: selectedUserId || undefined,
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
  const handleAdvancedExport = () => {
    switch (exportType) {
      case 'salary':
        return handleExportSalary();
      case 'children':
        return handleExportChildren();
      case 'attendance':
        return handleExportAttendance();
      default:
        setError('Неизвестный тип отчета');
    }
  };
  
  // Получение текста для типа отчета
  const getReportTypeText = (type: 'attendance' | 'schedule' | 'staff' | 'salary' | 'children' | 'custom') => {
    switch (type) {
      case 'attendance': return 'Посещаемость';
      case 'schedule': return 'Расписание';
      case 'staff': return 'Персонал';
      case 'custom': return 'Пользовательский';
      default: return type;
    }
  };
  
  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок и кнопки управления */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center">
          <Assessment sx={{ mr: 1 }} /> Отчеты и аналитика
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Создать отчет
        </Button>
      </Box>
      
      {/* Фильтры */}
      <Box mb={3} display="flex" flexWrap="wrap" gap={2}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Начальная дата"
            value={startDate}
            onChange={(newValue) => newValue && setStartDate(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
          
          <DatePicker
            label="Конечная дата"
            value={endDate}
            onChange={(newValue) => newValue && setEndDate(newValue)}
            renderInput={(params) => <TextField {...params} />}
          />
        </LocalizationProvider>
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Сотрудник</InputLabel>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
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
          startIcon={<FilterList />}
          onClick={fetchStatistics}
        >
          Применить фильтры
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
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
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
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
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
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Посещаемость
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Email />}
            onClick={() => setEmailDialogOpen(true)}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
              backdropFilter: 'blur(10px)'
            }}
          >
            Отправить на почту
          </Button>
          
          <Button
            variant="contained"
            startIcon={<Schedule />}
            onClick={() => alert('Функция планирования отчетов будет доступна в следующей версии!')}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
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
        <Tab label="Сводная статистика" />
        <Tab label="Посещаемость" />
        <Tab label="Расписание" />
        <Tab label="Персонал" />
        <Tab label="Мои отчеты" />
      </Tabs>
      
      {/* Содержимое вкладок */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* Карточки со статистикой */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Посещаемость</Typography>
                {attendanceStats && (
                  <>
                    <Typography>Всего дней: {attendanceStats.totalDays}</Typography>
                    <Typography>Присутствие: {attendanceStats.presentDays} дней ({attendanceStats.attendanceRate.toFixed(1)}%)</Typography>
                    <Typography>Опоздания: {attendanceStats.lateDays} дней</Typography>
                    <Typography>Отсутствия: {attendanceStats.absentDays} дней</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Рабочее время</Typography>
                {attendanceStats && (
                  <>
                    <Typography>Всего часов: {attendanceStats.totalWorkHours}</Typography>
                    <Typography>Среднее в день: {attendanceStats.averageWorkHoursPerDay.toFixed(1)} ч</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Смены</Typography>
                {scheduleStats && (
                  <>
                    <Typography>Всего смен: {scheduleStats.totalShifts}</Typography>
                    <Typography>Обычные: {scheduleStats.regularShifts}</Typography>
                    <Typography>Сверхурочные: {scheduleStats.overtimeShifts}</Typography>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          {/* Графики и диаграммы */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Графики и диаграммы</Typography>
                <Typography color="text.secondary">
                  Здесь будут графики и диаграммы с визуализацией данных.
                </Typography>
                <Box 
                  sx={{ 
                    height: 300, 
                    bgcolor: 'rgba(0, 0, 0, 0.04)', 
                    borderRadius: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    mt: 2
                  }}
                >
                  <Typography color="text.secondary">
                    Графики посещаемости и рабочего времени
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom>Отчет по посещаемости</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Всего дней</TableCell>
                <TableCell>Присутствие</TableCell>
                <TableCell>Опоздания</TableCell>
                <TableCell>Отсутствия</TableCell>
                <TableCell>Ранний уход</TableCell>
                <TableCell>Больничный</TableCell>
                <TableCell>Отпуск</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.fullName}</TableCell>
                  <TableCell>22</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>2</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExport('attendance', 'pdf')}
            >
              Экспорт в PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('attendance', 'excel')}
            >
              Экспорт в Excel
            </Button>
          </Box>
        </Box>
      )}
      
      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom>Отчет по расписанию</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Всего смен</TableCell>
                <TableCell>Обычные смены</TableCell>
                <TableCell>Сверхурочные</TableCell>
                <TableCell>Больничный</TableCell>
                <TableCell>Отпуск</TableCell>
                <TableCell>Всего часов</TableCell>
                <TableCell>Сверхурочные часы</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.fullName}</TableCell>
                  <TableCell>22</TableCell>
                  <TableCell>18</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>176</TableCell>
                  <TableCell>8</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExport('schedule', 'pdf')}
            >
              Экспорт в PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('schedule', 'excel')}
            >
              Экспорт в Excel
            </Button>
          </Box>
        </Box>
      )}
      
      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom>Отчет по персоналу</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Сотрудник</TableCell>
                <TableCell>Должность</TableCell>
                <TableCell>Группа</TableCell>
                <TableCell>Дата приема</TableCell>
                <TableCell>Стаж</TableCell>
                <TableCell>Статус</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {staff.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.fullName}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>Группа 1</TableCell>
                  <TableCell>01.01.2023</TableCell>
                  <TableCell>1 год 8 месяцев</TableCell>
                  <TableCell>
                    <Chip 
                      label="Активен" 
                      size="small"
                      color="success"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Box mt={2} display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<PictureAsPdf />}
              onClick={() => handleExport('staff', 'pdf')}
            >
              Экспорт в PDF
            </Button>
            <Button
              variant="outlined"
              startIcon={<TableChart />}
              onClick={() => handleExport('staff', 'excel')}
            >
              Экспорт в Excel
            </Button>
          </Box>
        </Box>
      )}
      
      {tabValue === 4 && (
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
                {reports.map((report) => (
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
          🚀 Экспорт отчета: {exportType === 'salary' ? 'Зарплаты' : exportType === 'children' ? 'Списки детей' : 'Посещаемость'}
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
                  onChange={(e) => setExportType(e.target.value as 'salary' | 'children' | 'attendance')}
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
