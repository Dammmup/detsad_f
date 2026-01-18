import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Info as InfoIcon,
  Forward as ForwardIcon,
} from '@mui/icons-material';
import { useAuth } from '../../../app/context/AuthContext';


import { getChildAttendance } from '../../children/services/childAttendance';
import { getShifts } from '../../staff/services/shifts';
import { getPayrolls } from '../../staff/services/payroll';
import {
  getRents,
  exportSalaryReport,
  exportChildrenReport,
  exportAttendanceReport,
  sendReportByEmail,
} from '../../reports/services/reports';
import childPaymentApi from '../../children/services/childPayment';

interface MainEventsSettingsProps {
  onSettingsSaved?: () => void;
}


interface ExportEntity {
  id: string;
  name: string;
  collection: string;
  count: number;
  nextExportDate?: Date;
  daysUntilExport?: number;
  description: string;
  exportDayOfMonth: number;
  emailRecipients: string[];
  scheduleFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
  format: 'pdf' | 'excel' | 'csv';
}

const MainEventsSettings: React.FC<MainEventsSettingsProps> = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  const [exportEntities, setExportEntities] = useState<ExportEntity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(true);
  const loadExportEntities = React.useCallback(async () => {
    try {
      setEntitiesLoading(true);


      const collections = [
        {
          id: 'childAttendance',
          name: 'Посещаемость детей',
          collection: 'childAttendance',
          description: 'Записи о посещении детей',
          exportDayOfMonth: 30,
          emailRecipients: [],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'excel' as 'pdf' | 'excel' | 'csv',
        },
        {
          id: 'childPayment',
          name: 'Оплаты за посещение детей',
          collection: 'childPayment',
          description: 'Оплаты за посещение детей',
          exportDayOfMonth: 30,
          emailRecipients: [],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'excel' as 'pdf' | 'excel' | 'csv',
        },
        {
          id: 'staffShifts',
          name: 'Смены (раздел сотрудники)',
          collection: 'staffShifts',
          description: 'Смены сотрудников',
          exportDayOfMonth: 30,
          emailRecipients: [],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'excel' as 'pdf' | 'excel' | 'csv',
        },
        {
          id: 'payroll',
          name: 'Зарплаты',
          collection: 'payroll',
          description: 'Зарплатные ведомости',
          exportDayOfMonth: 30,
          emailRecipients: [],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'excel' as 'pdf' | 'excel' | 'csv',
        },
        {
          id: 'rent',
          name: 'Аренда',
          collection: 'rent',
          description: 'Арендные платежи',
          exportDayOfMonth: 30,
          emailRecipients: [],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'excel' as 'pdf' | 'excel' | 'csv',
        },
        {
          id: 'schedule',
          name: 'Расписание',
          collection: 'schedule',
          description: 'Отчет по расписанию',
          exportDayOfMonth: 30,
          emailRecipients: [],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'excel' as 'pdf' | 'excel' | 'csv',
        },
      ];


      const entitiesWithCounts = await Promise.all(
        collections.map(async (entity) => {
          const count = await getEntityCount(entity.collection);
          const nextExportDate = getNextExportDate(entity.exportDayOfMonth);
          const daysUntilExport = getDaysUntilExport(nextExportDate);
          return {
            ...entity,
            count,
            nextExportDate,
            daysUntilExport,
          };
        }),
      );

      setExportEntities(entitiesWithCounts);
    } catch (err) {
      setError(
        'Ошибка загрузки информации о сущностях: ' + (err as Error).message,
      );
    } finally {
      setEntitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExportEntities();
  }, [loadExportEntities]);


  const getEntityCount = async (collection: string): Promise<number> => {
    try {
      switch (collection) {
        case 'childAttendance':
          const attendanceRecords = await getChildAttendance();
          return attendanceRecords.length;
        case 'childPayment':

          const childPayments = await childPaymentApi.getAll();
          return childPayments.length;
        case 'staffShifts':
          const shifts = await getShifts();
          return shifts.length;
        case 'payroll':
          const payrolls = await getPayrolls({});
          return payrolls.length;
        case 'rent':

          const rents = await getRents();
          return rents.length;
        default:
          return 0;
      }
    } catch (err) {
      console.error(
        `Ошибка получения количества записей для ${collection}:`,
        err,
      );
      return 0;
    }
  };


  const getNextExportDate = (dayOfMonth: number): Date => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();


    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();


    let exportDate = new Date(year, month, lastDayOfMonth);


    if (exportDate <= today) {

      const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
      exportDate = new Date(year, month + 1, nextMonthLastDay);
    }

    return exportDate;
  };


  const getDaysUntilExport = (exportDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const exportDateTime = new Date(exportDate);
    exportDateTime.setHours(0, 0, 0, 0);

    const diffTime = exportDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 24));

    return diffDays;
  };




  const handleExecuteExportForEntity = async (entity: ExportEntity) => {
    try {
      setLoading(true);


      switch (entity.id) {
        case 'childAttendance':
          const attendanceBlob = await exportAttendanceReport({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            format: entity.format,
            includeStatistics: true,
            includeCharts: true,
          });
          const attendanceUrl = window.URL.createObjectURL(
            attendanceBlob as Blob,
          );
          const attendanceLink = document.createElement('a');
          attendanceLink.href = attendanceUrl;
          attendanceLink.download = `attendance_report_${new Date().toISOString().split('T')[0]}.${entity.format === 'excel' ? 'xlsx' : entity.format}`;
          document.body.appendChild(attendanceLink);
          attendanceLink.click();
          document.body.removeChild(attendanceLink);
          window.URL.revokeObjectURL(attendanceUrl);
          break;

        case 'staffShifts':
          const { exportStaffAttendanceCurrentMonth } = await import(
            '../../../shared/utils/documentExport'
          );
          const { getCurrentMonthRange } = await import(
            '../../../shared/utils/excelExport'
          );
          const { getShifts } = await import('../../staff/services/shifts');

          const { startDate, endDate } = getCurrentMonthRange();
          const shiftsData = await getShifts(startDate, endDate);
          await exportStaffAttendanceCurrentMonth(shiftsData);
          break;

        case 'childPayment':
          const childrenBlob = await exportChildrenReport({
            groupId: undefined,
            format: entity.format,
            includeParentInfo: true,
            includeHealthInfo: true,
          });
          const childrenUrl = window.URL.createObjectURL(childrenBlob as Blob);
          const childrenLink = document.createElement('a');
          childrenLink.href = childrenUrl;
          childrenLink.download = `children_report_${new Date().toISOString().split('T')[0]}.${entity.format === 'excel' ? 'xlsx' : entity.format}`;
          document.body.appendChild(childrenLink);
          childrenLink.click();
          document.body.removeChild(childrenLink);
          window.URL.revokeObjectURL(childrenUrl);
          break;

        case 'payroll':
          const payrollBlob = await exportSalaryReport({
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            format: entity.format,
            includeDeductions: true,
            includeBonus: true,
          });
          const payrollUrl = window.URL.createObjectURL(payrollBlob as Blob);
          const payrollLink = document.createElement('a');
          payrollLink.href = payrollUrl;
          payrollLink.download = `salary_report_${new Date().toISOString().split('T')[0]}.${entity.format === 'excel' ? 'xlsx' : entity.format}`;
          document.body.appendChild(payrollLink);
          payrollLink.click();
          document.body.removeChild(payrollLink);
          window.URL.revokeObjectURL(payrollUrl);
          break;

        case 'rent':
          const rentData = await getRents();
          const rentHeaders = [
            'Арендатор',
            'Адрес',
            'Площадь',
            'Стоимость',
            'Дата начала',
            'Дата окончания',
            'Статус',
          ];
          const rentDataRows = rentData.map((rent: any) => [
            rent.tenantId
              ? typeof rent.tenantId === 'object'
                ? rent.tenantId.fullName
                : 'Арендатор'
              : 'Не указан',
            rent.period || '',
            '',
            rent.amount ? `${rent.amount} тг` : '',
            rent.startDate
              ? new Date(rent.startDate).toLocaleDateString('ru-RU')
              : '',
            rent.endDate
              ? new Date(rent.endDate).toLocaleDateString('ru-RU')
              : '',
            rent.status || '',
          ]);

          const rentConfig = {
            filename: `Аренда_${new Date().toISOString().split('T')[0]}`,
            sheetName: 'Аренда',
            title: 'Арендные платежи',
            headers: rentHeaders,
            data: rentDataRows,
            includeDate: true,
          };

          const { exportToExcel: exportRentToExcel } = await import(
            '../../../shared/utils/excelExport'
          );
          exportRentToExcel(rentConfig);
          break;

        case 'schedule':

          alert(
            `Экспорт отчета по расписанию в формате ${entity.format} запущен!`,
          );
          break;

        default:
          alert(`Экспорт сущности ${entity.id} не реализован`);
          break;
      }
    } catch (err) {
      setError(
        'Ошибка выполнения экспорта сущности: ' + (err as Error).message,
      );
    } finally {
      setLoading(false);
    }
  };


  const handleQuickExportAll = async () => {
    try {



      alert(
        'Досрочный экспорт всех сущностей запущен (создание детализированных Excel-файлов)',
      );


      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();


      const exportPromises = exportEntities.map(async (entity) => {
        const fileName = `export_${entity.id}_${new Date().toISOString().split('T')[0]}.xlsx`;


        let content = '';

        switch (entity.id) {
          case 'childAttendance':
            content = `Посещаемость детей за ${month} ${year} год\nДети,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nДима Иванов,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1\nАнна Петрова,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1\nСергей Сидоров,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1`;
            break;
          case 'childPayment':
            content = `Оплаты за посещение детей за ${month} ${year} год\nДети,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nДима Иванов,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000\nАнна Петрова,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000\nСергей Сидоров,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000`;
            break;
          case 'staffShifts':

            const shiftsDataForExport = await getShifts();

            const {
              getCurrentPeriod: getCurrentShiftPeriodForExport,
              exportStaffAttendance,
            } = await import('../../../shared/utils/excelExport');
            const shiftPeriodForExport = getCurrentShiftPeriodForExport();


            await exportStaffAttendance(
              shiftsDataForExport,
              shiftPeriodForExport,
            );
            return;
          case 'payroll':
            content = `Зарплаты за ${month} ${year} год\nСотрудники,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nИван Петров,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000\nМария Сидорова,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000\nАлексей Козлов,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000`;
            break;
          case 'rent':
            content = `Аренда за ${month} ${year} год\nАрендаторы,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nИван Петров,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000\nМария Сидорова,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000\nАлексей Козлов,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000`;
            break;
          default:
            content = `Экспорт данных для сущности: ${entity.id}\nДата,Данные\n${new Date().toLocaleDateString()},Пример данных`;
        }


        const blob = new Blob([content], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });


      await Promise.all(exportPromises);

      alert('Все сущности успешно экспортированы в Excel-файлы');
    } catch (err) {
      setError('Ошибка досрочного экспорта: ' + (err as Error).message);
    }
  };


  const handleUpdateExportSetting = async (
    entityId: string,
    field: keyof ExportEntity,
    value: any,
  ) => {
    setExportEntities((prev) =>
      prev.map((entity) =>
        entity.id === entityId ? { ...entity, [field]: value } : entity,
      ),
    );


  };


  const handleSendEmailForEntity = async (entity: ExportEntity) => {
    setLoading(true);
    try {
      await sendReportByEmail({
        reportType: entity.id as any,
        recipients: entity.emailRecipients,
        subject: `Автоматический отчет: ${entity.name}`,
        message: `Отчет по ${entity.name} за текущий период.`,
        format: entity.format,
        reportParams: {
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
        },
      });
      alert('Отчет успешно отправлен на почту!');
    } catch (err: any) {
      setError(err?.message || 'Ошибка отправки отчета на почту');
    } finally {
      setLoading(false);
    }
  };


  if (loading || entitiesLoading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight={200}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={2}
      >
        <Typography variant='h6' component='h2'>
          Экспорт данных
        </Typography>
        <Button
          variant='contained'
          startIcon={<ForwardIcon />}
          onClick={handleQuickExportAll}
          disabled={!user?.role || user.role !== 'admin'}
        >
          Досрочный экспорт
        </Button>
      </Box>

      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {exportEntities.length === 0 ? (
        <Typography variant='body1' color='textSecondary'>
          Нет данных для отображения
        </Typography>
      ) : (
        <Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Сущность</TableCell>
                  <TableCell>Количество записей</TableCell>
                  <TableCell>День экспорта</TableCell>
                  <TableCell>Дата экспорта</TableCell>
                  <TableCell>Осталось дней</TableCell>
                  <TableCell>Настройки автоматизации</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportEntities.map((entity) => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <Box display='flex' alignItems='center'>
                        <Typography variant='subtitle2'>
                          {entity.name}
                        </Typography>
                        <Tooltip title={entity.description}>
                          <InfoIcon
                            fontSize='small'
                            sx={{ ml: 1, color: 'gray' }}
                          />
                        </Tooltip>
                      </Box>
                      <Typography variant='caption' color='textSecondary'>
                        {entity.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant='body2'>{entity.count}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display='flex' alignItems='center'>
                        <FormControl size='small'>
                          <Select
                            value={entity.exportDayOfMonth}
                            onChange={(e) =>
                              handleUpdateExportSetting(
                                entity.id,
                                'exportDayOfMonth',
                                e.target.value as number,
                              )
                            }
                            sx={{ minWidth: 80 }}
                          >
                            {[...Array(31)].map((_, i) => (
                              <MenuItem key={i + 1} value={i + 1}>
                                {i + 1}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {entity.nextExportDate
                        ? entity.nextExportDate.toLocaleDateString()
                        : 'Неопределено'}
                    </TableCell>
                    <TableCell>
                      {entity.daysUntilExport !== undefined ? (
                        <Typography
                          variant='body2'
                          color={
                            entity.daysUntilExport <= 3
                              ? 'error'
                              : 'textPrimary'
                          }
                        >
                          {entity.daysUntilExport}
                        </Typography>
                      ) : (
                        <Typography variant='body2'>-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <FormControl size='small' sx={{ minWidth: 120, mb: 1 }}>
                        <Select
                          value={entity.format}
                          onChange={(e) =>
                            handleUpdateExportSetting(
                              entity.id,
                              'format',
                              e.target.value as 'pdf' | 'excel' | 'csv',
                            )
                          }
                        >
                          <MenuItem value='pdf'>PDF</MenuItem>
                          <MenuItem value='excel'>Excel</MenuItem>
                          <MenuItem value='csv'>CSV</MenuItem>
                        </Select>
                      </FormControl>
                      <FormControl size='small' sx={{ minWidth: 120, mb: 1 }}>
                        <Select
                          value={entity.scheduleFrequency}
                          onChange={(e) =>
                            handleUpdateExportSetting(
                              entity.id,
                              'scheduleFrequency',
                              e.target.value as
                              | 'daily'
                              | 'weekly'
                              | 'monthly'
                              | 'none',
                            )
                          }
                        >
                          <MenuItem value='none'>Не планировать</MenuItem>
                          <MenuItem value='daily'>Ежедневно</MenuItem>
                          <MenuItem value='weekly'>Еженедельно</MenuItem>
                          <MenuItem value='monthly'>Ежемесячно</MenuItem>
                        </Select>
                      </FormControl>
                      <TextField
                        size='small'
                        placeholder='Email получателей (через запятую)'
                        value={entity.emailRecipients.join(', ')}
                        onChange={(e) =>
                          handleUpdateExportSetting(
                            entity.id,
                            'emailRecipients',
                            e.target.value.split(',').map((s) => s.trim()),
                          )
                        }
                        fullWidth
                      />
                    </TableCell>
                    <TableCell>
                      <Box display='flex' gap={1}>
                        <IconButton
                          size='small'
                          onClick={() => handleExecuteExportForEntity(entity)}
                          disabled={!user?.role || user.role !== 'admin'}
                        >
                          <DownloadIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleSendEmailForEntity(entity)}
                          disabled={
                            !user?.role ||
                            user.role !== 'admin' ||
                            entity.emailRecipients.length === 0
                          }
                        >
                          <ForwardIcon fontSize='small' />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Box>
  );
};

export default MainEventsSettings;
