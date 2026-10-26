// backend/src/controllers/dashboardController.js
// FULL REPLACEMENT FILE

const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Analytics = require('../models/Analytics');
const Review = require('../models/Review');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const supabase = require('../config/supabase');
const { isGeminiConfigured, generateText } = require('../config/gemini');

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || 'glamora_jwt_fallback_secret_2026';

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
  if (req.session && req.session.adminLoggedIn) return res.redirect('/dashboard');
  res.render('dashboard/login', { error: null });
};

exports.handleLogin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email: String(email || '').trim().toLowerCase(), role: 'admin' });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('dashboard/login', { error: 'Invalid credentials or not an admin' });
    }

    if (!req.session) req.session = {};
    req.session.adminLoggedIn = true;
    req.session.adminName = user.name;
    req.session.adminEmail = user.email;
    req.session.adminId = user._id;

    // Issue signed JWT cookie valid for 30 days to survive serverless container restarts & page reloads
    const token = jwt.sign(
      {
        adminLoggedIn: true,
        userId: user._id,
        adminName: user.name,
        adminEmail: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https' || process.env.NODE_ENV === 'production' || !!process.env.VERCEL;
    res.cookie('glamora_admin_session', token, {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      path: '/',
    });

    if (req.session.save) {
      req.session.save(() => {
        res.redirect('/dashboard');
      });
    } else {
      res.redirect('/dashboard');
    }
  } catch (err) {
    res.render('dashboard/login', { error: 'Something went wrong: ' + err.message });
  }
};

exports.handleLogout = (req, res) => {
  res.clearCookie('glamora_admin_session', { path: '/' });
  if (req.session && req.session.destroy) {
    req.session.destroy(() => {
      res.redirect('/dashboard/login');
    });
  } else {
    if (req.session) {
      delete req.session.adminLoggedIn;
      delete req.session.adminName;
      delete req.session.adminEmail;
    }
    res.redirect('/dashboard/login');
  }
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

    const totalRevenue = allOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0);
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
    if (!Order.schema.path('status').enumValues.includes(req.body.status)) {
      return res.redirect('/dashboard/orders');
    }
    const order = await Order.findById(req.params.id);
    if (!order) return res.redirect('/dashboard/orders');

    if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of order.items) {
        if (item.productId) {
          await Product.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } });
        }
      }
      order.cancelledAt = new Date();
      order.cancelledBy = 'admin';
      order.cancelReason = 'Cancelled via admin dashboard';
    }

    order.status = req.body.status;
    await order.save();
    // Keep the same order open after the page reloads
    res.redirect('/dashboard/orders#' + encodeURIComponent(req.params.id));
  } catch (err) {
    res.status(500).send('Error: ' + err.message);
  }
};

exports.showReceipt = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).send('Order not found');
    res.render('dashboard/receipt', { order });
  } catch (err) {
    res.status(404).send('Order not found');
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
    const dealFlag = isDeal === 'true' || isDeal === true || isDeal === 'on';
    await Product.create({
      name, description,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      category, brand,
      stock: Number(stock),
      isDeal: dealFlag,
      isLatest: true,
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
    const dealFlag = isDeal === 'true' || isDeal === true || isDeal === 'on';
    const updateData = {
      name, description,
      price: Number(price),
      discountPrice: Number(discountPrice) || 0,
      category, brand,
      stock: Number(stock),
      isDeal: dealFlag,
      isLatest: true,
      updatedAt: new Date(),
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
    await Review.deleteMany({ product: req.params.id });
    res.redirect('/dashboard/products?success=Product+deleted+successfully');
  } catch (err) {
    res.redirect('/dashboard/products?error=' + encodeURIComponent(err.message));
  }
};

// Rewrites or refines a draft product description with Gemini (admin "Refine with AI" button)
exports.refineDescription = async (req, res) => {
  if (!isGeminiConfigured()) {
    return res.status(503).json({ success: false, message: 'AI is not configured (GEMINI_API_KEY missing)' });
  }

  const field = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const description = field(req.body.description, 2000);
  const name = field(req.body.name, 120);
  const category = field(req.body.category, 40);
  const brand = field(req.body.brand, 60);

  if (!description && !name) {
    return res.status(400).json({ success: false, message: 'Add a product name or rough description/instructions first' });
  }

  const systemPrompt = `You are an expert product description copywriter and refiner for Glamora, an online luxury fashion jewelry and accessories store.

Your role:
1. Refine, polish, or generate an appealing, high-converting product description using the provided product details (name, category, brand) and draft/notes.
2. STRICTLY HONOR USER INSTRUCTIONS: The user's input may contain specific instructions (for example: word count like "100 words", formatting like "with bullet points" or "bullet points", tone requests like "luxury", or section requests). You MUST understand, prioritize, and strictly follow these instructions.
3. Default Behavior (if no specific word count or format is requested):
   - Write a polished, cohesive description of approximately 60-100 words.
   - Describe the materials, craftsmanship, aesthetic appeal, and styling or occasion advice.
   - Tone should be warm, sophisticated, and elegant.
4. Formatting:
   - When bullet points are requested, format them cleanly using "• " or "- " with line breaks.
   - Do not hallucinate false warranties, fake certifications, or contradict details given by the user.
   - Reply ONLY with the finished product description text. Do not include any conversational filler (e.g. do not say "Here is the refined description:").`;

  const draft = [
    name && `Product name: ${name}`,
    category && `Category: ${category}`,
    brand && `Brand: ${brand || 'Glamora'}`,
    description
      ? `User Draft & Instructions:\n"""\n${description}\n"""`
      : `(No user draft provided — write a polished product description based on the product details above)`,
  ].filter(Boolean).join('\n\n');

  try {
    const text = await generateText({
      systemPrompt,
      contents: [{ role: 'user', parts: [{ text: draft }] }],
    });

    let refined = text.trim();
    // Remove outer quotation marks if the whole response is quoted
    if ((refined.startsWith('"') && refined.endsWith('"')) || (refined.startsWith("'") && refined.endsWith("'"))) {
      refined = refined.slice(1, -1).trim();
    }
    // Remove any conversational preamble like "Here is the refined description:"
    refined = refined.replace(/^(here\s+(is|are)\s+[^:\n]+:\s*)/i, '');
    // Clean markdown bold markers (**text**) so it renders cleanly in textareas while keeping bullet points and line breaks
    refined = refined.replace(/\*\*/g, '').trim();

    if (!refined) throw new Error('Empty response');
    res.json({ success: true, description: refined });
  } catch (err) {
    console.error('Refine description error:', err.message);
    res.status(502).json({
      success: false,
      message: err.isRateLimit ? 'AI is busy right now, try again in a minute' : (err.message || 'Could not refine the description'),
    });
  }
};

// ── SCHEMA ────────────────────────────────────────────────────────────────────
exports.showSchema = async (req, res) => {
  try {
    const [users, products, orders, reviews, analytics] = await Promise.all([
      User.find({}).select('-password').sort({ createdAt: -1 }),
      Product.find({}).sort({ createdAt: -1 }),
      Order.find({}).sort({ createdAt: -1 }),
      Review.find({}).populate('product', 'name').sort({ createdAt: -1 }),
      Analytics.find({}).sort({ createdAt: -1 }).limit(100),
    ]);
    res.render('dashboard/schema', {
      admin: { name: req.session.adminName, email: req.session.adminEmail },
      users, products, orders, reviews, analytics,
    });
  } catch (err) {
    res.status(500).send('Schema error: ' + err.message);
  }
};