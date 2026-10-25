const Product = require('../models/Product');
const Review = require('../models/Review');

// rating / numReviews are calculated from reviews, never set directly
const withoutRatingFields = ({ rating, numReviews, ...data }) => data;

// @desc    Get all products
// @route   GET /api/products
const getProducts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category.toLowerCase();
    }

    if (req.query.isDeal !== undefined) {
      filter.isDeal = req.query.isDeal === 'true';
    }

    let query;

    if (req.query.isLatest === 'true') {
      // For homepage Latest Products: prioritize deals, latest additions & recently updated
      query = Product.find(filter).sort({ isDeal: -1, isLatest: -1, createdAt: -1, updatedAt: -1 });
    } else {
      query = Product.find(filter).sort({ createdAt: -1 });
    }

    if (req.query.limit) {
      query = query.limit(Number(req.query.limit));
    }

    const products = await query;
    res.json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product
// @route   GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
const createProduct = async (req, res) => {
  try {
    const product = await Product.create(withoutRatingFields(req.body));
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      withoutRatingFields(req.body),
      { new: true } // Return updated doc, like Django's save()
    );
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    await Review.deleteMany({ product: product._id });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };