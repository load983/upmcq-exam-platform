// ================== pages/student/StudentResult.jsx ==================
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { resetAttempt, fetchReview } from '../../features/attempt/attemptSlice';

export default function StudentResult() {
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
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-8 rounded-2xl shadow text-center">
        <h2 className="text-xl font-bold mb-4 dark:text-white">🎉 পরীক্ষা জমা হয়েছে!</h2>

        {result.showInstantly ? (
          <div className="space-y-2 mb-6">
            <p className="text-3xl font-bold text-primary-600">{result.obtainedMarks} নম্বর</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              সঠিক: {result.totalCorrect} | ভুল: {result.totalWrong} | স্কিপ: {result.totalSkipped}
            </p>
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 mb-6">শিক্ষক রেজাল্ট পরে প্রকাশ করবেন।</p>
        )}

        <button onClick={handleDownload} className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium mb-3">
          📄 সঠিক উত্তরসহ PDF ডাউনলোড করো
        </button>

        {result.resource?.kind === 'link' && (
          <a href={result.resource.link} target="_blank" rel="noopener noreferrer"
            className="block w-full bg-green-600 text-white py-2 rounded-lg font-medium mb-3">
            🔗 অতিরিক্ত রিসোর্স দেখো
          </a>
        )}
        {result.resource?.kind === 'pdf' && (
          <button onClick={handleDownloadResource} className="w-full bg-green-600 text-white py-2 rounded-lg font-medium mb-3">
            📥 অতিরিক্ত রিসোর্স ডাউনলোড করো
          </button>
        )}

        {result.showInstantly && !showReview && (
          <button onClick={handleShowReview} className="w-full border border-primary-600 text-primary-600 py-2 rounded-lg font-medium mb-3">
            📝 বিস্তারিত রেজাল্ট দেখো
          </button>
        )}

        <button onClick={() => { dispatch(resetAttempt()); navigate('/'); }} className="text-sm text-gray-500">
          হোমে ফিরে যাও
        </button>
      </div>

      {showReview && (
        <div className="max-w-2xl mx-auto mt-8 space-y-4">
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              ['all', `সব (${counts.all})`],
              ['correct', `সঠিক (${counts.correct})`],
              ['wrong', `ভুল (${counts.wrong})`],
              ['skipped', `স্কিপ (${counts.skipped})`],
            ].map(([key, label]) => (
              <button key={key} onClick={() => setFilter(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'border border-gray-300 dark:border-gray-600 dark:text-white'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {!review ? (
            <p className="text-center text-gray-500 dark:text-gray-400">লোড হচ্ছে...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400">এই ক্যাটাগরিতে কোনো প্রশ্ন নেই।</p>
          ) : (
            filteredItems.map((item) => <QuestionReviewCard key={item.serial} item={item} />)
          )}
        </div>
      )}
    </div>
  );
}

function QuestionReviewCard({ item }) {
  const badge =
    item.status === 'correct'
      ? { text: 'সঠিক', cls: 'bg-green-100 text-green-700' }
      : item.status === 'wrong'
      ? { text: 'ভুল', cls: 'bg-red-100 text-red-700' }
      : { text: 'স্কিপ', cls: 'bg-gray-200 text-gray-600' };

  const borderColor =
    item.status === 'correct' ? 'border-green-500' : item.status === 'wrong' ? 'border-red-500' : 'border-gray-300';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex justify-between items-start gap-3 mb-3">
        <p className="font-semibold dark:text-white">প্রশ্ন {item.serial}. {item.questionText}</p>
        <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${badge.cls}`}>{badge.text}</span>
      </div>
      <div className="space-y-2">
        {item.options.map((opt, i) => {
          const isCorrect = i === item.correctOptionIndex;
          const isSelected = i === item.selectedOptionIndex;
          let cls = 'border dark:border-gray-700';
          if (isCorrect) cls = 'border border-green-500 bg-green-50 dark:bg-green-900/30';
          else if (isSelected) cls = 'border border-red-500 bg-red-50 dark:bg-red-900/30';
          return (
            <div key={i} className={`rounded-lg px-3 py-2 text-sm dark:text-white ${cls}`}>
              ({String.fromCharCode(97 + i)}) {opt}
              {isSelected && !isCorrect && <span className="text-red-600 font-medium ml-2">✗ (তোমার উত্তর)</span>}
              {isCorrect && <span className="text-green-600 font-medium ml-2">✓ (সঠিক উত্তর)</span>}
            </div>
          );
        })}
      </div>
      {item.explanation && (
        <div className="mt-3 bg-primary-50 dark:bg-gray-700 rounded-lg p-3 text-sm dark:text-white">
          <strong>ব্যাখ্যা: </strong>{item.explanation}
        </div>
      )}
    </div>
  );
}
