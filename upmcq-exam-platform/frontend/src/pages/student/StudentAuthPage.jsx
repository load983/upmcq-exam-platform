import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export default function StudentAuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({ name: '', roll: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const endpoint = isRegister ? '/auth/student/register' : '/auth/student/login';

    try {
      const res = await axiosClient.post(endpoint, formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/exams');
    } catch (err) {
      setError(err.response?.data?.message || 'একটি সমস্যা দেখা দিয়েছে');
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800 dark:text-white">
          {isRegister ? 'শিক্ষার্থী অ্যাকাউন্ট তৈরি করুন' : 'শিক্ষার্থী লগইন'}
        </h2>

        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">নাম</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="আপনার নাম লিখুন"
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-200">রোল নাম্বার</label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  placeholder="আপনার রোল লিখুন"
                  onChange={(e) => setFormData({ ...formData, roll: e.target.value })}
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">মোবাইল নাম্বার</label>
            <input
              type="text"
              required
              className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="017xxxxxxxx"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">পাসওয়ার্ড</label>
            <input
              type="password"
              required
              className="w-full p-2.5 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
              placeholder="******"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
          >
            {isRegister ? 'অ্যাকাউন্ট তৈরি করুন' : 'লগইন করুন'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {isRegister
              ? 'আগে থেকেই অ্যাকাউন্ট আছে? লগইন করুন'
              : 'নতুন অ্যাকাউন্ট তৈরি করতে চান? এখানে ক্লিক করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
