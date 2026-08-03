// backend/src/controllers/dashboardController.js
// FULL REPLACEMENT FILE

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Analytics = require('../models/Analytics');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const supabase = require('../config/supabase');

// ── MULTER MEMORY STORAGE ─────────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed'), false);
  },
});
exports.uploadMiddleware = upload.single('image');

// ── IMAGE UPLOAD TO SUPABASE (called from EJS dashboard) ─────────────────────
exports.uploadImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `product-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'glamora-products')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET || 'glamora-products')
      .getPublicUrl(fileName);

    res.json({ success: true, url: urlData.publicUrl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── LOGIN ─────────────────────────────────────────────────────────────────────
exports.showLogin = (req, res) => {
  if (req.session.adminLoggedIn) return res.redirect('/dashboard');
  res.render('dashboard/login', { error: null });
};

exports.handleLogin = async (req, res) => {
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

exports.handleLogout = (req, res) => {
  req.session.destroy();
  res.redirect('/dashboard/login');
};

// ── DASHBOARD HOME ────────────────────────────────────────────────────────────
exports.showDashboard = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [
      totalUsers, totalProducts, allOrders, recentOrders, lowStockProducts,
      todayVisits, weekVisits, monthVisits, liveUsers, dailyVisits, topPages, topProducts,
      pendingOrders, deliveredOrders, cancelledOrders,
    ] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.find({}),
      Order.find({}).sort({ createdAt: -1 }).limit(5),
      Product.find({ stock: { $lt: 5 } }),
      Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfToday } }),
      Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfWeek } }),
      Analytics.countDocuments({ eventType: 'pageview', createdAt: { $gte: startOfMonth } }),
      Analytics.distinct('sessionId', { createdAt: { $gte: fiveMinutesAgo } }),
      Analytics.aggregate([
        { $match: { eventType: 'pageview', createdAt: { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { year:{$year:'$createdAt'}, month:{$month:'$createdAt'}, day:{$dayOfMonth:'$createdAt'} }, count:{$sum:1} } },
        { $sort: { '_id.year':1, '_id.month':1, '_id.day':1 } },
      ]),
      Analytics.aggregate([
        { $match: { eventType: 'pageview' } },
        { $group: { _id: '$page', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 8 },
      ]),
      Analytics.aggregate([
        { $match: { eventType: 'click', productId: { $ne: null } } },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } }, { $limit: 5 },
        { $lookup: { from:'products', localField:'_id', foreignField:'_id', as:'product' } },
        { $unwind: '$product' },
      ]),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'delivered' }),
      Order.countDocuments({ status: 'cancelled' }),
    ]);

    const totalRevenue = allOrders.reduce((s, o) => s + o.total, 0);
    const dailyChartData = dailyVisits.map(d => ({
      date: `${d._id.day}/${d._id.month}`, count: d.count,
    }));

    res.render('dashboard/index', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      stats: {
        totalUsers, totalProducts, totalOrders: allOrders.length, totalRevenue,
        pendingOrders, deliveredOrders, cancelledOrders,
        todayVisits, weekVisits, monthVisits,
        liveUsers: liveUsers.length,
        lowStockCount: lowStockProducts.length,
      },
      recentOrders, lowStockProducts, topPages, topProducts,
      dailyChartData: JSON.stringify(dailyChartData),
    });
  } catch (err) {
    res.status(500).send('Dashboard error: ' + err.message);
  }
};

// ── ORDERS ────────────────────────────────────────────────────────────────────
exports.showOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ createdAt: -1 });
    res.render('dashboard/orders', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      orders,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.redirect('/dashboard/orders');
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

// ── USERS ─────────────────────────────────────────────────────────────────────
exports.showUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: startOfToday } });
    res.render('dashboard/users', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      users, newUsersToday,
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

exports.editUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.redirect('/dashboard/users?error=User+not+found');

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;
    if (password && password.trim() !== '') user.password = password;

    await user.save();
    res.redirect('/dashboard/users?success=User+updated+successfully');
  } catch (err) {
    res.redirect('/dashboard/users?error=' + encodeURIComponent(err.message));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/users?success=User+deleted');
  } catch (err) {
    res.redirect('/dashboard/users?error=' + encodeURIComponent(err.message));
  }
};

// ── PRODUCTS ──────────────────────────────────────────────────────────────────
exports.showProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.render('dashboard/products', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      products,
      successMsg: req.query.success || null,
      errorMsg: req.query.error || null,
    });
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, category, brand, stock, imageUrl, isDeal } = req.body;
    await Product.create({
      name, description,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      category, brand,
      stock: Number(stock),
      isDeal: isDeal === 'true',
      images: imageUrl ? [{ url: imageUrl, isMain: true }] : [],
    });
    res.redirect('/dashboard/products?success=Product+added+successfully');
  } catch (err) {
    res.redirect('/dashboard/products?error=' + encodeURIComponent(err.message));
  }
};

exports.editProduct = async (req, res) => {
  try {
    const { name, description, price, discountPrice, category, brand, stock, imageUrl, isDeal } = req.body;
    const updateData = {
      name, description,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      category, brand,
      stock: Number(stock),
      isDeal: isDeal === 'true',
    };
    // Only update image if a new one was uploaded
    if (imageUrl && imageUrl.trim() !== '') {
      updateData.images = [{ url: imageUrl, isMain: true }];
    }
    await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.redirect('/dashboard/products?success=Product+updated+successfully');
  } catch (err) {
    res.redirect('/dashboard/products?error=' + encodeURIComponent(err.message));
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/dashboard/products?success=Product+deleted+successfully');
  } catch (err) {
    res.redirect('/dashboard/products?error=' + encodeURIComponent(err.message));
  }
};

// ── SCHEMA ────────────────────────────────────────────────────────────────────
exports.showSchema = async (req, res) => {
  try {
    const [users, products, orders, analytics] = await Promise.all([
      User.find({}).select('-password').sort({ createdAt: -1 }),
      Product.find({}).sort({ createdAt: -1 }),
      Order.find({}).sort({ createdAt: -1 }),
      Analytics.find({}).sort({ createdAt: -1 }).limit(100),
    ]);
    res.render('dashboard/schema', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      users, products, orders, analytics,
    });
  } catch (err) {
    res.status(500).send('Schema error: ' + err.message);
  }
};