const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;
  
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      console.log('Auth middleware - Token received:', token ? 'Present' : 'Missing');

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      console.log('Auth middleware - Token decoded:', { id: decoded.id, role: decoded.role });

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        console.log('Auth middleware - User not found in database');
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      console.log('Auth middleware - User authenticated:', req.user.name, req.user.role);
      next();
    } catch (error) {
      console.error('Auth middleware - Token verification failed:', error.message);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    console.log('Auth middleware - No authorization header found');
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Access denied. User not authenticated.' 
      });
    }

    // Check if user's role or subRole matches any of the allowed roles
    const userRoles = [req.user.role, req.user.subRole].filter(Boolean);
    const hasAccess = roles.some(role => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}${req.user.subRole ? '/' + req.user.subRole : ''}` 
      });
    }

    next();
  };
};

module.exports = { protect, admin, authorize };