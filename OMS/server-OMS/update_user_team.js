const mongoose = require("mongoose");
const User = require("./models/userModel");

async function checkAndUpdateUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/Office-Management"
    );
    console.log("Connected to MongoDB");

    // Find the user
    const user = await User.findById("68836be24655ab95c47555ad");
    console.log("Current user data:", JSON.stringify(user, null, 2));

    if (user) {
      // Update the user's team
      user.team = "Tars"; // Set the team based on what they're trying to create
      await user.save();
      console.log("✅ User team updated to:", user.team);

      // Verify the update
      const updatedUser = await User.findById("68836be24655ab95c47555ad");
      console.log("Updated user team:", updatedUser.team);
    } else {
      console.log("❌ User not found");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
  }
}

checkAndUpdateUser();
