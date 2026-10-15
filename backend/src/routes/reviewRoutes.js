const express = require('express');
const router = express.Router();
const { getProductReviews, getMyReviews, createReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { reviewLimiter } = require('../middleware/rateLimiters');

router.get('/product/:productId', getProductReviews);
router.get('/my', protect, getMyReviews);
router.post('/', reviewLimiter, protect, createReview);

module.exports = router;
