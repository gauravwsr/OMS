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
      console.log('Fetching assigned projects for team lead:', currentUser.name || currentUser.id);
      // Use the backend endpoint to fetch only assigned projects
      const identifier = currentUser.id || currentUser.name || currentUser.email;
      const response = await fetch(`https://crm-brown-gamma.vercel.app/api/client-projects/team-lead/${identifier}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      // The backend returns { success, count, data: [...] }
      const assignedProjects = Array.isArray(result.data) ? result.data : [];
      console.log('Assigned projects for', identifier, ':', assignedProjects);
      setProjects(assignedProjects);
      // Calculate dashboard statistics
      const stats = calculateDashboardStats(assignedProjects);
      setDashboardStats(stats);
    } catch (error) {
      console.error('Error fetching assigned projects:', error);
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
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Project Details</h3>
              <button className="modal-close" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="project-overview">
                <div className="overview-header">
                  <h4>{selectedProject.projectId || 'Untitled Project'}</h4>
                  <div className="project-badges">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(selectedProject.projectStatus || 'unknown') }}
                    >
                      {selectedProject.projectStatus ? selectedProject.projectStatus.replace('-', ' ') : 'Unknown'}
                    </span>
                    <span className="amount-badge">
                      ₹{selectedProject.finalAmount ? selectedProject.finalAmount.toLocaleString() : '0'}
                    </span>
                  </div>
                </div>
                <p className="project-description">Client: {selectedProject.clientName || 'Unknown Client'}</p>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h5><FaInfoCircle /> Project Information</h5>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span>Project ID:</span>
                      <span>{selectedProject.projectId || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Client Name:</span>
                      <span>{selectedProject.clientName || 'Unknown Client'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Original Lead:</span>
                      <span>{selectedProject.leadName || 'Not Specified'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Assigned Team Lead:</span>
                      <span>{selectedProject.assignedTeamLead || 'Not Assigned'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Final Amount:</span>
                      <span>₹{selectedProject.finalAmount ? selectedProject.finalAmount.toLocaleString() : '0'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Project Status:</span>
                      <span>{selectedProject.projectStatus || 'Unknown'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Created Date:</span>
                      <span>{formatDate(selectedProject.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Last Updated:</span>
                      <span>{formatDate(selectedProject.updatedAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Project Password:</span>
                      <span>{selectedProject.projectPassword || 'Not Set'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={handleCloseDetails}>
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
