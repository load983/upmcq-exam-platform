// src/pages/student/StudentAuthPage.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import axiosClient from '../../api/axiosClient';
import AnimatedAuthCard, { AaField } from '../../components/AnimatedAuthCard';

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

      localStorage.setItem('user', JSON.stringify(response.data));
      dispatch({ type: 'auth/setCredentials', payload: response.data });

      navigate('/exams');
    } catch (err) {
      setError(err.response?.data?.message || t('studentAuth.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (toLogin) => {
    setError('');
    setIsLogin(toLogin);
  };

  const loginSlot = (
    <>
      <h2 className="aa-form-title">{t('studentAuth.loginTitle')}</h2>
      <form onSubmit={handleSubmit}>
        <AaField
          id="loginPhone"
          name="phone"
          label={t('studentAuth.phone')}
          icon="fa-solid fa-mobile-screen-button"
          required
          value={formData.phone}
          onChange={handleChange}
        />
        <AaField
          id="loginPassword"
          name="password"
          type="password"
          label={t('studentAuth.password')}
          icon="fa-solid fa-lock"
          required
          value={formData.password}
          onChange={handleChange}
        />
        {isLogin && error && <p className="aa-error">{error}</p>}
        <button type="submit" className="aa-btn" disabled={loading}>
          {loading ? t('studentAuth.wait') : t('studentAuth.login')}
        </button>
      </form>
      <p className="aa-switch">
        {t('studentAuth.toRegister')}{' '}
        <a onClick={(e) => { e.preventDefault(); switchMode(false); }}>{t('studentAuth.register')}</a>
      </p>
    </>
  );

  const signupSlot = (
    <>
      <h2 className="aa-form-title">{t('studentAuth.registerTitle')}</h2>
      <form onSubmit={handleSubmit}>
        <AaField
          id="suName"
          name="name"
          label={t('studentAuth.name')}
          icon="fa-regular fa-user"
          required
          value={formData.name}
          onChange={handleChange}
        />
        <AaField
          id="suRoll"
          name="roll"
          label={t('studentAuth.roll')}
          icon="fa-solid fa-hashtag"
          value={formData.roll}
          onChange={handleChange}
        />
        <AaField
          id="suPhone"
          name="phone"
          label={t('studentAuth.phone')}
          icon="fa-solid fa-mobile-screen-button"
          required
          value={formData.phone}
          onChange={handleChange}
        />
        <AaField
          id="suPassword"
          name="password"
          type="password"
          label={t('studentAuth.password')}
          icon="fa-solid fa-lock"
          required
          value={formData.password}
          onChange={handleChange}
        />
        {!isLogin && error && <p className="aa-error">{error}</p>}
        <button type="submit" className="aa-btn" disabled={loading}>
          {loading ? t('studentAuth.wait') : t('studentAuth.register')}
        </button>
      </form>
      <p className="aa-switch">
        {t('studentAuth.toLogin')}{' '}
        <a onClick={(e) => { e.preventDefault(); switchMode(true); }}>{t('studentAuth.login')}</a>
      </p>
    </>
  );

  return (
    <AnimatedAuthCard
      active={!isLogin}
      loginSlot={loginSlot}
      signupSlot={signupSlot}
      welcomeTitle="WELCOME BACK!"
      welcomeText={t('studentAuth.loginTitle')}
      joinTitle="JOIN US!"
      joinText={t('studentAuth.registerTitle')}
    />
  );
}
