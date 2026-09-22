// src/pages/student/StudentAuthPage.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import axiosClient from '../../api/axiosClient'; // 🛠️ পাথ ঠিক করা হয়েছে (../ এর জায়গায় ../../)

export default function StudentAuthPage() {
  const { t } = useLanguage();
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
      setError(err.response?.data?.message || t('studentAuth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card mx-auto mt-10 max-w-md p-6">
      <h2 className="text-2xl font-bold text-center mb-6 dark:text-white">
        {isLogin ? t('studentAuth.loginTitle') : t('studentAuth.registerTitle')}
      </h2>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">{t('studentAuth.name')}</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium dark:text-gray-200">{t('studentAuth.roll')}</label>
              <input
                type="text"
                name="roll"
                value={formData.roll}
                onChange={handleChange}
                className="input mt-1"
              />
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium dark:text-gray-200">{t('studentAuth.phone')}</label>
          <input
            type="text"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="input mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium dark:text-gray-200">{t('studentAuth.password')}</label>
          <input
            type="password"
            name="password"
            required
            value={formData.password}
            onChange={handleChange}
            className="input mt-1"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? t('studentAuth.wait') : isLogin ? t('studentAuth.login') : t('studentAuth.register')}
        </button>
      </form>

      <div className="mt-4 text-center">
        <button
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="text-sm text-primary-600 dark:text-primary-400 underline"
        >
          {isLogin ? t('studentAuth.toRegister') : t('studentAuth.toLogin')}
        </button>
      </div>
    </div>
  );
}
