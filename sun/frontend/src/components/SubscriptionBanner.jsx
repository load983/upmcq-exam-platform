// ================== components/SubscriptionBanner.jsx ==================
// শিক্ষকের ড্যাশবোর্ডের উপরে সাবস্ক্রিপশনের বাকি মেয়াদ দেখায়
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function SubscriptionBanner({ status: given }) {
  const { t, locale } = useLanguage();
  const [fetched, setFetched] = useState(null);
  const status = given || fetched;

  useEffect(() => {
    if (given) return;
    axiosClient.get('/subscription/me').then(({ data }) => setFetched(data.status)).catch(() => {});
  }, []);

  if (!status) return null;

  const date = status.expiresAt ? new Date(status.expiresAt).toLocaleDateString(locale) : '';
  let cls = 'bg-green-50 text-green-800 border-green-200';
  let text = t('banner.active', { days: status.daysLeft, date });
  let cta = null;

  if (status.state === 'active' && status.isTrial) {
    cls = 'bg-blue-50 text-blue-800 border-blue-200';
    const on = (status.features || []).map((k) => t(`feat.${k}.label`)).join(', ');
    text = t('banner.trial', { days: status.daysLeft, date, features: on || t('banner.none.features') });
    cta = t('banner.subscribe');
  } else if (status.state === 'active' && status.daysLeft <= 7) {
    cls = 'bg-yellow-50 text-yellow-800 border-yellow-200';
    text = t('banner.expiring', { days: status.daysLeft, date });
    cta = t('banner.renew');
  } else if (status.state === 'expired') {
    cls = 'bg-red-50 text-red-800 border-red-200';
    text = t('banner.expired');
    cta = t('banner.renew');
  } else if (status.state === 'suspended') {
    cls = 'bg-red-50 text-red-800 border-red-200';
    text = t('banner.suspended');
  } else if (status.state === 'none') {
    cls = 'bg-blue-50 text-blue-800 border-blue-200';
    text = t('banner.noSub');
    cta = t('banner.subscribe');
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
