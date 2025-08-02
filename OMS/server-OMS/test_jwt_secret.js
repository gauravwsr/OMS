const jwt = require("jsonwebtoken");
require("dotenv").config();

// Check what JWT_SECRET is being used
console.log("Environment JWT_SECRET:", process.env.JWT_SECRET);
console.log(
  "Fallback JWT_SECRET (from userController):",
  process.env.JWT_SECRET || "yourSuperSecretKey"
);

// Test token creation and verification
const testPayload = {
  id: "test123",
  userId: 1234,
  email: "test@example.com",
  role: "Employee",
  name: "Test User",
};

// Create token using the same logic as loginUser
const JWT_SECRET_LOGIN = process.env.JWT_SECRET || "yourSuperSecretKey";
const token = jwt.sign(testPayload, JWT_SECRET_LOGIN);

console.log("Created token:", token);

// Verify token using the same logic as authMiddleware
try {
  const JWT_SECRET_AUTH = process.env.JWT_SECRET;
  if (!JWT_SECRET_AUTH) {
    console.log("❌ AUTH ERROR: JWT_SECRET is missing in .env file!");
  } else {
    const decoded = jwt.verify(token, JWT_SECRET_AUTH);
    console.log("✅ Token verification successful:", decoded);
  }
} catch (error) {
  console.log("❌ Token verification failed:", error.message);
}

// Also test if the secrets are identical
console.log(
  "Are secrets identical?",
  JWT_SECRET_LOGIN === process.env.JWT_SECRET
);
