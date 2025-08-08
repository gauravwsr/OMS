import React, { useState, useEffect } from "react";
import axios from "axios";
import NotificationPopup from "./NotificationPopup/NotificationPopup";
import "./Homepage.css"; // Make sure to use this new CSS file

const NewDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Upcoming Events states
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      setLoading(true);

      try {
        const response = await fetch("http://localhost:5001/users/me", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to fetch user data. Status: ${response.status}`
          );
        }

        const data = await response.json();
        setUser(data);
        setLoading(false);
      } catch (error) {
        setError("Failed to load user data. Please try again later.");
        setLoading(false);
      }
    };

    const fetchUpcomingEvents = async () => {
      setEventsLoading(true);
      try {
        const token = localStorage.getItem("token");

        // Check if current user is HR Manager (Admin with HR Manager subRole)
        const isHRManager =
          user?.role === "Admin" && user?.subRole === "HR Manager";

        // Use GetData for all users (backend will handle HR Manager permissions)
        const apiUrl = "http://localhost:5001/GetData";

        const response = await axios.post(
          apiUrl,
          {},
          {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "application/json",
            },
          }
        );

        const allEvents = response.data || [];

        // Filter upcoming events (events that haven't ended yet)
        const now = new Date();
        const upcoming = allEvents
          .filter((event) => {
            const eventEnd = new Date(event.EndTime);
            return eventEnd >= now; // Include events that haven't ended yet
          })
          .sort((a, b) => new Date(a.StartTime) - new Date(b.StartTime)) // Sort by start time
          .slice(0, 10); // Show next 10 events for homepage

        setUpcomingEvents(upcoming);
        setEventsError(null);
      } catch (error) {
        setEventsError(error.message);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUserData();
    fetchUpcomingEvents();

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh upcoming events every 5 minutes to auto-remove finished events
    const eventsInterval = setInterval(fetchUpcomingEvents, 5 * 60 * 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(eventsInterval);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Helper function to format date for events
  const formatEventDate = (startTime, endTime) => {
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if event is currently ongoing
    if (startDate <= now && endDate >= now) {
      return `🔴 Ongoing`;
    }

    // Check if event starts today
    if (startDate.toDateString() === today.toDateString()) {
      return `Today, ${startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Check if event starts tomorrow
    if (startDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${startDate.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })}`;
    }

    // Other dates
    return startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = () => {
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return currentTime.toLocaleDateString("en-US", options);
  };

  const formatTime = () => {
    return currentTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="dashboard-wrapper">
        <div className="modern-loader-container">
          <div className="loader-wrapper">
            <div className="modern-spinner">
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
              <div className="spinner-ring"></div>
            </div>
            <div className="loading-content">
              <h3>Loading Dashboard</h3>
              <p>Please wait while we prepare your workspace...</p>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="modern-error-container">
          <div className="error-content">
            <div className="error-icon-modern">
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="#ef4444"
                  strokeWidth="2"
                />
                <path d="m15 9-6 6" stroke="#ef4444" strokeWidth="2" />
                <path d="m9 9 6 6" stroke="#ef4444" strokeWidth="2" />
              </svg>
            </div>
            <h3>Oops! Something went wrong</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button
                onClick={() => window.location.reload()}
                className="retry-button-modern primary"
              >
                <span>🔄</span>
                Try Again
              </button>
              <button
                onClick={() => window.history.back()}
                className="retry-button-modern secondary"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <NotificationPopup />

      {/* Show NotificationPopup only for Super Admin */}
      {user?.role === "Super_Admin" && <NotificationPopup />}

      <div className="dashboard-wrapper">
        <div className="dashboard-container-new">
          <div className="dashboard-main">
            
          {/* Enhanced User Profile Card */}
              <div className="profile-section">
                <h2 className="section-title">
                  <span className="title-icon">👤</span>
                  Employee Profile
                </h2>
                <div className="user-profile-card-modern">
                  <div className="profile-header">
                    <div className="profile-avatar">
                      <div className="avatar-circle">
                        <span>{user?.name?.charAt(0) || "U"}</span>
                      </div>
                      <div className="avatar-decoration">
                        <div className="decoration-ring"></div>
                        <div className="status-indicator online"></div>
                      </div>
                    </div>
                    <div className="profile-basic">
                      <h3 className="profile-name">{user?.name || "N/A"}</h3>
                      <p className="profile-id">ID: {user?.userId || "N/A"}</p>
                      <span className="profile-status active">
                        <span className="status-dot"></span>
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="profile-details-modern">
                    <div className="details-grid">
                      <div className="detail-card">
                        <div className="detail-icon">📧</div>
                        <div className="detail-content">
                          <label>Email Address</label>
                          <p className="email-value">{user?.email || "N/A"}</p>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-icon">🏢</div>
                        <div className="detail-content">
                          <label>Department</label>
                          <p>{user?.department || "General"}</p>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-icon">💼</div>
                        <div className="detail-content">
                          <label>Position</label>
                          <p>{user?.position || user?.role || "Employee"}</p>
                        </div>
                      </div>

                      <div className="detail-card">
                        <div className="detail-icon">🎯</div>
                        <div className="detail-content">
                          <label>Specialization</label>
                          <p>{user?.subRole || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            <div className="dashboard-content">
              {/* Enhanced Quick Stats */}
              <div className="stats-section">
                <h2 className="section-title">
                  <span className="title-icon">📊</span>
                  Quick Overview
                </h2>
                <div className="quick-stats-modern">
                  <div className="stat-card-modern secondary">
                    <div className="stat-visual">
                      <div className="stat-icon-modern">📅</div>
                      <div className="stat-decoration">
                        <div className="decoration-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-content">
                      <h3>Join Date</h3>
                      <p className="stat-value-modern">
                        {user
                          ? new Date(user.date).toLocaleDateString("en-GB")
                          : "N/A"}
                      </p>
                      <span className="stat-subtitle">Member since</span>
                    </div>
                  </div>

                  <div className="stat-card-modern tertiary">
                    <div className="stat-visual">
                      <div className="stat-icon-modern">🏆</div>
                      <div className="stat-badge">
                        <span className="badge-dot"></span>
                      </div>
                    </div>
                    <div className="stat-content">
                      <h3>Role</h3>
                      <p className="stat-value-modern">
                        {user?.role?.replace(/_/g, " ") || "N/A"}
                      </p>
                      <span className="stat-subtitle">Current position</span>
                    </div>
                  </div>

                  <div className="stat-card-modern quaternary">
                    <div className="stat-visual">
                      <div className="stat-icon-modern">🎯</div>
                      <div className="stat-pattern">
                        <div className="pattern-lines">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-content">
                      <h3>Sub Role</h3>
                      <p className="stat-value-modern">
                        {user?.subRole || "N/A"}
                      </p>
                      <span className="stat-subtitle">Specialization</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Activity Section */}
              <div className="activity-section-modern">
                <h2 className="section-title">
                  <span className="title-icon">📈</span>
                  Recent Activity
                </h2>
                <div className="activity-container">
                  <div className="activity-timeline-modern">
                    <div className="timeline-item-modern login">
                      <div className="timeline-marker">
                        <div className="marker-icon">📥</div>
                        <div className="marker-line"></div>
                      </div>
                      <div className="timeline-content-modern">
                        <div className="activity-header">
                          <h4>System Login</h4>
                          <span className="activity-badge success">Active</span>
                        </div>
                        <p>You logged into the system successfully</p>
                        <span className="activity-time">
                          <span className="time-icon">🕐</span>
                          Today,{" "}
                          {new Date().toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="timeline-item-modern update">
                      <div className="timeline-marker">
                        <div className="marker-icon">📝</div>
                        <div className="marker-line"></div>
                      </div>
                      <div className="timeline-content-modern">
                        <div className="activity-header">
                          <h4>Profile Updated</h4>
                          <span className="activity-badge info">Updated</span>
                        </div>
                        <p>Your profile information was successfully updated</p>
                        <span className="activity-time">
                          <span className="time-icon">🕐</span>
                          Yesterday, 2:30 PM
                        </span>
                      </div>
                    </div>

                    {/* Calendar Notifications */}
                    {eventsLoading ? (
                      <div className="timeline-item-modern notification">
                        <div className="timeline-marker">
                          <div className="marker-icon">⏳</div>
                          <div className="marker-line"></div>
                        </div>
                        <div className="timeline-content-modern">
                          <div className="activity-header">
                            <h4>Loading Calendar Events</h4>
                            <span className="activity-badge info">Loading</span>
                          </div>
                          <p>Fetching your upcoming calendar events...</p>
                          <span className="activity-time">
                            <span className="time-icon">🕐</span>
                            Just now
                          </span>
                        </div>
                      </div>
                    ) : eventsError ? (
                      <div className="timeline-item-modern notification">
                        <div className="timeline-marker">
                          <div className="marker-icon">❌</div>
                          <div className="marker-line"></div>
                        </div>
                        <div className="timeline-content-modern">
                          <div className="activity-header">
                            <h4>Calendar Error</h4>
                            <span className="activity-badge error">Error</span>
                          </div>
                          <p>Unable to load calendar events</p>
                          <span className="activity-time">
                            <span className="time-icon">🕐</span>
                            Just now
                          </span>
                        </div>
                      </div>
                    ) : upcomingEvents.length > 0 ? (
                      upcomingEvents.map((event, index) => (
                        <div key={event._id} className="timeline-item-modern notification">
                          <div className="timeline-marker">
                            <div className="marker-icon">📅</div>
                            <div className="marker-line"></div>
                          </div>
                          <div className="timeline-content-modern">
                            <div className="activity-header">
                              <h4>{event.Subject}</h4>
                            </div>
                            <p>{event.Description || "Scheduled calendar event"}</p>
                            <span className="activity-time">
                              <span className="time-icon">🕐</span>
                              {formatEventDate(event.StartTime, event.EndTime)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="timeline-item-modern notification">
                        <div className="timeline-marker">
                          <div className="marker-icon">📅</div>
                          <div className="marker-line"></div>
                        </div>
                        <div className="timeline-content-modern">
                          <div className="activity-header">
                            <h4>No Upcoming Events</h4>
                            <span className="activity-badge success">Clear</span>
                          </div>
                          <p>No event for today</p>
                          <span className="activity-time">
                            <span className="time-icon">🕐</span>
                            {new Date().toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              hour12: true,
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NewDashboard;