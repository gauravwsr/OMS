const axios = require("axios");

const testLogin = async () => {
  try {
    console.log("🧪 Testing login with credentials...");

    const response = await axios.post("http://localhost:5001/users/login", {
      email: "gaurav@tars.co.in",
      password: "Tars@2001",
    });

    console.log("✅ Login successful!");
    console.log("Response:", response.data);
  } catch (error) {
    console.log("❌ Login failed");
    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Error:", error.response.data);
    } else {
      console.log("Error:", error.message);
    }
  }
};

testLogin();
