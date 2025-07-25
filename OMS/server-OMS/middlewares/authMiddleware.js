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
    //     // Attach user information to the request
    req.user = user;
    req.userType = userType; 
    req.decodedToken = decoded;

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

// Add this to your authMiddleware file (after the existing code)
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it's there
  let token;
  const authHeader = req.headers.authorization || req.header('Authorization'); 
  if (authHeader && authHeader.startsWith('Bearer')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verify token using your existing authenticate function
  // We'll wrap it in a way that works with the existing code
  const authReq = { 
    ...req, 
    header: (name) => req.headers[name.toLowerCase()] 
  };
  const authRes = {
    status: (code) => ({
      json: (data) => {
        if (code >= 400) {
          throw new AppError(data.message || 'Authentication failed', code);
        }
        return data;
      }
    })
  };

  try {
    // Use your existing authenticate function
    await authenticate(authReq, authRes, next);
    
    // 3) Check if user still exists (already handled in authenticate)
    // 4) Check if user changed password after the token was issued (you can add this if needed)
    
    // Grant access to protected route
    next();
  } catch (err) {
    return next(err);
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