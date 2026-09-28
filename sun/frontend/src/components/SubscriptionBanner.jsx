// ================== components/SubscriptionBanner.jsx ==================
// শিক্ষকের ড্যাশবোর্ডের উপরে সাবস্ক্রিপশনের বাকি মেয়াদ দেখায়
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';

export default function SubscriptionBanner() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    axiosClient.get('/subscription/me').then(({ data }) => setStatus(data.status)).catch(() => {});
  }, []);

  if (!status) return null;

  const date = status.expiresAt ? new Date(status.expiresAt).toLocaleDateString('bn-BD') : '';
  let cls = 'bg-green-50 text-green-800 border-green-200';
  let text = `সাবস্ক্রিপশন চালু আছে — ${status.daysLeft} দিন বাকি (${date} পর্যন্ত)`;
  let cta = null;

  if (status.state === 'active' && status.daysLeft <= 7) {
    cls = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    text = `সাবস্ক্রিপশনের মেয়াদ আর ${status.daysLeft} দিন বাকি (${date})। মেয়াদ শেষ হলে তোমার ছাত্ররা পরীক্ষা দিতে পারবে না।`;
    cta = 'নবায়ন করো';
  } else if (status.state === 'expired') {
    cls = 'bg-red-50 text-red-800 border-red-200';
    text = 'সাবস্ক্রিপশনের মেয়াদ শেষ।';
    cta = 'নবায়ন করো';
  } else if (status.state === 'suspended') {
    cls = 'bg-red-50 text-red-800 border-red-200';
    text = 'তোমার সাবস্ক্রিপশন অ্যাডমিন স্থগিত করেছেন।';
  } else if (status.state === 'none') {
    cls = 'bg-blue-50 text-blue-800 border-blue-200';
    text = 'কোনো সাবস্ক্রিপশন নেই।';
    cta = 'সাবস্ক্রাইব করো';
  }

  return (
    <div className={`mb-5 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-4 py-3 text-sm ${cls}`}>
      <span>{text}</span>
      {cta && (
        <Link to="/teacher/subscribe" className="font-semibold underline">
          {cta}
        </Link>
      )}
    </div>
  );
}
