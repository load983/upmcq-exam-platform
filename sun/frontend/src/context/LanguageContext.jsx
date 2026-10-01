// ================== context/LanguageContext.jsx ==================
// বাংলা / English ভাষা সিস্টেম।
// - নির্বাচিত ভাষা localStorage-এ সেভ হয়, তাই পরের বার এলেও একই ভাষা থাকবে।
// - কম্পোনেন্টে:  const { t, lang, setLang } = useLanguage();  →  t('nav.dashboard')
// - কম্পোনেন্টের বাইরে (যেমন Redux slice-এ):  import { translate } → translate('key')
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { translations, LANGUAGES, DEFAULT_LANG } from '../i18n/translations';
import { translateServerMessage } from '../i18n/serverMessages';

const LangContext = createContext(null);
const LANG_KEY = 'app-lang';

const isValidLang = (code) => LANGUAGES.some((l) => l.code === code);

function readInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (isValidLang(saved)) return saved;
  } catch {
    /* localStorage ব্লক থাকলে ডিফল্ট ভাষা */
  }
  return DEFAULT_LANG;
}

// অ্যাডমিনের বদলানো লেখা: { key: { bn, en } } — SiteContext এটা সেট করে, প্রোভাইডার শুনে রি-রেন্ডার করে
let textOverrides = {};
const overrideListeners = new Set();
export function applyTextOverrides(list) {
  const next = {};
  (Array.isArray(list) ? list : []).forEach((o) => { if (o && o.key) next[o.key] = { bn: o.bn || '', en: o.en || '' }; });
  textOverrides = next;
  overrideListeners.forEach((fn) => fn());
}

// React-এর বাইরে (যেমন Redux thunk) থেকেও অনুবাদ পাওয়ার জন্য বর্তমান ভাষা মডিউল লেভেলে রাখা হয়
let currentLang = readInitialLang();

// {name} ধরনের প্লেসহোল্ডার বসিয়ে অনুবাদ রিটার্ন করে।
// কোনো key না পেলে অন্য ভাষা, তাও না পেলে key নিজেই দেখায় (যাতে ডেভেলপমেন্টে মিসিং key ধরা পড়ে)।
export function translate(key, params, lang = currentLang) {
  const dict = translations[lang] || translations[DEFAULT_LANG];
  // অ্যাডমিন (ওয়েবসাইট কাস্টমাইজ) যে লেখা বদলেছে সেটা আগে; না থাকলে ডিফল্ট
  const custom = textOverrides[key]?.[lang];
  let text = custom || (dict[key] ?? translations[DEFAULT_LANG][key] ?? key);
  if (params) {
    text = text.replace(/\{(\w+)\}/g, (match, name) =>
      params[name] !== undefined && params[name] !== null ? String(params[name]) : match
    );
  }
  return text;
}

// ব্যাকএন্ডের মেসেজ বর্তমান ভাষায় রূপান্তর (axiosClient ও কম্পোনেন্ট দুই জায়গা থেকেই ব্যবহার হয়)
export const getLang = () => currentLang;
export const translateMessage = (msg) => translateServerMessage(msg, currentLang);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    currentLang = readInitialLang();
    return currentLang;
  });

  const setLang = useCallback((code) => {
    if (!isValidLang(code)) return;
    currentLang = code; // Redux thunk-এ সাথে সাথে নতুন ভাষা পাওয়ার জন্য
    setLangState(code);
  }, []);

  useEffect(() => {
    currentLang = lang;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(LANG_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  // অ্যাডমিন লেখা বদলালে সবাইকে নতুন t() দিতে এই ভার্সন বদলায়
  const [overrideVer, setOverrideVer] = useState(0);
  useEffect(() => {
    const fn = () => setOverrideVer((v) => v + 1);
    overrideListeners.add(fn);
    return () => overrideListeners.delete(fn);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const t = useCallback((key, params) => translate(key, params, lang), [lang, overrideVer]);
  const tm = useCallback((msg) => translateServerMessage(msg, lang), [lang]);

  const value = useMemo(() => {
    const meta = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    return {
      lang,
      setLang,
      t,
      tm,
      locale: meta.locale, // toLocaleDateString ইত্যাদির জন্য
      languages: LANGUAGES,
    };
  }, [lang, setLang, t, tm]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLanguage অবশ্যই LanguageProvider এর ভেতরে ব্যবহার করতে হবে');
  return ctx;
}
