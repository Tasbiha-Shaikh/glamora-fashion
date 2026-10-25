// backend/src/routes/dashboardRoutes.js
// FULL REPLACEMENT FILE

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const dc = require('../controllers/dashboardController');
const { authLimiter, chatLimiter } = require('../middleware/rateLimiters');
const viewHelpers = require('../utils/viewHelpers');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'glamora_jwt_fallback_secret_2026';

// Helper to extract cookie from req.headers.cookie
const parseCookie = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

// Icons, money and date formatting for every dashboard view
router.use((req, res, next) => {
  Object.assign(res.locals, viewHelpers);
  res.locals.storeUrl = (process.env.CLIENT_URL || 'http://localhost:3000').split(',')[0].trim();
  next();
});

// Session restoration middleware: seamlessly restore admin session across serverless restarts/reloads via JWT cookie
router.use((req, res, next) => {
  if (!req.session) {
    req.session = {};
  }

  const token = parseCookie(req.headers.cookie, 'glamora_admin_session');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded && decoded.adminLoggedIn) {
        req.session.adminLoggedIn = true;
        req.session.adminName = decoded.adminName || req.session.adminName || 'Admin';
        req.session.adminEmail = decoded.adminEmail || req.session.adminEmail || 'admin@glamora.com';
        req.session.adminId = decoded.userId || decoded.id;
      }
    } catch (err) {
      // Token expired or invalid
      res.clearCookie('glamora_admin_session', { path: '/' });
      if (req.session) {
        req.session.adminLoggedIn = false;
      }
    }
  }

  if (req.session && req.session.adminLoggedIn) {
    res.locals.admin = {
      name: req.session.adminName || 'Admin',
      email: req.session.adminEmail || 'admin@glamora.com',
    };
  }

  next();
});

// Auth guard
const requireAdmin = (req, res, next) => {
  if (req.session && req.session.adminLoggedIn) return next();
  res.redirect('/dashboard/login');
};

// ── AUTH ──────────────────────────────────────────────────────────────────────
router.get('/login', dc.showLogin);
router.post('/login', authLimiter, express.urlencoded({ extended: true }), dc.handleLogin);
router.get('/logout', dc.handleLogout);

// ── IMAGE UPLOAD (Supabase) ───────────────────────────────────────────────────
router.post('/upload-image', requireAdmin, dc.uploadMiddleware, dc.uploadImage);

// ── DASHBOARD HOME ────────────────────────────────────────────────────────────
router.get('/', requireAdmin, dc.showDashboard);

// ── ORDERS ────────────────────────────────────────────────────────────────────
router.get('/orders', requireAdmin, dc.showOrders);
router.get('/orders/:id/receipt', requireAdmin, dc.showReceipt);
router.post('/orders/:id/status', requireAdmin, express.urlencoded({ extended: true }), dc.updateOrderStatus);

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get('/users', requireAdmin, dc.showUsers);
router.post('/users/:id/edit', requireAdmin, express.urlencoded({ extended: true }), dc.editUser);
router.post('/users/:id/delete', requireAdmin, dc.deleteUser);

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
router.get('/products', requireAdmin, dc.showProducts);
router.post('/products/refine-description', requireAdmin, chatLimiter, express.json(), dc.refineDescription);
router.post('/products/add', requireAdmin, express.urlencoded({ extended: true }), dc.addProduct);
router.post('/products/:id/edit', requireAdmin, express.urlencoded({ extended: true }), dc.editProduct);
router.post('/products/:id/delete', requireAdmin, dc.deleteProduct);

// ── SCHEMA ────────────────────────────────────────────────────────────────────
router.get('/schema', requireAdmin, dc.showSchema);

module.exports = router;