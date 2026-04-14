import React, { useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Card, CardContent, Alert, CircularProgress,
  TextField, Divider, Chip, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SyncIcon from '@mui/icons-material/Sync';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import accountingApi, { ITrialBalanceResponse, ISyncStatus } from '../services/accountingApi';
import { getErrorMessage } from '../../../shared/utils/errorUtils';
import { showSnackbar } from '../../../shared/components/Snackbar';
import FormErrorAlert from '../../../shared/components/FormErrorAlert';
import { useAuth } from '../../../app/context/AuthContext';

interface CheckResult {
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

const ReconciliationTab: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role || '';
  const canManageAccounting = role === 'admin';
  const [results, setResults] = useState<CheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ISyncStatus | null>(null);
  const [syncing, setSyncing] = useState(false);

  const now = new Date();
  const [from, setFrom] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`);
  const [to, setTo] = useState(now.toISOString().split('T')[0]);

  const runChecks = useCallback(async () => {
    setLoading(true);
    setError('');
    const checks: CheckResult[] = [];

    try {
      // 1. Check trial balance
      const balance = await accountingApi.getTrialBalance(from, to);
      const isBalanced = balance.totals.debit === balance.totals.credit;
      checks.push({
        name: 'Баланс дебета и кредита',
        status: isBalanced ? 'ok' : 'error',
        message: isBalanced
          ? `Сходится: ${balance.totals.debit.toLocaleString('ru-RU')} тг`
          : `НЕ СХОДИТСЯ! Дт: ${balance.totals.debit.toLocaleString('ru-RU')}, Кт: ${balance.totals.credit.toLocaleString('ru-RU')}`,
        details: `Проверка: SUM(дебет) === SUM(кредит) по стандарту двойной записи`
      });

      // 2. Check active accounts have data
      const activeAccounts = balance.rows.filter(r => r.debitTurnover > 0 || r.creditTurnover > 0);
      checks.push({
        name: 'Активные счета',
        status: activeAccounts.length > 0 ? 'ok' : 'warning',
        message: activeAccounts.length > 0
          ? `${activeAccounts.length} счетов с движением за период`
          : 'Нет движений за период',
        details: activeAccounts.map(a => `${a.code} ${a.name}`).join(', ')
      });

      // 3. Check salary accounts (70)
      const salaryRow = balance.rows.find(r => r.code === '70');
      if (salaryRow) {
        const salaryBalance = salaryRow.closingBalance;
        checks.push({
          name: 'Счёт 70 (Оплата труда)',
          status: salaryBalance >= 0 ? 'ok' : 'warning',
          message: `Сальдо: ${salaryBalance.toLocaleString('ru-RU')} тг`,
          details: salaryBalance > 0
            ? 'Есть невыплаченная задолженность по зарплате'
            : salaryBalance === 0 ? 'Задолженности нет' : 'Переплата по зарплате'
        });
      }

      // 4. Check bank account (51)
      const bankRow = balance.rows.find(r => r.code === '51');
      if (bankRow) {
        checks.push({
          name: 'Счёт 51 (Расчётный счёт)',
          status: bankRow.closingBalance >= 0 ? 'ok' : 'error',
          message: `Сальдо: ${bankRow.closingBalance.toLocaleString('ru-RU')} тг`,
          details: bankRow.closingBalance < 0 ? 'ОТРИЦАТЕЛЬНЫЙ БАЛАНС на расчётном счёте!' : 'Баланс положительный'
        });
      }

      // 5. Check tax accounts (68, 69)
      const taxRow = balance.rows.find(r => r.code === '68');
      const socialRow = balance.rows.find(r => r.code === '69');
      const taxDebt = (taxRow?.closingBalance || 0) + (socialRow?.closingBalance || 0);
      checks.push({
        name: 'Задолженность по налогам и соц. отчислениям (68+69)',
        status: taxDebt > 0 ? 'warning' : 'ok',
        message: `Итого: ${taxDebt.toLocaleString('ru-RU')} тг`,
        details: `ИПН (68): ${(taxRow?.closingBalance || 0).toLocaleString('ru-RU')}, Соц. (69): ${(socialRow?.closingBalance || 0).toLocaleString('ru-RU')}`
      });

      // 6. Check customer debts (62)
      const customerRow = balance.rows.find(r => r.code === '62');
      if (customerRow) {
        checks.push({
          name: 'Счёт 62 (Расчёты с родителями)',
          status: customerRow.closingBalance !== 0 ? 'warning' : 'ok',
          message: `Сальдо: ${customerRow.closingBalance.toLocaleString('ru-RU')} тг`,
          details: customerRow.closingBalance > 0
            ? 'Есть дебиторская задолженность (родители должны)'
            : customerRow.closingBalance < 0
              ? 'Есть кредиторская задолженность (переплата родителей)'
              : 'Расчёты закрыты'
        });
      }

      // 7. Check documents consistency
      const docs = await accountingApi.getDocuments({});
      const postedDocs = docs.filter(d => d.status === 'posted');
      const reversedDocs = docs.filter(d => d.status === 'reversed');
      const debitCreditMismatch = docs.filter(d => d.totalDebit !== d.totalCredit);
      checks.push({
        name: 'Целостность документов',
        status: debitCreditMismatch.length === 0 ? 'ok' : 'error',
        message: debitCreditMismatch.length === 0
          ? `Всего: ${docs.length} (проведённых: ${postedDocs.length}, сторно: ${reversedDocs.length})`
          : `${debitCreditMismatch.length} документов с несовпадением дебета/кредита!`,
        details: debitCreditMismatch.length > 0
          ? debitCreditMismatch.map(d => d.number).join(', ')
          : undefined
      });

      // 8. Sync status
      try {
        const sync = await accountingApi.getSyncStatus();
        setSyncStatus(sync);
        checks.push({
          name: 'Синхронизация с Supabase',
          status: !sync.supabaseConfigured ? 'warning' : sync.unsyncedCount === 0 ? 'ok' : 'warning',
          message: !sync.supabaseConfigured
            ? 'Supabase не настроен'
            : sync.unsyncedCount === 0
              ? 'Все данные синхронизированы'
              : `${sync.unsyncedCount} записей ожидают синхронизации`,
          details: sync.lastSyncedAt
            ? `Последняя синхронизация: ${new Date(sync.lastSyncedAt).toLocaleString('ru-RU')}`
            : 'Синхронизация ещё не выполнялась'
        });
      } catch {
        checks.push({
          name: 'Синхронизация с Supabase',
          status: 'warning',
          message: 'Не удалось получить статус синхронизации'
        });
      }

      setResults(checks);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handleSync = async () => {
    if (!canManageAccounting) {
      showSnackbar({ message: 'Недостаточно прав для синхронизации', type: 'error' });
      return;
    }
    setSyncing(true);
    try {
      await accountingApi.triggerSync();
      showSnackbar({ message: 'Синхронизация успешно запущена', type: 'success' });
      // Refresh sync status after triggering
      const status = await accountingApi.getSyncStatus();
      setSyncStatus(status);
    } catch (err: any) {
      setError(getErrorMessage(err));
    } finally {
      setSyncing(false);
    }
  };

  const { okCount, warnCount, errCount } = useMemo(() => ({
    okCount: results.filter(r => r.status === 'ok').length,
    warnCount: results.filter(r => r.status === 'warning').length,
    errCount: results.filter(r => r.status === 'error').length,
  }), [results]);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
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
        <Button
          variant="contained"
          startIcon={<PlayArrowIcon />}
          onClick={runChecks}
          disabled={loading}
          size="large"
        >
          {loading ? 'Проверка...' : 'Запустить сверку'}
        </Button>
        {syncStatus?.supabaseConfigured && canManageAccounting && (
          <Button
            variant="outlined"
            startIcon={<SyncIcon />}
            onClick={handleSync}
            disabled={syncing}
          >
            {syncing ? 'Синхронизация...' : 'Синхронизировать'}
          </Button>
        )}
      </Box>

      <FormErrorAlert error={error} />
      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>}

      {results.length > 0 && !loading && (
        <>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            {okCount > 0 && <Chip label={`${okCount} OK`} color="success" />}
            {warnCount > 0 && <Chip label={`${warnCount} Предупреждений`} color="warning" />}
            {errCount > 0 && <Chip label={`${errCount} Ошибок`} color="error" />}
          </Box>

          <List disablePadding>
            {results.map((check, idx) => (
              <React.Fragment key={idx}>
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {check.status === 'ok' && <CheckCircleIcon color="success" />}
                    {check.status === 'warning' && <WarningIcon color="warning" />}
                    {check.status === 'error' && <ErrorIcon color="error" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle2">{check.name}</Typography>
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" component="span">{check.message}</Typography>
                        {check.details && (
                          <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                            {check.details}
                          </Typography>
                        )}
                      </>
                    }
                  />
                </ListItem>
                {idx < results.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        </>
      )}

      {results.length === 0 && !loading && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Сверка данных по стандартам 1С
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Проверяет: баланс двойной записи, целостность документов, сальдо по счетам,
              задолженности по налогам, статус синхронизации
            </Typography>
            <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={runChecks}>
              Запустить проверку
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default ReconciliationTab;
