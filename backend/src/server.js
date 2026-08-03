const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const session = require('express-session');
const path = require('path');

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parses incoming JSON (like Django's request.data)
app.use(morgan('dev'));  // Logs requests in terminal


// EJS setup 
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.JWT_SECRET || 'glamora_dashboard_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
}));

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

// Database schema visualization route
const schemaRoutes = require('./routes/schemaRoutes');
app.use('/api/schema', schemaRoutes);

// Analytics routes
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);

//  Supabase upload route
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);