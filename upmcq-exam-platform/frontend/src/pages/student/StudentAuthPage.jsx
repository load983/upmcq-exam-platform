// src/pages/student/StudentAuthPage.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient'; // 🛠️ পাথ ঠিক করা হয়েছে (../ এর জায়গায় ../../)

export default function StudentAuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', roll: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/student/login' : '/auth/student/register';
      const response = await axiosClient.post(endpoint, formData);
      
      // লোকাল স্টোরেজ ও রিডাক্স স্টেট আপডেট
      localStorage.setItem('user', JSON.stringify(response.data));
      dispatch({ type: 'auth/setCredentials', payload: response.data });

      navigate('/exams');
    } catch (err) {
      setError(err.response?.data?.message || 'সমস্যা হয়েছে, আবার চেষ্টা করুন');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border dark:border-gray-700">
      <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
        {isLogin ? 'শিক্ষার্থী লগইন' : 'নতুন অ্যাকাউন্ট তৈরি করুন'}
      </h2>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">নাম</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">রোল নাম্বার</label>
              <input
                type="text"
                name="roll"
                value={formData.roll}
                onChange={handleChange}
                className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium dark:text-gray-200">মোবাইল নাম্বার</label>
          <input
            type="text"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-200">পাসওয়ার্ড</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'অপেক্ষা করুন...' : isLogin ? 'লগইন' : 'রেজিস্টার'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-sm text-primary-600 dark:text-primary-400 underline"
        >
          {isLogin ? 'নতুন অ্যাকাউন্ট নেই? সাইন আপ করুন' : 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন'}
        </button>
      </div>
    </div>
  );
}
