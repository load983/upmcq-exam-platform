// ================== context/SiteContext.jsx ==================
// অ্যাডমিনের কাস্টমাইজ করা তথ্য (লোগো, সাইটের নাম, বদলানো লেখা, ফুটার লিংক) সার্ভার থেকে এনে সবখানে দেয়।
// শেষবারের কপি localStorage-এ থাকে, তাই পেজ খুলতেই (সার্ভারের উত্তরের আগেই) নতুন লেখা/লোগো দেখা যায়।
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosClient from '../api/axiosClient';
import assetUrl from '../utils/assetUrl';
import { applyTextOverrides, useLanguage } from './LanguageContext';

const SiteContext = createContext({ logoUrl: '', footerLinks: [], refreshSite: () => {} });
const CACHE_KEY = 'site-config-v1';
const EMPTY = { logoUrl: '', textOverrides: [], footerLinks: [] };

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

// প্রথম রেন্ডারের আগেই ক্যাশ করা লেখা বসিয়ে দেওয়া (ডিফল্ট লেখা ঝলকে না ওঠার জন্য)
const initial = readCache();
applyTextOverrides(initial.textOverrides);

export function SiteProvider({ children }) {
  const [cfg, setCfg] = useState(initial);
  const { t } = useLanguage();

  const refreshSite = useCallback(async () => {
    try {
      const { data } = await axiosClient.get('/site/config');
      const next = { ...EMPTY, ...data };
      applyTextOverrides(next.textOverrides);
      setCfg(next);
      try { localStorage.setItem(CACHE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    } catch {
      /* অফলাইনে/সার্ভার বন্ধে ক্যাশ করা তথ্যই চলবে */
    }
  }, []);

  useEffect(() => { refreshSite(); }, [refreshSite]);

  // ব্রাউজার ট্যাবের নাম = সাইটের নাম (ভাষা বা অ্যাডমিনের বদল অনুযায়ী)
  const brandName = t('brand.name');
  useEffect(() => { if (brandName) document.title = brandName; }, [brandName]);

  // অ্যাডমিন লোগো দিলে ব্রাউজার ট্যাবের আইকন (favicon) ও iPhone হোম-স্ক্রিন আইকনও সেটাই হয়;
  // লোগো মুছলে মূল ফাইলের আইকনে ফিরে যায়
  const logoSrc = cfg.logoUrl ? assetUrl(cfg.logoUrl) : '';
  useEffect(() => {
    const head = document.head;
    const links = [...head.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]')];
    links.forEach((l) => { if (!l.dataset.orig) l.dataset.orig = l.getAttribute('href') || ''; });
    if (logoSrc) {
      links.forEach((l) => { l.setAttribute('href', logoSrc); l.removeAttribute('type'); });
    } else {
      links.forEach((l) => { if (l.dataset.orig) l.setAttribute('href', l.dataset.orig); });
    }
  }, [logoSrc]);

  const value = useMemo(() => ({
    logoUrl: cfg.logoUrl ? assetUrl(cfg.logoUrl) : '',
    footerLinks: cfg.footerLinks,
    refreshSite,
  }), [cfg, refreshSite]);

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
