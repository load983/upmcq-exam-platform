// ================== pages/student/StudentExam.jsx ==================
// Live পরীক্ষার মূল পেজ — Timer, Question Palette, Answer সিলেকশন, Submit
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import { saveAnswer, submitAttempt } from '../../features/attempt/attemptSlice';
import { useLanguage } from '../../context/LanguageContext';

export default function StudentExam() {
  const { t } = useLanguage();
  const { attemptId, examTitle, totalTimeMinutes, startedAt, questions, answersMap, result } =
    useSelector((s) => s.attempt);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [tabWarning, setTabWarning] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // জয়েন না করে সরাসরি এই পেজে এলে জয়েন পেজে ফেরত পাঠাও
  useEffect(() => {
    if (!attemptId) navigate('/');
  }, [attemptId, navigate]);

  // একবার Submit হয়ে গেলে রেজাল্ট পেজে যাও
  useEffect(() => {
    if (result) navigate('/exam/result');
  }, [result, navigate]);

  // একাধিক ট্যাব/উইন্ডো সুইচ করলে Warning দেখানো (Security requirement)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) setTabWarning(true);
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const handleSelect = (questionId, optionIndex) => {
    dispatch(saveAnswer({ attemptId, questionId, selectedOptionIndex: optionIndex }));
  };

  const handleSubmit = useCallback(
    (auto = false) => {
      if (submitting) return;
      setSubmitting(true);
      dispatch(submitAttempt({ attemptId, autoSubmitted: auto }));
    },
    [attemptId, dispatch, submitting]
  );

  if (!questions.length) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-center">
        <div>
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const q = questions[currentIndex];
  const answeredCount = Object.values(answersMap).filter((v) => v !== null && v !== undefined).length;
  const progressPct = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h1 className="truncate font-bold text-lg dark:text-white">{examTitle}</h1>
        <Timer startedAt={startedAt} totalMinutes={totalTimeMinutes} onTimeUp={() => handleSubmit(true)} />
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {tabWarning && (
        <div className="mb-4 rounded-lg bg-amber-100 p-2 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          {t('exam.tabWarning')}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        {/* ---------- প্রশ্ন ---------- */}
        <div className="card p-6">
          <p className="mb-2 text-xs text-gray-400 dark:text-gray-500">
            {t('exam.questionOf', { current: currentIndex + 1, total: questions.length })}
          </p>
          <h2 className="mb-4 text-lg font-medium dark:text-white">{q.questionText}</h2>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors
                  ${
                    answersMap[q._id] === i
                      ? 'border-primary-500 bg-primary-50 dark:border-primary-500/60 dark:bg-primary-500/10'
                      : 'border-gray-200 hover:border-primary-300 dark:border-white/10 dark:hover:border-primary-500/40'
                  }`}
              >
                <input
                  type="radio"
                  name={`q-${q._id}`}
                  checked={answersMap[q._id] === i}
                  onChange={() => handleSelect(q._id, i)}
                  className="accent-primary-600"
                />
                <span className="dark:text-white">{String.fromCharCode(65 + i)}. {opt}</span>
              </label>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
              className="btn-secondary disabled:opacity-40"
            >
              {t('exam.prev')}
            </button>
            {currentIndex < questions.length - 1 ? (
              <button onClick={() => setCurrentIndex((i) => i + 1)} className="btn-primary">
                {t('exam.next')}
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)} className="btn-success">
                {t('exam.submit')}
              </button>
            )}
          </div>
        </div>

        {/* ---------- Question Palette ---------- */}
        <div className="card h-fit p-4">
          <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
            {t('exam.answered', { answered: answeredCount, total: questions.length })}
          </p>
          <QuestionPalette questions={questions} answersMap={answersMap} currentIndex={currentIndex} onJump={setCurrentIndex} />
          <button onClick={() => handleSubmit(false)} className="btn-success mt-4 w-full text-sm">
            {t('exam.submitNow')}
          </button>
        </div>
      </div>
    </div>
  );
}
