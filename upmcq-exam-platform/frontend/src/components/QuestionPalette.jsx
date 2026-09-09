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
            className={`h-9 w-9 rounded-lg text-sm font-semibold border-2 transition
              ${isCurrent ? 'border-primary-600' : 'border-transparent'}
              ${answered ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200'}`}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
