import React, { useState, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody, TableRow, TableCell,
  TableContainer, Paper, CircularProgress, Alert, TextField, Button,
  Select, MenuItem, FormControl, InputLabel, Card, CardContent, Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import accountingApi, { IAccountReport } from '../services/accountingApi';

import { getErrorMessage } from '../../../shared/utils/errorUtils';

const ACCOUNTS = [
  { code: '20', name: 'Основное производство' },
  { code: '26', name: 'Общехозяйственные расходы' },
  { code: '50', name: 'Касса' },
  { code: '51', name: 'Расчётные счета' },
  { code: '60', name: 'Поставщики' },
  { code: '62', name: 'Покупатели (родители)' },
  { code: '68', name: 'Налоги (ИПН)' },
  { code: '69', name: 'Соц. отчисления' },
  { code: '70', name: 'Оплата труда' },
  { code: '90', name: 'Доходы/расходы' },
];

interface Props {
  initialAccount?: string;
}

const AccountCardTab: React.FC<Props> = ({ initialAccount }) => {
  const [accountCode, setAccountCode] = useState(initialAccount || '51');
  const [data, setData] = useState<IAccountReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);

  const fetchData = useCallback(async () => {
    if (!accountCode) return;
    setLoading(true);
    setError('');
    try {
      const result = await accountingApi.getAccountCard(accountCode, from, to);
      setData(result);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [accountCode, from, to]);

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('ru-RU');
  const fmt = (n: number) => n.toLocaleString('ru-RU');

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 250 }}>
          <InputLabel>Счёт</InputLabel>
          <Select value={accountCode} label="Счёт" onChange={e => setAccountCode(e.target.value)}>
            {ACCOUNTS.map(acc => (
              <MenuItem key={acc.code} value={acc.code}>{acc.code} — {acc.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
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
        <Button variant="contained" startIcon={<SearchIcon />} onClick={fetchData} disabled={loading}>
          Показать
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {data && !loading && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Card variant="outlined" sx={{ minWidth: 200 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Счёт</Typography>
                <Typography variant="h6">{data.account.code} — {data.account.name}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 150 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Оборот Дт</Typography>
                <Typography variant="h6" color="primary">{fmt(data.turnover.debit)}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 150 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Оборот Кт</Typography>
                <Typography variant="h6" color="error">{fmt(data.turnover.credit)}</Typography>
              </CardContent>
            </Card>
            <Card variant="outlined" sx={{ minWidth: 150 }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="caption" color="text.secondary">Сальдо</Typography>
                <Typography variant="h6" fontWeight={700}>{fmt(data.balance)}</Typography>
              </CardContent>
            </Card>
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Документ</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Корр. счёт</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Дебет</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>Кредит</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Описание</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.entries.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Нет проводок за выбранный период</TableCell>
                  </TableRow>
                )}
                {data.entries.map((entry, idx) => {
                  const corrAccount = entry.isDebit ? entry.creditAccount : entry.debitAccount;
                  return (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(entry.date)}</TableCell>
                      <TableCell>{entry.documentNumber || '—'}</TableCell>
                      <TableCell>
                        <Chip label={corrAccount} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell align="right" sx={{ color: entry.isDebit ? '#1976d2' : undefined }}>
                        {entry.isDebit ? fmt(entry.amount) : ''}
                      </TableCell>
                      <TableCell align="right" sx={{ color: entry.isCredit ? '#d32f2f' : undefined }}>
                        {entry.isCredit ? fmt(entry.amount) : ''}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.description}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
};

export default AccountCardTab;
