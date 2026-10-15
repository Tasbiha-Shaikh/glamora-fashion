const express = require('express');
const router = express.Router();
const { chat } = require('../controllers/chatController');
const { optionalAuth } = require('../middleware/authMiddleware');
const { chatLimiter } = require('../middleware/rateLimiters');

router.post('/', chatLimiter, optionalAuth, chat);

module.exports = router;
