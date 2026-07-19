const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Analytics = require('../models/Analytics');
const bcrypt = require('bcryptjs');

// ── LOGIN PAGE ────────────────────────────────────────────────────────────────
const showLogin = (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/dashboard');
  res.render('dashboard/login', { error: null });
};

const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('dashboard/login', { error: 'Invalid credentials or not an admin' });
    }
    req.session.adminLoggedIn = true;
    req.session.adminName = user.name;
    req.session.adminEmail = user.email;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('dashboard/login', { error: 'Something went wrong' });
  }
};

const handleLogout = (req, res) => {
  req.session.destroy();
  res.redirect('/dashboard/login');
};

// ── DASHBOARD HOME ────────────────────────────────────────────────────────────
const showDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      totalUsers, totalProducts, totalOrders,
      pendingOrders, deliveredOrders, cancelledOrders,
      allOrders, recentOrders, lowStockProducts,
      todayVisits, weekVisits, monthVisits, liveUsers,
      dailyVisits, topPages, topProducts,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
      Order.find({}),
      Order.find({}).sort({ createdAt: -1 }).limit(5),
      Product.find({ stock: { $lt: 5 } }),
      Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfToday } }),
      Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfWeek } }),
      Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfMonth } }),
      Analytics.distinct('sessionId', { createdAt: { $gte: fiveMinutesAgo } }),
      Analytics.aggregate([
        { $match: { eventType: 'pageview', createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' }, day: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]),
      Analytics.aggregate([
        { $match: { eventType: 'pageview' } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      Analytics.aggregate([
        { $match: { eventType: 'click', productId: { $ne: null } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'product' } },
        { $unwind: '$product' },
      ]),
    ]);

    const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);

    const dailyChartData = dailyVisits.map(d => ({
      date: `${d._id.day}/${d._id.month}`,
      count: d.count,
    }));

    res.render('dashboard/index', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      stats: {
        totalUsers, totalProducts, totalOrders, totalRevenue,
        pendingOrders, deliveredOrders, cancelledOrders,
        todayVisits, weekVisits, monthVisits,
        liveUsers: liveUsers.length,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders,
      lowStockProducts,
      topPages,
      topProducts,
      dailyChartData: JSON.stringify(dailyChartData),
    });
  } catch (err) {
    res.status(500).send('Dashboard error: ' + err.message);
  }
};

// ── ORDERS PAGE ────────────────────────────────────────────────────────────────
const showOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.render('dashboard/orders', {
      admin: { name: req.session.adminName },
      orders,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

// ── UPDATE ORDER STATUS ───────────────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.redirect('/dashboard/orders');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

// ── USERS PAGE ────────────────────────────────────────────────────────────────
const showUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    res.render('dashboard/users', {
      admin: { name: req.session.adminName },
      users,
      newUsersToday,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

// ── PRODUCTS PAGE ─────────────────────────────────────────────────────────────
const showProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.render('dashboard/products', {
      admin: { name: req.session.adminName },
      products,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

// ── SCHEMA PAGE ───────────────────────────────────────────────────────────────
const showSchema = async (req, res) => {
  try {
    const [users, products, orders, analytics] = await Promise.all([
      User.find({}).select('-password').sort({ createdAt: -1 }),
      Product.find({}).sort({ createdAt: -1 }),
      Order.find({}).sort({ createdAt: -1 }),
      Analytics.find({}).sort({ createdAt: -1 }).limit(100), // latest 100 events
    ]);

    res.render('dashboard/schema', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      users,
      products,
      orders,
      analytics,
    });
  } catch (err) {
    res.status(500).send('Schema error: ' + err.message);
  }
};

module.exports = {
  showLogin, handleLogin, handleLogout,
  showDashboard, showOrders, updateOrderStatus,
  showUsers, showProducts, showSchema,
};