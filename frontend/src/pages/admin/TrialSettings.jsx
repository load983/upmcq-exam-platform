// ================== pages/admin/TrialSettings.jsx ==================
// "Test Web": নতুন শিক্ষক একাউন্ট খুললেই কতদিন এবং কোন কোন ফিচার ব্যবহার করতে পারবে — অ্যাডমিন এখানে ঠিক করে।
import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';

export default function TrialSettings({ say }) {
  const [form, setForm] = useState({ enabled: false, durationDays: 7, features: [], examLimit: 0 });
  const [catalog, setCatalog] = useState([]);
  const [counts, setCounts] = useState({ activeTrials: 0, totalTrials: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const apply = (data) => {
    setForm({ ...data.trial, durationDays: data.trial.durationDays || 7 });
    setCatalog(data.catalog || []);
    setCounts({ activeTrials: data.activeTrials || 0, totalTrials: data.totalTrials || 0 });
  };

  useEffect(() => {
    axiosClient.get('/admin/trial').then(({ data }) => apply(data))
      .catch((e) => say(e.response?.data?.message || 'লোড করা যায়নি'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = (key) => setForm((f) => ({ ...f, features: f.features.includes(key) ? f.features.filter((k) => k !== key) : [...f.features, key] }));
  const allSelected = catalog.length > 0 && form.features.length === catalog.length;

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axiosClient.put('/admin/trial', form);
      apply(data);
      say(data.message || 'সেভ হয়েছে');
    } catch (err) {
      say(err.response?.data?.message || 'সেভ করা যায়নি');
    } finally { setSaving(false); }
  };

  if (loading) return <p className="text-gray-500">লোড হচ্ছে...</p>;

  return (
    <form onSubmit={save} className="space-y-5">
      <p className="text-sm text-gray-500">
        চালু থাকলে যে-কেউ নতুন শিক্ষক একাউন্ট খুললেই নিচের মেয়াদ ও ফিচারসহ ফ্রি ট্রায়াল অটোমেটিক পাবে। শিক্ষক পূর্ণ প্ল্যান কিনলে (বা তুমি সাবস্ক্রিপশন দিলে) ট্রায়াল শেষ হয়ে পূর্ণ প্ল্যান সাথে সাথে শুরু হবে।
        পরিবর্তন শুধু এরপর খোলা নতুন একাউন্টে প্রযোজ্য — আগের ট্রায়াল বদলাবে না।
      </p>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <div className="card p-3"><div className="text-xs text-gray-500">এখন ট্রায়ালে আছে</div><div className="text-2xl font-bold text-green-600">{counts.activeTrials}</div></div>
        <div className="card p-3"><div className="text-xs text-gray-500">মোট ট্রায়াল দেওয়া হয়েছে</div><div className="text-2xl font-bold dark:text-white">{counts.totalTrials}</div></div>
      </div>

      <label className="card flex items-center gap-3 p-4 text-sm font-medium dark:text-gray-200">
        <input type="checkbox" className="h-4 w-4" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
        নতুন শিক্ষককে অটোমেটিক ফ্রি ট্রায়াল দাও
        <span className={`badge ml-auto ${form.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>{form.enabled ? 'চালু' : 'বন্ধ'}</span>
      </label>

      <div className={`space-y-5 ${form.enabled ? '' : 'pointer-events-none opacity-50'}`}>
        <div className="card grid gap-3 p-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium dark:text-gray-200">⏳ ট্রায়ালের মেয়াদ (দিন)</span>
            <input className="input" type="number" min="1" max="365" value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: e.target.value })} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium dark:text-gray-200">📝 সর্বোচ্চ পরীক্ষা তৈরি (০ = সীমাহীন)</span>
            <input className="input" type="number" min="0" value={form.examLimit} onChange={(e) => setForm({ ...form, examLimit: e.target.value })} />
          </label>
        </div>

        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold dark:text-white">ট্রায়ালে যেসব ফিচার চালু থাকবে</h3>
            <button type="button" className="btn-secondary !px-3 !py-1 text-xs" onClick={() => setForm({ ...form, features: allSelected ? [] : catalog.map((f) => f.key) })}>
              {allSelected ? 'সব বাদ দাও' : 'সব সিলেক্ট করো'}
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {catalog.map((f) => (
              <label key={f.key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm ${form.features.includes(f.key) ? 'border-primary-500 bg-primary-50 dark:bg-primary-500/10' : 'border-gray-200 dark:border-white/10'}`}>
                <input type="checkbox" className="mt-1 h-4 w-4" checked={form.features.includes(f.key)} onChange={() => toggle(f.key)} />
                <span><span className="block font-medium dark:text-gray-100">{f.label}</span><span className="block text-xs text-gray-500">{f.desc}</span></span>
              </label>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-500">পরীক্ষা এডিট/পাবলিশ/মুছা এবং স্টুডেন্টদের পরীক্ষা দেওয়া ট্রায়ালেও সবসময় চালু থাকে।</p>
        </div>
      </div>

      <button className="btn-primary" disabled={saving}>{saving ? 'সেভ হচ্ছে...' : 'সেভ করো'}</button>
    </form>
  );
}
