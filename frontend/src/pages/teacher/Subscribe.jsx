// ================== pages/teacher/Subscribe.jsx ==================
// শিক্ষকের সাবস্ক্রিপশন পেজ: বর্তমান অবস্থা, প্ল্যান, ম্যানুয়াল ও অনলাইন পেমেন্ট, ইতিহাস
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

const statusLabel = {
  pending: ['যাচাইয়ের অপেক্ষায়', 'bg-yellow-100 text-yellow-800'],
  active: ['চালু', 'bg-green-100 text-green-800'],
  rejected: ['বাতিল (reject)', 'bg-red-100 text-red-800'],
  failed: ['ব্যর্থ', 'bg-red-100 text-red-800'],
  cancelled: ['বাতিল', 'bg-gray-200 text-gray-700'],
  suspended: ['স্থগিত', 'bg-orange-100 text-orange-800'],
};
const providerName = { bkash: 'বিকাশ', nagad: 'নগদ', rocket: 'রকেট', sslcommerz: 'অনলাইন' };
const stateText = {
  active: 'চালু আছে',
  expired: 'মেয়াদ শেষ',
  suspended: 'অ্যাডমিন স্থগিত করেছেন',
  none: 'কোনো সাবস্ক্রিপশন নেই',
};

// প্ল্যানের ফিচার লিস্ট: পরীক্ষার লিমিট + description এর প্রতিটা লাইন
function planFeatures(p) {
  const list = [];
  list.push(
    p.examLimitType === 'limited' ? `সর্বোচ্চ ${p.examLimit}টি পরীক্ষা তৈরি করা যাবে` : 'আনলিমিটেড পরীক্ষা তৈরি করা যাবে'
  );
  (p.description || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*([0-9০-৯]+\s*[).।:-]|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .forEach((l) => list.push(l));
  list.push(`${p.durationDays} দিন মেয়াদ`);
  return list;
}

export default function Subscribe() {
  const [params] = useSearchParams();
  const [plans, setPlans] = useState([]);
  const [info, setInfo] = useState({ paymentInfo: {}, gatewayEnabled: false });
  const [me, setMe] = useState({ status: null, history: [] });
  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState('manual'); // manual | online
  const [form, setForm] = useState({ provider: 'bkash', trxId: '', senderNumber: '' });
  const [msg, setMsg] = useState(null); // { type, text }
  const [busy, setBusy] = useState(false);
  const payRef = useRef(null);
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null); // { code, discountPercent, originalPrice, finalPrice }
  const [promoMsg, setPromoMsg] = useState(null);
  const [promoBusy, setPromoBusy] = useState(false);

  const load = useCallback(() => {
    axiosClient.get('/subscription/plans').then(({ data }) => {
      setPlans(data.plans);
      setInfo({ paymentInfo: data.paymentInfo, gatewayEnabled: data.gatewayEnabled });
    });
    axiosClient.get('/subscription/me').then(({ data }) => setMe(data));
  }, []);

  useEffect(() => {
    load();
    const p = params.get('payment');
    if (p === 'success') setMsg({ type: 'ok', text: 'পেমেন্ট সফল হয়েছে! সাবস্ক্রিপশন চালু হয়েছে।' });
    if (p === 'failed') setMsg({ type: 'err', text: 'পেমেন্ট সফল হয়নি। আবার চেষ্টা করো।' });
    if (p === 'cancelled') setMsg({ type: 'err', text: 'তুমি পেমেন্ট বাতিল করেছ।' });
  }, [load, params]);

  const plan = plans.find((p) => p._id === selected);
  const payPrice = promo ? promo.finalPrice : plan?.price;
  const isFree = payPrice === 0;
  const bestId = plans.length > 1
    ? [...plans].sort((a, b) => a.price / a.durationDays - b.price / b.durationDays)[0]._id
    : null;

  const selectPlan = (id) => {
    if (id !== selected) { setPromo(null); setPromoMsg(null); }
    setSelected(id);
  };

  const applyPromoCode = async () => {
    if (!promoInput.trim()) return;
    setPromoBusy(true);
    setPromoMsg(null);
    try {
      const { data } = await axiosClient.post('/subscription/promo/validate', { planId: selected, code: promoInput });
      setPromo(data);
      setPromoMsg({ type: 'ok', text: `${data.discountPercent}% ছাড় পাওয়া গেছে!` });
    } catch (err) {
      setPromo(null);
      setPromoMsg({ type: 'err', text: err.response?.data?.message || 'কোডটি প্রয়োগ করা যায়নি' });
    } finally {
      setPromoBusy(false);
    }
  };

  const removePromo = () => { setPromo(null); setPromoInput(''); setPromoMsg(null); };

  const submitManual = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await axiosClient.post('/subscription/manual', { planId: selected, ...form, promoCode: promo?.code });
      setMsg({ type: 'ok', text: data.message });
      setForm({ ...form, trxId: '', senderNumber: '' });
      removePromo();
      load();
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'সমস্যা হয়েছে' });
    } finally {
      setBusy(false);
    }
  };

  const payOnline = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await axiosClient.post('/subscription/gateway/init', { planId: selected, promoCode: promo?.code });
      window.location.assign(data.url);
    } catch (err) {
      setMsg({ type: 'err', text: err.response?.data?.message || 'সমস্যা হয়েছে' });
      setBusy(false);
    }
  };

  const st = me.status;
  const nums = info.paymentInfo || {};

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold dark:text-white">সাবস্ক্রিপশন</h1>

      {st && (
        <div className="card mb-6">
          <div className="text-sm text-gray-500">বর্তমান অবস্থা</div>
          <div className="text-lg font-semibold dark:text-white">
            {stateText[st.state]}
            {st.state === 'active' && ` — ${st.daysLeft} দিন বাকি`}
          </div>
          {st.expiresAt && (
            <div className="text-sm text-gray-500">
              মেয়াদ: {new Date(st.expiresAt).toLocaleDateString('bn-BD')} পর্যন্ত
            </div>
          )}
          {st.isActive && (
            <Link to="/teacher/dashboard" className="link text-sm">ড্যাশবোর্ডে যাও →</Link>
          )}
        </div>
      )}

      {msg && (
        <div className={`mb-4 rounded-lg px-4 py-3 text-sm ${msg.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold dark:text-white">প্ল্যান বেছে নাও</h2>
      {plans.length === 0 && <p className="text-sm text-gray-500">এখনো কোনো প্ল্যান যোগ করা হয়নি।</p>}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const isSel = selected === p._id;
          const isBest = bestId === p._id;
          const features = planFeatures(p);
          const perDay = p.durationDays > 0 ? p.price / p.durationDays : 0;
          return (
            <div key={p._id} className="relative flex">
              {isBest && (
                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                  সবচেয়ে লাভজনক
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  selectPlan(p._id);
                  setTimeout(() => payRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                }}
                aria-pressed={isSel}
                className={`group flex w-full flex-col rounded-2xl border bg-white p-6 text-left shadow-soft transition duration-200 hover:-translate-y-1 hover:shadow-glow dark:bg-gray-900 ${
                  isSel
                    ? 'border-primary-600 ring-2 ring-primary-600/70 shadow-glow'
                    : isBest
                    ? 'border-primary-300 dark:border-primary-500/40'
                    : 'border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white">{p.name}</h3>
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                      isSel ? 'border-primary-600 bg-primary-600 text-white' : 'border-gray-300 dark:border-white/20'
                    }`}
                  >
                    {isSel && (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                    )}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">৳{p.price}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">/ {p.durationDays} দিন</span>
                </div>
                {perDay > 0 && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    দিনে মাত্র ৳{perDay < 10 ? perDay.toFixed(1) : Math.round(perDay)}
                  </div>
                )}

                <div className="my-5 h-px bg-gray-100 dark:bg-white/10" />

                <ul className="flex-1 space-y-2.5 text-sm text-gray-700 dark:text-gray-300">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-4 w-4 shrink-0 text-primary-600 dark:text-primary-400"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" /></svg>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <span
                  className={`mt-6 inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    isSel
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/30'
                      : 'bg-primary-50 text-primary-700 group-hover:bg-primary-600 group-hover:text-white dark:bg-primary-500/10 dark:text-primary-300 dark:group-hover:bg-primary-600 dark:group-hover:text-white'
                  }`}
                >
                  {isSel ? '✓ নির্বাচিত' : 'এই প্ল্যান নিন'}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {plan && (
        <div ref={payRef} className="card mb-8 scroll-mt-20">
          <div className="mb-5 rounded-xl border border-dashed border-primary-300 bg-primary-50/60 p-4 dark:border-primary-500/40 dark:bg-primary-500/10">
            <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">প্রোমো কোড আছে?</div>
            {promo ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-green-700 dark:text-green-400">
                  <b className="font-mono">{promo.code}</b> প্রয়োগ হয়েছে — {promo.discountPercent}% ছাড়
                </div>
                <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={removePromo}>সরিয়ে দাও</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input flex-1 font-mono uppercase"
                  placeholder="কোড লেখো"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); } }}
                />
                <button type="button" className="btn-secondary" onClick={applyPromoCode} disabled={promoBusy || !promoInput.trim()}>
                  {promoBusy ? '...' : 'প্রয়োগ করো'}
                </button>
              </div>
            )}
            {promoMsg && !promo && <div className="mt-2 text-xs text-red-600">{promoMsg.text}</div>}
            <div className="mt-3 flex items-baseline justify-between border-t border-primary-200/60 pt-3 text-sm dark:border-white/10">
              <span className="text-gray-600 dark:text-gray-300">{plan.name}</span>
              <span>
                {promo && <s className="mr-2 text-gray-400">৳{promo.originalPrice}</s>}
                <b className="text-lg text-gray-900 dark:text-white">৳{payPrice}</b>
              </span>
            </div>
          </div>
          <div className={`mb-4 flex gap-2 ${isFree ? 'hidden' : ''}`}>
            <button type="button" onClick={() => setMode('manual')} className={mode === 'manual' ? 'btn-primary' : 'btn-secondary'}>
              ম্যানুয়াল (বিকাশ/নগদ/রকেট)
            </button>
            <button
              type="button"
              onClick={() => setMode('online')}
              disabled={!info.gatewayEnabled}
              className={mode === 'online' ? 'btn-primary' : 'btn-secondary'}
              title={info.gatewayEnabled ? '' : 'অনলাইন পেমেন্ট এখনো চালু হয়নি'}
            >
              অনলাইন পেমেন্ট (অটোমেটিক)
            </button>
          </div>

          {isFree ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">১০০% ছাড় পেয়েছ — কোনো পেমেন্ট লাগবে না। নিচের বাটনে চাপ দিলেই সাবস্ক্রিপশন চালু হবে।</p>
              <button className="btn-primary" onClick={submitManual} disabled={busy}>{busy ? 'অপেক্ষা করো...' : 'বিনামূল্যে চালু করো'}</button>
            </div>
          ) : mode === 'manual' ? (
            <form onSubmit={submitManual} className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                নিচের যেকোনো নাম্বারে <b>৳{payPrice}</b> Send Money করো, তারপর TrxID জমা দাও। অ্যাডমিন যাচাই করলে সাবস্ক্রিপশন চালু হবে।
              </p>
              <ul className="text-sm">
                {['bkash', 'nagad', 'rocket'].map((k) => nums[k] && (
                  <li key={k}>{providerName[k]}: <b>{nums[k]}</b></li>
                ))}
              </ul>
              <select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                <option value="bkash">বিকাশ</option>
                <option value="nagad">নগদ</option>
                <option value="rocket">রকেট</option>
              </select>
              <input className="input" placeholder="যে নাম্বার থেকে পাঠিয়েছ" value={form.senderNumber} onChange={(e) => setForm({ ...form, senderNumber: e.target.value })} />
              <input className="input" placeholder="TrxID" required value={form.trxId} onChange={(e) => setForm({ ...form, trxId: e.target.value })} />
              <button className="btn-primary" disabled={busy}>{busy ? 'জমা হচ্ছে...' : 'পেমেন্ট জমা দাও'}</button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                কার্ড/মোবাইল ব্যাংকিং দিয়ে <b>৳{payPrice}</b> পরিশোধ করলে সাবস্ক্রিপশন সাথে সাথে চালু হবে।
              </p>
              <button className="btn-primary" onClick={payOnline} disabled={busy}>
                {busy ? 'অপেক্ষা করো...' : isFree ? 'বিনামূল্যে চালু করো' : `৳${payPrice} পরিশোধ করো`}
              </button>
            </div>
          )}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold dark:text-white">পেমেন্ট ও সাবস্ক্রিপশনের ইতিহাস</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-500">
            <tr><th className="py-2">তারিখ</th><th>প্ল্যান</th><th>টাকা</th><th>মাধ্যম</th><th>অবস্থা</th><th>মেয়াদ</th></tr>
          </thead>
          <tbody className="dark:text-gray-200">
            {me.history.map((h) => (
              <tr key={h._id} className="border-t border-gray-100 dark:border-white/10">
                <td className="py-2">{new Date(h.createdAt).toLocaleDateString('bn-BD')}</td>
                <td>{h.planName}</td>
                <td>৳{h.amount}{h.promoCode && <div className="text-xs text-green-700">{h.promoCode} (-{h.discountPercent}%)</div>}</td>
                <td>{h.method === 'admin' ? 'অ্যাডমিন' : providerName[h.provider] || '-'}</td>
                <td><span className={`badge ${statusLabel[h.status]?.[1] || ''}`}>{statusLabel[h.status]?.[0] || h.status}</span>{h.rejectReason && <div className="text-xs text-red-600">{h.rejectReason}</div>}</td>
                <td>{h.expiresAt ? new Date(h.expiresAt).toLocaleDateString('bn-BD') : '-'}</td>
              </tr>
            ))}
            {me.history.length === 0 && <tr><td colSpan="6" className="py-4 text-gray-500">এখনো কোনো রেকর্ড নেই</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
