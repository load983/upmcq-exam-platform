// ================== routes/authRoutes.js ==================
const express = require('express');
const router = express.Router();
const { 
  registerTeacher, 
  loginTeacher, 
  loginAdmin,
  registerStudent, 
  loginStudent, 
  getAllStudents, 
  exportStudentsExcel,
  connectTeacher,
  setStudentBan,
  getMyClasses,
  disconnectClass,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');

// Teacher Auth Routes
router.post('/teacher/register', registerTeacher);
router.post('/teacher/login', loginTeacher);

// Admin Auth Route
router.post('/admin/login', loginAdmin);

// Student Auth Routes
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
// (গেস্ট কুইক-লগইন বন্ধ: পরীক্ষা দিতে রেজিস্টার্ড একাউন্টে লগইন বাধ্যতামূলক)

// Student: শিক্ষকের এক্সেস কোড যোগ/বাতিল ও যুক্ত শিক্ষকদের তালিকা
router.post('/student/connect-teacher', protect, authorize('student'), connectTeacher);
router.get('/student/my-classes', protect, authorize('student'), getMyClasses);
router.delete('/student/classes/:classId', protect, authorize('student'), disconnectClass);

// Teacher Dashboard Student Management Routes (শুধু নিজের সাথে যুক্ত স্টুডেন্ট)
router.get('/students', protect, authorize('teacher'), requireSubscription, getAllStudents);
router.get('/students/export', protect, authorize('teacher'), requireSubscription, exportStudentsExcel);
router.patch('/students/:id/ban', protect, authorize('teacher'), requireSubscription, setStudentBan);

module.exports = router;
