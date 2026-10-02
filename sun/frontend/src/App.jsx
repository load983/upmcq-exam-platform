import MobileTabBar from './components/MobileTabBar';
import InstallPrompt from './components/InstallPrompt';
import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import DashboardShell from './components/DashboardShell';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PrivateRoute from './components/PrivateRoute';
import BackgroundWallpaper from './components/BackgroundWallpaper';
import SplashScreen from './components/SplashScreen';
import HelplineWidget from './components/HelplineWidget';

import Home from './pages/Home';
import StudentHome from './pages/StudentHome';
import NotFound from './pages/NotFound';
import SitePage from './pages/SitePage';

import StudentAuth from './pages/student/StudentAuthPage';

import TeacherLogin from './pages/teacher/TeacherLogin';
import TeacherRegister from './pages/teacher/TeacherRegister';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import UploadExam from './pages/teacher/UploadExam';
import CreateMcqExam from './pages/teacher/CreateMcqExam';
import ExamEditor from './pages/teacher/ExamEditor';
import ResultDashboard from './pages/teacher/ResultDashboard';

import StudentJoin from './pages/student/StudentJoin';
import StudentExam from './pages/student/StudentExam';
import StudentResult from './pages/student/StudentResult';
import PastExams from './pages/student/PastExams';
import Leaderboard from './pages/student/Leaderboard';
import Notifications from './pages/student/Notifications';
import Subscribe from './pages/teacher/Subscribe';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';

// কোন পেজে সাইডবার-ড্যাশবোর্ড ফ্রেম দেখাবে (লগইন করা role অনুযায়ী)
function shellRoleFor(user, pathname) {
  if (!user) return null;
  if (user.role === 'admin' && /^\/admin\/dashboard/.test(pathname)) return 'admin';
  if (user.role === 'teacher' && /^\/teacher\/(dashboard|upload|create|exam|subscribe)/.test(pathname)) return 'teacher';
  if (user.role === 'student' && /^\/(exams(\/|$)|notifications)/.test(pathname)) return 'student';
  return null;
}

export default function App() {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const shellRole = shellRoleFor(user, pathname);

  const routes = (
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/page/:slug" element={<SitePage />} />

          {/* ---------- Student পোর্টাল ও অথেন্টিকেশন ---------- */}
          <Route path="/exams" element={<StudentHome />} />
          <Route path="/exams/past" element={<PastExams />} />
          <Route path="/exams/:examId/leaderboard" element={<Leaderboard />} />
          <Route path="/student/auth" element={<StudentAuth />} />
          <Route
            path="/notifications"
            element={<PrivateRoute role="student"><Notifications /></PrivateRoute>}
          />

          {/* ---------- Teacher রুট ---------- */}
          <Route path="/teacher/login" element={<TeacherLogin />} />
          <Route path="/teacher/register" element={<TeacherRegister />} />
          <Route
            path="/teacher/dashboard"
            element={<PrivateRoute role="teacher"><TeacherDashboard /></PrivateRoute>}
          />
          <Route
            path="/teacher/upload"
            element={<PrivateRoute role="teacher"><UploadExam /></PrivateRoute>}
          />
          <Route
            path="/teacher/create"
            element={<PrivateRoute role="teacher"><CreateMcqExam /></PrivateRoute>}
          />
          <Route
            path="/teacher/exam/:id"
            element={<PrivateRoute role="teacher"><ExamEditor /></PrivateRoute>}
          />
          <Route
            path="/teacher/exam/:id/results"
            element={<PrivateRoute role="teacher"><ResultDashboard /></PrivateRoute>}
          />

          <Route
            path="/teacher/subscribe"
            element={<PrivateRoute role="teacher"><Subscribe /></PrivateRoute>}
          />

          {/* ---------- Admin রুট ---------- */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={<PrivateRoute role="admin"><AdminDashboard /></PrivateRoute>}
          />

          {/* ---------- Student রুট (পাবলিক লিংক দিয়ে জয়েন) ---------- */}
          <Route path="/join/:code" element={<StudentJoin />} />
          <Route path="/exam/live" element={<StudentExam />} />
          <Route path="/exam/result" element={<StudentResult />} />

          {/* ---------- 404 ---------- */}
          <Route path="*" element={<NotFound />} />
        </Routes>
  );

  if (shellRole) {
    return (
      <>
        <SplashScreen />
        <DashboardShell role={shellRole}>{routes}</DashboardShell>
        <InstallPrompt />
        <HelplineWidget />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SplashScreen />
      <BackgroundWallpaper />
      <Navbar />
      <main className="flex-1">
        {routes}
      </main>
      <Footer />
      <MobileTabBar />
      <InstallPrompt />
      <HelplineWidget />
    </div>
  );
}
