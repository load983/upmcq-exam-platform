// ================== middleware/examLimit.js ==================
// requireSubscription -এর পরে বসবে (req.subscription ব্যবহার করে)।
// শুধু নতুন Exam তৈরি হয় এমন রুটে (upload / create) বসাতে হবে —
// বিদ্যমান পরীক্ষার settings/প্রশ্ন এডিট করাকে এটি আটকাবে না।
const { getExamUsage } = require('../utils/subscription');

const enforceExamLimit = async (req, res, next) => {
  try {
    const status = req.subscription;

    // Unlimit প্ল্যান হলে (বা examLimitType সেট না থাকলে) আগের আচরণই বহাল থাকে — কোনো বাধা নেই
    if (!status || status.examLimitType !== 'limited') return next();

    const { used, limit } = await getExamUsage(req.user.id, status);
    if (used >= limit) {
      return res.status(403).json({
        code: 'EXAM_LIMIT_REACHED',
        used,
        limit,
        message: `তোমার প্ল্যানে সর্বোচ্চ ${limit}টি পরীক্ষা তৈরি/আপলোড করা যাবে। সীমা শেষ, নতুন পরীক্ষা যোগ করতে প্ল্যান আপগ্রেড করো অথবা পুরনো কোনো পরীক্ষা মুছে ফেলো।`,
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'পরীক্ষার সীমা যাচাই করতে সমস্যা হয়েছে' });
  }
};

module.exports = { enforceExamLimit };
