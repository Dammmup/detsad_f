import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper, TextField, Button, Typography, Box, Alert, CircularProgress,
  InputAdornment, Card, CardContent, Stepper, Step, StepLabel, Fade
} from '@mui/material';
import {
  WhatsApp, Phone, Sms, Login as LoginIcon, Timer, CheckCircle
} from '@mui/icons-material';
import { sendWhatsAppOTP, verifyWhatsAppOTP, WhatsAppLoginRequest, WhatsAppVerifyRequest } from '../components/services/api/auth';

const WhatsAppLogin: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояния формы
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState(0); // 0 - ввод номера, 1 - ввод кода
  
  // Состояния UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // Таймер обратного отсчета
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Форматирование номера телефона
  const formatPhoneNumber = (value: string) => {
    // Убираем все кроме цифр
    const cleaned = value.replace(/\D/g, '');
    
    // Форматируем как +7 (XXX) XXX-XX-XX
    if (cleaned.length >= 1) {
      if (cleaned.startsWith('8')) {
        return '+7' + cleaned.slice(1);
      }
      if (cleaned.startsWith('7')) {
        return '+' + cleaned;
      }
      return '+7' + cleaned;
    }
    return value;
  };

  // Обработчик изменения номера телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    
    // Очищаем ошибки при изменении
    if (error) setError(null);
  };

  // Обработчик изменения OTP кода
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4); // Только цифры, максимум 4
    setOtpCode(value);
    
    // Очищаем ошибки при изменении
    if (error) setError(null);
  };

  // Отправка OTP кода
  const handleSendOTP = async () => {
    // Валидация номера
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const request: WhatsAppLoginRequest = { phoneNumber };
      const response = await sendWhatsAppOTP(request);
      
      setSuccess(response.message);
      setStep(1);
      setCountdown(response.expiresIn || 300);
      
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  // Верификация OTP кода
  const handleVerifyOTP = async () => {
    if (otpCode.length !== 4) {
      setError('Введите 4-значный код');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const request: WhatsAppVerifyRequest = { phoneNumber, otpCode };
      const authData = await verifyWhatsAppOTP(request);
      
      console.log('✅ Успешная авторизация через WhatsApp:', authData.user.fullName);
      navigate('/app/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  // Повторная отправка кода
  const handleResendOTP = () => {
    setStep(0);
    setOtpCode('');
    setCountdown(0);
    setError(null);
    setSuccess(null);
  };

  // Быстрый вход для разработки
  const handleQuickLogin = (phone: string) => {
    setPhoneNumber(phone);
  };

  const steps = ['Введите номер телефона', 'Введите код из WhatsApp'];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #25D366 0%, #128C7E 50%, #075E54 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        position: 'relative'
      }}
    >
      {/* WhatsApp фоновый паттерн */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.03"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.1
        }}
      />
      
      <Card
        sx={{
          maxWidth: 450,
          width: '100%',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
          borderRadius: 3,
          position: 'relative',
          zIndex: 1
        }}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Заголовок */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 8px 24px rgba(37, 211, 102, 0.3)'
              }}
            >
              <WhatsApp sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
              Вход через WhatsApp
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              Быстрый и безопасный вход без пароля
            </Typography>
          </Box>

          {/* Прогресс */}
          <Stepper activeStep={step} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Шаг 1: Ввод номера телефона */}
          {step === 0 && (
            <Fade in={step === 0}>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Номер телефона"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    disabled={loading}
                    placeholder="+7 (777) 123-45-67"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || phoneNumber.replace(/\D/g, '').length < 11}
                  onClick={handleSendOTP}
                  startIcon={loading ? <CircularProgress size={20} /> : <WhatsApp />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #20B954 0%, #0F7A6C 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)',
                    },
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Отправка кода...' : 'Получить код в WhatsApp'}
                </Button>
              </Box>
            </Fade>
          )}

          {/* Шаг 2: Ввод OTP кода */}
          {step === 1 && (
            <Fade in={step === 1}>
              <Box>
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label="Код из WhatsApp"
                    value={otpCode}
                    onChange={handleOtpChange}
                    disabled={loading}
                    placeholder="1234"
                    inputProps={{ maxLength: 4, style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' } }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Sms color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      }
                    }}
                  />
                  
                  {countdown > 0 && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, color: 'text.secondary' }}>
                      <Timer sx={{ fontSize: 16, mr: 1 }} />
                      <Typography variant="caption">
                        Код действителен {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otpCode.length !== 4}
                  onClick={handleVerifyOTP}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #20B954 0%, #0F7A6C 100%)',
                    },
                    '&:disabled': {
                      background: 'rgba(0,0,0,0.12)',
                    },
                    textTransform: 'none',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    mb: 2
                  }}
                >
                  {loading ? 'Проверка кода...' : 'Войти'}
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={handleResendOTP}
                  disabled={countdown > 0}
                  sx={{ borderRadius: 2 }}
                >
                  {countdown > 0 ? `Повторить через ${countdown}с` : 'Отправить код повторно'}
                </Button>
              </Box>
            </Fade>
          )}

          {/* Сообщения об успехе */}
          {success && (
            <Alert severity="success" sx={{ mt: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {/* Ошибки */}
          {error && (
            <Alert severity="error" sx={{ mt: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Быстрый вход для разработки */}
          {process.env.NODE_ENV === 'development' && step === 0 && (
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid #eee' }}>
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 2 }}>
                🔧 Быстрый вход для разработки:
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => handleQuickLogin('+7 (777) 123-45-67')}
                  sx={{ borderRadius: 2 }}
                >
                  Админ
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  onClick={() => handleQuickLogin('+7 (701) 234-56-78')}
                  sx={{ borderRadius: 2 }}
                >
                  Сотрудник
                </Button>
              </Box>
            </Box>
          )}

          {/* Информация */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Код будет отправлен в WhatsApp на указанный номер
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WhatsAppLogin;
