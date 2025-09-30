import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {  getCurrentUser, isAuthenticated, logout } from '../../services/auth';
import { User } from '../../types/common';
// Интерфейс контекста авторизации
interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (user: User, token: string) => void; // token теперь не используется при httpOnly cookie, но оставляем для совместимости
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

// Создаем контекст
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Провайдер контекста
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const checkAuthStatus = async () => {
    setLoading(true);
    
    try {
      const currentUser = getCurrentUser();
      const authenticated = await isAuthenticated(); // isAuthenticated теперь асинхронная функция
      
      if (currentUser && authenticated) {
        // Если есть пользователь и токен валиден, считаем авторизованным
        setUser(currentUser);
        setIsLoggedIn(true);
        console.log('✅ Пользователь авторизован:', currentUser.fullName);
      } else {
        console.log('❌ Пользователь не авторизован');
        setUser(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      setUser(null);
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };
  // Проверка авторизации при загрузке
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Проверка статуса авторизации


  // Вход в систему
  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    setIsLoggedIn(true);
    
    // Сохраняем только пользователя в localStorage
    // Токен хранится в httpOnly cookie и не доступен из JavaScript
    localStorage.setItem('user', JSON.stringify(userData));
    
    console.log('🔐 Пользователь вошел в систему:', userData.fullName);
  };

  // Выход из системы
  const handleLogout = async () => {
    try {
      await logout(); // Вызываем API logout
      
      setUser(null);
      setIsLoggedIn(false);
      
      console.log('🚪 Пользователь вышел из системы');
      
      // Перенаправляем на страницу входа
      window.location.href = '/login';
      
    } catch (error) {
      console.error('Ошибка при выходе:', error);
      
      // В любом случае очищаем локальные данные
      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('user');
    }
  };

  // Проверка авторизации (для внешнего использования)
  const checkAuth = async (): Promise<boolean> => {
    try {
      const currentUser = getCurrentUser();
      const authenticated = await isAuthenticated(); // isAuthenticated теперь асинхронная функция
      
      if (currentUser && authenticated) {
        if (!user) {
          setUser(currentUser);
          setIsLoggedIn(true);
        }
        return true;
      }
      
      // Если проверка не прошла, выходим
      await handleLogout();
      return false;
      
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    isLoggedIn,
    loading,
    login: handleLogin,
    logout: handleLogout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Хук для использования контекста авторизации
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

// Компонент для защищенных маршрутов
interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading, checkAuth } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!isLoggedIn && !loading) {
        const authValid = await checkAuth();
        
        if (!authValid) {
          // Перенаправляем на страницу входа
          window.location.href = '/login';
          return;
        }
      }
      
      setChecking(false);
    };

    verifyAuth();
  }, [isLoggedIn, loading, checkAuth]);

  // Показываем загрузку во время проверки
  if (loading || checking) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.9)',
          padding: '2rem',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ margin: 0, color: '#666' }}>Проверка авторизации...</p>
        </div>
      </div>
    );
  }

  // Если не авторизован, не показываем контент (перенаправление уже произошло)
  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
};
