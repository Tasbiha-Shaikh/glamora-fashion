const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  updateReturnRequest,
} = require('../controllers/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { orderLimiter } = require('../middleware/rateLimiters');

// Placing orders requires authentication (must be logged in)
router.route('/').get(protect, adminOnly, getOrders).post(orderLimiter, protect, createOrder);
router.get('/my', protect, getMyOrders);
router.route('/:id').get(protect, getOrderById).put(protect, adminOnly, updateOrderStatus);

// Order cancellation (Customer pending/processing, Admin anytime)
router.put('/:id/cancel', protect, cancelOrder);

// Return request (Customer for delivered orders)
router.post('/:id/return', protect, requestReturn);

// Return actions (Admin approve / reject / complete return)
router.put('/:id/return-action', protect, adminOnly, updateReturnRequest);

module.exports = router;
