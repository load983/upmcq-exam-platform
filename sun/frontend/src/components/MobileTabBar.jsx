// ================== components/MobileTabBar.jsx ==================
// মোবাইলে অ্যাপের মতো নিচের ট্যাব বার (md থেকে বড় স্ক্রিনে দেখায় না)
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { Icon } from '../pages/admin/adminUi';

// যেসব পেজে বার লুকানো থাকবে: পরীক্ষা চলাকালীন, লগইন/রেজিস্টার, অ্যাডমিন, নিজস্ব নিচের বারওয়ালা পেজ
const HIDDEN = [/^\/exam\/live/, /^\/join\//, /^\/student\/auth/, /^\/teacher\/(login|register|create)/, /^\/admin/];

export default function MobileTabBar() {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const { t } = useLanguage();
  if (HIDDEN.some((r) => r.test(pathname)) || user?.role === 'admin') return null;

  const items =
    user?.role === 'teacher'
      ? [
          ['/teacher/dashboard', t('nav.dashboard'), 'grid'],
          ['/teacher/create', t('dash.newExamOnline'), 'plus'],
          ['/teacher/subscribe', t('nav.subscription'), 'card'],
        ]
      : [
          ['/exams', t('common.exams'), 'home'],
          ['/exams/past', t('pastExams.title'), 'clock'],
          user?.role === 'student'
            ? ['/notifications', t('msg.notifications'), 'bell']
            : ['/student/auth', t('nav.loginAccount'), 'teacher'],
        ];

  return (
    <>
      <nav aria-label="Main" className="glass fixed inset-x-0 bottom-0 z-40 border-x-0 border-b-0 pb-[env(safe-area-inset-bottom)] md:hidden">
        <ul className="mx-auto flex max-w-md">
          {items.map(([to, label, icon]) => (
            <li key={to} className="flex-1">
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  `flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                    isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-500 dark:text-gray-400'
                  }`
                }
              >
                <Icon name={icon} className="h-6 w-6" />
                <span className="max-w-full truncate">{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="h-[calc(3.5rem+env(safe-area-inset-bottom))] md:hidden" aria-hidden="true" />
    </>
  );
}
