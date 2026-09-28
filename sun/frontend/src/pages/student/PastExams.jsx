// ================== pages/student/PastExams.jsx ==================
// স্টুডেন্ট ড্যাশবোর্ডের "Past exam" অপশন — যা যা পরীক্ষা দিয়েছে তার বিস্তারিত রেজাল্ট এখানে দেখাবে।
// শিক্ষক কোনো পরীক্ষায় Repetition অন করে রাখলে "আবার পরীক্ষা দাও" বাটন দিয়ে সেই পরীক্ষা আবার দেয়া যাবে।
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { useLanguage } from '../../context/LanguageContext';

export default function PastExams() {
  const { t } = useLanguage();
  const { user, token } = useSelector((s) => s.auth);
  const isStudent = !!(user && token && user.role === 'student');

  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [reviewMap, setReviewMap] = useState({});
  const [reviewLoadingId, setReviewLoadingId] = useState(null);

  useEffect(() => {
    if (!isStudent) {
      setLoading(false);
      return;
    }
    setLoading(true);
    axiosClient
      .get('/attempts/my')
      .then(({ data }) => setAttempts(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.response?.data?.message || t('pastExams.loadFailed')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStudent]);

  const handleToggleDetails = async (attemptId) => {
    if (expandedId === attemptId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(attemptId);
    if (!reviewMap[attemptId]) {
      setReviewLoadingId(attemptId);
      try {
        const { data } = await axiosClient.get(`/attempts/${attemptId}/review`);
        setReviewMap((prev) => ({ ...prev, [attemptId]: data }));
      } catch (err) {
        setReviewMap((prev) => ({ ...prev, [attemptId]: { error: true } }));
      } finally {
        setReviewLoadingId(null);
      }
    }
  };

  const handleDownload = async (attemptId, examTitle) => {
    try {
      const res = await axiosClient.get(`/attempts/${attemptId}/download-pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${examTitle || 'result'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      // নীরবে উপেক্ষা করা হলো
    }
  };

  if (!isStudent) {
    return (
      <div className="px-4 py-10 md:py-14">
        <div className="card mx-auto max-w-lg p-8 text-center md:p-12">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-primary-50 text-3xl dark:bg-primary-500/10">
            🔑
          </div>
          <h3 className="mb-2 text-xl font-bold dark:text-gray-100">{t('studentHome.loginNeededTitle')}</h3>
          <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            {t('studentHome.loginNeededDesc')}
          </p>
          <Link to="/student/auth" className="btn-primary inline-block">
            {t('studentHome.loginNeededCta')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-10 md:py-14">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 text-center">
          <h1 className="mb-3 flex items-center justify-center gap-2 text-3xl font-extrabold md:text-4xl">
            <span>🗂️</span> <span className="gradient-text">{t('pastExams.title')}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400">{t('pastExams.subtitle')}</p>

          <div className="mx-auto mt-5 inline-flex rounded-full border border-gray-200 p-1 dark:border-white/10">
            <Link to="/exams" className="rounded-full px-4 py-1.5 text-sm font-medium text-gray-600 hover:text-primary-600 dark:text-gray-300">
              {t('pastExams.tabAll')}
            </Link>
            <span className="rounded-full bg-primary-600 px-4 py-1.5 text-sm font-medium text-white">
              {t('pastExams.tabPast')}
            </span>
          </div>
        </header>

        {loading ? (
          <div className="py-16 text-center text-gray-400 dark:text-gray-500">
            <div className="mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
            <p>{t('common.loading')}</p>
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : attempts.length === 0 ? (
          <div className="card mx-auto max-w-lg p-8 text-center md:p-12">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-gray-100 text-3xl text-gray-400 dark:bg-white/5">
              📑
            </div>
            <h3 className="mb-2 text-xl font-bold dark:text-gray-100">{t('pastExams.emptyTitle')}</h3>
            <p className="mb-6 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{t('pastExams.emptyDesc')}</p>
            <Link to="/exams" className="btn-primary inline-block">
              {t('pastExams.emptyCta')}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts.map((a) => {
              const review = reviewMap[a.attemptId];
              const isExpanded = expandedId === a.attemptId;
              const submittedDate = a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '';

              return (
                <div key={a.attemptId} className="card p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-lg font-bold dark:text-gray-100">{a.examTitle || t('pastExams.untitled')}</h2>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{submittedDate}</p>
                    </div>

                    {a.showResultInstantly ? (
                      <div className="text-right">
                        <p className="gradient-text text-2xl font-extrabold">{t('result.marks', { n: a.obtainedMarks })}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {t('result.stats', { correct: a.totalCorrect, wrong: a.totalWrong, skipped: a.totalSkipped })}
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('result.later')}</p>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {a.showResultInstantly && (
                      <button onClick={() => handleToggleDetails(a.attemptId)} className="btn-secondary text-sm">
                        {isExpanded ? t('pastExams.hideDetails') : t('pastExams.viewDetails')}
                      </button>
                    )}
                    <button onClick={() => handleDownload(a.attemptId, a.examTitle)} className="btn-secondary text-sm">
                      {t('result.downloadPdf')}
                    </button>
                    {a.allowRepetition && a.examStatus === 'published' && (
                      <Link to={`/join/${a.examCode}`} className="btn-primary text-sm">
                        {t('pastExams.retake')}
                      </Link>
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-4 dark:border-white/10">
                      {reviewLoadingId === a.attemptId ? (
                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
                      ) : review?.error ? (
                        <p className="text-center text-sm text-red-500">{t('pastExams.loadFailed')}</p>
                      ) : (
                        review?.items?.map((item) => <ReviewItem key={item.serial} item={item} t={t} />)
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ item, t }) {
  const badge =
    item.status === 'correct'
      ? { text: t('common.correct'), cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }
      : item.status === 'wrong'
      ? { text: t('common.wrong'), cls: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' }
      : { text: t('common.skipped'), cls: 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300' };

  const borderColor =
    item.status === 'correct' ? 'border-emerald-500' : item.status === 'wrong' ? 'border-red-500' : 'border-gray-300 dark:border-white/10';

  return (
    <div className={`rounded-xl border-l-4 bg-gray-50 p-4 dark:bg-white/5 ${borderColor}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <p className="text-sm font-semibold dark:text-white">{t('result.questionN', { n: item.serial })} {item.questionText}</p>
        <span className={`badge shrink-0 ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="space-y-1.5">
        {item.options.map((opt, i) => {
          const isCorrect = i === item.correctOptionIndex;
          const isSelected = i === item.selectedOptionIndex;
          let cls = 'border border-gray-200 dark:border-white/10';
          if (isCorrect) cls = 'border border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
          else if (isSelected) cls = 'border border-red-500 bg-red-50 dark:bg-red-500/10';
          return (
            <div key={i} className={`rounded-lg px-3 py-1.5 text-sm dark:text-white ${cls}`}>
              ({String.fromCharCode(97 + i)}) {opt}
              {isSelected && !isCorrect && <span className="ml-2 font-medium text-red-600 dark:text-red-400">{t('result.yourAnswer')}</span>}
              {isCorrect && <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">{t('result.correctAnswer')}</span>}
            </div>
          );
        })}
      </div>
      {item.explanation && (
        <div className="mt-2 rounded-lg bg-primary-50 p-2.5 text-sm dark:bg-primary-500/10 dark:text-gray-100">
          <strong>{t('result.explanation')}</strong>{item.explanation}
        </div>
      )}
    </div>
  );
}
