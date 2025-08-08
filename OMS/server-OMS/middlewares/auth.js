const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const Candidate = require("../models/Candidate");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(" ")[1];

      console.log(
        "Auth middleware - Token received:",
        token ? "Present" : "Missing"
      );

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key"
      );

      console.log("Auth middleware - Token decoded:", {
        id: decoded.id,
        userId: decoded.userId,
        candidateId: decoded.candidateId,
        userType: decoded.userType,
        role: decoded.role,
      });

      // Get user from the token - check based on userType
      let user;
      if (decoded.userType === "Candidate" || decoded.candidateId) {
        // Look in Candidates collection
        user = await Candidate.findById(decoded.id).select("-password");
        if (user) {
          // Add userType for consistency
          user.userType = "Candidate";
          console.log(
            "Auth middleware - Candidate found:",
            user.firstName + " " + user.lastName,
            user.role
          );
        }
      } else {
        // Look in Users collection first
        user = await User.findById(decoded.id).select("-password");
        if (user) {
          user.userType = "User";
          console.log("Auth middleware - User found:", user.name, user.role);
        }
      }

      // If not found in expected collection, try the other one
      if (!user) {
        if (decoded.userType === "Candidate" || decoded.candidateId) {
          // Try Users collection as fallback
          user = await User.findById(decoded.id).select("-password");
          if (user) {
            user.userType = "User";
            console.log(
              "Auth middleware - User found (fallback):",
              user.name,
              user.role
            );
          }
        } else {
          // Try Candidates collection as fallback
          user = await Candidate.findById(decoded.id).select("-password");
          if (user) {
            user.userType = "Candidate";
            console.log(
              "Auth middleware - Candidate found (fallback):",
              user.firstName + " " + user.lastName,
              user.role
            );
          }
        }
      }

      if (!user) {
        console.log("Auth middleware - User not found in any collection");
        return res
          .status(401)
          .json({ message: "Not authorized, user not found" });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error(
        "Auth middleware - Token verification failed:",
        error.message
      );
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  } else {
    console.log("Auth middleware - No authorization header found");
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(401).json({ message: "Not authorized as an admin" });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Access denied. User not authenticated.",
      });
    }

    // Check if user's role or subRole matches any of the allowed roles
    const userRoles = [req.user.role, req.user.subRole].filter(Boolean);
    const hasAccess = roles.some((role) => userRoles.includes(role));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required roles: ${roles.join(
          ", "
        )}. Your role: ${req.user.role}${
          req.user.subRole ? "/" + req.user.subRole : ""
        }`,
      });
    }

    next();
  };
};

module.exports = { protect, admin, authorize };
