// ================== pages/teacher/TeacherRegister.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { teacherRegister } from '../../features/auth/authSlice';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedAuthCard, { AaField } from '../../components/AnimatedAuthCard';

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

  // Static preview shown on the left-hand panel (real form lives on /teacher/login)
  const loginSlot = (
    <>
      <h2 className="aa-form-title">{t('teacherLogin.title')}</h2>
      <p className="aa-switch" style={{ marginTop: 0 }}>
        {t('teacherRegister.haveAccount')}{' '}
        <a onClick={(e) => { e.preventDefault(); navigate('/teacher/login'); }}>
          {t('teacherRegister.loginLink')}
        </a>
      </p>
    </>
  );

  const signupSlot = (
    <>
      <h2 className="aa-form-title">{t('teacherRegister.title')}</h2>
      <form onSubmit={handleSubmit}>
        <AaField
          id="teacherName"
          label={t('teacherRegister.fullName')}
          icon="fa-regular fa-user"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <AaField
          id="teacherRegEmail"
          type="email"
          label={t('common.email')}
          icon="fa-regular fa-envelope"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <AaField
          id="teacherRegPassword"
          type="password"
          label={t('teacherRegister.passwordPlaceholder')}
          icon="fa-solid fa-lock"
          required
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {error && <p className="aa-error">{error}</p>}
        <button type="submit" className="aa-btn" disabled={status === 'loading'}>
          {status === 'loading' ? t('teacherRegister.creating') : t('teacherRegister.create')}
        </button>
      </form>
      <p className="aa-switch">
        {t('teacherRegister.haveAccount')}{' '}
        <a onClick={(e) => { e.preventDefault(); navigate('/teacher/login'); }}>
          {t('teacherRegister.loginLink')}
        </a>
      </p>
    </>
  );

  return (
    <AnimatedAuthCard
      active={true}
      loginSlot={loginSlot}
      signupSlot={signupSlot}
      welcomeTitle="WELCOME BACK!"
      welcomeText={t('teacherLogin.title')}
      joinTitle="JOIN US!"
      joinText={t('teacherRegister.title')}
    />
  );
}
