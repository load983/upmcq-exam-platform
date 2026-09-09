// ================== pages/teacher/TeacherLogin.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { teacherLogin } from '../../features/auth/authSlice';

export default function TeacherLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(teacherLogin({ email, password }));
    if (teacherLogin.fulfilled.match(result)) navigate('/teacher/dashboard');
  };

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-6 dark:text-white">শিক্ষক লগইন</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" required placeholder="ইমেইল" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        <input type="password" required placeholder="পাসওয়ার্ড" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={status === 'loading'} className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium">
          {status === 'loading' ? 'লগইন হচ্ছে...' : 'লগইন'}
        </button>
      </form>
      <p className="text-sm text-center mt-4 dark:text-gray-300">
        একাউন্ট নেই? <Link to="/teacher/register" className="text-primary-600">রেজিস্টার করো</Link>
      </p>
    </div>
  );
}
