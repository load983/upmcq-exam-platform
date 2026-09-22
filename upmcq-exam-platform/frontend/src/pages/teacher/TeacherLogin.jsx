// ================== pages/teacher/TeacherLogin.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { teacherLogin } from '../../features/auth/authSlice';
import { useLanguage } from '../../context/LanguageContext';

export default function TeacherLogin() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(teacherLogin({ email, password }));
    if (teacherLogin.fulfilled.match(result)) {
      navigate('/teacher/dashboard');
    }
  };

  return (
    <div className="card mx-auto mt-16 max-w-sm p-8">
      <h2 className="text-xl font-bold mb-6 dark:text-white">{t('teacherLogin.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="email" 
          required 
          placeholder={t('common.email')} 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input" 
        />
        <input 
          type="password" 
          required 
          placeholder={t('common.password')} 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input" 
        />

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-sm text-center font-medium">
            {error}
          </div>
        )}

        <button 
          type="submit"
          disabled={status === 'loading'} 
          className="btn-primary w-full"
        >
          {status === 'loading' ? t('teacherLogin.loggingIn') : t('teacherLogin.login')}
        </button>
      </form>
      <p className="text-sm text-center mt-4 dark:text-gray-300">
        {t('teacherLogin.noAccount')} <Link to="/teacher/register" className="text-primary-600 hover:underline">{t('teacherLogin.registerLink')}</Link>
      </p>
    </div>
  );
}
