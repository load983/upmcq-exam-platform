// ================== components/ThemeSwitcher.jsx ==================
// নেভবারে বসানো থিম সুইচার — মোড (Light/Dark/System) + Accent কালার বদলানোর জন্য
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const MODE_OPTIONS = [
  { key: 'light', labelKey: 'theme.light', icon: SunIcon },
  { key: 'dark', labelKey: 'theme.dark', icon: MoonIcon },
  { key: 'system', labelKey: 'theme.system', icon: SystemIcon },
];

export default function ThemeSwitcher() {
  const { mode, setMode, accent, setAccent, bgStyle, setBgStyle, resolvedDark, accents, bgStyles } = useTheme();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const CurrentIcon = resolvedDark ? MoonIcon : SunIcon;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('theme.settings')}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:text-primary-400"
      >
        <CurrentIcon className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-fade-in absolute right-0 z-50 mt-2 w-72 rounded-2xl border border-gray-100 bg-white p-3 shadow-xl shadow-gray-900/5 dark:border-white/10 dark:bg-gray-800 dark:shadow-black/30"
        >
          <p className="px-1 pb-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t('theme.mode')}
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {MODE_OPTIONS.map(({ key, labelKey, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 text-[11px] font-medium transition-colors
                  ${
                    mode === key
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/60 dark:bg-primary-500/10 dark:text-primary-300'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {t(labelKey)}
              </button>
            ))}
          </div>

          <p className="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t('theme.accent')}
          </p>
          <div className="flex flex-wrap gap-2 px-1">
            {accents.map((a) => (
              <button
                key={a.key}
                type="button"
                title={a.label}
                aria-label={a.label}
                onClick={() => setAccent(a.key)}
                className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-white transition-transform hover:scale-110 dark:ring-offset-gray-800 ${
                  accent === a.key ? 'ring-2 ring-gray-900 dark:ring-white' : ''
                }`}
                style={{ backgroundColor: a.swatch }}
              />
            ))}
          </div>

          <p className="mb-2 mt-4 px-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
            {t('theme.wallpaper')}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {bgStyles.map((b) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setBgStyle(b.key)}
                className={`flex items-center gap-1.5 rounded-xl border px-2 py-1.5 text-[11px] font-medium transition-colors
                  ${
                    bgStyle === b.key
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-500/60 dark:bg-primary-500/10 dark:text-primary-300'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-white/5'
                  }`}
              >
                <BgStylePreview styleKey={b.key} />
                {t(b.labelKey)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BgStylePreview({ styleKey }) {
  const base = 'h-4 w-4 shrink-0 rounded-full border border-gray-300 dark:border-white/20';
  if (styleKey === 'minimal') return <span className={`${base} bg-gray-100 dark:bg-white/10`} />;
  if (styleKey === 'blobs')
    return <span className={`${base} bg-gradient-to-br from-primary-400 to-sky-400 blur-[1px]`} />;
  if (styleKey === 'dots')
    return (
      <span
        className={base}
        style={{
          backgroundImage: 'radial-gradient(currentColor 1px, transparent 1px)',
          backgroundSize: '4px 4px',
          color: 'rgb(var(--color-primary-500))',
        }}
      />
    );
  return <span className={`${base} bg-gradient-to-tr from-primary-400 via-sky-400 to-violet-400`} />;
}

function SunIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.9 14.6a9 9 0 1 1-11.5-11.5 7.2 7.2 0 0 0 11.5 11.5Z" />
    </svg>
  );
}

function SystemIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}
