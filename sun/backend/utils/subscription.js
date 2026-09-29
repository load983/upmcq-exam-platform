// ================== utils/subscription.js ==================
// সাবস্ক্রিপশনের সব লজিক এক জায়গায়: স্ট্যাটাস হিসাব, চালু করা, ইত্যাদি
const Subscription = require('../models/Subscription');

const DAY = 24 * 60 * 60 * 1000;

// এই মুহূর্তে চালু (active + মেয়াদের ভেতরে) সাবস্ক্রিপশনের শিক্ষক-আইডির তালিকা (স্টুডেন্ট পাশের ফিল্টারের জন্য)
const getActiveTeacherIds = async () => {
  const now = new Date();
  return Subscription.distinct('teacher', {
    status: 'active',
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  });
};

// শিক্ষকের বর্তমান অবস্থা:
// state = active | suspended | expired | none
const getTeacherStatus = async (teacherId) => {
  const now = new Date();

  const current = await Subscription.findOne({
    teacher: teacherId,
    status: 'active',
    startsAt: { $lte: now },
    expiresAt: { $gt: now },
  }).sort({ expiresAt: -1 });

  if (current) {
    // পরপর কেনা (queue করা) সাবস্ক্রিপশন থাকলে সবচেয়ে শেষের মেয়াদটাই আসল মেয়াদ
    const last = await Subscription.findOne({ teacher: teacherId, status: 'active' }).sort({ expiresAt: -1 });
    const expiresAt = last.expiresAt;
    return {
      isActive: true,
      state: 'active',
      planName: current.planName,
      expiresAt,
      daysLeft: Math.max(0, Math.ceil((expiresAt - now) / DAY)),
      // Unlimit হলে examLimitType='unlimited' থাকে — তখন আগের মতোই কোনো এক্সাম-সীমা প্রযোজ্য হয় না
      examLimitType: current.examLimitType || 'unlimited',
      examLimit: current.examLimit || 0,
    };
  }

  const suspended = await Subscription.findOne({ teacher: teacherId, status: 'suspended' }).sort({ suspendedAt: -1 });
  if (suspended) {
    return { isActive: false, state: 'suspended', planName: suspended.planName, expiresAt: suspended.expiresAt, daysLeft: 0 };
  }

  const lastEver = await Subscription.findOne({ teacher: teacherId, status: 'active' }).sort({ expiresAt: -1 });
  if (lastEver) {
    return { isActive: false, state: 'expired', planName: lastEver.planName, expiresAt: lastEver.expiresAt, daysLeft: 0 };
  }

  return { isActive: false, state: 'none', planName: null, expiresAt: null, daysLeft: 0 };
};

// পেমেন্ট যাচাই হলে বা অ্যাডমিন দিলে সাবস্ক্রিপশন চালু করা।
// আগের মেয়াদ বাকি থাকলে নতুনটা তার শেষ থেকে শুরু হয় (দিন নষ্ট হয় না)
const activateSubscription = async (sub, { reviewedBy } = {}) => {
  const now = new Date();
  const last = await Subscription.findOne({
    teacher: sub.teacher,
    status: 'active',
    expiresAt: { $gt: now },
    _id: { $ne: sub._id },
  }).sort({ expiresAt: -1 });

  const startsAt = last ? last.expiresAt : now;
  sub.status = 'active';
  sub.startsAt = startsAt;
  sub.expiresAt = new Date(startsAt.getTime() + sub.durationDays * DAY);
  if (reviewedBy) {
    sub.reviewedBy = reviewedBy;
    sub.reviewedAt = now;
  }
  await sub.save();
  return sub;
};

// টিচার এখন পর্যন্ত কতগুলো পরীক্ষা তৈরি করেছে vs তার প্ল্যানের সীমা কত (Unlimit হলে limit=null)
const getExamUsage = async (teacherId, status) => {
  const Exam = require('../models/Exam'); // চক্রাকার require এড়াতে এখানে লোড করা হলো
  const used = await Exam.countDocuments({ teacher: teacherId, pending: { $ne: true } });
  const unlimited = !status?.isActive || status.examLimitType !== 'limited';
  return { used, limit: unlimited ? null : status.examLimit, unlimited };
};

module.exports = { DAY, getActiveTeacherIds, getTeacherStatus, activateSubscription, getExamUsage };
