import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, CircularProgress, Alert, TextField, Button,
  Chip, Select, MenuItem, FormControl, InputLabel
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import accountingApi, { IPosting } from '../services/accountingApi';
import { getErrorMessage } from '../../../shared/utils/errorUtils';

const ACCOUNT_NAMES: Record<string, string> = {
  '20': 'Осн. производство',
  '26': 'Общехоз. расходы',
  '50': 'Касса',
  '51': 'Расч. счета',
  '60': 'Поставщики',
  '62': 'Покупатели',
  '68': 'Налоги (ИПН)',
  '69': 'Соц. отчисл.',
  '70': 'Оплата труда',
  '90': 'Доходы/расходы',
};

const PostingsJournalTab: React.FC = () => {
  const [postings, setPostings] = useState<IPosting[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [accountFilter, setAccountFilter] = useState('');

  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: Record<string, string> = { from, to };
      if (accountFilter) filters.accountCode = accountFilter;
      const result = await accountingApi.getPostings(filters);
      setPostings(result);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [from, to, accountFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmtDate = useCallback((d: string) => new Date(d).toLocaleDateString('ru-RU'), []);
  const fmt = useCallback((n: number) => n.toLocaleString('ru-RU'), []);
  const accLabel = useCallback((code: string) => ACCOUNT_NAMES[code] || code, []);

  const totalDebit = useMemo(() => postings.reduce((s, p) => s + p.amount, 0), [postings]);
  const accountOptions = useMemo(() => Object.entries(ACCOUNT_NAMES), []);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <TextField
          label="С" type="date" size="small" value={from}
          onChange={e => setFrom(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="По" type="date" size="small" value={to}
          onChange={e => setTo(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Фильтр по счёту</InputLabel>
          <Select value={accountFilter} label="Фильтр по счёту" onChange={e => setAccountFilter(e.target.value)}>
            <MenuItem value="">Все счета</MenuItem>
            {accountOptions.map(([code, name]) => (
              <MenuItem key={code} value={code}>{code} — {name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          Обновить
        </Button>
        <Typography variant="body2" color="text.secondary">
          Найдено: {postings.length} | Сумма: {fmt(totalDebit)} тг
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {!loading && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Документ</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Дебет</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Кредит</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Сумма</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Описание</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Sync</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {postings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">Нет проводок за выбранный период</TableCell>
                </TableRow>
              )}
              {postings.map(p => (
                <TableRow key={p._id} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(p.date)}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {p.documentId?.number || '—'}
                    {p.documentId?.status === 'reversed' && (
                      <Chip label="СТОРНО" size="small" color="error" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={`${p.debitAccountCode} ${accLabel(p.debitAccountCode)}`} size="small" variant="outlined" color="info" />
                  </TableCell>
                  <TableCell>
                    <Chip label={`${p.creditAccountCode} ${accLabel(p.creditAccountCode)}`} size="small" variant="outlined" color="warning" />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>{fmt(p.amount)}</TableCell>
                  <TableCell sx={{ maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.description}
                  </TableCell>
                  <TableCell>
                    {p.syncedToSupabase
                      ? <Chip label="OK" size="small" color="success" />
                      : <Chip label="Ожидает" size="small" color="default" />
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PostingsJournalTab;
