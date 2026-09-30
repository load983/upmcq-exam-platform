// ================== pages/student/Notifications.jsx ==================
// শিক্ষকদের মেসেজ ও নতুন পরীক্ষার নোটিফিকেশন তালিকা (স্টুডেন্ট)
import { Avatar } from '../admin/adminUi';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';
import { getPushState, enablePush, disablePush } from '../../utils/push';

export default function Notifications() {
  const { t, locale } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushState, setPushState] = useState('off');
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState('');

  useEffect(() => {
    axiosClient
      .get('/messages/student/feed')
      .then(({ data }) => {
        setItems(data.items || []);
        axiosClient.post('/messages/student/seen').catch(() => {}); // দেখা হয়ে গেছে
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
    getPushState().then(setPushState);
  }, []);

  const togglePush = async () => {
    setBusy(true);
    try {
      setPushState(pushState === 'on' ? await disablePush() : await enablePush());
    } catch {
      setPushState('off');
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d) => new Date(d).toLocaleString(locale || undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const pushNote = {
    unsupported: t('msg.push.unsupported'),
    'server-off': t('msg.push.serverOff'),
    denied: t('msg.push.denied'),
  }[pushState];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight dark:text-white sm:text-3xl">🔔 {t('msg.notifications')}</h1>

      {/* ডিভাইস নোটিফিকেশন চালু/বন্ধ */}
      <div className="card mb-6 flex flex-wrap items-center justify-between gap-3 !bg-primary-50/60 p-4 dark:!bg-primary-500/5">
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium dark:text-white">{t('msg.push.title')}</p>
          <p>{pushNote || t('msg.push.desc')}</p>
        </div>
        {!pushNote && (
          <button onClick={togglePush} disabled={busy} className={pushState === 'on' ? 'btn-secondary' : 'btn-primary'}>
            {busy ? '...' : pushState === 'on' ? t('msg.push.turnOff') : t('msg.push.turnOn')}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500">{t('common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-gray-500 dark:text-gray-400">{t('msg.emptyStudent')}</p>
      ) : (
        <div className="space-y-3">
          {items.map((m) => (
            <div key={m._id} className={`card flex gap-3 p-4 sm:p-5 ${m.isNew ? 'border-l-4 border-l-primary-500' : ''}`}>
              <Avatar name={m.teacherName || '?'} />
              <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                  {m.kind === 'exam' ? '📝' : '💬'} {m.teacherName}
                  {m.classNames.length > 0 && <span className="ml-1 font-normal">· {m.classNames.join(', ')}</span>}
                </span>
                <span>
                  {fmt(m.createdAt)}
                  {m.editedAt && <span className="ml-1 italic">({t('msg.edited')})</span>}
                  {m.isNew && <span className="ml-2 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{t('msg.new')}</span>}
                </span>
              </div>
              {m.text && <p className="whitespace-pre-wrap break-words text-gray-800 dark:text-gray-100">{m.text}</p>}
              {m.imageUrl && (
                <img
                  src={m.imageUrl}
                  alt=""
                  loading="lazy"
                  onClick={() => setZoom(m.imageUrl)}
                  className="mt-3 max-h-80 w-full cursor-zoom-in rounded-xl object-cover"
                />
              )}
              {m.kind === 'exam' && m.examCode && m.examStatus === 'published' && (
                <Link to={`/join/${m.examCode}`} className="btn-primary mt-3 inline-block text-sm">
                  {t('msg.openExam')}
                </Link>
              )}
              </div>
            </div>
          ))}
        </div>
      )}

      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setZoom('')}>
          <img src={zoom} alt="" className="max-h-full max-w-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
