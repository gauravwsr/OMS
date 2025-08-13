import { useState, useEffect, useRef } from "react";
import DailyIframe from "@daily-co/daily-js";
import {
  FaVideo,
  FaVideoSlash,
  FaMicrophone,
  FaMicrophoneSlash,
  FaCopy,
  FaSignOutAlt,
  FaLink,
  FaUserPlus,
  FaPlus,
  FaUsers,
  FaGlobe,
  FaUserCheck,
  FaLock,
  FaClock,
  FaEye,
  FaCalendarPlus,
  FaChartBar,
  FaPlay,
  FaBell,
  FaCalendarCheck,
  FaDownload,
} from "react-icons/fa";
import { useAuth } from "./AuthProvider/AuthContext";
import axios from "axios";
import "./MeetingSystem.css";

const Meeting = () => {
  // Authentication context
  const { user, isAuthenticated } = useAuth();

  // Meeting state
  const callFrameRef = useRef(null);
  const containerRef = useRef(null);
  const [roomName, setRoomName] = useState("");
  const [roomUrl, setRoomUrl] = useState("");
  const [joinLink, setJoinLink] = useState("");
  const [currentRoomId, setCurrentRoomId] = useState("");
  const [isMeetingStarted, setIsMeetingStarted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [userName, setUserName] = useState("");
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [participants, setParticipants] = useState(0);

  // UI state
  const [activeTab, setActiveTab] = useState("meetings");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Meeting data
  const [availableMeetings, setAvailableMeetings] = useState([]);
  const [meetingStats, setMeetingStats] = useState(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Enhanced UI state
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    meetingName: "",
    roomType: "",
    teamName: "",
    date: "",
    time: "",
    duration: 60,
    description: "",
    reminderMinutes: 15,
    emailReminder: true,
    meetingSettings: {
      enableChat: true,
      enableKnocking: true,
      startVideoOff: false,
      startAudioOff: false,
      maxParticipants: 50,
    },
  });

  // Create meeting form state
  const [createForm, setCreateForm] = useState({
    roomName: "",
    roomType: "",
    teamName: "",
    inviteUserIds: [],
    enableChat: true,
    enableKnocking: true,
    startVideoOff: false,
    startAudioOff: false,
    maxParticipants: 50,
  });

  // Initialize user name from auth context
  useEffect(() => {
    if (user && user.name) {
      setUserName(user.name);
    }
  }, [user]);

  // Load available meetings on component mount
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAvailableMeetings();
      loadUpcomingMeetings();
      loadScheduledMeetings();
      if (
        user.role === "Super_Admin" ||
        (user.role === "Admin" && user.subRole === "HR Manager")
      ) {
        loadMeetingStats();
        loadAnalyticsData();
      }
    }
  }, [isAuthenticated, user]);

  // API functions
  const apiCall = async (endpoint, method = "GET", data = null) => {
    try {
      const token = localStorage.getItem("token");
      const config = {
        method,
        url: `http://localhost:5001/api/meetings${endpoint}`,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error(`API call failed: ${endpoint}`, error);
      throw error.response?.data || error;
    }
  };

  const loadAvailableMeetings = async () => {
    try {
      setLoading(true);
      const response = await apiCall("/list");
      setAvailableMeetings(response.data || []);
    } catch (error) {
      setError(
        "Failed to load meetings: " + (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const loadMeetingStats = async () => {
    try {
      const response = await apiCall("/analytics/overview");
      setMeetingStats(response.data);
    } catch (error) {
      console.error("Failed to load meeting stats:", error);
    }
  };

  // New enhanced functions
  const loadUpcomingMeetings = async () => {
    try {
      const response = await apiCall("/upcoming");
      setUpcomingMeetings(response.data || []);
    } catch (error) {
      console.error("Failed to load upcoming meetings:", error);
    }
  };

  const loadScheduledMeetings = async () => {
    try {
      const response = await apiCall("/scheduled");
      setScheduledMeetings(response.data || []);
    } catch (error) {
      console.error("Failed to load scheduled meetings:", error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const response = await apiCall("/analytics/detailed?range=week");
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    }
  };

  const scheduleMeeting = async () => {
    try {
      setLoading(true);
      setError("");

      // Combine date and time
      const scheduledDateTime = new Date(
        `${scheduleForm.date}T${scheduleForm.time}`
      );

      if (scheduledDateTime <= new Date()) {
        setError("Scheduled time must be in the future");
        return;
      }

      const response = await apiCall("/schedule", "POST", {
        meetingName: scheduleForm.meetingName,
        roomType: scheduleForm.roomType,
        teamName: scheduleForm.teamName,
        description: scheduleForm.description,
        duration: scheduleForm.duration,
        emailReminder: scheduleForm.emailReminder,
        reminderMinutes: scheduleForm.reminderMinutes,
        scheduledAt: scheduledDateTime.toISOString(),
        meetingSettings: scheduleForm.meetingSettings,
      });

      if (response.success) {
        setSuccess("Meeting scheduled successfully!");
        loadUpcomingMeetings();
        resetScheduleForm();
      }
    } catch (error) {
      setError(error.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const startScheduledMeeting = async (scheduleId) => {
    try {
      setLoading(true);
      const response = await apiCall(`/start-scheduled/${scheduleId}`, "POST");

      if (response.success) {
        setSuccess("Meeting started successfully!");
        // Join the meeting directly
        setRoomUrl(response.data.roomUrl);
        setCurrentRoomId(response.data.roomId);
        setRoomName(response.data.roomName);
        setIsMeetingStarted(true);
        joinMeetingRoom(response.data.roomUrl);
        loadScheduledMeetings();
      }
    } catch (error) {
      setError(error.message || "Failed to start meeting");
    } finally {
      setLoading(false);
    }
  };

  const resetScheduleForm = () => {
    setScheduleForm({
      meetingName: "",
      roomType: "",
      teamName: "",
      date: "",
      time: "",
      duration: 60,
      description: "",
      reminderMinutes: 15,
      emailReminder: true,
      meetingSettings: {
        enableChat: true,
        enableKnocking: true,
        startVideoOff: false,
        startAudioOff: false,
        maxParticipants: 50,
      },
    });
  };

  // Meeting functions
  // Check media permissions before starting meeting
  const checkMediaPermissions = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Media devices not supported in this browser");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      // Stop the test stream
      stream.getTracks().forEach((track) => track.stop());
      return true;
    } catch (error) {
      console.error("Media permission check failed:", error);

      if (error.name === "NotAllowedError") {
        setError(
          "Camera and microphone access is required for video meetings. Please allow permissions and try again."
        );
      } else if (error.name === "NotFoundError") {
        setError(
          "No camera or microphone found. Please connect media devices and try again."
        );
      } else {
        setError(`Media access error: ${error.message}`);
      }

      return false;
    }
  };

  const createRoom = async () => {
    if (!userName.trim()) {
      setError("Please enter your name before creating a meeting");
      return;
    }

    // Check media permissions before creating the meeting
    const hasPermissions = await checkMediaPermissions();
    if (!hasPermissions) {
      return; // Error already set by checkMediaPermissions
    }

    try {
      setLoading(true);
      setError("");

      // Set default room type based on user role
      let finalRoomType = createForm.roomType;
      if (!finalRoomType) {
        if (user.role === "Employee") {
          finalRoomType = "team";
        } else if (
          user.role === "Super_Admin" ||
          (user.role === "Admin" && user.subRole === "HR Manager")
        ) {
          finalRoomType = "global";
        }
      }

      const meetingData = {
        roomName: createForm.roomName || `Meeting by ${userName}`,
        roomType: finalRoomType,
        teamName:
          finalRoomType === "team"
            ? createForm.teamName || user.team
            : undefined,
        inviteUserIds: createForm.inviteUserIds,
        meetingSettings: {
          enableChat: createForm.enableChat,
          enableKnocking: createForm.enableKnocking,
          startVideoOff: !isVideoOn,
          startAudioOff: !isAudioOn,
          maxParticipants: createForm.maxParticipants,
        },
      };

      const response = await apiCall("/create", "POST", meetingData);

      if (response.success) {
        setRoomUrl(response.data.roomUrl);
        setCurrentRoomId(response.data.roomId);
        setRoomName(response.data.roomName);
        setIsMeetingStarted(true);
        setShowCreateModal(false);
        setSuccess("Meeting created successfully!");

        // Join the meeting
        joinMeetingRoom(response.data.roomUrl);

        // Refresh meetings list
        loadAvailableMeetings();
      }
    } catch (error) {
      setError(
        "Failed to create meeting: " + (error.message || "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async (roomId = null, inviteToken = null) => {
    if (!userName.trim()) {
      setError("Please enter your name before joining a meeting");
      return;
    }

    try {
      setLoading(true);
      setError("");

      let joinData = {};

      if (inviteToken) {
        joinData.inviteToken = inviteToken;
      } else if (roomId) {
        joinData.roomId = roomId;
      } else if (joinLink) {
        // Try to extract roomId from join link
        const linkParts = joinLink.split("/");
        const extractedRoomId = linkParts[linkParts.length - 1];
        joinData.roomId = extractedRoomId;
      } else {
        setError("Please provide a meeting link or room ID");
        return;
      }

      const response = await apiCall("/join", "POST", joinData);

      if (response.success) {
        setRoomUrl(response.data.roomUrl);
        setCurrentRoomId(response.data.roomId);
        setRoomName(response.data.roomName);
        setIsMeetingStarted(true);
        setShowJoinModal(false);
        setSuccess("Joined meeting successfully!");

        // Join the meeting
        joinMeetingRoom(response.data.roomUrl);

        // Refresh meetings list
        loadAvailableMeetings();
      }
    } catch (error) {
      setError("Failed to join meeting: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  const joinMeetingRoom = async (url) => {
    console.log("🚀 Attempting to join meeting room:", url);

    if (!containerRef.current) {
      console.error("❌ Container ref not available");
      setError("Meeting container not ready. Please try again.");
      return;
    }

    if (!url) {
      console.error("❌ No meeting URL provided");
      setError("Invalid meeting URL");
      return;
    }

    try {
      // Check browser permissions first
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        try {
          console.log("🔒 Checking media permissions...");
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          console.log("✅ Media permissions granted");
          // Stop the test stream
          stream.getTracks().forEach((track) => track.stop());
        } catch (permError) {
          console.warn("⚠️ Media permission issue:", permError.message);
          if (permError.name === "NotAllowedError") {
            setError(
              "Please allow camera and microphone access to join the meeting"
            );
            return;
          }
        }
      }

      if (!callFrameRef.current) {
        console.log("📦 Creating Daily.co frame...");

        callFrameRef.current = DailyIframe.createFrame(containerRef.current, {
          url: url,
          iframeStyle: {
            width: "100%",
            height: "100%",
            border: "none",
            borderRadius: "12px",
          },
          showLeaveButton: false,
          showFullscreenButton: true,
        });

        // Enhanced event listeners with debugging
        callFrameRef.current.on("loaded", () => {
          console.log("✅ Daily.co frame loaded");
        });

        callFrameRef.current.on("error", (error) => {
          console.error("❌ Daily.co error:", error);
          setError(`Meeting error: ${error.message || "Unknown error"}`);
        });

        callFrameRef.current.on("camera-error", (error) => {
          console.error("📹 Camera error:", error);
          setError(
            "Camera access issue. Please check your camera permissions."
          );
        });

        callFrameRef.current.on("microphone-error", (error) => {
          console.error("🎤 Microphone error:", error);
          setError(
            "Microphone access issue. Please check your microphone permissions."
          );
        });

        callFrameRef.current.on("joined-meeting", (event) => {
          console.log("🎉 Successfully joined meeting!", event);
          setError(""); // Clear any previous errors
          updateParticipantCount();
        });

        callFrameRef.current.on("participant-joined", (event) => {
          console.log("👋 Participant joined:", event.participant.user_name);
          updateParticipantCount();
        });

        callFrameRef.current.on("participant-left", (event) => {
          console.log("👋 Participant left:", event.participant.user_name);
          updateParticipantCount();
        });

        callFrameRef.current.on("left-meeting", () => {
          console.log("🚪 Left meeting");
          handleLeaveMeeting();
        });

        console.log("🚀 Joining meeting with settings:", {
          url: url,
          userName: userName,
          startVideoOff: !isVideoOn,
          startAudioOff: !isAudioOn,
        });

        callFrameRef.current.join({
          url: url,
          userName: userName,
          startVideoOff: !isVideoOn,
          startAudioOff: !isAudioOn,
        });
      }
    } catch (error) {
      console.error("❌ Error joining meeting room:", error);
      setError(`Failed to join meeting: ${error.message}`);
    }
  };

  const updateParticipantCount = () => {
    if (callFrameRef.current) {
      const participantsObj = callFrameRef.current.participants();
      setParticipants(Object.keys(participantsObj).length);
    }
  };

  const toggleVideo = async () => {
    console.log("📹 Toggling video, current state:", isVideoOn);

    if (callFrameRef.current) {
      try {
        const newState = !isVideoOn;
        await callFrameRef.current.setLocalVideo(newState);
        setIsVideoOn(newState);
        console.log(`📹 Video ${newState ? "enabled" : "disabled"}`);
      } catch (error) {
        console.error("❌ Error toggling video:", error);
        setError(
          "Failed to toggle video. Please check your camera permissions."
        );
      }
    } else {
      console.log("📹 No active call frame, updating state only");
      setIsVideoOn(!isVideoOn);
    }
  };

  const toggleAudio = async () => {
    console.log("🎤 Toggling audio, current state:", isAudioOn);

    if (callFrameRef.current) {
      try {
        const newState = !isAudioOn;
        await callFrameRef.current.setLocalAudio(newState);
        setIsAudioOn(newState);
        console.log(`🎤 Audio ${newState ? "enabled" : "disabled"}`);
      } catch (error) {
        console.error("❌ Error toggling audio:", error);
        setError(
          "Failed to toggle audio. Please check your microphone permissions."
        );
      }
    } else {
      console.log("🎤 No active call frame, updating state only");
      setIsAudioOn(!isAudioOn);
    }
  };

  const handleLeaveMeeting = async () => {
    try {
      if (currentRoomId) {
        await apiCall(`/${currentRoomId}/leave`, "PUT");
      }
    } catch (error) {
      console.error("Error leaving meeting:", error);
    }

    endMeeting();
  };

  const endMeeting = () => {
    if (callFrameRef.current) {
      callFrameRef.current.destroy();
      callFrameRef.current = null;
    }
    setIsMeetingStarted(false);
    setRoomUrl("");
    setCurrentRoomId("");
    setJoinLink("");
    setParticipants(0);

    // Refresh meetings list
    loadAvailableMeetings();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomUrl);
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 3000);
  };

  // Helper functions for role-based UI
  const canCreateMeeting = () => {
    return user?.role !== "Intern";
  };

  const canCreateGlobalMeeting = () => {
    return (
      user?.role === "Super_Admin" ||
      (user?.role === "Admin" && user?.subRole === "HR Manager")
    );
  };

  const canCreateTeamMeeting = () => {
    return (
      user?.role === "Employee" ||
      user?.role === "Admin" ||
      user?.role === "Super_Admin"
    );
  };

  const getMeetingTypeIcon = (roomType) => {
    return roomType === "global" ? <FaGlobe /> : <FaUsers />;
  };

  const getMeetingStatusColor = (meetingStatus) => {
    switch (meetingStatus) {
      case "active":
        return "text-green-600";
      case "ended":
        return "text-red-600";
      case "scheduled":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError("");
        setSuccess("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
        callFrameRef.current = null;
      }
    };
  }, []);

  // Show loading if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="meeting-container">
        <div className="meeting-header">
          <h1>Video Conference</h1>
        </div>
        <div className="meeting-content">
          <div className="text-center">
            <p>Please log in to access the meeting system.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div className="meeting-container responsive">
        <div className="meeting-header responsive-header">
          <h1>Video Conference System</h1>
          <div className="user-info">
            <span className="user-role">{user.role}</span>
            {user.subRole && (
              <span className="user-subrole">({user.subRole})</span>
            )}
            {user.team && <span className="user-team">Team: {user.team}</span>}
          </div>
          {isMeetingStarted && (
            <div className="meeting-info">
              <span className="participant-count">
                <FaUserPlus /> {participants} participant
                {participants !== 1 ? "s" : ""}
              </span>
            </div>
          )}
        </div>

      {/* Quick Stats Bar */}
      {!isMeetingStarted && (
        <div className="quick-actions">
          <div className="quick-stats">
            {upcomingMeetings.length > 0 && (
              <div className="stat-item">
                <FaClock />
                <span>
                  {upcomingMeetings.length} upcoming meeting
                  {upcomingMeetings.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
            {availableMeetings.length > 0 && (
              <div className="stat-item">
                <FaUsers />
                <span>
                  {availableMeetings.length} active meeting
                  {availableMeetings.length > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* <div className="quick-buttons">
            {canCreateMeeting() && (
              <button
                className="quick-action-btn schedule"
                onClick={() => setActiveTab("schedule")}
              >
                <FaCalendarPlus /> Quick Schedule
              </button>
            )}

            <button
              className="quick-action-btn instant"
              onClick={() => setActiveTab("create")}
            >
              <FaVideo /> Instant Meeting
            </button>

            {(user.role === "Super_Admin" ||
              (user.role === "Admin" && user.subRole === "HR Manager")) && (
              <button
                className="quick-action-btn analytics"
                onClick={() => setActiveTab("analytics")}
              >
                <FaChartBar /> Analytics
              </button>
            )}
          </div> */}
        </div>
      )}

      {/* Error and Success Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")} className="alert-close">
            ×
          </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")} className="alert-close">
            ×
          </button>
        </div>
      )}

      <div className="meeting-content">
          {!isMeetingStarted ? (
            <div className="meeting-dashboard responsive-dashboard">
            {/* Tab Navigation */}
            <div className="tab-navigation">
              <button
                className={`tab-button ${
                  activeTab === "meetings" ? "active" : ""
                }`}
                onClick={() => setActiveTab("meetings")}
              >
                <FaUsers /> Available Meetings
              </button>
              {canCreateMeeting() && (
                <button
                  className={`tab-button ${
                    activeTab === "create" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("create")}
                >
                  <FaPlus /> Create Meeting
                </button>
              )}
              <button
                className={`tab-button ${activeTab === "join" ? "active" : ""}`}
                onClick={() => setActiveTab("join")}
              >
                <FaLink /> Join Meeting
              </button>
              {canCreateMeeting() && (
                <button
                  className={`tab-button ${
                    activeTab === "schedule" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("schedule")}
                >
                  <FaCalendarPlus /> Schedule Meeting
                </button>
              )}
              {(user.role === "Super_Admin" ||
                (user.role === "Admin" && user.subRole === "HR Manager")) && (
                <button
                  className={`tab-button ${
                    activeTab === "analytics" ? "active" : ""
                  }`}
                  onClick={() => setActiveTab("analytics")}
                >
                  <FaChartBar /> Analytics
                </button>
              )}
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Available Meetings Tab */}
                {activeTab === "meetings" && (
                  <div className="meetings-list responsive-list">
                  <div className="section-header">
                    <h2>Available Meetings</h2>
                    <button
                      onClick={loadAvailableMeetings}
                      className="refresh-button"
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Refresh"}
                    </button>
                  </div>

                  {loading ? (
                    <div className="loading-spinner">Loading meetings...</div>
                  ) : availableMeetings.length === 0 ? (
                    <div className="no-meetings">
                      <p>No active meetings available.</p>
                      {canCreateMeeting() && (
                        <button
                          className="create-button"
                          onClick={() => setActiveTab("create")}
                        >
                          Create Your First Meeting
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="meetings-grid">
                        {availableMeetings.map((meeting) => (
                          <div key={meeting.roomId} className="meeting-card responsive-card">
                          <div className="meeting-card-header">
                            <div className="meeting-type">
                              {getMeetingTypeIcon(meeting.roomType)}
                              <span className="room-type">
                                {meeting.roomType}
                              </span>
                            </div>
                            <span
                              className={`meeting-status ${getMeetingStatusColor(
                                meeting.meetingStatus
                              )}`}
                            >
                              {meeting.meetingStatus}
                            </span>
                          </div>

                          <h3 className="meeting-title">{meeting.roomName}</h3>

                          {meeting.teamName && (
                            <p className="team-name">
                              Team: {meeting.teamName}
                            </p>
                          )}

                          <div className="meeting-details">
                            <p className="created-by">
                              Created by: {meeting.createdBy.name} (
                              {meeting.createdBy.role})
                            </p>
                            <p className="participants">
                              <FaUsers /> {meeting.activeParticipants} active
                              participants
                            </p>
                            <p className="created-time">
                              <FaClock />{" "}
                              {new Date(meeting.createdAt).toLocaleString()}
                            </p>
                          </div>

                          <div className="meeting-actions">
                            {meeting.canJoin ? (
                              <button
                                className="join-button"
                                onClick={() => joinMeeting(meeting.roomId)}
                                disabled={loading}
                              >
                                <FaUserCheck /> Join Meeting
                              </button>
                            ) : (
                              <button className="join-button disabled" disabled>
                                <FaLock /> Access Denied
                              </button>
                            )}

                            <button
                              className="copy-button"
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  meeting.meetingUrls.standardUrl
                                );
                                setSuccess("Meeting link copied!");
                              }}
                            >
                              <FaCopy /> Copy Link
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Create Meeting Tab */}
              {activeTab === "create" && canCreateMeeting() && (
                  <div className="create-meeting responsive-create">
                  <div className="section-header">
                    <h2>Create New Meeting</h2>
                  </div>

                  <div className="create-form">
                      <div className="form-section responsive-form-section">
                      <h3>Meeting Details</h3>

                      <div className="input-group">
                        <label htmlFor="userName">Your Name *</label>
                        <input
                          id="userName"
                          type="text"
                          placeholder="Enter your name"
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="roomName">Meeting Name</label>
                        <input
                          id="roomName"
                          type="text"
                          placeholder="Enter meeting name (optional)"
                          value={createForm.roomName}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              roomName: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="roomType">Meeting Type</label>
                        <select
                          id="roomType"
                          value={createForm.roomType}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              roomType: e.target.value,
                            }))
                          }
                        >
                          <option value="">Auto (based on your role)</option>
                          {canCreateGlobalMeeting() && (
                            <option value="global">Global Meeting</option>
                          )}
                          {canCreateTeamMeeting() && (
                            <option value="team">Team Meeting</option>
                          )}
                        </select>
                      </div>

                      {(createForm.roomType === "team" ||
                        (!createForm.roomType && user.role === "Employee")) && (
                        <div className="input-group">
                          <label htmlFor="teamName">Team Name</label>
                          <input
                            id="teamName"
                            type="text"
                            placeholder={user.team || "Enter team name"}
                            value={createForm.teamName}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                teamName: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-section">
                        <h3>Media Settings</h3>

                      <div className="media-toggles">
                        <button
                          type="button"
                          className={`media-toggle ${
                            isVideoOn ? "active" : ""
                          }`}
                          onClick={toggleVideo}
                        >
                          {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
                          {isVideoOn ? "Video On" : "Video Off"}
                        </button>

                        <button
                          type="button"
                          className={`media-toggle ${
                            isAudioOn ? "active" : ""
                          }`}
                          onClick={toggleAudio}
                        >
                          {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                          {isAudioOn ? "Audio On" : "Audio Off"}
                        </button>
                      </div>
                    </div>

                    <div className="form-section">
                        <h3>Advanced Settings</h3>

                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={createForm.enableChat}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                enableChat: e.target.checked,
                              }))
                            }
                          />
                          Enable Chat
                        </label>
                      </div>

                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={createForm.enableKnocking}
                            onChange={(e) =>
                              setCreateForm((prev) => ({
                                ...prev,
                                enableKnocking: e.target.checked,
                              }))
                            }
                          />
                          Enable Knocking
                        </label>
                      </div>

                      <div className="input-group">
                        <label htmlFor="maxParticipants">
                          Max Participants
                        </label>
                        <input
                          id="maxParticipants"
                          type="number"
                          min="2"
                          max="100"
                          value={createForm.maxParticipants}
                          onChange={(e) =>
                            setCreateForm((prev) => ({
                              ...prev,
                              maxParticipants: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="form-actions">
                        <button
                          type="button"
                          className="create-button responsive-btn"
                          onClick={createRoom}
                          disabled={loading || !userName.trim()}
                        >
                          <FaVideo /> {loading ? "Creating..." : "Create Meeting"}
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Join Meeting Tab */}
              {activeTab === "join" && (
                  <div className="join-meeting responsive-join">
                  <div className="section-header">
                    <h2>Join Meeting</h2>
                  </div>

                  <div className="join-form">
                      <div className="input-group responsive-input-group">
                      <label htmlFor="userName2">Your Name *</label>
                      <input
                        id="userName2"
                        type="text"
                        placeholder="Enter your name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="input-group">
                      <label htmlFor="joinLink">Meeting Link or Room ID</label>
                      <input
                        id="joinLink"
                        type="text"
                        placeholder="Paste meeting link or enter room ID"
                        value={joinLink}
                        onChange={(e) => setJoinLink(e.target.value)}
                      />
                    </div>

                    <div className="media-toggles">
                      <button
                        type="button"
                        className={`media-toggle ${isVideoOn ? "active" : ""}`}
                        onClick={toggleVideo}
                      >
                        {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
                        {isVideoOn ? "Video On" : "Video Off"}
                      </button>

                      <button
                        type="button"
                        className={`media-toggle ${isAudioOn ? "active" : ""}`}
                        onClick={toggleAudio}
                      >
                        {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                        {isAudioOn ? "Audio On" : "Audio Off"}
                      </button>
                    </div>

                    <div className="form-actions">
                        <button
                          type="button"
                          className="join-button responsive-btn"
                          onClick={() => joinMeeting()}
                          disabled={
                            loading || !userName.trim() || !joinLink.trim()
                          }
                        >
                          <FaLink /> {loading ? "Joining..." : "Join Meeting"}
                        </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === "analytics" &&
                (user.role === "Super_Admin" ||
                  (user.role === "Admin" && user.subRole === "HR Manager")) && (
                    <div className="analytics-dashboard responsive-analytics">
                    <div className="section-header">
                      <h2>Meeting Analytics</h2>
                      <button
                        onClick={loadMeetingStats}
                        className="refresh-button"
                      >
                        Refresh Data
                      </button>
                    </div>

                    {meetingStats ? (
                      <div className="stats-grid">
                        <div className="stat-card">
                          <h3>Total Meetings</h3>
                          <p className="stat-number">
                            {meetingStats.overview.totalMeetings}
                          </p>
                        </div>
                        <div className="stat-card">
                          <h3>Active Meetings</h3>
                          <p className="stat-number">
                            {meetingStats.overview.activeMeetings}
                          </p>
                        </div>
                        <div className="stat-card">
                          <h3>Today's Meetings</h3>
                          <p className="stat-number">
                            {meetingStats.overview.todaysMeetings}
                          </p>
                        </div>
                        <div className="stat-card">
                          <h3>Avg Duration</h3>
                          <p className="stat-number">
                            {meetingStats.overview.avgDurationMinutes} min
                          </p>
                        </div>
                        <div className="stat-card">
                          <h3>Global Meetings</h3>
                          <p className="stat-number">
                            {meetingStats.distribution.globalMeetings}
                          </p>
                        </div>
                        <div className="stat-card">
                          <h3>Team Meetings</h3>
                          <p className="stat-number">
                            {meetingStats.distribution.teamMeetings}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="loading-spinner">
                        Loading analytics...
                      </div>
                    )}
                  </div>
                )}

              {/* Schedule Meeting Tab */}
              {activeTab === "schedule" && canCreateMeeting() && (
                  <div className="schedule-meeting responsive-schedule">
                  <div className="section-header">
                    <h2>Schedule Meeting</h2>
                  </div>

                  <div className="schedule-form">
                      <div className="form-section responsive-form-section">
                      <h3>Meeting Information</h3>

                      <div className="input-group">
                        <label htmlFor="scheduleMeetingName">
                          Meeting Name *
                        </label>
                        <input
                          id="scheduleMeetingName"
                          type="text"
                          placeholder="Enter meeting name"
                          value={scheduleForm.meetingName}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              meetingName: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="scheduleDescription">Description</label>
                        <textarea
                          id="scheduleDescription"
                          placeholder="Meeting description (optional)"
                          value={scheduleForm.description}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          rows="3"
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="scheduleType">Meeting Type</label>
                        <select
                          id="scheduleType"
                          value={scheduleForm.roomType}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              roomType: e.target.value,
                            }))
                          }
                        >
                          <option value="">Auto (based on your role)</option>
                          {canCreateGlobalMeeting() && (
                            <option value="global">Global Meeting</option>
                          )}
                          {canCreateTeamMeeting() && (
                            <option value="team">Team Meeting</option>
                          )}
                        </select>
                      </div>

                      {(scheduleForm.roomType === "team" ||
                        (!scheduleForm.roomType &&
                          user.role === "Employee")) && (
                        <div className="input-group">
                          <label htmlFor="scheduleTeamName">Team Name</label>
                          <input
                            id="scheduleTeamName"
                            type="text"
                            placeholder={user.team || "Enter team name"}
                            value={scheduleForm.teamName}
                            onChange={(e) =>
                              setScheduleForm((prev) => ({
                                ...prev,
                                teamName: e.target.value,
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>

                    <div className="form-section">
                        <h3>Date & Time</h3>

                      <div className="input-group">
                        <label htmlFor="scheduleDate">Date *</label>
                        <input
                          id="scheduleDate"
                          type="date"
                          value={scheduleForm.date}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          min={new Date().toISOString().split("T")[0]}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="scheduleTime">Time *</label>
                        <input
                          id="scheduleTime"
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              time: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="scheduleDuration">
                          Duration (minutes)
                        </label>
                        <input
                          id="scheduleDuration"
                          type="number"
                          min="15"
                          max="480"
                          step="15"
                          value={scheduleForm.duration}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              duration: parseInt(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="form-section">
                        <h3>Notification Settings</h3>

                      <div className="checkbox-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={scheduleForm.emailReminder}
                            onChange={(e) =>
                              setScheduleForm((prev) => ({
                                ...prev,
                                emailReminder: e.target.checked,
                              }))
                            }
                          />
                          Send email reminder
                        </label>
                      </div>

                      <div className="input-group">
                        <label htmlFor="reminderMinutes">
                          Reminder (minutes before)
                        </label>
                        <select
                          id="reminderMinutes"
                          value={scheduleForm.reminderMinutes}
                          onChange={(e) =>
                            setScheduleForm((prev) => ({
                              ...prev,
                              reminderMinutes: parseInt(e.target.value),
                            }))
                          }
                          disabled={!scheduleForm.emailReminder}
                        >
                          <option value="5">5 minutes</option>
                          <option value="10">10 minutes</option>
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-actions">
                        <button
                          type="button"
                          className="cancel-button responsive-btn"
                          onClick={resetScheduleForm}
                        >
                          Reset
                        </button>
                        <button
                          type="submit"
                          className="schedule-button responsive-btn"
                          onClick={scheduleMeeting}
                          disabled={
                            !scheduleForm.meetingName ||
                            !scheduleForm.date ||
                            !scheduleForm.time
                          }
                        >
                          <FaCalendarPlus /> Schedule Meeting
                        </button>
                    </div>
                  </div>

                  {/* Scheduled Meetings List */}
                  <div className="scheduled-meetings-section">
                    <div className="section-header">
                      <h3>Scheduled Meetings</h3>
                      <button
                        onClick={loadUpcomingMeetings}
                        className="refresh-button"
                        disabled={loading}
                      >
                        {loading ? "Loading..." : "Refresh"}
                      </button>
                    </div>

                    {upcomingMeetings.length === 0 ? (
                      <div className="no-meetings">
                        <p>No meetings scheduled.</p>
                      </div>
                    ) : (
                      <div className="scheduled-meetings-list">
                          {upcomingMeetings.map((meeting) => (
                            <div
                              key={meeting._id}
                              className="scheduled-meeting-card responsive-card"
                            >
                            <div className="meeting-header">
                              <h4>{meeting.meetingName}</h4>
                              <span
                                className={`meeting-status ${meeting.status}`}
                              >
                                {meeting.status}
                              </span>
                            </div>

                            <div className="meeting-details">
                              <p>
                                <FaClock />{" "}
                                {new Date(
                                  meeting.scheduledDateTime
                                ).toLocaleString()}
                              </p>
                              <p>
                                <FaUsers /> Duration: {meeting.duration} minutes
                              </p>
                              {meeting.teamName && (
                                <p>Team: {meeting.teamName}</p>
                              )}
                              {meeting.description && (
                                <p>{meeting.description}</p>
                              )}
                            </div>

                            <div className="meeting-actions">
                              {meeting.status === "scheduled" &&
                                new Date(meeting.scheduledDateTime) <=
                                  new Date() && (
                                  <button
                                    className="start-button"
                                    onClick={() =>
                                      startScheduledMeeting(meeting._id)
                                    }
                                  >
                                    <FaPlay /> Start Meeting
                                  </button>
                                )}
                              <button
                                className="copy-button"
                                onClick={() => {
                                  const meetingInfo = `Meeting: ${
                                    meeting.meetingName
                                  }\nDate: ${new Date(
                                    meeting.scheduledDateTime
                                  ).toLocaleString()}\nDuration: ${
                                    meeting.duration
                                  } minutes`;
                                  navigator.clipboard.writeText(meetingInfo);
                                  setSuccess("Meeting details copied!");
                                }}
                              >
                                <FaCopy /> Copy Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="meeting-active">
              <div className="video-container responsive-video" ref={containerRef}></div>

              <div className="meeting-controls responsive-controls">
                <div className="control-group responsive-control-group">
                  <button
                    className={`control-button responsive-btn ${isVideoOn ? "active" : ""}`}
                    onClick={toggleVideo}
                  >
                    {isVideoOn ? <FaVideo /> : <FaVideoSlash />}
                  </button>
                  <button
                    className={`control-button responsive-btn ${isAudioOn ? "active" : ""}`}
                    onClick={toggleAudio}
                  >
                    {isAudioOn ? <FaMicrophone /> : <FaMicrophoneSlash />}
                  </button>
                </div>

                <div className="meeting-info-bar responsive-info-bar">
                  <span className="room-name">{roomName}</span>
                  <span className="participant-count">
                    <FaUserPlus /> {participants} participant
                    {participants !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="control-group responsive-control-group">
                  <button className="share-button responsive-btn" onClick={copyToClipboard}>
                    <FaCopy /> {isLinkCopied ? "Copied!" : "Copy Link"}
                  </button>
                  <button className="end-button responsive-btn" onClick={handleLeaveMeeting}>
                    <FaSignOutAlt /> Leave Meeting
                  </button>
                </div>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meeting;
