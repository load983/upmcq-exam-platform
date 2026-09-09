// ================== components/DarkModeToggle.jsx ==================
// Dark Mode অন/অফ করার বাটন — html ট্যাগে 'dark' ক্লাস টগল করে
import React, { useEffect, useState } from 'react';

export default function DarkModeToggle() {
  const [dark, setDark] = useState(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <button
      onClick={() => setDark((d) => !d)}
      className="px-3 py-1.5 rounded-lg text-sm border border-gray-300 dark:border-gray-600 dark:text-gray-200"
      title="Dark Mode টগল করো"
    >
      {dark ? '☀️ Light' : '🌙 Dark'}
    </button>
  );
}
