const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const MAX_PAGE_SIZE = 50;

// Recalculate a product's average rating and review count from its reviews
const updateProductRating = async (productId) => {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    {
      rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
      numReviews: stats ? stats.count : 0,
    }
  );
};

// @desc   Get a product's reviews, newest first
// @route  GET /api/reviews/product/:productId?skip=0&limit=3
const getProductReviews = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    const skip = Math.max(parseInt(req.query.skip, 10) || 0, 0);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 3, 1), MAX_PAGE_SIZE);
    const filter = { product: req.params.productId };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .select('name rating comment createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);

    res.json({ success: true, data: { reviews, total } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get the logged in user's reviews (so the profile knows what's already reviewed)
// @route  GET /api/reviews/my
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id }).select('product order rating comment createdAt');
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Review a product from one of your delivered orders
// @route  POST /api/reviews
const createReview = async (req, res) => {
  const { productId, orderId, comment = '' } = req.body;
  const rating = Number(req.body.rating);

  if (!mongoose.isValidObjectId(productId) || !mongoose.isValidObjectId(orderId)) {
    return res.status(400).json({ success: false, message: 'Invalid product or order' });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
  }
  if (typeof comment !== 'string' || comment.length > 1000) {
    return res.status(400).json({ success: false, message: 'Review must be under 1000 characters' });
  }

  try {
    // Only verified buyers: the order must be theirs, delivered, and contain this product
    const order = await Order.findOne({ _id: orderId, user: req.user._id });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'You can review products once your order is delivered' });
    }
    if (!order.items.some((item) => item.productId === String(productId))) {
      return res.status(400).json({ success: false, message: 'This product is not part of that order' });
    }
    if (!(await Product.exists({ _id: productId }))) {
      return res.status(404).json({ success: false, message: 'This product is no longer available' });
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: orderId,
      name: req.user.name,
      rating,
      comment: comment.trim(),
    });
    await updateProductRating(productId);

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getProductReviews, getMyReviews, createReview };
