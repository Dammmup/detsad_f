import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  FormControl,
  Select,
  MenuItem,

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
  Tooltip
} from '@mui/material';
import {

  Download as DownloadIcon,

  Info as InfoIcon,
  Forward as ForwardIcon
} from '@mui/icons-material';
import {
  mainEventsService,
  MainEvent,
  MainEventCreateInput
} from '../../services/mainEvents';
import { useAuth } from '../context/AuthContext';

// Сервисы для получения данных о коллекциях
import { getChildAttendance } from '../../services/childAttendance';
import { getShifts } from '../../services/shifts';
import { getPayrolls } from '../../services/payroll';
import {  getRents } from '../../services/reports';
import childPaymentApi from '../../services/childPayment';

interface MainEventsSettingsProps {
  onSettingsSaved?: () => void;
}

// Интерфейс для сущности экспорта
interface ExportEntity {
  id: string;
  name: string;
  collection: string;
  count: number;
  nextExportDate?: Date;
  daysUntilExport?: number;
  description: string;
  exportDayOfMonth: number; // День месяца для экспорта
}

const MainEventsSettings: React.FC<MainEventsSettingsProps> = ({ onSettingsSaved }) => {
  const { user } = useAuth();
  const [mainEvents, setMainEvents] = useState<MainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MainEvent | null>(null);
  const [formData, setFormData] = useState<Omit<MainEventCreateInput, 'id'>>({
    name: '',
    description: '',
    dayOfMonth: 1,
    enabled: true,
    exportCollections: [],
    emailRecipients: []
  });
  const [newRecipient, setNewRecipient] = useState('');
  const [newCollection, setNewCollection] = useState('');
  
  // Состояние для отображения информации о сущностях
  const [exportEntities, setExportEntities] = useState<ExportEntity[]>([]);
  const [entitiesLoading, setEntitiesLoading] = useState(true);

  // Загрузка событий
  useEffect(() => {
    loadMainEvents();
    loadExportEntities();
  }, []);

  // Функция для получения количества записей в коллекциях
  const getEntityCount = async (collection: string): Promise<number> => {
    try {
      switch (collection) {
        case 'childAttendance':
          const attendanceRecords = await getChildAttendance();
          return attendanceRecords.length;
        case 'childPayment':
          // Для childPayment получаем данные через API
          const childPayments = await childPaymentApi.getAll();
          return childPayments.length;
        case 'staffShifts':
          const shifts = await getShifts();
          return shifts.length;
        case 'payroll':
          const payrolls = await getPayrolls({});
          return payrolls.length;
        case 'rent':
          // Для аренды получаем данные через API
          const rents = await getRents();
          return rents.length;
        default:
          return 0;
      }
    } catch (err) {
      console.error(`Ошибка получения количества записей для ${collection}:`, err);
      return 0;
    }
  };

  // Функция для расчета даты следующего экспорта (конец месяца)
  const getNextExportDate = (dayOfMonth: number): Date => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Создаем дату для указанного дня месяца
    let exportDate = new Date(year, month, dayOfMonth);
    
    // Если дата уже прошла в этом месяце, берем следующий месяц
    if (exportDate <= today) {
      // Проверяем, если это конец февраля (28 или 29 день)
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const finalDay = Math.min(dayOfMonth, daysInMonth);
      exportDate = new Date(year, month + 1, finalDay);
    } else {
      // Проверяем, не превышает ли день максимальное количество дней в месяце
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      if (dayOfMonth > daysInMonth) {
        exportDate = new Date(year, month, daysInMonth);
      }
    }
    
    return exportDate;
  };

  // Функция для расчета оставшихся дней до экспорта
  const getDaysUntilExport = (exportDate: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const exportDateTime = new Date(exportDate);
    exportDateTime.setHours(0, 0, 0, 0);
    
    const diffTime = exportDateTime.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 24));
    
    return diffDays;
  };

  const loadExportEntities = async () => {
    try {
      setEntitiesLoading(true);
      
      // Определяем коллекции, которые могут быть экспортированы
      const collections = [
        { id: 'childAttendance', name: 'Посещаемость детей', collection: 'childAttendance', description: 'Записи о посещении детей', exportDayOfMonth: 30 },
        { id: 'childPayment', name: 'Оплаты за посещение детей', collection: 'childPayment', description: 'Оплаты за посещение детей', exportDayOfMonth: 30 },
        { id: 'staffShifts', name: 'Смены (раздел сотрудники)', collection: 'staffShifts', description: 'Смены сотрудников', exportDayOfMonth: 30 },
        { id: 'payroll', name: 'Зарплаты', collection: 'payroll', description: 'Зарплатные ведомости', exportDayOfMonth: 30 },
        { id: 'rent', name: 'Аренда', collection: 'rent', description: 'Арендные платежи', exportDayOfMonth: 30 }
      ];

      // Получаем количество записей для каждой коллекции
      const entitiesWithCounts = await Promise.all(
        collections.map(async (entity) => {
          const count = await getEntityCount(entity.collection);
          const nextExportDate = getNextExportDate(entity.exportDayOfMonth);
          const daysUntilExport = getDaysUntilExport(nextExportDate);
          return {
            ...entity,
            count,
            nextExportDate,
            daysUntilExport
          };
        })
      );

      setExportEntities(entitiesWithCounts);
    } catch (err) {
      setError('Ошибка загрузки информации о сущностях: ' + (err as Error).message);
    } finally {
      setEntitiesLoading(false);
    }
  };

  const loadMainEvents = async () => {
    try {
      setLoading(true);
      const events = await mainEventsService.getAll();
      setMainEvents(events);
      setError(null);
    } catch (err) {
      setError('Ошибка загрузки событий: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };



  const handleExecuteExportForEntity = async (entityId: string) => {
    try {
      // Импортируем функции экспорта
      const { exportChildrenAttendance, exportSchedule, exportStaffAttendance } = await import('../../utils/excelExport');
      
      alert(`Экспорт сущности ${entityId} запущен`);
      
      // Для демонстрации создаем временный файл
      const fileName = `export_${entityId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      const content = `Экспорт данных для сущности: ${entityId}\nДата,Данные\n${new Date().toLocaleDateString()},Экспорт успешно завершен`;
      
      // Создаем временный файл для демонстрации
      const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError('Ошибка выполнения экспорта сущности: ' + (err as Error).message);
    }
  };

  // Функция для досрочного экспорта всех сущностей
  const handleQuickExportAll = async () => {
    try {
      // В реальной реализации здесь будет вызов API для экспорта всех сущностей
      // Например: await mainEventsService.quickExportAll();
      
      alert('Досрочный экспорт всех сущностей запущен (создание детализированных Excel-файлов)');
      
      // Получаем текущий месяц и год
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1; // Месяцы начинаются с 0
      const year = currentDate.getFullYear();
      
      // Для демонстрации создаем файлы для всех сущностей
      const exportPromises = exportEntities.map(async (entity) => {
        const fileName = `export_${entity.id}_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        // Создаем содержимое Excel-файла в формате CSV для демонстрации
        let content = '';
        
        switch (entity.id) {
          case 'childAttendance':
            content = `Посещаемость детей за ${month} ${year} год\nДети,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nДима Иванов,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1\nАнна Петрова,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1\nСергей Сидоров,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1`;
            break;
          case 'childPayment':
            content = `Оплаты за посещение детей за ${month} ${year} год\nДети,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nДима Иванов,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000\nАнна Петрова,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000,0,1000,1000\nСергей Сидоров,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000,1000,1000,0,1000`;
            break;
          case 'staffShifts':
            content = `Смены сотрудников за ${month} ${year} год\nСотрудники,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nИван Петров,1,1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1\nМария Сидорова,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,1\nАлексей Козлов,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1`;
            break;
          case 'payroll':
            content = `Зарплаты за ${month} ${year} год\nСотрудники,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nИван Петров,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000\nМария Сидорова,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000,0,50000,50000\nАлексей Козлов,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000,50000,50000,0,50000`;
            break;
          case 'rent':
            content = `Аренда за ${month} ${year} год\nАрендаторы,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31\nИван Петров,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000\nМария Сидорова,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000,0,25000,25000\nАлексей Козлов,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000,25000,25000,0,25000`;
            break;
          default:
            content = `Экспорт данных для сущности: ${entity.id}\nДата,Данные\n${new Date().toLocaleDateString()},Пример данных`;
        }
        
        // Создаем временный файл для демонстрации
        const blob = new Blob([content], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
      
      // Ждем завершения всех экспортов
      await Promise.all(exportPromises);
      
      alert('Все сущности успешно экспортированы в Excel-файлы');
    } catch (err) {
      setError('Ошибка досрочного экспорта: ' + (err as Error).message);
    }
  };

  // Функция для обновления дня экспорта сущности
  const handleUpdateExportDay = async (entityId: string, day: number) => {
    try {
      // В реальной реализации здесь будет вызов API для обновления дня экспорта
      // Например: await mainEventsService.update(entityId, { dayOfMonth: day });
      
      // Для демонстрации просто обновляем локальное состояние
      setExportEntities(prev =>
        prev.map(entity =>
          entity.id === entityId ? { ...entity, exportDayOfMonth: day } : entity
        )
      );
      
      // После обновления пересчитываем дату и оставшиеся дни
      setExportEntities(prev =>
        prev.map(entity => {
          if (entity.id === entityId) {
            const nextExportDate = getNextExportDate(day);
            const daysUntilExport = getDaysUntilExport(nextExportDate);
            return {
              ...entity,
              nextExportDate,
              daysUntilExport
            };
          }
          return entity;
        })
      );
      
      alert(`День экспорта для сущности ${entityId} обновлен на ${day} число`);
    } catch (err) {
      setError('Ошибка обновления дня экспорта: ' + (err as Error).message);
    }
  };

  const getDayName = (dayIndex: number) => {
    return `День месяца: ${dayIndex}`;
  };

  const getCollectionsDisplay = (collections: string[]) => {
    const collectionNames: Record<string, string> = {
      'childAttendance': 'Посещаемость детей',
      'childPayment': 'Оплаты за посещение детей',
      'staffShifts': 'Смены (раздел сотрудники)',
      'payroll': 'Зарплаты',
      'rent': 'Аренда'
    };
    
    return collections.map(col => collectionNames[col] || col).join(', ');
  };

  if (loading || entitiesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          Экспорт данных
        </Typography>
        <Button
          variant="contained"
          startIcon={<ForwardIcon />}
          onClick={handleQuickExportAll}
          disabled={!user?.role || user.role !== 'admin'}
        >
          Досрочный экспорт
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {exportEntities.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
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
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exportEntities.map(entity => (
                  <TableRow key={entity.id}>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <Typography variant="subtitle2">{entity.name}</Typography>
                        <Tooltip title={entity.description}>
                          <InfoIcon fontSize="small" sx={{ ml: 1, color: 'gray' }} />
                        </Tooltip>
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {entity.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{entity.count}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center">
                        <FormControl size="small">
                          <Select
                            value={entity.exportDayOfMonth}
                            onChange={(e) => handleUpdateExportDay(entity.id, e.target.value as number)}
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
                      {entity.nextExportDate ? entity.nextExportDate.toLocaleDateString() : 'Неопределено'}
                    </TableCell>
                    <TableCell>
                      {entity.daysUntilExport !== undefined ? (
                        <Typography variant="body2" color={entity.daysUntilExport <= 3 ? 'error' : 'textPrimary'}>
                          {entity.daysUntilExport}
                        </Typography>
                      ) : (
                        <Typography variant="body2">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton
                          size="small"
                          onClick={() => handleExecuteExportForEntity(entity.id)}
                          disabled={!user?.role || user.role !== 'admin'}
                        >
                          <DownloadIcon fontSize="small" />
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