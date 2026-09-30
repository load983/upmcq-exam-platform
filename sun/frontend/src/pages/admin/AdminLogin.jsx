// ================== pages/admin/AdminLogin.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../features/auth/authSlice';
import { useLanguage } from '../../context/LanguageContext';

export default function AdminLogin() {
  const { t, tm } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error } = useSelector((s) => s.auth);

  const submit = async (e) => {
    e.preventDefault();
    const r = await dispatch(adminLogin({ email, password }));
    if (adminLogin.fulfilled.match(r)) navigate('/admin/dashboard');
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <form onSubmit={submit} className="card space-y-3">
        <h1 className="text-xl font-bold dark:text-white">{t('a.login.title')}</h1>
        <input className="input" type="email" placeholder={t('a.login.email')} required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder={t('a.login.password')} required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && status === 'failed' && <p className="text-sm text-red-600">{tm(error)}</p>}
        <button className="btn-primary w-full" disabled={status === 'loading'}>{t('a.login.submit')}</button>
      </form>
    </div>
  );
}
