// ================== pages/student/StudentJoin.jsx ==================
// Teacher এর দেয়া লিংক (/join/:code) দিয়ে স্টুডেন্ট এখানে আসে, নাম/রোল/ফোন দিয়ে জয়েন করে
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axiosClient from '../../api/axiosClient';
import { joinExam } from '../../features/attempt/attemptSlice';

export default function StudentJoin() {
  const { code } = useParams();
  const [examInfo, setExamInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    studentName: '',
    studentRoll: '',
    studentPhone: '',
    accessCode: '',
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.attempt);

  useEffect(() => {
    setLoadingInfo(true);
    axiosClient
      .get(`/exams/public/${code}`)
      .then(({ data }) => {
        setExamInfo(data);
        setLoadError('');
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || 'পরীক্ষা পাওয়া যায়নি বা মেয়াদ শেষ হয়ে গেছে');
      })
      .finally(() => {
        setLoadingInfo(false);
      });
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ডাটা ট্রিম করে পাঠানো
    const payload = {
      examCode: code,
      studentName: form.studentName.trim(),
      studentRoll: form.studentRoll.trim(),
      studentPhone: form.studentPhone.trim(),
      accessCode: form.accessCode.trim(),
    };

    const result = await dispatch(joinExam(payload));
    if (joinExam.fulfilled.match(result)) {
      navigate('/exam/live');
    }
  };

  if (loadingInfo) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow text-center animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded mb-4 w-3/4 mx-auto"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-6 w-1/2 mx-auto"></div>
        <div className="space-y-3">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-sm mx-auto mt-16 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700">
      <h2 className="text-xl font-bold mb-1 text-gray-900 dark:text-white">{examInfo.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        সময়: <span className="font-semibold text-gray-700 dark:text-gray-300">{examInfo.totalTimeMinutes} মিনিট</span>
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            তোমার নাম <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            placeholder="উদাহরণ: রাকিব হাসান"
            value={form.studentName}
            onChange={(e) => setForm({ ...form, studentName: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            রোল নম্বর <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="text"
            placeholder="উদাহরণ: 101"
            value={form.studentRoll}
            onChange={(e) => setForm({ ...form, studentRoll: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            ফোন নম্বর (ঐচ্ছিক)
          </label>
          <input
            type="tel"
            placeholder="017xxxxxxxx"
            value={form.studentPhone}
            onChange={(e) => setForm({ ...form, studentPhone: e.target.value })}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {examInfo.requiresAccessCode && (
          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              একসেস কোড (Access Code) <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="password"
              placeholder="শিক্ষকের দেওয়া কোড লিখো"
              value={form.accessCode}
              onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {error && (
          <div className="p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 rounded-lg font-medium transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
        >
          {status === 'loading' ? 'জয়েন হচ্ছে...' : 'পরীক্ষা শুরু করো'}
        </button>
      </form>
    </div>
  );
}
