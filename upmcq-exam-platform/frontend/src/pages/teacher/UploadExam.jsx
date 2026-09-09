// ================== pages/teacher/UploadExam.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { uploadExamPdf } from '../../features/exam/examSlice';

export default function UploadExam() {
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { error } = useSelector((s) => s.exam);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setLocalError('একটি PDF ফাইল সিলেক্ট করো');
    setLoading(true);
    setLocalError('');

    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);

    const result = await dispatch(uploadExamPdf(formData));
    setLoading(false);
    if (uploadExamPdf.fulfilled.match(result)) {
      navigate(`/teacher/exam/${result.payload.exam._id}`);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <h2 className="text-xl font-bold mb-2 dark:text-white">PDF আপলোড করে পরীক্ষা তৈরি করো</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        ফরম্যাট: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">1. প্রশ্ন? A. ... B. ... C. ... D. ... Answer: C</code>
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow">
        <input placeholder="পরীক্ষার নাম (ঐচ্ছিক, না দিলে ফাইলের নাম ব্যবহার হবে)"
          value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files[0])}
          className="w-full text-sm dark:text-gray-300" />
        {(localError || error) && <p className="text-red-600 text-sm">{localError || error}</p>}
        <button disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium">
          {loading ? 'PDF পার্স হচ্ছে...' : 'আপলোড ও পার্স করো'}
        </button>
      </form>
    </div>
  );
}
