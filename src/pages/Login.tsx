import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper, TextField, Button, Typography, Box, Alert, CircularProgress,
  InputAdornment, Card, CardContent, Tabs, Tab
} from '@mui/material';
import {
  Login as LoginIcon, School, WhatsApp, Phone, VpnKey
} from '@mui/icons-material';
import { 
  sendWhatsAppOTP, verifyWhatsAppOTP, 
  WhatsAppLoginRequest, WhatsAppVerifyRequest, loginWithPersonalCode, 
  PersonalCodeLoginRequest 
} from '../components/services/api/auth';

const Login: React.FC = () => {
  const navigate = useNavigate();
  
  // Состояния UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginMethod, setLoginMethod] = useState<'whatsapp' | 'personalCode'>('personalCode'); // По умолчанию персональный код
  const [success, setSuccess] = useState<string | null>(null);

  // Состояния для WhatsApp
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [whatsappStep, setWhatsappStep] = useState(0); // 0 - номер, 1 - код
  
  // Состояния для персональных кодов
  const [personalCode, setPersonalCode] = useState('');
  const [personalCodePhone, setPersonalCodePhone] = useState('');

  // ===== ПЕРСОНАЛЬНЫЕ КОДЫ =====
  
  // Обработчик авторизации по персональному коду
  const handlePersonalCodeLogin = async () => {
    // Валидация
    if (!personalCodePhone || !personalCode) {
      setError('Введите номер телефона и персональный код');
      return;
    }
    
    if (personalCode.length !== 6) {
      setError('Персональный код должен содержать 6 символов');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formattedPhone = formatPhoneNumber(personalCodePhone);
      
      const authData = await loginWithPersonalCode({
        phoneNumber: formattedPhone,
        personalCode: personalCode.toUpperCase()
      });
      localStorage.setItem('user', JSON.stringify(authData.user));

      console.log('✅ Успешная авторизация по персональному коду:', authData.user.fullName);
      navigate('/app/dashboard');
      
    } catch (err: any) {
      setError(err.message || 'Неверный номер телефона или персональный код');
    } finally {
      setLoading(false);
    }
  };
  
  // Очистка ошибок при смене метода входа
  const handleMethodChange = (method: 'whatsapp' | 'personalCode') => {
    setLoginMethod(method);
    setError(null);
    setSuccess(null);
  };
  
  // ===== WHATSAPP ОБРАБОТЧИКИ =====
  
  // Форматирование номера телефона
  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 1) {
      if (cleaned.startsWith('8')) {
        return '+7' + cleaned.slice(1);
      } else if (cleaned.startsWith('7')) {
        return '+' + cleaned;
      } else if (cleaned.length === 10) {
        return '+7' + cleaned;
      }
    }
    return value.startsWith('+') ? value : '+' + cleaned;
  };

  // Обработчик изменения номера телефона для WhatsApp
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    if (error) setError(null);
  };

  // Обработчик изменения OTP кода
  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setOtpCode(value);
    if (error) setError(null);
  };

  // Отправка OTP кода
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.replace(/\D/g, '').length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sendWhatsAppOTP({ phoneNumber });
      setSuccess(response.message);
      setWhatsappStep(1);
      console.log('✅ OTP код отправлен');
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  // Верификация OTP кода
  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length !== 4) {
      setError('Введите 4-значный код');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const authData = await verifyWhatsAppOTP({
        phoneNumber,
        otpCode
      });

      console.log('✅ Успешная авторизация через WhatsApp:', authData.user.fullName);
      navigate('/app/dashboard');
    } catch (err: any) {
      setError(err.message || 'Неверный код');
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 2,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.2) 0%, transparent 50%)
          `,
          pointerEvents: 'none'
        }
      }}
    >
      <Card
        elevation={24}
        sx={{
          maxWidth: 450,
          width: '100%',
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.95)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
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
                background: loginMethod === 'personalCode'
                  ? 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)'
                  : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: loginMethod === 'personalCode'
                  ? '0 8px 24px rgba(255, 107, 53, 0.3)'
                  : '0 8px 24px rgba(37, 211, 102, 0.3)',
                transition: 'all 0.3s ease'
              }}
            >
              {loginMethod === 'personalCode' ? 
                <VpnKey sx={{ fontSize: 40, color: 'white' }} /> :
                <WhatsApp sx={{ fontSize: 40, color: 'white' }} />
              }
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
              Детсад CRM
            </Typography>
            
            <Typography variant="body1" color="text.secondary">
              {loginMethod === 'personalCode'
                ? 'Вход по персональному коду'
                : 'Быстрый вход через WhatsApp'
              }
            </Typography>
          </Box>

          {/* Выбор способа входа */}
          <Box sx={{ mb: 4 }}>
            <Tabs 
              value={loginMethod} 
              onChange={(_, value) => handleMethodChange(value)}
              variant="fullWidth"
              sx={{
                '& .MuiTab-root': {
                  borderRadius: 2,
                  mx: 0.5,
                  textTransform: 'none',
                  fontWeight: 600
                },
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: '3px 3px 0 0'
                }
              }}
            >
              <Tab 
                value="personalCode"
                label="Персональный код"
                icon={<VpnKey />}
              />
              <Tab 
                value="whatsapp" 
                label="WhatsApp" 
                icon={<WhatsApp />} 
                iconPosition="start"
                sx={{ 
                  color: loginMethod === 'whatsapp' ? '#25D366' : 'text.secondary'
                }}
              />
            </Tabs>
          </Box>

          {/* Ошибки и успешные сообщения */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {success}
            </Alert>
          )}

          {/* Формы входа */}
          {loginMethod === 'personalCode' ? (
            // Форма персонального кода
            <Box>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Номер телефона"
                  value={personalCodePhone}
                  onChange={(e) => {
                    setPersonalCodePhone(e.target.value);
                    if (error) setError(null);
                  }}
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

              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Персональный код"
                  value={personalCode}
                  onChange={(e) => {
                    setPersonalCode(e.target.value.toUpperCase());
                    if (error) setError(null);
                  }}
                  disabled={loading}
                  placeholder="ABC123"
                  inputProps={{ 
                    maxLength: 6, 
                    style: { 
                      textAlign: 'center', 
                      fontSize: '1.2rem', 
                      letterSpacing: '0.3rem',
                      fontWeight: 600
                    } 
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKey color="action" />
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
                disabled={loading || !personalCodePhone || personalCode.length !== 6}
                onClick={handlePersonalCodeLogin}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #E55A2B 0%, #DE831A 100%)',
                  },
                  '&:disabled': {
                    background: 'rgba(0,0,0,0.12)',
                  },
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  fontWeight: 600
                }}
              >
                {loading ? 'Проверка кода...' : 'Войти'}
              </Button>

              {/* Подсказка */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(255, 107, 53, 0.1)', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  🔑 Персональный код выдаёт администратор<br/>
                  Обратитесь к руководству для получения кода
                </Typography>
              </Box>
            </Box>
          ) : (
            // Форма WhatsApp
            <Box>
              {whatsappStep === 0 ? (
                // Шаг 1: Ввод номера телефона
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
              ) : (
                // Шаг 2: Ввод OTP кода
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
                            <WhatsApp color="action" />
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
                    disabled={loading || otpCode.length !== 4}
                    onClick={handleVerifyOTP}
                    startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
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
                    onClick={() => { setWhatsappStep(0); setOtpCode(''); setError(null); setSuccess(null); }}
                    sx={{ borderRadius: 2 }}
                  >
                    Отправить код повторно
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
