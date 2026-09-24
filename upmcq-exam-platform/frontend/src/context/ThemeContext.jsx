// ================== context/ThemeContext.jsx ==================
// থিম সিস্টেম — Light/Dark/System মোড এবং একাধিক Accent কালার সাপোর্ট করে।
// localStorage-এ সেভ হয়, তাই একবার সিলেক্ট করলে পরে আবার এলেও মনে রাখবে।
import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const ThemeContext = createContext(null);

export const ACCENTS = [
  { key: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
  { key: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { key: 'sky', label: 'Sky', swatch: '#0284c7' },
  { key: 'emerald', label: 'Emerald', swatch: '#059669' },
  { key: 'rose', label: 'Rose', swatch: '#e11d48' },
  { key: 'amber', label: 'Amber', swatch: '#d97706' },
];

const MODE_KEY = 'theme-mode'; // 'light' | 'dark' | 'system'
const ACCENT_KEY = 'theme-accent';
const BG_KEY = 'theme-bg-style';

export const BG_STYLES = [
  { key: 'minimal', labelKey: 'theme.bg.minimal' },
  { key: 'blobs', labelKey: 'theme.bg.blobs' },
  { key: 'dots', labelKey: 'theme.bg.dots' },
  { key: 'mesh', labelKey: 'theme.bg.mesh' },
];

function getSystemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function readInitialMode() {
  if (typeof window === 'undefined') return 'system';
  const saved = localStorage.getItem(MODE_KEY);
  // পুরনো DarkModeToggle এর সাথে ব্যাকওয়ার্ড কম্প্যাটিবিলিটি
  const legacy = localStorage.getItem('theme');
  if (saved === 'light' || saved === 'dark' || saved === 'system') return saved;
  if (legacy === 'light' || legacy === 'dark') return legacy;
  return 'system';
}

function readInitialAccent() {
  if (typeof window === 'undefined') return 'indigo';
  const saved = localStorage.getItem(ACCENT_KEY);
  return ACCENTS.some((a) => a.key === saved) ? saved : 'indigo';
}

function readInitialBgStyle() {
  if (typeof window === 'undefined') return 'minimal';
  const saved = localStorage.getItem(BG_KEY);
  return BG_STYLES.some((b) => b.key === saved) ? saved : 'minimal';
}

export function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readInitialMode);
  const [accent, setAccentState] = useState(readInitialAccent);
  const [bgStyle, setBgStyleState] = useState(readInitialBgStyle);
  const [systemDark, setSystemDark] = useState(getSystemPrefersDark);

  // সিস্টেম থিম চেঞ্জ ডিটেক্ট করা (mode === 'system' হলে লাইভ আপডেট হবে)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemDark(e.matches);
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const resolvedDark = mode === 'system' ? systemDark : mode === 'dark';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedDark);
    root.setAttribute('data-accent', accent);
    root.setAttribute('data-bg', bgStyle);
    root.style.colorScheme = resolvedDark ? 'dark' : 'light';
    localStorage.setItem(MODE_KEY, mode);
    localStorage.setItem(ACCENT_KEY, accent);
    localStorage.setItem(BG_KEY, bgStyle);
    // legacy key সিঙ্কে রাখা, যদি অন্য কোথাও এখনও রেফারেন্স করা হয়
    localStorage.setItem('theme', resolvedDark ? 'dark' : 'light');
  }, [mode, accent, bgStyle, resolvedDark]);

  const setMode = useCallback((m) => setModeState(m), []);
  const setAccent = useCallback((a) => setAccentState(a), []);
  const setBgStyle = useCallback((b) => setBgStyleState(b), []);
  const cycleMode = useCallback(() => {
    setModeState((prev) => (prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light'));
  }, []);

  const value = useMemo(
    () => ({
      mode,
      setMode,
      cycleMode,
      accent,
      setAccent,
      bgStyle,
      setBgStyle,
      resolvedDark,
      accents: ACCENTS,
      bgStyles: BG_STYLES,
    }),
    [mode, accent, bgStyle, resolvedDark, setMode, setAccent, setBgStyle, cycleMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme অবশ্যই ThemeProvider এর ভেতরে ব্যবহার করতে হবে');
  return ctx;
}
