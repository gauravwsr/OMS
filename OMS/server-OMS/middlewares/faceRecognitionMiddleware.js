const axios = require("axios");

// Face Recognition Server Configuration
const FACE_RECOGNITION_SERVER = {
  baseURL: "http://142.93.213.81:5001",
  timeout: 30000,
};

// Middleware to validate face recognition data
const validateFaceRecognitionData = (req, res, next) => {
  const { method } = req.body;

  if (method === "face_recognition") {
    const { confidence, recognizedName, faceRecognitionDetails } = req.body;

    // Validate required face recognition fields
    if (!confidence) {
      return res.status(400).json({
        message: "Confidence value is required for face recognition attendance",
      });
    }

    if (!recognizedName) {
      return res.status(400).json({
        message: "Recognized name is required for face recognition attendance",
      });
    }

    // Validate confidence format (should be percentage)
    const confidenceMatch = confidence.match(/(\d+\.?\d*)%/);
    if (!confidenceMatch) {
      return res.status(400).json({
        message: "Invalid confidence format. Expected format: 'XX.X%'",
      });
    }

    const confidenceValue = parseFloat(confidenceMatch[1]);
    if (confidenceValue < 0 || confidenceValue > 100) {
      return res.status(400).json({
        message: "Confidence value must be between 0 and 100",
      });
    }

    // Check if recognized name matches logged-in user (case-insensitive)
    const userName = req.user.name || req.user.fullName;
    if (recognizedName.toLowerCase() !== userName.toLowerCase()) {
      return res.status(403).json({
        message:
          "Security Alert: Recognized face does not match logged-in user",
        expected: userName,
        recognized: recognizedName,
      });
    }

    // Minimum confidence threshold
    if (confidenceValue < 65) {
      return res.status(400).json({
        message: `Face recognition confidence too low (${confidence}). Minimum required: 65%`,
      });
    }
  }

  next();
};

// Function to get registered users from face recognition server
const getRegisteredUsers = async () => {
  try {
    const response = await axios.get(
      `${FACE_RECOGNITION_SERVER.baseURL}/api/registered-users`,
      {
        timeout: FACE_RECOGNITION_SERVER.timeout,
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
      }
    );

    return response.data.registered_users || [];
  } catch (error) {
    console.error("❌ Error fetching registered users:", error.message);
    throw new Error("Face recognition server unavailable");
  }
};

// Function to verify user is registered for face recognition
const verifyUserRegistration = async (userName) => {
  try {
    const registeredUsers = await getRegisteredUsers();

    const userRegistered = registeredUsers.find(
      (regUser) => regUser.name.toLowerCase() === userName.toLowerCase()
    );

    if (!userRegistered) {
      return {
        isRegistered: false,
        message: `User ${userName} is not registered in face recognition system`,
        registeredUsers: registeredUsers.map((u) => u.name),
      };
    }

    if (userRegistered.encoding_count < 5) {
      return {
        isRegistered: false,
        message: `User ${userName} has insufficient face encodings (${userRegistered.encoding_count}/5)`,
        encodingCount: userRegistered.encoding_count,
      };
    }

    return {
      isRegistered: true,
      user: userRegistered,
      message: "User is properly registered for face recognition",
    };
  } catch (error) {
    return {
      isRegistered: false,
      message: "Could not verify user registration: " + error.message,
    };
  }
};

// Function to mark attendance via face recognition server
const markFaceRecognitionAttendance = async (imageData) => {
  try {
    const response = await axios.post(
      `${FACE_RECOGNITION_SERVER.baseURL}/api/mark-attendance`,
      { image: imageData },
      {
        timeout: FACE_RECOGNITION_SERVER.timeout,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    let errorMessage = "Face recognition failed";
    let errorCode = "UNKNOWN_ERROR";

    if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK") {
      errorMessage = "Face recognition server is not running";
      errorCode = "SERVER_UNAVAILABLE";
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "Face recognition timeout";
      errorCode = "TIMEOUT";
    } else if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;

      switch (status) {
        case 403:
          errorMessage = errorData?.error || "Face not recognized";
          errorCode = "RECOGNITION_FAILED";
          break;
        case 404:
          errorMessage = "No face detected in image";
          errorCode = "NO_FACE_DETECTED";
          break;
        case 400:
          errorMessage = "Invalid image data";
          errorCode = "INVALID_IMAGE";
          break;
        default:
          errorMessage = errorData?.message || "Face recognition error";
          errorCode = "RECOGNITION_ERROR";
      }
    }

    return {
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      details: error.response?.data,
    };
  }
};

// Middleware to check face recognition server health
const checkFaceRecognitionHealth = async (req, res, next) => {
  try {
    const response = await axios.get(
      `${FACE_RECOGNITION_SERVER.baseURL}/health`,
      { timeout: 5000 }
    );

    req.faceRecognitionHealth = {
      status: "healthy",
      server: response.data,
    };
  } catch (error) {
    req.faceRecognitionHealth = {
      status: "unhealthy",
      error: error.message,
    };
  }

  next();
};

module.exports = {
  validateFaceRecognitionData,
  getRegisteredUsers,
  verifyUserRegistration,
  markFaceRecognitionAttendance,
  checkFaceRecognitionHealth,
  FACE_RECOGNITION_SERVER,
};
