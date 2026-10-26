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
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Please log in to place an order' });
  }

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
      user: req.user._id,
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
    const existing = await Order.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Order not found' });

    // Restock items if transitioning to cancelled for the first time
    if (req.body.status === 'cancelled' && existing.status !== 'cancelled') {
      await releaseStock(existing.items);
      existing.cancelledAt = new Date();
      existing.cancelledBy = 'admin';
      existing.cancelReason = req.body.cancelReason || 'Cancelled by admin';
    }

    existing.status = req.body.status;
    const order = await existing.save();

    res.json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc   Cancel an order (Customer can cancel pending/processing; Admin can cancel anytime)
// @route  PUT /api/orders/:id/cancel
const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isOwner = order.user && order.user.equals(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this order' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled' });
    }

    // Customers can only cancel while order is pending or processing (before shipment)
    if (!isAdmin && (order.status === 'shipped' || order.status === 'delivered')) {
      return res.status(400).json({
        success: false,
        message: 'Order has already been dispatched. You can request a return after delivery.',
      });
    }

    // Restock products
    await releaseStock(order.items);

    const reason = (req.body.reason || '').trim() || 'Cancelled by customer';
    order.status = 'cancelled';
    order.cancelReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = isAdmin ? 'admin' : 'customer';

    await order.save();

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Customer requests a return for a delivered order
// @route  POST /api/orders/:id/return
const requestReturn = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const isOwner = order.user && order.user.equals(req.user._id);
    if (!isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to request return for this order' });
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'Returns can only be requested for delivered orders',
      });
    }

    // 7-day return policy check
    const deliveryDate = new Date(order.updatedAt || order.createdAt);
    const diffDays = (Date.now() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      return res.status(400).json({
        success: false,
        message: 'Return window expired. Orders can only be returned within 7 days of delivery.',
      });
    }

    if (order.returnRequest?.status === 'requested') {
      return res.status(400).json({
        success: false,
        message: 'A return request for this order is already pending review.',
      });
    }

    if (order.returnRequest?.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Return has already been processed and completed for this order.',
      });
    }

    const { reason, details } = req.body;
    if (!reason || typeof reason !== 'string' || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid reason for the return request.',
      });
    }

    order.returnRequest = {
      status: 'requested',
      reason: reason.trim(),
      details: (details || '').trim(),
      requestedAt: new Date(),
      adminResponse: '',
      pickupStatus: 'Pending Admin Review',
    };

    await order.save();

    res.json({
      success: true,
      message: 'Return request submitted successfully. Our team will review and update you with pickup details.',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc   Admin approves, rejects, or completes a return request
// @route  PUT /api/orders/:id/return-action
const updateReturnRequest = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const { action, adminResponse, pickupStatus } = req.body;
    const validActions = ['approved', 'rejected', 'completed'];
    if (!validActions.includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid return action' });
    }

    if (!order.returnRequest || order.returnRequest.status === 'none') {
      return res.status(400).json({ success: false, message: 'No return has been requested for this order' });
    }

    // Default note if admin didn't provide custom text
    let responseNote = (adminResponse || '').trim();
    if (!responseNote) {
      if (action === 'approved') {
        responseNote = 'Return approved! Our courier rider has been assigned to pick up the package from your delivery address within 24-48 hours. Please keep items in original packaging.';
      } else if (action === 'rejected') {
        responseNote = 'Return request was reviewed and cannot be accepted in accordance with store policy.';
      } else if (action === 'completed') {
        responseNote = 'Item received and inspected. Return completed.';
      }
    }

    // If marked completed, restock returned items
    if (action === 'completed' && order.returnRequest.status !== 'completed') {
      await releaseStock(order.items);
    }

    order.returnRequest.status = action;
    order.returnRequest.adminResponse = responseNote;
    order.returnRequest.pickupStatus = (pickupStatus || '').trim() || (
      action === 'approved' ? 'Rider pickup scheduled' :
      action === 'completed' ? 'Picked up & completed' : 'Return rejected'
    );
    order.returnRequest.resolvedAt = new Date();

    await order.save();

    res.json({
      success: true,
      message: `Return request ${action} successfully`,
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  updateReturnRequest,
};
