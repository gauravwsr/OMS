import React, { useState, useEffect } from "react";
import axios from "axios";
import NotificationPopup from "./NotificationPopup/NotificationPopup";
import "./Homepage.css"; // Make sure to use this new CSS file

const NewDashboard = () => {
  const [user, setUser] = useState(null);
  const [loggedInHours, setLoggedInHours] = useState("00:00:00");
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
        const response = await fetch("http://localhost:5000/users/me", {
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
        console.error("Error fetching user data:", error);
        setError("Failed to load user data. Please try again later.");
        setLoading(false);
      }
    };

    const fetchLoggedInHours = async () => {
      const token = localStorage.getItem("token");

      try {
        const response = await fetch(
          "http://localhost:5000/users/logged-in-hours",
          {
            method: "GET",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch logged-in hours. Status: ${response.status}`
          );
        }

        const data = await response.json();
        setLoggedInHours(data.loggedInHours);
      } catch (error) {
        console.error("Error fetching logged-in hours:", error);
      }
    };

    const fetchUpcomingEvents = async () => {
      setEventsLoading(true);
      try {
        const response = await axios.post('http://localhost:5000/GetData');
        const allEvents = response.data || [];
        
        // Filter upcoming events (events that haven't ended yet)
        const now = new Date();
        const upcoming = allEvents
          .filter(event => {
            const eventEnd = new Date(event.EndTime);
            return eventEnd >= now; // Include events that haven't ended yet
          })
          .sort((a, b) => new Date(a.StartTime) - new Date(b.StartTime)) // Sort by start time
          .slice(0, 3); // Show only next 3 events for homepage
        
        setUpcomingEvents(upcoming);
        setEventsError(null);
      } catch (error) {
        console.error("Error fetching upcoming events:", error);
        setEventsError(error.message);
      } finally {
        setEventsLoading(false);
      }
    };

    fetchUserData();
    fetchLoggedInHours();
    fetchUpcomingEvents();

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch logged-in hours every second
    const hoursInterval = setInterval(fetchLoggedInHours, 1000);

    // Refresh upcoming events every 5 minutes to auto-remove finished events
    const eventsInterval = setInterval(fetchUpcomingEvents, 5 * 60 * 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(hoursInterval);
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
      return `Today, ${startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Check if event starts tomorrow
    if (startDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${startDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }
    
    // Other dates
    return startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                <path d="m15 9-6 6" stroke="#ef4444" strokeWidth="2"/>
                <path d="m9 9 6 6" stroke="#ef4444" strokeWidth="2"/>
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

      {/* Debug user info */}
      

      {/* Show NotificationPopup only for Super Admin */}
      {user?.role === 'Super_Admin' && <NotificationPopup />}
      
      {/* Test button for Super Admin to create notification */}
      {user?.role === 'Super_Admin' && (
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          background: '#007bff',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '5px',
          fontSize: '12px',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}
        onClick={async () => {
          try {
            const token = localStorage.getItem('token');
            console.log('Token check:', token ? 'Present' : 'Missing');
            
            if (!token) {
              alert('No token found! Please login again.');
              return;
            }

            const response = await fetch('http://localhost:5000/api/notifications', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                title: "Test Notification for Super Admin",
                message: "Test notification created by Nayan Nikhare to verify notification system",
                type: 'event',
                targetRoles: ['Super_Admin'],
                priority: 'high',
                eventData: {
                  eventTitle: "HR Team Meeting",
                  eventDate: new Date(),
                  location: "Conference Room A"
                }
              })
            });
            
            console.log('Response status:', response.status);
            
            if (response.ok) {
              const result = await response.json();
              console.log('✅ Test notification created successfully:', result);
              alert('Test notification created! Popup should appear soon.');
              // Force refresh notifications after creation
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            } else {
              const error = await response.text();
              console.error('❌ Failed to create notification:', error);
              alert('Failed to create notification: ' + error);
            }
          } catch (error) {
            console.error('❌ Error creating notification:', error);
            alert('Error: ' + error.message);
          }
        }}>
          Create Test Notification
        </div>
      )}

      
      <div className="dashboard-wrapper">
        <div className="dashboard-container-new">
          <div className="dashboard-main">
            {/* Enhanced Header */}
            <header className="dashboard-header-modern">
              <div className="header-content">
                <div className="greeting-section">
                  <div className="greeting-text">
                    <h1 className="main-greeting">
                      {getGreeting()}
                      {user ? `, ${user.name.split(" ")[0]}` : ""}!
                    </h1>
                    <p className="welcome-subtitle">Welcome back to your workspace</p>
                  </div>
                  <div className="header-stats">
                    <div className="current-time">
                      <div className="time-icon">🕐</div>
                      <div className="time-info">
                        <span className="time-label">Current Time</span>
                        <span className="time-value">{formatTime()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="date-section">
                  <div className="date-card">
                    <div className="date-icon">📅</div>
                    <div className="date-info">
                      <span className="date-value">{formatDate()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </header>

            <div className="dashboard-content">
              {/* Enhanced Quick Stats */}
              <div className="stats-section">
                <h2 className="section-title">
                  <span className="title-icon">📊</span>
                  Quick Overview
                </h2>
                <div className="quick-stats-modern">
                  <div className="stat-card-modern primary">
                    <div className="stat-visual">
                      <div className="stat-icon-modern">⏱️</div>
                      <div className="stat-progress">
                        <div className="progress-ring">
                          <svg width="60" height="60">
                            <circle cx="30" cy="30" r="25" stroke="#e5e7eb" strokeWidth="6" fill="none"/>
                            <circle cx="30" cy="30" r="25" stroke="#3b82f6" strokeWidth="6" fill="none"
                              strokeDasharray="157" strokeDashoffset="39" strokeLinecap="round"/>
                          </svg>
                          <span className="progress-text">75%</span>
                        </div>
                      </div>
                    </div>
                    <div className="stat-content">
                      <h3>Logged Hours</h3>
                      <p className="stat-value-modern">{loggedInHours}</p>
                      <span className="stat-subtitle">Today's activity</span>
                    </div>
                  </div>

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
                        {user ? new Date(user.date).toLocaleDateString("en-GB") : "N/A"}
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
                      <p className="stat-value-modern">{user?.subRole || "N/A"}</p>
                      <span className="stat-subtitle">Specialization</span>
                    </div>
                  </div>
                </div>
              </div>

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
                          Today, {new Date().toLocaleTimeString("en-US", {
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

                    <div className="timeline-item-modern notification">
                      <div className="timeline-marker">
                        <div className="marker-icon">🔔</div>
                        <div className="marker-line"></div>
                      </div>
                      <div className="timeline-content-modern">
                        <div className="activity-header">
                          <h4>New Notification</h4>
                          <span className="activity-badge warning">New</span>
                        </div>
                        <p>You have a new task assignment waiting for review</p>
                        <span className="activity-time">
                          <span className="time-icon">🕐</span>
                          Apr 4, 10:15 AM
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Upcoming Events Section */}
              <div className="events-section-modern">
                <h2 className="section-title">
                  <span className="title-icon">📅</span>
                  Upcoming Events
                  {upcomingEvents.length > 0 && (
                    <span className="event-count">{upcomingEvents.length}</span>
                  )}
                </h2>

                <div className="events-container">
                  {eventsLoading ? (
                    <div className="events-loading">
                      <div className="loading-spinner-small">
                        <div className="spinner-circle"></div>
                      </div>
                      <div className="loading-text">
                        <h4>Loading Events</h4>
                        <p>Fetching your upcoming schedule...</p>
                      </div>
                    </div>
                  ) : eventsError ? (
                    <div className="events-error">
                      <div className="error-icon-small">❌</div>
                      <div className="error-text">
                        <h4>Unable to Load Events</h4>
                        <p>There was an issue fetching your events</p>
                        <button 
                          className="retry-small-btn"
                          onClick={() => window.location.reload()}
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : upcomingEvents.length === 0 ? (
                    <div className="events-empty">
                      <div className="empty-illustration">
                        <div className="calendar-icon">📅</div>
                        <div className="empty-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                      <div className="empty-text">
                        <h4>No Upcoming Events</h4>
                        <p>Your schedule is clear for today. Enjoy some focused work time!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="events-list">
                      {upcomingEvents.map((event, index) => (
                        <div key={event._id} className={`event-card-modern ${index === 0 ? 'next-event' : ''}`}>
                          <div className="event-indicator">
                            <div className="event-dot"></div>
                            {index < upcomingEvents.length - 1 && <div className="event-line"></div>}
                          </div>
                          <div className="event-content">
                            <div className="event-header">
                              <h4>{event.Subject}</h4>
                              {index === 0 && <span className="next-badge">Next</span>}
                            </div>
                            <p className="event-description">
                              {event.Description || "Event scheduled"}
                            </p>
                            <div className="event-meta">
                              <span className="event-time">
                                {formatEventDate(event.StartTime, event.EndTime)}
                              </span>
                              <div className="event-actions">
                                <button className="event-action-btn">
                                  <span>👁️</span>
                                  View
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
