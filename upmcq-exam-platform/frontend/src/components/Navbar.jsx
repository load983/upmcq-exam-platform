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

  const handleLogout = () => {
    dispatch(logout());
    navigate('/exams');
  };

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
              <Link to="/teacher/dashboard" className="text-sm dark:text-gray-200 hover:text-primary-600">
                ড্যাশবোর্ড
              </Link>
              <button
                onClick={() => { dispatch(logout()); navigate('/teacher/login'); }}
                className="text-sm text-red-600 hover:underline"
              >
                লগআউট
              </button>
            </>
          )}

          {user?.role === 'student' && (
            <>
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:underline"
              >
                লগআউট
              </button>
            </>
          )}

          {!user && (
            <div className="flex items-center gap-2">
              <Link
                to="/student/auth"
                className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline"
              >
                লগইন / ক্রিয়েট অ্যাকাউন্ট
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
