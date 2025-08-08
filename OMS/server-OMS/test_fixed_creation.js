// Test room creation with plan-appropriate settings
const DAILY_API_KEY =
  "4e0988f781f1d0eda3c64fbdda8465d5282923b87db26911019bfe637b57c1aa";
const DAILY_API_URL = "https://api.daily.co/v1/rooms";

async function testFixedRoomCreation() {
  console.log("🧪 Testing room creation with fixed settings...");

  try {
    const response = await fetch(DAILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `oms-test-fixed-${Date.now()}`,
        privacy: "public",
        properties: {
          enable_chat: true,
          enable_knocking: true,
          start_video_off: false,
          start_audio_off: false,
          // Removed max_participants as it's not supported
        },
      }),
    });

    console.log("Response Status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ API Error Response:", errorText);
      return false;
    }

    const data = await response.json();
    console.log("✅ Room created successfully!");
    console.log("Room URL:", data.url);
    console.log("Room Name:", data.name);

    // Clean up the test room
    console.log("🧹 Cleaning up test room...");
    await fetch(`${DAILY_API_URL}/${data.name}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });
    console.log("✅ Test room cleaned up");

    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
}

testFixedRoomCreation();
