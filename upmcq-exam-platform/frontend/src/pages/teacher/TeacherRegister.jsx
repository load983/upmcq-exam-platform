// ================== pages/teacher/TeacherRegister.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { teacherRegister } from '../../features/auth/authSlice';
import { useLanguage } from '../../context/LanguageContext';

export default function TeacherRegister() {
  const { t } = useLanguage();
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
    <div className="card mx-auto mt-16 max-w-sm p-8">
      <h2 className="text-xl font-bold mb-6 dark:text-white">{t('teacherRegister.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input 
          type="text"
          required 
          placeholder={t('teacherRegister.fullName')} 
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="input" 
        />
        <input 
          type="email" 
          required 
          placeholder={t('common.email')} 
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="input" 
        />
        <input 
          type="password" 
          required 
          minLength={6}
          placeholder={t('teacherRegister.passwordPlaceholder')} 
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="input" 
        />

        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

        <button 
          type="submit"
          disabled={status === 'loading'} 
          className="btn-primary w-full"
        >
          {status === 'loading' ? t('teacherRegister.creating') : t('teacherRegister.create')}
        </button>
      </form>
      
      <p className="text-sm text-center mt-4 dark:text-gray-300">
        {t('teacherRegister.haveAccount')} <Link to="/teacher/login" className="text-primary-600 hover:underline">{t('teacherRegister.loginLink')}</Link>
      </p>
    </div>
  );
}
