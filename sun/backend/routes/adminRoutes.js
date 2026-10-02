// ================== routes/adminRoutes.js ==================
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const ctrl = require('../controllers/adminController');
const support = require('../controllers/supportController');
const trial = require('../controllers/trialController');
const users = require('../controllers/adminUserController');
const site = require('../controllers/siteController');

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
router.get('/teachers/export', ctrl.exportTeachersExcel);
router.get('/payments', ctrl.getPayments);
router.get('/payments/export', ctrl.exportPaymentsExcel);
router.post('/payments/:id/approve', ctrl.approvePayment);
router.post('/payments/:id/reject', ctrl.rejectPayment);

router.post('/teachers/:id/grant', ctrl.grant);
router.post('/teachers/:id/extend', ctrl.extend);
router.post('/teachers/:id/suspend', ctrl.suspend);
router.post('/teachers/:id/resume', ctrl.resume);
router.post('/teachers/:id/revoke', ctrl.revoke);

// ইউজার্স ম্যানেজমেন্ট (শিক্ষক ও শিক্ষার্থী)
router.get('/users', users.listUsers);
router.get('/users/classes', users.allClasses);
router.get('/users/:id/students', users.teacherStudents);
router.put('/users/:id', users.updateUser);
router.post('/users/:id/password', users.setPassword);
router.post('/users/:id/classes', users.addToClass);
router.delete('/users/:id/classes/:classId', users.removeFromClass);
router.delete('/users/:id/teachers/:teacherId', users.removeLegacyTeacher);

router.get('/plans', ctrl.listPlans);
router.post('/plans', ctrl.createPlan);
router.put('/plans/:id', ctrl.updatePlan);
router.delete('/plans/:id', ctrl.deletePlan);

router.get('/promos', ctrl.listPromos);
router.post('/promos', ctrl.createPromo);
router.put('/promos/:id', ctrl.updatePromo);
router.delete('/promos/:id', ctrl.deletePromo);

// Test Web: নতুন শিক্ষকের অটো ফ্রি ট্রায়াল (মেয়াদ + ফিচার)
router.get('/trial', trial.getTrialSettings);
router.put('/trial', trial.saveTrialSettings);

// হেল্পলাইন: যোগাযোগের তথ্য ও ইউজারদের চ্যাট ইনবক্স
router.get('/support/settings', support.adminGetSettings);
router.put('/support/settings', support.adminSaveSettings);
router.get('/support/unread', support.adminUnreadCount);
router.get('/support/threads', support.adminListThreads);
router.get('/support/threads/:id/messages', support.adminGetMessages);
router.post('/support/threads/:id/reply', support.adminReply);
router.delete('/support/threads/:id', support.adminDeleteThread);

// ওয়েবসাইট কাস্টমাইজ: লোগো, সাইটের নাম, যেকোনো লেখা, ফুটার লিংক ও পেজ
router.get('/site', site.adminGet);
router.post('/site/logo', (req, res, next) => site.logoUpload(req, res, (err) => (err ? res.status(400).json({ message: err.code === 'LIMIT_FILE_SIZE' ? 'লোগো সর্বোচ্চ ১ MB হতে পারবে' : err.message }) : next())), site.adminUploadLogo);
router.delete('/site/logo', site.adminDeleteLogo);
router.put('/site/texts', site.adminSaveTexts);
router.put('/site/footer', site.adminSaveFooter);

module.exports = router;
