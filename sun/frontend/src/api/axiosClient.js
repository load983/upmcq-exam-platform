// ================== api/axiosClient.js ==================
import axios from 'axios';

const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // ১. ইউআরএল এর শেষ থেকে স্ল্যাশ (/) এবং /api ট্রিম করা
  const cleanUrl = envUrl.replace(/\/+$/, '').replace(/\/api$/, '');
  
  // ২. শুধুমাত্র একটি পরিচ্ছন্ন /api যুক্ত করে baseURL দেওয়া
  return `${cleanUrl}/api`;
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

// 💳 সাবস্ক্রিপশন না থাকলে/মেয়াদ শেষ হলে ব্যাকএন্ড 402 দেয় — শিক্ষককে সাবস্ক্রিপশন পেজে পাঠানো হয়
axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const d = error.response?.data;
    if (error.response?.status === 402 && d?.code === 'SUBSCRIPTION_REQUIRED') {
      if (!window.location.pathname.startsWith('/teacher/subscribe')) {
        window.location.assign('/teacher/subscribe');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
