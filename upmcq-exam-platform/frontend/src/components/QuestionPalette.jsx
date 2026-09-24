// ================== components/QuestionPalette.jsx ==================
// পাশে ছোট গ্রিড — কোন প্রশ্ন Answer হয়েছে, কোনটা Skip সেটা কালার দিয়ে দেখায়
import React from 'react';

export default function QuestionPalette({ questions, answersMap, currentIndex, onJump }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {questions.map((q, idx) => {
        const answered = answersMap[q._id] !== undefined && answersMap[q._id] !== null;
        const isCurrent = idx === currentIndex;
        return (
          <button
            key={q._id}
            onClick={() => onJump(idx)}
            className={`h-9 w-9 rounded-lg border-2 text-sm font-semibold transition-all
              ${isCurrent ? 'border-primary-600 scale-105' : 'border-transparent'}
              ${answered ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300'}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
