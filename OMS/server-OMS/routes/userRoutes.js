const express = require("express");
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUser,
} = require("../controllers/userController");
const User = require("../models/userModel"); // Mongoose User model
const Position = require("../models/positionModel"); // Position model
// const authenticate = require("../middlewares/authMiddleware"); // Authentication middleware
const authMiddleware = require("../middlewares/authMiddleware");

// GET /team-leads - Get all team leads (for dropdowns etc)
router.get("/team-leads", async (req, res) => {
  try {
    const teamLeads = await User.find({
      $or: [{ subRole: "Team Lead" }, { subRole: "Team Leader" }],
    }).select(
      "name email specialization availability experience skills currentProjects"
    );
    res.json({ success: true, count: teamLeads.length, data: teamLeads });
  } catch (error) {
    console.error("Error fetching team leads:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// POST /signup - Register a new user
router.post("/signup", registerUser);

// GET /check-super-admin - Check if Super Admin exists
router.get("/check-super-admin", async (req, res) => {
  try {
    const superAdmin = await User.findOne({ role: "Super_Admin" });
    res.json({ exists: !!superAdmin });
  } catch (error) {
    console.error("Error checking Super Admin:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /check-super-admin-subrole - Check if specific Super Admin subrole exists
router.get("/check-super-admin-subrole/:subRole", async (req, res) => {
  try {
    const { subRole } = req.params;
    const existingSubRole = await User.findOne({
      role: "Super_Admin",
      subRole: subRole,
    });
    res.json({ exists: !!existingSubRole });
  } catch (error) {
    console.error("Error checking Super Admin subrole:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /available-super-admin-subroles - Get available Super Admin subroles (updated to use new endpoint)
router.get("/available-super-admin-subroles", async (req, res) => {
  try {
    // Redirect to the new comprehensive endpoint
    const coreRoles = ["CEO", "COO", "CFO"];

    // Get custom roles from Position collection
    const customRoles = await Position.find({
      category: "Super_Admin",
      isActive: true,
    }).select("name");

    const customRoleNames = customRoles.map((role) => role.name);

    // Combine core and custom roles
    const allSubRoles = [...coreRoles, ...customRoleNames];

    const existingSubRoles = await User.find({
      role: "Super_Admin",
    }).select("subRole");

    const occupiedSubRoles = existingSubRoles.map((user) => user.subRole);
    const availableSubRoles = allSubRoles.filter(
      (subRole) => !occupiedSubRoles.includes(subRole)
    );

    res.json({
      availableSubRoles,
      occupiedSubRoles,
      allFilled: availableSubRoles.length === 0,
    });
  } catch (error) {
    console.error("Error getting available Super Admin subroles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/", getUser);

// POST /login - Login user
router.post("/login", loginUser);

// ✅ Get Logged-in User Data
router.get("/me", authMiddleware.authenticate, async (req, res) => {
  try {
    // Find user using `userId` stored in JWT token
    const user = await User.findOne({ userId: req.user.userId }).select(
      "-password"
    ); // Exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user); // Send full user data
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
});

// ✅ Get All Users (If Needed)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET /all-users - Alternative endpoint for analytics (same functionality as /users)
router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
});

// GET /positions - Get all positions
router.get("/positions", async (req, res) => {
  try {
    const positions = await Position.find({ isActive: true });

    // Group positions by category
    const positionsByCategory = {
      Super_Admin: [],
      Admin: [],
      Employee: [],
      Intern: [],
    };

    positions.forEach((position) => {
      if (positionsByCategory[position.category]) {
        positionsByCategory[position.category].push(position.name);
      }
    });

    res.json({ positions: positionsByCategory });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /add-position - Add new position (CEO only)
router.post("/add-position", authMiddleware.authenticate, async (req, res) => {
  try {
    const { position, category } = req.body;
    const userId = req.user.userId;

    // Check if user is CEO
    const user = await User.findOne({ userId });
    if (!user || user.role !== "Super_Admin" || user.subRole !== "CEO") {
      return res
        .status(403)
        .json({ message: "Only CEO can add new positions" });
    }

    if (!position || !category) {
      return res
        .status(400)
        .json({ message: "Position name and category are required" });
    }

    // Check if position already exists
    const existingPosition = await Position.findOne({
      name: position.trim(),
      category: category,
    });

    if (existingPosition) {
      return res
        .status(400)
        .json({ message: "Position already exists in this category" });
    }

    // Create new position
    const newPosition = new Position({
      name: position.trim(),
      category: category,
      createdBy: userId,
    });

    await newPosition.save();

    res.status(200).json({
      message: "Position added successfully",
      position: newPosition,
    });
  } catch (error) {
    console.error("Error adding position:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /add-superadmin-subrole - Add new Super Admin subrole (CEO only)
router.post(
  "/add-superadmin-subrole",
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      const { subRole } = req.body;
      const userId = req.user.userId;

      // Check if user is CEO
      const user = await User.findOne({ userId });
      if (!user || user.role !== "Super_Admin" || user.subRole !== "CEO") {
        return res
          .status(403)
          .json({ message: "Only CEO can add new Super Admin sub-roles" });
      }

      if (!subRole) {
        return res.status(400).json({ message: "Sub-role name is required" });
      }

      // Check if subrole already exists in user model enum or database
      const existingUser = await User.findOne({
        role: "Super_Admin",
        subRole: subRole.trim(),
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Super Admin sub-role already exists" });
      }

      // For now, we'll store custom subroles in a separate collection or extend the enum
      // You might want to create a separate SuperAdminRoles collection
      // For this implementation, we'll add it to the Position model with a special category
      const newSubRole = new Position({
        name: subRole.trim(),
        category: "Super_Admin",
        createdBy: userId,
      });

      await newSubRole.save();

      res.status(200).json({
        message: "Super Admin sub-role added successfully",
        subRole: newSubRole,
      });
    } catch (error) {
      console.error("Error adding Super Admin sub-role:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// DELETE /delete-superadmin-subrole - Delete Super Admin subrole (CEO only)
router.delete(
  "/delete-superadmin-subrole/:subRole",
  authMiddleware.authenticate,
  async (req, res) => {
    try {
      const { subRole } = req.params;
      const userId = req.user.userId;

      // Check if user is CEO
      const user = await User.findOne({ userId });
      if (!user || user.role !== "Super_Admin" || user.subRole !== "CEO") {
        return res
          .status(403)
          .json({ message: "Only CEO can delete Super Admin sub-roles" });
      }

      // Prevent deletion of core roles
      const coreRoles = ["CEO", "COO", "CFO"];
      if (coreRoles.includes(subRole)) {
        return res.status(400).json({
          message: "Cannot delete core Super Admin roles (CEO, COO, CFO)",
        });
      }

      // Check if any user currently has this subrole
      const userWithSubRole = await User.findOne({
        role: "Super_Admin",
        subRole: subRole,
      });

      if (userWithSubRole) {
        return res.status(400).json({
          message:
            "Cannot delete sub-role. A user is currently assigned to this position.",
          userEmail: userWithSubRole.email,
        });
      }

      // Delete from Position collection
      const deletedPosition = await Position.findOneAndDelete({
        name: subRole,
        category: "Super_Admin",
      });

      if (!deletedPosition) {
        return res.status(404).json({ message: "Sub-role not found" });
      }

      res.status(200).json({
        message: "Super Admin sub-role deleted successfully",
        deletedSubRole: subRole,
      });
    } catch (error) {
      console.error("Error deleting Super Admin sub-role:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// GET /superadmin-subroles - Get all Super Admin subroles including custom ones
router.get("/superadmin-subroles", async (req, res) => {
  try {
    // Core roles that are always available
    const coreRoles = ["CEO", "COO", "CFO"];

    // Get custom roles from Position collection
    const customRoles = await Position.find({
      category: "Super_Admin",
      isActive: true,
    }).select("name");

    const customRoleNames = customRoles.map((role) => role.name);

    // Combine core and custom roles
    const allRoles = [...coreRoles, ...customRoleNames];

    // Get occupied roles
    const existingSubRoles = await User.find({
      role: "Super_Admin",
    }).select("subRole");

    const occupiedSubRoles = existingSubRoles.map((user) => user.subRole);
    const availableSubRoles = allRoles.filter(
      (subRole) => !occupiedSubRoles.includes(subRole)
    );

    res.json({
      allRoles,
      coreRoles,
      customRoles: customRoleNames,
      availableSubRoles,
      occupiedSubRoles,
      allFilled: availableSubRoles.length === 0,
    });
  } catch (error) {
    console.error("Error getting Super Admin subroles:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
