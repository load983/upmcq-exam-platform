// ================== components/Footer.jsx ==================
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-gray-100 bg-white/60 dark:border-white/5 dark:bg-transparent">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
        <p>{t('footer.copyright', { year })}</p>
        <div className="flex items-center gap-4">
          <Link to="/exams" className="hover:text-primary-600 dark:hover:text-primary-400">
            {t('common.exams')}
          </Link>
          <Link to="/teacher/login" className="hover:text-primary-600 dark:hover:text-primary-400">
            {t('footer.teacherPortal')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
