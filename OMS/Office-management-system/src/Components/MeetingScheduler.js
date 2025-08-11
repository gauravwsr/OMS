// Enhanced Meeting Scheduler Component
import React, { useState, useEffect } from "react";
import {
  FaCalendarPlus,
  FaClock,
  FaUsers,
  FaEdit,
  FaTrash,
  FaPlay,
  FaBell,
  FaCalendarCheck,
} from "react-icons/fa";
import { useAuth } from "./AuthProvider/AuthContext";
import axios from "axios";
import "./MeetingScheduler.css";

const MeetingScheduler = () => {
  const { user } = useAuth();
  const [scheduledMeetings, setScheduledMeetings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const [scheduleForm, setScheduleForm] = useState({
    roomName: "",
    roomType: "",
    teamName: "",
    scheduledDate: "",
    scheduledTime: "",
    duration: 60,
    inviteUserIds: [],
    description: "",
    reminderMinutes: 15,
    meetingSettings: {
      enableChat: true,
      enableKnocking: true,
      startVideoOff: false,
      startAudioOff: false,
      maxParticipants: 50,
    },
  });

  useEffect(() => {
    loadScheduledMeetings();
  }, []);

  const loadScheduledMeetings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://146.190.165.62:5001/api/meetings/scheduled",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setScheduledMeetings(response.data.data || []);
    } catch (error) {
      setError("Failed to load scheduled meetings");
    } finally {
      setLoading(false);
    }
  };

  const scheduleMeeting = async () => {
    try {
      setLoading(true);
      setError("");

      // Combine date and time
      const scheduledDateTime = new Date(
        `${scheduleForm.scheduledDate}T${scheduleForm.scheduledTime}`
      );

      if (scheduledDateTime <= new Date()) {
        setError("Scheduled time must be in the future");
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://146.190.165.62:5001/api/meetings/schedule",
        {
          ...scheduleForm,
          scheduledAt: scheduledDateTime.toISOString(),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess("Meeting scheduled successfully!");
        setShowScheduleModal(false);
        loadScheduledMeetings();
        resetForm();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to schedule meeting");
    } finally {
      setLoading(false);
    }
  };

  const startScheduledMeeting = async (scheduleId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://146.190.165.62:5001/api/meetings/start-scheduled/${scheduleId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        setSuccess("Meeting started successfully!");
        // Redirect to meeting room
        window.open(response.data.data.roomUrl, "_blank");
        loadScheduledMeetings();
      }
    } catch (error) {
      setError(error.response?.data?.message || "Failed to start meeting");
    } finally {
      setLoading(false);
    }
  };

  const deleteScheduledMeeting = async (scheduleId) => {
    if (
      !window.confirm("Are you sure you want to delete this scheduled meeting?")
    ) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://146.190.165.62:5001/api/meetings/scheduled/${scheduleId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Scheduled meeting deleted successfully!");
      loadScheduledMeetings();
    } catch (error) {
      setError(
        error.response?.data?.message || "Failed to delete scheduled meeting"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (scheduleId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      await axios.post(
        `http://146.190.165.62:5001/api/meetings/send-reminder/${scheduleId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Reminder sent successfully!");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to send reminder");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setScheduleForm({
      roomName: "",
      roomType: "",
      teamName: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 60,
      inviteUserIds: [],
      description: "",
      reminderMinutes: 15,
      meetingSettings: {
        enableChat: true,
        enableKnocking: true,
        startVideoOff: false,
        startAudioOff: false,
        maxParticipants: 50,
      },
    });
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getTimeUntilMeeting = (scheduledAt) => {
    const now = new Date();
    const meetingTime = new Date(scheduledAt);
    const diffMs = meetingTime - now;

    if (diffMs <= 0) return "Past due";

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? "s" : ""}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  const canScheduleMeeting = () => {
    return user?.role !== "Intern";
  };

  return (
    <div className="meeting-scheduler">
      <div className="scheduler-header">
        <h2>Meeting Scheduler</h2>
        {canScheduleMeeting() && (
          <button
            className="schedule-button"
            onClick={() => setShowScheduleModal(true)}
          >
            <FaCalendarPlus /> Schedule Meeting
          </button>
        )}
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      {/* Scheduled Meetings List */}
      <div className="scheduled-meetings">
        {loading ? (
          <div className="loading">Loading scheduled meetings...</div>
        ) : scheduledMeetings.length === 0 ? (
          <div className="no-meetings">
            <FaCalendarCheck size={48} />
            <p>No scheduled meetings found.</p>
            {canScheduleMeeting() && (
              <button
                className="schedule-button"
                onClick={() => setShowScheduleModal(true)}
              >
                Schedule Your First Meeting
              </button>
            )}
          </div>
        ) : (
          <div className="meetings-grid">
            {scheduledMeetings.map((meeting) => {
              const { date, time } = formatDateTime(meeting.scheduledAt);
              const timeUntil = getTimeUntilMeeting(meeting.scheduledAt);
              const isPastDue = new Date(meeting.scheduledAt) <= new Date();
              const canStart =
                new Date(meeting.scheduledAt) <=
                new Date(Date.now() + 15 * 60 * 1000); // 15 minutes before

              return (
                <div
                  key={meeting._id}
                  className={`scheduled-meeting-card ${
                    isPastDue ? "past-due" : ""
                  }`}
                >
                  <div className="meeting-card-header">
                    <h3>{meeting.roomName}</h3>
                    <div className="meeting-type">
                      <span className={`type-badge ${meeting.roomType}`}>
                        {meeting.roomType === "global" ? "Global" : "Team"}
                      </span>
                    </div>
                  </div>

                  <div className="meeting-details">
                    {meeting.teamName && (
                      <p className="team-name">Team: {meeting.teamName}</p>
                    )}

                    <div className="schedule-info">
                      <div className="schedule-time">
                        <FaClock />
                        <span>
                          {date} at {time}
                        </span>
                      </div>
                      <div className="time-until">
                        {isPastDue ? (
                          <span className="past-due-text">Past due</span>
                        ) : (
                          <span>In {timeUntil}</span>
                        )}
                      </div>
                    </div>

                    <div className="meeting-meta">
                      <p>Duration: {meeting.duration} minutes</p>
                      <p>Created by: {meeting.createdBy.name}</p>
                      {meeting.description && (
                        <p className="description">{meeting.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="meeting-actions">
                    {canStart && !isPastDue && (
                      <button
                        className="start-button"
                        onClick={() => startScheduledMeeting(meeting._id)}
                        disabled={loading}
                      >
                        <FaPlay /> Start Now
                      </button>
                    )}

                    <button
                      className="reminder-button"
                      onClick={() => sendReminder(meeting._id)}
                      disabled={loading}
                    >
                      <FaBell /> Send Reminder
                    </button>

                    {(meeting.createdBy._id === user._id ||
                      user.role === "Super_Admin" ||
                      (user.role === "Admin" &&
                        user.subRole === "HR Manager")) && (
                      <>
                        <button
                          className="edit-button"
                          onClick={() => {
                            // TODO: Implement edit functionality
                            setError("Edit functionality coming soon");
                          }}
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => deleteScheduledMeeting(meeting._id)}
                          disabled={loading}
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Schedule New Meeting</h3>
              <button
                className="modal-close"
                onClick={() => setShowScheduleModal(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Meeting Name *</label>
                <input
                  type="text"
                  value={scheduleForm.roomName}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      roomName: e.target.value,
                    }))
                  }
                  placeholder="Enter meeting name"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={scheduleForm.scheduledDate}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        scheduledDate: e.target.value,
                      }))
                    }
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    value={scheduleForm.scheduledTime}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        scheduledTime: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Meeting Type</label>
                  <select
                    value={scheduleForm.roomType}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        roomType: e.target.value,
                      }))
                    }
                  >
                    <option value="">Auto (based on role)</option>
                    {(user.role === "Super_Admin" ||
                      (user.role === "Admin" &&
                        user.subRole === "HR Manager")) && (
                      <option value="global">Global Meeting</option>
                    )}
                    <option value="team">Team Meeting</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Duration (minutes)</label>
                  <select
                    value={scheduleForm.duration}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        duration: parseInt(e.target.value),
                      }))
                    }
                  >
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                  </select>
                </div>
              </div>

              {(scheduleForm.roomType === "team" ||
                (!scheduleForm.roomType && user.role === "Employee")) && (
                <div className="form-group">
                  <label>Team Name</label>
                  <input
                    type="text"
                    value={scheduleForm.teamName}
                    onChange={(e) =>
                      setScheduleForm((prev) => ({
                        ...prev,
                        teamName: e.target.value,
                      }))
                    }
                    placeholder={user.team || "Enter team name"}
                  />
                </div>
              )}

              <div className="form-group">
                <label>Description (optional)</label>
                <textarea
                  value={scheduleForm.description}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Meeting agenda or description"
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Reminder</label>
                <select
                  value={scheduleForm.reminderMinutes}
                  onChange={(e) =>
                    setScheduleForm((prev) => ({
                      ...prev,
                      reminderMinutes: parseInt(e.target.value),
                    }))
                  }
                >
                  <option value={5}>5 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="cancel-button"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="schedule-button"
                onClick={scheduleMeeting}
                disabled={
                  loading ||
                  !scheduleForm.roomName ||
                  !scheduleForm.scheduledDate ||
                  !scheduleForm.scheduledTime
                }
              >
                {loading ? "Scheduling..." : "Schedule Meeting"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingScheduler;
