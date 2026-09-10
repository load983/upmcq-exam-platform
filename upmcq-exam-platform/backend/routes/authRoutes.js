// ================== routes/authRoutes.js ==================
const express = require('express');
const router = express.Router();
const { 
  registerTeacher, 
  loginTeacher, 
  studentQuickLogin, 
  registerStudent, 
  loginStudent, 
  getAllStudents, 
  exportStudentsExcel 
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Teacher Auth Routes
router.post('/teacher/register', registerTeacher);
router.post('/teacher/login', loginTeacher);

// Student Auth Routes
router.post('/student/register', registerStudent);
router.post('/student/login', loginStudent);
router.post('/student/quick-login', studentQuickLogin); // গেস্ট বা কুইক এক্সেসের জন্য

// Teacher Dashboard Student Management Routes
router.get('/students', protect, getAllStudents);
router.get('/students/export', protect, exportStudentsExcel);

module.exports = router;
