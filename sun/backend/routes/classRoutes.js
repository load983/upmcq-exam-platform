const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { requireSubscription } = require('../middleware/subscription');
const { requireFeature } = require('../middleware/feature');
const ctrl = require('../controllers/classController');

router.use(protect, authorize('teacher'), requireSubscription);
router.get('/', ctrl.getMyClasses);
router.post('/', requireFeature('classes'), ctrl.createClass);
router.delete('/:id', requireFeature('classes'), ctrl.deleteClass);

module.exports = router;
