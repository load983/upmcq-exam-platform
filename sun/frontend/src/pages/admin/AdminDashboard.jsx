// ================== pages/admin/AdminDashboard.jsx ==================
// অ্যাডমিন প্যানেল: ওভারভিউ, শিক্ষক ও সাবস্ক্রিপশন কন্ট্রোল, পেমেন্ট যাচাই, প্ল্যান ম্যানেজমেন্ট
import React, { useEffect, useState, useCallback } from 'react';
import axiosClient from '../../api/axiosClient';
import ContactSettings from './ContactSettings';
import SupportInbox from './SupportInbox';
import TrialSettings from './TrialSettings';
import { downloadFile } from '../../utils/download';
import { useLanguage } from '../../context/LanguageContext';

// অবস্থার লেখা এখানে নেই — রেন্ডারের সময় t() দিয়ে বসে, তাই ভাষা বদলালে সাথে সাথে বদলায়
const stateBadge = {
  active: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  suspended: 'bg-orange-100 text-orange-800',
  none: 'bg-gray-200 text-gray-700',
};
const payBadge = {
  pending: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-200 text-gray-700',
  suspended: 'bg-orange-100 text-orange-800',
};

function Stat({ label, value, tone = '' }) {
  return (
    <div className="card">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`text-2xl font-bold ${tone} dark:text-white`}>{value}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { t, locale } = useLanguage();
  const fmt = (d) => (d ? new Date(d).toLocaleDateString(locale) : '-');
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
  const [chatUnread, setChatUnread] = useState(0);
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationDays: '', description: '', examLimitType: 'unlimited', examLimit: '' });

  const say = useCallback((m) => { setMsg(m); setTimeout(() => setMsg(''), 4000); }, []);
  const errMsg = (e) => say(e.response?.data?.message || t('a.error'));

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

  // অপঠিত চ্যাট মেসেজের সংখ্যা (ট্যাবের ব্যাজের জন্য) — প্রতি ১০ সেকেন্ডে
  useEffect(() => {
    const load = () => { if (!document.hidden) axiosClient.get('/admin/support/unread').then(({ data }) => setChatUnread(data.unread || 0)).catch(() => {}); };
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  const refresh = () => { loadStats(); loadTeachers(); loadPayments(); loadPlans(); loadPromos(); };

  const act = async (fn) => {
    try {
      const { data } = await fn();
      say(data.message || t('a.done'));
      refresh();
    } catch (e) { errMsg(e); }
  };

  // 📥 Excel ডাউনলোড (বর্তমান ফিল্টার সহ)
  const exportExcel = async (path, filename, params) => {
    try { await downloadFile(path, filename, params); say(t('a.excelStarted')); }
    catch (e) { say(e.message); }
  };

  const teacherAction = (id, action, body) => act(() => axiosClient.post(`/admin/teachers/${id}/${action}`, body || {}));

  const askDays = (label) => {
    const v = window.prompt(label, '30');
    return v ? Number(v) : null;
  };

  const tabs = [
    ['overview', t('a.tab.overview')],
    ['teachers', t('a.tab.teachers')],
    ['payments', `${t('a.tab.payments')}${stats?.pendingPayments ? ` (${stats.pendingPayments})` : ''}`],
    ['plans', t('a.tab.plans')],
    ['trial', t('a.tab.trial')],
    ['messages', `${t('a.tab.messages')}${chatUnread ? ` (${chatUnread})` : ''}`],
    ['contact', t('a.tab.contact')],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-4 text-2xl font-bold dark:text-white">{t('a.title')}</h1>
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={tab === k ? 'btn-primary' : 'btn-secondary'}>{l}</button>
        ))}
      </div>
      {msg && <div className="mb-4 rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">{msg}</div>}

      {/* ---------- Test Web (নতুন শিক্ষকের অটো ফ্রি ট্রায়াল) ---------- */}
      {tab === 'trial' && <TrialSettings say={say} />}

      {/* ---------- ইউজারদের মেসেজ (চ্যাট ইনবক্স) ---------- */}
      {tab === 'messages' && <SupportInbox say={say} onUnreadChange={setChatUnread} />}

      {/* ---------- যোগাযোগ সেটিং (হেল্পলাইন) ---------- */}
      {tab === 'contact' && <ContactSettings say={say} />}

      {/* ---------- ওভারভিউ ---------- */}
      {tab === 'overview' && stats && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label={t('a.stat.totalTeachers')} value={stats.totalTeachers} />
          <Stat label={t('a.stat.active')} value={stats.active} tone="text-green-600" />
          <Stat label={t('a.stat.expiring')} value={stats.expiringSoon} tone="text-yellow-600" />
          <Stat label={t('a.stat.pendingPayments')} value={stats.pendingPayments} tone="text-yellow-600" />
          <Stat label={t('a.stat.expired')} value={stats.expired} tone="text-red-600" />
          <Stat label={t('a.stat.suspended')} value={stats.suspended} tone="text-orange-600" />
          <Stat label={t('a.stat.none')} value={stats.none} />
          <Stat label={t('a.stat.revenue')} value={`৳${stats.revenueTotal}`} />
          <Stat label={t('a.stat.month')} value={`৳${stats.revenueThisMonth}`} />
        </div>
      )}

      {/* ---------- শিক্ষক ---------- */}
      {tab === 'teachers' && (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
            <button className="btn-success" onClick={() => exportExcel('/admin/teachers/export', 'teachers.xlsx', { search, state: stateFilter })}>📥 Excel</button>
            <input className="input max-w-xs" placeholder={t('a.t.search')} value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input max-w-[10rem]" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="">{t('a.t.allStates')}</option>
              <option value="active">{t('a.state.active')}</option>
              <option value="expired">{t('a.state.expired')}</option>
              <option value="suspended">{t('a.state.suspended')}</option>
              <option value="none">{t('a.t.noSub')}</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">{t('a.t.teacher')}</th><th>{t('a.t.status')}</th><th>{t('a.t.plan')}</th><th>{t('a.t.expiry')}</th><th>{t('a.t.controls')}</th></tr></thead>
              <tbody className="dark:text-gray-200">
                {teachers.map((tc) => {
                  const s = tc.subscription;
                  return (
                    <tr key={tc._id} className="border-t border-gray-100 align-top dark:border-white/10">
                      <td className="py-2"><div className="font-medium">{tc.name}</div><div className="text-xs text-gray-500">{tc.email}</div></td>
                      <td><span className={`badge ${stateBadge[s.state]}`}>{t(`a.state.${s.state}`)}</span></td>
                      <td>{s.planName || '-'}</td>
                      <td>{fmt(s.expiresAt)}{s.state === 'active' && <div className="text-xs text-gray-500">{t('a.t.daysLeft', { n: s.daysLeft })}</div>}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => { const d = askDays(t('a.t.askExtend')); if (d) teacherAction(tc._id, 'extend', { days: d }); }}>{t('a.t.addDays')}</button>
                          <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => { const d = askDays(t('a.t.askGrant')); if (d) teacherAction(tc._id, 'grant', { days: d, note: 'অ্যাডমিন প্রদত্ত' }); }}>{t('a.t.grant')}</button>
                          {s.state === 'suspended'
                            ? <button className="btn-success !px-2 !py-1 text-xs" onClick={() => teacherAction(tc._id, 'resume')}>{t('a.t.resume')}</button>
                            : s.state === 'active' && <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => teacherAction(tc._id, 'suspend')}>{t('a.t.suspend')}</button>}
                          {(s.state === 'active' || s.state === 'suspended') && (
                            <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => window.confirm(t('a.t.confirmRevoke')) && teacherAction(tc._id, 'revoke')}>{t('a.t.revoke')}</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {teachers.length === 0 && <tr><td colSpan="5" className="py-4 text-gray-500">{t('a.t.none')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------- পেমেন্ট ---------- */}
      {tab === 'payments' && (
        <div>
          <div className="mb-3 flex flex-wrap gap-2">
          <button className="btn-success" onClick={() => exportExcel('/admin/payments/export', 'payments.xlsx', { status: payFilter })}>📥 Excel</button>
          <select className="input max-w-[12rem]" value={payFilter} onChange={(e) => setPayFilter(e.target.value)}>
            <option value="pending">{t('a.p.pending')}</option>
            <option value="active">{t('a.p.approved')}</option>
            <option value="rejected">{t('a.p.rejected')}</option>
            <option value="failed">{t('a.p.failed')}</option>
            <option value="">{t('a.p.all')}</option>
          </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">{t('a.p.date')}</th><th>{t('a.p.teacher')}</th><th>{t('a.p.plan')}</th><th>{t('a.p.amount')}</th><th>{t('a.p.method')}</th><th>{t('a.p.status')}</th><th></th></tr></thead>
              <tbody className="dark:text-gray-200">
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100 align-top dark:border-white/10">
                    <td className="py-2">{fmt(p.createdAt)}</td>
                    <td>{p.teacher?.name}<div className="text-xs text-gray-500">{p.teacher?.email}</div></td>
                    <td>{p.planName}<div className="text-xs text-gray-500">{t('a.days', { n: p.durationDays })}</div></td>
                    <td>৳{p.amount}{p.promoCode && <div className="text-xs text-green-700">{p.promoCode} (-{p.discountPercent}%)<span className="text-gray-500"> {t('a.p.original', { n: p.originalAmount })}</span></div>}</td>
                    <td>
                      {p.provider === 'trial' ? t('a.p.freeTrial') : p.method === 'admin' ? t('a.p.admin') : `${p.provider}`}
                      <div className="text-xs">{p.trxId || p.tranId}</div>
                      {p.senderNumber && <div className="text-xs text-gray-500">{t('a.p.from', { n: p.senderNumber })}</div>}
                    </td>
                    <td><span className={`badge ${payBadge[p.status] || ''}`}>{payBadge[p.status] ? t(`pay.status.${p.status}`) : p.status}</span></td>
                    <td>
                      {p.status === 'pending' && p.method === 'manual' && (
                        <div className="flex gap-1">
                          <button className="btn-success !px-2 !py-1 text-xs" onClick={() => act(() => axiosClient.post(`/admin/payments/${p._id}/approve`))}>{t('a.p.approve')}</button>
                          <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => { const r = window.prompt(t('a.p.reason')); if (r !== null) act(() => axiosClient.post(`/admin/payments/${p._id}/reject`, { reason: r })); }}>{t('a.p.reject')}</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan="7" className="py-4 text-gray-500">{t('a.p.none')}</td></tr>}
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
                return alert(t('a.pl.limitAlert'));
              }
              act(() => axiosClient.post('/admin/plans', planForm)).then(() =>
                setPlanForm({ name: '', price: '', durationDays: '', description: '', examLimitType: 'unlimited', examLimit: '' })
              );
            }}
          >
            <input className="input" placeholder={t('a.pl.name')} required value={planForm.name} onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })} />
            <input className="input" type="number" min="0" placeholder={t('a.pl.price')} required value={planForm.price} onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })} />
            <input className="input" type="number" min="1" placeholder={t('a.pl.duration')} required value={planForm.durationDays} onChange={(e) => setPlanForm({ ...planForm, durationDays: e.target.value })} />
            <select className="input" value={planForm.examLimitType} onChange={(e) => setPlanForm({ ...planForm, examLimitType: e.target.value })}>
              <option value="unlimited">{t('a.pl.optUnlimited')}</option>
              <option value="limited">{t('a.pl.optLimited')}</option>
            </select>
            {planForm.examLimitType === 'limited' && (
              <input className="input" type="number" min="1" placeholder={t('a.pl.examCount')} required value={planForm.examLimit} onChange={(e) => setPlanForm({ ...planForm, examLimit: e.target.value })} />
            )}
            <input className="input" placeholder={t('a.pl.desc')} value={planForm.description} onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })} />
            <button className="btn-primary">{t('a.pl.add')}</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">{t('a.pl.thName')}</th><th>{t('a.pl.thPrice')}</th><th>{t('a.pl.thDuration')}</th><th>{t('a.pl.thLimit')}</th><th>{t('a.pl.thStatus')}</th><th></th></tr></thead>
              <tbody className="dark:text-gray-200">
                {plans.map((p) => (
                  <tr key={p._id} className="border-t border-gray-100 dark:border-white/10">
                    <td className="py-2">{p.name}<div className="text-xs text-gray-500">{p.description}</div></td>
                    <td>৳{p.price}</td>
                    <td>{t('a.days', { n: p.durationDays })}</td>
                    <td>{p.examLimitType === 'limited' ? t('a.pl.exams', { n: p.examLimit }) : t('a.unlimited')}</td>
                    <td><span className={`badge ${p.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{p.isActive ? t('a.on') : t('a.off')}</span></td>
                    <td className="flex flex-wrap gap-1 py-2">
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const price = window.prompt(t('a.pl.newPrice'), p.price);
                        if (price !== null && price !== '') act(() => axiosClient.put(`/admin/plans/${p._id}`, { price }));
                      }}>{t('a.pl.changePrice')}</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const isLimited = window.confirm(t('a.pl.confirmLimit'));
                        if (!isLimited) return act(() => axiosClient.put(`/admin/plans/${p._id}`, { examLimitType: 'unlimited' }));
                        const n = window.prompt(t('a.pl.maxExams'), p.examLimit || '');
                        if (n !== null && Number(n) > 0) act(() => axiosClient.put(`/admin/plans/${p._id}`, { examLimitType: 'limited', examLimit: n }));
                      }}>{t('a.pl.changeLimit')}</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(() => axiosClient.put(`/admin/plans/${p._id}`, { isActive: !p.isActive }))}>{p.isActive ? t('a.disable') : t('a.enable')}</button>
                      <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => window.confirm(t('a.pl.confirmDelete')) && act(() => axiosClient.delete(`/admin/plans/${p._id}`))}>{t('a.delete')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ---------- প্রোমো কোড ---------- */}
          <h3 className="mb-2 mt-8 text-lg font-semibold dark:text-white">{t('a.pr.title')}</h3>
          <p className="mb-3 text-sm text-gray-500">{t('a.pr.help')}</p>
          <form
            className="card mb-5 grid gap-2 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              act(() => axiosClient.post('/admin/promos', promoForm)).then(() =>
                setPromoForm({ code: '', discountPercent: '', maxUses: '' })
              );
            }}
          >
            <input className="input uppercase" placeholder={t('a.pr.code')} required value={promoForm.code} onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })} />
            <input className="input" type="number" min="1" max="100" placeholder={t('a.pr.discount')} required value={promoForm.discountPercent} onChange={(e) => setPromoForm({ ...promoForm, discountPercent: e.target.value })} />
            <input className="input" type="number" min="0" placeholder={t('a.pr.maxUses')} value={promoForm.maxUses} onChange={(e) => setPromoForm({ ...promoForm, maxUses: e.target.value })} />
            <button className="btn-primary">{t('a.pr.add')}</button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-500"><tr><th className="py-2">{t('a.pr.thCode')}</th><th>{t('a.pr.thDiscount')}</th><th>{t('a.pr.thUsage')}</th><th>{t('a.pr.thStatus')}</th><th></th></tr></thead>
              <tbody className="dark:text-gray-200">
                {promos.map((c) => (
                  <tr key={c._id} className="border-t border-gray-100 dark:border-white/10">
                    <td className="py-2 font-mono font-semibold">{c.code}</td>
                    <td>{c.discountPercent}%</td>
                    <td>{c.usedCount}{c.maxUses > 0 ? ` / ${c.maxUses}` : t('a.pr.noLimit')}</td>
                    <td><span className={`badge ${c.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{c.isActive ? t('a.on') : t('a.off')}</span></td>
                    <td className="flex flex-wrap gap-1 py-2">
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const v = window.prompt(t('a.pr.newDiscount'), c.discountPercent);
                        if (v !== null && v !== '') act(() => axiosClient.put(`/admin/promos/${c._id}`, { discountPercent: v }));
                      }}>{t('a.pr.changeDiscount')}</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => {
                        const v = window.prompt(t('a.pr.newMax'), c.maxUses);
                        if (v !== null && v !== '') act(() => axiosClient.put(`/admin/promos/${c._id}`, { maxUses: v }));
                      }}>{t('a.pr.changeLimit')}</button>
                      <button className="btn-secondary !px-2 !py-1 text-xs" onClick={() => act(() => axiosClient.put(`/admin/promos/${c._id}`, { isActive: !c.isActive }))}>{c.isActive ? t('a.disable') : t('a.enable')}</button>
                      <button className="btn-danger !px-2 !py-1 text-xs" onClick={() => window.confirm(t('a.pr.confirmDelete')) && act(() => axiosClient.delete(`/admin/promos/${c._id}`))}>{t('a.delete')}</button>
                    </td>
                  </tr>
                ))}
                {promos.length === 0 && <tr><td colSpan="5" className="py-4 text-gray-500">{t('a.pr.none')}</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
