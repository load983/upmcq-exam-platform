// ================== pages/student/StudentExam.jsx ==================
// Live পরীক্ষার মূল পেজ — Timer, Question Palette, Answer সিলেকশন, Submit
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import { saveAnswer, submitAttempt } from '../../features/attempt/attemptSlice';
import { useLanguage } from '../../context/LanguageContext';
import MathText from '../../components/MathText';

export default function StudentExam() {
  const { t } = useLanguage();
  const { attemptId, examTitle, totalTimeMinutes, startedAt, questions, answersMap, result } =
    useSelector((s) => s.attempt);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  // একই সাথে দ্রুত দুইবার ক্লিক ঠেকাতে: যে প্রশ্নের উত্তর পাঠানো শুরু হয়েছে সেটা সাথে সাথে লক
  const [lockedQ, setLockedQ] = useState({});
  const submittedRef = useRef(false);

  // জয়েন না করে সরাসরি এই পেজে এলে জয়েন পেজে ফেরত পাঠাও
  useEffect(() => {
    if (!attemptId) navigate('/');
  }, [attemptId, navigate]);

  // একবার Submit হয়ে গেলে রেজাল্ট পেজে যাও
  useEffect(() => {
    if (result) navigate('/exam/result');
  }, [result, navigate]);

  const handleSubmit = useCallback(
    (auto = false) => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      dispatch(submitAttempt({ attemptId, autoSubmitted: auto })).then((res) => {
        // নেটওয়ার্ক সমস্যায় সাবমিট ব্যর্থ হলে আবার চেষ্টা করা যাবে
        if (res.meta?.requestStatus === 'rejected') {
          submittedRef.current = false;
          setSubmitting(false);
        }
      });
    },
    [attemptId, dispatch]
  );

  // 🔒 পরীক্ষা চলাকালীন অন্য ট্যাব/ব্রাউজার/অ্যাপে চলে গেলে যতটুকু দেওয়া হয়েছে তা অটো সাবমিট
  useEffect(() => {
    if (!attemptId || result) return;
    const leave = () => handleSubmit(true);
    const onVisibility = () => {
      if (document.hidden) leave();
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', leave);
    window.addEventListener('pagehide', leave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', leave);
      window.removeEventListener('pagehide', leave);
    };
  }, [attemptId, result, handleSubmit]);

  // 🔒 একবার উত্তর দিলে আর বদলানো যাবে না
  const isLocked = (qid) =>
    !!lockedQ[qid] || (answersMap[qid] !== null && answersMap[qid] !== undefined);

  const handleSelect = (questionId, optionIndex) => {
    if (isLocked(questionId) || submitting) return;
    setLockedQ((m) => ({ ...m, [questionId]: true }));
    dispatch(saveAnswer({ attemptId, questionId, selectedOptionIndex: optionIndex })).then((res) => {
      // সেভ ব্যর্থ হলে (নেটওয়ার্ক সমস্যা) আবার চেষ্টা করার সুযোগ দাও
      if (res.meta?.requestStatus === 'rejected') {
        setLockedQ((m) => {
          const n = { ...m };
          delete n[questionId];
          return n;
        });
      }
    });
  };

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
      <div className="glass sticky top-16 z-20 -mx-4 mb-4 px-4 pb-3 pt-3 sm:mx-0 sm:rounded-2xl sm:px-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h1 className="truncate text-lg font-semibold dark:text-white">{examTitle}</h1>
          <Timer startedAt={startedAt} totalMinutes={totalTimeMinutes} onTimeUp={() => handleSubmit(true)} />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200/80 dark:bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-emerald-500 transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="shrink-0 text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">{answeredCount}/{questions.length}</span>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
        {t('exam.tabWarning')}
      </div>

      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        {/* ---------- প্রশ্ন ---------- */}
        <div className="card p-5 sm:p-7">
          <p className="mb-3 text-sm font-medium text-primary-600 dark:text-primary-400">
            {t('exam.questionOf', { current: currentIndex + 1, total: questions.length })}
          </p>
          <h2 className="mb-5 text-lg font-medium leading-relaxed dark:text-white sm:text-xl"><MathText text={q.questionText} /></h2>
          <div className="space-y-3">
            {q.options.map((opt, i) => {
              const locked = isLocked(q._id);
              const selected = answersMap[q._id] === i;
              return (
              <label
                key={i}
                className={`flex items-center gap-3 rounded-2xl border-2 p-3.5 transition-all focus-within:ring-2 focus-within:ring-primary-500/40
                  ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}
                  ${
                    selected
                      ? 'border-primary-500 bg-primary-50 shadow-sm dark:border-primary-500/60 dark:bg-primary-500/10'
                      : locked
                      ? 'border-gray-100 opacity-50 dark:border-white/10'
                      : 'border-gray-100 bg-white hover:border-primary-300 dark:border-white/10 dark:bg-transparent dark:hover:border-primary-500/40'
                  }`}
              >
                <input
                  type="radio"
                  name={`q-${q._id}`}
                  checked={selected}
                  disabled={locked}
                  onChange={() => handleSelect(q._id, i)}
                  className="sr-only"
                />
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition-colors ${selected ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'}`}>{String.fromCharCode(65 + i)}</span>
                <span className="dark:text-white"><MathText text={opt} /></span>
              </label>
              );
            })}
          </div>
          {isLocked(q._id) && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">{t('exam.answerLocked')}</p>
          )}

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
        <div className="card h-fit p-4 sm:sticky sm:top-40">
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
