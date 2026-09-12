// ================== api/axiosClient.js ==================
// একটাই axios instance — সব API কল এখান থেকে হবে, টোকেন অটো-অ্যাটাচ হয়
import axios from 'axios';

// VITE_API_URL-এর শেষে /api না থাকলে তা স্বয়ংক্রিয়ভাবে যুক্ত করার লজিক
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const cleanUrl = envUrl.replace(/\/+$/, ''); // শেষের স্ল্যাশ (/) সরিয়ে নেওয়া
  return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
};

const axiosClient = axios.create({
  baseURL: getBaseUrl(),
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && token !== 'undefined') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosClient;
