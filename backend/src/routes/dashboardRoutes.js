// backend/src/routes/dashboardRoutes.js
// FULL REPLACEMENT FILE

const express = require('express');
const router = express.Router();
const dc = require('../controllers/dashboardController');
const { authLimiter } = require('../middleware/rateLimiters');

// Auth guard
const requireAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) return next();
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
router.post('/orders/:id/status', requireAdmin, express.urlencoded({ extended: true }), dc.updateOrderStatus);

// ── USERS ─────────────────────────────────────────────────────────────────────
router.get('/users', requireAdmin, dc.showUsers);
router.post('/users/:id/edit', requireAdmin, express.urlencoded({ extended: true }), dc.editUser);
router.post('/users/:id/delete', requireAdmin, dc.deleteUser);

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
router.get('/products', requireAdmin, dc.showProducts);
router.post('/products/add', requireAdmin, express.urlencoded({ extended: true }), dc.addProduct);
router.post('/products/:id/edit', requireAdmin, express.urlencoded({ extended: true }), dc.editProduct);
router.post('/products/:id/delete', requireAdmin, dc.deleteProduct);

// ── SCHEMA ────────────────────────────────────────────────────────────────────
router.get('/schema', requireAdmin, dc.showSchema);

module.exports = router;