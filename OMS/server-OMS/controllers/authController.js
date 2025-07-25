// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const User = require("../models/userModel.js");
// const transporter = require("../config/email");
// const { generateOTP, storeOTP, validateOTP } = require("../utils/otpUtils");

// // Forgot Password - Send OTP
// exports.forgotPassword = async (req, res) => {
//   const { email } = req.body;
  
//   try {
//     const user = await User.findOne({ email });
//     if (!user) return res.status(404).json({ message: "User not found" });

//     const otp = generateOTP();
//     storeOTP(email, otp);

//     await transporter.sendMail({
//       from: process.env.EMAIL_USER,
//       to: email,
//       subject: "Password Reset Code",
//       text: `Your password reset code is: ${otp}`,
//     });

//     res.json({ message: "Verification code sent to email" });
//   } catch (error) {
//     res.status(500).json({ message: "Server Error", error });
//   }
// };

// // Verify OTP
// exports.verifyCode = (req, res) => {
//   const { email, code } = req.body;

//   if (validateOTP(email, code)) {
//     const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "15m" });
//     res.json({ message: "Code verified", token });
//   } else {
//     res.status(400).json({ message: "Invalid or expired code" });
//   }
// };

// // Reset Password
// exports.resetPassword = async (req, res) => {
//   const { token, password } = req.body;

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findOne({ email: decoded.email });

//     if (!user) return res.status(404).json({ message: "User not found" });

//     const salt = await bcrypt.genSalt(10);
//     user.password = await bcrypt.hash(password, salt);
//     await user.save();

//     res.json({ message: "Password has been reset successfully" });
//   } catch (error) {
//     res.status(400).json({ message: "Invalid or expired token" });
//   }
// };


const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Candidate = require('../models/Candidate');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    res.json({
      _id: user._id,
      candidateId: user.candidateId,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
const register = async (req, res) => {
  try {
    const { candidateId, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    const user = new User({
      candidateId,
      email,
      password,
      role: role || 'candidate'
    });

    const savedUser = await user.save();

    res.status(201).json({
      _id: savedUser._id,
      candidateId: savedUser.candidateId,
      email: savedUser.email,
      role: savedUser.role,
      token: generateToken(savedUser._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      // Get candidate details if user is a candidate
      if (user.role === 'candidate') {
        const candidate = await Candidate.findOne({ user: user._id });
        if (candidate) {
          res.json({
            user,
            candidate
          });
        } else {
          res.json({ user });
        }
      } else {
        res.json({ user });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.email = req.body.email || user.email;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        candidateId: updatedUser.candidateId,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id)
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// @desc    Get all users
// @route   GET /api/auth/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

module.exports = {
  login,
  register,
  getUserProfile,
  updateUserProfile,
  getUsers
};