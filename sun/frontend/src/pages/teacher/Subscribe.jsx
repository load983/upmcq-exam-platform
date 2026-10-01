// ================== pages/teacher/Subscribe.jsx ==================
// শিক্ষকের সাবস্ক্রিপশন পেজ: বর্তমান অবস্থা, প্ল্যান, ম্যানুয়াল ও অনলাইন পেমেন্ট, ইতিহাস
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

// অবস্থার লেখা t() দিয়ে রেন্ডারের সময় বসে (pay.status.*, sub.state.*, sub.provider.*)
const statusCls = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  failed: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  cancelled: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300',
  suspended: 'bg-orange-50 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
};

// প্ল্যানের ফিচার লিস্ট: পরীক্ষার লিমিট + description এর প্রতিটা লাইন
function planFeatures(p, t) {
  const list = [];
  list.push(
    p.examLimitType === 'limited' ? t('sub.planLimited', { n: p.examLimit }) : t('sub.planUnlimited')
  );
  (p.description || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^\s*([0-9০-৯]+\s*[).।:-]|[-•*])\s*/, '').trim())
    .filter(Boolean)
    .forEach((l) => list.push(l));
  list.push(t('sub.planDuration', { n: p.durationDays }));
  return list;
}

export default function Subscribe() {
  const { t, locale } = useLanguage();
  const providerName = (k) => (k ? t(`sub.provider.${k}`) : '-');
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
    if (p === 'success') setMsg({ type: 'ok', text: t('sub.paySuccess') });
    if (p === 'failed') setMsg({ type: 'err', text: t('sub.payFailed') });
    if (p === 'cancelled') setMsg({ type: 'err', text: t('sub.payCancelled') });
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
      setPromoMsg({ type: 'ok', text: t('sub.promoApplied', { n: data.discountPercent }) });
    } catch (err) {
      setPromo(null);
      setPromoMsg({ type: 'err', text: err.response?.data?.message || t('sub.promoFailed') });
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
      setMsg({ type: 'err', text: err.response?.data?.message || t('a.error') });
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
      setMsg({ type: 'err', text: err.response?.data?.message || t('a.error') });
      setBusy(false);
    }
  };

  const st = me.status;
  const nums = info.paymentInfo || {};

  return (
    <div className="mx-auto max-w-4xl py-2">
      <h1 className="mb-5 text-2xl font-semibold tracking-tight dark:text-white sm:text-3xl">{t('nav.subscription')}</h1>

      {st && (
        <div className="card mb-6 border-l-4 border-l-primary-500 p-5">
          <div className="text-sm text-gray-500">{t('sub.current')}</div>
          <div className="text-lg font-semibold dark:text-white">
            {t(`sub.state.${st.state}`)}
            {st.state === 'active' && ` — ${t('a.t.daysLeft', { n: st.daysLeft })}`}
          </div>
          {st.expiresAt && (
            <div className="text-sm text-gray-500">
              {t('sub.validUntil', { date: new Date(st.expiresAt).toLocaleDateString(locale) })}
            </div>
          )}
          {st.isActive && (
            <Link to="/teacher/dashboard" className="link text-sm">{t('sub.toDashboard')}</Link>
          )}
        </div>
      )}

      {msg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${msg.type === 'ok' ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-red-50 text-red-800'}`}>
          {msg.text}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold dark:text-white">{t('sub.choosePlan')}</h2>
      {plans.length === 0 && <p className="text-sm text-gray-500">{t('sub.noPlans')}</p>}
      <div className="mb-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const isSel = selected === p._id;
          const isBest = bestId === p._id;
          const features = planFeatures(p, t);
          const perDay = p.durationDays > 0 ? p.price / p.durationDays : 0;
          return (
            <div key={p._id} className="relative flex">
              {isBest && (
                <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-3 py-1 text-xs font-semibold text-white shadow-md">
                  {t('sub.best')}
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
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('sub.forDays', { n: p.durationDays })}</span>
                </div>
                {perDay > 0 && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('sub.perDay', { n: perDay < 10 ? perDay.toFixed(1) : Math.round(perDay) })}
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
                  {isSel ? t('sub.selected') : t('sub.pick')}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      {plan && (
        <div ref={payRef} className="card mb-8 scroll-mt-20">
          <div className="mb-5 rounded-xl border border-dashed border-primary-300 bg-primary-50/60 p-4 dark:border-primary-500/40 dark:bg-primary-500/10">
            <div className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-100">{t('sub.havePromo')}</div>
            {promo ? (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-green-700 dark:text-green-400">
                  <b className="font-mono">{promo.code}</b>{t('sub.appliedSuffix', { n: promo.discountPercent })}
                </div>
                <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={removePromo}>{t('sub.remove')}</button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  className="input flex-1 font-mono uppercase"
                  placeholder={t('sub.codePh')}
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyPromoCode(); } }}
                />
                <button type="button" className="btn-secondary" onClick={applyPromoCode} disabled={promoBusy || !promoInput.trim()}>
                  {promoBusy ? '...' : t('sub.apply')}
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
              {t('sub.manual')}
            </button>
            <button
              type="button"
              onClick={() => setMode('online')}
              disabled={!info.gatewayEnabled}
              className={mode === 'online' ? 'btn-primary' : 'btn-secondary'}
              title={info.gatewayEnabled ? '' : t('sub.onlineOff')}
            >
              {t('sub.online')}
            </button>
          </div>

          {isFree ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">{t('sub.freeInfo')}</p>
              <button className="btn-primary" onClick={submitManual} disabled={busy}>{busy ? t('sub.wait') : t('sub.activateFree')}</button>
            </div>
          ) : mode === 'manual' ? (
            <form onSubmit={submitManual} className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('sub.manualPre')} <b>৳{payPrice}</b> {t('sub.manualPost')}
              </p>
              <ul className="text-sm">
                {['bkash', 'nagad', 'rocket'].map((k) => nums[k] && (
                  <li key={k}>{providerName(k)}: <b>{nums[k]}</b></li>
                ))}
              </ul>
              <select className="input" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })}>
                <option value="bkash">{t('sub.provider.bkash')}</option>
                <option value="nagad">{t('sub.provider.nagad')}</option>
                <option value="rocket">{t('sub.provider.rocket')}</option>
              </select>
              <input className="input" placeholder={t('sub.senderPh')} value={form.senderNumber} onChange={(e) => setForm({ ...form, senderNumber: e.target.value })} />
              <input className="input" placeholder="TrxID" required value={form.trxId} onChange={(e) => setForm({ ...form, trxId: e.target.value })} />
              <button className="btn-primary" disabled={busy}>{busy ? t('sub.submitting') : t('sub.submit')}</button>
            </form>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {t('sub.onlinePre')} <b>৳{payPrice}</b> {t('sub.onlinePost')}
              </p>
              <button className="btn-primary" onClick={payOnline} disabled={busy}>
                {busy ? t('sub.wait') : isFree ? t('sub.activateFree') : t('sub.pay', { n: payPrice })}
              </button>
            </div>
          )}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold dark:text-white">{t('sub.history')}</h2>
      <div className="card overflow-x-auto !p-1">
        <table className="admin-table">
          <thead className="text-gray-500">
            <tr><th className="py-2">{t('a.p.date')}</th><th>{t('a.p.plan')}</th><th>{t('a.p.amount')}</th><th>{t('sub.method')}</th><th>{t('a.p.status')}</th><th>{t('a.t.expiry')}</th></tr>
          </thead>
          <tbody className="dark:text-gray-200">
            {me.history.map((h) => (
              <tr key={h._id} className="border-t border-gray-100 dark:border-white/10">
                <td className="py-2">{new Date(h.createdAt).toLocaleDateString(locale)}</td>
                <td>{h.planName}</td>
                <td>৳{h.amount}{h.promoCode && <div className="text-xs text-green-700">{h.promoCode} (-{h.discountPercent}%)</div>}</td>
                <td>{h.method === 'admin' ? t('a.p.admin') : providerName(h.provider)}</td>
                <td><span className={`badge ${statusCls[h.status] || ''}`}>{statusCls[h.status] ? t(`pay.status.${h.status}`) : h.status}</span>{h.rejectReason && <div className="text-xs text-red-600">{h.rejectReason}</div>}</td>
                <td>{h.expiresAt ? new Date(h.expiresAt).toLocaleDateString(locale) : '-'}</td>
              </tr>
            ))}
            {me.history.length === 0 && <tr><td colSpan="6" className="py-4 text-gray-500">{t('sub.noRecords')}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
