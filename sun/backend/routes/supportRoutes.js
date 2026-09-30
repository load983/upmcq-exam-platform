// ================== routes/supportRoutes.js ==================
// পাবলিক হেল্পলাইন রাউট — লগইন ছাড়াও (গেস্ট হিসেবে) ব্যবহার করা যায়
const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const ctrl = require('../controllers/supportController');

router.get('/contacts', ctrl.getPublicContacts);

router.get('/chat', optionalAuth, ctrl.userGetMessages);
router.get('/chat/unread', optionalAuth, ctrl.userUnread);
router.post('/chat', optionalAuth, ctrl.userSend);

module.exports = router;
