const axios = require("axios");

const testAttendanceAPI = async () => {
  try {
    // First login to get token
    console.log("🔑 Logging in to get authentication token...");
    const loginResponse = await axios.post(
      "http://146.190.165.62:5001/users/login",
      {
        email: "gaurav@tars.co.in",
        password: "Tars@2001",
      }
    );

    const token = loginResponse.data.token;
    console.log("✅ Login successful! Token obtained.");

    // Test attendance endpoints with token
    console.log("\n🧪 Testing attendance endpoints...");

    // Test today's attendance
    try {
      console.log("1. Testing /api/attendance/today...");
      const todayResponse = await axios.get(
        "http://146.190.165.62:5001/api/attendance/today",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ Today attendance:", todayResponse.data);
    } catch (error) {
      console.log(
        "❌ Today attendance failed:",
        error.response?.status,
        error.response?.data?.message
      );
    }

    // Test attendance history
    try {
      console.log("\n2. Testing /api/attendance/history...");
      const historyResponse = await axios.get(
        "http://146.190.165.62:5001/api/attendance/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log("✅ Attendance history:", historyResponse.data);
    } catch (error) {
      console.log(
        "❌ Attendance history failed:",
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

testAttendanceAPI();
