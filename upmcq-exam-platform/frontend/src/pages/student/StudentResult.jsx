// ================== pages/student/StudentResult.jsx ==================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { resetAttempt, fetchReview } from '../../features/attempt/attemptSlice';
import { useLanguage } from '../../context/LanguageContext';

export default function StudentResult() {
  const { t } = useLanguage();
  const { result, attemptId, review } = useSelector((s) => s.attempt);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showReview, setShowReview] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => { if (!result) navigate('/'); }, [result, navigate]);

  const handleDownload = async () => {
    const res = await axiosClient.get(`/attempts/${attemptId}/download-pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'result.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadResource = async () => {
    const res = await axiosClient.get(`/attempts/${attemptId}/resource-pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', result.resource?.pdfName || 'resource.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleShowReview = () => {
    setShowReview(true);
    if (!review) dispatch(fetchReview(attemptId));
  };

  if (!result) return null;

  const counts = review
    ? {
        all: review.items.length,
        correct: review.items.filter((i) => i.status === 'correct').length,
        wrong: review.items.filter((i) => i.status === 'wrong').length,
        skipped: review.items.filter((i) => i.status === 'skipped').length,
      }
    : { all: 0, correct: 0, wrong: 0, skipped: 0 };

  const filteredItems = review ? review.items.filter((i) => filter === 'all' || i.status === filter) : [];

  return (
    <div className="px-4 py-8">
      <div className="card mx-auto max-w-md p-8 text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-3xl dark:bg-emerald-500/10">
          🎉
        </div>
        <h2 className="mb-4 text-xl font-bold dark:text-white">{t('result.submitted')}</h2>

        {result.showInstantly ? (
          <div className="mb-6 space-y-2">
            <p className="gradient-text text-4xl font-extrabold">{t('result.marks', { n: result.obtainedMarks })}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t('result.stats', { correct: result.totalCorrect, wrong: result.totalWrong, skipped: result.totalSkipped })}
            </p>
          </div>
        ) : (
          <p className="mb-6 text-gray-500 dark:text-gray-400">{t('result.later')}</p>
        )}

        <div className="space-y-3">
          <button onClick={handleDownload} className="btn-primary w-full">
            {t('result.downloadPdf')}
          </button>

          {result.resource?.kind === 'link' && (
            <a
              href={result.resource.link}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-success block w-full"
            >
              {t('result.viewResource')}
            </a>
          )}
          {result.resource?.kind === 'pdf' && (
            <button onClick={handleDownloadResource} className="btn-success w-full">
              {t('result.downloadResource')}
            </button>
          )}

          {result.showInstantly && !showReview && (
            <button onClick={handleShowReview} className="btn-secondary w-full">
              {t('result.detailed')}
            </button>
          )}
        </div>

        <button
          onClick={() => { dispatch(resetAttempt()); window.location.href = 'https://upmcq-exam-platform.vercel.app/exams'; }}
          className="mt-4 text-sm text-gray-500 hover:underline dark:text-gray-400"
        >
          {t('result.backHome')}
        </button>
      </div>

      {showReview && (
        <div className="mx-auto mt-8 max-w-2xl space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            {[
              ['all', t('result.filterAll', { n: counts.all })],
              ['correct', t('result.filterCorrect', { n: counts.correct })],
              ['wrong', t('result.filterWrong', { n: counts.wrong })],
              ['skipped', t('result.filterSkipped', { n: counts.skipped })],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 text-gray-600 dark:border-white/10 dark:text-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!review ? (
            <p className="text-center text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">{t('result.emptyCategory')}</p>
          ) : (
            filteredItems.map((item) => <QuestionReviewCard key={item.serial} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}

function QuestionReviewCard({ item }) {
  const { t } = useLanguage();
  const badge =
    item.status === 'correct'
      ? { text: t('common.correct'), cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }
      : item.status === 'wrong'
      ? { text: t('common.wrong'), cls: 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400' }
      : { text: t('common.skipped'), cls: 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300' };

  const borderColor =
    item.status === 'correct' ? 'border-emerald-500' : item.status === 'wrong' ? 'border-red-500' : 'border-gray-300 dark:border-white/10';

  return (
    <div className={`card border-l-4 p-5 ${borderColor}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <p className="font-semibold dark:text-white">{t('result.questionN', { n: item.serial })} {item.questionText}</p>
        <span className={`badge shrink-0 ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="space-y-2">
        {item.options.map((opt, i) => {
          const isCorrect = i === item.correctOptionIndex;
          const isSelected = i === item.selectedOptionIndex;
          let cls = 'border border-gray-200 dark:border-white/10';
          if (isCorrect) cls = 'border border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10';
          else if (isSelected) cls = 'border border-red-500 bg-red-50 dark:bg-red-500/10';
          return (
            <div key={i} className={`rounded-lg px-3 py-2 text-sm dark:text-white ${cls}`}>
              ({String.fromCharCode(97 + i)}) {opt}
              {isSelected && !isCorrect && <span className="ml-2 font-medium text-red-600 dark:text-red-400">{t('result.yourAnswer')}</span>}
              {isCorrect && <span className="ml-2 font-medium text-emerald-600 dark:text-emerald-400">{t('result.correctAnswer')}</span>}
            </div>
          );
        })}
      </div>
      {item.explanation && (
        <div className="mt-3 rounded-lg bg-primary-50 p-3 text-sm dark:bg-primary-500/10 dark:text-gray-100">
          <strong>{t('result.explanation')}</strong>{item.explanation}
        </div>
      )}
    </div>
  );
}
