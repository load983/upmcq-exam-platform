// ================== components/LanguageSwitcher.jsx ==================
// নেভবারে বসানো ভাষা সুইচার — বাংলা / English এর যেকোনো একটা বেছে নেওয়া যায়
import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageSwitcher() {
  const { lang, setLang, languages, t } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('lang.select')}
      className="inline-flex h-9 items-center rounded-full border border-gray-200 bg-white p-0.5 text-xs font-semibold shadow-sm dark:border-white/10 dark:bg-white/5"
    >
      {languages.map((l) => {
        const active = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={active}
            title={l.label}
            className={`h-full rounded-full px-2.5 transition-colors ${
              active
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400'
            }`}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
