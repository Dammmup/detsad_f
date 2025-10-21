import axios from 'axios';

console.log('REACT_APP_API_URL from env in base service:', process.env.REACT_APP_API_URL);
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://detsad-b.onrender.com',
});
console.log('Final axios baseURL in base service:', api.defaults.baseURL);

export default api;
