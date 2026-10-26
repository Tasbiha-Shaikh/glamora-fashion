const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { refineDescription } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.post('/refine-description', protect, adminOnly, refineDescription);
router.route('/').get(getProducts).post(protect, adminOnly, createProduct);
router
  .route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

module.exports = router;
