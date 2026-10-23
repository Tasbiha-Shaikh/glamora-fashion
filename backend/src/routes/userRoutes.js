const express = require('express');
const router = express.Router();
const {
  getUsers,
  deleteUser,
  getWishlist,
  toggleWishlist,
  syncWishlist,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Wishlist routes (Private - logged in users)
router.get('/wishlist', protect, getWishlist);
router.post('/wishlist/sync', protect, syncWishlist);
router.post('/wishlist/:productId', protect, toggleWishlist);

// Admin user management routes
router.get('/', protect, adminOnly, getUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;
