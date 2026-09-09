// ================== pages/student/StudentExam.jsx ==================
// Live পরীক্ষার মূল পেজ — Timer, Question Palette, Answer সিলেকশন, Submit
import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Timer from '../../components/Timer';
import QuestionPalette from '../../components/QuestionPalette';
import { saveAnswer, submitAttempt } from '../../features/attempt/attemptSlice';

export default function StudentExam() {
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

  if (!questions.length) return <p className="text-center mt-10 dark:text-white">লোড হচ্ছে...</p>;

  const q = questions[currentIndex];
  const answeredCount = Object.values(answersMap).filter((v) => v !== null && v !== undefined).length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="font-bold text-lg dark:text-white">{examTitle}</h1>
        <Timer startedAt={startedAt} totalMinutes={totalTimeMinutes} onTimeUp={() => handleSubmit(true)} />
      </div>

      {tabWarning && (
        <div className="bg-yellow-100 text-yellow-800 text-sm p-2 rounded-lg mb-4">
          ⚠️ তুমি ট্যাব পরিবর্তন করেছো — এটি রেকর্ড করা হয়েছে। পরীক্ষার নিয়ম মেনে চলো।
        </div>
      )}

      <div className="grid sm:grid-cols-[1fr_auto] gap-6">
        {/* ---------- প্রশ্ন ---------- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow">
          <p className="text-xs text-gray-400 mb-2">প্রশ্ন {currentIndex + 1} / {questions.length}</p>
          <h2 className="font-medium text-lg mb-4 dark:text-white">{q.questionText}</h2>
          <div className="space-y-2">
            {q.options.map((opt, i) => (
              <label
                key={i}
                className={`flex items-center gap-3 border rounded-lg p-3 cursor-pointer
                  ${answersMap[q._id] === i ? 'border-primary-600 bg-primary-50 dark:bg-gray-700' : 'dark:border-gray-600'}`}
              >
                <input
                  type="radio"
                  name={`q-${q._id}`}
                  checked={answersMap[q._id] === i}
                  onChange={() => handleSelect(q._id, i)}
                />
                <span className="dark:text-white">{String.fromCharCode(65 + i)}. {opt}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-between mt-6">
            <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((i) => i - 1)}
              className="px-4 py-2 rounded-lg border disabled:opacity-40 dark:text-white dark:border-gray-600">
              আগের প্রশ্ন
            </button>
            {currentIndex < questions.length - 1 ? (
              <button onClick={() => setCurrentIndex((i) => i + 1)} className="px-4 py-2 rounded-lg bg-primary-600 text-white">
                পরের প্রশ্ন
              </button>
            ) : (
              <button onClick={() => handleSubmit(false)} className="px-4 py-2 rounded-lg bg-green-600 text-white">
                পরীক্ষা জমা দাও ✅
              </button>
            )}
          </div>
        </div>

        {/* ---------- Question Palette ---------- */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow h-fit">
          <p className="text-sm mb-3 dark:text-gray-300">{answeredCount}/{questions.length} উত্তর দেয়া হয়েছে</p>
          <QuestionPalette questions={questions} answersMap={answersMap} currentIndex={currentIndex} onJump={setCurrentIndex} />
          <button onClick={() => handleSubmit(false)} className="w-full mt-4 bg-green-600 text-white py-2 rounded-lg text-sm">
            এখনই জমা দাও
          </button>
        </div>
      </div>
    </div>
  );
}
