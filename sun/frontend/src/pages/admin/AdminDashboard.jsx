// ================== pages/admin/AdminDashboard.jsx ==================
// অ্যাডমিন প্যানেল: ওভারভিউ, শিক্ষক ও সাবস্ক্রিপশন কন্ট্রোল, পেমেন্ট যাচাই, প্ল্যান ম্যানেজমেন্ট
import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';

const stateBadge = {
  active: ['চালু', 'bg-green-100 text-green-800'],
  expired: ['মেয়াদ শেষ', 'bg-red-100 text-red-800'],
  suspended: ['স্থগিত', 'bg-orange-100 text-orange-800'],
  none: ['নেই', 'bg-gray-200 text-gray-700'],
};
const payBadge = {
  pending: ['যাচাই বাকি', 'bg-yellow-100 text-yellow-800'],
  active: ['approved', 'bg-green-100 text-green-800'],
  rejected: ['rejected', 'bg-red-100 text-red-800'],
  failed: ['ব্যর্থ', 'bg-red-100 text-red-800'],
  cancelled: ['বাতিল', 'bg-gray-200 text-gray-700'],
  suspended: ['স্থগিত', 'bg-orange-100 text-orange-800'],
};
const fmt = (d) => (d ? new Date(d).toLocaleDateString('bn-BD') : '-');

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${tone} dark:text-white`}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [plans, setPlans] = useState([]);
  const [promos, setPromos] = useState([]);
  const [promoForm, setPromoForm] = useState({ code: '', discountPercent: '', maxUses: '' });
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [payFilter, setPayFilter] = useState('pending');
  const [msg, setMsg] = useState('');
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationDays: '', description: '', examLimitType: 'unlimited', examLimit: '' });

  const say = (m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); };
  const errMsg = (e) => say(e.response?.data?.message || 'সমস্যা হয়েছে');

  const loadStats = useCallback(() => axiosClient.get('/admin/stats').then(({ data }) => setStats(data)).catch(errMsg), []);
  const loadTeachers = useCallback(
    () => axiosClient.get('/admin/teachers', { params: { search, state: stateFilter } }).then(({ data }) => setTeachers(data.teachers)).catch(errMsg),
    [search, stateFilter]
  );
  const loadPayments = useCallback(
    () => axiosClient.get('/admin/payments', { params: { status: payFilter } }).then(({ data }) => setPayments(data.payments)).catch(errMsg),
    [payFilter]
  );
  const loadPlans = useCallback(() => axiosClient.get('/admin/plans').then(({ data }) => setPlans(data.plans)).catch(errMsg), []);

  const loadPromos = useCallback(() => axiosClient.get('/admin/promos').then(({ data }) => setPromos(data.promos)).catch(errMsg), []);

  useEffect(() => { loadStats(); loadPlans(); loadPromos(); }, [loadStats, loadPlans, loadPromos]);
  useEffect(() => { loadTeachers(); }, [loadTeachers]);
  useEffect(() => { loadPayments(); }, [loadPayments]);

  const refresh = () => { loadStats(); loadTeachers(); loadPayments(); loadPlans(); loadPromos(); };

  const act = async (fn) => {
    try {
      const { data } = await fn();
      say(data.message || 'সম্পন্ন');
      refresh();
    } catch (e) { errMsg(e); }
  };

  const teacherAction = (id, action, body) => act(() => axiosClient.post(`/admin/teachers/${id}/${action}`, body || {}));

  const askDays = (label) => {
    const v = window.prompt(label, '30');
    return v ? Number(v) : null;
  };

  const tabs = [
    ['overview', 'ওভারভিউ'],
    ['teachers', 'শিক্ষক'],
    ['payments', `পেমেন্ট${stats?.pendingPayments ? ` (${stats.pendingPayments})` : ''}`],
    ['plans', 'প্ল্যান'],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold dark:text-white">অ্যাডমিন প্যানেল</h1>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? 'btn-primary' : 'btn-secondary'}>{l}</button>
        ))}
      </div>
      {msg && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">{msg}</div>}

      {/* ---------- ওভারভিউ ---------- */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="মোট শিক্ষক" value={stats.totalTeachers} />
          <Stat label="চালু সাবস্ক্রিপশন" value={stats.active} tone="text-green-600" />
          <Stat label="৭ দিনের মধ্যে মেয়াদ শেষ" value={stats.expiringSoon} tone="text-yellow-600" />
          <Stat label="যাচাইয়ের অপেক্ষায় পেমেন্ট" value={stats.pendingPayments} tone="text-yellow-600" />
          <Stat label="মেয়াদ শেষ" value={stats.expired} tone="text-red-600" />
          <Stat label="স্থগিত" value={stats.suspended} tone="text-orange-600" />
          <Stat label="কখনো কেনেনি" value={stats.none} />
          <Stat label="মোট আয়" value={`৳${stats.revenueTotal}`} />
          <Stat label="এই মাসে (ম্যানুয়াল approve)" value={`৳${stats.revenueThisMonth}`} />
        </div>
      )}

      {/* ---------- শিক্ষক ---------- */}
      {tab === 'teachers' && (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <input className="input max-w-xs" placeholder="নাম বা ইমেইল খোঁজো" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input max-w-[10rem]" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">সব অবস্থা</option>
              <option value="active">চালু</option>
              <option value="expired">মেয়াদ শেষ</option>
              <option value="suspended">স্থগিত</option>
              <option value="none">সাবস্ক্রিপশন নেই</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">শিক্ষক</th><th>অবস্থা</th><th>প্ল্যান</th><th>মেয়াদ</th><th>কন্ট্রোল</th></tr></thead>
              <tbody className="dark:text-gray-200">
                {teachers.map((t) => {
                  const s = t.subscription;
                  return (
                    <tr key={t._id} className="border-t border-gray-100 align-top dark:border-white/10">
                      <td className="py-2"><div className="font-medium">{t.name}</div><div className="text-xs text-gray-500">{t.email}</div></td>
                      <td><span className={`badge ${stateBadge[s.state][1]}`}>{stateBadge[s.state][0]}</span></td>
                      <td>{s.planName || '-'}</td>
                      <td>{fmt(s.expiresAt)}{s.state === 'active' && <div className="text-xs text-gray-500">{s.daysLeft} দিন বাকি</div>}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => { const d = askDays('কত দিন যোগ করবে?'); if (d) teacherAction(t._id, 'extend', { days: d }); }}>+দিন</button>
                          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => { const d = askDays('কত দিনের সাবস্ক্রিপশন দেবে?'); if (d) teacherAction(t._id, 'grant', { days: d, note: 'অ্যাডমিন প্রদত্ত' }); }}>দাও</button>
                          {s.state === 'suspended'
                            ? <button className="btn-success !px-2 !py-1 text-xs" onClick={() => teacherAction(t._id, 'resume')}>চালু করো</button>
                            : s.state === 'active' && <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => teacherAction(t._id, 'suspend')}>স্থগিত</button>}
                          {(s.state === 'active' || s.state === 'suspended') && (
                            <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => window.confirm('বাকি মেয়াদসহ বাতিল করবে?') && teacherAction(t._id, 'revoke')}>বাতিল</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {teachers.length === 0 && <tr><td colSpan="5" className="py-4 text-gray-500">কোনো শিক্ষক পাওয়া যায়নি</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- পেমেন্ট ---------- */}
      {tab === 'payments' && (
        <div>
          <select className="input mb-3 max-w-[12rem]" value={payFilter} onChange={(e) => setPayFilter(e.target.value)}>
            <option value="pending">যাচাইয়ের অপেক্ষায়</option>
            <option value="active">approved</option>
            <option value="rejected">rejected</option>
            <option value="failed">ব্যর্থ</option>
            <option value="">সব</option>
          </select>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">তারিখ</th><th>শিক্ষক</th><th>প্ল্যান</th><th>টাকা</th><th>মাধ্যম / TrxID</th><th>অবস্থা</th><th></th></tr></thead>
              <tbody className="dark:text-gray-200">
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100 align-top dark:border-white/10">
                    <td className="py-2">{fmt(p.createdAt)}</td>
                    <td>{p.teacher?.name}<div className="text-xs text-gray-500">{p.teacher?.email}</div></td>
                    <td>{p.planName}<div className="text-xs text-gray-500">{p.durationDays} দিন</div></td>
                    <td>৳{p.amount}{p.promoCode && <div className="text-xs text-green-700">{p.promoCode} (-{p.discountPercent}%)<span className="text-gray-500"> আসল ৳{p.originalAmount}</span></div>}</td>
                    <td>
                      {p.method === 'admin' ? 'অ্যাডমিন' : `${p.provider}`}
                      <div className="text-xs">{p.trxId || p.tranId}</div>
                      {p.senderNumber && <div className="text-xs text-gray-500">থেকে: {p.senderNumber}</div>}
                    </td>
                    <td><span className={`badge ${payBadge[p.status]?.[1]}`}>{payBadge[p.status]?.[0] || p.status}</span></td>
                    <td>
                      {p.status === 'pending' && p.method === 'manual' && (
                        <div className="flex gap-1">
                          <button className="btn-success !px-2 !py-1 text-xs" onClick={() => act(() => axiosClient.post(`/admin/payments/${p._id}/approve`))}>Approve</button>
                          <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => { const r = window.prompt('কারণ (ঐচ্ছিক)') ; if (r !== null) act(() => axiosClient.post(`/admin/payments/${p._id}/reject`, { reason: r })); }}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan="7" className="py-4 text-gray-500">কোনো পেমেন্ট নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- প্ল্যান ---------- */}
      {tab === 'plans' && (
        <div>
          <form
            className="card mb-5 grid gap-2 sm:grid-cols-6"
            onSubmit={(e) => {
              e.preventDefault();
              if (planForm.examLimitType === 'limited' && !(Number(planForm.examLimit) > 0)) {
                return alert('Limit অপশনের জন্য সঠিক পরীক্ষার সংখ্যা দাও');
              }
              act(() => axiosClient.post('/admin/plans', planForm)).then(() =>
                setPlanForm({ name: '', price: '', durationDays: '', description: '', examLimitType: 'unlimited', examLimit: '' })
              );
            }}
          >
            <input className="input" placeholder="নাম (যেমন ১ মাস)" required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
            <input className="input" type="number" min="0" placeholder="দাম (৳)" required value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} />
            <input className="input" type="number" min="1" placeholder="মেয়াদ (দিন)" required value={planForm.durationDays} onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })} />
            <select className="input" value={planForm.examLimitType} onChange={(e) => setPlanForm({ ...planForm, examLimitType: e.target.value })}>
              <option value="unlimited">Unlimit (যত খুশি পরীক্ষা)</option>
              <option value="limited">Limit (নির্দিষ্ট সংখ্যক পরীক্ষা)</option>
            </select>
            {planForm.examLimitType === 'limited' && (
              <input className="input" type="number" min="1" placeholder="পরীক্ষার সংখ্যা" required value={planForm.examLimit} onChange={(e) => setPlanForm({ ...planForm, examLimit: e.target.value })} />
            )}
            <input className="input" placeholder="বিবরণ (ঐচ্ছিক)" value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
            <button className="btn-primary">প্ল্যান যোগ করো</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">নাম</th><th>দাম</th><th>মেয়াদ</th><th>এক্সাম সীমা</th><th>অবস্থা</th><th></th></tr></thead>
              <tbody className="dark:text-gray-200">
                {plans.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100 dark:border-white/10">
                    <td className="py-2">{p.name}<div className="text-xs text-gray-500">{p.description}</div></td>
                    <td>৳{p.price}</td>
                    <td>{p.durationDays} দিন</td>
                    <td>{p.examLimitType === 'limited' ? `${p.examLimit}টি` : 'Unlimit'}</td>
                    <td><span className={`badge ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{p.isActive ? 'চালু' : 'বন্ধ'}</span></td>
                    <td className="flex flex-wrap gap-1 py-2">
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const price = window.prompt('নতুন দাম (৳)', p.price);
                        if (price !== null && price !== '') act(() => axiosClient.put(`/admin/plans/${p._id}`, { price }));
                      }}>দাম বদলাও</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const isLimited = window.confirm('এই প্ল্যানে Limit চালু করবে? (Cancel দিলে Unlimit হবে)');
                        if (!isLimited) return act(() => axiosClient.put(`/admin/plans/${p._id}`, { examLimitType: 'unlimited' }));
                        const n = window.prompt('সর্বোচ্চ কতটি পরীক্ষা?', p.examLimit || '');
                        if (n !== null && Number(n) > 0) act(() => axiosClient.put(`/admin/plans/${p._id}`, { examLimitType: 'limited', examLimit: n }));
                      }}>এক্সাম সীমা বদলাও</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(() => axiosClient.put(`/admin/plans/${p._id}`, { isActive: !p.isActive }))}>{p.isActive ? 'বন্ধ করো' : 'চালু করো'}</button>
                      <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => window.confirm('প্ল্যান মুছবে?') && act(() => axiosClient.delete(`/admin/plans/${p._id}`))}>মুছো</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- প্রোমো কোড ---------- */}
          <h3 className="mb-2 mt-8 text-lg font-semibold dark:text-white">প্রোমো কোড</h3>
          <p className="mb-3 text-sm text-gray-500">শিক্ষক সাবস্ক্রিপশন কেনার সময় এই কোড দিলে সব প্ল্যানের দামে নির্ধারিত শতাংশ ছাড় পাবে।</p>
          <form
            className="card mb-5 grid gap-2 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              act(() => axiosClient.post('/admin/promos', promoForm)).then(() =>
                setPromoForm({ code: '', discountPercent: '', maxUses: '' })
              );
            }}
          >
            <input className="input uppercase" placeholder="প্রোমো কোড (যেমন EID25)" required value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} />
            <input className="input" type="number" min="1" max="100" placeholder="ছাড় (%)" required value={promoForm.discountPercent} onChange={(e) => setPromoForm({ ...promoForm, discountPercent: e.target.value })} />
            <input className="input" type="number" min="0" placeholder="সর্বোচ্চ ব্যবহার (ফাঁকা = সীমাহীন)" value={promoForm.maxUses} onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })} />
            <button className="btn-primary">কোড যোগ করো</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">কোড</th><th>ছাড়</th><th>ব্যবহার</th><th>অবস্থা</th><th></th></tr></thead>
              <tbody className="dark:text-gray-200">
                {promos.map((c) => (
                  <tr key={c._id} className="border-t border-gray-100 dark:border-white/10">
                    <td className="py-2 font-mono font-semibold">{c.code}</td>
                    <td>{c.discountPercent}%</td>
                    <td>{c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : ' (সীমাহীন)'}</td>
                    <td><span className={`badge ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{c.isActive ? 'চালু' : 'বন্ধ'}</span></td>
                    <td className="flex flex-wrap gap-1 py-2">
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const v = window.prompt('নতুন ছাড় (%)', c.discountPercent);
                        if (v !== null && v !== '') act(() => axiosClient.put(`/admin/promos/${c._id}`, { discountPercent: v }));
                      }}>ছাড় বদলাও</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const v = window.prompt('সর্বোচ্চ কতবার ব্যবহার করা যাবে? (0 = সীমাহীন)', c.maxUses);
                        if (v !== null && v !== '') act(() => axiosClient.put(`/admin/promos/${c._id}`, { maxUses: v }));
                      }}>সীমা বদলাও</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(() => axiosClient.put(`/admin/promos/${c._id}`, { isActive: !c.isActive }))}>{c.isActive ? 'বন্ধ করো' : 'চালু করো'}</button>
                      <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => window.confirm('কোড মুছবে?') && act(() => axiosClient.delete(`/admin/promos/${c._id}`))}>মুছো</button>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && <tr><td colSpan="5" className="py-4 text-gray-500">এখনো কোনো প্রোমো কোড নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
