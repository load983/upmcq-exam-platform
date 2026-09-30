// ================== components/InstallPrompt.jsx ==================
// "হোম স্ক্রিনে যোগ করো" — Android/Chrome-এ এক ট্যাপে ইনস্টল, iPhone-এ নির্দেশনা। বন্ধ করলে ১৪ দিন আর দেখায় না।
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const KEY = 'installPromptDismissedAt';
const isStandalone = () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
const isIos = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const recentlyDismissed = () => {
  try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < 14 * 864e5; } catch { return false; }
};

export default function InstallPrompt() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  const [evt, setEvt] = useState(null);
  const [show, setShow] = useState(false);
  const ios = isIos();

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return undefined;
    let timer;
    const onPrompt = (e) => { e.preventDefault(); setEvt(e); timer = setTimeout(() => setShow(true), 6000); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    if (ios) timer = setTimeout(() => setShow(true), 6000);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); clearTimeout(timer); };
  }, [ios]);

  // পরীক্ষা চলাকালীন বা অ্যাডমিন পেজে বিরক্ত করবে না
  if (!show || /^\/(exam\/live|admin)/.test(pathname)) return null;

  const dismiss = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* ignore */ } setShow(false); };
  const install = async () => { evt.prompt(); await evt.userChoice.catch(() => {}); setShow(false); };

  return (
    <div role="dialog" aria-label={t('pwa.title')} className="card fixed inset-x-3 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 flex items-center gap-3 p-4 shadow-glow md:inset-x-auto md:bottom-4 md:left-4 md:max-w-sm">
      <img src="/favicon-48x48.png" alt="" className="h-10 w-10 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold dark:text-white">{t('pwa.title')}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{evt ? t('pwa.desc') : t('pwa.ios')}</div>
      </div>
      <div className="flex shrink-0 flex-col gap-1">
        {evt && <button onClick={install} className="btn-primary !px-3 !py-1.5 text-xs">{t('pwa.install')}</button>}
        <button onClick={dismiss} className="act text-xs">{t('pwa.later')}</button>
      </div>
    </div>
  );
}
