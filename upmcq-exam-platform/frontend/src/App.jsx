// ================== App.jsx ==================
// সব রাউট এখানে ডিফাইন করা আছে
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';

import Home from './pages/Home';
import TeacherLogin from './pages/teacher/TeacherLogin';
import TeacherRegister from './pages/teacher/TeacherRegister';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import UploadExam from './pages/teacher/UploadExam';
import ExamEditor from './pages/teacher/ExamEditor';
import ResultDashboard from './pages/teacher/ResultDashboard';

import StudentJoin from './pages/student/StudentJoin';
import StudentExam from './pages/student/StudentExam';
import StudentResult from './pages/student/StudentResult';

export default function App() {
  return (
    <div className="min-h-screen dark:bg-gray-900">
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />

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
          path="/teacher/exam/:id"
          element={<PrivateRoute role="teacher"><ExamEditor /></PrivateRoute>}
        />
        <Route
          path="/teacher/exam/:id/results"
          element={<PrivateRoute role="teacher"><ResultDashboard /></PrivateRoute>}
        />

        {/* ---------- Student রুট (পাবলিক লিংক দিয়ে জয়েন) ---------- */}
        <Route path="/join/:code" element={<StudentJoin />} />
        <Route path="/exam/live" element={<StudentExam />} />
        <Route path="/exam/result" element={<StudentResult />} />
      </Routes>
    </div>
  );
}
