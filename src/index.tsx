import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
// Стили удалены для упрощения структуры
import {App} from './components/App';
import * as serviceWorker from './serviceWorker';
import { LayoutProvider } from './components/context/LayoutContext';
// UserProvider removed during refactoring
import { TimeTrackingProvider } from './components/context/TimeTrackingContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from '../src/config';

import { createHashHistory, createMemoryHistory } from 'history';

// Простая тема MUI для детского сада
const theme = createTheme({
  palette: {
    primary: {
      main: '#1890ff', // Antd синий
    },
    secondary: {
      main: '#52c41a', // Antd зеленый
    },
    success: {
      main: '#52c41a', // Зеленый
    },
    warning: {
      main: '#faad14', // Желтый
    },
    error: {
      main: '#ff4d4f', // Красный
    },
    background: {
      default: '#f0f2f5', // Antd фон
      paper: '#ffffff',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.85)',
      secondary: 'rgba(0, 0, 0, 0.45)',
    },
  },
  typography: {
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Убираем CAPS
          borderRadius: 8,
        },
      },
    },
  },
});


const history =
  typeof window !== 'undefined'
    ? createHashHistory()
    : createMemoryHistory({
        initialEntries: [],
      });

export function getHistory() {
  return history;
}

axios.defaults.baseURL = config.baseURLApi;
axios.defaults.headers.common['Content-Type'] = 'application/json';
const token = localStorage.getItem('token');
if (token) {
  axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
}

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LayoutProvider>
          <TimeTrackingProvider>
            <App />
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </TimeTrackingProvider>
        </LayoutProvider>
      </ThemeProvider>
    </Router>
    );
}

serviceWorker.unregister();
