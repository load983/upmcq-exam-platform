// ================== pages/admin/CustomizeWebsite.jsx ==================
// অ্যাডমিন এখান থেকে: (১) লোগো ও সাইটের নাম (২) ওয়েবসাইটের যেকোনো লেখা (৩) ফুটারের "Important Links" ও তাদের পেজ বদলায়।
import React, { useEffect, useMemo, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import assetUrl from '../../utils/assetUrl';
import { translations } from '../../i18n/translations';
import { useLanguage } from '../../context/LanguageContext';
import { useSite } from '../../context/SiteContext';
import { useDialog } from './adminUi';

const BRAND_KEYS = ['brand.name', 'brand.short', 'brand.splash'];
const PAGE_SIZE = 40;
const ALL_KEYS = Object.keys(translations.bn);
const GROUPS = [...new Set(ALL_KEYS.map((k) => k.split('.')[0]))].sort();

// overrides: { key: { bn, en } }
const toMap = (list) => Object.fromEntries((list || []).map((o) => [o.key, { bn: o.bn || '', en: o.en || '' }]));
const toList = (map) => Object.entries(map).filter(([, v]) => v.bn.trim() || v.en.trim()).map(([key, v]) => ({ key, bn: v.bn, en: v.en }));
let uid = 0;
const withKey = (l) => ({ ...l, _k: ++uid });

export default function CustomizeWebsite({ say }) {
  const { t } = useLanguage();
  const { refreshSite } = useSite();
  const [ask, dialog] = useDialog();
  const [sub, setSub] = useState('brand');
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [overrides, setOverrides] = useState({});
  const [links, setLinks] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axiosClient.get('/admin/site')
      .then(({ data }) => {
        setLogoUrl(data.logoUrl || '');
        setOverrides(toMap(data.textOverrides));
        setLinks((data.footerLinks || []).map(withKey));
      })
      .catch((e) => say(e.response?.data?.message || t('a.loadFailed')))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setText = (key, lang, value) =>
    setOverrides((o) => ({ ...o, [key]: { bn: '', en: '', ...o[key], [lang]: value } }));
  const resetText = (keys) =>
    setOverrides((o) => { const n = { ...o }; keys.forEach((k) => delete n[k]); return n; });

  const run = async (fn) => {
    setSaving(true);
    try { await fn(); await refreshSite(); } catch (err) { say(err.response?.data?.message || t('a.saveFailed')); } finally { setSaving(false); }
  };

  const saveTexts = () => run(async () => {
    const { data } = await axiosClient.put('/admin/site/texts', { overrides: toList(overrides) });
    setOverrides(toMap(data.textOverrides));
    say(data.message || t('a.saved'));
  });

  const saveFooter = () => run(async () => {
    // শিরোনামের লেখা (footer.importantLinks) আর লিংকের তালিকা একসাথে সেভ
    const [tx, fl] = await Promise.all([
      axiosClient.put('/admin/site/texts', { overrides: toList(overrides) }),
      axiosClient.put('/admin/site/footer', { footerLinks: links }),
    ]);
    setOverrides(toMap(tx.data.textOverrides));
    setLinks((fl.data.footerLinks || []).map(withKey));
    say(fl.data.message || t('a.saved'));
  });

  if (loading) return <p className="text-gray-500">{t('a.loading')}</p>;

  const SUBS = [['brand', 'cz.sub.brand'], ['texts', 'cz.sub.texts'], ['footer', 'cz.sub.footer']];

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">{t('cz.intro')}</p>

      <div className="flex flex-wrap gap-2" role="tablist">
        {SUBS.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={sub === k}
            onClick={() => setSub(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${sub === k ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-200 dark:hover:bg-white/15'}`}
          >
            {t(label)}
          </button>
        ))}
      </div>

      {sub === 'brand' && (
        <BrandTab
          say={say} saving={saving} logoUrl={logoUrl} setLogoUrl={setLogoUrl} refreshSite={refreshSite}
          overrides={overrides} setText={setText} onSave={saveTexts}
        />
      )}
      {sub === 'texts' && (
        <TextsTab overrides={overrides} setText={setText} resetText={resetText} onSave={saveTexts} saving={saving} />
      )}
      {sub === 'footer' && (
        <FooterTab
          links={links} setLinks={setLinks} overrides={overrides} setText={setText}
          onSave={saveFooter} saving={saving} ask={ask}
        />
      )}
      {dialog}
    </div>
  );
}

// ------------------------------------------------------------ দুই ভাষার ইনপুট
function BilingualField({ label, k, overrides, setText, long }) {
  const { t } = useLanguage();
  const Tag = long ? 'textarea' : 'input';
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {['bn', 'en'].map((lang) => (
        <label key={lang} className="block text-sm">
          <span className="mb-1 block font-medium dark:text-gray-200">{label} — {t(`cz.${lang}`)}</span>
          <Tag
            className={`input ${long ? 'min-h-[4.5rem]' : ''}`}
            maxLength={2000}
            placeholder={translations[lang][k] || ''}
            value={overrides[k]?.[lang] || ''}
            onChange={(e) => setText(k, lang, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}

// ------------------------------------------------------------ ১) লোগো ও নাম
function BrandTab({ say, saving, logoUrl, setLogoUrl, refreshSite, overrides, setText, onSave }) {
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  const upload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return say(t('cz.logoBadType'));
    if (file.size > 1024 * 1024) return say(t('cz.logoTooBig'));
    const fd = new FormData();
    fd.append('logo', file);
    setBusy(true);
    try {
      const { data } = await axiosClient.post('/admin/site/logo', fd);
      setLogoUrl(data.logoUrl);
      await refreshSite();
      say(data.message || t('a.saved'));
    } catch (err) {
      say(err.response?.data?.message || t('a.saveFailed'));
    } finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true);
    try {
      const { data } = await axiosClient.delete('/admin/site/logo');
      setLogoUrl('');
      await refreshSite();
      say(data.message || t('a.saved'));
    } catch (err) {
      say(err.response?.data?.message || t('a.saveFailed'));
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <div className="card p-4">
        <h3 className="mb-1 font-semibold dark:text-white">{t('cz.logo')}</h3>
        <p className="mb-3 text-sm text-gray-500">{t('cz.logoHint')}</p>
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid h-20 w-20 place-items-center overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
            {logoUrl ? <img src={assetUrl(logoUrl)} alt="" className="h-full w-full object-contain" /> : <span className="text-2xl" aria-hidden="true">📝</span>}
          </div>
          <div className="space-y-2">
            {!logoUrl && <p className="text-sm text-gray-500">{t('cz.noLogo')}</p>}
            <div className="flex flex-wrap gap-2">
              <label className={`btn-primary cursor-pointer ${busy ? 'pointer-events-none opacity-60' : ''}`}>
                {busy ? t('cz.uploading') : t('cz.upload')}
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={upload} disabled={busy} />
              </label>
              {logoUrl && <button type="button" className="btn-secondary" onClick={remove} disabled={busy}>{t('cz.removeLogo')}</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="card space-y-4 p-4">
        <h3 className="font-semibold dark:text-white">{t('cz.brandNames')}</h3>
        <BilingualField label={t('cz.brandName')} k="brand.name" overrides={overrides} setText={setText} />
        <BilingualField label={t('cz.brandShort')} k="brand.short" overrides={overrides} setText={setText} />
        <BilingualField label={t('cz.brandSplash')} k="brand.splash" overrides={overrides} setText={setText} />
        <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>{saving ? t('a.saving') : t('a.save')}</button>
      </div>
    </div>
  );
}

// ------------------------------------------------------------ ২) ওয়েবসাইটের সব লেখা
function TextsTab({ overrides, setText, resetText, onSave, saving }) {
  const { t } = useLanguage();
  const [q, setQ] = useState('');
  const [group, setGroup] = useState('');
  const [onlyEdited, setOnlyEdited] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const changed = useMemo(() => Object.keys(overrides).filter((k) => overrides[k].bn.trim() || overrides[k].en.trim()), [overrides]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return ALL_KEYS.filter((k) => {
      if (group && !k.startsWith(`${group}.`)) return false;
      if (onlyEdited && !changed.includes(k)) return false;
      if (!s) return true;
      return k.toLowerCase().includes(s)
        || (translations.bn[k] || '').toLowerCase().includes(s)
        || (translations.en[k] || '').toLowerCase().includes(s)
        || (overrides[k]?.bn || '').toLowerCase().includes(s)
        || (overrides[k]?.en || '').toLowerCase().includes(s);
    });
  }, [q, group, onlyEdited, changed, overrides]);

  useEffect(() => setLimit(PAGE_SIZE), [q, group, onlyEdited]);
  const shown = filtered.slice(0, limit);

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t('cz.textsHint')}</p>

      <div className="card sticky top-14 z-10 flex flex-wrap items-center gap-2 p-3">
        <input className="input sm:max-w-xs" placeholder={t('cz.search')} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:max-w-[11rem]" value={group} onChange={(e) => setGroup(e.target.value)} aria-label={t('cz.allGroups')}>
          <option value="">{t('cz.allGroups')}</option>
          {GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm dark:text-gray-200">
          <input type="checkbox" className="h-4 w-4" checked={onlyEdited} onChange={(e) => setOnlyEdited(e.target.checked)} />
          {t('cz.onlyEdited')}
        </label>
        <span className="text-xs text-gray-500">{t('cz.changedCount', { n: changed.length })}</span>
        <button type="button" className="btn-primary ml-auto" onClick={onSave} disabled={saving}>{saving ? t('a.saving') : t('a.save')}</button>
      </div>

      {filtered.length === 0 && <p className="text-sm text-gray-500">{t('cz.noMatch')}</p>}

      <div className="space-y-3">
        {shown.map((k) => {
          const isChanged = changed.includes(k);
          return (
            <div key={k} className={`card space-y-2 p-3 ${isChanged ? 'ring-1 ring-primary-400' : ''}`}>
              <div className="flex items-center justify-between gap-2">
                <code className="break-all text-xs text-gray-500">{k}</code>
                {isChanged && <button type="button" className="text-xs font-medium text-red-600 hover:underline" onClick={() => resetText([k])}>{t('cz.reset')}</button>}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {['bn', 'en'].map((lang) => {
                  const def = translations[lang][k] || '';
                  const long = def.length > 70;
                  const Tag = long ? 'textarea' : 'input';
                  return (
                    <label key={lang} className="block text-xs">
                      <span className="mb-1 block font-medium text-gray-600 dark:text-gray-300">{t(`cz.${lang}`)}</span>
                      <Tag
                        className={`input ${long ? 'min-h-[4.5rem]' : ''}`}
                        maxLength={2000}
                        placeholder={def}
                        value={overrides[k]?.[lang] || ''}
                        onChange={(e) => setText(k, lang, e.target.value)}
                      />
                      {isChanged && <span className="mt-0.5 block text-gray-400">{t('cz.default')}: {def}</span>}
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length > 0 && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500">{t('cz.showing', { shown: shown.length, total: filtered.length })}</span>
          {shown.length < filtered.length && <button type="button" className="btn-secondary" onClick={() => setLimit((n) => n + PAGE_SIZE)}>{t('cz.more')}</button>}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------ ৩) ফুটারের Important Links
function FooterTab({ links, setLinks, overrides, setText, onSave, saving, ask }) {
  const { t } = useLanguage();
  const upd = (i, patch) => setLinks((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const move = (i, d) => setLinks((ls) => {
    const j = i + d;
    if (j < 0 || j >= ls.length) return ls;
    const n = [...ls];
    [n[i], n[j]] = [n[j], n[i]];
    return n;
  });
  const add = () => setLinks((ls) => (ls.length >= 10 ? ls : [...ls, withKey({ slug: `page-${ls.length + 1}`, titleBn: '', titleEn: '', contentBn: '', contentEn: '', externalUrl: '', enabled: true })]));
  const remove = async (i) => {
    const ok = await ask({ title: t('cz.f.confirmRemove'), danger: true });
    if (ok) setLinks((ls) => ls.filter((_, idx) => idx !== i));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{t('cz.f.intro')}</p>

      <div className="card p-4">
        <BilingualField label={t('cz.f.heading')} k="footer.importantLinks" overrides={overrides} setText={setText} />
      </div>

      {links.length === 0 && <p className="text-sm text-gray-500">{t('cz.f.empty')}</p>}

      {links.map((l, i) => (
        <div key={l._k} className="card space-y-3 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm font-medium dark:text-gray-200">
              <input type="checkbox" className="h-4 w-4" checked={l.enabled !== false} onChange={(e) => upd(i, { enabled: e.target.checked })} />
              {t('cz.f.enabled')}
            </label>
            <div className="flex gap-1">
              <button type="button" className="btn-secondary !px-2.5 !py-1 text-xs" onClick={() => move(i, -1)} disabled={i === 0}>↑ {t('cz.f.up')}</button>
              <button type="button" className="btn-secondary !px-2.5 !py-1 text-xs" onClick={() => move(i, 1)} disabled={i === links.length - 1}>↓ {t('cz.f.down')}</button>
              <button type="button" className="btn-danger !px-3" onClick={() => remove(i)} aria-label={t('a.delete')}>✕</button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium dark:text-gray-200">{t('cz.f.titleBn')}</span>
              <input className="input" maxLength={80} value={l.titleBn} onChange={(e) => upd(i, { titleBn: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium dark:text-gray-200">{t('cz.f.titleEn')}</span>
              <input className="input" maxLength={80} value={l.titleEn} onChange={(e) => upd(i, { titleEn: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium dark:text-gray-200">{t('cz.f.slug')}</span>
              <input className="input" maxLength={40} value={l.slug} onChange={(e) => upd(i, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} />
              <span className="mt-0.5 block text-xs text-gray-400">{t('cz.f.slugHint')}</span>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium dark:text-gray-200">{t('cz.f.url')}</span>
              <input className="input" maxLength={300} placeholder="https://" value={l.externalUrl} onChange={(e) => upd(i, { externalUrl: e.target.value })} />
              <span className="mt-0.5 block text-xs text-gray-400">{t('cz.f.urlHint')}</span>
            </label>
          </div>

          {!l.externalUrl.trim() && (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block font-medium dark:text-gray-200">{t('cz.f.contentBn')}</span>
                <textarea className="input min-h-[10rem]" maxLength={20000} value={l.contentBn} onChange={(e) => upd(i, { contentBn: e.target.value })} />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium dark:text-gray-200">{t('cz.f.contentEn')}</span>
                <textarea className="input min-h-[10rem]" maxLength={20000} value={l.contentEn} onChange={(e) => upd(i, { contentEn: e.target.value })} />
              </label>
              <p className="text-xs text-gray-400 sm:col-span-2">{t('cz.f.contentHint')}</p>
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={add} disabled={links.length >= 10}>{t('cz.f.add')}</button>
        <button type="button" className="btn-primary" onClick={onSave} disabled={saving}>{saving ? t('a.saving') : t('a.save')}</button>
      </div>
    </div>
  );
}
