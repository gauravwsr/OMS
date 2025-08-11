// Test meeting creation API endpoint directly
const axios = require("axios");

async function testMeetingCreation() {
  console.log("🧪 Testing meeting creation API...");

  try {
    // First, get a valid auth token (you'll need to replace this with a real token)
    // For now, let's test without auth to see the exact error
    const meetingData = {
      roomName: "Test Meeting",
      roomType: "global",
      meetingSettings: {
        enableChat: true,
        enableKnocking: true,
        startVideoOff: false,
        startAudioOff: false,
      },
    };

    console.log("Sending request to create meeting...");
    console.log("Data:", JSON.stringify(meetingData, null, 2));

    const response = await axios.post(
      "http://146.190.165.62:5001/api/meetings/create",
      meetingData,
      {
        headers: {
          "Content-Type": "application/json",
          // Note: This will fail without auth, but we can see the exact error
        },
      }
    );

    console.log("✅ Meeting created successfully!");
    console.log("Response:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("📋 API Response Status:", error.response.status);
      console.log(
        "📋 API Response Data:",
        JSON.stringify(error.response.data, null, 2)
      );

      if (error.response.status === 401) {
        console.log("ℹ️ This is expected - we need authentication token");
        console.log("✅ The endpoint is working, just needs proper auth");
      } else {
        console.log("❌ Unexpected error status");
      }
    } else {
      console.error("❌ Network or other error:", error.message);
    }
  }
}

testMeetingCreation();
