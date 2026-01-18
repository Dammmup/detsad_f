import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import { App } from './app/App';
import * as serviceWorker from './serviceWorker';
import { LayoutProvider } from './app/context/LayoutContext';

import { TimeTrackingProvider } from './app/context/TimeTrackingContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import './sentry';
import theme from './shared/theme';
import { setupAxios } from './shared/api/axiosSetup';

// Initialize Axios
setupAxios();

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <LayoutProvider>
            <TimeTrackingProvider>
              <App />
              <ToastContainer
                position='top-right'
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme='light'
              />
            </TimeTrackingProvider>
          </LayoutProvider>
        </ThemeProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  console.error('Failed to find the root element');
}

serviceWorker.unregister();
