const express = require('express');
const router = express.Router();
const dc = require('../controllers/dashboardController');

// Auth guard middleware
const requireAdmin = (req, res, next) => {
  if (req.session.adminLoggedIn) return next();
  res.redirect('/dashboard/login');
};

router.get('/login', dc.showLogin);
router.post('/login', express.urlencoded({ extended: true }), dc.handleLogin);
router.get('/logout', dc.handleLogout);

router.get('/', requireAdmin, dc.showDashboard);
router.get('/orders', requireAdmin, dc.showOrders);
router.post('/orders/:id/status', requireAdmin, express.urlencoded({ extended: true }), dc.updateOrderStatus);
router.get('/users', requireAdmin, dc.showUsers);
router.get('/products', requireAdmin, dc.showProducts);
router.get('/schema', requireAdmin, dc.showSchema);

module.exports = router;