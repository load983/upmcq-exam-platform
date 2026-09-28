// ================== controllers/classController.js ==================
const crypto = require('crypto');
const Class = require('../models/Class');
const Exam = require('../models/Exam');
const User = require('../models/User');

// প্রিসেট শ্রেণী: ১–১২, Admission, BCS
const PRESET_CLASSES = [
  ...Array.from({ length: 12 }, (_, i) => String(i + 1)),
  'Admission',
  'BCS',
];

// শ্রেণীর এক্সেস কোড শিক্ষকের পুরনো কোড ও অন্য শ্রেণীর কোডের সাথে মিলবে না
const generateUniqueClassCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    exists =
      (await Class.exists({ accessCode: code })) || (await User.exists({ accessCode: code }));
  }
  return code;
};

// GET /api/classes — নিজের শ্রেণীগুলো (পরীক্ষার সংখ্যাসহ) + প্রিসেট তালিকা
exports.getMyClasses = async (req, res) => {
  try {
    const classes = await Class.find({ teacher: req.user.id }).sort({ createdAt: 1 }).lean();
    const counts = await Exam.aggregate([
      { $match: { teacher: new (require('mongoose').Types.ObjectId)(req.user.id), classRefs: { $exists: true, $ne: [] } } },
      { $unwind: '$classRefs' },
      { $group: { _id: '$classRefs', n: { $sum: 1 } } },
    ]);
    const countMap = {};
    counts.forEach((c) => (countMap[c._id.toString()] = c.n));
    res.json({
      presets: PRESET_CLASSES,
      classes: classes.map((c) => ({ ...c, examCount: countMap[c._id.toString()] || 0 })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/classes { name } — প্রিসেট নির্বাচন অথবা কাস্টম নাম; নতুন এক্সেস কোড তৈরি হয়
exports.createClass = async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) return res.status(400).json({ message: 'শ্রেণীর নাম আবশ্যক' });
    if (name.length > 40) return res.status(400).json({ message: 'শ্রেণীর নাম ৪০ অক্ষরের বেশি হতে পারবে না' });

    const preset = PRESET_CLASSES.find((p) => p.toLowerCase() === name.toLowerCase());
    const finalName = preset || name;

    const existing = await Class.findOne({ teacher: req.user.id, name: finalName });
    if (existing) return res.status(400).json({ message: 'এই শ্রেণী আগেই তৈরি করা আছে' });

    const cls = await Class.create({
      teacher: req.user.id,
      name: finalName,
      kind: preset ? 'preset' : 'custom',
      accessCode: await generateUniqueClassCode(),
    });
    res.status(201).json({ ...cls.toObject(), examCount: 0 });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/classes/:id — শুধু যদি এই শ্রেণীতে কোনো পরীক্ষা না থাকে
exports.deleteClass = async (req, res) => {
  try {
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'শ্রেণী পাওয়া যায়নি' });
    if (cls.teacher.toString() !== req.user.id) return res.status(403).json({ message: 'অনুমতি নেই' });

    const examCount = await Exam.countDocuments({ classRefs: cls._id });
    if (examCount > 0) {
      return res.status(400).json({ message: 'এই শ্রেণীতে পরীক্ষা আছে, আগে পরীক্ষাগুলো সরাও বা ডিলিট করো' });
    }
    await User.updateMany({ connectedClasses: cls._id }, { $pull: { connectedClasses: cls._id } });
    await cls.deleteOne();
    res.json({ message: 'শ্রেণী ডিলিট হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
