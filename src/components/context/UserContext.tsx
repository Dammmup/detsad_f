import React from 'react';
import axios from 'axios';
import config from '../../config';
import { showSnackbar } from '../Snackbar';

// Тестовые данные пользователя (перенесено из mock.ts)
const mockUser = {
  avatars: [],
  id: '98cea92c-84e5-4c0d-ac21-9998f4b23883',
  firstName: 'Admin',
  authenticationUid: null,
  avatar: null,
  createdAt: '2020-05-12T11:04:00.864Z',
  createdById: null,
  deletedAt: null,
  disabled: false,
  email: 'admin@flatlogic.com',
  emailVerificationToken: null,
  emailVerificationTokenExpiresAt: null,
  emailVerified: true,
  importHash: null,
  lastName: null,
  password: '$2b$12$EFuj2XoxivlGr.oiIvnvDulsE5iIBTngrLlrXMM/PkO//iInslWNW',
  passwordResetToken: null,
  passwordResetTokenExpiresAt: null,
  phoneNumber: null,
  provider: 'local',
  role: 'admin',
  updatedAt: '2020-05-12T11:04:00.864Z',
  updatedById: null,
};

// Простая функция для декодирования JWT токена в браузере
// (не проверяет подпись, только декодирует payload)
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

interface UserState {
  isAuthenticated?: () => boolean;
  currentUser?: any;
  isFetching?: boolean;
  errorMessage?: string;
}

let UserStateContext = React.createContext<UserState | null>(null);
let UserDispatchContext = React.createContext<React.Dispatch<any> | null>(null);

function userReducer(state: any, action: { type: any; payload?: any; }) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        ...action.payload,
      };
    case 'REGISTER_REQUEST':
    case 'RESET_REQUEST':
    case 'PASSWORD_RESET_EMAIL_REQUEST':
      return {
        ...state,
        isFetching: true,
        errorMessage: '',
      };
    case 'SIGN_OUT_SUCCESS':
      return { ...state };
    case 'AUTH_INIT_ERROR':
      return Object.assign({}, state, {
        currentUser: null,
        loadingInit: false,
      });
    case 'REGISTER_SUCCESS':
    case 'RESET_SUCCESS':
    case 'PASSWORD_RESET_EMAIL_SUCCESS':
      return Object.assign({}, state, {
        isFetching: false,
        errorMessage: '',
      });
    case 'AUTH_FAILURE':
      return Object.assign({}, state, {
        isFetching: false,
        errorMessage: action.payload,
      });
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

function UserProvider({ children }: { children: React.ReactNode; }) {
  let [state, dispatch] = React.useReducer(userReducer, {
    isAuthenticated: () => {
      // Авторизован, если в localStorage есть объект user
      return !!localStorage.getItem('user');
    },
    isFetching: false,
    errorMessage: '',
    currentUser: null,
    loadingInit: true,
  });

  return (
    <UserStateContext.Provider value={state}>
      <UserDispatchContext.Provider value={dispatch}>
        {children}
      </UserDispatchContext.Provider>
    </UserStateContext.Provider>
  );
}

function useUserState() {
  let context = React.useContext(UserStateContext);
  if (context === undefined) {
    throw new Error('useUserState must be used within a UserProvider');
  }
  return context;
}
const loginUser = async (
  dispatch: React.Dispatch<any>,
  login: string,
  password: string,
  navigate: any,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | boolean | null) => void,
  social: string = '',
): Promise<void> => {
  setError(false);
  setIsLoading(true);
  // We check if app runs with backend mode
  if (!config.isBackend) {
    setError(null);
    await doInit(dispatch);
    setIsLoading(false);
    receiveToken('token', dispatch);
  } else {
    if (!!social) {
      window.location.href =
        config.baseURLApi +
        '/auth/signin/' +
        social +
        '?app=' +
        config.redirectUrl;
    } else if (login.length > 0 && password.length > 0) {
      axios
        .post('/auth/signin/local', { email: login, password })
        .then((res) => {
          const token = res.data;
          setError(null);
          setIsLoading(false);
          receiveToken(token, dispatch);
          doInit(dispatch);
        })
        .catch(() => {
          setError(true);
          setIsLoading(false);
        });
    } else {
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  }
}
function useUserDispatch() {
  let context = React.useContext(UserDispatchContext);
  if (context === undefined) {
    throw new Error('useUserDispatch must be used within a UserProvider');
  }
  return context;
}
const signOut = (dispatch: React.Dispatch<any>, navigate: any): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('user_id');
  document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  axios.defaults.headers.common['Authorization'] = '';
  dispatch({ type: 'SIGN_OUT_SUCCESS' });
  navigate('/login');
}
export { UserProvider, useUserState, useUserDispatch, loginUser, signOut };

// ###########################################################



export const sendPasswordResetEmail = (email: string) => {
  return (dispatch: React.Dispatch<any>) => {
    if (!config.isBackend) {
      return;
    } else {
      dispatch({
        type: 'PASSWORD_RESET_EMAIL_REQUEST',
      });
      axios
        .post('/auth/send-password-reset-email', { email })
        .then((res) => {
          dispatch({
            type: 'PASSWORD_RESET_EMAIL_SUCCESS',
          });
          showSnackbar({
            type: 'success' ,
            message: 'Email with resetting instructions has been sent',
          });
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    }
  };
}



export const receiveToken = (token: string, dispatch: React.Dispatch<any>): void => {
  let user;

  // We check if app runs with backend mode
  if (config.isBackend) {
    const decodedToken = decodeJWT(token);
    user = decodedToken?.user;
    delete user.id;
  } else {
    user = {
      email: config.auth.email,
    };
  }

  delete user.id;
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('theme', 'default');
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
  dispatch({ type: 'LOGIN_SUCCESS' });
}

export const findMe = async () => {
  if (config.isBackend) {
    const response = await axios.get('/auth/me');
    return response.data;
  } else {
    return mockUser;
  }
}

export const authError = (payload: any) => {
  return {
    type: 'AUTH_FAILURE',
    payload,
  };
}

export const doInit = async (dispatch: React.Dispatch<any>): Promise<void> => {
    let currentUser = null;
    if (!config.isBackend) {
      currentUser = mockUser;

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          currentUser,
        },
      });
    } else {
      try {
        let token = localStorage.getItem('token');
        if (token) {
          currentUser = await findMe();
        }
        sessionStorage.setItem('user_id', currentUser.id);
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            currentUser,
          },
        });
      } catch (error) {
        console.log(error);

        dispatch({
          type: 'AUTH_INIT_ERROR',
          payload: error,
        });
    }
  }
};

export const registerUser = (
  dispatch: React.Dispatch<any>,
  login: string,
  password: string,
  navigate: any,
  setIsLoading: (loading: boolean) => void,
  setError: (error: string | boolean | null) => void,
  social: string = '',
): void => {
  if (!config.isBackend) {
    navigate('/login');
  } else {
    dispatch({
      type: 'REGISTER_REQUEST',
    });
    if (login.length > 0 && password.length > 0) {
      axios
        .post('/auth/signup', { email: login, password })
        .then((res) => {
          dispatch({
            type: 'REGISTER_SUCCESS',
          });
          showSnackbar({
            type: 'success',
            message:
              "You've been registered successfully. Please check your email for verification link",
          });
          navigate('/login');
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    } else {
      dispatch(authError('Something was wrong. Try again'));
    }
  }
}

export const verifyEmail = (token: string, navigate: any) => {
  if (!config.isBackend) {
    navigate('/login');
  } else {
    axios
      .put('/auth/verify-email', { token: token })
      .then((verified) => {
        if (verified) {
          showSnackbar({
            type: 'success',
            message: 'Your email was verified',
          });
        }
      })
      .catch((err) => {
        showSnackbar({ type: 'error', message: err.response });
      })
      .finally(() => {
        navigate('/login');
      });
  }
}

export const resetPassword = (token: string, password: string, navigate: any) => {
  return (dispatch: React.Dispatch<any>) => {
    if (!config.isBackend) {
      navigate('/login');
    } else {
      dispatch({
        type: 'RESET_REQUEST',
      });
      axios
        .put('/auth/password-reset', { token, password })
        .then((res) => {
          dispatch({
            type: 'RESET_SUCCESS',
          });
          showSnackbar({
            type: 'success',
            message: 'Password has been updated',
          });
          navigate('/login');
        })
        .catch((err) => {
          dispatch(authError(err.response.data));
        });
    }
  };
}
