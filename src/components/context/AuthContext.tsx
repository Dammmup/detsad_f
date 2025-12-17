import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { getCurrentUser, isAuthenticated, logout } from '../../services/auth';
import { User } from '../../types/common';
import { useNavigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';


interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [logoutInProgress, setLogoutInProgress] = useState(false);

  const checkAuthStatus = async () => {
    setLoading(true);

    try {
      const currentUser = getCurrentUser();
      const authenticated = await isAuthenticated();

      if (currentUser && authenticated) {
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

  useEffect(() => {
    checkAuthStatus();
  }, []);


  const handleLogin = (userData: User, token: string) => {
    setUser(userData);
    setIsLoggedIn(true);

    localStorage.setItem('user', JSON.stringify(userData));
    if (token) {
      localStorage.setItem('auth_token', token);
    }

    console.log('🔐 Пользователь вошел в систему:', userData.fullName);
  };


  const handleLogout = async () => {

    if (logoutInProgress) {
      console.log('⚠️ Выход уже выполняется, повторный вызов отклонён.');
      return;
    }

    setLogoutInProgress(true);

    try {
      await logout();
      console.log('🚪 Пользователь вышел из системы');

      setUser(null);
      setIsLoggedIn(false);


      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');


      window.location.href = '/login';
    } catch (error) {
      console.error('Ошибка при выходе:', error);


      setUser(null);
      setIsLoggedIn(false);
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
    } finally {
      setLogoutInProgress(false);
    }
  };

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      const currentUser = getCurrentUser();
      const authenticated = await isAuthenticated();

      if (currentUser && authenticated) {
        if (!user) {
          setUser(currentUser);
          setIsLoggedIn(true);
        }
        return true;
      }


      setUser(null);
      setIsLoggedIn(false);
      return false;
    } catch (error) {
      console.error('Ошибка проверки авторизации:', error);
      return false;
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    isLoggedIn,
    loading,
    login: handleLogin,
    logout: handleLogout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};


interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isLoggedIn, loading, checkAuth } = useAuth();
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      if (loading) return;

      const authValid = await checkAuth();

      if (!authValid) {
        console.log('🚫 Пользователь не авторизован, редиректим');

        window.location.href = '/login';
      } else {
        setChecking(false);
      }
    };

    verifyAuth();
  }, [loading, checkAuth, navigate]);


  if (loading && checking) {
    return (
      <Box
        display='flex'
        justifyContent='center'
        alignItems='center'
        minHeight='100vh'
        minWidth='100vw'
        position='fixed'
        top='0'
        left='0'
        zIndex={9999}
        bgcolor='background.default'
      >
        <CircularProgress size={60} color='primary' />
      </Box>
    );
  }


  if (!loading && !isLoggedIn) {
    return null;
  }


  if (!checking) {
    return <>{children}</>;
  }


  return (
    <Box
      display='flex'
      justifyContent='center'
      alignItems='center'
      minHeight='100vh'
      minWidth='100vw'
      bgcolor='background.default'
    >
      <CircularProgress size={60} color='primary' />
    </Box>
  );
};
