import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  FiUsers, 
  FiUserPlus, 
  FiUserCheck, 
  FiCalendar, 
  FiClipboard, 
  FiTrendingUp,
  FiAward,
  FiClock
} from 'react-icons/fi';
import './HRDashboard.css';

const HRDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    newHires: 0,
    activeCandidates: 0,
    attendanceRate: 0
  });
  const [loading, setLoading] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost5001/api';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch employees
      const employeeResponse = await axios.get(`${API_BASE_URL}/users`);
      setEmployees(employeeResponse.data || []);
      
      // Fetch candidates (mock data for now)
      setCandidates([
        { id: 1, name: 'John Doe', position: 'Software Developer', status: 'Interview Scheduled' },
        { id: 2, name: 'Jane Smith', position: 'UI/UX Designer', status: 'Under Review' },
        { id: 3, name: 'Mike Johnson', position: 'Project Manager', status: 'Final Round' },
      ]);

      // Calculate stats
      const totalEmployees = employeeResponse.data?.length || 0;
      const newHires = employeeResponse.data?.filter(emp => {
        const joinDate = new Date(emp.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return joinDate > thirtyDaysAgo;
      }).length || 0;

      setStats({
        totalEmployees,
        newHires,
        activeCandidates: 3,
        attendanceRate: 87
      });

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, trend }) => (
    <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-icon" style={{ backgroundColor: color }}>
        <Icon size={24} />
      </div>
      <div className="stat-info">
        <div className="stat-value">{value}</div>
        <div className="stat-title">{title}</div>
        {trend && (
          <div className="stat-trend">
            <FiTrendingUp size={12} />
            <span>{trend}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="hr-dashboard">
      <div className="dashboard-header">
        <h1>HR Department Dashboard</h1>
        <p>Manage human resources, recruitment, and employee welfare</p>
      </div>

      {loading ? (
        <div className="loading-spinner">Loading HR Dashboard...</div>
      ) : (
        <>
          <div className="stats-grid">
            <StatCard
              icon={FiUsers}
              title="Total Employees"
              value={stats.totalEmployees}
              color="#3498db"
              trend="+5 this month"
            />
            <StatCard
              icon={FiUserPlus}
              title="New Hires"
              value={stats.newHires}
              color="#27ae60"
              trend="Last 30 days"
            />
            <StatCard
              icon={FiUserCheck}
              title="Active Candidates"
              value={stats.activeCandidates}
              color="#f39c12"
              trend="In pipeline"
            />
            <StatCard
              icon={FiTrendingUp}
              title="Attendance Rate"
              value={`${stats.attendanceRate}%`}
              color="#9b59b6"
              trend="This month"
            />
          </div>

          <div className="dashboard-content">
            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiUsers /> Recent Employees</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="employees-list">
                {employees.slice(0, 5).map(employee => (
                  <div key={employee._id || employee.id} className="employee-card">
                    <div className="employee-avatar">
                      {employee.name?.charAt(0) || 'N'}
                    </div>
                    <div className="employee-info">
                      <h4>{employee.name || 'Unknown'}</h4>
                      <p>{employee.role || 'No role assigned'}</p>
                      <span className="employee-status active">Active</span>
                    </div>
                    <div className="employee-actions">
                      <button className="action-btn">
                        <FiClipboard size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiUserPlus /> Active Candidates</h2>
                <button className="view-all-btn">View All</button>
              </div>
              <div className="candidates-list">
                {candidates.map(candidate => (
                  <div key={candidate.id} className="candidate-card">
                    <div className="candidate-info">
                      <h4>{candidate.name}</h4>
                      <p>{candidate.position}</p>
                      <span className={`candidate-status ${candidate.status.toLowerCase().replace(' ', '-')}`}>
                        {candidate.status}
                      </span>
                    </div>
                    <div className="candidate-actions">
                      <button className="action-btn primary">Review</button>
                      <button className="action-btn">Schedule</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="dashboard-section">
              <div className="section-header">
                <h2><FiCalendar /> Quick Actions</h2>
              </div>
              <div className="quick-actions">
                <div className="action-card">
                  <FiUserPlus size={32} />
                  <h3>Add New Employee</h3>
                  <p>Register a new employee in the system</p>
                  <button className="action-card-btn">Add Employee</button>
                </div>
                <div className="action-card">
                  <FiClipboard size={32} />
                  <h3>View Attendance</h3>
                  <p>Check employee attendance records</p>
                  <button className="action-card-btn">View Attendance</button>
                </div>
                <div className="action-card">
                  <FiAward size={32} />
                  <h3>Generate Certificate</h3>
                  <p>Create employee certificates</p>
                  <button className="action-card-btn">Generate</button>
                </div>
                <div className="action-card">
                  <FiClock size={32} />
                  <h3>Schedule Interview</h3>
                  <p>Schedule candidate interviews</p>
                  <button className="action-card-btn">Schedule</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default HRDashboard;
