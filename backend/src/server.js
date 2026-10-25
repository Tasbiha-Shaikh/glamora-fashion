const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');

// Load env variables
dotenv.config();

// Initialize DB connection in background
connectDB().catch((err) => {
  console.warn('Initial MongoDB connection attempt deferred:', err.message);
});

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Middleware
app.disable('x-powered-by');
if (isProduction || process.env.VERCEL) {
  app.set('trust proxy', 1); // needed for secure cookies / rate limits behind Vercel or reverse proxy
}

// CORS: Support localhost, custom CLIENT_URL, and all Vercel deployments (.vercel.app)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim().replace(/\/+$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, same-origin, curl)
      if (!origin) return callback(null, true);
      // Allow local development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) return callback(null, true);
      // Allow all Vercel deployment URLs (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow explicitly configured origins in CLIENT_URL
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Default allow so API is accessible
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '100kb' }));
if (!isProduction) {
  app.use(morgan('dev'));
}

// EJS setup (for optional admin dashboard)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
  session({
    name: 'glamora.sid',
    secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || 'glamora_fallback_secret_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
    },
  })
);

// Serve React public/img folder from backend if present locally
const localImgPath = path.join(__dirname, '../../frontend/public/img');
if (fs.existsSync(localImgPath)) {
  app.use('/img', express.static(localImgPath));
}

// Ensure DB is connected before handling API requests (critical for Vercel serverless functions)
app.use(async (req, res, next) => {
  // Static paths or health check can skip DB check
  if (req.path === '/' || req.path === '/api/health') {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection middleware error:', err.message);
    if (req.path.startsWith('/api')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection failed. Please ensure MONGO_URI is set correctly in environment variables.',
        error: isProduction ? undefined : err.message,
      });
    }
    next();
  }
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

// Test / Health route
app.get('/', (req, res) => {
  res.json({
    message: 'Fashion Store API is running!',
    environment: process.env.NODE_ENV || 'development',
    serverless: !!process.env.VERCEL,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
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

// Product reviews
const reviewRoutes = require('./routes/reviewRoutes');
app.use('/api/reviews', reviewRoutes);

// AI chat assistant
const chatRoutes = require('./routes/chatRoutes');
app.use('/api/chat', chatRoutes);

// Supabase image upload
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// EJS Dashboard
const dashboardRoutes = require('./routes/dashboardRoutes');
app.use('/dashboard', dashboardRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  if (req.accepts('json') || req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
  }
  res.status(404).send('404 Page Not Found');
});

// ── START SERVER ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
