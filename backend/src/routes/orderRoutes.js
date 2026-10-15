const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect, optionalAuth, adminOnly } = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimiters');

// Guests can still check out; logged-in users get the order linked to their account
router.route('/').get(protect, adminOnly, getOrders).post(orderLimiter, optionalAuth, createOrder);
router.get('/my', protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).put(protect, adminOnly, updateOrderStatus);

module.exports = router;
