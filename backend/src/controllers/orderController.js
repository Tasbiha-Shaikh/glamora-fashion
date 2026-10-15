const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');

const ORDER_STATUSES = Order.schema.path('status').enumValues;
const MAX_QTY_PER_ITEM = 100;

const isNonEmptyString = (value, max = 300) =>
  typeof value === 'string' && value.trim() !== '' && value.length <= max;

// Put back stock taken by a partially reserved order
const releaseStock = (reserved) =>
  Promise.all(reserved.map(({ productId, quantity }) =>
    Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })
  ));

// @desc   Place new order
// @route  POST /api/orders
const createOrder = async (req, res) => {
  const { customerName, email, phone, address, items } = req.body;

  if (![customerName, email, phone, address].every((v) => isNonEmptyString(v))) {
    return res.status(400).json({ success: false, message: 'Name, email, phone and address are required' });
  }
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) {
    return res.status(400).json({ success: false, message: 'Your cart is empty or invalid' });
  }

  // Only trust product IDs and quantities from the client — merge duplicates
  const quantities = new Map();
  for (const item of items) {
    const productId = String(item?.productId || item?.id || '');
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Invalid item in cart' });
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }
  if ([...quantities.values()].some((q) => q > MAX_QTY_PER_ITEM)) {
    return res.status(400).json({ success: false, message: `Maximum ${MAX_QTY_PER_ITEM} of each item per order` });
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  if (products.length !== quantities.size) {
    return res.status(400).json({ success: false, message: 'Some products in your cart no longer exist' });
  }

  // Reserve stock atomically per product; roll back if any item is short
  const reserved = [];
  for (const product of products) {
    const quantity = quantities.get(String(product._id));
    const result = await Product.updateOne(
      { _id: product._id, stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(reserved);
      return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}` });
    }
    reserved.push({ productId: product._id, quantity });
  }

  // Prices always come from the database, never from the client
  const orderItems = products.map((product) => ({
    productId: String(product._id),
    name: product.name,
    price: product.discountPrice > 0 ? product.discountPrice : product.price,
    quantity: quantities.get(String(product._id)),
    img: product.images?.[0]?.url || '',
  }));
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  try {
    const order = await Order.create({
      user: req.user?._id || null,
      customerName: customerName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      paymentMethod: 'cod', // online payment is not available yet
      items: orderItems,
      subtotal,
      total: subtotal,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
    await releaseStock(reserved);
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Get all orders (admin)
// @route  GET /api/orders
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get logged in user's orders
// @route  GET /api/orders/my
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Get order by ID (owner or admin)
// @route  GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    const isOwner = order?.user && order.user.equals(req.user._id);
    if (!order || (!isOwner && req.user.role !== 'admin')) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update order status (admin)
// @route  PUT /api/orders/:id
const updateOrderStatus = async (req, res) => {
  try {
    if (!ORDER_STATUSES.includes(req.body.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getOrders, getMyOrders, getOrderById, updateOrderStatus };
