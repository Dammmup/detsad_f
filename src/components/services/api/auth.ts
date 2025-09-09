import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api` || 'http://localhost:8080/api';

// Интерфейсы для авторизации
export interface LoginCredentials {
  email: string;
  password: string;
}

// Интерфейсы для WhatsApp авторизации
export interface WhatsAppLoginRequest {
  phoneNumber: string;
}

export interface WhatsAppVerifyRequest {
  phoneNumber: string;
  otpCode: string;
}

// Интерфейсы для персональных кодов
export interface PersonalCodeLoginRequest {
  phoneNumber: string;
  personalCode: string;
}

export interface GeneratePersonalCodeRequest {
  userId: string;
}

export interface PersonalCodeResponse {
  success: boolean;
  message: string;
  personalCode?: string;
  user?: {
    id: string;
    fullName: string;
    phone: string;
    personalCode?: string;
  };
}

export interface OTPResponse {
  success: boolean;
  message: string;
  expiresIn?: number; // время жизни кода в секундах
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

// Create axios instance for auth (без interceptors чтобы избежать циклических зависимостей)
const authApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===== WHATSAPP АВТОРИЗАЦИЯ =====

/**
 * Send OTP code via WhatsApp
 * @param {WhatsAppLoginRequest} request - Phone number for OTP
 * @returns {Promise<OTPResponse>} OTP send result
 */
export const sendWhatsAppOTP = async (request: WhatsAppLoginRequest): Promise<OTPResponse> => {
  try {
    console.log('📱 Отправка OTP на WhatsApp:', request.phoneNumber);
    
    const response = await authApi.post('/auth/whatsapp/send-otp', {
      phoneNumber: request.phoneNumber
    });
    
    return {
      success: true,
      message: 'Код отправлен в WhatsApp',
      expiresIn: response.data.expiresIn || 300 // 5 минут по умолчанию
    };
    
  } catch (error: any) {
    console.error('❌ Ошибка отправки OTP:', error.response?.data || error.message);
    
    // Если backend недоступен, создаем мок для разработки
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.warn('🔧 Backend недоступен, используем мок OTP для разработки');
      return createMockOTP(request.phoneNumber);
    }
    
    throw new Error(error.response?.data?.message || 'Ошибка отправки кода');
  }
};

/**
 * Verify OTP code and login via WhatsApp
 * @param {WhatsAppVerifyRequest} request - Phone number and OTP code
 * @returns {Promise<AuthResponse>} Auth response with token and user data
 */
export const verifyWhatsAppOTP = async (request: WhatsAppVerifyRequest): Promise<AuthResponse> => {
  try {
    console.log('🔐 Верификация OTP для:', request.phoneNumber);
    
    const response = await authApi.post('/auth/whatsapp/verify-otp', {
      phoneNumber: request.phoneNumber,
      otpCode: request.otpCode
    });
    
    const authData: AuthResponse = {
      token: response.data.token,
      user: {
        id: response.data.user.id || response.data.user._id,
        email: response.data.user.email || `${request.phoneNumber}@whatsapp.local`,
        fullName: response.data.user.fullName || response.data.user.name || 'WhatsApp User',
        role: response.data.user.role || 'staff'
      }
    };
    
    // Сохраняем токен и данные пользователя
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    localStorage.setItem('phoneNumber', request.phoneNumber);
    
    console.log('✅ Успешный вход через WhatsApp:', authData.user.fullName);
    return authData;
    
  } catch (error: any) {
    console.error('❌ Ошибка верификации OTP:', error.response?.data || error.message);
    
    // Если backend недоступен, создаем мок-авторизацию
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.warn('🔧 Backend недоступен, используем мок-верификацию для разработки');
      return createMockWhatsAppAuth(request);
    }
    
    throw new Error(error.response?.data?.message || 'Неверный код или истек срок действия');
  }
};

/**
 * Login user and get token (классический способ)
 * @param {LoginCredentials} credentials - User credentials
 * @returns {Promise<AuthResponse>} Auth response with token and user data
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    console.log('🔐 Попытка входа для:', credentials.email);
    
    const response = await authApi.post('/auth/login', credentials);
    
    const authData: AuthResponse = {
      token: response.data.token,
      user: {
        id: response.data.user.id || response.data.user._id,
        email: response.data.user.email,
        fullName: response.data.user.fullName || response.data.user.name,
        role: response.data.user.role || 'staff'
      }
    };
    
    // Сохраняем токен и данные пользователя
    localStorage.setItem('token', authData.token);
    localStorage.setItem('user', JSON.stringify(authData.user));
    
    console.log('✅ Успешный вход:', authData.user.fullName);
    return authData;
    
  } catch (error: any) {
    console.error('❌ Ошибка входа:', error.response?.data || error.message);
    
    // Если backend не настроен, создаем мок-авторизацию для разработки
    if (error.code === 'ECONNREFUSED' || error.response?.status === 404) {
      console.warn('🔧 Backend недоступен, используем мок-авторизацию для разработки');
      return createMockAuth(credentials);
    }
    
    throw new Error(error.response?.data?.message || 'Ошибка авторизации');
  }
};

/**
 * Logout user and clear token
 */
export const logout = async (): Promise<void> => {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Уведомляем backend о выходе (опционально)
      await authApi.post('/auth/logout', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    }
  } catch (error) {
    console.warn('Ошибка при выходе на backend:', error);
  } finally {
    // Очищаем локальные данные в любом случае
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('🚪 Пользователь вышел из системы');
  }
};

/**
 * Get current user from token
 * @returns {User | null} Current user or null if not authenticated
 */
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      return null;
    }
    
    return JSON.parse(userStr);
  } catch (error) {
    console.error('Ошибка получения текущего пользователя:', error);
    return null;
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has valid token
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  
  return !!(token && user);
};

/**
 * Refresh token if needed
 * @returns {Promise<string | null>} New token or null if refresh failed
 */
export const refreshToken = async (): Promise<string | null> => {
  try {
    const currentToken = localStorage.getItem('token');
    
    if (!currentToken) {
      return null;
    }
    
    const response = await authApi.post('/auth/refresh', {}, {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    
    const newToken = response.data.token;
    localStorage.setItem('token', newToken);
    
    console.log('🔄 Токен обновлен');
    return newToken;
    
  } catch (error) {
    console.error('Ошибка обновления токена:', error);
    
    // Если не удалось обновить токен, очищаем данные
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    return null;
  }
};

/**
 * Create mock OTP for development
 * @param {string} phoneNumber - Phone number
 * @returns {OTPResponse} Mock OTP response
 */
const createMockOTP = (phoneNumber: string): OTPResponse => {
  // Сохраняем мок-код для последующей верификации
  const mockCode = '1234';
  localStorage.setItem('mockOTP', JSON.stringify({
    phoneNumber,
    code: mockCode,
    expiresAt: Date.now() + 300000 // 5 минут
  }));
  
  console.log(`🧪 Мок OTP код для ${phoneNumber}: ${mockCode}`);
  
  return {
    success: true,
    message: `Мок-код отправлен на ${phoneNumber}. Используйте код: ${mockCode}`,
    expiresIn: 300
  };
};

/**
 * Create mock WhatsApp authentication for development
 * @param {WhatsAppVerifyRequest} request - Verify request
 * @returns {AuthResponse} Mock auth response
 */
const createMockWhatsAppAuth = (request: WhatsAppVerifyRequest): AuthResponse => {
  console.log('🔍 Начало мок-верификации для:', request);
  
  // Проверяем мок-код
  const mockOTPStr = localStorage.getItem('mockOTP');
  console.log('💾 Мок OTP из localStorage:', mockOTPStr);
  
  if (mockOTPStr) {
    const mockOTP = JSON.parse(mockOTPStr);
    console.log('📊 Парсинг мок OTP:', mockOTP);
    
    console.log('🔍 Проверка условий:');
    console.log('  - Номер совпадает:', mockOTP.phoneNumber === request.phoneNumber, `(${mockOTP.phoneNumber} === ${request.phoneNumber})`);
    console.log('  - Код совпадает:', mockOTP.code === request.otpCode, `(${mockOTP.code} === ${request.otpCode})`);
    console.log('  - Код не истек:', Date.now() < mockOTP.expiresAt, `(${Date.now()} < ${mockOTP.expiresAt})`);
    
    if (mockOTP.phoneNumber === request.phoneNumber && 
        mockOTP.code === request.otpCode && 
        Date.now() < mockOTP.expiresAt) {
      
      console.log('✅ Все условия выполнены, создаем авторизацию');
      
      // Очищаем использованный код
      localStorage.removeItem('mockOTP');
      
      const mockToken = `whatsapp-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      const mockUser: User = {
        id: `whatsapp-user-${request.phoneNumber.replace(/\D/g, '')}`,
        email: `${request.phoneNumber}@whatsapp.local`,
        fullName: `Пользователь ${request.phoneNumber}`,
        role: request.phoneNumber.includes('777') ? 'admin' : 'staff' // 777 в номере = админ
      };
      
      const authData: AuthResponse = {
        token: mockToken,
        user: mockUser
      };
      
      // Сохраняем мок-данные
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      localStorage.setItem('phoneNumber', request.phoneNumber);
      
      console.log('🧪 Создана мок WhatsApp авторизация:', mockUser);
      console.log('🔑 Токен сохранен:', mockToken);
      
      return authData;
    } else {
      console.error('❌ Одно или несколько условий не выполнены');
    }
  } else {
    console.error('❌ Мок OTP не найден в localStorage');
  }
  
  throw new Error('Неверный код или истек срок действия');
};

/**
 * Create mock authentication for development
 * @param {LoginCredentials} credentials - User credentials
 * @returns {AuthResponse} Mock auth response
 */
const createMockAuth = (credentials: LoginCredentials): AuthResponse => {
  const mockToken = `mock-token-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  
  const mockUser: User = {
    id: 'mock-user-1',
    email: credentials.email,
    fullName: credentials.email.split('@')[0] || 'Тестовый пользователь',
    role: credentials.email.includes('admin') ? 'admin' : 'staff'
  };
  
  const authData: AuthResponse = {
    token: mockToken,
    user: mockUser
  };
  
  // Сохраняем мок-данные
  localStorage.setItem('token', authData.token);
  localStorage.setItem('user', JSON.stringify(authData.user));
  
  console.log('🧪 Создана мок-авторизация:', mockUser);
  return authData;
};

/**
 * Validate token with backend
 * @returns {Promise<boolean>} True if token is valid
 */
export const validateToken = async (): Promise<boolean> => {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return false;
    }
    
    await authApi.get('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return true;
    
  } catch (error) {
    console.warn('Токен недействителен:', error);
    return false;
  }
};

// Авторизация по персональному коду
export const loginWithPersonalCode = async (request: PersonalCodeLoginRequest): Promise<AuthResponse> => {
  try {
    console.log('🔐 Авторизация по персональному коду:', request.phoneNumber);
    
    const response = await authApi.post('/auth/personal-code', request);
    
    if (response.data.success && response.data.token) {
      // Сохраняем токен
      localStorage.setItem('token', response.data.token);
      
      console.log('✅ Успешная авторизация по персональному коду');
      
      return {
        token: response.data.token,
        user: {
          id: response.data.user.id,
          email: response.data.user.phone,
          fullName: response.data.user.fullName,
          role: response.data.user.role
        }
      };
    } else {
      throw new Error(response.data.message || 'Ошибка авторизации');
    }
  } catch (error: any) {
    console.error('❌ Ошибка авторизации по персональному коду:', error);
    throw new Error(error.response?.data?.error || error.message || 'Ошибка сервера');
  }
};

// Генерация персонального кода
export const generatePersonalCode = async (request: GeneratePersonalCodeRequest): Promise<PersonalCodeResponse> => {
  try {
    console.log('🔑 Генерация персонального кода для пользователя:', request.userId);
    
    const response = await authApi.post('/auth/generate-personal-code', request, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    console.log('✅ Персональный код сгенерирован:', response.data.personalCode);
    
    return response.data;
  } catch (error: any) {
    console.error('❌ Ошибка генерации персонального кода:', error);
    throw new Error(error.response?.data?.error || error.message || 'Ошибка сервера');
  }
};
