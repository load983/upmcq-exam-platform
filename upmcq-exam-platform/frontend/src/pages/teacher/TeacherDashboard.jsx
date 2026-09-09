// ================== pages/teacher/TeacherDashboard.jsx ==================
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { fetchMyExams, deleteExam } from '../../features/exam/examSlice';

const statusColor = {
  draft: 'bg-gray-200 text-gray-700',
  published: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
};

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  // ✅ ঠিক করা হলো: examSlice এর initialState এ ভ্যারিয়েবলের নাম "exams", "myExams" না
  const { exams: examList, loading, error } = useSelector((s) => s.exam);
  const { user } = useSelector((s) => s.auth);

  // ✅ এখনো একটা নিরাপত্তা ফলব্যাক, যদি কখনো undefined হয়ে যায়
  const exams = Array.isArray(examList) ? examList : [];

  useEffect(() => {
    dispatch(fetchMyExams());
  }, [dispatch]);

  const handleDelete = (exam) => {
    const confirmed = window.confirm(
      `"${exam.title}" পরীক্ষাটি স্থায়ীভাবে ডিলিট করতে চাও? এর সাথে সব প্রশ্ন ও স্টুডেন্ট রেজাল্টও মুছে যাবে। এটা আর ফিরিয়ে আনা যাবে না।`
    );
    if (confirmed) {
      dispatch(deleteExam(exam._id));
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold dark:text-white">স্বাগতম, {user?.name || 'শিক্ষক'} 👋</h1>
        <Link
          to="/teacher/upload"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg font-medium"
        >
          + নতুন পরীক্ষা (PDF আপলোড)
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">লোড হচ্ছে...</p>
      ) : error ? (
        <p className="text-red-500">পরীক্ষা লোড করতে সমস্যা হয়েছে: {String(error)}</p>
      ) : exams.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">এখনো কোনো পরীক্ষা তৈরি করোনি।</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border dark:border-gray-700"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg dark:text-white">{exam.title}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    statusColor[exam.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {exam.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                সময়: {exam.settings?.totalTimeMinutes ?? '-'} মিনিট | মার্কস/প্রশ্ন:{' '}
                {exam.settings?.marksPerQuestion ?? '-'}
              </p>
              <div className="flex gap-3 mt-4 text-sm items-center">
                <Link to={`/teacher/exam/${exam._id}`} className="text-primary-600 font-medium">
                  এডিট / সেটিংস
                </Link>
                <Link
                  to={`/teacher/exam/${exam._id}/results`}
                  className="text-primary-600 font-medium"
                >
                  রেজাল্ট
                </Link>
                <button
                  onClick={() => handleDelete(exam)}
                  className="text-red-600 font-medium ml-auto"
                >
                  ডিলিট
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
