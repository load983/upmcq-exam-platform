// ================== components/Navbar.jsx ==================
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/auth/authSlice';
import DarkModeToggle from './DarkModeToggle';

export default function Navbar() {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-bold text-lg text-primary-600 dark:text-primary-500">
          📝 MCQ Exam Platform
        </Link>
        <div className="flex items-center gap-3">
          <DarkModeToggle />
          {user?.role === 'teacher' && (
            <>
              <Link to="/teacher/dashboard" className="text-sm dark:text-gray-200">ড্যাশবোর্ড</Link>
              <button
                onClick={() => { dispatch(logout()); navigate('/teacher/login'); }}
                className="text-sm text-red-600"
              >
                লগআউট
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
