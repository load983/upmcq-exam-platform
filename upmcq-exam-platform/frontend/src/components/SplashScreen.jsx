// ================== components/SplashScreen.jsx ==================
// সাইট প্রথমবার লোড হওয়ার সময় দেখানো লোগো ইন্ট্রো অ্যানিমেশন।
// "+" আইকন মর্ফ হয়ে চেকমার্কে পরিণত হয়, সাথে ব্যাকগ্রাউন্ড কালার
// ডার্ক থেকে হালকা নীল-ধূসর টোনে ট্রানজিশন করে (রেফারেন্স ভিডিও অনুযায়ী)।
// প্রতি ব্রাউজার সেশনে একবারই দেখানো হয় (sessionStorage flag)।
import React, { useEffect, useState } from 'react';

const SESSION_KEY = 'upmcq-splash-shown';

export default function SplashScreen() {
  const [phase, setPhase] = useState('enter'); // enter -> morph -> done -> hidden
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (alreadyShown) return; // এই সেশনে আগেই দেখানো হয়েছে

    setMounted(true);
    sessionStorage.setItem(SESSION_KEY, '1');

    if (prefersReducedMotion) {
      // মোশন কমানো থাকলে সরাসরি লোগো দেখিয়ে দ্রুত সরিয়ে ফেলা
      setPhase('done');
      const t = setTimeout(() => setPhase('hidden'), 400);
      return () => clearTimeout(t);
    }

    const t1 = setTimeout(() => setPhase('morph'), 120);   // + আঁকা শেষে মর্ফ শুরু
    const t2 = setTimeout(() => setPhase('done'), 1500);   // কালার ট্রানজিশন সম্পন্ন
    const t3 = setTimeout(() => setPhase('hidden'), 2300); // পুরো স্প্ল্যাশ ফেড-আউট শুরু
    const t4 = setTimeout(() => setMounted(false), 2900);  // DOM থেকে সরিয়ে ফেলা

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className={`splash-overlay splash-${phase}`} role="status" aria-label="Loading UPMCQ">
      <div className="splash-mark">
        <span className="splash-box">
          <svg
            className="splash-icon"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* প্লাস চিহ্ন — শুরুতে দৃশ্যমান, পরে ফেড-আউট */}
            <path
              className="splash-plus"
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* চেকমার্ক — স্ট্রোক-ড্র অ্যানিমেশনে আঁকা হয় */}
            <path
              className="splash-check"
              d="M5 12.5L9.5 17L19 7"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="splash-text">UPMCQ</span>
      </div>
    </div>
  );
}
