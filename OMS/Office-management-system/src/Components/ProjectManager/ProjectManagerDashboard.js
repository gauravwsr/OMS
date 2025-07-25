import React, { useState, useEffect } from 'react';
import { 
  FaProjectDiagram, 
  FaUsers, 
  FaCalendarAlt, 
  FaTasks, 
  FaChartLine,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaPause,
  FaPlay,
  FaEdit,
  FaEye,
  FaPlus,
  FaFilter,
  FaSearch,
  FaArrowUp,
  FaArrowDown,
  FaUserTie,
  FaAssignments,
  FaSave,
  FaTimes,
  FaInfoCircle,
  FaEnvelope,
  FaPhone,
  FaFlag,
  FaMilestone
} from 'react-icons/fa';
import './ProjectManagerDashboard.css';

const ProjectManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [teamLeads, setTeamLeads] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTeamLead, setSelectedTeamLead] = useState('');
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0
  });

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('https://crm-brown-gamma.vercel.app/api/client-projects');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Fetched projects:', data);
        
        // Process the data - assuming the API returns an array of projects
        const projectsData = Array.isArray(data) ? data : data.projects || [];
        
        setProjects(projectsData);
        setFilteredProjects(projectsData);
        
        // Calculate dashboard statistics
        const stats = calculateDashboardStats(projectsData);
        setDashboardStats(stats);
        
      } catch (error) {
        console.error('Error fetching projects:', error);
        // Fallback to mock data if API fails
        const mockProjects = getMockProjects();
        setProjects(mockProjects);
        setFilteredProjects(mockProjects);
        setDashboardStats(calculateDashboardStats(mockProjects));
      } finally {
        setLoading(false);
      }
    };

    const fetchTeamLeads = async () => {
      try {
        // Try to fetch team leads from API - you can replace this URL with actual team leads API
        const response = await fetch('https://crm-brown-gamma.vercel.app/api/team-leads');
        
        if (response.ok) {
          const data = await response.json();
          setTeamLeads(Array.isArray(data) ? data : data.teamLeads || []);
        } else {
          // Fallback to mock team leads
          setTeamLeads(getMockTeamLeads());
        }
      } catch (error) {
        console.error('Error fetching team leads:', error);
        // Fallback to mock team leads
        setTeamLeads(getMockTeamLeads());
      }
    };

    fetchProjects();
    fetchTeamLeads();
  }, []);

  // Mock data fallback
  const getMockProjects = () => {
    return [
      {
        id: 1,
        name: 'E-commerce Platform Development',
        client: 'TechCorp Solutions',
        status: 'active',
        priority: 'high',
        startDate: '2024-01-15',
        endDate: '2024-06-15',
        progress: 65,
        budget: 150000,
        spent: 97500,
        teamMembers: 8,
        description: 'Complete e-commerce platform with payment gateway integration',
        technologies: ['React', 'Node.js', 'MongoDB', 'Stripe'],
        projectManager: 'John Smith',
        assignedTeamLead: 'Sarah Wilson',
        teamLeadId: 2,
        clientContact: {
          name: 'Michael Johnson',
          email: 'michael@techcorp.com',
          phone: '+1-555-0123'
        },
        milestones: [
          { name: 'UI/UX Design', status: 'completed', dueDate: '2024-02-15' },
          { name: 'Backend Development', status: 'in-progress', dueDate: '2024-04-01' },
          { name: 'Payment Integration', status: 'pending', dueDate: '2024-05-15' },
          { name: 'Testing & Deployment', status: 'pending', dueDate: '2024-06-10' }
        ],
        risks: [
          { level: 'medium', description: 'Third-party API integration delays' },
          { level: 'low', description: 'Resource availability during holidays' }
        ],
        tasks: {
          total: 45,
          completed: 29,
          inProgress: 12,
          pending: 4
        }
      },
      {
        id: 2,
        name: 'Mobile Banking App',
        client: 'SecureBank Ltd',
        status: 'active',
        priority: 'high',
        startDate: '2024-02-01',
        endDate: '2024-07-30',
        progress: 40,
        budget: 200000,
        spent: 80000,
        teamMembers: 10,
        description: 'Secure mobile banking application with biometric authentication',
        technologies: ['React Native', 'Node.js', 'PostgreSQL', 'AWS'],
        projectManager: 'Sarah Johnson',
        assignedTeamLead: null,
        teamLeadId: null,
        clientContact: {
          name: 'David Chen',
          email: 'david@securebank.com',
          phone: '+1-555-0456'
        },
        milestones: [
          { name: 'Security Architecture', status: 'completed', dueDate: '2024-02-20' },
          { name: 'Core Features Development', status: 'in-progress', dueDate: '2024-05-01' },
          { name: 'Biometric Integration', status: 'pending', dueDate: '2024-06-15' },
          { name: 'Security Testing', status: 'pending', dueDate: '2024-07-20' }
        ],
        risks: [
          { level: 'high', description: 'Regulatory compliance requirements' },
          { level: 'medium', description: 'Complex security implementations' }
        ],
        tasks: {
          total: 60,
          completed: 24,
          inProgress: 18,
          pending: 18
        }
      },
      {
        id: 3,
        name: 'Inventory Management System',
        client: 'LogiCorp Industries',
        status: 'completed',
        priority: 'medium',
        startDate: '2024-01-01',
        endDate: '2024-04-30',
        progress: 100,
        budget: 80000,
        spent: 75000,
        teamMembers: 5,
        description: 'Comprehensive inventory tracking and management system',
        technologies: ['Vue.js', 'Laravel', 'MySQL', 'Docker'],
        projectManager: 'Mike Chen',
        assignedTeamLead: 'Alex Rodriguez',
        teamLeadId: 1,
        clientContact: {
          name: 'Lisa Davis',
          email: 'lisa@logicorp.com',
          phone: '+1-555-0789'
        },
        milestones: [
          { name: 'System Design', status: 'completed', dueDate: '2024-01-15' },
          { name: 'Development Phase', status: 'completed', dueDate: '2024-03-15' },
          { name: 'Testing & QA', status: 'completed', dueDate: '2024-04-15' },
          { name: 'Deployment', status: 'completed', dueDate: '2024-04-30' }
        ],
        risks: [],
        tasks: {
          total: 35,
          completed: 35,
          inProgress: 0,
          pending: 0
        }
      },
      {
        id: 4,
        name: 'CRM Dashboard',
        client: 'SalesForce Pro',
        status: 'on-hold',
        priority: 'low',
        startDate: '2024-03-01',
        endDate: '2024-08-15',
        progress: 25,
        budget: 120000,
        spent: 30000,
        teamMembers: 6,
        description: 'Customer relationship management dashboard with analytics',
        technologies: ['Angular', 'Express.js', 'MongoDB', 'Chart.js'],
        projectManager: 'Lisa Davis',
        assignedTeamLead: 'Emily Johnson',
        teamLeadId: 3,
        clientContact: {
          name: 'Robert Smith',
          email: 'robert@salesforcepro.com',
          phone: '+1-555-0321'
        },
        milestones: [
          { name: 'Requirements Analysis', status: 'completed', dueDate: '2024-03-15' },
          { name: 'UI Design', status: 'in-progress', dueDate: '2024-05-01' },
          { name: 'Development', status: 'pending', dueDate: '2024-07-01' },
          { name: 'Integration', status: 'pending', dueDate: '2024-08-10' }
        ],
        risks: [
          { level: 'high', description: 'Client budget constraints' },
          { level: 'medium', description: 'Changing requirements' }
        ],
        tasks: {
          total: 40,
          completed: 10,
          inProgress: 5,
          pending: 25
        }
      },
      {
        id: 5,
        name: 'Healthcare Portal',
        client: 'MediCare Systems',
        status: 'overdue',
        priority: 'high',
        startDate: '2023-12-01',
        endDate: '2024-05-31',
        progress: 80,
        budget: 180000,
        spent: 160000,
        teamMembers: 12,
        description: 'Patient management and telemedicine platform',
        technologies: ['React', 'Python', 'PostgreSQL', 'WebRTC'],
        projectManager: 'David Brown',
        assignedTeamLead: 'Maria Garcia',
        teamLeadId: 4,
        clientContact: {
          name: 'Dr. Jennifer Wilson',
          email: 'jennifer@medicare.com',
          phone: '+1-555-0654'
        },
        milestones: [
          { name: 'Core Platform', status: 'completed', dueDate: '2024-02-01' },
          { name: 'Patient Portal', status: 'completed', dueDate: '2024-04-01' },
          { name: 'Telemedicine Features', status: 'in-progress', dueDate: '2024-05-15' },
          { name: 'Security Compliance', status: 'pending', dueDate: '2024-06-15' }
        ],
        risks: [
          { level: 'high', description: 'HIPAA compliance requirements' },
          { level: 'high', description: 'Project timeline overrun' }
        ],
        tasks: {
          total: 55,
          completed: 44,
          inProgress: 8,
          pending: 3
        }
      }
    ];
  };

  // Mock team leads data
  const getMockTeamLeads = () => {
    return [
      {
        id: 1,
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@company.com',
        specialization: 'Full-Stack Development',
        experience: '5 years',
        currentProjects: 2,
        availability: 'available',
        skills: ['React', 'Node.js', 'Python', 'AWS']
      },
      {
        id: 2,
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        specialization: 'Frontend Development',
        experience: '4 years',
        currentProjects: 1,
        availability: 'busy',
        skills: ['React', 'Vue.js', 'TypeScript', 'UI/UX']
      },
      {
        id: 3,
        name: 'Emily Johnson',
        email: 'emily.johnson@company.com',
        specialization: 'Backend Development',
        experience: '6 years',
        currentProjects: 1,
        availability: 'available',
        skills: ['Node.js', 'Python', 'MongoDB', 'PostgreSQL']
      },
      {
        id: 4,
        name: 'Maria Garcia',
        email: 'maria.garcia@company.com',
        specialization: 'DevOps & Security',
        experience: '7 years',
        currentProjects: 2,
        availability: 'busy',
        skills: ['AWS', 'Docker', 'Kubernetes', 'Security']
      },
      {
        id: 5,
        name: 'James Thompson',
        email: 'james.thompson@company.com',
        specialization: 'Mobile Development',
        experience: '5 years',
        currentProjects: 0,
        availability: 'available',
        skills: ['React Native', 'Flutter', 'iOS', 'Android']
      },
      {
        id: 6,
        name: 'Lisa Chen',
        email: 'lisa.chen@company.com',
        specialization: 'Data Engineering',
        experience: '6 years',
        currentProjects: 1,
        availability: 'available',
        skills: ['Python', 'SQL', 'Big Data', 'Machine Learning']
      }
    ];
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = (projectsData) => {
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(p => p.status === 'active').length;
    const completedProjects = projectsData.filter(p => p.status === 'completed').length;
    const overdueProjects = projectsData.filter(p => p.status === 'overdue').length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects
    };
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(project =>
        (project.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.client || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(project => (project.status || 'unknown') === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'budget' || sortBy === 'spent' || sortBy === 'progress') {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterStatus, sortBy, sortOrder]);

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'completed': '#3b82f6',
      'on-hold': '#f59e0b',
      'overdue': '#ef4444',
      'planning': '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[priority] || '#6b7280';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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

  const isOverdue = (endDate, status) => {
    if (!endDate || !status) return false;
    return status !== 'completed' && new Date(endDate) < new Date();
  };

  // Handle team lead assignment
  const handleAssignTeamLead = (project) => {
    setSelectedProject(project);
    setSelectedTeamLead(project.teamLeadId || '');
    setShowAssignModal(true);
  };

  const handleSaveAssignment = async () => {
    if (!selectedTeamLead || !selectedProject) return;

    try {
      // Here you would make an API call to assign the team lead
      // const response = await fetch(`/api/projects/${selectedProject.id}/assign-lead`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ teamLeadId: selectedTeamLead })
      // });

      // For now, update locally
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProject.id) {
          const assignedLead = teamLeads.find(lead => lead.id === parseInt(selectedTeamLead));
          return {
            ...project,
            teamLeadId: parseInt(selectedTeamLead),
            assignedTeamLead: assignedLead ? assignedLead.name : null
          };
        }
        return project;
      });

      setProjects(updatedProjects);
      setFilteredProjects(updatedProjects);
      setShowAssignModal(false);
      setSelectedProject(null);
      setSelectedTeamLead('');

      // Show success message (you can implement a toast notification)
      alert('Team lead assigned successfully!');
    } catch (error) {
      console.error('Error assigning team lead:', error);
      alert('Error assigning team lead. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedProject(null);
    setSelectedTeamLead('');
  };

  // Handle project details view
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleCloseDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  // Get milestone status color
  const getMilestoneStatusColor = (status) => {
    const colors = {
      'completed': '#10b981',
      'in-progress': '#3b82f6',
      'pending': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  // Get risk level color
  const getRiskLevelColor = (level) => {
    const colors = {
      'high': '#ef4444',
      'medium': '#f59e0b',
      'low': '#10b981'
    };
    return colors[level] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="project-manager-dashboard">
        <div className="loading-spinner">
          Loading Project Manager Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="project-manager-dashboard">
      <div className="dashboard-header">
        <h1>Project Manager Dashboard</h1>
        <p>Comprehensive project management and tracking system</p>
      </div>

      {/* Dashboard Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)' }}>
            <FaProjectDiagram size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.totalProjects}</div>
            <div className="stat-title">Total Projects</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Overall portfolio
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <FaPlay size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.activeProjects}</div>
            <div className="stat-title">Active Projects</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Currently running
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <FaCheckCircle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.completedProjects}</div>
            <div className="stat-title">Completed</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Successfully delivered
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
            <FaExclamationTriangle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.overdueProjects}</div>
            <div className="stat-title">Overdue</div>
            <div className="stat-trend">
              <FaArrowDown size={12} />
              Needs attention
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="controls-section">
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search projects, clients, or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-controls">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
            <option value="overdue">Overdue</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="filter-select"
          >
            <option value="name">Sort by Name</option>
            <option value="startDate">Sort by Start Date</option>
            <option value="endDate">Sort by End Date</option>
            <option value="progress">Sort by Progress</option>
            <option value="budget">Sort by Budget</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="sort-button"
          >
            {sortOrder === 'asc' ? <FaArrowUp /> : <FaArrowDown />}
          </button>

          <button className="add-project-btn">
            <FaPlus /> New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-section">
        <div className="section-header">
          <h2><FaProjectDiagram /> Projects Overview ({filteredProjects.length})</h2>
        </div>

        <div className="projects-grid">
          {filteredProjects.map(project => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div className="project-title">
                  <h3>{project.name || 'Untitled Project'}</h3>
                  <div className="project-badges">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(project.status || 'unknown') }}
                    >
                      {project.status ? project.status.replace('-', ' ') : 'Unknown'}
                    </span>
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(project.priority || 'medium') }}
                    >
                      {project.priority || 'medium'} priority
                    </span>
                    {isOverdue(project.endDate, project.status) && (
                      <span className="overdue-badge">
                        <FaClock /> Overdue
                      </span>
                    )}
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
                  <button 
                    className="action-btn" 
                    onClick={() => handleAssignTeamLead(project)}
                    title="Assign Team Lead"
                  >
                    <FaUserTie />
                  </button>
                  <button className="action-btn" title="Edit Project">
                    <FaEdit />
                  </button>
                </div>
              </div>

              <div className="project-details">
                <div className="client-info">
                  <strong>Client:</strong> {project.client || 'Unknown Client'}
                </div>
                <div className="project-description">
                  {project.description || 'No description available'}
                </div>
                
                <div className="assignment-info">
                  <div className="assignment-item">
                    <strong>Project Manager:</strong> {project.projectManager}
                  </div>
                  <div className="assignment-item">
                    <strong>Team Lead:</strong> 
                    <span className={`team-lead-status ${project.assignedTeamLead ? 'assigned' : 'unassigned'}`}>
                      {project.assignedTeamLead || 'Not Assigned'}
                    </span>
                    {!project.assignedTeamLead && (
                      <button 
                        className="assign-quick-btn"
                        onClick={() => handleAssignTeamLead(project)}
                      >
                        Assign Now
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="project-meta">
                  <div className="meta-item">
                    <FaCalendarAlt />
                    <span>{formatDate(project.startDate)} - {formatDate(project.endDate)}</span>
                  </div>
                  <div className="meta-item">
                    <FaUsers />
                    <span>{project.teamMembers || 0} team members</span>
                  </div>
                  {project.clientContact && (
                    <div className="meta-item">
                      <FaEnvelope />
                      <span>{project.clientContact.name}</span>
                    </div>
                  )}
                </div>

                <div className="project-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span>{project.progress || 0}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ 
                        width: `${project.progress || 0}%`,
                        backgroundColor: getStatusColor(project.status || 'unknown')
                      }}
                    ></div>
                  </div>
                </div>

                <div className="budget-info">
                  <div className="budget-item">
                    <span>Budget:</span>
                    <span>{formatCurrency(project.budget || 0)}</span>
                  </div>
                  <div className="budget-item">
                    <span>Spent:</span>
                    <span>{formatCurrency(project.spent || 0)}</span>
                  </div>
                  <div className="budget-item">
                    <span>Remaining:</span>
                    <span className={(project.budget || 0) - (project.spent || 0) < (project.budget || 0) * 0.1 ? 'warning' : ''}>
                      {formatCurrency((project.budget || 0) - (project.spent || 0))}
                    </span>
                  </div>
                </div>

                {project.tasks && (
                  <div className="tasks-summary">
                    <div className="tasks-header">
                      <FaTasks /> Tasks Summary
                    </div>
                    <div className="tasks-stats">
                      <div className="task-stat completed">
                        <span>{project.tasks.completed}</span>
                        <span>Completed</span>
                      </div>
                      <div className="task-stat in-progress">
                        <span>{project.tasks.inProgress}</span>
                        <span>In Progress</span>
                      </div>
                      <div className="task-stat pending">
                        <span>{project.tasks.pending}</span>
                        <span>Pending</span>
                      </div>
                    </div>
                  </div>
                )}

                {project.technologies && (
                  <div className="technologies">
                    <div className="tech-header">Technologies:</div>
                    <div className="tech-tags">
                      {project.technologies.map((tech, index) => (
                        <span key={index} className="tech-tag">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="no-projects">
            <FaProjectDiagram size={64} />
            <h3>No projects found</h3>
            <p>Try adjusting your search criteria or add a new project.</p>
          </div>
        )}
      </div>

      {/* Team Lead Assignment Modal */}
      {showAssignModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Assign Team Lead</h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="project-info">
                <h4>{selectedProject.name}</h4>
                <p>Client: {selectedProject.client}</p>
              </div>
              <div className="form-group">
                <label htmlFor="teamLead">Select Team Lead:</label>
                <select 
                  id="teamLead"
                  value={selectedTeamLead} 
                  onChange={(e) => setSelectedTeamLead(e.target.value)}
                  className="team-lead-select"
                >
                  <option value="">Select a team lead...</option>
                  {teamLeads.map(lead => (
                    <option key={lead.id} value={lead.id}>
                      {lead.name} - {lead.specialization} ({lead.availability})
                    </option>
                  ))}
                </select>
              </div>
              {selectedTeamLead && (
                <div className="selected-lead-info">
                  {(() => {
                    const lead = teamLeads.find(l => l.id === parseInt(selectedTeamLead));
                    return lead ? (
                      <div className="lead-details">
                        <h5>Team Lead Details:</h5>
                        <p><strong>Name:</strong> {lead.name}</p>
                        <p><strong>Email:</strong> {lead.email}</p>
                        <p><strong>Specialization:</strong> {lead.specialization}</p>
                        <p><strong>Experience:</strong> {lead.experience}</p>
                        <p><strong>Current Projects:</strong> {lead.currentProjects}</p>
                        <p><strong>Status:</strong> 
                          <span className={`availability-badge ${lead.availability}`}>
                            {lead.availability}
                          </span>
                        </p>
                        <div className="skills">
                          <strong>Skills:</strong>
                          <div className="skill-tags">
                            {lead.skills.map((skill, index) => (
                              <span key={index} className="skill-tag">{skill}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSaveAssignment}
                disabled={!selectedTeamLead}
              >
                <FaSave /> Assign Team Lead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content project-details-modal">
            <div className="modal-header">
              <h3>Project Details</h3>
              <button className="modal-close" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="project-overview">
                <div className="overview-header">
                  <h4>{selectedProject.name || 'Untitled Project'}</h4>
                  <div className="project-badges">
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(selectedProject.status || 'unknown') }}
                    >
                      {selectedProject.status ? selectedProject.status.replace('-', ' ') : 'Unknown'}
                    </span>
                    <span 
                      className="priority-badge" 
                      style={{ backgroundColor: getPriorityColor(selectedProject.priority || 'medium') }}
                    >
                      {selectedProject.priority || 'medium'} priority
                    </span>
                  </div>
                </div>
                <p className="project-description">{selectedProject.description || 'No description available'}</p>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h5><FaInfoCircle /> Basic Information</h5>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span>Client:</span>
                      <span>{selectedProject.client || 'Unknown Client'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Project Manager:</span>
                      <span>{selectedProject.projectManager || 'Not Assigned'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Team Lead:</span>
                      <span>{selectedProject.assignedTeamLead || 'Not Assigned'}</span>
                    </div>
                    <div className="detail-item">
                      <span>Start Date:</span>
                      <span>{formatDate(selectedProject.startDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span>End Date:</span>
                      <span>{formatDate(selectedProject.endDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Team Size:</span>
                      <span>{selectedProject.teamMembers} members</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5><FaEnvelope /> Client Contact</h5>
                  {selectedProject.clientContact && (
                    <div className="detail-items">
                      <div className="detail-item">
                        <span>Contact Name:</span>
                        <span>{selectedProject.clientContact.name}</span>
                      </div>
                      <div className="detail-item">
                        <span>Email:</span>
                        <span>{selectedProject.clientContact.email}</span>
                      </div>
                      <div className="detail-item">
                        <span>Phone:</span>
                        <span>{selectedProject.clientContact.phone}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="detail-section">
                  <h5><FaChartLine /> Budget & Progress</h5>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span>Total Budget:</span>
                      <span>{formatCurrency(selectedProject.budget || 0)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Amount Spent:</span>
                      <span>{formatCurrency(selectedProject.spent || 0)}</span>
                    </div>
                    <div className="detail-item">
                      <span>Remaining:</span>
                      <span>{formatCurrency((selectedProject.budget || 0) - (selectedProject.spent || 0))}</span>
                    </div>
                    <div className="detail-item">
                      <span>Progress:</span>
                      <span>{selectedProject.progress || 0}%</span>
                    </div>
                  </div>
                  <div className="progress-visualization">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ 
                          width: `${selectedProject.progress || 0}%`,
                          backgroundColor: getStatusColor(selectedProject.status || 'unknown')
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {selectedProject.milestones && (
                  <div className="detail-section">
                    <h5><FaMilestone /> Milestones</h5>
                    <div className="milestones-list">
                      {selectedProject.milestones.map((milestone, index) => (
                        <div key={index} className="milestone-item">
                          <div className="milestone-header">
                            <span className="milestone-name">{milestone.name}</span>
                            <span 
                              className="milestone-status"
                              style={{ color: getMilestoneStatusColor(milestone.status || 'pending') }}
                            >
                              {milestone.status ? milestone.status.replace('-', ' ') : 'pending'}
                            </span>
                          </div>
                          <div className="milestone-date">Due: {formatDate(milestone.dueDate)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.risks && selectedProject.risks.length > 0 && (
                  <div className="detail-section">
                    <h5><FaExclamationTriangle /> Risk Assessment</h5>
                    <div className="risks-list">
                      {selectedProject.risks.map((risk, index) => (
                        <div key={index} className="risk-item">
                          <span 
                            className="risk-level"
                            style={{ color: getRiskLevelColor(risk.level) }}
                          >
                            <FaFlag /> {risk.level.toUpperCase()}
                          </span>
                          <span className="risk-description">{risk.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h5><FaTasks /> Task Summary</h5>
                  <div className="tasks-overview">
                    <div className="task-stat completed">
                      <span className="task-count">{selectedProject.tasks.completed}</span>
                      <span className="task-label">Completed</span>
                    </div>
                    <div className="task-stat in-progress">
                      <span className="task-count">{selectedProject.tasks.inProgress}</span>
                      <span className="task-label">In Progress</span>
                    </div>
                    <div className="task-stat pending">
                      <span className="task-count">{selectedProject.tasks.pending}</span>
                      <span className="task-label">Pending</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Technologies</h5>
                  <div className="tech-tags">
                    {selectedProject.technologies.map((tech, index) => (
                      <span key={index} className="tech-tag">{tech}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagerDashboard;
