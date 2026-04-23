import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Clear as ClearIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  AuditLogFilters,
  AuditLogItem,
  AuditLogMeta,
  getAuditLogMeta,
  getAuditLogs,
} from '../services/auditLog';

const ACTION_LABELS: Record<string, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  generate: 'Генерация',
  import: 'Импорт',
  bulk_update: 'Массовое изменение',
  status_change: 'Смена статуса',
};

const ACTION_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
  create: 'success',
  update: 'primary',
  delete: 'error',
  generate: 'secondary',
  import: 'info',
  bulk_update: 'warning',
  status_change: 'warning',
};

const ENTITY_LABELS: Record<string, string> = {
  staffAttendance: 'Посещаемость сотрудника',
  staffShift: 'Смена сотрудника',
  childAttendance: 'Посещаемость ребенка',
  childPayment: 'Оплата ребенка',
  child: 'Ребенок',
  children: 'Ребенок',
  group: 'Группа',
  groups: 'Группа',
  user: 'Пользователь',
  users: 'Пользователь',
  staff: 'Сотрудник',
  payroll: 'Зарплата',
  rent: 'Аренда',
  document: 'Документ',
  documents: 'Документ',
  task: 'Задача',
  taskList: 'Задача',
  dish: 'Блюдо',
  foodDish: 'Блюдо',
  calendarEvent: 'Событие календаря',
  mainEvent: 'Главное событие',
  cyclogram: 'Циклограмма',
  dailySchedule: 'Расписание дня',
  externalSpecialist: 'Внешний специалист',
};

const FIELD_LABELS: Record<string, string> = {
  status: 'Статус',
  actualStart: 'Фактическое время прихода',
  actualEnd: 'Фактическое время ухода',
  startTime: 'Время начала',
  endTime: 'Время окончания',
  date: 'Дата',
  attendanceDate: 'Дата посещения',
  isPresent: 'Присутствие',
  present: 'Присутствие',
  absent: 'Отсутствие',
  reason: 'Причина',
  comment: 'Комментарий',
  notes: 'Заметки',
  fullName: 'ФИО',
  firstName: 'Имя',
  lastName: 'Фамилия',
  middleName: 'Отчество',
  name: 'Название',
  title: 'Название',
  group: 'Группа',
  groupId: 'Группа',
  staffId: 'Сотрудник',
  childId: 'Ребенок',
  userId: 'Пользователь',
  amount: 'Сумма',
  total: 'Итого',
  paid: 'Оплачено',
  paymentDate: 'Дата оплаты',
  phone: 'Телефон',
  email: 'Email',
  role: 'Роль',
  isActive: 'Активен',
  salary: 'Оклад',
  baseSalary: 'Базовая зарплата',
  penalties: 'Штрафы',
  bonuses: 'Премии',
};

const VALUE_LABELS: Record<string, string> = {
  active: 'Активно',
  completed: 'Завершено',
  late: 'Опоздание',
  absent: 'Отсутствует',
  present: 'Присутствует',
  true: 'Да',
  false: 'Нет',
  admin: 'Администратор',
  manager: 'Менеджер',
  director: 'Директор',
  teacher: 'Воспитатель',
  assistant: 'Помощник воспитателя',
  staff: 'Сотрудник',
  nurse: 'Медсестра',
  doctor: 'Врач',
  cook: 'Повар',
};

const DEFAULT_FILTERS: AuditLogFilters = {
  entityType: '',
  entityId: '',
  userId: '',
  action: '',
  startDate: '',
  endDate: '',
  search: '',
  page: 1,
  limit: 25,
};

const formatDateTime = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatValue = (value: unknown, field?: string) => {
  if (value === null || value === undefined || value === '') return 'не указано';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') {
    if (VALUE_LABELS[value]) return VALUE_LABELS[value];
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatDateTime(value);
    if ((field || '').toLowerCase().includes('date') && /^\d{4}-\d{2}-\d{2}/.test(value)) return formatDateOnly(value);
    return value;
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

const getEntityTypeLabel = (entityType?: string) => {
  if (!entityType) return 'Сущность';
  return ENTITY_LABELS[entityType] || entityType;
};

const getFieldLabel = (field?: string) => {
  if (!field) return 'Поле';
  return FIELD_LABELS[field] || field.replace(/([A-Z])/g, ' $1').trim();
};

const normalizeDetails = (details?: string) => {
  if (!details) return '';
  return details
    .replace(/\bundefined\b/g, 'не указано')
    .replace(/\bnull\b/g, 'не указано')
    .replace(/Изменено:\s*/i, '')
    .trim();
};

const toApiDate = (value?: string) => {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const getEntityLabel = (log: AuditLogItem) => {
  const entityName = log.entityName?.trim();
  const entityType = getEntityTypeLabel(log.entityType);
  if (entityName) return `${entityType}: ${entityName}`;
  return entityType;
};

const buildAuditSummary = (log: AuditLogItem) => {
  const entity = getEntityLabel(log);
  const action = ACTION_LABELS[log.action] || log.action;
  const details = normalizeDetails(log.details);

  if (log.action === 'create') return `Создано: ${entity}`;
  if (log.action === 'delete') return `Удалено: ${entity}`;
  if (log.action === 'bulk_update') return details.split('\n')[0] || `Массово изменено: ${entity}`;

  const readableChanges = (log.changes || [])
    .filter((change) => change.oldValue !== undefined || change.newValue !== undefined)
    .slice(0, 3)
    .map((change) => `${getFieldLabel(change.field)}: ${formatValue(change.oldValue, change.field)} → ${formatValue(change.newValue, change.field)}`);

  if (readableChanges.length) return `${action}: ${entity}. ${readableChanges.join('; ')}`;
  return details || `${action}: ${entity}`;
};

const AuditLogPage: React.FC = () => {
  const [filters, setFilters] = useState<AuditLogFilters>(DEFAULT_FILTERS);
  const [meta, setMeta] = useState<AuditLogMeta>({ entityTypes: [], actions: [], users: [] });
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const data = await getAuditLogMeta();
      setMeta(data);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить фильтры аудита');
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getAuditLogs({
        ...filters,
        startDate: toApiDate(filters.startDate),
        endDate: toApiDate(filters.endDate),
      });
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setExpandedId(null);
    } catch (err: any) {
      setError(err?.message || 'Не удалось загрузить аудит');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const activeFiltersCount = useMemo(() => {
    return ['entityType', 'entityId', 'userId', 'action', 'startDate', 'endDate', 'search'].filter((key) => {
      const value = filters[key as keyof AuditLogFilters];
      return value !== undefined && value !== null && value !== '';
    }).length;
  }, [filters]);

  const updateFilter = (name: keyof AuditLogFilters, value: string | number) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
      page: name === 'page' ? Number(value) : 1,
    }));
  };

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1500, mx: 'auto' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} spacing={2} sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
            Аудит
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Последние действия на платформе, кто и что изменил, создал или удалил.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
          <Chip label={`${total} записей`} color="primary" variant="outlined" />
          <Chip label={`${activeFiltersCount} фильтров`} variant={activeFiltersCount ? 'filled' : 'outlined'} />
          <Tooltip title="Обновить">
            <span>
              <IconButton onClick={loadLogs} disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} alignItems={{ xs: 'stretch', lg: 'center' }} flexWrap="wrap">
          <TextField
            label="Поиск"
            size="small"
            value={filters.search || ''}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Имя, сущность, действие, ID"
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Сущность</InputLabel>
            <Select
              label="Сущность"
              value={filters.entityType || ''}
              onChange={(event) => updateFilter('entityType', event.target.value)}
              disabled={metaLoading}
            >
              <MenuItem value="">Все сущности</MenuItem>
              {meta.entityTypes.map((entityType) => (
                <MenuItem value={entityType} key={entityType}>
                  {getEntityTypeLabel(entityType)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="ID сущности"
            size="small"
            value={filters.entityId || ''}
            onChange={(event) => updateFilter('entityId', event.target.value)}
            sx={{ minWidth: { xs: '100%', sm: 180 } }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 210 } }}>
            <InputLabel>Пользователь</InputLabel>
            <Select
              label="Пользователь"
              value={filters.userId || ''}
              onChange={(event) => updateFilter('userId', event.target.value)}
              disabled={metaLoading}
            >
              <MenuItem value="">Все пользователи</MenuItem>
              {meta.users.map((user) => (
                <MenuItem value={user.userId} key={user.userId}>
                  {user.userFullName}{user.userRole ? ` · ${user.userRole}` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 180 } }}>
            <InputLabel>Действие</InputLabel>
            <Select
              label="Действие"
              value={filters.action || ''}
              onChange={(event) => updateFilter('action', event.target.value)}
              disabled={metaLoading}
            >
              <MenuItem value="">Все действия</MenuItem>
              {meta.actions.map((action) => (
                <MenuItem value={action} key={action}>
                  {ACTION_LABELS[action] || action}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="С"
            type="datetime-local"
            size="small"
            value={filters.startDate || ''}
            onChange={(event) => updateFilter('startDate', event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          />

          <TextField
            label="По"
            type="datetime-local"
            size="small"
            value={filters.endDate || ''}
            onChange={(event) => updateFilter('endDate', event.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: { xs: '100%', sm: 200 } }}
          />

          <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
            <InputLabel>На странице</InputLabel>
            <Select
              label="На странице"
              value={String(filters.limit || 25)}
              onChange={(event) => updateFilter('limit', Number(event.target.value))}
            >
              {[10, 25, 50, 100].map((limit) => (
                <MenuItem value={limit} key={limit}>
                  {limit}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button startIcon={<ClearIcon />} onClick={resetFilters} disabled={!activeFiltersCount}>
            Сбросить
          </Button>
        </Stack>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={52} />
              <TableCell width={170}>Время</TableCell>
              <TableCell width={170}>Действие</TableCell>
              <TableCell width={220}>Пользователь</TableCell>
              <TableCell width={260}>Раздел</TableCell>
              <TableCell>Что произошло</TableCell>
              <TableCell width={120} align="right">Изменения</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">Записей аудита по выбранным условиям нет</Typography>
                </TableCell>
              </TableRow>
            ) : (
              items.map((log, index) => {
                const rowId = log._id || `${log.entityType}-${log.entityId}-${log.createdAt}-${index}`;
                const isExpanded = expandedId === rowId;
                const displayChanges = (log.changes || []).filter(
                  (change) => change.oldValue !== undefined || change.newValue !== undefined,
                );
                const changesCount = displayChanges.length;
                const summary = buildAuditSummary(log);

                return (
                  <React.Fragment key={rowId}>
                    <TableRow hover>
                      <TableCell>
                        <Tooltip title={isExpanded ? 'Скрыть детали' : 'Показать детали'}>
                          <IconButton size="small" onClick={() => setExpandedId(isExpanded ? null : rowId)}>
                            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{formatDateTime(log.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={ACTION_LABELS[log.action] || log.action}
                          color={ACTION_COLORS[log.action] || 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {log.userFullName || '—'}
                        </Typography>
                        {log.userRole && (
                          <Typography variant="caption" color="text.secondary">
                            {log.userRole}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {getEntityLabel(log)}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 360 }}>
                        <Typography variant="body2" noWrap title={summary}>
                          {summary}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip size="small" label={changesCount} variant={changesCount ? 'filled' : 'outlined'} />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? undefined : 0 }}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Stack spacing={1.5}>
                              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                                <Box sx={{ minWidth: 220 }}>
                                  <Typography variant="caption" color="text.secondary">Пользователь ID</Typography>
                                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{log.userId || '—'}</Typography>
                                </Box>
                                <Box sx={{ minWidth: 220 }}>
                                  <Typography variant="caption" color="text.secondary">Сущность ID</Typography>
                                  <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{log.entityId || '—'}</Typography>
                                </Box>
                                <Box sx={{ minWidth: 220 }}>
                                  <Typography variant="caption" color="text.secondary">Полное время</Typography>
                                  <Typography variant="body2">{formatDateTime(log.createdAt)}</Typography>
                                </Box>
                              </Stack>

                              {log.details && (
                                <Box>
                                  <Typography variant="caption" color="text.secondary">Описание действия</Typography>
                                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{normalizeDetails(log.details)}</Typography>
                                </Box>
                              )}

                              <Divider />

                              <Typography variant="subtitle2">Что изменилось</Typography>
                              {changesCount ? (
                                <Table size="small">
                                  <TableHead>
                                    <TableRow>
                                      <TableCell width="25%">Показатель</TableCell>
                                      <TableCell>Было</TableCell>
                                      <TableCell>Стало</TableCell>
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {displayChanges.map((change, changeIndex) => (
                                      <TableRow key={`${change.field || 'field'}-${changeIndex}`}>
                                        <TableCell>{getFieldLabel(change.field)}</TableCell>
                                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                          {formatValue(change.oldValue, change.field)}
                                        </TableCell>
                                        <TableCell sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                          {formatValue(change.newValue, change.field)}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  Для этого действия список измененных полей не записан.
                                </Typography>
                              )}
                            </Stack>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" justifyContent="space-between" spacing={2} sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Страница {filters.page || 1} из {totalPages}
        </Typography>
        <Pagination
          count={totalPages}
          page={Number(filters.page || 1)}
          onChange={(_, page) => updateFilter('page', page)}
          color="primary"
          shape="rounded"
        />
      </Stack>
    </Box>
  );
};

export default AuditLogPage;
