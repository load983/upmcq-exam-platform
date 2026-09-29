// ================== components/ClassSelect.jsx ==================
// পরীক্ষা তৈরি/আপলোড/এডিটের সময় শ্রেণী নির্বাচনের ড্রপডাউন। শ্রেণী না থাকলে এখান থেকেই তৈরি করা যায়।
import React, { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function ClassSelect({ value = [], onChange }) {
  const { t } = useLanguage();
  const [classes, setClasses] = useState([]);
  const [presets, setPresets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState('');

  const load = () =>
    axiosClient
      .get('/classes')
      .then(({ data }) => {
        setClasses(data.classes || []);
        setPresets(data.presets || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (name) => {
    const finalName = (name ?? newName).trim();
    if (!finalName) return;
    setMsg('');
    try {
      const { data } = await axiosClient.post('/classes', { name: finalName });
      setClasses((c) => [...c, data]);
      onChange([...value, data._id]);
      setNewName('');
    } catch (err) {
      setMsg(err.response?.data?.message || t('classes.createFailed'));
    }
  };

  const remainingPresets = presets.filter((p) => !classes.some((c) => c.name === p));

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium dark:text-gray-200">
        {t('classes.selectLabel')} <span className="text-red-500">*</span>
      </label>
      {loading ? (
        <p className="text-sm text-gray-400">{t('common.loading')}</p>
      ) : (
        <>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('classes.noneYet')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => {
                const checked = value.includes(c._id);
                return (
                  <label
                    key={c._id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      checked
                        ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                        : 'border-gray-300 text-gray-700 dark:border-white/10 dark:text-gray-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        onChange(checked ? value.filter((id) => id !== c._id) : [...value, c._id])
                      }
                      className="h-4 w-4"
                    />
                    {c.name}
                  </label>
                );
              })}
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-primary-600 dark:text-primary-400">{t('classes.addNew')}</summary>
            <div className="mt-2 space-y-2">
              {remainingPresets.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {remainingPresets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handleCreate(p)}
                      className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:border-primary-500 hover:text-primary-600 dark:border-white/10 dark:text-gray-300"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t('classes.customPlaceholder')}
                  className="input"
                />
                <button type="button" onClick={() => handleCreate()} className="btn-secondary shrink-0">
                  {t('classes.create')}
                </button>
              </div>
              {msg && <p className="text-xs text-red-600">{msg}</p>}
            </div>
          </details>
        </>
      )}
    </div>
  );
}
