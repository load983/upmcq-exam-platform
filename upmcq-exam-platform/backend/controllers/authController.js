const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Teacher Register & Login... (আপনার বিদ্যমান কোড একই থাকবে)

// ====== Student Auth Controllers ======

// Student Registration (Name, Roll, Phone, Password)
exports.studentRegister = async (req, res) => {
  try {
    const { name, roll, phone, password } = req.body;

    if (!name || !roll || !phone || !password) {
      return res.status(400).json({ message: 'সবগুলো ফিল্ড পুরন করুন' });
    }

    let existingUser = await User.findOne({ phone, role: 'student' });
    if (existingUser) {
      return res.status(400).json({ message: 'এই ফোন নম্বর দিয়ে ইতিমধ্যেই অ্যাকাউন্ট তৈরি করা হয়েছে' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const student = new User({
      name,
      roll,
      phone,
      password: hashedPassword,
      role: 'student'
    });

    await student.save();

    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে',
      token,
      user: {
        id: student._id,
        name: student.name,
        roll: student.roll,
        phone: student.phone,
        role: student.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Student Login (Phone & Password)
exports.studentLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'ফোন নম্বর এবং পাসওয়ার্ড প্রদান করুন' });
    }

    const student = await User.findOne({ phone, role: 'student' });
    if (!student) {
      return res.status(400).json({ message: 'শিক্ষার্থী পাওয়া যায়নি' });
    }

    const isMatch = await bcrypt.compare(password, student.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'পাসওয়ার্ড ভুল হয়েছে' });
    }

    const token = jwt.sign(
      { id: student._id, role: student.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'সফলভাবে লগইন হয়েছে',
      token,
      user: {
        id: student._id,
        name: student.name,
        roll: student.roll,
        phone: student.phone,
        role: student.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Registered Students (Teacher Only)
exports.getRegisteredStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
