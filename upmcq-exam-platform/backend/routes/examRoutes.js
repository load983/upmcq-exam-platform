const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const ctrl = require('../controllers/examController');

// ==========================================
// ১. পাবলিক রুট (Student join পেজ - No Auth Required)
// ==========================================
router.get('/public/:code', ctrl.getExamByCode);

// ==========================================
// ২. অটেনটিকেশন ও অথরাইজেশন মিডলওয়্যার
// ==========================================
// CORS Preflight (OPTIONS) রিকোয়েস্ট যাতে Auth মিডলওয়্যারে আটকে না যায়
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// এর পরের সব রুট শুধু Teacher রোল থাকা ইউজারদের জন্য
router.use(protect, authorize('teacher'));

// ==========================================
// ৩. স্পেসিফিক রুটসমূহ (Static & Specific Paths)
// (Dynamic `/:id` এর আগে রাখা হয়েছে যাতে Route Conflict না হয়)
// ==========================================
router.post('/upload', upload.single('pdf'), ctrl.uploadExamPdf);
router.get('/', ctrl.getMyExams);
router.get('/attempts/:attemptId', ctrl.getAttemptDetails);

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
