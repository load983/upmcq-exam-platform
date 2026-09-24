// ================== pages/StudentHome.jsx ==================
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/axiosClient';
import { useLanguage } from '../context/LanguageContext';

export default function StudentHome() {
  const { t } = useLanguage();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    axiosClient
      .get('/exams/public-list')
      .then(({ data }) => {
        setExams(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching exams:', err);
        setExams([]);
        setLoading(false);
      });
  }, []);

  // সার্চ ইনপুট অনুসারে ফিল্টার করা
  const filteredExams = exams.filter((exam) => {
    const q = searchQuery.toLowerCase();
    return (
      exam.title.toLowerCase().includes(q) ||
      (exam.teacherName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen px-4 py-10 md:py-14">
      <div className="mx-auto max-w-4xl">
        {/* হেডার ও শিরোনাম */}
        <header className="mb-10 text-center">
          <h1 className="mb-3 flex items-center justify-center gap-2 text-3xl font-extrabold md:text-4xl">
            <span>🎓</span> <span className="gradient-text">{t('studentHome.title')}</span>
          </h1>
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            {t('studentHome.subtitle')}
          </p>

          {/* সার্চ বার */}
          <div className="relative mx-auto max-w-md">
            <input
              type="text"
              placeholder={t('studentHome.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-11"
            />
            <svg
              className="absolute left-3.5 top-3 h-5 w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 dark:bg-white/10 dark:text-gray-300"
              >
                {t('studentHome.clear')}
              </button>
            )}
          </div>
        </header>

        {/* কন্টেন্ট লোডিং অবস্থা */}
        {loading ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            <p>{t('studentHome.loading')}</p>
          </div>
        ) : filteredExams.length === 0 ? (
          /* সুন্দর খালি ফলাফল নোটিফিকেশন কার্ড */
          <div className="card mx-auto max-w-lg p-8 text-center md:p-12">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-3xl text-gray-400 dark:bg-white/5">
              {searchQuery ? '🔎' : '📑'}
            </div>

            <h3 className="mb-2 text-xl font-bold dark:text-gray-100">
              {searchQuery ? t('studentHome.noResultTitle') : t('studentHome.noExamsTitle')}
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
              {searchQuery ? (
                (() => {
                  // অনুবাদের ভেতরের {query} অংশটা হাইলাইট করে দেখানো (দুই ভাষায় শব্দক্রম আলাদা হতে পারে)
                  const [before, after] = t('studentHome.noResultDesc').split('{query}');
                  return (
                    <>
                      {before}
                      <span className="font-semibold text-primary-600 dark:text-primary-400">{searchQuery}</span>
                      {after}
                    </>
                  );
                })()
              ) : (
                t('studentHome.noExamsDesc')
              )}
            </p>

            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-secondary text-sm">
                {t('studentHome.showAll')}
              </button>
            )}
          </div>
        ) : (
          /* পরীক্ষাগুলোর কার্ড লিস্ট */
          <div className="grid gap-4 md:grid-cols-2">
            {filteredExams.map((exam) => (
              <div
                key={exam._id}
                className="card flex flex-col justify-between p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-300 dark:hover:border-primary-500/40"
              >
                <div>
                  <h2 className="text-xl font-bold dark:text-gray-100">{exam.title}</h2>
                  {exam.teacherName && (
                    <p className="mb-3 mt-1 text-sm font-medium text-primary-600 dark:text-primary-400">
                      {t('studentHome.by', { name: exam.teacherName })}
                    </p>
                  )}
                  {!exam.teacherName && <div className="mb-3" />}

                  <div className="mb-5 flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs text-gray-500 dark:border-white/5 dark:bg-white/5 dark:text-gray-400">
                    <span>
                      {t('studentHome.time', {
                        value: exam.settings?.totalTimeMinutes
                          ? t('studentHome.minutes', { n: exam.settings.totalTimeMinutes })
                          : t('studentHome.noTimeLimit'),
                      })}
                    </span>
                    <span className="badge border border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-500/30 dark:bg-primary-500/10 dark:text-primary-300">
                      {t('studentHome.attempted', { n: exam.attemptCount ?? 0 })}
                    </span>
                  </div>
                </div>

                <Link to={`/join/${exam.examCode}`} className="btn-primary w-full">
                  {t('studentHome.takeExam')}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
