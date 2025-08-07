// Script to list and clean up Daily.co rooms
const DAILY_API_KEY =
  "4e0988f781f1d0eda3c64fbdda8465d5282923b87db26911019bfe637b57c1aa";
const DAILY_API_URL = "https://api.daily.co/v1/rooms";

async function listRooms() {
  console.log("🔍 Listing existing Daily.co rooms...");

  try {
    const response = await fetch(DAILY_API_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log("❌ Error listing rooms:", errorText);
      return [];
    }

    const data = await response.json();
    console.log(`📊 Found ${data.data.length} rooms`);

    // Show first few rooms
    data.data.slice(0, 10).forEach((room, index) => {
      console.log(
        `${index + 1}. ${room.name} (${room.url}) - Created: ${new Date(
          room.created_at
        ).toLocaleString()}`
      );
    });

    if (data.data.length > 10) {
      console.log(`... and ${data.data.length - 10} more rooms`);
    }

    return data.data;
  } catch (error) {
    console.error("❌ Error listing rooms:", error.message);
    return [];
  }
}

async function deleteRoom(roomName) {
  console.log(`🗑️ Deleting room: ${roomName}`);

  try {
    const response = await fetch(`${DAILY_API_URL}/${roomName}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Error deleting room ${roomName}:`, errorText);
      return false;
    }

    console.log(`✅ Successfully deleted room: ${roomName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error deleting room ${roomName}:`, error.message);
    return false;
  }
}

async function cleanupTestRooms() {
  console.log("=== DAILY.CO ROOM CLEANUP ===");

  const rooms = await listRooms();

  if (rooms.length === 0) {
    console.log("No rooms found or error accessing rooms");
    return;
  }

  // Find test rooms (those with "test" in the name or very old rooms)
  const testRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes("test") ||
      room.name.toLowerCase().includes("temp") ||
      room.name.toLowerCase().includes("demo")
  );

  console.log(`\n🧹 Found ${testRooms.length} test/demo rooms to clean up`);

  if (testRooms.length > 0) {
    console.log("Deleting test rooms...");
    for (const room of testRooms.slice(0, 20)) {
      // Delete max 20 at a time
      await deleteRoom(room.name);
      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // If still need more space, delete oldest rooms
  const remainingRooms = rooms.length - testRooms.length;
  if (remainingRooms >= 45) {
    // Leave some buffer
    console.log("\n🧹 Still too many rooms, deleting oldest ones...");
    const oldestRooms = rooms
      .filter((room) => !testRooms.includes(room))
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .slice(0, 10); // Delete 10 oldest

    for (const room of oldestRooms) {
      await deleteRoom(room.name);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  console.log("\n✅ Cleanup completed!");

  // Test creating a new room
  console.log("\n🧪 Testing room creation after cleanup...");
  try {
    const response = await fetch(DAILY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DAILY_API_KEY}`,
      },
      body: JSON.stringify({
        name: `test-cleanup-${Date.now()}`,
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

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Room creation test successful!");
      console.log("New room URL:", data.url);

      // Clean up the test room
      await deleteRoom(data.name);
    } else {
      const errorText = await response.text();
      console.log("❌ Room creation still failing:", errorText);
    }
  } catch (error) {
    console.error("❌ Room creation test error:", error.message);
  }
}

cleanupTestRooms();
