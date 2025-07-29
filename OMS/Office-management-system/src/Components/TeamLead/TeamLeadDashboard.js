import React, { useState, useEffect } from 'react';
import { 
  FaProjectDiagram, 
  FaTasks, 
  FaCalendarAlt, 
  FaCheckCircle,
  FaExclamationTriangle,
  FaPause,
  FaPlay,
  FaEye,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaEnvelope,
  FaChartLine,
  FaMapMarkerAlt,
  FaLock,
  FaTimes,
  FaClock,
  FaUser
} from 'react-icons/fa';
import { useAuth } from '../AuthProvider/AuthContext';
import './TeamLeadDashboard.css';

const TeamLeadDashboard = () => {
  const { user } = useAuth(); // Get current authenticated user
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('projectId');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
  });
  const [addingTask, setAddingTask] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    totalAmount: 0
  });

  // Get current user (Team Lead) info from auth context
  const currentUser = user || {
    name: "Team Lead", 
    id: "team-lead-id"
  };

  // Fetch projects assigned to this team lead
  const fetchAssignedProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token'); // <-- Add this line
      const identifier = currentUser.id || currentUser.name || currentUser.email;
      const response = await fetch(`http://localhost:5000/api/client-projects/team-lead/${identifier}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      const assignedProjects = Array.isArray(result.data) ? result.data : [];
      setProjects(assignedProjects);
      setDashboardStats(calculateDashboardStats(assignedProjects));
    } catch (error) {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = (projectsData) => {
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => p.projectStatus === 'Active').length;
    const completedProjects = projectsData.filter(p => p.projectStatus === 'Completed').length;
    const overdueProjects = projectsData.filter(p => p.projectStatus === 'Overdue').length;
    const totalAmount = projectsData.reduce((sum, p) => sum + (p.finalAmount || 0), 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      totalAmount
    };
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.projectId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.leadName || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => (project.projectStatus || 'unknown') === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || '';
      let bVal = b[sortBy] || '';
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterStatus, sortBy, sortOrder]);

  // Load data on component mount
  useEffect(() => {
    fetchAssignedProjects();
  }, []);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'completed': '#3b82f6', 
      'overdue': '#ef4444',
      'pending': '#f59e0b',
      'unknown': '#6b7280'
    };
    return colors[status?.toLowerCase()] || colors.unknown;
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleCloseDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  // Handler for viewing task details inline
  const handleViewTaskDetails = (task) => {
    setSelectedTask(task);
  };

  // Handler for adding a new task
  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!selectedProject || !newTask.title || !newTask.assignedTo) return;
    setAddingTask(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/client-projects/${selectedProject._id}/add-task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      });
      if (response.ok) {
        // Refresh project details (fetch again or update state)
        fetchAssignedProjects();
        setNewTask({ title: '', description: '', assignedTo: '', dueDate: '' });
      }
    } finally {
      setAddingTask(false);
    }
  };

  const handleCloseTaskDetails = () => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="team-lead-dashboard">
        <div className="loading-spinner">
          <FaTasks size={32} />
          <p>Loading your assigned projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="team-lead-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1><FaProjectDiagram /> Team Lead Dashboard</h1>
        <p>Welcome back, {currentUser.name || currentUser.username || 'Team Lead'}! Here are your assigned projects.</p>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
            <FaProjectDiagram size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.totalProjects}</div>
            <div className="stat-title">Total Projects</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Assigned to you
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FaCheckCircle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.activeProjects}</div>
            <div className="stat-title">Active</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              In progress
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
            <FaPlay size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.completedProjects}</div>
            <div className="stat-title">Completed</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Finished
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <FaChartLine size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">₹{dashboardStats.totalAmount ? dashboardStats.totalAmount.toLocaleString() : '0'}</div>
            <div className="stat-title">Total Value</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Project value
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="controls-section">
        <div className="search-filter-controls">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search projects by client, ID, or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Projects Section */}
      <div className="projects-section">
        <div className="section-header">
          <h2><FaProjectDiagram /> My Assigned Projects ({filteredProjects.length})</h2>
        </div>

        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project._id} className="project-card">
              <div className="project-header">
                <div className="project-title">
                  <h3>{project.projectId || 'Untitled Project'}</h3>
                  <div className="project-badges">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(project.projectStatus || 'unknown') }}
                    >
                      {project.projectStatus ? project.projectStatus.replace('-', ' ') : 'Unknown'}
                    </span>
                    <span className="amount-badge">
                      ₹{project.finalAmount ? project.finalAmount.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
                <div className="project-actions">
                  <button 
                    className="action-btn" 
                    onClick={() => handleViewDetails(project)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                </div>
              </div>

              <div className="project-details">
                <div className="client-info">
                  <strong>Client:</strong> {project.clientName || 'Unknown Client'}
                </div>
                <div className="project-info">
                  <div className="info-item">
                    <strong>Project ID:</strong> {project.projectId || 'N/A'}
                  </div>
                  <div className="info-item">
                    <strong>Original Lead:</strong> {project.leadName || 'Not Specified'}
                  </div>
                  <div className="info-item">
                    <strong>Final Amount:</strong> ₹{project.finalAmount ? project.finalAmount.toLocaleString() : '0'}
                  </div>
                </div>
                
                <div className="assignment-info">
                  <div className="assignment-item">
                    <strong>Project Status:</strong> 
                    <span className={`status-indicator ${project.projectStatus ? project.projectStatus.toLowerCase() : 'unknown'}`}>
                      {project.projectStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="assignment-item">
                    <strong>Assigned Team Lead:</strong> 
                    <span className="team-lead-assigned">
                      {project.assignedTeamLead || 'Not Assigned'}
                    </span>
                  </div>
                </div>
                
                <div className="project-meta">
                  <div className="meta-item">
                    <FaCalendarAlt />
                    <span>Created: {formatDate(project.createdAt)}</span>
                  </div>
                  <div className="meta-item">
                    <FaCalendarAlt />
                    <span>Updated: {formatDate(project.updatedAt)}</span>
                  </div>
                </div>

                <div className="project-status-info">
                  <div className="status-header">
                    <span>Project Status</span>
                    <span className={`status-indicator ${project.projectStatus ? project.projectStatus.toLowerCase() : 'unknown'}`}>
                      {project.projectStatus || 'Unknown'}
                    </span>
                  </div>
                  <div className="amount-display">
                    <strong>Project Value: ₹{project.finalAmount ? project.finalAmount.toLocaleString() : '0'}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && !loading && (
          <div className="no-projects">
            <FaProjectDiagram size={64} />
            <h3>No Projects Found</h3>
            <p>No projects are currently assigned to you matching the selected criteria.</p>
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseDetails} >
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700, borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', backgroundColor: "white" }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 22, color: '#3b82f6', letterSpacing: 1 }}>
                <FaProjectDiagram style={{ marginRight: 8 }} />
                Project Details
              </h3>
              <button className="modal-close" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 24 }}>
              {/* Project Overview */}
              <div className="project-overview" style={{ marginBottom: 18 }}>
                <div className="overview-header" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <h4 style={{ margin: 0, fontWeight: 600, fontSize: 20 }}>
                    {selectedProject.projectId || 'Untitled Project'}
                  </h4>
                  <span 
                    className="status-badge"
                    style={{
                      backgroundColor: getStatusColor(selectedProject.projectStatus || 'unknown'),
                      color: '#fff',
                      borderRadius: 8,
                      padding: '2px 12px',
                      fontWeight: 500,
                      fontSize: 14
                    }}
                  >
                    {selectedProject.projectStatus ? selectedProject.projectStatus.replace('-', ' ') : 'Unknown'}
                  </span>
                  <span className="amount-badge" style={{
                    background: '#f3f4f6',
                    color: '#111',
                    borderRadius: 8,
                    padding: '2px 12px',
                    fontWeight: 500,
                    fontSize: 14
                  }}>
                    ₹{selectedProject.finalAmount ? selectedProject.finalAmount.toLocaleString() : '0'}
                  </span>
                </div>
                <p style={{ margin: '8px 0 0 0', color: '#6b7280', fontSize: 15 }}>
                  <FaEnvelope style={{ marginRight: 4 }} />
                  Client: <span style={{ fontWeight: 500 }}>{selectedProject.clientName || 'Unknown Client'}</span>
                </p>
              </div>

              {/* Info Grid */}
              <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Left Column */}
                <div>
                  <div className="detail-section" style={{ marginBottom: 18 }}>
                    <h5 style={{ color: '#2563eb', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                      <FaInfoCircle style={{ marginRight: 6 }} /> Basic Info
                    </h5>
                    <div className="detail-items" style={{ fontSize: 15 }}>
                      <div><strong>Project ID:</strong> {selectedProject.projectId || 'N/A'}</div>
                      <div><strong>Original Lead:</strong> {selectedProject.leadName || 'Not Specified'}</div>
                      <div><strong>Assigned Team Lead:</strong> {selectedProject.assignedTeamLead || 'Not Assigned'}</div>
                      <div><strong>Status:</strong> {selectedProject.projectStatus || 'Unknown'}</div>
                      <div><strong>Created:</strong> {formatDate(selectedProject.createdAt)}</div>
                      <div><strong>Updated:</strong> {formatDate(selectedProject.updatedAt)}</div>
                      <div><strong>Password:</strong> {selectedProject.projectPassword || 'Not Set'}</div>
                    </div>
                  </div>

                  {/* Assigned Team Members */}
                  {selectedProject.assignedEmployees && selectedProject.assignedEmployees.length > 0 && (
                    <div className="detail-section" style={{ marginBottom: 18 }}>
                      <h5 style={{ color: '#059669', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                        <FaUser style={{ marginRight: 6 }} /> Assigned Team Members
                      </h5>
                      <ul style={{ paddingLeft: 18, margin: 0 }}>
                        {selectedProject.assignedEmployees.map(emp => (
                          <li key={emp.employeeId} style={{ marginBottom: 2 }}>
                            <span style={{ fontWeight: 500 }}>{emp.name}</span>
                            <span style={{ color: '#6b7280', marginLeft: 6 }}>({emp.role} - {emp.subRole})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Right Column */}
                <div>
                  {/* Task Details Section */}
                  {selectedProject.tasks && (
                    <div className="detail-section" style={{ marginBottom: 18 }}>
                      <h5 style={{ color: '#f59e0b', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                        <FaTasks style={{ marginRight: 6 }} /> Task Details
                      </h5>
                      <div className="tasks-overview" style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
                        <div className="task-stat completed" style={{ background: '#e0f2fe', borderRadius: 6, padding: '6px 12px', minWidth: 80 }}>
                          <span className="task-count" style={{ fontWeight: 700, color: '#059669' }}>{selectedProject.tasks.completed}</span>
                          <span className="task-label" style={{ fontSize: 13, color: '#059669', marginLeft: 4 }}>Completed</span>
                        </div>
                        <div className="task-stat in-progress" style={{ background: '#fef9c3', borderRadius: 6, padding: '6px 12px', minWidth: 80 }}>
                          <span className="task-count" style={{ fontWeight: 700, color: '#f59e0b' }}>{selectedProject.tasks.inProgress}</span>
                          <span className="task-label" style={{ fontSize: 13, color: '#f59e0b', marginLeft: 4 }}>In Progress</span>
                        </div>
                        <div className="task-stat pending" style={{ background: '#fee2e2', borderRadius: 6, padding: '6px 12px', minWidth: 80 }}>
                          <span className="task-count" style={{ fontWeight: 700, color: '#ef4444' }}>{selectedProject.tasks.pending}</span>
                          <span className="task-label" style={{ fontSize: 13, color: '#ef4444', marginLeft: 4 }}>Pending</span>
                        </div>
                      </div>
                      {/* Task List with always visible View Details */}
                      {Array.isArray(selectedProject.tasks.list) && (
                        <ul className="task-list" style={{ paddingLeft: 0, margin: 0 }}>
                          {selectedProject.tasks.list.map((task, idx) => (
                            <li key={idx} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb', borderRadius: 6, padding: '8px 12px' }}>
                              <div>
                                <strong>{task.title}</strong> - {task.status}
                                <span style={{ color: '#6b7280', marginLeft: 6 }}>
                                  (Due: {formatDate(task.dueDate)})
                                </span>
                              </div>
                              <button
                                style={{
                                  background: '#3b82f6',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 4,
                                  padding: '4px 10px',
                                  cursor: 'pointer',
                                  fontSize: 13
                                }}
                                onClick={() => {
                                  setSelectedTask(task);
                                  setShowTaskDetails(true);
                                }}
                              >
                                View Details
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Add Task Section */}
                      <div style={{ marginTop: 24, padding: 16, background: '#f3f4f6', borderRadius: 8 }}>
                        <h6 style={{ margin: 0, fontWeight: 700, color: '#059669' }}>
                          <FaTasks style={{ marginRight: 6 }} />
                          Add New Task
                        </h6>
                        <form onSubmit={handleAddTask} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <input
                            type="text"
                            placeholder="Task Title"
                            value={newTask.title}
                            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
                            required
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
                          />
                          <textarea
                            placeholder="Description"
                            value={newTask.description}
                            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
                          />
                          <select
                            value={newTask.assignedTo}
                            onChange={e => setNewTask({ ...newTask, assignedTo: e.target.value })}
                            required
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
                          >
                            <option value="">Assign to team member...</option>
                            {selectedProject.assignedEmployees && selectedProject.assignedEmployees.map(emp => (
                              <option key={emp.employeeId} value={emp.name}>
                                {emp.name} ({emp.role} - {emp.subRole})
                              </option>
                            ))}
                          </select>
                          <input
                            type="date"
                            value={newTask.dueDate}
                            onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })}
                            style={{ padding: 8, borderRadius: 4, border: '1px solid #d1d5db' }}
                          />
                          <button
                            type="submit"
                            disabled={addingTask}
                            style={{
                              background: '#059669',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              padding: '8px 18px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {addingTask ? 'Adding...' : 'Add Task'}
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  {/* Budget/Amount */}
                  <div className="detail-section" style={{ marginBottom: 18 }}>
                    <h5 style={{ color: '#3b82f6', fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                      <FaChartLine style={{ marginRight: 6 }} /> Budget & Value
                    </h5>
                    <div style={{ fontSize: 15 }}>
                      <div><strong>Final Amount:</strong> ₹{selectedProject.finalAmount ? selectedProject.finalAmount.toLocaleString() : '0'}</div>
                      {/* Add more budget/progress info if available */}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, textAlign: 'right' }}>
              <button className="btn-secondary" onClick={handleCloseDetails} style={{ padding: '6px 18px', borderRadius: 6 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Details Modal (separate window) */}
      {showTaskDetails && selectedTask && (
        <div className="modal-overlay" onClick={handleCloseTaskDetails}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, borderRadius: 10, background: "#fff" }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
              <h3 style={{ margin: 0, fontWeight: 700, fontSize: 20, color: '#f59e0b' }}>
                <FaTasks style={{ marginRight: 8 }} />
                Task Details
              </h3>
              <button className="modal-close" onClick={handleCloseTaskDetails}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <div style={{ marginBottom: 12 }}>
                <strong>Title:</strong> {selectedTask.title}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Status:</strong> {selectedTask.status}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Description:</strong> {selectedTask.description || 'No description'}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Assigned To:</strong> {selectedTask.assignedTo || 'N/A'}
              </div>
              <div style={{ marginBottom: 12 }}>
                <strong>Due Date:</strong> {formatDate(selectedTask.dueDate)}
              </div>
              {/* Add more fields as needed */}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e7eb', paddingTop: 10, textAlign: 'right' }}>
              <button className="btn-secondary" onClick={handleCloseTaskDetails} style={{ padding: '6px 18px', borderRadius: 6 }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamLeadDashboard;
