const User = require('../models/User');

// @desc    Get all users (admin)
// @route   GET /api/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's wishlist
// @route   GET /api/users/wishlist
// @access  Private
const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      select: 'name price discountPrice images stock rating numReviews category brand',
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Filter out any null products if they were deleted from DB
    const validWishlist = (user.wishlist || []).filter((item) => item !== null);

    res.json({ success: true, data: validWishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add or remove product from wishlist
// @route   POST /api/users/wishlist/:productId
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const index = user.wishlist.findIndex((id) => id.toString() === productId);
    let action = '';

    if (index > -1) {
      user.wishlist.splice(index, 1);
      action = 'removed';
    } else {
      user.wishlist.push(productId);
      action = 'added';
    }

    await user.save();

    await user.populate({
      path: 'wishlist',
      select: 'name price discountPrice images stock rating numReviews category brand',
    });

    const validWishlist = (user.wishlist || []).filter((item) => item !== null);

    res.json({
      success: true,
      action,
      message: action === 'added' ? 'Product added to wishlist' : 'Product removed from wishlist',
      data: validWishlist,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Sync guest wishlist with user account
// @route   POST /api/users/wishlist/sync
// @access  Private
const syncWishlist = async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!Array.isArray(productIds)) {
      return res.status(400).json({ success: false, message: 'productIds must be an array' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.wishlist) {
      user.wishlist = [];
    }

    const existingIds = new Set(user.wishlist.map((id) => id.toString()));
    for (const pid of productIds) {
      if (pid && !existingIds.has(pid.toString())) {
        user.wishlist.push(pid);
        existingIds.add(pid.toString());
      }
    }

    await user.save();

    await user.populate({
      path: 'wishlist',
      select: 'name price discountPrice images stock rating numReviews category brand',
    });

    const validWishlist = (user.wishlist || []).filter((item) => item !== null);

    res.json({
      success: true,
      message: 'Wishlist synced successfully',
      data: validWishlist,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getUsers,
  deleteUser,
  getWishlist,
  toggleWishlist,
  syncWishlist,
};
