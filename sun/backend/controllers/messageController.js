// ================== controllers/messageController.js ==================
// শিক্ষক → স্টুডেন্ট মেসেজ (লেখা + ছবি) ও নতুন পরীক্ষার নোটিফিকেশন।
// স্টুডেন্ট ওয়েবসাইটে দেখে + ডিভাইসের নোটিফিকেশন bar-এ পুশ পায়। শিক্ষক এডিট/ডিলিট করতে পারে।
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Announcement = require('../models/Announcement');
const Class = require('../models/Class');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');
const { getActiveTeacherIds } = require('../utils/subscription');
const push = require('../utils/push');

const uploadDir = path.join(__dirname, '..', 'uploads');

const removeImageFile = (imagePath) => {
  if (!imagePath) return;
  const file = path.join(uploadDir, path.basename(imagePath));
  fs.unlink(file, () => {});
};

const serverBase = (req) => (process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');

const parseIds = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const p = JSON.parse(raw);
      if (Array.isArray(p)) return p;
    } catch (e) { /* কমা দিয়ে আলাদা */ }
    return raw.split(',').map((x) => x.trim()).filter(Boolean);
  }
  return [];
};

// এই শ্রেণীগুলোর (বা পুরনো শিক্ষক-কোডে যুক্ত) স্টুডেন্টদের আইডি — ব্যান করা স্টুডেন্ট বাদ
const audienceIds = async (teacherId, classRefs) => {
  const or = [{ connectedClasses: { $in: classRefs } }];
  if (!classRefs || classRefs.length === 0) or.push({ connectedTeachers: teacherId });
  const students = await User.find({
    role: 'student',
    bannedByTeachers: { $ne: teacherId },
    $or: or,
  }).select('_id').lean();
  return students.map((s) => s._id);
};

// ডিভাইসে পুশ পাঠানো (ব্যর্থ হলেও মূল কাজ আটকায় না)
const pushAnnouncement = async (ann, teacherName, extra = {}) => {
  try {
    const ids = await audienceIds(ann.teacher, ann.classRefs);
    const isExam = ann.kind === 'exam';
    await push.sendToUsers(ids, {
      title: isExam ? `📝 ${teacherName}` : `💬 ${teacherName}`,
      body: (ann.text || (ann.imagePath ? '📷 ছবি' : '')).slice(0, 180),
      image: extra.imageUrl || undefined,
      url: '/notifications',
      tag: `ann-${ann._id}`, // একই tag হলে পুরনো নোটিফিকেশন বদলে যায় (এডিটের সময় কাজে লাগে)
    });
  } catch (e) {
    console.error('push failed:', e.message);
  }
};

const shape = (a, base = '') => ({
  _id: a._id,
  kind: a.kind,
  text: a.text,
  imageUrl: a.imagePath ? `${base}${a.imagePath}` : null,
  classNames: (a.classRefs || []).map((c) => c.name).filter(Boolean),
  classIds: (a.classRefs || []).map((c) => c._id || c),
  teacherName: a.teacher?.name || undefined,
  examCode: a.exam?.examCode || undefined,
  examStatus: a.exam?.status || undefined,
  createdAt: a.createdAt,
  editedAt: a.editedAt || null,
});

// ---------- পরীক্ষা পাবলিশ হলে অটো নোটিফিকেশন (examController থেকে ডাকা হয়) ----------
exports.announceExamPublished = async (exam, teacherId) => {
  if (!exam.classRefs || exam.classRefs.length === 0) return;
  const teacher = await User.findById(teacherId).select('name').lean();
  const ann = await Announcement.create({
    teacher: teacherId,
    classRefs: exam.classRefs,
    kind: 'exam',
    exam: exam._id,
    text: `নতুন পরীক্ষা: ${exam.title}`,
  });
  await pushAnnouncement(ann, teacher?.name || 'শিক্ষক');
};

// ==================== শিক্ষক ====================
exports.createMessage = async (req, res) => {
  try {
    const text = String(req.body.text || '').trim().slice(0, 2000);
    if (!text && !req.file) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(400).json({ message: 'মেসেজ লিখুন অথবা একটি ছবি দিন' });
    }

    const ids = [...new Set(parseIds(req.body.classIds).map(String))];
    const valid = ids.length > 0 && ids.every((id) => mongoose.Types.ObjectId.isValid(id));
    const classes = valid ? await Class.find({ _id: { $in: ids }, teacher: req.user.id }).select('_id') : [];
    if (!valid || classes.length !== ids.length) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(400).json({ message: 'কমপক্ষে একটি সঠিক শ্রেণী নির্বাচন করুন' });
    }

    const ann = await Announcement.create({
      teacher: req.user.id,
      classRefs: classes.map((c) => c._id),
      kind: 'message',
      text,
      imagePath: req.file ? `/uploads/${req.file.filename}` : undefined,
    });

    const teacher = await User.findById(req.user.id).select('name').lean();
    pushAnnouncement(ann, teacher?.name || 'শিক্ষক', { imageUrl: ann.imagePath ? `${serverBase(req)}${ann.imagePath}` : null });

    const full = await Announcement.findById(ann._id).populate('classRefs', 'name');
    res.status(201).json({ message: 'মেসেজ পাঠানো হয়েছে', item: shape(full) });
  } catch (err) {
    if (req.file) removeImageFile(req.file.filename);
    res.status(500).json({ message: err.message || 'মেসেজ পাঠাতে সমস্যা হয়েছে' });
  }
};

exports.getMyMessages = async (req, res) => {
  try {
    const list = await Announcement.find({ teacher: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('classRefs', 'name')
      .populate('exam', 'examCode status');
    res.json({ items: list.map((a) => shape(a)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// এডিট: লেখা বদলানো, ছবি বদলানো/সরানো। renotify=true হলে ডিভাইসে আবার পুশ (আগেরটা বদলে যায়)
exports.updateMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const ann = mongoose.Types.ObjectId.isValid(id) ? await Announcement.findOne({ _id: id, teacher: req.user.id }) : null;
    if (!ann) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(404).json({ message: 'মেসেজ পাওয়া যায়নি' });
    }

    if (req.body.text !== undefined) ann.text = String(req.body.text).trim().slice(0, 2000);

    const oldImage = ann.imagePath;
    if (req.file) {
      ann.imagePath = `/uploads/${req.file.filename}`;
    } else if (String(req.body.removeImage) === 'true') {
      ann.imagePath = undefined;
    }

    if (!ann.text && !ann.imagePath) {
      if (req.file) removeImageFile(req.file.filename);
      return res.status(400).json({ message: 'মেসেজ খালি রাখা যাবে না' });
    }

    ann.editedAt = new Date();
    await ann.save();
    if (oldImage && oldImage !== ann.imagePath) removeImageFile(oldImage);

    if (String(req.body.renotify) === 'true') {
      const teacher = await User.findById(req.user.id).select('name').lean();
      pushAnnouncement(ann, teacher?.name || 'শিক্ষক', { imageUrl: ann.imagePath ? `${serverBase(req)}${ann.imagePath}` : null });
    }

    const full = await Announcement.findById(ann._id).populate('classRefs', 'name').populate('exam', 'examCode status');
    res.json({ message: 'মেসেজ আপডেট হয়েছে', item: shape(full) });
  } catch (err) {
    if (req.file) removeImageFile(req.file.filename);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const ann = mongoose.Types.ObjectId.isValid(id) ? await Announcement.findOne({ _id: id, teacher: req.user.id }) : null;
    if (!ann) return res.status(404).json({ message: 'মেসেজ পাওয়া যায়নি' });
    removeImageFile(ann.imagePath);
    await ann.deleteOne();
    res.json({ message: 'মেসেজ মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== স্টুডেন্ট ====================
// এই স্টুডেন্ট যেসব মেসেজ দেখতে পাবে তার ফিল্টার (যুক্ত শ্রেণী, ব্যান ও মেয়াদ-শেষ শিক্ষক বাদ)
const visibleFilter = async (student) => {
  const activeTeacherIds = await getActiveTeacherIds();
  return {
    teacher: { $nin: student.bannedByTeachers || [], $in: activeTeacherIds },
    $or: [
      { classRefs: { $in: student.connectedClasses || [] } },
      {
        $or: [{ classRefs: { $exists: false } }, { classRefs: { $size: 0 } }],
        teacher: { $in: student.connectedTeachers || [] },
      },
    ],
  };
};

const loadStudent = (id) =>
  User.findById(id).select('connectedClasses connectedTeachers bannedByTeachers messagesSeenAt createdAt');

exports.getFeed = async (req, res) => {
  try {
    const student = await loadStudent(req.user.id);
    if (!student) return res.status(404).json({ message: 'ইউজার পাওয়া যায়নি' });
    const filter = await visibleFilter(student);
    const list = await Announcement.find(filter)
      .sort({ createdAt: -1 })
      .limit(60)
      .populate('teacher', 'name')
      .populate('classRefs', 'name')
      .populate('exam', 'examCode status');

    const seenAt = student.messagesSeenAt || student.createdAt;
    const base = serverBase(req);
    res.json({
      seenAt,
      items: list.map((a) => ({ ...shape(a, base), isNew: a.createdAt > seenAt })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const student = await loadStudent(req.user.id);
    if (!student) return res.json({ count: 0 });
    const filter = await visibleFilter(student);
    const count = await Announcement.countDocuments({
      ...filter,
      createdAt: { $gt: student.messagesSeenAt || student.createdAt },
    });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markSeen = async (req, res) => {
  try {
    await User.updateOne({ _id: req.user.id }, { messagesSeenAt: new Date() });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------- ডিভাইস পুশ সাবস্ক্রিপশন ----------
exports.getPushKey = (req, res) => res.json({ enabled: push.enabled, publicKey: push.getPublicKey() });

exports.subscribePush = async (req, res) => {
  try {
    const sub = req.body?.subscription;
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ message: 'অবৈধ সাবস্ক্রিপশন' });
    }
    await PushSubscription.findOneAndUpdate(
      { endpoint: sub.endpoint },
      { user: req.user.id, endpoint: sub.endpoint, keys: { p256dh: sub.keys.p256dh, auth: sub.keys.auth } },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.unsubscribePush = async (req, res) => {
  try {
    if (req.body?.endpoint) await PushSubscription.deleteOne({ endpoint: req.body.endpoint, user: req.user.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
