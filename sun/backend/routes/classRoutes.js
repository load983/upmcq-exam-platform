const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');
const ctrl = require('../controllers/classController');

router.use(protect, authorize('teacher'), requireSubscription);
router.get('/', ctrl.getMyClasses);
router.post('/', ctrl.createClass);
router.delete('/:id', ctrl.deleteClass);

module.exports = router;
