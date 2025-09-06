import React, { useState, useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Button,
  CircularProgress,
  Fade,
  Grid,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material';

// Styles
import useStyles from './styles';

// Logo
import logo from './logo.svg';

// Context
import {
  useUserDispatch,
  loginUser,
  registerUser,
  sendPasswordResetEmail,
  receiveToken,
  doInit
} from '../../context/UserContext';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 4 && hour <= 11) return 'Доброе утро';
  if (hour >= 12 && hour <= 16) return 'Добрый день';
  if (hour >= 17 && hour <= 23) return 'Добрый вечер';
  return 'Доброй ночи';
};

function Login({ history, location }) {
  const classes = useStyles();
  const tab = new URLSearchParams(location.search).get('tab');
  const userDispatch = useUserDispatch();

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTabId, setActiveTabId] = useState(Number(tab) || 0);
  const [nameValue, setNameValue] = useState('');
  const [loginValue, setLoginValue] = useState('');
  const [passwordValue, setPasswordValue] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgot, setIsForgot] = useState(false);

  // Handle token from URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    if (token) {
      receiveToken(token, userDispatch);
      doInit()(userDispatch);
    }
  }, [location.search, userDispatch]);

  // Form validation
  const isLoginFormValid = () => loginValue && passwordValue;
  const isRegisterFormValid = () => nameValue && loginValue && passwordValue;

  // Event handlers
  const handleLogin = () => {
    if (isLoginFormValid()) {
      loginUser(
        userDispatch,
        loginValue,
        passwordValue,
        history,
        setIsLoading,
        setError
      );
    }
  };

  const handleRegister = () => {
    if (isRegisterFormValid()) {
      registerUser(
        userDispatch,
        nameValue,
        loginValue,
        passwordValue,
        history,
        setIsLoading,
        setError
      );
    }
  };

  const handleForgotPassword = () => {
    if (forgotEmail) {
      sendPasswordResetEmail(forgotEmail)(userDispatch);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      if (isForgot) {
        handleForgotPassword();
      } else if (activeTabId === 0) {
        handleLogin();
      } else {
        handleRegister();
      }
    }
  };

  // Render the login/register form
  const renderAuthForm = () => {
    if (isForgot) {
      return (
        <div className={classes.form}>
          <Typography variant="h2" className={classes.greeting}>
            Восстановление пароля
          </Typography>
          <Typography variant="body1" className={classes.subGreeting}>
            Введите email, и мы вышлем вам ссылку для сброса пароля
          </Typography>
          
          <TextField
            variant="outlined"
            margin="normal"
            fullWidth
            id="forgot-email"
            label="Email"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            onKeyPress={handleKeyPress}
          />
          
          <div className={classes.formButtons}>
            {isLoading ? (
              <CircularProgress size={26} className={classes.loginLoader} />
            ) : (
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleForgotPassword}
                disabled={!forgotEmail || isLoading}
              >
                Отправить ссылку
              </Button>
            )}
            
            <Button
              fullWidth
              color="primary"
              onClick={() => setIsForgot(false)}
              className={classes.forgetButton}
            >
              Назад к входу
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className={classes.form}>
        <Tabs
          value={activeTabId}
          onChange={(e, id) => setActiveTabId(id)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          className={classes.tabs}
        >
          <Tab label="Вход" classes={{ root: classes.tab }} />
          <Tab label="Регистрация" classes={{ root: classes.tab }} />
        </Tabs>
        
        <Fade in={activeTabId === 0}>
          <div className={classes.tabContent}>
            <Typography variant="h1" className={classes.greeting}>
              {getGreeting()}
            </Typography>
            <Typography variant="body1" className={classes.subGreeting}>
              Добро пожаловать в систему управления детским садом
            </Typography>
            
            {error && (
              <Fade in={!!error}>
                <Typography color="error" className={classes.errorMessage}>
                  {error}
                </Typography>
              </Fade>
            )}
            
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="current-password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <div className={classes.formButtons}>
              {isLoading ? (
                <CircularProgress size={26} className={classes.loginLoader} />
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleLogin}
                  disabled={!isLoginFormValid() || isLoading}
                >
                  Войти
                </Button>
              )}
              
              <Button
                fullWidth
                color="primary"
                onClick={() => setIsForgot(true)}
                className={classes.forgetButton}
              >
                Забыли пароль?
              </Button>
            </div>
          </div>
        </Fade>
        
        <Fade in={activeTabId === 1}>
          <div className={classes.tabContent}>
            <Typography variant="h1" className={classes.greeting}>
              Регистрация
            </Typography>
            <Typography variant="body1" className={classes.subGreeting}>
              Создайте аккаунт, чтобы начать работу
            </Typography>
            
            {error && (
              <Fade in={!!error}>
                <Typography color="error" className={classes.errorMessage}>
                  {error}
                </Typography>
              </Fade>
            )}
            
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="name"
              label="ФИО"
              name="name"
              autoComplete="name"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              id="email"
              label="Email"
              name="email"
              autoComplete="email"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <TextField
              variant="outlined"
              margin="normal"
              fullWidth
              name="password"
              label="Пароль"
              type="password"
              id="password"
              autoComplete="new-password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            
            <div className={classes.formButtons}>
              {isLoading ? (
                <CircularProgress size={26} />
              ) : (
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  onClick={handleRegister}
                  disabled={!isRegisterFormValid() || isLoading}
                >
                  Зарегистрироваться
                </Button>
              )}
            </div>
          </div>
        </Fade>
      </div>
    );
  };

  return (
    <Grid container className={classes.container}>
      <div className={classes.logoContainer}>
        <img src={logo} alt="Logo" className={classes.logo} />
        <Typography variant="h4" className={classes.appName}>
          Детский сад
        </Typography>
      </div>
      
      <div className={!isForgot ? classes.formContainer : classes.forgotFormContainer}>
        {renderAuthForm()}
      </div>
      
      <Typography color="textSecondary" className={classes.copyright}>
        {`${new Date().getFullYear()} Система управления детским садом`}
      </Typography>
    </Grid>
  );
}

Login.propTypes = {
  history: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
};

export default withRouter(Login);
