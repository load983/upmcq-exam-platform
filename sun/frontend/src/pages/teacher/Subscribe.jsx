// ================== pages/teacher/Subscribe.jsx ==================
// শিক্ষকের সাবস্ক্রিপশন পেজ: বর্তমান অবস্থা, প্ল্যান, ম্যানুয়াল ও অনলাইন পেমেন্ট, ইতিহাস
import React, { useEffect, useState, useCallback } from 'react';
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

  const submitManual = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await axiosClient.post('/subscription/manual', { planId: selected, ...form });
      setMsg({ type: 'ok', text: data.message });
      setForm({ ...form, trxId: '', senderNumber: '' });
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
      const { data } = await axiosClient.post('/subscription/gateway/init', { planId: selected });
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
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {plans.map((p) => (
          <button
            key={p._id}
            type="button"
            onClick={() => setSelected(p._id)}
            className={`card text-left transition ${selected === p._id ? 'ring-2 ring-primary-600' : ''}`}
          >
            <div className="font-semibold dark:text-white">{p.name}</div>
            <div className="text-2xl font-bold text-primary-600">৳{p.price}</div>
            <div className="text-sm text-gray-500">{p.durationDays} দিন</div>
            {p.description && <div className="mt-1 text-xs text-gray-500">{p.description}</div>}
          </button>
        ))}
      </div>

      {plan && (
        <div className="card mb-8">
          <div className="mb-4 flex gap-2">
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

          {mode === 'manual' ? (
            <form onSubmit={submitManual} className="space-y-3">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                নিচের যেকোনো নাম্বারে <b>৳{plan.price}</b> Send Money করো, তারপর TrxID জমা দাও। অ্যাডমিন যাচাই করলে সাবস্ক্রিপশন চালু হবে।
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
                কার্ড/মোবাইল ব্যাংকিং দিয়ে <b>৳{plan.price}</b> পরিশোধ করলে সাবস্ক্রিপশন সাথে সাথে চালু হবে।
              </p>
              <button className="btn-primary" onClick={payOnline} disabled={busy}>
                {busy ? 'অপেক্ষা করো...' : `৳${plan.price} পরিশোধ করো`}
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
                <td>৳{h.amount}</td>
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
