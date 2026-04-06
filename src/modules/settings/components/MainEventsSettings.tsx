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


import { exportData } from '../../../shared/utils/exportUtils';
import { getChildAttendance } from '../../children/services/childAttendance';
import { getShifts } from '../../staff/services/shifts';
import { getPayrolls } from '../../staff/services/payroll';
import {
  getRents,
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
  format: 'xlsx';
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
          emailRecipients: [] as string[],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'xlsx',
        },
        {
          id: 'childPayment',
          name: 'Оплаты за посещение детей',
          collection: 'childPayment',
          description: 'Оплаты за посещение детей',
          exportDayOfMonth: 30,
          emailRecipients: [] as string[],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'xlsx',
        },
        {
          id: 'staffShifts',
          name: 'Смены (раздел сотрудники)',
          collection: 'staffShifts',
          description: 'Смены сотрудников',
          exportDayOfMonth: 30,
          emailRecipients: [] as string[],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'xlsx',
        },
        {
          id: 'payroll',
          name: 'Зарплаты',
          collection: 'payroll',
          description: 'Зарплатные ведомости',
          exportDayOfMonth: 30,
          emailRecipients: [] as string[],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'xlsx',
        },
        {
          id: 'rent',
          name: 'Аренда',
          collection: 'rent',
          description: 'Арендные платежи',
          exportDayOfMonth: 30,
          emailRecipients: [] as string[],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'xlsx',
        },
        {
          id: 'schedule',
          name: 'Расписание',
          collection: 'schedule',
          description: 'Отчет по расписанию',
          exportDayOfMonth: 30,
          emailRecipients: [] as string[],
          scheduleFrequency: 'none' as 'daily' | 'weekly' | 'monthly' | 'none',
          format: 'xlsx',
        },
      ];


      const collectionsWithCounts = await Promise.all(
        collections.map(async (entity) => {
          const count = await getEntityCount(entity.collection);
          const nextExportDate = getNextExportDate(entity.exportDayOfMonth);
          const daysUntilExport = getDaysUntilExport(nextExportDate);
          const result: ExportEntity = {
            ...entity,
            count,
            nextExportDate,
            daysUntilExport,
            format: 'xlsx',
          };
          return result;
        }),
      );

      setExportEntities(collectionsWithCounts);
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

    // Get the last day of the current month
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    // Use the minimum of the provided day and the last day of the month to avoid invalid dates
    const adjustedDay = Math.min(dayOfMonth, lastDayOfMonth);

    let exportDate = new Date(year, month, adjustedDay);

    // If the calculated date is before or equal to today, move to next month
    if (exportDate <= today) {
      const nextMonthLastDay = new Date(year, month + 2, 0).getDate();
      const nextMonthAdjustedDay = Math.min(dayOfMonth, nextMonthLastDay);
      exportDate = new Date(year, month + 1, nextMonthAdjustedDay);
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
          await exportData('children-attendance', 'xlsx', {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
            includeStatistics: true,
            includeCharts: true,
          });
          break;

        case 'staffShifts':
          await exportData('staff-schedule', 'xlsx', {
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date().toISOString().split('T')[0],
          });
          break;

        case 'childPayment':
          // В данном контексте это скорее отчет по оплатам, а не список детей
          await exportData('child-payments', 'xlsx', {
            period: new Date().toISOString().substring(0, 7)
          });
          break;

        case 'payroll':
          await exportData('salary', 'xlsx', {
            period: new Date().toISOString().substring(0, 7)
          });
          break;

        case 'rent':
          await exportData('rents', 'xlsx', {});
          break;

        case 'schedule':
          alert(`Экспорт отчета по расписанию в формате ${entity.format} запустится скоро (в разработке)`);
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
      setLoading(true);
      // Для упрощения просто вызываем экспорт по очереди для всех сущностей
      for (const entity of exportEntities) {
        await handleExecuteExportForEntity(entity);
      }
      alert('Все сущности успешно экспортированы');
    } catch (err) {
      setError('Ошибка массового экспорта: ' + (err as Error).message);
    } finally {
      setLoading(false);
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
                              e.target.value as 'xlsx',
                            )
                          }
                        >
                          <MenuItem value='xlsx'>xlsx</MenuItem>
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
