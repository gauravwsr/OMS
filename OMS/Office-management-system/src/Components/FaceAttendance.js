import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  Camera,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  X,
  Users,
  Calendar,
} from "lucide-react";
import { useAuth } from "./AuthProvider/AuthContext";
import "./FaceAttendance.css";

const FaceAttendance = () => {
  const [imageData, setImageData] = useState(null);
  const [attendanceResult, setAttendanceResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [captured, setCaptured] = useState(false);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [error, setError] = useState("");
  const [todayAttendance, setTodayAttendance] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchAttendanceHistory();
      checkTodayAttendance();
    }
  }, [user]);

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
      console.log("Could not fetch attendance history:", error);
    }
  };

  const checkTodayAttendance = () => {
    const today = new Date().toDateString();
    const todayRecord = attendanceHistory.find(
      (record) => new Date(record.timestamp).toDateString() === today
    );
    setTodayAttendance(todayRecord);
  };

  const handleOpenCamera = async () => {
    setCameraOpen(true);
    setCaptured(false);
    setImageData(null);
    setError("");

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        setError(
          "Unable to access camera. Please ensure camera permissions are granted."
        );
        setCameraOpen(false);
      }
    } else {
      setError("Camera not supported on this device.");
      setCameraOpen(false);
    }
  };

  const handleCloseCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
    setCaptured(false);
    setImageData(null);
  };

  const handleCapturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
      setImageData(dataUrl.split(",")[1]);
      setCaptured(true);
      setError("");
    }
  };

  const handleMarkAttendance = async () => {
    if (!imageData) {
      setError("Please capture your photo first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        "http://localhost:5001/api/mark-attendance",
        { image: imageData },
        { timeout: 10000 }
      );

      setAttendanceResult(`✅ ${response.data.message}`);

      // Save to main OMS database
      try {
        await axios.post(
          "http://localhost:5001/api/attendance/mark",
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

        fetchAttendanceHistory();
        checkTodayAttendance();
      } catch (omsError) {
        console.log("Could not save to OMS database:", omsError);
      }

      setTimeout(() => {
        handleCloseCamera();
        setAttendanceResult("");
      }, 3000);
    } catch (err) {
      console.error("Face recognition error:", err);
      if (err.code === "ECONNREFUSED") {
        setError(
          "❌ Face recognition server is not running. Please contact IT support."
        );
      } else if (err.response?.status === 403) {
        setError(
          "❌ Face not recognized. Please ensure you are registered in the system."
        );
      } else if (err.response?.status === 404) {
        setError(
          "❌ No face detected in the image. Please try again with better lighting."
        );
      } else {
        setError(
          `❌ ${
            err.response?.data?.message ||
            "Error marking attendance. Please try again."
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString();
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="attendance-container">
      {/* Header Section */}
      <div className="attendance-header">
        <div className="welcome-section">
          <h1>
            👋 Good{" "}
            {new Date().getHours() < 12
              ? "Morning"
              : new Date().getHours() < 18
              ? "Afternoon"
              : "Evening"}
            , {user?.name || "Employee"}
          </h1>
          <p>Ready to mark your attendance for today?</p>
        </div>

        <div className="time-info">
          <div className="current-time">
            <Clock size={20} />
            <span>{getCurrentTime()}</span>
          </div>
          <div className="current-date">
            <Calendar size={20} />
            <span>{getCurrentDate()}</span>
          </div>
        </div>
      </div>

      {/* Today's Status */}
      <div className="today-status">
        <div className="status-card">
          <UserCheck size={32} />
          <div className="status-info">
            <h3>Today's Attendance</h3>
            {todayAttendance ? (
              <div className="marked">
                <span className="status-badge success">✅ Marked</span>
                <p>Marked at {formatTime(todayAttendance.timestamp)}</p>
              </div>
            ) : (
              <div className="pending">
                <span className="status-badge pending">⏳ Pending</span>
                <p>Please mark your attendance</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError("")} className="close-error">
            <X size={16} />
          </button>
        </div>
      )}

      {attendanceResult && (
        <div className="success-message">
          <CheckCircle size={20} />
          <span>{attendanceResult}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="attendance-content">
        {/* Face Recognition Section */}
        <div className="camera-section">
          <div className="section-header">
            <h2>
              <Camera size={24} /> Face Recognition Attendance
            </h2>
            <p>
              Use facial recognition technology to mark your attendance quickly
              and securely
            </p>
          </div>

          {!cameraOpen && !captured && (
            <div className="camera-placeholder">
              <Camera size={64} />
              <h3>Ready to scan your face?</h3>
              <p>
                Click the button below to start the camera and mark your
                attendance
              </p>
              <button
                onClick={handleOpenCamera}
                className="camera-btn primary"
                disabled={todayAttendance}
              >
                <Camera size={20} />
                {todayAttendance ? "Already Marked Today" : "Start Face Scan"}
              </button>
            </div>
          )}

          {cameraOpen && !captured && (
            <div className="camera-view">
              <div className="camera-instructions">
                <p>📸 Position your face in the center of the camera</p>
                <p>💡 Ensure good lighting for better recognition</p>
              </div>
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
                  Cancel
                </button>
              </div>
            </div>
          )}

          {captured && (
            <div className="captured-view">
              <div className="photo-preview">
                <canvas ref={canvasRef} className="captured-image" />
              </div>
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

        {/* Attendance History Sidebar */}
        <div className="attendance-sidebar">
          <div className="sidebar-section">
            <h3>
              <Clock size={20} /> Recent Activity
            </h3>
            {attendanceHistory.length > 0 ? (
              <div className="history-list">
                {attendanceHistory.slice(0, 7).map((record, index) => (
                  <div key={index} className="history-item">
                    <div className="history-date">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </div>
                    <div className="history-time">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="history-method">
                      {record.method === "face_recognition"
                        ? "👤 Face"
                        : "✋ Manual"}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-history">No attendance records found</p>
            )}
          </div>

          <div className="sidebar-section">
            <h3>
              <Users size={20} /> Quick Stats
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-number">{attendanceHistory.length}</span>
                <span className="stat-label">Total Days</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">
                  {
                    attendanceHistory.filter(
                      (record) =>
                        new Date(record.timestamp).getMonth() ===
                        new Date().getMonth()
                    ).length
                  }
                </span>
                <span className="stat-label">This Month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceAttendance;
