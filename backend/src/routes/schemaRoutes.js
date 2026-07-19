const express = require('express');
const router = express.Router();

// Returns all collection schemas for visualization
router.get('/', (req, res) => {
  const schema = {
    collections: [
      {
        name: 'Users',
        color: '#9b59b6',
        fields: [
          { name: '_id', type: 'ObjectId', note: 'Primary Key' },
          { name: 'name', type: 'String', required: true },
          { name: 'email', type: 'String', required: true, unique: true },
          { name: 'password', type: 'String', required: true, note: 'bcrypt hashed' },
          { name: 'role', type: 'String', note: 'user | admin' },
          { name: 'avatar', type: 'String' },
          { name: 'addresses', type: 'Array' },
          { name: 'createdAt', type: 'Date', note: 'auto' },
          { name: 'updatedAt', type: 'Date', note: 'auto' },
        ],
      },
      {
        name: 'Products',
        color: '#27ae60',
        fields: [
          { name: '_id', type: 'ObjectId', note: 'Primary Key' },
          { name: 'name', type: 'String', required: true },
          { name: 'description', type: 'String', required: true },
          { name: 'price', type: 'Number', required: true },
          { name: 'discountPrice', type: 'Number' },
          { name: 'category', type: 'String', note: 'watches|rings|glasses|bracelets|earrings|necklaces' },
          { name: 'sizes', type: 'Array[String]' },
          { name: 'colors', type: 'Array[{name,hex}]' },
          { name: 'images', type: 'Array[{url,isMain}]' },
          { name: 'brand', type: 'String', required: true },
          { name: 'stock', type: 'Number', required: true },
          { name: 'rating', type: 'Number' },
          { name: 'numReviews', type: 'Number' },
          { name: 'isFeatured', type: 'Boolean' },
          { name: 'isDeal', type: 'Boolean' },
          { name: 'dealEndsAt', type: 'Date' },
          { name: 'createdAt', type: 'Date', note: 'auto' },
          { name: 'updatedAt', type: 'Date', note: 'auto' },
        ],
      },
      {
        name: 'Orders',
        color: '#e67e22',
        fields: [
          { name: '_id', type: 'ObjectId', note: 'Primary Key' },
          { name: 'customerName', type: 'String', required: true },
          { name: 'email', type: 'String', required: true },
          { name: 'phone', type: 'String', required: true },
          { name: 'address', type: 'String', required: true },
          { name: 'paymentMethod', type: 'String', note: 'cod | online' },
          { name: 'items', type: 'Array[{productId,name,price,quantity,img}]' },
          { name: 'subtotal', type: 'Number', required: true },
          { name: 'total', type: 'Number', required: true },
          { name: 'status', type: 'String', note: 'pending|processing|shipped|delivered|cancelled' },
          { name: 'createdAt', type: 'Date', note: 'auto' },
          { name: 'updatedAt', type: 'Date', note: 'auto' },
        ],
      },
      {
        name: 'Analytics',
        color: '#e74c3c',
        fields: [
          { name: '_id', type: 'ObjectId', note: 'Primary Key' },
          { name: 'date', type: 'Date', note: 'visit date' },
          { name: 'page', type: 'String', note: 'page visited' },
          { name: 'sessionId', type: 'String', note: 'unique visitor ID' },
          { name: 'userAgent', type: 'String' },
          { name: 'productId', type: 'ObjectId', note: 'FK → Products._id' },
          { name: 'eventType', type: 'String', note: 'pageview | click | purchase' },
          { name: 'createdAt', type: 'Date', note: 'auto' },
        ],
      },
    ],
    relationships: [
      { from: 'Orders', to: 'Products', label: 'items[].productId → _id', type: 'many-to-many' },
      { from: 'Orders', to: 'Users', label: 'email → email', type: 'many-to-one' },
      { from: 'Analytics', to: 'Products', label: 'productId → _id', type: 'many-to-one' },
    ],
  };
  res.json({ success: true, data: schema });
});

module.exports = router;