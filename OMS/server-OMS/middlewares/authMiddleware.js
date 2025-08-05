const jwt = require("jsonwebtoken");
const User = require("../models/userModel"); // Changed from '../models/User'
const Candidate = require('../models/Candidate');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
require("dotenv").config(); // ✅ Ensure dotenv is loaded


exports.authenticate = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env file!");
      return res.status(500).json({ message: "Server error: JWT_SECRET not set" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    // req.user = decoded;
    
    // let user = await User.findById(decoded.userId);
    // let userType = 'User';

     // Try finding user by ID or userId field
     let user = null;
     let userType = 'User';
    
      // First try regular ID lookup
    try {
      user = await User.findOne({ userId: decoded.userId });
    } catch (err) {
      // If that fails, try finding by _id if it's a valid ObjectId
      try {
        user = await User.findById(decoded.userId);
      } catch (err) {
          // Ignore this error and continue to Candidate check
      }
    }
    if (!user) {
     // Try the same process for Candidate
     try {
      user = await Candidate.findOne({ userId: decoded.userId });
      userType = 'Candidate';
    } catch (err) {
      try {
        user = await Candidate.findById(decoded.userId);
        userType = 'Candidate';
      } catch (err) {
            // If all lookups fail, return not found
          return res.status(404).json({ 
            success: false,
            message: 'User not found' 
          });
        }
      }
    }
    // Attach user information to the request
    req.user = user;
    req.userType = userType; 
    req.decodedToken = decoded;

    console.log('User authenticated:', {
      id: user._id,
      name: user.name,
      email: user.email,
      userType
    });

    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// Role-based authorization (keeps existing functionality)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.decodedToken.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.decodedToken.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Improved protect middleware with detailed error handling
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Check if token exists in request
  console.log('Request headers:', req.headers);
  console.log('Request body:', req.body);
  
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    console.log('Token from Authorization header:', token?.substring(0, 20) + '...');
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
    console.log('Token from cookies:', token?.substring(0, 20) + '...');
  }
  
  if (!token) {
    console.log('No token found in request');
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in. Please log in to get access'
    });
  }
  
  // 2) Verify token
  try {
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is missing in environment variables!');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error'
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', JSON.stringify(decoded));
    
    // 3) Check if user exists - Try multiple fields from the token
    let currentUser;
    
    // Try different ID fields that might be in the token
    const possibleIdFields = ['id', 'userId', '_id', 'sub'];
    
    for (const field of possibleIdFields) {
      if (decoded[field]) {
        console.log(`Trying to find user by ${field}: ${decoded[field]}`);
        currentUser = await User.findById(decoded[field]);
        
        if (currentUser) {
          console.log(`User found using ${field}`);
          break;
        }
      }
    }
    
    // If still not found, check if it's a candidate
    if (!currentUser && decoded.userId) {
      console.log('Checking if it\'s a candidate:', decoded.userId);
      currentUser = await Candidate.findById(decoded.userId);
      if (currentUser) {
        req.userType = 'Candidate';
      }
    }
    
    if (!currentUser) {
      console.log('No user found for token payload:', decoded);
      return res.status(401).json({
        status: 'fail',
        message: 'User not found or no longer exists'
      });
    }
    
    // Set user on request object
    req.user = currentUser;
    req.userType = req.userType || 'User';
    req.decodedToken = decoded;
    
    console.log('User authenticated:', {
      id: currentUser._id,
      name: currentUser.name || currentUser.username,
      email: currentUser.email,
      userType: req.userType
    });
    
    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({
      status: 'fail',
      message: err.name === 'TokenExpiredError' ? 'Your token has expired' : 'Invalid token'
    });
  }
});

// Keep all your existing exports
module.exports = {
  authenticate:exports.authenticate,
  authorize: exports.authorize,
  protect: exports.protect
};

// module.exports = authenticate;
// module.exports.authorize = exports.authorize; // Export authorize function


// const jwt = require('jsonwebtoken');
// const User = require('../models/userModel');
// const Candidate = require('../models/Candidate');
// require('dotenv').config();

// // Main authentication middleware that works with both User and Candidate
// exports.authenticate = async (req, res, next) => {
//   const token = req.header('Authorization')?.split(' ')[1];

//   if (!token) {
//     return res.status(401).json({ 
//       success: false,
//       message: 'Unauthorized: No token provided' 
//     });
//   }

//   try {
//     if (!process.env.JWT_SECRET) {
//       console.error('JWT_SECRET is missing in .env file!');
//       return res.status(500).json({ 
//         success: false,
//         message: 'Server error: JWT_SECRET not set' 
//       });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
//     // Check if it's a User or Candidate
//     let user = await User.findById(decoded.userId);
//     let userType = 'User';
    
//     if (!user) {
//       user = await Candidate.findById(decoded.userId);
//       userType = 'Candidate';
      
//       if (!user) {
//         return res.status(404).json({ 
//           success: false,
//           message: 'User not found' 
//         });
//       }
//     }

//     // Attach user information to the request
//     req.user = user;
//     req.userType = userType; // This will help identify if it's User or Candidate
    
//     next();
//   } catch (error) {
//     console.error('JWT Verification Error:', error);
//     return res.status(401).json({ 
//       success: false,
//       message: 'Invalid or expired token' 
//     });
//   }
// };

// // Role-based authorization (keeps existing functionality)
// exports.authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `User role ${req.user.role} is not authorized to access this route`
//       });
//     }
//     next();
//   };
// };

// // Alias for protect to maintain backward compatibility
// exports.protect = exports.authenticate;