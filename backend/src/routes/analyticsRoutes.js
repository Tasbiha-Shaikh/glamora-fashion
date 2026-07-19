const express = require('express');
const router = express.Router();
const { trackEvent, getSummary } = require('../controllers/analyticsController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/track', trackEvent);                        // public — tracks visits
router.get('/summary', protect, adminOnly, getSummary);   // admin only

module.exports = router;