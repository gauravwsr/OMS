// const express = require("express");
// const { forgotPassword, verifyCode, resetPassword } = require("../controllers/authController");

// const router = express.Router();

// router.post("/forgot-password", forgotPassword);
// router.post("/verify-code", verifyCode);
// router.post("/reset-password", resetPassword);

// module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middlewares/auth');
const {
  login,
  register,
  getUserProfile,
  updateUserProfile,
  getUsers
} = require('../controllers/authController');

// Login route
router.post('/login', login);

// Register route - admin only
router.post('/register', protect, admin, register);

// User profile routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Get all users - admin only
router.get('/users', protect, admin, getUsers);

module.exports = router;