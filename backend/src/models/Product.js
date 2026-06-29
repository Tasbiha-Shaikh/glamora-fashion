const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      default: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      required: true,
      enum: ['watches', 'rings', 'glasses', 'bracelets', 'earrings', 'necklaces'],
    },
    sizes: {
      type: [String], // Array of strings
      enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },
    colors: [
      {
        name: String,  // e.g "Red"
        hex: String,   // e.g "#FF0000"
      },
    ],
    images: [
      {
        url: String,
        isMain: { type: Boolean, default: false },
      },
    ],
    brand: {
      type: String,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    numReviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false, // Show on homepage
    },
    isLatest: { type: Boolean, default: false },
    isDeal: {
      type: Boolean,
      default: false, // Show in deals section with timer
    },
    dealEndsAt: {
      type: Date, // Deal countdown timer ends at this time
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;