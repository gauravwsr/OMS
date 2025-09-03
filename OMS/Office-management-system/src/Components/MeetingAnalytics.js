// Enhanced Meeting Analytics Component
import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaChartBar,
  FaDownload,
  FaFilter,
} from "react-icons/fa";
import axios from "axios";
import "./MeetingAnalytics.css";

const MeetingAnalytics = ({ user }) => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState("week");
  const [teamFilter, setTeamFilter] = useState("all");

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, teamFilter]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/meetings/analytics/detailed`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { range: dateRange, team: teamFilter },
        }
      );
      setAnalyticsData(response.data);
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5001/api/meetings/analytics/export`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { range: dateRange, team: teamFilter, format: "excel" },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `meeting-analytics-${dateRange}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Failed to export analytics:", error);
    }
  };

  if (loading) {
    return <div className="analytics-loading">Loading analytics...</div>;
  }

  if (!analyticsData) {
    return <div className="analytics-error">Failed to load analytics data</div>;
  }

  return (
    <div className="meeting-analytics-enhanced">
      <div className="analytics-header">
        <h2>Meeting Analytics Dashboard</h2>
        <div className="analytics-controls">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="analytics-select"
          >
            <option value="day">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
          </select>

          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="analytics-select"
          >
            <option value="all">All Teams</option>
            {analyticsData?.teams?.map((team) => (
              <option key={team} value={team}>
                {team}
              </option>
            ))}
          </select>

          <button onClick={exportAnalytics} className="export-button">
            <FaDownload /> Export Excel
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Total Meetings</h3>
            <p className="metric-value">
              {analyticsData.overview.totalMeetings}
            </p>
            <span className="metric-change positive">
              +{analyticsData.overview.changePercent}% from last period
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaClock />
          </div>
          <div className="metric-content">
            <h3>Total Duration</h3>
            <p className="metric-value">{analyticsData.overview.totalHours}h</p>
            <span className="metric-subtitle">
              Avg: {analyticsData.overview.avgDurationMinutes} min per meeting
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Active Participants</h3>
            <p className="metric-value">
              {analyticsData.overview.uniqueParticipants}
            </p>
            <span className="metric-subtitle">
              Avg: {analyticsData.overview.avgParticipants} per meeting
            </span>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <FaChartBar />
          </div>
          <div className="metric-content">
            <h3>Meeting Success Rate</h3>
            <p className="metric-value">
              {analyticsData.overview.successRate}%
            </p>
            <span className="metric-subtitle">
              {analyticsData.overview.completedMeetings} completed successfully
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        <div className="chart-container">
          <h3>Meetings per Day</h3>
          <div className="simple-chart">
            {analyticsData.dailyStats?.map((day, index) => (
              <div key={index} className="chart-bar">
                <div
                  className="bar"
                  style={{
                    height: `${
                      (day.count /
                        Math.max(
                          ...analyticsData.dailyStats.map((d) => d.count)
                        )) *
                      100
                    }%`,
                  }}
                ></div>
                <span className="bar-label">{day.date}</span>
                <span className="bar-value">{day.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <h3>Meeting Types Distribution</h3>
          <div className="pie-chart-simple">
            <div className="pie-item">
              <div className="pie-color global"></div>
              <span>Global: {analyticsData.distribution.globalMeetings}</span>
            </div>
            <div className="pie-item">
              <div className="pie-color team"></div>
              <span>Team: {analyticsData.distribution.teamMeetings}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="team-performance">
        <h3>Team Performance</h3>
        <div className="team-stats">
          {analyticsData.teamStats?.map((team) => (
            <div key={team.name} className="team-stat-card">
              <h4>{team.name}</h4>
              <div className="team-metrics">
                <span>Meetings: {team.meetings}</span>
                <span>Duration: {team.totalHours}h</span>
                <span>Participants: {team.avgParticipants}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <h3>Recent Meeting Activity</h3>
        <div className="activity-list">
          {analyticsData.recentActivity?.map((activity, index) => (
            <div key={index} className="activity-item">
              <div className="activity-time">
                {new Date(activity.timestamp).toLocaleString()}
              </div>
              <div className="activity-content">
                <strong>{activity.userName}</strong> {activity.action}
                <em>{activity.meetingName}</em>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MeetingAnalytics;
