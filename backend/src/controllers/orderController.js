const Order = require('../models/Order');

// @desc   Place new order
// @route  POST /api/orders
const createOrder = async (req, res) => {
  try {
    const { customerName, email, phone, address, paymentMethod, items, subtotal, total } = req.body;

    const order = await Order.create({
      customerName, email, phone, address,
      paymentMethod, items, subtotal, total,
    });

    res.status(201).json({ success: true, data: order });
  } catch (error) {
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

// @desc   Get order by ID
// @route  GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Update order status (admin)
// @route  PUT /api/orders/:id
const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { createOrder, getOrders, getOrderById, updateOrderStatus };