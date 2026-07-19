const mongoose = require('mongoose');

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    page: { type: String, required: true },
    sessionId: { type: String, required: true },
    userAgent: { type: String },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    eventType: {
      type: String,
      enum: ['pageview', 'click', 'purchase'],
      default: 'pageview',
    },
    country: { type: String, default: 'Unknown' },
  },
  { timestamps: true }
);

const Analytics = mongoose.model('Analytics', analyticsSchema);
module.exports = Analytics;