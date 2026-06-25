const express = require('express');
const router = express.Router();
const { getUsers, deleteUser } = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getUsers);
router.delete('/:id', protect, adminOnly, deleteUser);

module.exports = router;