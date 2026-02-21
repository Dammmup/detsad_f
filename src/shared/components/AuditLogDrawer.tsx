import React, { useState, useEffect, useCallback } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  Chip,
  Divider,
  SelectChangeEvent,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import auditLogApi, { AuditLogEntry, AuditLogResponse } from '../services/auditLog';

interface AuditLogDrawerProps {
  open: boolean;
  onClose: () => void;
  entityType: string;
  entityId?: string;
  entityName?: string;
}

const ACTION_LABELS: Record<string, string> = {
  create: 'Создание',
  update: 'Изменение',
  delete: 'Удаление',
  generate: 'Генерация',
  import: 'Импорт',
  bulk_update: 'Массовое обновление',
  status_change: 'Смена статуса',
};

const ACTION_COLORS: Record<string, 'success' | 'info' | 'error' | 'warning' | 'default'> = {
  create: 'success',
  update: 'info',
  delete: 'error',
  generate: 'warning',
  import: 'default',
  bulk_update: 'warning',
  status_change: 'info',
};

const getActionIcon = (action: string) => {
  switch (action) {
    case 'create': return <AddCircleOutlineIcon color="success" />;
    case 'update': return <EditIcon color="info" />;
    case 'delete': return <DeleteIcon color="error" />;
    case 'generate': return <AutorenewIcon color="warning" />;
    case 'status_change': return <SwapHorizIcon color="info" />;
    case 'bulk_update': return <ListAltIcon color="warning" />;
    default: return <EditIcon />;
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const AuditLogDrawer: React.FC<AuditLogDrawerProps> = ({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
}) => {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const params = {
        page,
        limit: 30,
        action: actionFilter || undefined,
      };

      let result: AuditLogResponse;
      if (entityId) {
        result = await auditLogApi.getByEntity(entityType, entityId, params);
      } else {
        result = await auditLogApi.getByEntityType(entityType, params);
      }
      setData(result);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [open, entityType, entityId, page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (open) {
      setPage(1);
      setActionFilter('');
      setExpandedItems(new Set());
    }
  }, [open, entityType, entityId]);

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const renderChanges = (changes: AuditLogEntry['changes']) => {
    if (!changes || changes.length === 0) return null;
    return (
      <Box sx={{ pl: 2, pt: 0.5 }}>
        {changes.map((change, i) => (
          <Typography key={i} variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem', mb: 0.5 }}>
            <strong>{change.field}</strong>:{' '}
            <span style={{ textDecoration: 'line-through', color: '#d32f2f' }}>
              {String(change.oldValue ?? '—')}
            </span>
            {' → '}
            <span style={{ color: '#2e7d32' }}>
              {String(change.newValue ?? '—')}
            </span>
          </Typography>
        ))}
      </Box>
    );
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 500 }, p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            История изменений
            {entityName && (
              <Typography variant="body2" color="text.secondary">
                {entityName}
              </Typography>
            )}
          </Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Box>

        <FormControl size="small" sx={{ mb: 2, minWidth: 200 }}>
          <InputLabel>Действие</InputLabel>
          <Select
            value={actionFilter}
            label="Действие"
            onChange={(e: SelectChangeEvent) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="">Все</MenuItem>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <MenuItem key={key} value={key}>{label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !data || data.items.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Записей не найдено
            </Typography>
          ) : (
            <List dense>
              {data.items.map((entry) => {
                const hasChanges = entry.changes && entry.changes.length > 0;
                const isExpanded = expandedItems.has(entry._id);

                return (
                  <React.Fragment key={entry._id}>
                    <ListItem
                      alignItems="flex-start"
                      sx={{ cursor: hasChanges ? 'pointer' : 'default', py: 1 }}
                      onClick={() => hasChanges && toggleExpand(entry._id)}
                    >
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        {getActionIcon(entry.action)}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={ACTION_LABELS[entry.action] || entry.action}
                              size="small"
                              color={ACTION_COLORS[entry.action] || 'default'}
                              variant="outlined"
                            />
                            <Typography variant="body2" component="span" fontWeight={500}>
                              {entry.userFullName}
                            </Typography>
                            {hasChanges && (
                              isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box>
                            {entry.entityName && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                {entry.entityName}
                              </Typography>
                            )}
                            {entry.details && (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                {entry.details}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled">
                              {formatDate(entry.createdAt)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {hasChanges && (
                      <Collapse in={isExpanded}>
                        {renderChanges(entry.changes)}
                      </Collapse>
                    )}
                    <Divider component="li" />
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Box>

        {data && data.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
            <Pagination
              count={data.totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              size="small"
            />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default AuditLogDrawer;
