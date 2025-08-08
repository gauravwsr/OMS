const fetch = require("node-fetch");

const DAILY_API_KEY =
  "4e0988f781f1d0eda3c64fbdda8465d5282923b87db26911019bfe637b57c1aa";
const DAILY_API_URL = "https://api.daily.co/v1/rooms";

async function testDailyAPI() {
  try {
    console.log("Testing Daily.co API...");

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

    const data = await response.json();
    console.log("Daily.co Response Status:", response.status);
    console.log("Daily.co Response:", JSON.stringify(data, null, 2));

    if (data.url) {
      console.log("✅ Daily.co API is working! Room URL:", data.url);
    } else {
      console.log("❌ Daily.co API failed:", data.error || "Unknown error");
    }
  } catch (error) {
    console.error("❌ Error testing Daily.co API:", error);
  }
}

testDailyAPI();
