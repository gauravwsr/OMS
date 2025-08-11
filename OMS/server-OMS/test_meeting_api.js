const axios = require("axios");

async function testMeetingAPI() {
  try {
    console.log("Testing Meeting API...");

    // First, let's test login to get a token
    const loginResponse = await axios.post(
      "http://146.190.165.62:5001/api/auth/login",
      {
        email: "test@example.com", // You'll need to use a real user's credentials
        password: "password123",
      }
    );

    console.log("Login successful, token received");
    const token = loginResponse.data.token;

    // Now test the meeting creation
    const meetingResponse = await axios.post(
      "http://146.190.165.62:5001/api/meetings/create",
      {
        roomName: "Test Meeting",
        roomType: "team",
        teamName: "Engineering",
        meetingSettings: {
          enableChat: true,
          enableKnocking: true,
          startVideoOff: false,
          startAudioOff: false,
          maxParticipants: 10,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Meeting creation successful!");
    console.log("Meeting data:", JSON.stringify(meetingResponse.data, null, 2));
  } catch (error) {
    console.error("❌ Error testing meeting API:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Response:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testMeetingAPI();
