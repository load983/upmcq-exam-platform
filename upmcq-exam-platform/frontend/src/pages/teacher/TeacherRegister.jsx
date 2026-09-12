// ================== pages/teacher/TeacherRegister.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { teacherRegister } from '../../features/auth/authSlice';

export default function TeacherRegister() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(teacherRegister(form));
    if (teacherRegister.fulfilled.match(result)) {
      navigate('/teacher/dashboard');
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-16 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow">
      <h2 className="text-xl font-bold mb-6 dark:text-white">নতুন শিক্ষক একাউন্ট</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text"
          required 
          placeholder="পুরো নাম" 
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" 
        />
        <input 
          type="email" 
          required 
          placeholder="ইমেইল" 
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" 
        />
        <input 
          type="password" 
          required 
          minLength={6}
          placeholder="পাসওয়ার্ড (সর্বনিম্ন ৬ অক্ষর)" 
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500" 
        />

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          type="submit"
          disabled={status === 'loading'} 
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 transition-colors"
        >
          {status === 'loading' ? 'তৈরি হচ্ছে...' : 'একাউন্ট তৈরি করো'}
        </button>
      </form>
      
      <p className="text-sm text-center mt-4 dark:text-gray-300">
        আগে থেকেই একাউন্ট আছে? <Link to="/teacher/login" className="text-primary-600 hover:underline">লগইন করো</Link>
      </p>
    </div>
  );
}
