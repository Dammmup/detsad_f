import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Typography,
  Button,
  CircularProgress,
  InputAdornment,
  Alert,
} from '@mui/material';
import { Phone, Lock } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../app/context/AuthContext';
import { User } from '../shared/types/staff';
import { authApi } from '../modules/staff/services/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!phone || !password) {
      setError('Введите номер телефона и пароль');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const authResponse = await authApi.login({ phone, password });

      const userData: User = {
        _id: authResponse.user._id || authResponse.user.id || '',
        id: authResponse.user.id || authResponse.user._id || '',
        fullName: authResponse.user.fullName || '',
        role: authResponse.user.role || 'staff',
        phone: phone,
        email: authResponse.user.phone || phone,
        active: authResponse.user.active ?? true,
        createdAt: authResponse.user.createdAt || new Date().toISOString(),
        updatedAt: authResponse.user.updatedAt || new Date().toISOString(),
      };


      const token = authResponse.token;
      if (!token) {
        setError('Ошибка авторизации: сервер не вернул токен');
        return;
      }
      login(userData, token);
      navigate('/app/dashboard');
    } catch (e: any) {
      setError(e.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
        p: 2,
      }}
    >
      <Card elevation={12} sx={{ maxWidth: 400, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant='h5' sx={{ mb: 3, textAlign: 'center' }}>
            Вход в систему
          </Typography>

          {error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label='Номер телефона'
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Phone />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            type='password'
            label='Пароль'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 3 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position='start'>
                  <Lock />
                </InputAdornment>
              ),
            }}
          />
          <Button
            fullWidth
            variant='contained'
            disabled={loading}
            onClick={handleLogin}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Входим...' : 'Войти'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
