import React, { useState, useEffect } from "react";
import "./Homepage.css"; // Make sure to use this new CSS file

const NewDashboard = () => {
  const [user, setUser] = useState(null);
  const [loggedInHours, setLoggedInHours] = useState("00:00:00");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

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

    fetchUserData();
    fetchLoggedInHours();

    // Update clock every second
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch logged-in hours every second
    const hoursInterval = setInterval(fetchLoggedInHours, 1000);

    return () => {
      clearInterval(clockInterval);
      clearInterval(hoursInterval);
    };
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
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
        <div className="loader-container">
          <div className="pulse-loader"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-wrapper">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Something went wrong</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container-new">
        <div className="dashboard-main">
          <header className="dashboard-header">
            <div className="headers-left">
              <h2>
                {getGreeting()}
                {user ? `, ${user.name.split(" ")[0]}` : ""}!
              </h2>
            </div>
            <div className="headers-right">
              <p>{formatDate()}</p>
            </div>
          </header>

          <div className="dashboard-content">
            <div className="quick-stats">
              <div className="stat-card primary">
                <div className="stat-icon">⏱️</div>
                <div className="stat-info">
                  <h3>Logged Hours</h3>
                  <p className="stat-value">{loggedInHours}</p>
                </div>
              </div>

              <div className="stat-card secondary">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                  <h3>Join Date</h3>
                  <p className="stat-value">
                    {user
                      ? new Date(user.date).toLocaleDateString("en-GB")
                      : "N/A"}
                  </p>
                </div>
              </div>

              <div className="stat-card tertiary">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <h3>Role</h3>
                  <p className="stat-value">
                    {user?.role?.replace(/_/g, " ") || "N/A"}
                  </p>
                </div>
              </div>

              <div className="stat-card quaternary">
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <h3>Sub Role</h3>
                  <p className="stat-value">{user?.subRole || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="user-profile-card">
              <div className="card-header">
                <h3>Employee Profile</h3>
              </div>

              <div className="profile-details">
                <div className="profile-row">
                  <div className="profile-group">
                    <label>Full Name</label>
                    <p>{user?.name || "N/A"}</p>
                  </div>

                  <div className="profile-group">
                    <label>Employee ID</label>
                    <p>{user?.userId || "N/A"}</p>
                  </div>
                </div>

                <div className="profile-row">
                  <div className="profile-group">
                    <label>Email Address</label>
                    <p className="email-value">{user?.email || "N/A"}</p>
                  </div>

                  <div className="profile-group">
                    <label>Department</label>
                    <p>{user?.department || "General"}</p>
                  </div>
                </div>

                <div className="profile-row">
                  <div className="profile-group">
                    <label>Status</label>
                    <p className="status-active">Active</p>
                  </div>

                  <div className="profile-group">
                    <label>Position</label>
                    <p>{user?.position || user?.role || "Employee"}</p>
                  </div>
                </div>

                <div className="profile-row">
                  <div className="profile-group">
                    <label>Role</label>
                    <p>{user?.role?.replace(/_/g, " ") || "N/A"}</p>
                  </div>

                  <div className="profile-group">
                    <label>Sub Role</label>
                    <p>{user?.subRole || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="activity-section">
              <div className="section-header">
                <h3>Recent Activity</h3>
                <button className="view-all-button">View All</button>
              </div>

              <div className="activity-timeline">
                <div className="timeline-item">
                  <div className="timeline-icon login">📥</div>
                  <div className="timeline-content">
                    <h4>System Login</h4>
                    <p>You logged into the system</p>
                    <span className="timeline-time">
                      Today,{" "}
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon update">📝</div>
                  <div className="timeline-content">
                    <h4>Profile Updated</h4>
                    <p>Your profile information was updated</p>
                    <span className="timeline-time">Yesterday, 2:30 PM</span>
                  </div>
                </div>

                <div className="timeline-item">
                  <div className="timeline-icon notification">🔔</div>
                  <div className="timeline-content">
                    <h4>New Notification</h4>
                    <p>You have a new task assigned</p>
                    <span className="timeline-time">Apr 4, 10:15 AM</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDashboard;
