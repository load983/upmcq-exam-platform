// ================== controllers/adminUserController.js ==================
// অ্যাডমিনের "ইউজার্স" ম্যানেজমেন্ট: শিক্ষক ও শিক্ষার্থীর তালিকা/বিস্তারিত, এডিট, পাসওয়ার্ড রিসেট,
// এবং কোন শিক্ষার্থী কোন শিক্ষকের (শ্রেণীর) সাথে যুক্ত সেটা ম্যানেজ করা।
// 🔒 পাসওয়ার্ড bcrypt দিয়ে হ্যাশ করা থাকে — আগেরটা দেখা সম্ভব নয়। তাই অ্যাডমিন নতুন পাসওয়ার্ড সেট করতে পারে।
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Class = require('../models/Class');

const esc = (s) => String(s).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const isId = (v) => /^[a-f\d]{24}$/i.test(String(v || ''));

// ---------- তালিকা ----------
// GET /admin/users?role=teacher|student&search=
exports.listUsers = async (req, res) => {
  try {
    const role = req.query.role === 'student' ? 'student' : 'teacher';
    const filter = { role };
    const search = String(req.query.search || '').trim();
    if (search) {
      const rx = new RegExp(esc(search), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { phone: rx }, { roll: rx }];
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 }).lean();

    if (role === 'teacher') {
      const teacherIds = users.map((u) => u._id);
      const classes = await Class.find({ teacher: { $in: teacherIds } }).select('teacher name accessCode').lean();
      const classIds = classes.map((c) => c._id);

      const [byClass, legacy] = await Promise.all([
        User.aggregate([
          { $match: { role: 'student', connectedClasses: { $in: classIds } } },
          { $unwind: '$connectedClasses' },
          { $match: { connectedClasses: { $in: classIds } } },
          { $group: { _id: '$connectedClasses', n: { $sum: 1 } } },
        ]),
        User.find({ role: 'student', connectedTeachers: { $in: teacherIds } }).select('_id connectedTeachers connectedClasses').lean(),
      ]);
      const countMap = new Map(byClass.map((r) => [String(r._id), r.n]));

      // শিক্ষকভিত্তিক ইউনিক শিক্ষার্থী গণনা (শ্রেণী + legacy কোড মিলিয়ে)
      const classOwner = new Map(classes.map((c) => [String(c._id), String(c.teacher)]));
      const studentsOfTeacher = new Map();
      const add = (tid, sid) => {
        if (!studentsOfTeacher.has(tid)) studentsOfTeacher.set(tid, new Set());
        studentsOfTeacher.get(tid).add(String(sid));
      };
      const classStudents = await User.find({ role: 'student', connectedClasses: { $in: classIds } }).select('_id connectedClasses').lean();
      classStudents.forEach((s) => (s.connectedClasses || []).forEach((cid) => { const o = classOwner.get(String(cid)); if (o) add(o, s._id); }));
      legacy.forEach((s) => (s.connectedTeachers || []).forEach((tid) => add(String(tid), s._id)));

      return res.json({
        users: users.map((u) => ({
          ...u,
          hasPassword: true,
          studentCount: studentsOfTeacher.get(String(u._id))?.size || 0,
          classes: classes
            .filter((c) => String(c.teacher) === String(u._id))
            .map((c) => ({ _id: c._id, name: c.name, accessCode: c.accessCode, studentCount: countMap.get(String(c._id)) || 0 })),
        })),
      });
    }

    // শিক্ষার্থী: যুক্ত শ্রেণী (শিক্ষকের নামসহ) ও legacy শিক্ষক
    const classIds = [...new Set(users.flatMap((u) => (u.connectedClasses || []).map(String)))];
    const teacherIdsAll = [...new Set(users.flatMap((u) => (u.connectedTeachers || []).map(String)))];
    const classes = await Class.find({ _id: { $in: classIds } }).populate('teacher', 'name email').lean();
    const classMap = new Map(classes.map((c) => [String(c._id), c]));
    const legacyTeachers = await User.find({ _id: { $in: teacherIdsAll } }).select('name email').lean();
    const legacyMap = new Map(legacyTeachers.map((t) => [String(t._id), t]));

    res.json({
      users: users.map((u) => ({
        ...u,
        hasPassword: !!u.password,
        classes: (u.connectedClasses || [])
          .map((id) => classMap.get(String(id)))
          .filter(Boolean)
          .map((c) => ({ _id: c._id, name: c.name, teacher: c.teacher ? { _id: c.teacher._id, name: c.teacher.name } : null })),
        legacyTeachers: (u.connectedTeachers || []).map((id) => legacyMap.get(String(id))).filter(Boolean),
        bannedCount: (u.bannedByTeachers || []).length,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'ইউজার তালিকা লোড করতে সমস্যা হয়েছে' });
  }
};

// ---------- শিক্ষকের বিস্তারিত: তার শিক্ষার্থীরা ----------
// GET /admin/users/:id/students
exports.teacherStudents = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'ভুল আইডি' });
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' }).select('_id');
    if (!teacher) return res.status(404).json({ message: 'শিক্ষক পাওয়া যায়নি' });

    const classes = await Class.find({ teacher: teacher._id }).select('name').lean();
    const nameMap = new Map(classes.map((c) => [String(c._id), c.name]));
    const students = await User.find({
      role: 'student',
      $or: [{ connectedClasses: { $in: classes.map((c) => c._id) } }, { connectedTeachers: teacher._id }],
    }).select('-password').sort({ createdAt: -1 }).lean();

    res.json({
      students: students.map((s) => ({
        _id: s._id, name: s.name, roll: s.roll, phone: s.phone,
        classes: (s.connectedClasses || []).filter((id) => nameMap.has(String(id))).map((id) => ({ _id: id, name: nameMap.get(String(id)) })),
        legacy: (s.connectedTeachers || []).some((id) => String(id) === String(teacher._id)),
        banned: (s.bannedByTeachers || []).some((id) => String(id) === String(teacher._id)),
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'শিক্ষার্থী তালিকা লোড করতে সমস্যা হয়েছে' });
  }
};

// অ্যাসাইন করার ড্রপডাউনের জন্য: সব শিক্ষক ও তাদের শ্রেণী
// GET /admin/users/classes
exports.allClasses = async (req, res) => {
  try {
    const classes = await Class.find().populate('teacher', 'name').sort({ name: 1 }).lean();
    res.json({ classes: classes.filter((c) => c.teacher).map((c) => ({ _id: c._id, name: c.name, teacher: { _id: c.teacher._id, name: c.teacher.name } })) });
  } catch (err) {
    res.status(500).json({ message: 'শ্রেণী তালিকা লোড করতে সমস্যা হয়েছে' });
  }
};

// ---------- এডিট ----------
// PUT /admin/users/:id   { name, email?, phone?, roll? }
exports.updateUser = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'ভুল আইডি' });
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ message: 'ইউজার পাওয়া যায়নি' });

    const { name, email, phone, roll } = req.body;

    if (name !== undefined) {
      if (!String(name).trim()) return res.status(400).json({ message: 'নাম খালি রাখা যাবে না' });
      user.name = String(name).trim();
    }

    if (user.role === 'teacher' && email !== undefined) {
      const e = String(email).trim().toLowerCase();
      if (!e) return res.status(400).json({ message: 'ইমেইল খালি রাখা যাবে না' });
      if (e !== user.email) {
        if (await User.findOne({ email: e, _id: { $ne: user._id } })) return res.status(400).json({ message: 'এই ইমেইল আগে থেকেই ব্যবহৃত হচ্ছে' });
        user.email = e;
      }
    }

    if (user.role === 'student') {
      if (phone !== undefined) {
        const p = String(phone).trim();
        if (!p) return res.status(400).json({ message: 'ফোন নম্বর খালি রাখা যাবে না' });
        if (p !== user.phone) {
          if (await User.findOne({ phone: p, _id: { $ne: user._id } })) return res.status(400).json({ message: 'এই ফোন নম্বর আগে থেকেই ব্যবহৃত হচ্ছে' });
          user.phone = p;
        }
      }
      if (roll !== undefined) user.roll = String(roll).trim();
    }

    await user.save();
    res.json({ message: 'তথ্য আপডেট হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'আপডেট করতে সমস্যা হয়েছে' });
  }
};

// ---------- পাসওয়ার্ড ----------
// POST /admin/users/:id/password   { password? }  — না দিলে র‍্যান্ডম পাসওয়ার্ড তৈরি হয়ে একবার ফেরত আসে
exports.setPassword = async (req, res) => {
  try {
    if (!isId(req.params.id)) return res.status(400).json({ message: 'ভুল আইডি' });
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') return res.status(404).json({ message: 'ইউজার পাওয়া যায়নি' });

    let password = String(req.body.password || '');
    const generated = !password;
    if (generated) password = crypto.randomBytes(6).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);
    if (password.length < 6) return res.status(400).json({ message: 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();
    res.json({ message: 'পাসওয়ার্ড পরিবর্তন হয়েছে', password });
  } catch (err) {
    res.status(500).json({ message: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে' });
  }
};

// ---------- শিক্ষক ↔ শিক্ষার্থী সংযোগ ----------
// POST /admin/users/:id/classes   { classId }   — শিক্ষার্থীকে শিক্ষকের একটি শ্রেণীতে যুক্ত করা
exports.addToClass = async (req, res) => {
  try {
    const { classId } = req.body;
    if (!isId(req.params.id) || !isId(classId)) return res.status(400).json({ message: 'ভুল আইডি' });
    const [student, cls] = await Promise.all([
      User.findOne({ _id: req.params.id, role: 'student' }),
      Class.findById(classId),
    ]);
    if (!student) return res.status(404).json({ message: 'শিক্ষার্থী পাওয়া যায়নি' });
    if (!cls) return res.status(404).json({ message: 'শ্রেণী পাওয়া যায়নি' });
    if (student.connectedClasses.some((id) => String(id) === String(cls._id))) {
      return res.status(400).json({ message: 'শিক্ষার্থী আগে থেকেই এই শ্রেণীতে আছে' });
    }
    student.connectedClasses.push(cls._id);
    await student.save();
    res.json({ message: 'শ্রেণীতে যুক্ত করা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'যুক্ত করতে সমস্যা হয়েছে' });
  }
};

// DELETE /admin/users/:id/classes/:classId
exports.removeFromClass = async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.params.classId)) return res.status(400).json({ message: 'ভুল আইডি' });
    await User.updateOne({ _id: req.params.id, role: 'student' }, { $pull: { connectedClasses: req.params.classId } });
    res.json({ message: 'শ্রেণী থেকে সরানো হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'সরাতে সমস্যা হয়েছে' });
  }
};

// DELETE /admin/users/:id/teachers/:teacherId  — পুরনো (legacy) শিক্ষক-লেভেল সংযোগ সরানো
exports.removeLegacyTeacher = async (req, res) => {
  try {
    if (!isId(req.params.id) || !isId(req.params.teacherId)) return res.status(400).json({ message: 'ভুল আইডি' });
    await User.updateOne({ _id: req.params.id, role: 'student' }, { $pull: { connectedTeachers: req.params.teacherId } });
    res.json({ message: 'শিক্ষকের সাথে সংযোগ সরানো হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'সরাতে সমস্যা হয়েছে' });
  }
};
