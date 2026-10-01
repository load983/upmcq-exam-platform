// স্টুডেন্টের Navbar-এ 🔔 আইকন + নতুন মেসেজের সংখ্যা (প্রতি ৬০ সেকেন্ডে ও ট্যাবে ফিরলে আপডেট হয়)
import React, { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function NotificationBell() {
  const { t } = useLanguage();
  const location = useLocation();
  const [count, setCount] = useState(0);

  const load = useCallback(() => {
    axiosClient.get('/messages/student/unread-count').then(({ data }) => setCount(data.count || 0)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    const onVis = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [load]);

  // নোটিফিকেশন পেজ থেকে বের হলে সংখ্যা আবার আনো
  useEffect(() => {
    if (location.pathname !== '/notifications') load();
    else setCount(0);
  }, [location.pathname, load]);

  return (
    <Link
      to="/notifications"
      aria-label={t('msg.notifications')}
      className="relative grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-600 hover:text-primary-600 dark:border-white/10 dark:text-gray-300"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" />
      </svg>
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid min-w-[18px] place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-[18px] text-white">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
