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
app.use(express.json());
app.use(morgan('dev'));

// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(session({
  secret: process.env.JWT_SECRET || 'glamora_dashboard_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 },
}));

// Serve React public/img folder from backend port as well
// This stops the /img/logo.png 404 spam in backend terminal
app.use('/img', express.static(path.join(__dirname, '../../frontend/public/img')));

// ── ROUTES ────────────────────────────────────────────────────────────────────

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Fashion Store API is running!' });
});

// Products
const productRoutes = require('./routes/productRoutes');
app.use('/api/products', productRoutes);

// Auth
const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

// Orders
const orderRoutes = require('./routes/orderRoutes');
app.use('/api/orders', orderRoutes);

// Users
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Schema visualization
const schemaRoutes = require('./routes/schemaRoutes');
app.use('/api/schema', schemaRoutes);

// Analytics
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

// Supabase image upload
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// EJS Dashboard
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});