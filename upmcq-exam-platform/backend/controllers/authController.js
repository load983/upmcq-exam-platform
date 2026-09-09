// ================== controllers/authController.js ==================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Teacher রেজিস্ট্রেশন
exports.registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'নাম, ইমেইল ও পাসওয়ার্ড আবশ্যক' });
    }
    const exists = await User.findOne({ email, role: 'teacher' });
    if (exists) return res.status(400).json({ message: 'এই ইমেইলে আগে থেকে একাউন্ট আছে' });

    const hashed = await bcrypt.hash(password, 10);
    const teacher = await User.create({ name, email, password: hashed, role: 'teacher' });

    res.status(201).json({ token: signToken(teacher), user: { id: teacher._id, name, email, role: 'teacher' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Teacher লগইন
exports.loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;
    const teacher = await User.findOne({ email, role: 'teacher' });
    if (!teacher) return res.status(400).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });

    const match = await bcrypt.compare(password, teacher.password);
    if (!match) return res.status(400).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });

    res.json({
      token: signToken(teacher),
      user: { id: teacher._id, name: teacher.name, email: teacher.email, role: 'teacher' },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Student জয়েন (আলাদা রেজিস্ট্রেশনের দরকার নেই, নাম/রোল/ফোন দিয়েই এন্ট্রি হবে)
// exam জয়েন করার সময় attemptController এ এটা হ্যান্ডেল হয়, তবে
// আলাদা "student session token" দরকার হলে এখান থেকেও ইস্যু করা যায়
exports.studentQuickLogin = async (req, res) => {
  try {
    const { name, roll, phone } = req.body;
    if (!name || !roll) return res.status(400).json({ message: 'নাম ও রোল আবশ্যক' });

    let student = await User.findOne({ role: 'student', roll, phone });
    if (!student) {
      student = await User.create({ name, roll, phone, role: 'student' });
    }
    const token = jwt.sign(
      { id: student._id, role: 'student', name, roll },
      process.env.JWT_SECRET,
      { expiresIn: '6h' }
    );
    res.json({ token, user: { id: student._id, name, roll, phone, role: 'student' } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
