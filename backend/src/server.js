const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const session = require('express-session');
const path = require('path');

// Load env variables
dotenv.config();

// Refuse to start without secrets — a guessable fallback would let anyone forge tokens/sessions
if (!process.env.JWT_SECRET) {
  console.error('Error: JWT_SECRET is not set in .env');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.disable('x-powered-by');
if (isProduction) app.set('trust proxy', 1); // needed for secure cookies / rate limits behind a proxy

// Only the storefront may call the API from a browser
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim());
app.use(cors({ origin: allowedOrigins }));

app.use(express.json({ limit: '100kb' })); // Parses incoming JSON (like Django's request.data)
app.use(morgan('dev'));  // Logs requests in terminal


// EJS setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: 'glamora.sid',
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    httpOnly: true,
    sameSite: 'strict', // blocks cross-site form posts to the dashboard (CSRF)
    secure: isProduction,
  },
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

//  admin to controll users
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Database schema visualization route
const schemaRoutes = require('./routes/schemaRoutes');
app.use('/api/schema', schemaRoutes);

// Analytics routes
const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

// Product reviews
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// AI chat assistant (keeps the Gemini key on the server)
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Dashboard routes
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);

//  Supabase upload route
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Fashion Store API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
