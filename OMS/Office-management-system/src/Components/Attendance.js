import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Camera,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { useAuth } from "./AuthProvider/AuthContext";
import "./FaceAttendance.css";

const Attendance = () => {
  const [imageData, setImageData] = useState(null);
  const [attendanceResult, setAttendanceResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [workingHours, setWorkingHours] = useState(null);
  const [attendanceType, setAttendanceType] = useState("check_in"); // New state for check-in/check-out
  const [error, setError] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [lastRegistrationCheck, setLastRegistrationCheck] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (user?.name) {
      fetchAttendanceHistory();
      fetchTodayAttendance();
      fetchRegisteredUsers();
      checkUserFaceRegistration();
      checkMongoDBConnection();
    }
  }, [user, isAuthenticated]);

  // Auto-refresh registered users every 10 seconds to catch new registrations quickly
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?.name) {
        fetchRegisteredUsers();
      }
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [user]);

  const checkUserFaceRegistration = async () => {
    if (!user?.name) {
      setError("❌ User information not available. Please login again.");
      return;
    }

    try {
      const response = await axios.get(
        `http://localhost:5001/api/registered-users?t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );

      if (response.data && response.data.registered_users) {
        const userRegistered = response.data.registered_users.find(
          (regUser) => regUser.name.toLowerCase() === user.name.toLowerCase()
        );

        if (!userRegistered) {
          setError(
            `❌ ${user.name}, your face is not registered in the system.\n` +
              `Please contact admin or register your face through Employee Dashboard.\n` +
              `Registered users: ${
                response.data.registered_users.map((u) => u.name).join(", ") ||
                "None"
              }`
          );
        } else if (userRegistered.encoding_count < 5) {
          setError(
            `⚠️ ${user.name}, your face registration is incomplete.\n` +
              `You have only ${userRegistered.encoding_count} face encodings. At least 5 are required for accurate recognition.\n` +
              `Please re-register your face with more photos.`
          );
        } else {
          setError(""); // Clear any previous errors
        }
      }
    } catch (error) {
      setError(
        "⚠️ Could not verify face registration status. Face recognition server may be unavailable."
      );
    }
  };

  const checkMongoDBConnection = async () => {
    try {
      const response = await axios.get("http://localhost:5001/api/health", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        timeout: 5000,
      });

      console.log("MongoDB connection status:", response.data);

      if (response.data && response.data.database === "connected") {
        console.log("✅ MongoDB database is connected and ready");
      } else {
        console.warn("⚠️ MongoDB database connection uncertain");
      }
    } catch (error) {
      console.error("❌ MongoDB connection check failed:", error);
      // Don't show error to user for connection check, just log it
    }
  };

  // Helper function to create comprehensive attendance data for MongoDB
  const createAttendanceData = (
    faceRecognitionResponse,
    additionalInfo = {}
  ) => {
    const currentTime = new Date();

    return {
      // Basic attendance information
      method: "face_recognition",
      timestamp: currentTime.toISOString(),
      date: currentTime.toDateString(),
      time: currentTime.toLocaleTimeString(),

      // Employee information
      employeeName: user.name,
      employeeId: user.id || user._id || null,
      employeeEmail: user.email || null,
      employeeRole: user.role || null,

      // Face recognition details
      confidence:
        faceRecognitionResponse.confidence || additionalInfo.confidence,
      recognizedName:
        faceRecognitionResponse.name || additionalInfo.recognizedName,
      status:
        faceRecognitionResponse.status || additionalInfo.status || "Present",

      // Detailed face recognition information
      faceRecognitionDetails: {
        server_response: faceRecognitionResponse,
        recognition_type: additionalInfo.recognition_type || "normal",
        confidence_value: (() => {
          const confidenceStr =
            faceRecognitionResponse.confidence ||
            additionalInfo.confidence ||
            "0%";
          const match = confidenceStr.match(/(\d+\.?\d*)%/);
          return match ? parseFloat(match[1]) : 0;
        })(),
        recognition_time: currentTime.toISOString(),
        system_version: "1.0",
        device_info: navigator.userAgent,
        browser_info: {
          platform: navigator.platform,
          language: navigator.language,
          cookieEnabled: navigator.cookieEnabled,
        },
      },

      // Location and system information
      location: "Office", // Can be made dynamic based on IP geolocation
      ip_address: null, // Will be populated by server
      system_info: {
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },

      // Additional metadata
      notes:
        additionalInfo.notes ||
        `Face recognition successful with ${
          faceRecognitionResponse.confidence || additionalInfo.confidence
        } confidence`,
      created_at: currentTime.toISOString(),
      updated_at: currentTime.toISOString(),
    };
  };

  const fetchAttendanceHistory = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/attendance/history",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setAttendanceHistory(response.data || []);
    } catch (error) {
      // Silently fail for attendance history
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/attendance/today",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data) {
        setTodayAttendance(response.data);
        setWorkingHours(response.data.workingHours);

        // Set attendance type based on current status
        if (response.data.hasCheckIn && !response.data.hasCheckOut) {
          setAttendanceType("check_out");
        } else if (!response.data.hasCheckIn) {
          setAttendanceType("check_in");
        }
      }
    } catch (error) {
      // Silently handle error
      console.log("No today attendance found");
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5001/api/registered-users?t=${Date.now()}`,
        {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        }
      );
      const newRegisteredUsers = response.data.registered_users || [];

      if (user?.name) {
        const oldUserRegistration = registeredUsers.find(
          (regUser) => regUser.name.toLowerCase() === user.name.toLowerCase()
        );
        const newUserRegistration = newRegisteredUsers.find(
          (regUser) => regUser.name.toLowerCase() === user.name.toLowerCase()
        );

        const hasRegistrationChanged =
          (!oldUserRegistration && newUserRegistration) ||
          (oldUserRegistration &&
            newUserRegistration &&
            oldUserRegistration.encoding_count !==
              newUserRegistration.encoding_count);

        if (
          !oldUserRegistration &&
          newUserRegistration &&
          newUserRegistration.encoding_count >= 5 &&
          hasRegistrationChanged &&
          registeredUsers.length > 0
        ) {
          setAttendanceResult(
            `🎉 Great! ${user.name}, your face registration is now complete!\n` +
              `✅ You have ${newUserRegistration.encoding_count} face encodings registered.\n` +
              `🚀 You can now mark attendance using face recognition!`
          );
          setError("");

          setTimeout(() => {
            setAttendanceResult("");
          }, 10000);
        } else if (
          oldUserRegistration &&
          oldUserRegistration.encoding_count < 5 &&
          newUserRegistration &&
          newUserRegistration.encoding_count >= 5 &&
          hasRegistrationChanged
        ) {
          setAttendanceResult(
            `🎉 Registration Updated! ${user.name}\n` +
              `✅ Your face encodings increased from ${oldUserRegistration.encoding_count} to ${newUserRegistration.encoding_count}\n` +
              `🚀 Face recognition attendance is now ready!`
          );
          setError("");

          setTimeout(() => {
            setAttendanceResult("");
          }, 10000);
        } else if (
          newUserRegistration &&
          newUserRegistration.encoding_count >= 5
        ) {
          setError("");
        }
      }

      setRegisteredUsers(newRegisteredUsers);
      setLastRegistrationCheck(new Date().toISOString());
    } catch (error) {
      // Silently fail for registered users fetch
    }
  };

  // Open camera
  const handleOpenCamera = async () => {
    await fetchRegisteredUsers();

    setCameraOpen(true);
    setCaptured(false);
    setImageData(null);
    setError("");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
            frameRate: { ideal: 30 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        let errorMessage = "Unable to access camera. ";

        if (err.name === "NotAllowedError") {
          errorMessage +=
            "Camera permission denied. Please allow camera access and try again.";
        } else if (err.name === "NotFoundError") {
          errorMessage += "No camera found on this device.";
        } else if (err.name === "NotReadableError") {
          errorMessage += "Camera is being used by another application.";
        } else {
          errorMessage +=
            "Please ensure camera permissions are granted and no other application is using the camera.";
        }

        setError(errorMessage);
        setCameraOpen(false);
      }
    } else {
      setError("Camera not supported on this device.");
      setCameraOpen(false);
    }
  };

  // Close camera
  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();

      tracks.forEach((track) => {
        track.stop();
      });

      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCaptured(false);
    setImageData(null);
    setError("");
  };

  // Capture photo from video
  const handleCapturePhoto = () => {
    if (!cameraOpen) {
      setError("❌ Please open the camera first before capturing photo.");
      return;
    }

    if (!videoRef.current) {
      setError("❌ Video element not found. Please close and reopen camera.");
      return;
    }

    if (!canvasRef.current) {
      setError("❌ Canvas element not found. Please refresh the page.");
      return;
    }

    if (videoRef.current.readyState < 2) {
      setError("❌ Video is still loading. Please wait and try again.");
      return;
    }

    if (!videoRef.current.srcObject) {
      setError(
        "❌ Camera stream not available. Please close and reopen camera."
      );
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        setError(
          "❌ Video not ready yet. Please wait for camera to initialize completely."
        );
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      } catch (drawError) {
        setError("❌ Failed to capture image. Please try again.");
        return;
      }

      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      setImageData(dataUrl.split(",")[1]); // base64 string
      setCaptured(true);
      setError("");

      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraOpen(false);
    } else {
      setError(
        "❌ Camera not properly initialized. Please try opening camera again."
      );
    }
  };

  // Call Python API to mark attendance
  const handleMarkAttendance = async () => {
    if (!imageData) {
      setError("Please capture your photo first.");
      return;
    }

    if (!user?.name) {
      setError("❌ User information not available. Please login again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First verify user is registered in face recognition system
      const registeredResponse = await axios.get(
        "http://localhost:5001/api/registered-users"
      );
      const userRegistered = registeredResponse.data.registered_users?.find(
        (regUser) => regUser.name.toLowerCase() === user.name.toLowerCase()
      );

      if (!userRegistered) {
        setError(
          `❌ ${user.name}, your face is not registered in the system.\n` +
            `Please contact admin or register your face through Employee Dashboard.\n` +
            `Registered users: ${
              registeredResponse.data.registered_users
                ?.map((u) => u.name)
                .join(", ") || "None"
            }`
        );
        setLoading(false);
        return;
      }

      if (userRegistered.encoding_count < 5) {
        setError(
          `⚠️ ${user.name}, your face registration is incomplete.\n` +
            `You have only ${userRegistered.encoding_count} face encodings. At least 5 are required for accurate recognition.\n` +
            `Please re-register your face with more photos for better accuracy.`
        );
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:5001/api/mark-attendance",
        {
          image: imageData,
        },
        {
          timeout: 30000,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      // Verify that the recognized face matches the logged-in user
      if (response.data.success && response.data.name) {
        if (response.data.name.toLowerCase() !== user.name.toLowerCase()) {
          setError(
            `🚨 SECURITY ALERT: Face verification failed!\n` +
              `Expected: ${user.name}\n` +
              `Recognized: ${response.data.name}\n` +
              `This is a serious security violation. Please ensure you are using your own face for attendance.\n` +
              `If this error persists, contact system administrator immediately.`
          );
          setLoading(false);
          return;
        }

        // Additional security check: Verify confidence level
        const confidenceMatch = response.data.confidence.match(/(\d+\.?\d*)%/);
        const confidenceValue = confidenceMatch
          ? parseFloat(confidenceMatch[1])
          : 0;

        if (confidenceValue < 65) {
          setError(
            `⚠️ Face recognition confidence is too low (${response.data.confidence}).\n` +
              `Minimum required: 65%\n` +
              `Please try again with:\n` +
              `• Better lighting (avoid shadows)\n` +
              `• Face directly facing camera\n` +
              `• Clear background\n` +
              `• Remove glasses/mask if possible`
          );
          setLoading(false);
          return;
        }

        // Success - the recognized face matches the logged-in user
        setAttendanceResult(
          `✅ Welcome ${user.name}!\n` +
            `🎯 Face Recognition Confidence: ${response.data.confidence}\n` +
            `⏰ Attendance marked successfully at ${new Date().toLocaleTimeString()}\n` +
            `📊 Status: ${response.data.status || "Present"}`
        );

        // Also save to main OMS MongoDB database with detailed information
        try {
          const attendanceData = createAttendanceData(response.data);

          console.log("Saving attendance to MongoDB:", attendanceData);

          const mongoResponse = await axios.post(
            "http://localhost:5001/api/attendance/mark",
            {
              ...attendanceData,
              attendance_type: attendanceType, // Add attendance type
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("✅ MongoDB save successful:", mongoResponse.data);
          fetchAttendanceHistory();
          fetchTodayAttendance(); // Refresh today's attendance

          // Show success message with working hours if available
          let successMessage = `\n💾 ${
            attendanceType === "check_in" ? "Check-in" : "Check-out"
          } saved to database!`;

          if (mongoResponse.data.workingHours) {
            successMessage += `\n⏰ Working Hours: ${mongoResponse.data.workingHours.hours}h ${mongoResponse.data.workingHours.minutes}m`;
          }

          if (
            mongoResponse.data.attendanceType === "check_out" &&
            mongoResponse.data.dailySummary
          ) {
            successMessage += `\n📊 Day Status: ${mongoResponse.data.dailySummary.status}`;
          }

          setAttendanceResult((prev) => prev + successMessage);
        } catch (omsError) {
          console.error("❌ MongoDB save error:", omsError);
          // Show warning if MongoDB save fails but don't prevent attendance
          setAttendanceResult(
            (prev) =>
              prev +
              `\n⚠️ Warning: Could not save to MongoDB database. Please contact IT support.\nError: ${
                omsError.response?.data?.message || omsError.message
              }`
          );
        }

        // Reset after successful attendance
        setTimeout(() => {
          setCaptured(false);
          setImageData(null);
          setAttendanceResult("");
        }, 8000);
      } else {
        setError(
          "❌ Face recognition failed. Please try again with better lighting."
        );
      }
    } catch (err) {
      const errorData = err.response?.data;

      if (err.code === "ECONNREFUSED" || err.code === "ERR_NETWORK") {
        setError(
          "❌ Face recognition server is not running. Please ensure the Python server is started on port 5001."
        );
      } else if (err.code === "ECONNABORTED") {
        setError(
          "⏱️ Face recognition is taking longer than expected. This may happen with high-resolution images or when the server is processing multiple requests. Please try again with better lighting or a clearer photo."
        );
      } else if (err.response?.status === 403) {
        if (errorData?.error === "ambiguous_match") {
          const isExpectedUser =
            errorData.best_match.toLowerCase() === user.name.toLowerCase();
          console.log("Ambiguous match debug:", {
            expectedUser: user.name,
            bestMatch: errorData.best_match,
            confidence: errorData.confidence,
            isExpectedUser: isExpectedUser,
          });

          // If the best match is the expected user, treat it as a successful recognition
          // but with a warning about low confidence
          if (isExpectedUser) {
            const confidenceMatch = errorData.confidence?.match(/(\d+\.?\d*)%/);
            const confidenceValue = confidenceMatch
              ? parseFloat(confidenceMatch[1])
              : 0;

            // Allow attendance if confidence is above minimum threshold (e.g., 70%)
            if (confidenceValue >= 70) {
              setAttendanceResult(
                `✅ Welcome ${user.name}!\n` +
                  `🎯 Face Recognition Confidence: ${errorData.confidence}\n` +
                  `⚠️ Recognition was ambiguous but matched your identity\n` +
                  `⏰ Attendance marked successfully at ${new Date().toLocaleTimeString()}\n` +
                  `📊 Status: Present`
              );

              // Also save to main OMS MongoDB database with detailed information
              try {
                const attendanceData = createAttendanceData(
                  {
                    name: errorData.best_match,
                    confidence: errorData.confidence,
                    status: "Present",
                  },
                  {
                    recognition_type: "ambiguous_match_accepted",
                    notes: `Ambiguous face recognition accepted with ${errorData.confidence} confidence`,
                  }
                );

                console.log(
                  "Saving ambiguous match attendance to MongoDB:",
                  attendanceData
                );

                const mongoResponse = await axios.post(
                  "http://localhost:5001/api/attendance/mark",
                  {
                    ...attendanceData,
                    attendance_type: attendanceType, // Add attendance type
                  },
                  {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem("token")}`,
                      "Content-Type": "application/json",
                    },
                  }
                );

                console.log(
                  "✅ MongoDB save successful (ambiguous):",
                  mongoResponse.data
                );
                fetchAttendanceHistory();
                fetchTodayAttendance(); // Refresh today's attendance

                // Show success message with working hours if available
                let successMessage = `\n💾 ${
                  attendanceType === "check_in" ? "Check-in" : "Check-out"
                } saved to database!`;

                if (mongoResponse.data.workingHours) {
                  successMessage += `\n⏰ Working Hours: ${mongoResponse.data.workingHours.hours}h ${mongoResponse.data.workingHours.minutes}m`;
                }

                setAttendanceResult((prev) => prev + successMessage);
              } catch (omsError) {
                console.error("❌ MongoDB save error (ambiguous):", omsError);
                // Show warning if MongoDB save fails
                setAttendanceResult(
                  (prev) =>
                    prev +
                    `\n⚠️ Warning: Could not save to MongoDB database. Please contact IT support.\nError: ${
                      omsError.response?.data?.message || omsError.message
                    }`
                );
              }

              // Reset after successful attendance
              setTimeout(() => {
                setCaptured(false);
                setImageData(null);
                setAttendanceResult("");
              }, 8000);

              setLoading(false);
              return; // Exit the function as attendance was successful
            }
          }

          setError(
            `⚠️ Face recognition is ambiguous!\n` +
              `Best match: ${errorData.best_match || "Unknown"} (${
                errorData.confidence || "N/A"
              })\n` +
              `Expected: ${user.name}\n` +
              `${
                isExpectedUser
                  ? "✅ The system detected your face but with low certainty due to similar faces in the database.\nThis is a security measure to prevent false matches."
                  : "🚨 SECURITY ALERT: The system matched a different person's face!"
              }\n` +
              `Please try again with:\n` +
              `• Better lighting (avoid shadows and glare)\n` +
              `• Face directly facing camera\n` +
              `• Clear, unobstructed background\n` +
              `• Remove glasses or accessories if possible\n` +
              `• Ensure you're in a well-lit area\n` +
              `${
                !isExpectedUser
                  ? "• Verify you are using your own face for attendance"
                  : ""
              }`
          );
        } else if (errorData?.error === "low_confidence") {
          if (
            errorData.closest_match.toLowerCase() === user.name.toLowerCase()
          ) {
            setError(
              `⚠️ ${user.name}, your face was detected but confidence is too low (${errorData.confidence}).\n` +
                `Please try again with:\n` +
                `• Better lighting (avoid shadows)\n` +
                `• Face directly facing camera\n` +
                `• Clear background\n` +
                `• Remove glasses if possible`
            );
          } else {
            setError(
              `❌ Face verification failed!\n` +
                `Expected: ${user.name}\n` +
                `Closest match: ${errorData.closest_match} (${errorData.confidence})\n` +
                `Please ensure you are using your own face for attendance.`
            );
          }
        } else if (errorData?.error === "no_match_found") {
          setError(
            `❌ ${user.name}, your face could not be recognized.\n` +
              `Please ensure:\n` +
              `• Your face is registered in the system\n` +
              `• Good lighting and clear photo\n` +
              `• Face directly facing camera\n` +
              `Contact admin if the issue persists.`
          );
        } else if (errorData?.error === "user_not_in_database") {
          setError(
            `❌ ${user.name}, you are not registered in the face recognition system.\n` +
              `Please contact admin or register your face through Employee Dashboard.`
          );
        } else {
          setError(
            `❌ Face recognition failed for ${user.name}.\n` +
              `This could be due to:\n` +
              `• Face not recognized with sufficient confidence\n` +
              `• Poor lighting or image quality\n` +
              `• Face not properly registered in system\n` +
              `Please try again with better lighting and ensure your face is clearly visible.\n\n` +
              `Server response: ${
                errorData ? JSON.stringify(errorData) : "No additional details"
              }`
          );
        }
      } else if (err.response?.status === 404) {
        setError(
          "❌ No face detected in the image. Please try again with:\n" +
            "• Better lighting\n" +
            "• Face clearly visible\n" +
            "• Remove any obstructions"
        );
      } else if (err.response?.status === 400) {
        setError(
          "❌ Invalid image data. Please try capturing the photo again."
        );
      } else {
        setError(
          `❌ Error marking attendance for ${user.name}. Please try again with better lighting.\n` +
            `Error details: ${err.message || "Unknown error"}`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="attendance-container">
      <div className="attendance-header">
        <h2>
          <UserCheck size={28} /> Face Recognition Attendance
        </h2>
        <p>Mark your attendance using facial recognition technology</p>
      </div>

      {/* User Loading State */}
      {!user?.name && (
        <div
          className="loading-message"
          style={{
            padding: "15px",
            backgroundColor: "#e3f2fd",
            border: "1px solid #bbdefb",
            borderRadius: "8px",
            color: "#1976d2",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          <Clock
            size={20}
            className="spinning"
            style={{ marginRight: "8px" }}
          />
          Loading user information... Please wait.
        </div>
      )}

      {attendanceResult && (
        <div
          className="success-message"
          style={{
            whiteSpace: "pre-line",
            fontSize: "16px",
            padding: "15px",
            backgroundColor: "#d4edda",
            border: "1px solid #c3e6cb",
            borderRadius: "8px",
            color: "#155724",
          }}
        >
          <CheckCircle size={20} />
          <span>{attendanceResult}</span>
        </div>
      )}

      {error && (
        <div
          className="error-message"
          style={{
            whiteSpace: "pre-line",
            fontSize: "14px",
            padding: "15px",
            backgroundColor: "#f8d7da",
            border: "1px solid #f5c6cb",
            borderRadius: "8px",
            color: "#721c24",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="close-error">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="attendance-content">
        {/* Today's Attendance Status */}
        {todayAttendance && (
          <div
            className="today-status"
            style={{
              padding: "20px",
              backgroundColor: "#f8f9fa",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "2px solid #e9ecef",
            }}
          >
            <h3
              style={{
                color: "#495057",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <Clock size={20} style={{ marginRight: "8px" }} />
              Today's Attendance Status
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "15px",
              }}
            >
              {todayAttendance.hasCheckIn && (
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "#d4edda",
                    borderRadius: "6px",
                    border: "1px solid #c3e6cb",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#155724",
                      marginBottom: "5px",
                    }}
                  >
                    ✅ Check-in Recorded
                  </div>
                  <div style={{ fontSize: "14px", color: "#155724" }}>
                    {todayAttendance.checkInRecord &&
                      new Date(
                        todayAttendance.checkInRecord.timestamp
                      ).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {todayAttendance.hasCheckOut && (
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "#d1ecf1",
                    borderRadius: "6px",
                    border: "1px solid #b8daff",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#0c5460",
                      marginBottom: "5px",
                    }}
                  >
                    🏁 Check-out Recorded
                  </div>
                  <div style={{ fontSize: "14px", color: "#0c5460" }}>
                    {todayAttendance.checkOutRecord &&
                      new Date(
                        todayAttendance.checkOutRecord.timestamp
                      ).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {workingHours && (
                <div
                  style={{
                    padding: "15px",
                    backgroundColor: "#fff3cd",
                    borderRadius: "6px",
                    border: "1px solid #ffeaa7",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      color: "#856404",
                      marginBottom: "5px",
                    }}
                  >
                    ⏰ Working Hours
                  </div>
                  <div style={{ fontSize: "14px", color: "#856404" }}>
                    {workingHours.hours}h {workingHours.minutes}m
                  </div>
                  <div style={{ fontSize: "12px", color: "#856404" }}>
                    Total: {workingHours.totalHours} hours
                  </div>
                </div>
              )}
            </div>

            {attendanceType && (
              <div
                style={{
                  marginTop: "15px",
                  padding: "10px",
                  backgroundColor:
                    attendanceType === "check_in" ? "#e7f3ff" : "#fff0e7",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    color:
                      attendanceType === "check_in" ? "#0066cc" : "#cc6600",
                    fontSize: "16px",
                  }}
                >
                  {attendanceType === "check_in"
                    ? "📍 Ready for Check-in"
                    : "🚪 Ready for Check-out"}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="camera-section">
          {!cameraOpen && !captured && user?.name && (
            <div className="camera-placeholder">
              <Camera size={64} />
              <p>Hello {user.name}, ready to mark attendance?</p>

              {/* Registration Status Display */}
              {user?.name && (
                <div
                  style={{
                    margin: "10px 0",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    backgroundColor: (() => {
                      const userRegistered = registeredUsers.find(
                        (regUser) =>
                          regUser.name.toLowerCase() === user.name.toLowerCase()
                      );
                      if (!userRegistered) return "#ffebee";
                      if (userRegistered.encoding_count < 5) return "#fff3e0";
                      return "#e8f5e8";
                    })(),
                    color: (() => {
                      const userRegistered = registeredUsers.find(
                        (regUser) =>
                          regUser.name.toLowerCase() === user.name.toLowerCase()
                      );
                      if (!userRegistered) return "#c62828";
                      if (userRegistered.encoding_count < 5) return "#ef6c00";
                      return "#2e7d32";
                    })(),
                  }}
                >
                  {(() => {
                    const userRegistered = registeredUsers.find(
                      (regUser) =>
                        regUser.name.toLowerCase() === user.name.toLowerCase()
                    );
                    if (!userRegistered) {
                      return "❌ Face not registered";
                    } else if (userRegistered.encoding_count < 5) {
                      return `⚠️ Registration incomplete (${userRegistered.encoding_count}/5 photos)`;
                    } else {
                      return `✅ Ready for attendance (${userRegistered.encoding_count} photos registered)`;
                    }
                  })()}
                </div>
              )}

              {user?.name && (
                <button
                  onClick={handleOpenCamera}
                  className="camera-btn primary"
                >
                  <Camera size={20} />
                  Open Camera
                </button>
              )}
            </div>
          )}

          {cameraOpen && !captured && (
            <div className="camera-view">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="video-feed"
              />
              <div className="camera-controls">
                <button
                  onClick={handleCapturePhoto}
                  className="camera-btn capture"
                >
                  <Camera size={20} />
                  Capture Photo
                </button>
                <button
                  onClick={handleCloseCamera}
                  className="camera-btn secondary"
                >
                  <X size={20} />
                  Close Camera
                </button>
              </div>
            </div>
          )}

          {captured && (
            <div className="captured-view">
              <div className="capture-controls">
                {(() => {
                  const userRegistered = registeredUsers.find(
                    (regUser) =>
                      regUser.name.toLowerCase() === user?.name.toLowerCase()
                  );
                  const isUserProperlyRegistered =
                    userRegistered && userRegistered.encoding_count >= 5;

                  return (
                    <button
                      onClick={handleMarkAttendance}
                      disabled={loading || !isUserProperlyRegistered}
                      className={`camera-btn ${
                        isUserProperlyRegistered ? "primary" : "disabled"
                      }`}
                      title={
                        !user?.name
                          ? "Please login first"
                          : !userRegistered
                          ? "Face not registered in system"
                          : userRegistered.encoding_count < 5
                          ? `Need at least 5 face photos (you have ${userRegistered.encoding_count})`
                          : "Ready to mark attendance"
                      }
                    >
                      {loading ? (
                        <>
                          <Clock size={20} className="spinning" />
                          Processing...
                        </>
                      ) : !isUserProperlyRegistered ? (
                        <>
                          <AlertCircle size={20} />
                          Registration Required
                        </>
                      ) : (
                        <>
                          <UserCheck size={20} />
                          Mark Attendance
                        </>
                      )}
                    </button>
                  );
                })()}
                <button
                  onClick={handleOpenCamera}
                  className="camera-btn secondary"
                >
                  <Camera size={20} />
                  Retake Photo
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Attendance History */}
        <div className="attendance-history">
          <h3>
            <Clock size={24} /> Recent Attendance
          </h3>
          {attendanceHistory.length > 0 ? (
            <div className="history-list">
              {attendanceHistory.slice(0, 5).map((record, index) => (
                <div key={index} className="history-item">
                  <div className="history-time">
                    {formatTime(record.timestamp)}
                  </div>
                  <div className="history-method">
                    {record.method || "Manual"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-history">No attendance records found</p>
          )}
        </div>

        {/* Hidden canvas for image processing - always available */}
        <canvas
          ref={canvasRef}
          style={{ display: captured ? "block" : "none" }}
          className={captured ? "captured-image" : ""}
        />
      </div>
    </div>
  );
};

export default Attendance;
