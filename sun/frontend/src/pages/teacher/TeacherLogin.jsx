// ================== pages/teacher/TeacherLogin.jsx ==================
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { teacherLogin } from '../../features/auth/authSlice';
import { useLanguage } from '../../context/LanguageContext';
import AnimatedAuthCard, { AaField } from '../../components/AnimatedAuthCard';

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

  const loginSlot = (
    <>
      <h2 className="aa-form-title">{t('teacherLogin.title')}</h2>
      <form onSubmit={handleSubmit}>
        <AaField
          id="teacherEmail"
          type="email"
          label={t('common.email')}
          icon="fa-regular fa-envelope"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <AaField
          id="teacherPassword"
          type="password"
          label={t('common.password')}
          icon="fa-solid fa-lock"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="aa-error">{error}</p>}
        <button type="submit" className="aa-btn" disabled={status === 'loading'}>
          {status === 'loading' ? t('teacherLogin.loggingIn') : t('teacherLogin.login')}
        </button>
      </form>
      <p className="aa-switch">
        {t('teacherLogin.noAccount')}{' '}
        <a onClick={(e) => { e.preventDefault(); navigate('/teacher/register'); }}>
          {t('teacherLogin.registerLink')}
        </a>
      </p>
    </>
  );

  // Static preview shown on the right-hand panel (real form lives on /teacher/register)
  const signupSlot = (
    <>
      <h2 className="aa-form-title">{t('teacherRegister.title')}</h2>
      <p className="aa-switch" style={{ marginTop: 0 }}>
        {t('teacherLogin.noAccount')}{' '}
        <a onClick={(e) => { e.preventDefault(); navigate('/teacher/register'); }}>
          {t('teacherLogin.registerLink')}
        </a>
      </p>
    </>
  );

  return (
    <AnimatedAuthCard
      active={false}
      loginSlot={loginSlot}
      signupSlot={signupSlot}
      welcomeTitle="WELCOME BACK!"
      welcomeText={t('teacherLogin.title')}
      joinTitle="JOIN US!"
      joinText={t('teacherRegister.title')}
    />
  );
}
