// ================== controllers/authController.js ==================
const crypto = require('crypto');
const User = require('../models/User');
const Class = require('../models/Class');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { generateStudentsExcel } = require('../utils/excelExport');
const { grantTrialIfEnabled } = require('../utils/trial');

// JWT টোকেন জেনারেট করার হেল্পার ফাংশন (role-ও টোকেনে ঢোকানো হচ্ছে, নাহলে authorize() মিডলওয়্যার কাজ করে না)
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secretkey', {
    expiresIn: '30d',
  });
};

// শিক্ষকের জন্য ইউনিক এক্সেস কোড তৈরি করার হেল্পার (৬ অক্ষরের আপারকেস কোড, সহজে পড়া/টাইপ করা যায়)
const generateUniqueAccessCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(3).toString('hex').toUpperCase(); // যেমন: 8F3A1C
    exists = await User.exists({ accessCode: code });
  }
  return code;
};

// 1. Teacher Registration
exports.registerTeacher = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'এই ইমেইল দিয়ে ইতঃপূর্বে অ্যাকাউন্ট খোলা হয়েছে' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const accessCode = await generateUniqueAccessCode();

    const teacher = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'teacher',
      accessCode,
    });

    // "Test Web" চালু থাকলে নতুন শিক্ষক অটোমেটিক নির্ধারিত মেয়াদ ও ফিচার পাবে
    await grantTrialIfEnabled(teacher._id);

    res.status(201).json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      accessCode: teacher.accessCode,
      token: generateToken(teacher._id, teacher.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, নিবন্ধনে সমস্যা হয়েছে' });
  }
};

// 2. Teacher Login
exports.loginTeacher = async (req, res) => {
  try {
    const { email, password } = req.body;

    const teacher = await User.findOne({ email, role: 'teacher' });
    if (!teacher) {
      return res.status(401).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });
    }

    const isMatch = await bcrypt.compare(password, teacher.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });
    }

    // পুরনো একাউন্ট (এই ফিচার আসার আগে তৈরি হওয়া) হলে এখন এক্সেস কোড বসিয়ে দেওয়া হচ্ছে
    if (!teacher.accessCode) {
      teacher.accessCode = await generateUniqueAccessCode();
      await teacher.save();
    }

    res.json({
      _id: teacher._id,
      name: teacher.name,
      email: teacher.email,
      role: teacher.role,
      accessCode: teacher.accessCode,
      token: generateToken(teacher._id, teacher.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, লগইনে সমস্যা হয়েছে' });
  }
};

// 2.5 Admin Login — শুধু .env-এর ADMIN_EMAIL ও ADMIN_PASSWORD দিয়েই ঢোকা যায়
const adminFails = new Map(); // ip -> { count, resetAt } (৫ বার ভুল হলে ১৫ মিনিট বন্ধ)
exports.loginAdmin = async (req, res) => {
  try {
    const ip = req.ip;
    const rec = adminFails.get(ip);
    if (rec && rec.resetAt > Date.now() && rec.count >= 5) {
      return res.status(429).json({ message: 'অনেকবার ভুল হয়েছে, ১৫ মিনিট পরে আবার চেষ্টা করো' });
    }
    const fail = () => {
      const cur = rec && rec.resetAt > Date.now() ? rec : { count: 0, resetAt: Date.now() + 15 * 60 * 1000 };
      cur.count += 1;
      adminFails.set(ip, cur);
      return res.status(401).json({ message: 'ভুল ইমেইল বা পাসওয়ার্ড' });
    };

    const email = String(req.body.email || '').trim().toLowerCase();
    const { password } = req.body;
    if (!email || !process.env.ADMIN_EMAIL || email !== String(process.env.ADMIN_EMAIL).trim().toLowerCase()) return fail();

    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin || !(await bcrypt.compare(password || '', admin.password || ''))) return fail();

    adminFails.delete(ip);
    res.json({
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      token: generateToken(admin._id, admin.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, লগইনে সমস্যা হয়েছে' });
  }
};

// 3. Student Registration
// 🔑 নতুন একাউন্ট খোলার সময় শিক্ষকের এক্সেস কোড দেওয়া আবশ্যক — এতে সে ওই শিক্ষকের সাথে সাথে সাথেই যুক্ত হয়ে যায়
exports.registerStudent = async (req, res) => {
  try {
    const { name, roll, phone, password, accessCode } = req.body;

    if (!accessCode || !String(accessCode).trim()) {
      return res.status(400).json({ message: 'শিক্ষকের এক্সেস কোড দেওয়া আবশ্যক' });
    }

    const code = String(accessCode).trim().toUpperCase();
    const cls = await Class.findOne({ accessCode: code });
    let legacyTeacher = null;
    if (!cls) legacyTeacher = await User.findOne({ role: 'teacher', accessCode: code });
    if (!cls && !legacyTeacher) {
      return res.status(400).json({ message: 'এই এক্সেস কোড দিয়ে কোনো শ্রেণী পাওয়া যায়নি, আবার চেক করো' });
    }

    if (phone) {
      const existingStudent = await User.findOne({ phone, role: 'student' });
      if (existingStudent) {
        return res.status(400).json({ message: 'এই মোবাইল নাম্বার দিয়ে ইতঃপূর্বে রেজিস্ট্রেশন করা হয়েছে' });
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
      connectedClasses: cls ? [cls._id] : [],
      connectedTeachers: legacyTeacher ? [legacyTeacher._id] : [],
    });

    res.status(201).json({
      _id: student._id,
      name: student.name,
      roll: student.roll,
      phone: student.phone,
      role: student.role,
      token: generateToken(student._id, student.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'স্টুডেন্ট রেজিস্টার করতে সমস্যা হয়েছে' });
  }
};

// 4. Student Login
exports.loginStudent = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const student = await User.findOne({ phone, role: 'student' });
    if (!student) {
      return res.status(401).json({ message: 'এই নম্বর দিয়ে কোনো স্টুডেন্ট অ্যাকাউন্ট পাওয়া যায়নি' });
    }

    if (student.password) {
      const isMatch = await bcrypt.compare(password, student.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'ভুল পাসওয়ার্ড' });
      }
    }

    res.json({
      _id: student._id,
      name: student.name,
      roll: student.roll,
      phone: student.phone,
      role: student.role,
      token: generateToken(student._id, student.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'সার্ভার এরর, লগইনে সমস্যা হয়েছে' });
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
      token: generateToken(student._id, student.role),
    });
  } catch (err) {
    res.status(500).json({ message: 'কুইক লগইনে সমস্যা হয়েছে' });
  }
};

// হেলপার: শিক্ষকের নিজের স্টুডেন্ট (শ্রেণী বা পুরনো কোডের মাধ্যমে যুক্ত), ক্লাস ও ব্যান স্ট্যাটাসসহ
const loadTeacherStudents = async (teacherId, classIdFilter) => {
  const teacherClasses = await Class.find({ teacher: teacherId }).select('name').lean();
  const classIds = teacherClasses.map((c) => c._id);
  const classNameMap = {};
  teacherClasses.forEach((c) => (classNameMap[c._id.toString()] = c.name));

  const query = { role: 'student' };
  if (classIdFilter) {
    if (!classIds.some((id) => id.toString() === String(classIdFilter))) return [];
    query.connectedClasses = classIdFilter;
  } else {
    query.$or = [{ connectedClasses: { $in: classIds } }, { connectedTeachers: teacherId }];
  }

  const students = await User.find(query).select('-password').sort({ createdAt: -1 }).lean();
  return students.map((s) => ({
    _id: s._id,
    name: s.name,
    roll: s.roll,
    phone: s.phone,
    createdAt: s.createdAt,
    classes: (s.connectedClasses || [])
      .filter((id) => classNameMap[id.toString()])
      .map((id) => ({ _id: id, name: classNameMap[id.toString()] })),
    banned: (s.bannedByTeachers || []).some((id) => id.toString() === String(teacherId)),
  }));
};

// 6. Get All Students (For Teacher Dashboard)
// 🔒 শুধু ওই স্টুডেন্টরাই দেখাবে যারা এই শিক্ষকের কোনো শ্রেণীর এক্সেস কোড যোগ করেছে — ক্লাস ও ব্যান স্ট্যাটাসসহ
exports.getAllStudents = async (req, res) => {
  try {
    res.json(await loadTeacherStudents(req.user.id));
  } catch (err) {
    res.status(500).json({ message: 'শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে' });
  }
};

// 7. Export Students Excel (শুধু নিজের সাথে যুক্ত স্টুডেন্টদের; ?classId= দিলে নির্দিষ্ট শ্রেণীর)
exports.exportStudentsExcel = async (req, res) => {
  try {
    const students = await loadTeacherStudents(req.user.id, req.query.classId || null);
    const workbook = await generateStudentsExcel(students, req.query.lang);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=students_list.xlsx');

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (err) {
    res.status(500).json({ message: 'এক্সেল ফাইল এক্সপোর্ট করতে সমস্যা হয়েছে' });
  }
};

// 7.5 শিক্ষক: স্টুডেন্টকে ব্যান / আনব্যান (PATCH /auth/students/:id/ban { banned: true|false })
// ব্যান করলে ওই স্টুডেন্ট এই শিক্ষকের কোনো পরীক্ষা দিতে পারবে না
exports.setStudentBan = async (req, res) => {
  try {
    const banned = !!req.body.banned;
    const students = await loadTeacherStudents(req.user.id);
    if (!students.some((s) => s._id.toString() === req.params.id)) {
      return res.status(404).json({ message: 'এই শিক্ষার্থী আপনার তালিকায় নেই' });
    }
    await User.updateOne(
      { _id: req.params.id },
      banned ? { $addToSet: { bannedByTeachers: req.user.id } } : { $pull: { bannedByTeachers: req.user.id } }
    );
    res.json({ banned, message: banned ? 'শিক্ষার্থীকে ব্যান করা হয়েছে' : 'ব্যান তুলে নেওয়া হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'ব্যান স্ট্যাটাস পরিবর্তন করতে সমস্যা হয়েছে' });
  }
};

// 8. Student: শ্রেণীর এক্সেস কোড যোগ করা (একাধিক শ্রেণীর কোড যোগ করা যাবে)
// পুরনো শিক্ষক-লেভেল কোডও কাজ করবে (legacy)
exports.connectTeacher = async (req, res) => {
  try {
    const { accessCode } = req.body;
    if (!accessCode || !String(accessCode).trim()) {
      return res.status(400).json({ message: 'এক্সেস কোড আবশ্যক' });
    }
    const code = String(accessCode).trim().toUpperCase();

    const student = await User.findById(req.user.id);
    if (!student || student.role !== 'student') {
      return res.status(403).json({ message: 'শুধু স্টুডেন্ট একাউন্ট থেকে এই কাজ করা যাবে' });
    }

    const cls = await Class.findOne({ accessCode: code }).populate('teacher', 'name');
    if (cls) {
      if (student.connectedClasses.some((id) => id.toString() === cls._id.toString())) {
        return res.status(400).json({ message: 'এই শ্রেণীর এক্সেস কোড আগেই যোগ করা হয়েছে' });
      }
      student.connectedClasses.push(cls._id);
      await student.save();
      return res.json({
        message: `"${cls.teacher?.name || ''}" শিক্ষকের "${cls.name}" শ্রেণীতে সফলভাবে যুক্ত হয়েছো`,
        class: { _id: cls._id, name: cls.name, teacherName: cls.teacher?.name || '' },
      });
    }

    const teacher = await User.findOne({ role: 'teacher', accessCode: code });
    if (!teacher) {
      return res.status(404).json({ message: 'এই এক্সেস কোড দিয়ে কোনো শ্রেণী পাওয়া যায়নি' });
    }
    if (student.connectedTeachers.some((id) => id.toString() === teacher._id.toString())) {
      return res.status(400).json({ message: 'এই কোড আগেই যোগ করা হয়েছে' });
    }
    student.connectedTeachers.push(teacher._id);
    await student.save();
    res.json({ message: `"${teacher.name}" শিক্ষকের সাথে সফলভাবে যুক্ত হয়েছো` });
  } catch (err) {
    res.status(500).json({ message: 'এক্সেস কোড যোগ করতে সমস্যা হয়েছে' });
  }
};

// 9. Student: নিজের যুক্ত করা সব শ্রেণীর তালিকা
exports.getMyClasses = async (req, res) => {
  try {
    const student = await User.findById(req.user.id).populate({
      path: 'connectedClasses',
      select: 'name teacher',
      populate: { path: 'teacher', select: 'name' },
    });
    if (!student) return res.status(404).json({ message: 'একাউন্ট পাওয়া যায়নি' });
    res.json(
      (student.connectedClasses || []).map((c) => ({
        _id: c._id,
        name: c.name,
        teacherName: c.teacher?.name || '',
      }))
    );
  } catch (err) {
    res.status(500).json({ message: 'শ্রেণীর তালিকা লোড করতে সমস্যা হয়েছে' });
  }
};

// 10. Student: যুক্ত করা কোনো শ্রেণী সরিয়ে দেওয়া
exports.disconnectClass = async (req, res) => {
  try {
    const student = await User.findById(req.user.id);
    if (!student) return res.status(404).json({ message: 'একাউন্ট পাওয়া যায়নি' });
    student.connectedClasses = student.connectedClasses.filter(
      (id) => id.toString() !== req.params.classId
    );
    await student.save();
    res.json({ message: 'শ্রেণী সরিয়ে দেওয়া হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'সমস্যা হয়েছে' });
  }
};
