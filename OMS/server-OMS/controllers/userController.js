const User = require("../models/userModel"); // Changed from '../models/User'
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Secret key for JWT (store securely in .env)
const JWT_SECRET = process.env.JWT_SECRET || "yourSuperSecretKey";

// Valid roles for users
const validRoles = ["Super_Admin", "Admin", "Employee", "Intern"];

// Signup Controller
const registerUser = async (req, res) => {
  console.log("=== SIGNUP REQUEST ===");
  console.log("Request body:", req.body);

  const {
    // Basic Information
    firstName,
    lastName,
    name,
    email,
    password,
    role,
    subRole,
    // Personal Information
    phoneNumber,
    emergencyContact,
    dateOfBirth,
    gender,
    address,
    city,
    state,
    zipCode,
    // Professional Information
    employeeId,
    department,
    position,
    specialization,
    joiningDate,
    qualification,
    experience,
    salary,
    // Role Information
    hrRole,
    hrSubRole: hrSubRoleField,
    hrSubSubRole,
  } = req.body;

  // Handle name field for backward compatibility
  const fullName = name || `${firstName} ${lastName}`.trim();

  // Check if all required fields are provided
  console.log("Checking required fields:", { fullName, email, password, role });
  if (!fullName || !email || !password || !role) {
    console.log("Missing required fields!");
    return res.status(400).json({ msg: "Please enter all required fields" });
  }

  // Validate role if provided
  if (role && !validRoles.includes(role)) {
    return res.status(400).json({
      msg: "Invalid role provided. Allowed roles: Super_Admin, Admin, Employee, Intern",
    });
  }

  try {
    // Check if the user already exists
    console.log("Checking if user exists:", email);
    let user = await User.findOne({ email });
    if (user) {
      console.log("User already exists!");
      return res.status(400).json({ msg: "User already exists" });
    }

    // Check if Super Admin with specific subrole already exists
    if (role === "Super_Admin") {
      const existingSubRole = await User.findOne({
        role: "Super_Admin",
        subRole: subRole,
      });
      if (existingSubRole) {
        return res.status(400).json({
          msg: `Super Admin with ${subRole} position already exists. Only one account per position is allowed.`,
          error: "SUPER_ADMIN_SUBROLE_EXISTS",
        });
      }
    }

    // Create new user with all form data
    user = new User({
      name: fullName,
      email,
      password,
      role,
      subRole,
      // Personal Information
      phoneNumber,
      emergencyContact,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      gender,
      address,
      city,
      state,
      zipCode,
      // Professional Information
      employeeId,
      department,
      position,
      specialization,
      joiningDate: joiningDate ? new Date(joiningDate) : undefined,
      qualification,
      experience,
      salary: salary ? Number(salary) : undefined,
      // Role Information (for backward compatibility)
      organizationalDepartment: hrRole || department,
      organizationalPosition: hrSubRoleField || position,
      organizationalSpecialization: hrSubSubRole || specialization,
    });

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Generate a 4-digit random ID
    user.userId = Math.floor(1000 + Math.random() * 9000);

    // Save user to DB
    console.log("Attempting to save user:", {
      name: user.name,
      email: user.email,
      role: user.role,
    });
    await user.save();
    console.log("User saved successfully!");

    res.status(201).json({
      msg: "User registered successfully",
      userId: user.userId,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
    });
  } catch (error) {
    console.error("Signup error:", error.message);
    console.error("Full error:", error);
    res.status(500).send("Server error");
  }
};

// Get all users
const getUser = async (req, res) => {
  try {
    const users = await User.find(); // Fetch all users
    res.status(200).json(users);
  } catch (err) {
    res.status(500).send("Error retrieving users");
  }
};

// Login Controller
const loginUser = async (req, res) => {
  console.log("🔐 Login attempt:", req.body);
  const { email, password } = req.body;

  // Check if all fields are provided
  if (!email || !password) {
    console.log("❌ Missing fields");
    return res.status(400).json({ msg: "Please enter all fields" });
  }

  try {
    // Check if user exists
    console.log("🔍 Looking for user with email:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ msg: "Invalid credentials!" });
    }
    console.log("✅ User found:", user.name);

    // Check if password matches
    console.log("🔑 Checking password...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔑 Password match:", isMatch);
    if (!isMatch) {
      console.log("❌ Password mismatch");
      return res.status(400).json({ msg: "Invalid credentials!!" });
    }

    // Generate JWT token with login timestamp
    const loginTime = new Date().toISOString(); // Store login time in ISO format
    const payload = {
      id: user._id, // Add MongoDB ObjectId
      userId: user.userId,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      name: user.name, // Add user name
      loginTime,
    };

    // Create a token without expiration
    const token = jwt.sign(payload, JWT_SECRET);

    // Update last login time in DB
    user.lastLogin = loginTime;
    await user.save();

    res.status(200).json({
      msg: "Login successful",
      userId: user.userId,
      email: user.email,
      role: user.role,
      subRole: user.subRole,
      token, // Include token in the response
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Server error");
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json({ user });
  } catch (error) {
    res.status(500).json({ msg: "Server error" });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUser,
  getCurrentUser,
};
