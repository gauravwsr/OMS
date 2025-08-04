// Test script for attendance backend functionality
const mongoose = require("mongoose");
require("dotenv").config();

// Import models and services
const Attendance = require("./models/attendanceModel");
const User = require("./models/userModel");
const AttendanceService = require("./utils/attendanceService");

// MongoDB connection string - update this with your actual connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://142.93.213.81:27017/oms";

async function testAttendanceBackend() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    // Test 1: Check models
    console.log("\n📋 Testing Models...");
    const attendanceCount = await Attendance.countDocuments();
    console.log(`📊 Total attendance records: ${attendanceCount}`);

    // Test 2: Create a test attendance record
    console.log("\n🧪 Testing AttendanceService...");

    // Mock user data (you may need to adjust based on your User model)
    const testUserId = new mongoose.Types.ObjectId();

    const testAttendanceData = {
      userId: testUserId,
      method: "manual",
      status: "present",
      systemInfo: {
        userAgent: "Test Script",
        ipAddress: "127.0.0.1",
        platform: "Node.js",
        browser: "Test",
      },
      location: "Test Office",
      notes: "Backend integration test",
      metadata: {
        source: "test_script",
        apiVersion: "1.0",
      },
    };

    const result = await AttendanceService.createAttendanceRecord(
      testAttendanceData
    );

    if (result.success) {
      console.log("✅ Test attendance record created successfully");
      console.log("📝 Record ID:", result.data._id);

      // Clean up - delete the test record
      await Attendance.findByIdAndDelete(result.data._id);
      console.log("🗑️ Test record cleaned up");
    } else {
      console.log("❌ Failed to create test record:", result.error);
    }

    // Test 3: Check analytics
    console.log("\n📈 Testing Analytics...");
    const analyticsResult = await AttendanceService.getAttendanceAnalytics();

    if (analyticsResult.success) {
      console.log("✅ Analytics working");
      console.log("📊 Overview:", analyticsResult.data.overview);
    } else {
      console.log("❌ Analytics failed:", analyticsResult.error);
    }

    console.log("\n🎉 All tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run tests
console.log("🚀 Starting Attendance Backend Integration Test...");
testAttendanceBackend();
