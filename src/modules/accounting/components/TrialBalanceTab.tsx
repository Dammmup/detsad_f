import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, CircularProgress, Alert, TextField, Button, Chip
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import accountingApi, { ITrialBalanceRow, ITrialBalanceResponse } from '../services/accountingApi';

interface Props {
  onSelectAccount?: (code: string) => void;
}

const TrialBalanceTab: React.FC<Props> = ({ onSelectAccount }) => {
  const [data, setData] = useState<ITrialBalanceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-01-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await accountingApi.getTrialBalance(from, to);
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fmt = (n: number) => n.toLocaleString('ru-RU', { minimumFractionDigits: 0 });

  const isBalanced = data ? data.totals.debit === data.totals.credit : true;

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
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchData} disabled={loading}>
          Обновить
        </Button>
        {data && (
          <Chip
            label={isBalanced ? 'Баланс сходится' : 'БАЛАНС НЕ СХОДИТСЯ'}
            color={isBalanced ? 'success' : 'error'}
            variant="filled"
          />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {data && !loading && (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Код</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Наименование</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Сальдо нач.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Оборот Дт</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Оборот Кт</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>Сальдо кон.</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">Нет данных за выбранный период</TableCell>
                </TableRow>
              )}
              {data.rows.map(row => (
                <TableRow
                  key={row.code}
                  hover
                  sx={{ cursor: onSelectAccount ? 'pointer' : 'default' }}
                  onClick={() => onSelectAccount?.(row.code)}
                >
                  <TableCell><strong>{row.code}</strong></TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.type === 'active' ? 'А' : row.type === 'passive' ? 'П' : 'АП'}
                      size="small"
                      color={row.type === 'active' ? 'info' : row.type === 'passive' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">{fmt(row.openingBalance)}</TableCell>
                  <TableCell align="right" sx={{ color: row.debitTurnover > 0 ? '#1976d2' : 'inherit' }}>
                    {fmt(row.debitTurnover)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: row.creditTurnover > 0 ? '#d32f2f' : 'inherit' }}>
                    {fmt(row.creditTurnover)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{fmt(row.closingBalance)}</TableCell>
                </TableRow>
              ))}
              {data.rows.length > 0 && (
                <TableRow sx={{ bgcolor: '#e3f2fd' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 700 }}>ИТОГО</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(data.totals.debit)}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>{fmt(data.totals.credit)}</TableCell>
                  <TableCell />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default TrialBalanceTab;
