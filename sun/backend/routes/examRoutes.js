const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');
const { enforceExamLimit } = require('../middleware/examLimit');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/examController');

// ==========================================
// ১. পাবলিক রুটস (No Auth Required)
// ==========================================
// নির্দিষ্ট কোড দিয়ে পরীক্ষার তথ্য দেখা (Join পেজ)
router.get('/public/:code', ctrl.getExamByCode);
router.get('/code/:code', ctrl.getExamByCode); // 👈 ফ্রন্টএন্ডের জন্য নতুন পাবলিক রাউট

// পাবলিক: সব পাবলিশড পরীক্ষার তালিকা (Student Portal-এর জন্য)
// optionalAuth দিয়ে টোকেন থাকলে req.user সেট হয়, যাতে শুধু যুক্ত শিক্ষকদের পরীক্ষাই ফিল্টার করে দেখানো যায়
router.get('/public-list', optionalAuth, ctrl.getPublicExams);

// ==========================================
// ২. অটেনটিকেশন ও অথরাইজেশন মিডলওয়্যার
// ==========================================
// CORS Preflight (OPTIONS) রিকোয়েস্ট যাতে Auth মিডলওয়্যারে আটকে না যায়
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// এর পরের সব রুট শুধু Teacher রোল থাকা ইউজারদের জন্য
router.use(protect, authorize('teacher'), requireSubscription);

// ==========================================
// ৩. স্পেসিফিক রুটসমূহ (Static & Specific Paths)
// ==========================================
router.post('/upload', enforceExamLimit, upload.examSource.single('pdf'), ctrl.uploadExamPdf); // ফাইল আপলোডের আগেই সীমা চেক — সীমা শেষ হলে অযথা ফাইল সেভ হবে না
router.get('/', ctrl.getMyExams);
router.post('/', enforceExamLimit, ctrl.createExam); // 👈 শিক্ষক নিজে অনলাইনে MCQ প্রশ্ন লিখে পরীক্ষা তৈরি করার রুট
router.get('/attempts/:attemptId', ctrl.getAttemptDetails);

// ⏳ পেন্ডিং (অসম্পূর্ণ) পরীক্ষা — অনলাইনে তৈরির খসড়া
router.post('/pending', ctrl.savePending);
router.get('/pending/:id', ctrl.getPending);
router.post('/pending/:id/finalize', enforceExamLimit, ctrl.finalizePending);

// নির্দিষ্ট প্রশ্ন ম্যানেজমেন্ট রুট
router.put('/questions/:questionId', ctrl.updateQuestion);
router.delete('/questions/:questionId', ctrl.deleteQuestion);

// ==========================================
// ৪. পরীক্ষাভিত্তিক ডাইনামিক রুটসমূহ (Dynamic `/:id` Routes)
// ==========================================
router.get('/:id', ctrl.getExamById);
router.put('/:id/settings', ctrl.updateExamSettings);
router.post('/:id/publish', ctrl.publishExam);
router.delete('/:id', ctrl.deleteExam);

// রিসোর্স সম্পর্কিত রুট
router.put('/:id/resource-link', ctrl.setResourceLink);
router.post('/:id/resource-pdf', upload.single('pdf'), ctrl.setResourcePdf);
router.delete('/:id/resource', ctrl.removeResource);

// পরীক্ষার প্রশ্ন ও রেজাল্ট রুট
router.post('/:id/questions', ctrl.addQuestion);
router.put('/:id/questions/reorder', ctrl.reorderQuestions);
router.get('/:id/results', ctrl.getExamResults);
router.get('/:id/results/export', ctrl.exportResultsExcel);

module.exports = router;
