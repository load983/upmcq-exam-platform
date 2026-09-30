// ================== components/Footer.jsx ==================
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { openHelpline } from './HelplineWidget';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  return (
    <footer className="glass mt-auto border-x-0 border-b-0">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-7 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
        <p>{t('footer.copyright', { year })}</p>
        <div className="flex flex-wrap items-center justify-center gap-1">
          <Link to="/exams" className="rounded-lg px-2.5 py-1 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
            {t('common.exams')}
          </Link>
          <button type="button" onClick={() => openHelpline('contact')} className="rounded-lg px-2.5 py-1 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
            🎧 {t('helpline.title')}
          </button>
          <Link to="/teacher/login" className="rounded-lg px-2.5 py-1 transition-colors hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-500/10 dark:hover:text-primary-300">
            {t('footer.teacherPortal')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
