const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON (like Django's request.data)
app.use(morgan('dev'));  // Logs requests in terminal

// Routes
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// auth routes
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Order routes
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Fashion Store API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

//  admin to controll users
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);