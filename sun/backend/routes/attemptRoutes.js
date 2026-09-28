// ================== routes/attemptRoutes.js ==================
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/attemptController');
const { protect, authorize } = require('../middleware/auth');

// এই রুটগুলো পাবলিক (Student এর জন্য) — শুধু examCode/accessCode দিয়ে সুরক্ষিত
// 🔒 পরীক্ষায় জয়েন করতে স্টুডেন্ট একাউন্টে লগইন বাধ্যতামূলক
router.post('/join', protect, authorize('student'), ctrl.joinExam);

// লগইন করা স্টুডেন্টের নিজের অতীত পরীক্ষার তালিকা (ড্যাশবোর্ডের "Past exam" অপশন)
router.get('/my', protect, authorize('student'), ctrl.getMyAttempts);
router.put('/:attemptId/answer', ctrl.saveAnswer);
router.post('/:attemptId/submit', ctrl.submitAttempt);
router.get('/:attemptId/download-pdf', ctrl.downloadResultPdf);
router.get('/:attemptId/resource-pdf', ctrl.downloadResourcePdf);
router.get('/:attemptId/review', ctrl.getAttemptReview);

module.exports = router;
