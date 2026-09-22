// ================== components/Navbar.jsx ==================
import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import ThemeSwitcher from './ThemeSwitcher';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => setMobileOpen(false), [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/exams');
  };

  const teacherLinkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors ${
      isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 hover:text-primary-600 dark:text-gray-300 dark:hover:text-primary-400'
    }`;

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <nav className="glass sticky top-0 z-40 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm shadow-primary-600/40">
            📝
          </span>
          <span className="gradient-text hidden sm:inline">MCQ Exam Platform</span>
          <span className="gradient-text sm:hidden">MCQ Platform</span>
        </Link>

        {/* ---------- Desktop Menu ---------- */}
        <div className="hidden items-center gap-5 md:flex">
          {user?.role === 'teacher' && (
            <>
              <NavLink to="/teacher/dashboard" className={teacherLinkCls}>
                {t('nav.dashboard')}
              </NavLink>
              <LanguageSwitcher />
              <ThemeSwitcher />
              <span className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3 text-sm font-medium text-gray-700 dark:bg-white/5 dark:text-gray-200">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
                  {initial}
                </span>
                {user.name}
              </span>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline">
                {t('common.logout')}
              </button>
            </>
          )}

          {user?.role === 'student' && (
            <>
              <NavLink to="/exams" className={teacherLinkCls}>
                {t('common.exams')}
              </NavLink>
              <LanguageSwitcher />
              <ThemeSwitcher />
              <span className="flex items-center gap-2 rounded-full bg-gray-100 py-1 pl-1 pr-3 text-sm font-medium text-gray-700 dark:bg-white/5 dark:text-gray-200">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-600 text-[11px] font-bold text-white">
                  {initial}
                </span>
                {user.name}
              </span>
              <button onClick={handleLogout} className="text-sm font-medium text-red-600 hover:underline">
                {t('common.logout')}
              </button>
            </>
          )}

          {!user && (
            <>
              <NavLink to="/exams" className={teacherLinkCls}>
                {t('common.exams')}
              </NavLink>
              <NavLink to="/teacher/login" className={teacherLinkCls}>
                {t('nav.teacherLogin')}
              </NavLink>
              <LanguageSwitcher />
              <ThemeSwitcher />
              <Link to="/student/auth" className="btn-primary !py-2 !px-4 text-sm">
                {t('nav.loginAccount')}
              </Link>
            </>
          )}
        </div>

        {/* ---------- Mobile: theme + hamburger ---------- */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher />
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={t('nav.openMenu')}
            className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 text-gray-600 dark:border-white/10 dark:text-gray-300"
          >
            {mobileOpen ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ---------- Mobile Menu ---------- */}
      {mobileOpen && (
        <div className="animate-fade-in border-t border-gray-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-gray-900 md:hidden">
          <div className="flex flex-col gap-3">
            {user?.role === 'teacher' && (
              <>
                <Link to="/teacher/dashboard" className="text-sm font-medium dark:text-gray-200">
                  {t('nav.dashboard')}
                </Link>
                <button onClick={handleLogout} className="text-left text-sm font-medium text-red-600">
                  {t('nav.logoutWithName', { name: user.name })}
                </button>
              </>
            )}
            {user?.role === 'student' && (
              <>
                <Link to="/exams" className="text-sm font-medium dark:text-gray-200">
                  {t('common.exams')}
                </Link>
                <button onClick={handleLogout} className="text-left text-sm font-medium text-red-600">
                  {t('nav.logoutWithName', { name: user.name })}
                </button>
              </>
            )}
            {!user && (
              <>
                <Link to="/exams" className="text-sm font-medium dark:text-gray-200">
                  {t('common.exams')}
                </Link>
                <Link to="/teacher/login" className="text-sm font-medium dark:text-gray-200">
                  {t('nav.teacherLogin')}
                </Link>
                <Link to="/student/auth" className="btn-primary w-full text-sm">
                  {t('nav.loginCreateAccount')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
