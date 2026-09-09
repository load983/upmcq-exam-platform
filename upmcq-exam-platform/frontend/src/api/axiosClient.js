// ================== api/axiosClient.js ==================
// একটাই axios instance — সব API কল এখান থেকে হবে, টোকেন অটো-অ্যাটাচ হয়
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosClient;
