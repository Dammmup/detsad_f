import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress,
  Alert,
  SelectChangeEvent,
  Tabs,
  Tab,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Settings as SettingsIcon,
  Save,
} from '@mui/icons-material';
import YandexMap from '../../../shared/components/YandexMap';
import {
  getKindergartenSettings,
  updateKindergartenSettings,
  getNotificationSettings,
  updateNotificationSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getGeolocationSettings,
  updateGeolocationSettings,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  KindergartenSettings,
  NotificationSettings,
  SecuritySettings,
  GeolocationSettings,
  User,
} from '../services/settings';
import MainEventsSettings from '../components/MainEventsSettings';

const Settings: React.FC = () => {

  const [kindergartenSettings, setKindergartenSettings] =
    useState<KindergartenSettings | null>(null);
  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings | null>(null);
  const [securitySettings, setSecuritySettings] =
    useState<SecuritySettings | null>(null);
  const [geolocationSettings, setGeolocationSettings] =
    useState<GeolocationSettings | null>(null);
  const [users, setUsers] = useState<User[]>([]);


  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);


  const [userForm, setUserForm] = useState<User>({
    username: '',
    email: '',
    fullName: '',
    role: 'staff',
    isActive: true,
    permissions: [],
  });
  const [userFormErrors, setUserFormErrors] = useState<{
    [key: string]: string;
  }>({});


  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {

      const [kindergarten, notifications, security, geolocation, usersData] =
        await Promise.all([
          getKindergartenSettings(),
          getNotificationSettings(),
          getSecuritySettings(),
          getGeolocationSettings(),
          getAllUsers(),
        ]);

      setKindergartenSettings(kindergarten);
      setNotificationSettings(notifications);
      setSecuritySettings(security);
      setGeolocationSettings(geolocation);
      setUsers(usersData);
    } catch (err: any) {
      setError(err?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };


  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };




  const handleSaveKindergartenSettings = async () => {
    if (!kindergartenSettings) return;

    setLoading(true);

    try {
      const updatedSettings =
        await updateKindergartenSettings(kindergartenSettings);
      setKindergartenSettings(updatedSettings);
      alert('Настройки детского сада успешно сохранены');
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };


  const handleSaveNotificationSettings = async () => {
    if (!notificationSettings) return;

    setLoading(true);

    try {
      const updatedSettings =
        await updateNotificationSettings(notificationSettings);
      setNotificationSettings(updatedSettings);
      alert('Настройки уведомлений успешно сохранены');
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };


  const handleSaveSecuritySettings = async () => {
    if (!securitySettings) return;

    setLoading(true);

    try {
      const updatedSettings = await updateSecuritySettings(securitySettings);
      setSecuritySettings(updatedSettings);
      alert('Настройки безопасности успешно сохранены');
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };


  const handleSaveGeolocationSettings = async () => {
    if (!geolocationSettings) return;

    setLoading(true);

    try {
      const updatedSettings =
        await updateGeolocationSettings(geolocationSettings);
      setGeolocationSettings(updatedSettings);
      alert('Настройки геолокации успешно сохранены');
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения настроек');
    } finally {
      setLoading(false);
    }
  };


  const handleUserFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });


    if (userFormErrors[name]) {
      setUserFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };


  const handleUserFormSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setUserForm({ ...userForm, [name]: value });


    if (userFormErrors[name]) {
      setUserFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };


  const validateUserForm = () => {
    const errors: { [key: string]: string } = {};

    if (!userForm.username) errors.username = 'Введите имя пользователя';
    if (!userForm.email) errors.email = 'Введите email';
    if (!userForm.fullName) errors.fullName = 'Введите полное имя';
    if (!userForm.role) errors.role = 'Выберите роль';


    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (userForm.email && !emailRegex.test(userForm.email)) {
      errors.email = 'Введите корректный email';
    }

    setUserFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSaveUser = async () => {

    if (!validateUserForm()) {
      return;
    }

    setLoading(true);

    try {
      if (userForm.id) {

        const updatedUser = await updateUser(userForm.id, userForm);
        setUsers(
          users.map((user) =>
            user.id === updatedUser.id ? updatedUser : user,
          ),
        );
      } else {

        const newUser = await createUser(userForm);
        setUsers([...users, newUser]);
      }


      setUserDialogOpen(false);
      setSelectedUser(null);
      setUserForm({
        username: '',
        email: '',
        fullName: '',
        role: 'staff',
        isActive: true,
        permissions: [],
      });
    } catch (err: any) {
      setError(err?.message || 'Ошибка сохранения пользователя');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return;
    }

    setLoading(true);

    try {
      await deleteUser(id);
      setUsers(users.filter((user) => user.id !== id));
    } catch (err: any) {
      setError(err?.message || 'Ошибка удаления пользователя');
    } finally {
      setLoading(false);
    }
  };


  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm(user);
    setUserDialogOpen(true);
  };


  const getRoleText = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'manager':
        return 'Менеджер';
      case 'staff':
        return 'Сотрудник';
      default:
        return role;
    }
  };


  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'staff':
        return 'primary';
      default:
        return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3, m: 2 }}>
      {/* Заголовок */}
      <Box
        display='flex'
        justifyContent='space-between'
        alignItems='center'
        mb={3}
      >
        <Typography variant='h5' display='flex' alignItems='center'>
          <SettingsIcon sx={{ mr: 1 }} /> Настройки системы
        </Typography>
      </Box>

      {/* Индикатор загрузки и ошибки */}
      {loading && <CircularProgress />}
      {error && (
        <Alert severity='error' sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Вкладки с настройками */}
      <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label='Детский сад' />
        <Tab label='Уведомления' />
        <Tab label='Безопасность' />
        <Tab label='Геолокация' />
        <Tab label='Автоматический экспорт' />
        <Tab label='Пользователи' />
      </Tabs>

      {/* Содержимое вкладок */}
      {tabValue === 0 && kindergartenSettings && (
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Настройки детского сада
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Название'
                  fullWidth
                  value={kindergartenSettings.name}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      name: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Директор'
                  fullWidth
                  value={kindergartenSettings.director}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      director: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label='Адрес'
                  fullWidth
                  value={kindergartenSettings.address}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      address: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Телефон'
                  fullWidth
                  value={kindergartenSettings.phone}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      phone: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Email'
                  fullWidth
                  value={kindergartenSettings.email}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      email: e.target.value,
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Тип штрафа за опоздание</InputLabel>
                  <Select
                    value={kindergartenSettings.payroll?.latePenaltyType || 'per_minute'}
                    label="Тип штрафа за опоздание"
                    onChange={(e) =>
                      setKindergartenSettings({
                        ...kindergartenSettings,
                        payroll: {
                          ...kindergartenSettings.payroll!,
                          latePenaltyType: e.target.value as any,
                        },
                      })
                    }
                  >
                    <MenuItem value="fixed">Фиксированный</MenuItem>
                    <MenuItem value="per_minute">За минуту</MenuItem>
                    <MenuItem value="per_5_minutes">За каждые 5 минут</MenuItem>
                    <MenuItem value="per_10_minutes">За каждые 10 минут</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label={`Сумма штрафа ${kindergartenSettings.payroll?.latePenaltyType === 'fixed'
                    ? '(фиксированная)'
                    : kindergartenSettings.payroll?.latePenaltyType === 'per_5_minutes'
                      ? '(за 5 минут)'
                      : kindergartenSettings.payroll?.latePenaltyType === 'per_10_minutes'
                        ? '(за 10 минут)'
                        : '(за минуту)'
                    }`}
                  type='number'
                  fullWidth
                  value={kindergartenSettings.payroll?.latePenaltyRate || 0}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      payroll: {
                        ...kindergartenSettings.payroll!,
                        latePenaltyRate: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Время начала работы'
                  type='time'
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={kindergartenSettings.workingHours.start}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      workingHours: {
                        ...kindergartenSettings.workingHours,
                        start: e.target.value,
                      },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Время окончания работы'
                  type='time'
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={kindergartenSettings.workingHours.end}
                  onChange={(e) =>
                    setKindergartenSettings({
                      ...kindergartenSettings,
                      workingHours: {
                        ...kindergartenSettings.workingHours,
                        end: e.target.value,
                      },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Save />}
                  onClick={handleSaveKindergartenSettings}
                >
                  Сохранить настройки
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 1 && notificationSettings && (
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Настройки уведомлений
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.emailNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          emailNotifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Email уведомления'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.smsNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          smsNotifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label='SMS уведомления'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.pushNotifications}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          pushNotifications: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Push уведомления'
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant='subtitle1' gutterBottom>
                  Алерты
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.lateArrivalAlert}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          lateArrivalAlert: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Уведомления об опозданиях'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.absenceAlert}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          absenceAlert: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Уведомления об отсутствии'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.overtimeAlert}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          overtimeAlert: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Уведомления о сверхурочных'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={notificationSettings.reportReminders}
                      onChange={(e) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          reportReminders: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Напоминания об отчетах'
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Save />}
                  onClick={handleSaveNotificationSettings}
                >
                  Сохранить настройки
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && securitySettings && (
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Настройки безопасности
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant='subtitle1' gutterBottom>
                  Политика паролей
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Минимальная длина пароля'
                  type='number'
                  fullWidth
                  value={securitySettings.passwordPolicy.minLength}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      passwordPolicy: {
                        ...securitySettings.passwordPolicy,
                        minLength: parseInt(e.target.value),
                      },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Максимальное количество попыток входа'
                  type='number'
                  fullWidth
                  value={securitySettings.maxLoginAttempts}
                  onChange={(e) =>
                    setSecuritySettings({
                      ...securitySettings,
                      maxLoginAttempts: parseInt(e.target.value),
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.passwordPolicy.requireUppercase}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: {
                            ...securitySettings.passwordPolicy,
                            requireUppercase: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label='Требовать заглавные буквы'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.passwordPolicy.requireNumbers}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordPolicy: {
                            ...securitySettings.passwordPolicy,
                            requireNumbers: e.target.checked,
                          },
                        })
                      }
                    />
                  }
                  label='Требовать цифры'
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={securitySettings.twoFactorAuth}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          twoFactorAuth: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Двухфакторная аутентификация'
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Save />}
                  onClick={handleSaveSecuritySettings}
                >
                  Сохранить настройки
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 3 && geolocationSettings && (
        <Card>
          <CardContent>
            <Typography variant='h6' gutterBottom>
              Настройки геолокации
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={geolocationSettings.enabled}
                      onChange={(e) =>
                        setGeolocationSettings({
                          ...geolocationSettings,
                          enabled: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Включить геолокацию'
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant='contained'
                  color='primary'
                  onClick={async () => {
                    console.log('Кнопка "Показать карту" нажата');
                    console.log(
                      'Текущие настройки геолокации:',
                      geolocationSettings,
                    );


                    try {
                      console.log(
                        'Пытаемся получить настройки геолокации сервера...',
                      );
                      const freshSettings = await getGeolocationSettings();
                      console.log(
                        'Получены настройки геолокации с сервера:',
                        freshSettings,
                      );


                      const updatedSettings = {
                        ...freshSettings,
                        yandexApiKey: '',
                      };

                      console.log(
                        'Обновленные настройки с пустым API-ключом:',
                        updatedSettings,
                      );
                      setGeolocationSettings(updatedSettings);
                    } catch (error) {
                      console.error(
                        'Ошибка при получении настроек геолокации:',
                        error,
                      );


                      const updatedSettings = {
                        ...geolocationSettings,
                        yandexApiKey: '',
                      };

                      console.log(
                        'Используем текущие настройки с пустым API-ключом:',
                        updatedSettings,
                      );
                      setGeolocationSettings(updatedSettings);
                    }
                  }}
                >
                  Показать карту
                </Button>
              </Grid>

              {/* Отображаем карту только если API-ключ был установлен после нажатия кнопки */}
              {geolocationSettings.yandexApiKey === '' && (
                <Grid item xs={12}>
                  <YandexMap
                    center={{
                      lat:
                        (geolocationSettings as GeolocationSettings).coordinates
                          ?.latitude || 51.1605,
                      lng:
                        (geolocationSettings as GeolocationSettings).coordinates
                          ?.longitude || 71.4704,
                    }}
                    radius={geolocationSettings.radius || 100}
                    onRadiusChange={(radius: number) =>
                      setGeolocationSettings({
                        ...geolocationSettings,
                        radius: radius,
                      })
                    }
                    onCenterChange={(center: { lat: number; lng: number }) =>
                      setGeolocationSettings({
                        ...geolocationSettings,
                        ...(geolocationSettings as GeolocationSettings),
                        coordinates: {
                          latitude: center.lat,
                          longitude: center.lng,
                        },
                      })
                    }
                    apiKey={
                      (geolocationSettings as GeolocationSettings)
                        .yandexApiKey || ''
                    }
                  />
                </Grid>
              )}

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={geolocationSettings.strictMode}
                      onChange={(e) =>
                        setGeolocationSettings({
                          ...geolocationSettings,
                          strictMode: e.target.checked,
                        })
                      }
                    />
                  }
                  label='Строгий режим'
                />
              </Grid>

              <Grid item xs={12}>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Save />}
                  onClick={handleSaveGeolocationSettings}
                >
                  Сохранить настройки
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {tabValue === 4 && <MainEventsSettings />}

      {tabValue === 5 && (
        <Card>
          <CardContent>
            <Box
              display='flex'
              justifyContent='space-between'
              alignItems='center'
              mb={2}
            >
              <Typography variant='h6'>Управление пользователями</Typography>
              <Button
                variant='contained'
                color='primary'
                startIcon={<Add />}
                onClick={() => {
                  setSelectedUser(null);
                  setUserForm({
                    username: '',
                    email: '',
                    fullName: '',
                    role: 'staff',
                    isActive: true,
                    permissions: [],
                  });
                  setUserDialogOpen(true);
                }}
              >
                Добавить пользователя
              </Button>
            </Box>

            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Имя пользователя</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Полное имя</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Статус</TableCell>
                  <TableCell>Последний вход</TableCell>
                  <TableCell>Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell>
                      <Chip
                        label={getRoleText(user.role)}
                        size='small'
                        color={getRoleColor(user.role) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={user.isActive ? 'Активен' : 'Неактивен'}
                        size='small'
                        color={user.isActive ? 'success' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {user.lastLogin
                        ? new Date(user.lastLogin).toLocaleDateString('ru-RU')
                        : 'Никогда'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title='Редактировать'>
                        <IconButton
                          size='small'
                          onClick={() => handleEditUser(user)}
                        >
                          <Edit fontSize='small' />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title='Удалить'>
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteUser(user.id || '')}
                        >
                          <Delete fontSize='small' color='error' />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Диалог создания/редактирования пользователя */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {selectedUser
            ? 'Редактировать пользователя'
            : 'Добавить нового пользователя'}
        </DialogTitle>

        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label='Имя пользователя'
                name='username'
                fullWidth
                value={userForm.username}
                onChange={handleUserFormChange}
                error={!!userFormErrors.username}
                helperText={userFormErrors.username}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label='Email'
                name='email'
                type='email'
                fullWidth
                value={userForm.email}
                onChange={handleUserFormChange}
                error={!!userFormErrors.email}
                helperText={userFormErrors.email}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label='Полное имя'
                name='fullName'
                fullWidth
                value={userForm.fullName}
                onChange={handleUserFormChange}
                error={!!userFormErrors.fullName}
                helperText={userFormErrors.fullName}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth error={!!userFormErrors.role}>
                <InputLabel>Роль</InputLabel>
                <Select
                  name='role'
                  value={userForm.role}
                  onChange={handleUserFormSelectChange}
                  label='Роль'
                >
                  <MenuItem value='admin'>Администратор</MenuItem>
                  <MenuItem value='manager'>Менеджер</MenuItem>
                  <MenuItem value='staff'>Сотрудник</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userForm.isActive}
                    onChange={(e) =>
                      setUserForm({
                        ...userForm,
                        isActive: e.target.checked,
                      })
                    }
                  />
                }
                label='Активный пользователь'
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setUserDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveUser} variant='contained' color='primary'>
            {selectedUser ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default Settings;
