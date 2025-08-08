const mongoose = require("mongoose");
const User = require("./models/userModel");

async function listUsers() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/office-management",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log("Connected to MongoDB");

    const users = await User.find({})
      .select("name email role subRole team")
      .limit(5);
    console.log("Users in database:");
    users.forEach((user) => {
      console.log(
        `- ${user.name} (${user.email}) - Role: ${user.role}${
          user.subRole ? "/" + user.subRole : ""
        } - Team: ${user.team || "N/A"}`
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

listUsers();
