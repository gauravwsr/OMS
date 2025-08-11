// Enhanced Meeting System with Scheduler and Analytics
import React, { useState, useEffect } from "react";
import {
  FaVideo,
  FaCalendarPlus,
  FaChartBar,
  FaUsers,
  FaClock,
  FaPlay,
} from "react-icons/fa";
import { useAuth } from "./AuthProvider/AuthContext";
import Meeting from "./Meeting";
import MeetingScheduler from "./MeetingScheduler";
import MeetingAnalytics from "./MeetingAnalytics";
import "./MeetingSystem.css";

const MeetingEnhanced = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("meetings");
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadUpcomingMeetings();
    }
  }, [isAuthenticated, user]);

  const loadUpcomingMeetings = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/meetings/upcoming",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUpcomingMeetings(data.data || []);
      }
    } catch (error) {
      console.error("Failed to load upcoming meetings:", error);
    }
  };

  const canViewAnalytics = () => {
    return (
      user?.role === "Super_Admin" ||
      (user?.role === "Admin" && user?.subRole === "HR Manager")
    );
  };

  const canScheduleMeetings = () => {
    return user?.role !== "Intern";
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="meeting-container">
        <div className="meeting-header">
          <h1>Video Conference System</h1>
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
    <div className="meeting-enhanced-container">
      <div className="meeting-header">
        <h1>Video Conference System</h1>
        <div className="user-info">
          <span className="user-role">{user.role}</span>
          {user.subRole && (
            <span className="user-subrole">({user.subRole})</span>
          )}
          {user.team && <span className="user-team">Team: {user.team}</span>}
        </div>
      </div>

      {/* Quick Actions Bar */}
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
        </div>

        <div className="quick-buttons">
          {canScheduleMeetings() && (
            <button
              className="quick-action-btn schedule"
              onClick={() => setActiveTab("scheduler")}
            >
              <FaCalendarPlus /> Schedule
            </button>
          )}

          <button
            className="quick-action-btn instant"
            onClick={() => setActiveTab("meetings")}
          >
            <FaVideo /> Start Instant Meeting
          </button>

          {canViewAnalytics() && (
            <button
              className="quick-action-btn analytics"
              onClick={() => setActiveTab("analytics")}
            >
              <FaChartBar /> Analytics
            </button>
          )}
        </div>
      </div>

      {/* Upcoming Meetings Preview */}
      {upcomingMeetings.length > 0 && activeTab !== "scheduler" && (
        <div className="upcoming-meetings-preview">
          <h3>Upcoming Meetings</h3>
          <div className="upcoming-list">
            {upcomingMeetings.slice(0, 3).map((meeting) => {
              const meetingTime = new Date(meeting.scheduledAt);
              const now = new Date();
              const timeDiff = meetingTime - now;
              const canStart = timeDiff <= 15 * 60 * 1000 && timeDiff > 0; // 15 minutes before

              return (
                <div key={meeting._id} className="upcoming-meeting-item">
                  <div className="meeting-info">
                    <h4>{meeting.roomName}</h4>
                    <p>{meetingTime.toLocaleString()}</p>
                  </div>
                  {canStart && (
                    <button className="start-now-btn">
                      <FaPlay /> Start Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="enhanced-tab-navigation">
        <button
          className={`tab-button ${activeTab === "meetings" ? "active" : ""}`}
          onClick={() => setActiveTab("meetings")}
        >
          <FaVideo /> Instant Meetings
        </button>

        {canScheduleMeetings() && (
          <button
            className={`tab-button ${
              activeTab === "scheduler" ? "active" : ""
            }`}
            onClick={() => setActiveTab("scheduler")}
          >
            <FaCalendarPlus /> Scheduler
          </button>
        )}

        {canViewAnalytics() && (
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
      <div className="enhanced-tab-content">
        {activeTab === "meetings" && <Meeting />}
        {activeTab === "scheduler" && canScheduleMeetings() && (
          <MeetingScheduler />
        )}
        {activeTab === "analytics" && canViewAnalytics() && (
          <MeetingAnalytics user={user} />
        )}
      </div>
    </div>
  );
};

export default MeetingEnhanced;
