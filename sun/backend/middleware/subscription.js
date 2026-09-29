// ================== middleware/subscription.js ==================
// শিক্ষকের রুটে protect + authorize('teacher') এর পরে বসবে।
// প্রতিবার ডাটাবেস থেকে চেক করা হয় — তাই অ্যাডমিন suspend করলে সাথে সাথে কাজ করে (JWT-তে ভরসা করা হয় না)
const { getTeacherStatus } = require('../utils/subscription');

const messages = {
  none: 'সব ফিচার ব্যবহার করতে একটি সাবস্ক্রিপশন নিতে হবে',
  expired: 'তোমার সাবস্ক্রিপশনের মেয়াদ শেষ হয়ে গেছে, নবায়ন করো',
  suspended: 'তোমার সাবস্ক্রিপশন অ্যাডমিন সাময়িকভাবে স্থগিত করেছেন',
};

const requireSubscription = async (req, res, next) => {
  try {
    const status = await getTeacherStatus(req.user.id);
    if (status.isActive) {
      req.subscription = status;
      return next();
    }
    return res.status(402).json({
      code: 'SUBSCRIPTION_REQUIRED',
      state: status.state,
      message: messages[status.state] || messages.none,
    });
  } catch (err) {
    return res.status(500).json({ message: 'সাবস্ক্রিপশন যাচাই করতে সমস্যা হয়েছে' });
  }
};

module.exports = { requireSubscription };
