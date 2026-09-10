// ================== controllers/authController.js ==================
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateStudentsExcel } = require('../utils/excelExport');

// JWT টোকেন জেনারেট করার হেল্পার ফাংশন
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: '30d',
  });
};

// 1. Teacher Registration
exports.registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'এই ইমেইল দিয়ে ইতঃপূর্বে অ্যাকাউন্ট খোলা হয়েছে' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
    });

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      token: generateToken(teacher._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, নিবন্ধনে সমস্যা হয়েছে' });
  }
};

// 2. Teacher Login
exports.loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await User.findOne({ email, role: 'teacher' });
    if (!teacher) {
      return res.status(401).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      token: generateToken(teacher._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, লগইনে সমস্যা হয়েছে' });
  }
};

// 3. Student Registration
exports.registerStudent = async (req, res) => {
  try {
    const { name, roll, phone, password } = req.body;

    if (phone) {
      const existingStudent = await User.findOne({ phone, role: 'student' });
      if (existingStudent) {
        return res.status(400).json({ message: 'এই মোবাইল নাম্বার দিয়ে ইতঃপূর্বে রেজিস্ট্রেশন করা হয়েছে' });
      }
    }

    let hashedPassword;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const student = await User.create({
      name,
      roll,
      phone,
      password: hashedPassword,
      role: 'student',
    });

    res.status(201).json({
      _id: student._id,
      name: student.name,
      roll: student.roll,
      phone: student.phone,
      role: student.role,
      token: generateToken(student._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'স্টুডেন্ট রেজিস্টার করতে সমস্যা হয়েছে' });
  }
};

// 4. Student Login
exports.loginStudent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const student = await User.findOne({ phone, role: 'student' });
    if (!student) {
      return res.status(401).json({ message: 'এই নম্বর দিয়ে কোনো স্টুডেন্ট অ্যাকাউন্ট পাওয়া যায়নি' });
    }

    if (student.password) {
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'ভুল পাসওয়ার্ড' });
      }
    }

    res.json({
      _id: student._id,
      name: student.name,
      roll: student.roll,
      phone: student.phone,
      role: student.role,
      token: generateToken(student._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, লগইনে সমস্যা হয়েছে' });
  }
};

// 5. Student Quick Login (Guest/Exam Quick Access)
exports.studentQuickLogin = async (req, res) => {
  try {
    const { name, roll, phone } = req.body;

    let student = null;
    if (phone) {
      student = await User.findOne({ phone, role: 'student' });
    }

    if (!student) {
      student = await User.create({
        name,
        roll,
        phone,
        role: 'student',
      });
    }

    res.json({
      _id: student._id,
      name: student.name,
      roll: student.roll,
      phone: student.phone,
      role: student.role,
      token: generateToken(student._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'কুইক লগইনে সমস্যা হয়েছে' });
  }
};

// 6. Get All Students (For Teacher Dashboard)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে' });
  }
};

// 7. Export Students Excel
exports.exportStudentsExcel = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).sort({ createdAt: -1 });
    const workbook = await generateStudentsExcel(students);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_list.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (err) {
    res.status(500).json({ message: 'এক্সেল ফাইল এক্সপোর্ট করতে সমস্যা হয়েছে' });
  }
};
