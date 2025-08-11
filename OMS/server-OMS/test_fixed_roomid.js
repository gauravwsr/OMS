// Test the fixed meeting creation with proper roomId
const axios = require("axios");

async function testMeetingCreationFixed() {
  console.log("🧪 Testing fixed meeting creation...");

  try {
    // Test data matching what the React app would send
    const meetingData = {
      roomName: "Test Fixed Meeting",
      roomType: "global",
      inviteUserIds: [],
      meetingSettings: {
        enableChat: true,
        enableKnocking: true,
        startVideoOff: false,
        startAudioOff: false,
      },
    };

    console.log(
      "Sending request with data:",
      JSON.stringify(meetingData, null, 2)
    );

    // This will still fail due to auth, but we should get a different error
    // (401 unauthorized instead of 400 validation error)
    const response = await axios.post(
      "http://146.190.165.62:5001/api/meetings/create",
      meetingData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Unexpected success:", response.data);
  } catch (error) {
    if (error.response) {
      console.log("📋 Status:", error.response.status);
      console.log("📋 Response:", JSON.stringify(error.response.data, null, 2));

      if (error.response.status === 401) {
        console.log("✅ SUCCESS! The roomId validation error is fixed!");
        console.log(
          "   Now getting expected 401 (auth required) instead of 400 (validation error)"
        );
      } else if (
        error.response.status === 400 &&
        error.response.data.error &&
        error.response.data.error.includes("roomId")
      ) {
        console.log("❌ STILL BROKEN: roomId validation error persists");
      } else {
        console.log("🤔 Different error - may need investigation");
      }
    } else {
      console.error("❌ Network error:", error.message);
    }
  }
}

testMeetingCreationFixed();
