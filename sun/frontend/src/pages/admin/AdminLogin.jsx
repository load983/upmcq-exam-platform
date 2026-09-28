// ================== pages/admin/AdminLogin.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../features/auth/authSlice';

export default function AdminLogin() {
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
        <h1 className="text-xl font-bold dark:text-white">অ্যাডমিন লগইন</h1>
        <input className="input" type="email" placeholder="ইমেইল" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="পাসওয়ার্ড" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && status === 'failed' && <p className="text-sm text-red-600">{error}</p>}
        <button className="btn-primary w-full" disabled={status === 'loading'}>লগইন</button>
      </form>
    </div>
  );
}
