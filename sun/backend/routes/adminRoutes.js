// ================== routes/adminRoutes.js ==================
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const ctrl = require('../controllers/adminController');

// প্রতিটি রিকোয়েস্টে যাচাই: টোকেনের ইউজারই যেন .env-এর নির্ধারিত একমাত্র অ্যাডমিন হয়
const onlyOwnerAdmin = async (req, res, next) => {
  try {
    const admin = await User.findById(req.user.id).select('email role');
    const allowed = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    if (!admin || admin.role !== 'admin' || !allowed || admin.email !== allowed) {
      return res.status(403).json({ message: 'এই কাজের জন্য অনুমতি নেই' });
    }
    next();
  } catch (err) {
    res.status(500).json({ message: 'যাচাই করতে সমস্যা হয়েছে' });
  }
};

router.use(protect, authorize('admin'), onlyOwnerAdmin);

router.get('/stats', ctrl.getStats);
router.get('/teachers', ctrl.getTeachers);
router.get('/payments', ctrl.getPayments);
router.post('/payments/:id/approve', ctrl.approvePayment);
router.post('/payments/:id/reject', ctrl.rejectPayment);

router.post('/teachers/:id/grant', ctrl.grant);
router.post('/teachers/:id/extend', ctrl.extend);
router.post('/teachers/:id/suspend', ctrl.suspend);
router.post('/teachers/:id/resume', ctrl.resume);
router.post('/teachers/:id/revoke', ctrl.revoke);

router.get('/plans', ctrl.listPlans);
router.post('/plans', ctrl.createPlan);
router.put('/plans/:id', ctrl.updatePlan);
router.delete('/plans/:id', ctrl.deletePlan);

module.exports = router;
