// ================== pages/SitePage.jsx ==================
// ফুটারের "Important Links"-এর পেজ (/page/:slug) — Terms, Privacy, Refund ইত্যাদি। লেখা অ্যাডমিন বদলাতে পারে।
// কনটেন্ট সাধারণ টেক্সট হিসেবে দেখানো হয় (HTML নয়), তাই নিরাপদ; ফাঁকা লাইন = নতুন অনুচ্ছেদ।
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function SitePage() {
  const { slug } = useParams();
  const { t, lang } = useLanguage();
  const [page, setPage] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | missing

  useEffect(() => {
    setState('loading');
    axiosClient.get(`/site/page/${encodeURIComponent(slug)}`)
      .then(({ data }) => { setPage(data); setState('ok'); })
      .catch(() => setState('missing'));
  }, [slug]);

  if (state === 'loading') return <p className="mx-auto max-w-3xl px-4 py-16 text-gray-500">{t('common.loading')}</p>;
  if (state === 'missing') {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4 text-gray-600 dark:text-gray-300">{t('sitePage.notFound')}</p>
        <Link to="/" className="btn-primary">{t('sitePage.home')}</Link>
      </div>
    );
  }

  const title = lang === 'en' ? page.titleEn || page.titleBn : page.titleBn || page.titleEn;
  const content = (lang === 'en' ? page.contentEn || page.contentBn : page.contentBn || page.contentEn) || '';
  const paragraphs = content.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <article className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-6 text-2xl font-bold dark:text-white">{title}</h1>
      {paragraphs.length === 0 ? (
        <p className="text-gray-500">{t('sitePage.empty')}</p>
      ) : (
        <div className="card space-y-4 p-5 leading-relaxed text-gray-700 dark:text-gray-200">
          {paragraphs.map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
        </div>
      )}
    </article>
  );
}
