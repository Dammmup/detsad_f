import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControlLabel,
  Switch,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Select,
  MenuItem,
  IconButton,
  Tooltip
} from '@mui/material';
import { Save, PlayArrow, CheckCircle, SyncProblem } from '@mui/icons-material';
import {
  Integration1CSettings,
  SyncReconciliationAlert,
  getIntegration1CSettings,
  updateIntegration1CSettings,
  trigger1CReconciliation,
  get1CAlerts,
  update1CAlertStatus
} from '../services/settings';

const Integration1CSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<Integration1CSettings | null>(null);
  const [alerts, setAlerts] = useState<SyncReconciliationAlert[]>([]);
  
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [triggeringLoading, setTriggeringLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  
  const [errorConfig, setErrorConfig] = useState<string | null>(null);
  const [errorAlerts, setErrorAlerts] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    loadAlerts();
  }, []);

  const loadSettings = async () => {
    setLoadingConfig(true);
    setErrorConfig(null);
    try {
      const data = await getIntegration1CSettings();
      setSettings(data);
    } catch (err: any) {
      setErrorConfig(err.message || 'Ошибка загрузки настроек 1С');
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    setErrorAlerts(null);
    try {
      const data = await get1CAlerts();
      setAlerts(data);
    } catch (err: any) {
      setErrorAlerts(err.message || 'Ошибка загрузки истории расхождений');
    } finally {
      setLoadingAlerts(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setLoadingConfig(true);
    try {
      await updateIntegration1CSettings(settings);
      alert('Настройки интеграции с 1С успешно сохранены');
    } catch (err: any) {
      setErrorConfig(err.message || 'Ошибка сохранения настроек 1С');
    } finally {
      setLoadingConfig(false);
    }
  };

  const handleTriggerReconciliation = async () => {
    if (!window.confirm('Вы точно хотите запустить сверку прямо сейчас? Это может занять некоторое время.')) return;
    setTriggeringLoading(true);
    try {
      const res = await trigger1CReconciliation();
      alert(res.message || 'Процесс запущен');
      // Даем пару секунд перед обновлением списка, чтобы крон успел отработать
      setTimeout(loadAlerts, 3000);
    } catch (err: any) {
      alert(err.message || 'Ошибка запуска сверки');
    } finally {
      setTriggeringLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    try {
      await update1CAlertStatus(id, newStatus);
      setAlerts(prev => prev.map(a => a._id === id ? { ...a, status: newStatus as any } : a));
    } catch (err: any) {
      alert(err.message || 'Ошибка смены статуса');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'error';
      case 'investigating': return 'warning';
      case 'resolved': return 'success';
      default: return 'default';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новое расхождение';
      case 'investigating': return 'В работе';
      case 'resolved': return 'Решено';
      default: return status;
    }
  };

  return (
    <Box>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SettingsIcon sx={{ mr: 1 }} color="primary" /> Конфигурация связи с 1С
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            На этой вкладке вы можете управлять расписанием акридитации (сверки) базы ERP с базой 1С:Бухгалтерия.
          </Typography>

          {loadingConfig ? <CircularProgress size={24} /> : errorConfig ? <Alert severity="error">{errorConfig}</Alert> : null}

          {settings && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.onec_sync_enabled}
                      onChange={(e) => setSettings({ ...settings, onec_sync_enabled: e.target.checked })}
                    />
                  }
                  label={<b>Включить ночную автоматическую сверку с 1С</b>}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Cron-интервал сверки (умолч: 0 3 * * * - в 3 ночи)'
                  fullWidth
                  disabled={!settings.onec_sync_enabled}
                  value={settings.onec_sync_interval}
                  onChange={(e) => setSettings({ ...settings, onec_sync_interval: e.target.value })}
                  helperText="По умолчанию используется '0 3 * * *'. Измените, если знаете синтаксис Cron."
                />
              </Grid>

              <Grid item xs={12}>
                <Button variant='contained' color='primary' startIcon={<Save />} onClick={handleSaveSettings} disabled={loadingConfig}>
                  Сохранить настройки
                </Button>
                
                <Button 
                  sx={{ ml: 2 }} 
                  variant='outlined' 
                  color='secondary' 
                  startIcon={triggeringLoading ? <CircularProgress size={20} /> : <PlayArrow />} 
                  onClick={handleTriggerReconciliation} 
                  disabled={triggeringLoading}
                >
                  Запустить сверку сейчас
                </Button>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant='h6' gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <SyncProblem sx={{ mr: 1 }} color="error" /> Акты сверки (Обнаруженные расхождения)
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Данная таблица пополняется, если итоговое сальдо клиента или сотрудника в ERP отличается от его баланса в 1С. 
          </Typography>

          {loadingAlerts ? <CircularProgress /> : errorAlerts ? <Alert severity="error">{errorAlerts}</Alert> : null}

          {!loadingAlerts && alerts.length === 0 && (
            <Alert severity="success">Расхождений не обнаружено! Сальдо в ERP и 1С полностью совпадает.</Alert>
          )}

          {!loadingAlerts && alerts.length > 0 && (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell>Дата проверки</TableCell>
                    <TableCell>Тип</TableCell>
                    <TableCell>Клиент/Сотрудник</TableCell>
                    <TableCell align="right">Баланс ERP (₸)</TableCell>
                    <TableCell align="right">Баланс 1С (₸)</TableCell>
                    <TableCell align="right" sx={{ color: 'red' }}>Разница (₸)</TableCell>
                    <TableCell align="center">Статус проблемы</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {alerts.map((alert) => (
                    <TableRow key={alert._id}>
                      <TableCell>{new Date(alert.date_checked).toLocaleString('ru-RU')}</TableCell>
                      <TableCell>{alert.entity_type === 'counterparty' ? 'Клиент' : 'Сотрудник'}</TableCell>
                      <TableCell>{alert.erp_id?.fullName || alert.erp_id?.name || 'Удален / ID: ' + alert.erp_id}</TableCell>
                      <TableCell align="right"><b>{alert.erp_balance?.toLocaleString()}</b></TableCell>
                      <TableCell align="right"><b>{alert.onec_balance?.toLocaleString()}</b></TableCell>
                      <TableCell align="right" sx={{ color: 'red', fontWeight: 'bold' }}>{alert.difference?.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        {actionLoadingId === alert._id ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Select
                            size="small"
                            value={alert.status}
                            onChange={(e) => handleStatusChange(alert._id, e.target.value)}
                            sx={{ minWidth: 140 }}
                            renderValue={(value) => (
                              <Chip size="small" label={getStatusLabel(value)} color={getStatusColor(value)} />
                            )}
                          >
                            <MenuItem value="new">Новое расхождение</MenuItem>
                            <MenuItem value="investigating">В работе</MenuItem>
                            <MenuItem value="resolved">Решено</MenuItem>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

// Хак для иконок чтобы не тащить сверху
import { Settings as SettingsIcon } from '@mui/icons-material';
import { Box } from '@mui/material';

export default Integration1CSettingsTab;
