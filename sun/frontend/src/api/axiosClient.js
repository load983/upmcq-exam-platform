// ================== api/axiosClient.js ==================
import axios from 'axios';
import { translateMessage, getLang } from '../context/LanguageContext';

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
  // এক্সপোর্ট (Excel/PDF) যেন নির্বাচিত ভাষায় তৈরি হয়, তাই GET রিকোয়েস্টে বর্তমান ভাষা পাঠানো হয়
  if (!config.method || config.method.toLowerCase() === 'get') {
    config.params = { lang: getLang(), ...(config.params || {}) };
  }
  return config;
});

// 💳 সাবস্ক্রিপশন না থাকলে/মেয়াদ শেষ হলে ব্যাকএন্ড 402 দেয় — শিক্ষককে সাবস্ক্রিপশন পেজে পাঠানো হয়
axiosClient.interceptors.response.use(
  (res) => {
    // ব্যাকএন্ডের বাংলা মেসেজ বর্তমান ভাষায় (English নির্বাচিত থাকলে ইংরেজিতে) দেখানো হয়
    if (res.data && typeof res.data.message === 'string') res.data.message = translateMessage(res.data.message);
    return res;
  },
  (error) => {
    const d = error.response?.data;
    if (d && typeof d.message === 'string') d.message = translateMessage(d.message);
    if (error.response?.status === 402 && d?.code === 'SUBSCRIPTION_REQUIRED') {
      if (!window.location.pathname.startsWith('/teacher/subscribe')) {
        window.location.assign('/teacher/subscribe');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
