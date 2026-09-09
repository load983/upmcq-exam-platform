// ================== middleware/auth.js ==================
// JWT verify করে req.user সেট করে দেয়। role-based এক্সেস কন্ট্রোলের জন্য authorize() ও আছে।
const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'লগইন করা আবশ্যক (টোকেন পাওয়া যায়নি)' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'টোকেনের মেয়াদ শেষ অথবা অবৈধ' });
  }
};

// শুধু নির্দিষ্ট role (যেমন 'teacher') এক্সেস দেয়ার জন্য
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'এই কাজের জন্য অনুমতি নেই' });
  }
  next();
};

module.exports = { protect, authorize };
