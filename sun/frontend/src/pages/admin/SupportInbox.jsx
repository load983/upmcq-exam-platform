// ================== pages/admin/SupportInbox.jsx ==================
// অ্যাডমিনের চ্যাট ইনবক্স — বাঁ পাশে ইউজারদের তালিকা, ডান পাশে মেসেঞ্জারের মতো কথোপকথন।
import React, { useCallback, useEffect, useRef, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

const roleTone = { teacher: 'bg-purple-100 text-purple-800', student: 'bg-blue-100 text-blue-800', guest: 'bg-gray-200 text-gray-700' };

export default function SupportInbox({ say, onUnreadChange }) {
  const { t, tm, locale } = useLanguage();
  const roleLabel = { teacher: t('a.i.teacher'), student: t('a.i.student'), guest: t('a.i.guest') };
  const fmtTime = (d) => new Date(d).toLocaleString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const lastIdRef = useRef('');

  const loadThreads = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/admin/support/threads');
      setThreads(data.threads);
      onUnreadChange?.(data.threads.reduce((n, th) => n + (th.unreadByAdmin || 0), 0));
    } catch { /* পরের পোলে আবার */ }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMessages = useCallback(async (id, reset = false) => {
    try {
      const { data } = await axiosClient.get(`/admin/support/threads/${id}/messages`, { params: !reset && lastIdRef.current ? { after: lastIdRef.current } : {} });
      setActive(data.thread);
      if (reset) setMessages(data.messages);
      else if (data.messages.length) setMessages((p) => { const s = new Set(p.map((m) => m._id)); return [...p, ...data.messages.filter((m) => !s.has(m._id))]; });
      if (data.messages.length) lastIdRef.current = data.messages[data.messages.length - 1]._id;
      else if (reset) lastIdRef.current = '';
    } catch (e) { if (reset) say(e.response?.data?.message || t('a.loadFailed')); }
  }, [say, t]);

  // তালিকা প্রতি ৫ সেকেন্ডে রিফ্রেশ
  useEffect(() => {
    loadThreads();
    const id = setInterval(() => { if (!document.hidden) loadThreads(); }, 5000);
    return () => clearInterval(id);
  }, [loadThreads]);

  // খোলা কথোপকথনের নতুন মেসেজ প্রতি ৩ সেকেন্ডে
  useEffect(() => {
    if (!activeId) return undefined;
    lastIdRef.current = '';
    setMessages([]);
    loadMessages(activeId, true).then(loadThreads);
    const id = setInterval(() => { if (!document.hidden) loadMessages(activeId).then(loadThreads); }, 3000);
    return () => clearInterval(id);
  }, [activeId, loadMessages, loadThreads]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const reply = async (e) => {
    e.preventDefault();
    const body = text.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    try {
      const { data } = await axiosClient.post(`/admin/support/threads/${activeId}/reply`, { text: body });
      setText('');
      setMessages((p) => (p.some((m) => m._id === data.message._id) ? p : [...p, data.message]));
      lastIdRef.current = data.message._id;
      loadThreads();
    } catch (err) {
      say(err.response?.data?.message || t('a.i.sendFailed'));
    } finally { setSending(false); }
  };

  const remove = async () => {
    if (!window.confirm(t('a.i.confirmDelete'))) return;
    try {
      await axiosClient.delete(`/admin/support/threads/${activeId}`);
      setActiveId(null); setActive(null); setMessages([]);
      loadThreads();
    } catch (err) { say(err.response?.data?.message || t('a.i.deleteFailed')); }
  };

  return (
    <div className="card grid h-[70vh] overflow-hidden md:grid-cols-[18rem_1fr]">
      {/* ---------- তালিকা ---------- */}
      <div className={`overflow-y-auto border-gray-100 dark:border-white/10 md:border-r ${activeId ? 'hidden md:block' : ''}`}>
        {threads.length === 0 && <p className="p-4 text-sm text-gray-500">{t('a.i.empty')}</p>}
        {threads.map((th) => (
          <button key={th._id} onClick={() => setActiveId(th._id)} className={`block w-full border-b border-gray-100 px-3 py-3 text-left dark:border-white/5 ${activeId === th._id ? 'bg-primary-50 dark:bg-white/10' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-semibold dark:text-white">{th.name || t('a.i.unnamed')}</span>
              {th.unreadByAdmin > 0 && <span className="grid h-5 min-w-[1.25rem] place-items-center rounded-full bg-red-600 px-1 text-[11px] font-bold text-white">{th.unreadByAdmin}</span>}
            </div>
            <div className="mt-0.5 flex items-center gap-2">
              <span className={`badge !px-2 !py-0.5 text-[10px] ${roleTone[th.role]}`}>{roleLabel[th.role]}</span>
              <span className="text-[11px] text-gray-400">{fmtTime(th.lastMessageAt)}</span>
            </div>
            <div className="mt-1 truncate text-xs text-gray-500">{tm(th.lastMessagePreview)}</div>
          </button>
        ))}
      </div>

      {/* ---------- কথোপকথন ---------- */}
      <div className={`flex min-h-0 flex-col ${activeId ? '' : 'hidden md:flex'}`}>
        {!activeId ? (
          <div className="grid flex-1 place-items-center p-6 text-sm text-gray-500">{t('a.i.pick')}</div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 px-3 py-2 dark:border-white/10">
              <div className="flex min-w-0 items-center gap-2">
                <button className="btn-secondary !px-2 !py-1 text-xs md:hidden" onClick={() => setActiveId(null)}>{t('a.i.back')}</button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold dark:text-white">{active?.name}</div>
                  <div className="truncate text-xs text-gray-500">{[roleLabel[active?.role], active?.phone, active?.email].filter(Boolean).join(' • ')}</div>
                </div>
              </div>
              <button className="btn-danger !px-2 !py-1 text-xs" onClick={remove}>{t('a.i.delete')}</button>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3 dark:bg-black/20">
              {messages.map((m) => (
                <div key={m._id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3 py-2 text-sm ${m.sender === 'admin' ? 'rounded-br-sm bg-primary-600 text-white' : 'rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-gray-800 dark:text-gray-100'}`}>
                    {m.text}
                    <div className={`mt-1 text-right text-[10px] ${m.sender === 'admin' ? 'text-white/70' : 'text-gray-400'}`}>{fmtTime(m.createdAt)}</div>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={reply} className="flex gap-2 border-t border-gray-100 p-2 dark:border-white/10">
              <input className="input" placeholder={t('a.i.reply')} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} />
              <button className="btn-primary" disabled={sending || !text.trim()}>{t('a.i.send')}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
