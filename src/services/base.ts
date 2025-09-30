import axios from 'axios';

const api = axios.create({
  baseURL: process.env.API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : ''),
  withCredentials: true,
});

export default api;
