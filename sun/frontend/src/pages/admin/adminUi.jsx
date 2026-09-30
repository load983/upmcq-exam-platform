// ================== pages/admin/adminUi.jsx ==================
// অ্যাডমিন প্যানেলের ছোট UI অংশ: প্রম্পট/কনফার্ম ডায়ালগ (window.prompt/confirm-এর বদলে) ও টোস্ট
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

// await ask({ title, input?: { defaultValue, type }, danger?, confirmText? }) -> null (বাতিল) | true | ইনপুট-এর মান
export function useDialog() {
  const [state, setState] = useState(null);
  const ask = useCallback((opts) => new Promise((resolve) => setState({ opts, resolve })), []);
  const close = (v) => { state?.resolve(v); setState(null); };
  const node = state ? <Dialog opts={state.opts} onClose={close} /> : null;
  return [ask, node];
}

function Dialog({ opts, onClose }) {
  const { t } = useLanguage();
  const [val, setVal] = useState(opts.input?.defaultValue ?? '');
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const submit = (e) => { e.preventDefault(); onClose(opts.input ? val : true); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose(null)}>
      <form role="dialog" aria-modal="true" onSubmit={submit} className="card w-full max-w-sm space-y-3">
        <div className="font-semibold dark:text-white">{opts.title}</div>
        {opts.input && (
          <input ref={ref} className="input" type={opts.input.type || 'text'} min={opts.input.min} value={val} onChange={(e) => setVal(e.target.value)} />
        )}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => onClose(null)}>{t('a.u.cancel')}</button>
          <button type="submit" ref={opts.input ? undefined : ref} className={opts.danger ? 'btn-danger' : 'btn-primary'}>{opts.confirmText || t('a.ok')}</button>
        </div>
      </form>
    </div>
  );
}

// টোস্ট: লেআউট না নড়িয়ে উপরে ভেসে ওঠে; আগের টাইমার সাফ করে
export function useToast() {
  const [msg, setMsg] = useState('');
  const timer = useRef(null);
  const say = useCallback((m) => {
    setMsg(m);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 4000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const node = msg ? (
    <div role="status" className="fixed inset-x-0 top-16 z-50 mx-auto w-fit max-w-[90vw] rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">{msg}</div>
  ) : null;
  return [say, node];
}

export function Badge({ n }) {
  return n ? <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-red-600 px-1.5 text-xs font-semibold text-white">{n}</span> : null;
}

const ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
  teacher: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/>',
  tag: '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
};
export function Icon({ name, className = 'h-[18px] w-[18px]' }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[name] }} />;
}

export function Avatar({ name = '?' }) {
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700 dark:bg-primary-500/20 dark:text-primary-300">{[...name.trim()][0]?.toUpperCase() || '?'}</span>;
}
