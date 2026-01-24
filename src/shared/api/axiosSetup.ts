import axios from 'axios';

export const setupAxios = () => {
    // In Vite, use import.meta.env. We fall back to process.env for compatibility.
    // If neither is set, we use '/' in development to leverage the proxy.
    const apiUrl = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL;

    axios.defaults.baseURL = apiUrl || (import.meta.env.DEV ? '/' : 'http://localhost:8080');
    axios.defaults.headers.common['Content-Type'] = 'application/json';

    axios.interceptors.request.use(
        (config) => {
            const token = localStorage.getItem('auth_token');
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        },
    );

    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('user');
                localStorage.removeItem('auth_token');
                // Redirect to login page
                window.location.href = '/login';
            }
            return Promise.reject(error);
        },
    );
};
