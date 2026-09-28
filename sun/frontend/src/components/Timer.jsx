// ================== components/Timer.jsx ==================
// Live countdown timer — সময় শেষ হলে onTimeUp() কল করে (অটো সাবমিটের জন্য)
import React, { useEffect, useRef, useState } from 'react';

export default function Timer({ startedAt, totalMinutes, onTimeUp }) {
  const endTime = useRef(new Date(startedAt).getTime() + totalMinutes * 60 * 1000);
  const [remaining, setRemaining] = useState(Math.max(0, endTime.current - Date.now()));

  useEffect(() => {
    const interval = setInterval(() => {
      const left = endTime.current - Date.now();
      if (left <= 0) {
        clearInterval(interval);
        setRemaining(0);
        onTimeUp();
      } else {
        setRemaining(left);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [onTimeUp]);

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const isCritical = remaining < 60000; // ১ মিনিটের কম থাকলে লাল
  const isWarning = !isCritical && remaining < 5 * 60000; // ৫ মিনিটের কম থাকলে অ্যাম্বার

  const cls = isCritical
    ? 'bg-red-100 text-red-700 animate-pulse dark:bg-red-500/10 dark:text-red-400'
    : isWarning
    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
    : 'bg-primary-100 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300';

  return (
    <div className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-lg font-bold ${cls}`}>
      ⏱ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
