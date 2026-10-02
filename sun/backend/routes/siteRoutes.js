// ================== routes/siteRoutes.js ==================
// পাবলিক: ওয়েবসাইটের কাস্টমাইজ তথ্য (লোগো, লেখা, ফুটার লিংক) — লগইন ছাড়াই
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/siteController');

router.get('/config', ctrl.getPublicConfig);
router.get('/logo', ctrl.getLogo);
router.get('/page/:slug', ctrl.getPublicPage);

module.exports = router;
