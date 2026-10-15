const rateLimit = require('express-rate-limit');

const limiter = (windowMinutes, limit, message) => rateLimit({
  windowMs: windowMinutes * 60 * 1000,
  limit,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, message },
});

// Login / register — slows down password guessing
const authLimiter = limiter(15, 20, 'Too many attempts, please try again in 15 minutes');

// Placing orders
const orderLimiter = limiter(15, 20, 'Too many orders, please try again later');

// AI chat — each request costs Gemini quota
const chatLimiter = limiter(1, 10, 'Too many messages, please slow down');

// Public analytics tracking
const analyticsLimiter = limiter(1, 60, 'Too many requests');

// Writing reviews
const reviewLimiter = limiter(15, 20, 'Too many reviews, please try again later');

module.exports = { authLimiter, orderLimiter, chatLimiter, analyticsLimiter, reviewLimiter };
