// ================== components/Footer.jsx ==================
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSite } from '../context/SiteContext';
import { openHelpline } from './HelplineWidget';

const linkCls = 'rounded-lg px-2.5 py-1 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-500/10 dark:hover:text-primary-300';

export default function Footer() {
  const { t, lang } = useLanguage();
  const { footerLinks } = useSite();
  const year = new Date().getFullYear();

  // অ্যাডমিনের দেওয়া শিরোনাম (বর্তমান ভাষায়; না থাকলে অন্য ভাষার)
  const titleOf = (l) => (lang === 'en' ? l.titleEn || l.titleBn : l.titleBn || l.titleEn);

  return (
    <footer className="glass mt-auto border-x-0 border-b-0">
      {footerLinks.length > 0 && (
        <div className="mx-auto max-w-6xl px-4 pt-7">
          <h3 className="mb-2 text-base font-semibold text-gray-800 dark:text-gray-100">{t('footer.importantLinks')}</h3>
          <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
            {footerLinks.map((l) => (
              <li key={l.slug}>
                {l.externalUrl ? (
                  <a href={l.externalUrl} target="_blank" rel="noopener noreferrer" className="inline-block py-0.5 hover:text-primary-600 hover:underline dark:hover:text-primary-300">{titleOf(l)}</a>
                ) : (
                  <Link to={`/page/${l.slug}`} className="inline-block py-0.5 hover:text-primary-600 hover:underline dark:hover:text-primary-300">{titleOf(l)}</Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-7 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
        <p>{t('footer.copyright', { year, brand: t('brand.name') })}</p>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Link to="/exams" className={linkCls}>
            {t('common.exams')}
          </Link>
          <button type="button" onClick={() => openHelpline('contact')} className={linkCls}>
            🎧 {t('helpline.title')}
          </button>
          <Link to="/teacher/login" className={linkCls}>
            {t('footer.teacherPortal')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
