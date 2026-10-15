const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Resolve the user from a "Bearer <token>" header, or null if missing/invalid
const getUserFromToken = async (req) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    return await User.findById(decoded.id).select('-password');
  } catch (error) {
    return null;
  }
};

// Protect route
const protect = async (req, res, next) => {
  if (!req.headers.authorization?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  const user = await getUserFromToken(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }

  // Attach user to request — like Django's request.user
  req.user = user;
  next();
};

// Attach user if a valid token is sent, but allow guests through
const optionalAuth = async (req, res, next) => {
  req.user = await getUserFromToken(req);
  next();
};

// Admin only
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ success: false, message: 'Not authorized as admin' });
  }
};

module.exports = { protect, optionalAuth, adminOnly };
