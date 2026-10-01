// ================== pages/admin/ContactSettings.jsx ==================
// অ্যাডমিন এখানে ফোন, WhatsApp, Facebook ও অন্যান্য যোগাযোগ মাধ্যম নিজের মতো সেট করে —
// এগুলো সাইটের "হেল্পলাইন" বাটনে শিক্ষক/স্টুডেন্টরা দেখতে পায়।
import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { CONTACT_FIELDS } from '../../utils/contactLinks';
import { useLanguage } from '../../context/LanguageContext';

const empty = { contacts: {}, extras: [], helplineNote: '', chatEnabled: true };

export default function ContactSettings({ say }) {
  const { t } = useLanguage();
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosClient.get('/admin/support/settings')
      .then(({ data }) => setForm({ ...empty, ...data }))
      .catch((e) => say(e.response?.data?.message || t('a.loadFailed')))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setContact = (k, v) => setForm((f) => ({ ...f, contacts: { ...f.contacts, [k]: v } }));
  const setExtra = (i, k, v) => setForm((f) => ({ ...f, extras: f.extras.map((e, idx) => (idx === i ? { ...e, [k]: v } : e)) }));
  const addExtra = () => setForm((f) => (f.extras.length >= 10 ? f : { ...f, extras: [...f.extras, { label: '', value: '' }] }));
  const removeExtra = (i) => setForm((f) => ({ ...f, extras: f.extras.filter((_, idx) => idx !== i) }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axiosClient.put('/admin/support/settings', form);
      setForm({ ...empty, ...data });
      say(data.message || t('a.saved'));
    } catch (err) {
      say(err.response?.data?.message || t('a.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-gray-500">{t('a.loading')}</p>;

  return (
    <form onSubmit={save} className="space-y-5">
      <p className="text-sm text-gray-500">
        {t('a.c.intro')}
      </p>

      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        {CONTACT_FIELDS.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="mb-1 block font-medium dark:text-gray-200">{f.icon} {t(f.labelKey)}</span>
            <input
              className="input"
              placeholder={f.placeholderKey ? t(f.placeholderKey) : f.placeholder}
              value={form.contacts[f.key] || ''}
              onChange={(e) => setContact(f.key, e.target.value)}
              type={f.key === 'email' ? 'email' : 'text'}
              inputMode={f.key === 'phone' || f.key === 'whatsapp' ? 'tel' : undefined}
            />
          </label>
        ))}
      </div>

      <div className="card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="font-semibold dark:text-white">{t('a.c.others')}</h3>
          <button type="button" className="btn-secondary !px-3 !py-1 text-xs" onClick={addExtra} disabled={form.extras.length >= 10}>{t('a.c.add')}</button>
        </div>
        {form.extras.length === 0 && <p className="text-sm text-gray-500">{t('a.c.othersHint')}</p>}
        <div className="space-y-2">
          {form.extras.map((ex, i) => (
            <div key={i} className="flex flex-wrap gap-2 sm:flex-nowrap">
              <input className="input sm:max-w-[10rem]" placeholder={t('a.c.extraName')} maxLength={40} value={ex.label} onChange={(e) => setExtra(i, 'label', e.target.value)} />
              <input className="input" placeholder={t('a.c.extraValue')} maxLength={300} value={ex.value} onChange={(e) => setExtra(i, 'value', e.target.value)} />
              <button type="button" className="btn-danger !px-3" onClick={() => removeExtra(i)} aria-label={t('a.delete')}>✕</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card grid gap-3 p-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium dark:text-gray-200">{t('a.c.noteLabel')}</span>
          <input className="input" maxLength={200} placeholder={t('a.c.notePh')} value={form.helplineNote} onChange={(e) => setForm({ ...form, helplineNote: e.target.value })} />
        </label>
        <label className="flex items-center gap-3 self-end rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:text-gray-200">
          <input type="checkbox" className="h-4 w-4" checked={form.chatEnabled} onChange={(e) => setForm({ ...form, chatEnabled: e.target.checked })} />
          {t('a.c.chat')}
        </label>
      </div>

      <button className="btn-primary" disabled={saving}>{saving ? t('a.saving') : t('a.save')}</button>
    </form>
  );
}
