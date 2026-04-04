import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, CircularProgress, Alert, TextField, Button,
  Chip, Select, MenuItem, FormControl, InputLabel, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import UndoIcon from '@mui/icons-material/Undo';
import accountingApi, { IAccountingDocument } from '../services/accountingApi';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import { showSnackbar } from '../../../shared/components/Snackbar';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';

const TYPE_LABELS: Record<string, string> = {
  child_payment: 'Оплата родителя',
  salary_accrual: 'Начисление ЗП',
  salary_payment: 'Выплата ЗП',
  rent_payment: 'Оплата аренды',
  manual: 'Ручной',
  reversal: 'Сторно',
};

const STATUS_COLORS: Record<string, 'success' | 'default' | 'error'> = {
  draft: 'default',
  posted: 'success',
  reversed: 'error',
};

const DocumentsTab: React.FC = () => {
  const [docs, setDocs] = useState<IAccountingDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reverseDialogOpen, setReverseDialogOpen] = useState(false);
  const [reverseDocId, setReverseDocId] = useState('');
  const [reverseReason, setReverseReason] = useState('');
  const [reversing, setReversing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: Record<string, string> = {};
      if (typeFilter) filters.type = typeFilter;
      if (statusFilter) filters.status = statusFilter;
      const result = await accountingApi.getDocuments(filters);
      setDocs(result);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');
  const fmt = (n: number) => n.toLocaleString('ru-RU');

  const handleReverse = async () => {
    if (!reverseDocId || !reverseReason.trim()) return;
    setReversing(true);
    try {
      await accountingApi.reverseDocument(reverseDocId, reverseReason);
      showSnackbar({ message: 'Документ успешно сторнирован', type: 'success' });
      setReverseDialogOpen(false);
      setReverseReason('');
      fetchData();
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setReversing(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Тип</InputLabel>
          <Select value={typeFilter} label="Тип" onChange={e => setTypeFilter(e.target.value)}>
            <MenuItem value="">Все типы</MenuItem>
            {Object.entries(TYPE_LABELS).map(([k, v]) => (
              <MenuItem key={k} value={k}>{v}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Статус</InputLabel>
          <Select value={statusFilter} label="Статус" onChange={e => setStatusFilter(e.target.value)}>
            <MenuItem value="">Все</MenuItem>
            <MenuItem value="posted">Проведён</MenuItem>
            <MenuItem value="reversed">Сторнирован</MenuItem>
            <MenuItem value="draft">Черновик</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          Обновить
        </Button>
        <Typography variant="body2" color="text.secondary">
          Документов: {docs.length}
        </Typography>
      </Box>

      <FormErrorAlert error={error} />
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {!loading && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Номер</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Описание</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Дебет</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Кредит</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Источник</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">Нет документов</TableCell>
                </TableRow>
              )}
              {docs.map(doc => (
                <TableRow key={doc._id} hover>
                  <TableCell><strong>{doc.number}</strong></TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(doc.date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={TYPE_LABELS[doc.type] || doc.type}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.status === 'posted' ? 'Проведён' : doc.status === 'reversed' ? 'Сторно' : 'Черновик'}
                      size="small"
                      color={STATUS_COLORS[doc.status]}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.description}
                  </TableCell>
                  <TableCell align="right">{fmt(doc.totalDebit)}</TableCell>
                  <TableCell align="right">{fmt(doc.totalCredit)}</TableCell>
                  <TableCell>
                    {doc.sourceEntity && (
                      <Chip label={doc.sourceEntity} size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    {doc.status === 'posted' && (
                      <Tooltip title="Сторно">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setReverseDocId(doc._id);
                            setReverseDialogOpen(true);
                          }}
                        >
                          <UndoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={reverseDialogOpen} onClose={() => setReverseDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Сторно документа</DialogTitle>
        <DialogContent>
          <TextField
            label="Причина сторно"
            fullWidth
            multiline
            rows={3}
            value={reverseReason}
            onChange={e => setReverseReason(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReverseDialogOpen(false)}>Отмена</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReverse}
            disabled={reversing || !reverseReason.trim()}
          >
            {reversing ? 'Сторнирование...' : 'Сторнировать'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DocumentsTab;
