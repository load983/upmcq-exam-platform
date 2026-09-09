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
  const isLow = remaining < 60000; // ১ মিনিটের কম থাকলে লাল দেখাবে

  return (
    <div className={`font-mono text-lg font-bold px-3 py-1 rounded-lg ${isLow ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-primary-100 text-primary-700'}`}>
      ⏱ {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}
