// ================== controllers/adminController.js ==================
// অ্যাডমিনের দিক: মনিটরিং (স্ট্যাটস, শিক্ষক, পেমেন্ট) ও কন্ট্রোল (approve/reject/extend/suspend/resume/revoke/grant, প্ল্যান)
const User = require('../models/User');
const Plan = require('../models/Plan');
const Subscription = require('../models/Subscription');
const { DAY, getTeacherStatus, activateSubscription } = require('../utils/subscription');

const toDays = (v) => {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) && n > 0 && n <= 3650 ? n : null;
};

// ---------- মনিটরিং ----------
exports.getStats = async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const teachers = await User.find({ role: 'teacher' }).select('_id');
    const teacherIds = teachers.map((t) => t._id);
    const subs = await Subscription.find({ teacher: { $in: teacherIds } }).select('teacher status startsAt expiresAt');

    const byTeacher = new Map();
    subs.forEach((s) => {
      if (!byTeacher.has(String(s.teacher))) byTeacher.set(String(s.teacher), []);
      byTeacher.get(String(s.teacher)).push(s);
    });

    let active = 0, suspended = 0, expired = 0, none = 0, expiringSoon = 0;
    teachers.forEach((t) => {
      const list = byTeacher.get(String(t._id)) || [];
      const cur = list.find((s) => s.status === 'active' && s.startsAt <= now && s.expiresAt > now);
      if (cur) {
        active += 1;
        const end = Math.max(...list.filter((s) => s.status === 'active').map((s) => +s.expiresAt));
        if (end - now <= 7 * DAY) expiringSoon += 1;
      } else if (list.some((s) => s.status === 'suspended')) suspended += 1;
      else if (list.some((s) => s.status === 'active')) expired += 1;
      else none += 1;
    });

    const paidFilter = { method: { $ne: 'admin' }, status: { $in: ['active', 'suspended', 'cancelled'] } };
    const [total, month, pendingPayments] = await Promise.all([
      Subscription.aggregate([{ $match: paidFilter }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
      Subscription.aggregate([
        { $match: { ...paidFilter, reviewedAt: { $gte: monthStart } } },
        { $group: { _id: null, sum: { $sum: '$amount' } } },
      ]),
      Subscription.countDocuments({ status: 'pending', method: 'manual' }),
    ]);

    res.json({
      totalTeachers: teachers.length,
      active, suspended, expired, none, expiringSoon,
      pendingPayments,
      revenueTotal: total[0]?.sum || 0,
      revenueThisMonth: month[0]?.sum || 0, // ম্যানুয়াল approve-এর তারিখ ধরে; গেটওয়ে পেমেন্ট এতে ধরা হয় না
    });
  } catch (err) {
    res.status(500).json({ message: 'স্ট্যাটস আনতে সমস্যা হয়েছে' });
  }
};

exports.getTeachers = async (req, res) => {
  try {
    const { search = '', state = '' } = req.query;
    const filter = { role: 'teacher' };
    if (search.trim()) {
      const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }];
    }
    const teachers = await User.find(filter).select('name email createdAt').sort({ createdAt: -1 }).limit(300);
    const rows = await Promise.all(
      teachers.map(async (t) => ({
        _id: t._id,
        name: t.name,
        email: t.email,
        joinedAt: t.createdAt,
        subscription: await getTeacherStatus(t._id),
      }))
    );
    res.json({ teachers: state ? rows.filter((r) => r.subscription.state === state) : rows });
  } catch (err) {
    res.status(500).json({ message: 'শিক্ষকদের তালিকা আনতে সমস্যা হয়েছে' });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const payments = await Subscription.find(filter)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .limit(300);
    res.json({ payments });
  } catch (err) {
    res.status(500).json({ message: 'পেমেন্টের তালিকা আনতে সমস্যা হয়েছে' });
  }
};

// ---------- পেমেন্ট approve / reject ----------
exports.approvePayment = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'পেমেন্ট পাওয়া যায়নি' });
    if (sub.status !== 'pending') return res.status(400).json({ message: 'এটি এখন আর যাচাইয়ের অপেক্ষায় নেই' });
    await activateSubscription(sub, { reviewedBy: req.user.id });
    res.json({ message: 'পেমেন্ট approve হয়েছে, সাবস্ক্রিপশন চালু', subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'approve করতে সমস্যা হয়েছে' });
  }
};

exports.rejectPayment = async (req, res) => {
  try {
    const sub = await Subscription.findById(req.params.id);
    if (!sub) return res.status(404).json({ message: 'পেমেন্ট পাওয়া যায়নি' });
    if (sub.status !== 'pending') return res.status(400).json({ message: 'এটি এখন আর যাচাইয়ের অপেক্ষায় নেই' });
    sub.status = 'rejected';
    sub.rejectReason = String(req.body.reason || '').trim();
    sub.reviewedBy = req.user.id;
    sub.reviewedAt = new Date();
    await sub.save();
    res.json({ message: 'পেমেন্ট reject করা হয়েছে', subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'reject করতে সমস্যা হয়েছে' });
  }
};

// ---------- শিক্ষকের সাবস্ক্রিপশন কন্ট্রোল ----------
const findTeacher = async (id) => User.findOne({ _id: id, role: 'teacher' });

// অ্যাডমিন নিজে থেকে দেওয়া (ফ্রি/বোনাস/অফলাইন পেমেন্ট): planId অথবা days
exports.grant = async (req, res) => {
  try {
    const teacher = await findTeacher(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'শিক্ষক পাওয়া যায়নি' });

    let planName = 'অ্যাডমিন প্রদত্ত', durationDays = toDays(req.body.days), plan = null;
    if (req.body.planId) {
      plan = await Plan.findById(req.body.planId);
      if (!plan) return res.status(404).json({ message: 'প্ল্যান পাওয়া যায়নি' });
      planName = plan.name;
      durationDays = plan.durationDays;
    }
    if (!durationDays) return res.status(400).json({ message: 'প্ল্যান অথবা সঠিক দিন সংখ্যা দাও' });

    const sub = await Subscription.create({
      teacher: teacher._id,
      plan: plan?._id,
      planName,
      durationDays,
      amount: 0,
      method: 'admin',
      status: 'pending',
      note: String(req.body.note || '').trim(),
    });
    await activateSubscription(sub, { reviewedBy: req.user.id });
    res.status(201).json({ message: 'সাবস্ক্রিপশন দেওয়া হয়েছে', subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'সাবস্ক্রিপশন দিতে সমস্যা হয়েছে' });
  }
};

// চলমান মেয়াদে দিন যোগ করা
exports.extend = async (req, res) => {
  try {
    const days = toDays(req.body.days);
    if (!days) return res.status(400).json({ message: 'সঠিক দিন সংখ্যা দাও' });
    const teacher = await findTeacher(req.params.id);
    if (!teacher) return res.status(404).json({ message: 'শিক্ষক পাওয়া যায়নি' });

    const last = await Subscription.findOne({ teacher: teacher._id, status: 'active' }).sort({ expiresAt: -1 });
    if (last && last.expiresAt > new Date()) {
      last.expiresAt = new Date(last.expiresAt.getTime() + days * DAY);
      last.note = `${last.note ? last.note + ' | ' : ''}অ্যাডমিন +${days} দিন`;
      await last.save();
      return res.json({ message: `মেয়াদ ${days} দিন বাড়ানো হয়েছে`, subscription: last });
    }
    // চলমান মেয়াদ না থাকলে (শেষ হয়ে গেছে) আজ থেকে নতুন করে দেওয়া হবে
    req.body.days = days;
    return exports.grant(req, res);
  } catch (err) {
    res.status(500).json({ message: 'মেয়াদ বাড়াতে সমস্যা হয়েছে' });
  }
};

// সাময়িক স্থগিত — বাকি মেয়াদ জমা থাকে, resume করলে ঠিক ততদিনই ফেরত পাবে
exports.suspend = async (req, res) => {
  try {
    const now = new Date();
    const r = await Subscription.updateMany(
      { teacher: req.params.id, status: 'active', expiresAt: { $gt: now } },
      { status: 'suspended', suspendedAt: now }
    );
    if (!r.modifiedCount) return res.status(400).json({ message: 'স্থগিত করার মতো চালু সাবস্ক্রিপশন নেই' });
    res.json({ message: 'সাবস্ক্রিপশন স্থগিত করা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'স্থগিত করতে সমস্যা হয়েছে' });
  }
};

exports.resume = async (req, res) => {
  try {
    const now = new Date();
    const list = await Subscription.find({ teacher: req.params.id, status: 'suspended' });
    if (!list.length) return res.status(400).json({ message: 'কোনো স্থগিত সাবস্ক্রিপশন নেই' });
    for (const s of list) {
      const shift = now - (s.suspendedAt || now); // যতক্ষণ স্থগিত ছিল ততটা মেয়াদ পিছিয়ে দেওয়া
      if (s.startsAt > s.suspendedAt) s.startsAt = new Date(s.startsAt.getTime() + shift);
      s.expiresAt = new Date(s.expiresAt.getTime() + shift);
      s.status = 'active';
      s.suspendedAt = undefined;
      await s.save();
    }
    res.json({ message: 'সাবস্ক্রিপশন আবার চালু করা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'চালু করতে সমস্যা হয়েছে' });
  }
};

// স্থায়ীভাবে বাতিল (বাকি মেয়াদ শেষ)
exports.revoke = async (req, res) => {
  try {
    const now = new Date();
    const r = await Subscription.updateMany(
      { teacher: req.params.id, status: { $in: ['active', 'suspended'] }, expiresAt: { $gt: now } },
      { status: 'cancelled', expiresAt: now }
    );
    if (!r.modifiedCount) return res.status(400).json({ message: 'বাতিল করার মতো সাবস্ক্রিপশন নেই' });
    res.json({ message: 'সাবস্ক্রিপশন বাতিল করা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'বাতিল করতে সমস্যা হয়েছে' });
  }
};

// ---------- প্ল্যান ম্যানেজমেন্ট ----------
exports.listPlans = async (req, res) => {
  const plans = await Plan.find().sort({ price: 1 });
  res.json({ plans });
};

exports.createPlan = async (req, res) => {
  try {
    const { name, price, durationDays, description } = req.body;
    if (!String(name || '').trim()) return res.status(400).json({ message: 'প্ল্যানের নাম দাও' });
    if (!(Number(price) >= 0)) return res.status(400).json({ message: 'সঠিক দাম দাও' });
    if (!toDays(durationDays)) return res.status(400).json({ message: 'সঠিক মেয়াদ (দিন) দাও' });
    const plan = await Plan.create({ name: name.trim(), price: Number(price), durationDays: toDays(durationDays), description });
    res.status(201).json({ plan });
  } catch (err) {
    res.status(500).json({ message: 'প্ল্যান তৈরি করতে সমস্যা হয়েছে' });
  }
};

exports.updatePlan = async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'প্ল্যান পাওয়া যায়নি' });
    const { name, price, durationDays, description, isActive } = req.body;
    if (name !== undefined) plan.name = String(name).trim();
    if (price !== undefined && Number(price) >= 0) plan.price = Number(price);
    if (durationDays !== undefined && toDays(durationDays)) plan.durationDays = toDays(durationDays);
    if (description !== undefined) plan.description = description;
    if (isActive !== undefined) plan.isActive = !!isActive;
    await plan.save();
    res.json({ plan }); // পুরনো সাবস্ক্রিপশনে স্ন্যাপশট থাকায় সেগুলো বদলায় না
  } catch (err) {
    res.status(500).json({ message: 'প্ল্যান আপডেট করতে সমস্যা হয়েছে' });
  }
};

exports.deletePlan = async (req, res) => {
  try {
    const used = await Subscription.exists({ plan: req.params.id });
    if (used) {
      await Plan.updateOne({ _id: req.params.id }, { isActive: false });
      return res.json({ message: 'প্ল্যানটি ব্যবহৃত হয়েছে, তাই মুছে না ফেলে নিষ্ক্রিয় করা হয়েছে' });
    }
    await Plan.deleteOne({ _id: req.params.id });
    res.json({ message: 'প্ল্যান মুছে ফেলা হয়েছে' });
  } catch (err) {
    res.status(500).json({ message: 'প্ল্যান মুছতে সমস্যা হয়েছে' });
  }
};
