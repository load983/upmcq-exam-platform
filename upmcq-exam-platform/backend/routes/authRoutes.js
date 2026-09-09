// ================== routes/authRoutes.js ==================
const express = require('express');
const router = express.Router();
const { registerTeacher, loginTeacher, studentQuickLogin } = require('../controllers/authController');

router.post('/teacher/register', registerTeacher);
router.post('/teacher/login', loginTeacher);
router.post('/student/login', studentQuickLogin);

module.exports = router;
