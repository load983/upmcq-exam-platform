// ================== components/DarkModeToggle.jsx ==================
import React, { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  // ১. আগের সেভ করা থিম অথবা সিস্টেমের থিম প্রেফারেন্স ডিটেক্ট করা
  const [dark, setDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // সিস্টেমে ডার্ক মোড এনাবল আছে কি না তা চেক করা
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((prev) => !prev)}
      className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors 
                 bg-white text-gray-800 border-gray-300 hover:bg-gray-100 
                 dark:bg-slate-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-slate-700"
      title="Dark Mode টগল করো"
    >
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
