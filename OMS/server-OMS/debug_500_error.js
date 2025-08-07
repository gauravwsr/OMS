// Test Daily.co API to see if it's working
const axios = require("axios");

const DAILY_API_KEY =
  "4e0988f781f1d0eda3c64fbdda8465d5282923b87db26911019bfe637b57c1aa";
const DAILY_API_URL = "https://api.daily.co/v1/rooms";

async function testDailyAPI() {
  console.log("🧪 Testing Daily.co API...");

  try {
    const response = await fetch(DAILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `test-room-${Date.now()}`,
        privacy: "public",
        properties: {
          enable_chat: true,
          enable_knocking: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 50,
        },
      }),
    });

    console.log("Daily.co Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Daily.co API Error Response:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("Daily.co Response:", JSON.stringify(data, null, 2));

    if (data.url) {
      console.log("✅ Daily.co API is working! Room URL:", data.url);
      return true;
    } else {
      console.log("❌ Daily.co API failed - no URL returned");
      return false;
    }
  } catch (error) {
    console.error("❌ Daily.co API Error:", error.message);
    return false;
  }
}

// Also test database connection
async function testDatabase() {
  console.log("🧪 Testing Database Models...");

  try {
    const mongoose = require("mongoose");
    const MeetingRoom = require("./models/meetingRoomModel");

    // Connect to DB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/Office-Management"
    );
    console.log("✅ Database connected");

    // Test model creation (without saving)
    const testRoom = new MeetingRoom({
      roomName: "Test Room",
      roomUrl: "https://test.daily.co/test",
      createdBy: "507f1f77bcf86cd799439011", // Sample ObjectId
      createdByName: "Test User",
      createdByRole: "Employee",
      roomType: "team",
      teamName: "Test Team",
      meetingSettings: {
        enableChat: true,
        enableKnocking: true,
        startVideoOff: false,
        startAudioOff: false,
        maxParticipants: 50,
      },
      accessRules: {
        allowedRoles: ["Employee"],
        restrictToTeam: true,
        requireInvite: false,
      },
    });

    console.log("✅ MeetingRoom model created successfully");

    // Test methods
    if (typeof testRoom.generateInviteToken === "function") {
      console.log("✅ generateInviteToken method exists");
    } else {
      console.log("❌ generateInviteToken method missing");
    }

    if (typeof testRoom.addParticipant === "function") {
      console.log("✅ addParticipant method exists");
    } else {
      console.log("❌ addParticipant method missing");
    }

    await mongoose.disconnect();
    console.log("✅ Database test completed");
    return true;
  } catch (error) {
    console.error("❌ Database Error:", error.message);
    return false;
  }
}

async function runTests() {
  console.log("=== DEBUGGING MEETING CREATION 500 ERROR ===");

  const dailyWorking = await testDailyAPI();
  const dbWorking = await testDatabase();

  console.log("\n=== TEST RESULTS ===");
  console.log("Daily.co API:", dailyWorking ? "✅ Working" : "❌ Failed");
  console.log("Database Models:", dbWorking ? "✅ Working" : "❌ Failed");

  if (!dailyWorking) {
    console.log(
      "\n🔍 The issue might be with Daily.co API access or authentication"
    );
  }

  if (!dbWorking) {
    console.log("\n🔍 The issue might be with database models or connection");
  }

  if (dailyWorking && dbWorking) {
    console.log(
      "\n🔍 Both APIs seem to work - the issue might be in the controller logic"
    );
  }
}

runTests();
