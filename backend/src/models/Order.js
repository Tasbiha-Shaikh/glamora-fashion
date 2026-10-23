const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    customerName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    items: [
      {
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        img: String,
      },
    ],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    cancelReason: { type: String, default: '' },
    cancelledAt: { type: Date },
    cancelledBy: { type: String, enum: ['customer', 'admin', 'system', ''], default: '' },
    returnRequest: {
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'rejected', 'completed'],
        default: 'none',
      },
      reason: { type: String, default: '' },
      details: { type: String, default: '' },
      requestedAt: { type: Date },
      adminResponse: { type: String, default: '' },
      pickupStatus: { type: String, default: '' },
      resolvedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;