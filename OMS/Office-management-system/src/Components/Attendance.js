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
  const [error, setError] = useState("");
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch attendance history when component mounts
    if (user) {
      fetchAttendanceHistory();
      fetchRegisteredUsers();
    }
  }, [user]);

  const fetchAttendanceHistory = async () => {
    try {
      // This would fetch from your OMS backend, not the Python server
      const response = await axios.get(
        "http://localhost:5000/api/attendance/history",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setAttendanceHistory(response.data || []);
    } catch (error) {
      console.log("Could not fetch attendance history:", error);
    }
  };

  const fetchRegisteredUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5001/api/registered-users"
      );
      setRegisteredUsers(response.data.registered_users || []);
    } catch (error) {
      console.log("Could not fetch registered users:", error);
    }
  };

  // Open camera
  const handleOpenCamera = async () => {
    console.log("Opening camera...");
    setCameraOpen(true);
    setCaptured(false);
    setImageData(null);
    setError("");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        console.log("Requesting camera access...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
            frameRate: { ideal: 30 },
          },
        });

        console.log("Camera access granted, setting up video stream...");
        if (videoRef.current) {
          videoRef.current.srcObject = stream;

          // Wait for video to be ready
          videoRef.current.onloadedmetadata = () => {
            console.log(
              "Video metadata loaded, dimensions:",
              videoRef.current.videoWidth,
              "x",
              videoRef.current.videoHeight
            );
          };

          videoRef.current.oncanplay = () => {
            console.log(
              "Video ready to play, readyState:",
              videoRef.current.readyState
            );
          };

          videoRef.current.onloadeddata = () => {
            console.log(
              "Video data loaded, readyState:",
              videoRef.current.readyState
            );
          };

          videoRef.current.onplaying = () => {
            console.log("Video started playing");
          };
        }
      } catch (err) {
        console.error("Camera access error:", err);
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
      console.error("getUserMedia not supported");
      setError("Camera not supported on this device.");
      setCameraOpen(false);
    }
  };

  // Close camera
  const handleCloseCamera = () => {
    console.log("Closing camera...");

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();

      console.log("Stopping", tracks.length, "video tracks");
      tracks.forEach((track) => {
        console.log("Stopping track:", track.kind, track.label);
        track.stop();
      });

      videoRef.current.srcObject = null;
    }

    setCameraOpen(false);
    setCaptured(false);
    setImageData(null);
    setError("");
    console.log("Camera closed successfully");
  };

  // Capture photo from video
  const handleCapturePhoto = () => {
    console.log("Capture photo clicked");
    console.log("Camera open state:", cameraOpen);
    console.log("Video ref:", videoRef.current);
    console.log("Canvas ref:", canvasRef.current);

    // Check if camera is open
    if (!cameraOpen) {
      console.error("Camera is not open");
      setError("❌ Please open the camera first before capturing photo.");
      return;
    }

    // Check if refs are available
    if (!videoRef.current) {
      console.error("Video reference not available");
      setError("❌ Video element not found. Please close and reopen camera.");
      return;
    }

    if (!canvasRef.current) {
      console.error("Canvas reference not available");
      setError("❌ Canvas element not found. Please refresh the page.");
      return;
    }

    // Check if video is ready
    if (videoRef.current.readyState < 2) {
      console.error(
        "Video not ready, readyState:",
        videoRef.current.readyState
      );
      setError("❌ Video is still loading. Please wait and try again.");
      return;
    }

    // Check if video has stream
    if (!videoRef.current.srcObject) {
      console.error("Video has no source stream");
      setError(
        "❌ Camera stream not available. Please close and reopen camera."
      );
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      console.log("Video readyState:", video.readyState);
      console.log("Video currentTime:", video.currentTime);
      console.log("Video paused:", video.paused);
      console.log(
        "Video dimensions:",
        video.videoWidth,
        "x",
        video.videoHeight
      );

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
        console.log("Video frame drawn to canvas successfully");
      } catch (drawError) {
        console.error("Error drawing video to canvas:", drawError);
        setError("❌ Failed to capture image. Please try again.");
        return;
      }

      // Improve image quality for better face recognition
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      console.log("Image captured, data URL length:", dataUrl.length);

      setImageData(dataUrl.split(",")[1]); // base64 string
      setCaptured(true);
      setError("");

      // Stop video stream after capture to free resources
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
      setCameraOpen(false);

      console.log("Photo captured successfully!");
    } else {
      console.error("Video or canvas ref not available");
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

    setLoading(true);
    setError("");

    try {
      console.log("Sending image data to face recognition server...");
      const response = await axios.post(
        "http://localhost:5001/api/mark-attendance",
        {
          image: imageData,
        },
        {
          timeout: 30000, // Increased timeout to 30 seconds
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Face recognition response:", response.data);

      // Show detailed success message
      if (response.data.name && response.data.confidence) {
        setAttendanceResult(
          `✅ ${response.data.message}\n🎯 Confidence: ${response.data.confidence}`
        );
      } else {
        setAttendanceResult(`✅ ${response.data.message}`);
      }

      // Also save to main OMS database
      try {
        await axios.post(
          "http://localhost:5000/api/attendance/mark",
          {
            method: "face_recognition",
            timestamp: new Date().toISOString(),
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // Refresh attendance history
        fetchAttendanceHistory();
      } catch (omsError) {
        console.log("Could not save to OMS database:", omsError);
      }

      // Reset after successful attendance
      setTimeout(() => {
        setCaptured(false);
        setImageData(null);
        setAttendanceResult("");
      }, 6000); // Increased display time to 6 seconds
    } catch (err) {
      console.error("Face recognition error:", err);

      // Parse detailed error information from server response
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
        // Handle different types of 403 errors with detailed messages
        if (errorData?.error === "low_confidence") {
          setError(
            `❌ Face recognized as '${errorData.closest_match}' but confidence too low (${errorData.confidence}). Please ensure good lighting and try again.`
          );
        } else if (errorData?.error === "no_match_found") {
          setError(
            `❌ No face match found. Please ensure you are registered.\nRegistered users: ${
              errorData.registered_users?.join(", ") || "None"
            }`
          );
        } else if (errorData?.error === "user_not_in_database") {
          setError(`❌ ${errorData.message}`);
        } else {
          setError(
            errorData?.message ||
              "❌ Face not recognized. Please ensure you are registered in the system or try capturing a clearer image."
          );
        }
      } else if (err.response?.status === 404) {
        setError(
          "❌ No face detected in the image. Please try again with better lighting and ensure your face is clearly visible."
        );
      } else if (err.response?.status === 400) {
        setError(
          "❌ Invalid image data. Please try capturing the photo again."
        );
      } else {
        setError(
          errorData?.message ||
            "❌ Error marking attendance. Please try again with better lighting."
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
        <div className="camera-section">
          {!cameraOpen && !captured && (
            <div className="camera-placeholder">
              <Camera size={64} />
              <p>Ready to mark attendance?</p>
              <button onClick={handleOpenCamera} className="camera-btn primary">
                <Camera size={20} />
                Open Camera
              </button>
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
                <button
                  onClick={handleMarkAttendance}
                  disabled={loading}
                  className="camera-btn primary"
                >
                  {loading ? (
                    <>
                      <Clock size={20} className="spinning" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <UserCheck size={20} />
                      Mark Attendance
                    </>
                  )}
                </button>
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

        {/* Debug Information */}
        <div className="debug-section">
          <button
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            className="camera-btn secondary"
            style={{ marginTop: "20px" }}
          >
            {showDebugInfo ? "Hide" : "Show"} Debug Info
          </button>

          {showDebugInfo && (
            <div
              className="debug-info"
              style={{
                marginTop: "10px",
                padding: "15px",
                backgroundColor: "#f5f5f5",
                borderRadius: "8px",
                fontSize: "14px",
              }}
            >
              <h4>Registered Users in Face Recognition System:</h4>
              {registeredUsers.length > 0 ? (
                <ul>
                  {registeredUsers.map((user, index) => (
                    <li key={index}>
                      <strong>{user.name}</strong> - {user.encoding_count} face
                      encodings
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No users registered in the face recognition system.</p>
              )}
              <button
                onClick={fetchRegisteredUsers}
                className="camera-btn secondary"
                style={{
                  marginTop: "10px",
                  fontSize: "12px",
                  padding: "5px 10px",
                }}
              >
                Refresh Users List
              </button>
            </div>
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
