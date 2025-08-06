// Test script to verify axios calls work correctly after fixes
const axios = require("axios");

const testAxiosCallsFixed = async () => {
  try {
    // First login to get token
    console.log("🔑 Logging in to get authentication token...");
    const loginResponse = await axios.post(
      "http://localhost:5001/users/login",
      {
        email: "gaurav@tars.co.in",
        password: "Tars@2001",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful! Token obtained.");

    // Test the fixed axios calls
    console.log("\n🧪 Testing fixed axios calls...");

    // Test 1: Attendance History (this was broken before)
    try {
      console.log("1. Testing attendance history with proper axios syntax...");
      const historyResponse = await axios.get(
        "http://localhost:5001/api/attendance/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(
        "✅ Attendance history success:",
        historyResponse.data.message
      );
    } catch (error) {
      console.log(
        "❌ Attendance history failed:",
        error.response?.status,
        error.response?.data?.message
      );
    }

    // Test 2: Today's Attendance (this was broken before)
    try {
      console.log(
        "\n2. Testing today's attendance with proper axios syntax..."
      );
      const todayResponse = await axios.get(
        "http://localhost:5001/api/attendance/today",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ Today attendance success:", todayResponse.data.message);
    } catch (error) {
      console.log(
        "❌ Today attendance failed:",
        error.response?.status,
        error.response?.data?.message
      );
    }

    // Test 3: Mark Attendance (this was broken before)
    try {
      console.log(
        "\n3. Testing attendance marking with proper axios syntax..."
      );
      const markResponse = await axios.post(
        "http://localhost:5001/api/attendance/mark",
        {
          method: "manual",
          timestamp: new Date().toISOString(),
          attendance_type: "check_in",
          employeeName: "Test User",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Mark attendance success:", markResponse.data.message);
    } catch (error) {
      console.log(
        "❌ Mark attendance failed:",
        error.response?.status,
        error.response?.data?.message
      );
    }
  } catch (error) {
    console.log("❌ Test failed");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
};

testAxiosCallsFixed();
