import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiServer, 
  FiMonitor, 
  FiShield, 
  FiHardDrive, 
  FiWifi, 
  FiTool,
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiActivity
} from 'react-icons/fi';
import './ITDashboard.css';

const ITDashboard = () => {
  const [systemStats, setSystemStats] = useState({
    serverUptime: '99.9%',
    activeUsers: 0,
    ticketsOpen: 0,
    ticketsResolved: 0
  });
  const [tickets, setTickets] = useState([]);
  const [infrastructure, setInfrastructure] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5001/api';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for IT dashboard
      setTickets([
        { id: 1, title: 'Email Server Down', priority: 'High', status: 'Open', assignee: 'John Doe', created: '2025-01-20' },
        { id: 2, title: 'Network Connectivity Issue', priority: 'Medium', status: 'In Progress', assignee: 'Jane Smith', created: '2025-01-19' },
        { id: 3, title: 'Software Installation Request', priority: 'Low', status: 'Resolved', assignee: 'Mike Johnson', created: '2025-01-18' },
        { id: 4, title: 'Database Performance Issue', priority: 'High', status: 'Open', assignee: 'Sarah Wilson', created: '2025-01-17' },
      ]);

      setInfrastructure([
        { name: 'Main Server', status: 'Online', uptime: '99.9%', cpu: '45%', memory: '67%' },
        { name: 'Database Server', status: 'Online', uptime: '99.8%', cpu: '32%', memory: '54%' },
        { name: 'Email Server', status: 'Maintenance', uptime: '98.5%', cpu: '78%', memory: '89%' },
        { name: 'Backup Server', status: 'Online', uptime: '100%', cpu: '12%', memory: '23%' },
      ]);

      setSystemStats({
        serverUptime: '99.9%',
        activeUsers: 127,
        ticketsOpen: 2,
        ticketsResolved: 15
      });

    } catch (error) {
      console.error('Error fetching IT dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, status }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {status && (
          <div className="stat-status">
            <span className={`status-indicator ${status.toLowerCase()}`}></span>
            {status}
          </div>
        )}
      </div>
    </div>
  );

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'online': return '#27ae60';
      case 'offline': return '#e74c3c';
      case 'maintenance': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="it-dashboard">
      <div className="dashboard-header">
        <h1>IT Department Dashboard</h1>
        <p>Monitor systems, manage infrastructure, and resolve technical issues</p>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading IT Dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon={FiServer}
              title="Server Uptime"
              value={systemStats.serverUptime}
              color="#27ae60"
              status="Healthy"
            />
            <StatCard
              icon={FiMonitor}
              title="Active Users"
              value={systemStats.activeUsers}
              color="#3498db"
              status="Online"
            />
            <StatCard
              icon={FiAlertTriangle}
              title="Open Tickets"
              value={systemStats.ticketsOpen}
              color="#e74c3c"
              status="Urgent"
            />
            <StatCard
              icon={FiCheckCircle}
              title="Resolved Today"
              value={systemStats.ticketsResolved}
              color="#9b59b6"
              status="Completed"
            />
          </div>

          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiServer /> Infrastructure Status</h2>
                <button className="view-all-btn">Monitor All</button>
              </div>
              <div className="infrastructure-grid">
                {infrastructure.map((server, index) => (
                  <div key={index} className="server-card">
                    <div className="server-header">
                      <h4>{server.name}</h4>
                      <span 
                        className="server-status" 
                        style={{ backgroundColor: getStatusColor(server.status) }}
                      >
                        {server.status}
                      </span>
                    </div>
                    <div className="server-metrics">
                      <div className="metric">
                        <span className="metric-label">Uptime</span>
                        <span className="metric-value">{server.uptime}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">CPU</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill cpu" 
                            style={{ width: server.cpu }}
                          ></div>
                        </div>
                        <span className="metric-value">{server.cpu}</span>
                      </div>
                      <div className="metric">
                        <span className="metric-label">Memory</span>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill memory" 
                            style={{ width: server.memory }}
                          ></div>
                        </div>
                        <span className="metric-value">{server.memory}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiTool /> Support Tickets</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="tickets-list">
                {tickets.map(ticket => (
                  <div key={ticket.id} className="ticket-card">
                    <div className="ticket-info">
                      <h4>{ticket.title}</h4>
                      <p>Assigned to: {ticket.assignee}</p>
                      <p>Created: {ticket.created}</p>
                    </div>
                    <div className="ticket-meta">
                      <span 
                        className="priority-badge" 
                        style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                      >
                        {ticket.priority}
                      </span>
                      <span className={`status-badge ${ticket.status.toLowerCase().replace(' ', '-')}`}>
                        {ticket.status}
                      </span>
                    </div>
                    <div className="ticket-actions">
                      <button className="action-btn primary">View</button>
                      <button className="action-btn">Update</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiActivity /> Quick Actions</h2>
              </div>
              <div className="quick-actions">
                <div className="action-card">
                  <FiServer size={32} />
                  <h3>Server Maintenance</h3>
                  <p>Schedule or perform server maintenance</p>
                  <button className="action-card-btn">Schedule</button>
                </div>
                <div className="action-card">
                  <FiShield size={32} />
                  <h3>Security Scan</h3>
                  <p>Run security vulnerability scan</p>
                  <button className="action-card-btn">Run Scan</button>
                </div>
                <div className="action-card">
                  <FiHardDrive size={32} />
                  <h3>Backup Systems</h3>
                  <p>Manage and monitor backup systems</p>
                  <button className="action-card-btn">Manage</button>
                </div>
                <div className="action-card">
                  <FiWifi size={32} />
                  <h3>Network Monitor</h3>
                  <p>Monitor network performance</p>
                  <button className="action-card-btn">Monitor</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ITDashboard;
