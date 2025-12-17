import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  TextField,
  Typography,
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Avatar,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { authApi, getCurrentUser } from '../../services/auth';
import { usersApi, updateUser } from '../../services/users';
import { User } from '../../types/common';

const StyledCard = styled(Card)(({ theme }) => ({
  maxWidth: 600,
  margin: 'auto',
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [telegramLinkCode, setTelegramLinkCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    phone: '',
    fullName: '',
    photo: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setFormData({
          phone: currentUser.phone || '',
          fullName: currentUser.fullName || '',
          photo: currentUser.photo || '',
        });
      } else {
        throw new Error('Пользователь не авторизован');
      }
    } catch (err) {
      setError('Ошибка загрузки профиля');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            photo: event.target?.result as string,
          }));
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {

      const updateData: any = {};
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.fullName) updateData.fullName = formData.fullName;
      if (formData.photo) updateData.photo = formData.photo;

      if (Object.keys(updateData).length === 0) {
        setError('Нет данных для обновления');
        return;
      }

      const updatedUser = await updateUser(user.id as any, updateData);


      const authData = {
        ...updatedUser,
        id: updatedUser._id,
        active: updatedUser.active,
      };

      localStorage.setItem('user', JSON.stringify(authData));
      setUser(authData);

      setSuccess('Профиль успешно обновлен');
      setIsEditing(false);


      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Ошибка при обновлении профиля');
      console.error(err);
    }
  };

  const handleSavePassword = async () => {
    if (!passwordForm.newPassword) {
      setError('Введите новый пароль');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    try {

      if (user) {

        const updateData = {
          initialPassword: passwordForm.newPassword,
        };

        const updatedUser = await updateUser(user.id as any, updateData);


        const authData = {
          ...updatedUser,
          id: updatedUser._id,
          active: updatedUser.active,
        };

        localStorage.setItem('user', JSON.stringify(authData));
        setUser(authData);

        setSuccess('Пароль успешно изменен');


        setPasswordForm({
          newPassword: '',
          confirmPassword: '',
        });


        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      }
    } catch (err) {
      setError('Ошибка при изменении пароля');
      console.error(err);
    }
  };

  const handleGenerateTelegramCode = async () => {
    if (!user || !user.id) {
      setError('Невозможно получить ID пользователя');
      return;
    }
    try {
      const response = await usersApi.generateTelegramLinkCode(user.id);
      if (response.telegramLinkCode) {
        setTelegramLinkCode(response.telegramLinkCode);
        setSuccess(
          'Код для привязки Telegram сгенерирован. Отправьте этот код боту.',
        );
        setTimeout(() => setSuccess(null), 5000);
      }
    } catch (err) {
      setError('Ошибка при генерации кода для Telegram');
      console.error(err);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        height='100vh'
      >
        <Typography color='error'>
          Ошибка: Не удалось загрузить профиль пользователя
        </Typography>
      </Box>
    );
  }

  return (
    <StyledCard>
      <CardHeader title='Профиль сотрудника' subheader={`ID: ${user.id}`} />
      <Divider />
      <CardContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity='success' sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box display='flex' justifyContent='center'>
              <Avatar
                src={formData.photo || undefined}
                alt={user.fullName || 'Пользователь'}
                sx={{ width: 120, height: 120, fontSize: '2rem' }}
              >
                {user.fullName ? user.fullName.charAt(0) : '?'}
              </Avatar>
            </Box>
            <Box mt={2} display='flex' justifyContent='center'>
              <input
                accept='image/*'
                id='photo-upload'
                type='file'
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              <label htmlFor='photo-upload'>
                <Button variant='outlined' component='span'>
                  Загрузить фото
                </Button>
              </label>
            </Box>
          </Grid>

          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label='ФИО'
              name='fullName'
              value={formData.fullName}
              onChange={handleInputChange}
              disabled={!isEditing}
              margin='normal'
            />

            <TextField
              fullWidth
              label='Номер телефона'
              name='phone'
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              margin='normal'
            />
          </Grid>
        </Grid>

        {/* Отображение начального пароля в режиме просмотра */}
        {!isEditing && user?.initialPassword && (
          <>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant='body2' color='textSecondary'>
                  Начальный пароль:
                </Typography>
              </Grid>
              <Grid item xs={8}>
                <Typography variant='body1' sx={{ wordBreak: 'break-all' }}>
                  {user.initialPassword}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}

        {isEditing ? (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant='h6' gutterBottom>
              Изменение пароля
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Новый пароль'
                  name='newPassword'
                  type='password'
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  margin='normal'
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label='Подтвердите новый пароль'
                  name='confirmPassword'
                  type='password'
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  margin='normal'
                />
              </Grid>
            </Grid>
            <Box mt={2}>
              <Button
                variant='contained'
                color='primary'
                onClick={handleSavePassword}
              >
                Сохранить пароль
              </Button>
            </Box>
          </>
        ) : null}

        <Box mt={3} display='flex' justifyContent='space-between'>
          {isEditing ? (
            <>
              <Button
                variant='contained'
                color='primary'
                onClick={handleSaveProfile}
              >
                Сохранить изменения
              </Button>
              <Button variant='outlined' onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
            </>
          ) : (
            <Button
              variant='contained'
              color='primary'
              onClick={() => setIsEditing(true)}
            >
              Редактировать профиль
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box mt={2}>
          <Typography variant='h6' gutterBottom>
            Интеграция с Telegram
          </Typography>
          {!telegramLinkCode ? (
            <Button variant='outlined' onClick={handleGenerateTelegramCode}>
              Привязать Telegram
            </Button>
          ) : (
            <Box>
              <Typography>
                Отправьте следующий код вашему Telegram-боту, чтобы завершить
                привязку:
              </Typography>
              <TextField
                fullWidth
                value={telegramLinkCode}
                margin='normal'
                InputProps={{
                  readOnly: true,
                }}
                sx={{
                  '& .MuiInputBase-input': {
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    color: 'primary.main',
                  },
                }}
              />
            </Box>
          )}
        </Box>

        {!isEditing && (
          <Box mt={3} textAlign='center'>
            <Button variant='outlined' color='secondary' onClick={handleLogout}>
              Выйти из аккаунта
            </Button>
          </Box>
        )}
      </CardContent>
    </StyledCard>
  );
};

export default ProfilePage;
