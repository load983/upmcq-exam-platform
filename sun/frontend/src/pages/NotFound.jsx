// ================== pages/NotFound.jsx ==================
import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <p className="gradient-text text-7xl font-extrabold">{t('notFound.code')}</p>
      <h1 className="mt-4 text-2xl font-bold dark:text-white">{t('notFound.title')}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        {t('notFound.desc')}
      </p>
      <Link to="/" className="btn-primary mt-6">
        {t('notFound.home')}
      </Link>
    </div>
  );
}
