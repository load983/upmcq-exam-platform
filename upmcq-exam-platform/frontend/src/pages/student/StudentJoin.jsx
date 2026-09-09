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
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({ studentName: '', studentRoll: '', studentPhone: '', accessCode: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.attempt);

  useEffect(() => {
    axiosClient
      .get(`/exams/public/${code}`)
      .then(({ data }) => setExamInfo(data))
      .catch((err) => setLoadError(err.response?.data?.message || 'পরীক্ষা পাওয়া যায়নি'));
  }, [code]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(joinExam({ examCode: code, ...form }));
    if (joinExam.fulfilled.match(result)) navigate('/exam/live');
  };

  if (loadError) return <p className="text-center mt-10 text-red-600">{loadError}</p>;
  if (!examInfo) return <p className="text-center mt-10 dark:text-white">লোড হচ্ছে...</p>;

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-1 dark:text-white">{examInfo.title}</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">সময়: {examInfo.totalTimeMinutes} মিনিট</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input required placeholder="তোমার নাম" value={form.studentName}
          onChange={(e) => setForm({ ...form, studentName: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        <input required placeholder="রোল নম্বর" value={form.studentRoll}
          onChange={(e) => setForm({ ...form, studentRoll: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        <input placeholder="ফোন নম্বর (ঐচ্ছিক)" value={form.studentPhone}
          onChange={(e) => setForm({ ...form, studentPhone: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        {examInfo.requiresAccessCode && (
          <input required placeholder="Access Code" value={form.accessCode}
            onChange={(e) => setForm({ ...form, accessCode: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        )}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={status === 'loading'} className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium">
          {status === 'loading' ? 'জয়েন হচ্ছে...' : 'পরীক্ষা শুরু করো'}
        </button>
      </form>
    </div>
  );
}
