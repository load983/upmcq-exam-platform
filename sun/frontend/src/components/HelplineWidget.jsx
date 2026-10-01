// ================== components/HelplineWidget.jsx ==================
// সব পেজে ভাসমান "হেল্পলাইন" বাটন। ক্লিক করলে দুটো ট্যাব:
//   ১) যোগাযোগ — অ্যাডমিনের সেট করা ফোন/WhatsApp/Facebook ইত্যাদি লিংক
//   ২) চ্যাট   — অ্যাডমিনের সাথে সরাসরি মেসেজ (লগইন ছাড়া গেস্টও পারবে)
// লাইভ পরীক্ষা (/exam/live) ও অ্যাডমিন পেজে বাটন দেখানো হয় না।
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';
import { buildContactList } from '../utils/contactLinks';

const VISITOR_KEY = 'helpline-visitor-id';
const OPEN_EVENT = 'open-helpline';

// গেস্ট ব্রাউজারকে চিনতে একটি র‍্যান্ডম আইডি (localStorage-এ থাকে)
function getVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      const bytes = new Uint8Array(18);
      crypto.getRandomValues(bytes);
      id = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `tmp${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`.padEnd(20, 'x');
  }
}

// অন্য কম্পোনেন্ট (যেমন Footer) থেকে হেল্পলাইন খুলতে
export const openHelpline = (tab = 'contact') => window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { tab } }));

export default function HelplineWidget() {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const { t, locale } = useLanguage();

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('contact');
  const [info, setInfo] = useState(null); // { contacts, extras, helplineNote, chatEnabled }
  const [messages, setMessages] = useState([]);
  const [hasThread, setHasThread] = useState(false);
  const [unread, setUnread] = useState(0);
  const [text, setText] = useState('');
  const [guest, setGuest] = useState({ name: '', phone: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const lastIdRef = useRef('');
  const visitorId = useRef(getVisitorId());

  const isGuest = !user;
  const hidden = user?.role === 'admin' || pathname.startsWith('/admin') || pathname.startsWith('/exam/live');
  const headers = { 'x-visitor-id': visitorId.current };

  // ইউজার বদলালে (লগইন/লগআউট) চ্যাটের অবস্থা রিসেট
  useEffect(() => {
    setMessages([]); setHasThread(false); setUnread(0); lastIdRef.current = '';
  }, [user?.id, user?._id, user?.role]);

  // বাইরে থেকে খোলার ইভেন্ট
  useEffect(() => {
    const h = (e) => { setOpen(true); setTab(e.detail?.tab || 'contact'); };
    window.addEventListener(OPEN_EVENT, h);
    return () => window.removeEventListener(OPEN_EVENT, h);
  }, []);

  // প্যানেল খুললে যোগাযোগ তথ্য লোড
  useEffect(() => {
    if (!open || hidden) return;
    axiosClient.get('/support/contacts').then(({ data }) => setInfo(data)).catch(() => setInfo({ contacts: {}, extras: [], chatEnabled: true, helplineNote: '' }));
  }, [open, hidden]);

  // নতুন মেসেজ আনা (after=শেষ মেসেজের id)
  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/support/chat', { headers, params: lastIdRef.current ? { after: lastIdRef.current } : {} });
      setHasThread(!!data.hasThread);
      if (data.messages?.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m._id));
          const add = data.messages.filter((m) => !seen.has(m._id));
          return add.length ? [...prev, ...add] : prev;
        });
        lastIdRef.current = data.messages[data.messages.length - 1]._id;
        setUnread(0);
      }
    } catch { /* নেটওয়ার্ক সমস্যা হলে পরের পোলে আবার চেষ্টা */ }
  }, [user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  // চ্যাট ট্যাব খোলা থাকলে প্রতি ৪ সেকেন্ডে পোল (ট্যাব লুকানো থাকলে থামে)
  useEffect(() => {
    if (!open || tab !== 'chat' || hidden) return undefined;
    fetchMessages();
    const id = setInterval(() => { if (!document.hidden) fetchMessages(); }, 4000);
    return () => clearInterval(id);
  }, [open, tab, hidden, fetchMessages]);

  // প্যানেল বন্ধ থাকলে ব্যাজের জন্য ৩০ সেকেন্ড পর পর অপঠিত সংখ্যা দেখা
  useEffect(() => {
    if (hidden || (open && tab === 'chat')) return undefined;
    const check = () => {
      if (document.hidden) return;
      axiosClient.get('/support/chat/unread', { headers }).then(({ data }) => setUnread(data.unread || 0)).catch(() => {});
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [hidden, open, tab, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, open, tab]);

  if (hidden) return null;

  const send = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    if (isGuest && !hasThread && !guest.name.trim()) { setError(t('helpline.nameRequired')); return; }
    setSending(true); setError('');
    try {
      const { data } = await axiosClient.post('/support/chat', { text: body, name: guest.name, phone: guest.phone }, { headers });
      setText('');
      setHasThread(true);
      setMessages((prev) => (prev.some((m) => m._id === data.message._id) ? prev : [...prev, data.message]));
      lastIdRef.current = data.message._id;
    } catch (err) {
      setError(err.response?.data?.message || t('helpline.sendFailed'));
    } finally {
      setSending(false);
    }
  };

  const links = info ? buildContactList(info.contacts, info.extras) : [];
  const chatOn = info ? info.chatEnabled !== false : true;
  const time = (d) => new Date(d).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      {/* ---------- ভাসমান বাটন ---------- */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t('helpline.title')}
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary-600 text-2xl text-white shadow-lg shadow-primary-600/40 transition hover:bg-primary-700 active:scale-95"
      >
        {open ? '✕' : '🎧'}
        {!open && unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {/* ---------- প্যানেল ---------- */}
      {open && (
        <div className="card fixed bottom-[calc(9rem+env(safe-area-inset-bottom))] right-4 z-50 md:bottom-20 flex h-[min(75vh,34rem)] w-[min(92vw,22rem)] animate-scale-in flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-4 py-3 text-white">
            <div className="font-bold">🎧 {t('helpline.title')}</div>
            <div className="text-xs opacity-90">{info?.helplineNote || t('helpline.subtitle')}</div>
          </div>

          <div className="flex border-b border-gray-100 text-sm font-medium dark:border-white/10">
            {[['contact', t('helpline.tabContact')], ['chat', t('helpline.tabChat')]].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`flex-1 py-2.5 ${tab === k ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400' : 'text-gray-500'}`}>{l}</button>
            ))}
          </div>

          {/* যোগাযোগ ট্যাব */}
          {tab === 'contact' && (
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {!info && <p className="text-sm text-gray-500">{t('common.loading')}</p>}
              {info && links.length === 0 && <p className="text-sm text-gray-500">{t('helpline.noContacts')}</p>}
              {links.map((l) => {
                const cls = 'flex items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10';
                const inner = (
                  <>
                    <span className="text-xl">{l.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-800 dark:text-gray-100">{l.label}</span>
                      <span className="block truncate text-xs text-gray-500">{l.text}</span>
                    </span>
                  </>
                );
                return l.href
                  ? <a key={l.id} href={l.href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:border-primary-400`}>{inner}</a>
                  : <div key={l.id} className={cls}>{inner}</div>;
              })}
              {info && chatOn && (
                <button className="btn-primary w-full" onClick={() => setTab('chat')}>💬 {t('helpline.startChat')}</button>
              )}
            </div>
          )}

          {/* চ্যাট ট্যাব */}
          {tab === 'chat' && (
            <>
              {!chatOn ? (
                <p className="flex-1 p-4 text-sm text-gray-500">{t('helpline.chatOff')}</p>
              ) : (
                <>
                  <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3 dark:bg-black/20">
                    {messages.length === 0 && <p className="py-6 text-center text-sm text-gray-500">{t('helpline.chatIntro')}</p>}
                    {messages.map((m) => (
                      <div key={m._id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${m.sender === 'user' ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'}`}>
                          {m.sender === 'admin' && <div className="mb-0.5 text-[11px] font-semibold text-primary-600 dark:text-primary-400">{t('helpline.admin')}</div>}
                          {m.text}
                          <div className={`mt-1 text-right text-[10px] ${m.sender === 'user' ? 'text-white/70' : 'text-gray-400'}`}>{time(m.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>

                  <form onSubmit={send} className="space-y-2 border-t border-gray-100 p-2 dark:border-white/10">
                    {isGuest && !hasThread && (
                      <div className="flex gap-2">
                        <input className="input !py-2" placeholder={t('helpline.yourName')} maxLength={60} value={guest.name} onChange={(e) => setGuest({ ...guest, name: e.target.value })} />
                        <input className="input !py-2" placeholder={t('helpline.yourPhone')} maxLength={20} value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} />
                      </div>
                    )}
                    {error && <p className="text-xs text-red-600">{error}</p>}
                    <div className="flex gap-2">
                      <input className="input !py-2" placeholder={t('helpline.typeMessage')} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
                      <button className="btn-primary !px-4" disabled={sending || !text.trim()}>{t('helpline.send')}</button>
                    </div>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}
