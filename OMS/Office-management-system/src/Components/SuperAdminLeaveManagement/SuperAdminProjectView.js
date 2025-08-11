import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiEye,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiCalendar,
  FiUser,
  FiDollarSign,
  FiClock,
  FiBarChart2,
  FiMoreVertical,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiTrendingDown,
  FiCheckCircle,
  FiAlertCircle,
  FiPause,
  FiPlay,
} from "react-icons/fi";
import "./SuperAdminProjectView.css";

const SuperAdminProjectView = () => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage] = useState(12);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(null);

  // Handler functions for project actions
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
  };

  const handleEditProject = (project) => {
    console.log("Edit project:", project);
    // Add edit functionality here
    alert(`Edit functionality for ${project.name} - Coming soon!`);
  };

  const handleMoreActions = (projectId, event) => {
    event.stopPropagation();
    setShowMoreActions(showMoreActions === projectId ? null : projectId);
  };

  const handleDeleteProject = (project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      console.log("Delete project:", project);
      // Add delete functionality here
      alert(`Delete functionality for ${project.name} - Coming soon!`);
    }
    setShowMoreActions(null);
  };

  const handleCloneProject = (project) => {
    console.log("Clone project:", project);
    // Add clone functionality here
    alert(`Clone functionality for ${project.name} - Coming soon!`);
    setShowMoreActions(null);
  };

  const handleArchiveProject = (project) => {
    console.log("Archive project:", project);
    // Add archive functionality here
    alert(`Archive functionality for ${project.name} - Coming soon!`);
    setShowMoreActions(null);
  };

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshProjects();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Function to refresh projects data
  const refreshProjects = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Fetch fresh data from API
      const response = await fetch(
        "http://localhost:5001/api/client-projects",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const projectsData = Array.isArray(result)
        ? result
        : result.data || result.projects || [];

      // Fetch updated task counts
      const projectsWithTaskCounts = await Promise.all(
        projectsData.map(async (project) => {
          try {
            const taskCountsResponse = await fetch(
              `http://localhost:5001/api/team-lead/projects/${project._id}/tasks`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (taskCountsResponse.ok) {
              const taskResult = await taskCountsResponse.json();
              if (taskResult.success && taskResult.data) {
                const tasks = taskResult.data;
                const taskCounts = {
                  total: tasks.length,
                  completed: tasks.filter((task) => task.status === "Completed")
                    .length,
                  inProgress: tasks.filter(
                    (task) => task.status === "In Progress"
                  ).length,
                  pending: tasks.filter((task) => task.status === "Pending")
                    .length,
                };

                const progress =
                  taskCounts.total > 0
                    ? Math.round(
                        (taskCounts.completed / taskCounts.total) * 100
                      )
                    : 0;

                return {
                  ...project,
                  tasks: taskCounts,
                  progress: progress,
                  id: project._id,
                  name: project.projectName || project.name,
                  client: project.clientName || project.client,
                  status: project.status || "planning",
                  priority: project.priority || "medium",
                  budget: project.budget || 0,
                  spent: project.spent || 0,
                  startDate: project.startDate || project.createdAt,
                  endDate: project.endDate || project.deadline,
                  teamMembers:
                    project.teamSize || project.assignedEmployees?.length || 0,
                  description:
                    project.description || "No description available",
                  projectManager:
                    project.projectManager ||
                    project.assignedTeamLead ||
                    "Not assigned",
                  technologies: project.technologies || project.techStack || [],
                  risks: project.risks || [],
                  milestones: project.milestones || [],
                };
              }
            }

            return {
              ...project,
              tasks: { total: 0, completed: 0, inProgress: 0, pending: 0 },
              progress: 0,
              id: project._id,
              name: project.projectName || project.name,
              client: project.clientName || project.client,
              status: project.status || "planning",
              priority: project.priority || "medium",
              budget: project.budget || 0,
              spent: project.spent || 0,
              startDate: project.startDate || project.createdAt,
              endDate: project.endDate || project.deadline,
              teamMembers:
                project.teamSize || project.assignedEmployees?.length || 0,
              description: project.description || "No description available",
              projectManager:
                project.projectManager ||
                project.assignedTeamLead ||
                "Not assigned",
              technologies: project.technologies || project.techStack || [],
              risks: project.risks || [],
              milestones: project.milestones || [],
            };
          } catch (taskError) {
            console.warn(
              `Failed to fetch tasks for project ${project._id}:`,
              taskError
            );
            return {
              ...project,
              tasks: { total: 0, completed: 0, inProgress: 0, pending: 0 },
              progress: 0,
              id: project._id,
              name: project.projectName || project.name,
              client: project.clientName || project.client,
              status: project.status || "planning",
              priority: project.priority || "medium",
              budget: project.budget || 0,
              spent: project.spent || 0,
              startDate: project.startDate || project.createdAt,
              endDate: project.endDate || project.deadline,
              teamMembers:
                project.teamSize || project.assignedEmployees?.length || 0,
              description: project.description || "No description available",
              projectManager:
                project.projectManager ||
                project.assignedTeamLead ||
                "Not assigned",
              technologies: project.technologies || project.techStack || [],
              risks: project.risks || [],
              milestones: project.milestones || [],
            };
          }
        })
      );

      setProjects(projectsWithTaskCounts);
      setFilteredProjects(projectsWithTaskCounts);
    } catch (error) {
      console.error("Error refreshing projects:", error);
      setError(error.message || "Failed to refresh projects");
    } finally {
      setRefreshing(false);
    }
  };

  // Mock data - Replace with actual API call
  const mockProjects = [
    {
      id: 1,
      name: "E-Commerce Platform Redesign",
      client: "TechCorp Solutions",
      status: "in_progress",
      priority: "high",
      progress: 75,
      budget: 125000,
      spent: 93750,
      startDate: "2024-01-15",
      endDate: "2024-04-30",
      teamMembers: 8,
      description:
        "Complete redesign of the e-commerce platform with modern UI/UX",
      projectManager: "John Smith",
      technologies: ["React", "Node.js", "MongoDB"],
      risks: ["Budget overrun", "Timeline delay"],
      milestones: [
        { name: "UI Design", completed: true, date: "2024-02-01" },
        { name: "Frontend Development", completed: true, date: "2024-03-15" },
        { name: "Backend Integration", completed: false, date: "2024-04-10" },
        { name: "Testing & QA", completed: false, date: "2024-04-25" },
      ],
    },
    {
      id: 2,
      name: "Mobile Banking App",
      client: "SecureBank Ltd",
      status: "completed",
      priority: "high",
      progress: 100,
      budget: 200000,
      spent: 185000,
      startDate: "2023-10-01",
      endDate: "2024-02-28",
      teamMembers: 12,
      description:
        "Secure mobile banking application with biometric authentication",
      projectManager: "Sarah Johnson",
      technologies: ["React Native", "Express.js", "PostgreSQL"],
      risks: [],
      milestones: [
        { name: "Requirements Analysis", completed: true, date: "2023-10-15" },
        {
          name: "Security Implementation",
          completed: true,
          date: "2023-12-01",
        },
        { name: "User Testing", completed: true, date: "2024-01-20" },
        { name: "Deployment", completed: true, date: "2024-02-28" },
      ],
    },
    {
      id: 3,
      name: "AI Analytics Dashboard",
      client: "DataTech Industries",
      status: "planning",
      priority: "medium",
      progress: 15,
      budget: 80000,
      spent: 12000,
      startDate: "2024-03-01",
      endDate: "2024-06-30",
      teamMembers: 6,
      description: "Advanced analytics dashboard with AI-powered insights",
      projectManager: "Mike Chen",
      technologies: ["Python", "React", "TensorFlow"],
      risks: ["Data integration complexity"],
      milestones: [
        { name: "Data Analysis", completed: true, date: "2024-03-15" },
        { name: "AI Model Development", completed: false, date: "2024-04-30" },
        { name: "Dashboard Design", completed: false, date: "2024-05-31" },
        { name: "Integration & Testing", completed: false, date: "2024-06-25" },
      ],
    },
    {
      id: 4,
      name: "CRM System Upgrade",
      client: "SalesForce Pro",
      status: "on_hold",
      priority: "low",
      progress: 40,
      budget: 60000,
      spent: 24000,
      startDate: "2023-12-01",
      endDate: "2024-05-15",
      teamMembers: 4,
      description: "Legacy CRM system modernization and feature enhancement",
      projectManager: "Lisa Wang",
      technologies: ["Angular", "Spring Boot", "MySQL"],
      risks: ["Client budget constraints", "Legacy system complexity"],
      milestones: [
        { name: "System Analysis", completed: true, date: "2023-12-20" },
        { name: "Database Migration", completed: true, date: "2024-01-31" },
        { name: "Feature Development", completed: false, date: "2024-04-15" },
        { name: "User Training", completed: false, date: "2024-05-10" },
      ],
    },
    {
      id: 5,
      name: "Healthcare Management System",
      client: "MedTech Solutions",
      status: "in_progress",
      priority: "high",
      progress: 60,
      budget: 150000,
      spent: 90000,
      startDate: "2024-01-01",
      endDate: "2024-07-31",
      teamMembers: 10,
      description:
        "Comprehensive healthcare management system with patient records",
      projectManager: "Dr. Emily Brown",
      technologies: ["Vue.js", "Django", "PostgreSQL"],
      risks: ["HIPAA compliance", "Data security"],
      milestones: [
        { name: "Security Framework", completed: true, date: "2024-02-15" },
        { name: "Patient Module", completed: true, date: "2024-04-01" },
        { name: "Doctor Portal", completed: false, date: "2024-06-01" },
        { name: "Compliance Testing", completed: false, date: "2024-07-15" },
      ],
    },
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get JWT token for authentication
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error(
            "Authentication token not found. Please login again."
          );
        }

        // First, try to import/sync remote projects to local database
        try {
          await fetch(
            "http://localhost:5001/api/client-projects/import-remote",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
        } catch (importError) {
          console.warn("Failed to import remote projects:", importError);
        }

        // Fetch projects from local database
        const response = await fetch(
          "http://localhost:5001/api/client-projects",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log("Super Admin - API Response:", result);

        const projectsData = Array.isArray(result)
          ? result
          : result.data || result.projects || [];

        // Fetch real-time task counts for each project
        const projectsWithTaskCounts = await Promise.all(
          projectsData.map(async (project) => {
            try {
              const taskCountsResponse = await fetch(
                `http://localhost:5001/api/team-lead/projects/${project._id}/tasks`,
                {
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (taskCountsResponse.ok) {
                const taskResult = await taskCountsResponse.json();
                if (taskResult.success && taskResult.data) {
                  const tasks = taskResult.data;
                  const taskCounts = {
                    total: tasks.length,
                    completed: tasks.filter(
                      (task) => task.status === "Completed"
                    ).length,
                    inProgress: tasks.filter(
                      (task) => task.status === "In Progress"
                    ).length,
                    pending: tasks.filter((task) => task.status === "Pending")
                      .length,
                  };

                  // Calculate project progress based on completed tasks
                  const progress =
                    taskCounts.total > 0
                      ? Math.round(
                          (taskCounts.completed / taskCounts.total) * 100
                        )
                      : 0;

                  return {
                    ...project,
                    tasks: taskCounts,
                    progress: progress,
                    // Map API fields to component expected fields
                    id: project._id,
                    name: project.projectName || project.name,
                    client: project.clientName || project.client,
                    status: project.status || "planning",
                    priority: project.priority || "medium",
                    budget: project.budget || 0,
                    spent: project.spent || 0,
                    startDate: project.startDate || project.createdAt,
                    endDate: project.endDate || project.deadline,
                    teamMembers:
                      project.teamSize ||
                      project.assignedEmployees?.length ||
                      0,
                    description:
                      project.description || "No description available",
                    projectManager:
                      project.projectManager ||
                      project.assignedTeamLead ||
                      "Not assigned",
                    technologies:
                      project.technologies || project.techStack || [],
                    risks: project.risks || [],
                    milestones: project.milestones || [],
                  };
                }
              }

              // Return project with default task counts if fetch fails
              const progress = 0;
              return {
                ...project,
                tasks: { total: 0, completed: 0, inProgress: 0, pending: 0 },
                progress: progress,
                id: project._id,
                name: project.projectName || project.name,
                client: project.clientName || project.client,
                status: project.status || "planning",
                priority: project.priority || "medium",
                budget: project.budget || 0,
                spent: project.spent || 0,
                startDate: project.startDate || project.createdAt,
                endDate: project.endDate || project.deadline,
                teamMembers:
                  project.teamSize || project.assignedEmployees?.length || 0,
                description: project.description || "No description available",
                projectManager:
                  project.projectManager ||
                  project.assignedTeamLead ||
                  "Not assigned",
                technologies: project.technologies || project.techStack || [],
                risks: project.risks || [],
                milestones: project.milestones || [],
              };
            } catch (taskError) {
              console.warn(
                `Failed to fetch tasks for project ${project._id}:`,
                taskError
              );
              const progress = 0;
              return {
                ...project,
                tasks: { total: 0, completed: 0, inProgress: 0, pending: 0 },
                progress: progress,
                id: project._id,
                name: project.projectName || project.name,
                client: project.clientName || project.client,
                status: project.status || "planning",
                priority: project.priority || "medium",
                budget: project.budget || 0,
                spent: project.spent || 0,
                startDate: project.startDate || project.createdAt,
                endDate: project.endDate || project.deadline,
                teamMembers:
                  project.teamSize || project.assignedEmployees?.length || 0,
                description: project.description || "No description available",
                projectManager:
                  project.projectManager ||
                  project.assignedTeamLead ||
                  "Not assigned",
                technologies: project.technologies || project.techStack || [],
                risks: project.risks || [],
                milestones: project.milestones || [],
              };
            }
          })
        );

        console.log(
          "Super Admin - Projects with task counts:",
          projectsWithTaskCounts
        );
        setProjects(projectsWithTaskCounts);
        setFilteredProjects(projectsWithTaskCounts);
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(err.message || "Failed to fetch projects");

        // Fallback to mock data if API fails
        setProjects(mockProjects);
        setFilteredProjects(mockProjects);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = projects.filter((project) => {
      const projectName = project.name || project.projectName || "";
      const clientName = project.client || project.clientName || "";
      const managerName =
        project.projectManager || project.assignedTeamLead || "";

      const matchesSearch =
        projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        managerName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || project.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || project.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort projects
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "budget" || sortBy === "spent" || sortBy === "progress") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
    setCurrentPage(1);
  }, [projects, searchTerm, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Pagination
  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(
    indexOfFirstProject,
    indexOfLastProject
  );
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  const getStatusColor = (status) => {
    const statusColors = {
      completed: "#10b981",
      in_progress: "#3b82f6",
      planning: "#f59e0b",
      on_hold: "#ef4444",
      cancelled: "#6b7280",
    };
    return statusColors[status] || "#6b7280";
  };

  const getStatusIcon = (status) => {
    const statusIcons = {
      completed: <FiCheckCircle />,
      in_progress: <FiPlay />,
      planning: <FiClock />,
      on_hold: <FiPause />,
      cancelled: <FiAlertCircle />,
    };
    return statusIcons[status] || <FiClock />;
  };

  const getPriorityColor = (priority) => {
    const priorityColors = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981",
    };
    return priorityColors[priority] || "#6b7280";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getProjectStats = () => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(
      (p) => p.status === "completed"
    ).length;
    const inProgressProjects = projects.filter(
      (p) => p.status === "in_progress"
    ).length;
    const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
    const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);

    return {
      totalProjects,
      completedProjects,
      inProgressProjects,
      totalBudget,
      totalSpent,
      completionRate:
        totalProjects > 0
          ? Math.round((completedProjects / totalProjects) * 100)
          : 0,
    };
  };

  const stats = getProjectStats();

  if (loading) {
    return (
      <div className="super-admin-projects">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="super-admin-projects">
        <div className="error-container">
          <FiAlertCircle size={48} />
          <h3>Error Loading Projects</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            <FiRefreshCw /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="super-admin-projects">
      {/* Header Section */}
      <div className="projects-header">
        <div className="header-title">
          <h1>Project Management</h1>
          <p>Comprehensive overview of all projects and their details</p>
          <div className="auto-refresh-toggle">
            <label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              Auto-refresh every 5 minutes
            </label>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={refreshProjects}
            disabled={refreshing}
          >
            <FiRefreshCw className={refreshing ? "rotating" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
          <button className="btn-secondary">
            <FiDownload /> Export Report
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="stats-dashboard">
        <div className="stat-card">
          <div className="stat-icon projects-icon">
            <FiBarChart2 />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.totalProjects}</div>
            <div className="stat-label">Total Projects</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.completedProjects}</div>
            <div className="stat-label">Completed</div>
            <div className="stat-trend positive">
              <FiTrendingUp /> {stats.completionRate}%
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon progress-icon">
            <FiPlay />
          </div>
          <div className="stat-content">
            <div className="stat-number">{stats.inProgressProjects}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon budget-icon">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {formatCurrency(stats.totalBudget)}
            </div>
            <div className="stat-label">Total Budget</div>
            <div className="stat-subtitle">
              {formatCurrency(stats.totalSpent)} spent
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="projects-controls">
        <div className="search-section">
          <div className="search-input-group">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search projects, clients, or managers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="filter-section">
          <button
            className={`filter-toggle ${showFilters ? "active" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FiFilter /> Filters
          </button>

          <div className="view-controls">
            <button
              className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <FiGrid />
            </button>
            <button
              className={`view-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <FiList />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="filter-panel">
          <div className="filter-group">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="in_progress">In Progress</option>
              <option value="planning">Planning</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="name">Project Name</option>
              <option value="client">Client</option>
              <option value="startDate">Start Date</option>
              <option value="endDate">End Date</option>
              <option value="budget">Budget</option>
              <option value="progress">Progress</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      <div className={`projects-container ${viewMode}`}>
        {currentProjects.length === 0 ? (
          <div className="empty-state">
            <FiBarChart2 size={64} />
            <h3>No Projects Found</h3>
            <p>Try adjusting your filters or search terms</p>
          </div>
        ) : (
          currentProjects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-header">
                <div className="project-title-section">
                  <h3 className="project-title">{project.name}</h3>
                  <div className="project-meta">
                    <span className="client-name">
                      <FiUser /> {project.client}
                    </span>
                    <span className="project-manager">
                      PM: {project.projectManager}
                    </span>
                  </div>
                </div>
                <div className="project-actions">
                  <button
                    className="action-btn"
                    title="View Details"
                    onClick={() => handleViewDetails(project)}
                  >
                    <FiEye />
                  </button>
                  <button
                    className="action-btn"
                    title="Edit Project"
                    onClick={() => handleEditProject(project)}
                  >
                    <FiEdit />
                  </button>
                  <div className="more-actions-container">
                    <button
                      className="action-btn more-actions"
                      title="More Actions"
                      onClick={(e) => handleMoreActions(project.id, e)}
                    >
                      <FiMoreVertical />
                    </button>
                    {showMoreActions === project.id && (
                      <div className="more-actions-menu">
                        <button onClick={() => handleCloneProject(project)}>
                          <FiPlus /> Clone Project
                        </button>
                        <button onClick={() => handleArchiveProject(project)}>
                          <FiDownload /> Archive
                        </button>
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="delete-action"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="project-status-row">
                <div
                  className="status-badge"
                  style={{
                    backgroundColor: `${getStatusColor(project.status)}20`,
                    color: getStatusColor(project.status),
                    border: `1px solid ${getStatusColor(project.status)}40`,
                  }}
                >
                  {getStatusIcon(project.status)}
                  {project.status.replace("_", " ").toUpperCase()}
                </div>
                <div
                  className="priority-badge"
                  style={{
                    backgroundColor: `${getPriorityColor(project.priority)}20`,
                    color: getPriorityColor(project.priority),
                    border: `1px solid ${getPriorityColor(project.priority)}40`,
                  }}
                >
                  {project.priority.toUpperCase()} PRIORITY
                </div>
              </div>

              <div className="project-description">
                <p>{project.description}</p>
              </div>

              <div className="project-progress">
                <div className="progress-header">
                  <span>Progress</span>
                  <span className="progress-percentage">
                    {project.progress}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${project.progress}%`,
                      backgroundColor: getStatusColor(project.status),
                    }}
                  ></div>
                </div>
              </div>

              <div className="project-details">
                <div className="detail-row">
                  <div className="detail-item">
                    <FiCalendar className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Duration</span>
                      <span className="detail-value">
                        {formatDate(project.startDate)} -{" "}
                        {formatDate(project.endDate)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <FiDollarSign className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Budget</span>
                      <span className="detail-value">
                        {formatCurrency(project.spent)} /{" "}
                        {formatCurrency(project.budget)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <FiUser className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Team Size</span>
                      <span className="detail-value">
                        {project.teamMembers} members
                      </span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <FiCheckCircle className="detail-icon" />
                    <div className="detail-content">
                      <span className="detail-label">Tasks</span>
                      <span className="detail-value">
                        {project.tasks
                          ? `${project.tasks.completed}/${project.tasks.total}`
                          : "0/0"}{" "}
                        completed
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-item">
                    <div className="detail-content full-width">
                      <span className="detail-label">Technologies</span>
                      <div className="tech-tags">
                        {project.technologies.map((tech, index) => (
                          <span key={index} className="tech-tag">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {project.risks.length > 0 && (
                  <div className="detail-row">
                    <div className="detail-item">
                      <FiAlertCircle className="detail-icon risk-icon" />
                      <div className="detail-content">
                        <span className="detail-label">Risks</span>
                        <div className="risk-list">
                          {project.risks.map((risk, index) => (
                            <span key={index} className="risk-item">
                              {risk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="milestones-section">
                  <span className="detail-label">Milestones</span>
                  <div className="milestones-list">
                    {project.milestones.map((milestone, index) => (
                      <div
                        key={index}
                        className={`milestone-item ${
                          milestone.completed ? "completed" : "pending"
                        }`}
                      >
                        <div className="milestone-status">
                          {milestone.completed ? (
                            <FiCheckCircle />
                          ) : (
                            <FiClock />
                          )}
                        </div>
                        <div className="milestone-content">
                          <span className="milestone-name">
                            {milestone.name}
                          </span>
                          <span className="milestone-date">
                            {formatDate(milestone.date)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </button>

          <div className="pagination-info">
            <span>
              Page {currentPage} of {totalPages}({filteredProjects.length}{" "}
              projects)
            </span>
          </div>

          <button
            className="pagination-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div
          className="modal-overlay"
          onClick={() => setShowProjectDetails(false)}
        >
          <div
            className="project-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{selectedProject.name}</h2>
              <button
                className="close-modal"
                onClick={() => setShowProjectDetails(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-content">
              <div className="project-overview">
                <div className="overview-item">
                  <label>Client:</label>
                  <span>{selectedProject.client}</span>
                </div>
                <div className="overview-item">
                  <label>Project Manager:</label>
                  <span>{selectedProject.projectManager}</span>
                </div>
                <div className="overview-item">
                  <label>Status:</label>
                  <span className={`status-${selectedProject.status}`}>
                    {selectedProject.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <div className="overview-item">
                  <label>Priority:</label>
                  <span className={`priority-${selectedProject.priority}`}>
                    {selectedProject.priority.toUpperCase()}
                  </span>
                </div>
                <div className="overview-item">
                  <label>Progress:</label>
                  <span>{selectedProject.progress}%</span>
                </div>
                <div className="overview-item">
                  <label>Budget:</label>
                  <span>{formatCurrency(selectedProject.budget)}</span>
                </div>
                <div className="overview-item">
                  <label>Spent:</label>
                  <span>{formatCurrency(selectedProject.spent)}</span>
                </div>
                <div className="overview-item">
                  <label>Team Size:</label>
                  <span>{selectedProject.teamMembers} members</span>
                </div>
                <div className="overview-item">
                  <label>Duration:</label>
                  <span>
                    {formatDate(selectedProject.startDate)} -{" "}
                    {formatDate(selectedProject.endDate)}
                  </span>
                </div>
              </div>

              <div className="project-description-modal">
                <label>Description:</label>
                <p>{selectedProject.description}</p>
              </div>

              <div className="project-technologies-modal">
                <label>Technologies:</label>
                <div className="tech-tags">
                  {selectedProject.technologies.map((tech, index) => (
                    <span key={index} className="tech-tag">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {selectedProject.risks.length > 0 && (
                <div className="project-risks-modal">
                  <label>Risks:</label>
                  <ul>
                    {selectedProject.risks.map((risk, index) => (
                      <li key={index}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="project-milestones-modal">
                <label>Milestones:</label>
                <div className="milestones-grid">
                  {selectedProject.milestones.map((milestone, index) => (
                    <div
                      key={index}
                      className={`milestone-card ${
                        milestone.completed ? "completed" : "pending"
                      }`}
                    >
                      <div className="milestone-status">
                        {milestone.completed ? <FiCheckCircle /> : <FiClock />}
                      </div>
                      <div className="milestone-info">
                        <h4>{milestone.name}</h4>
                        <span>{formatDate(milestone.date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedProject.tasks && (
                <div className="project-tasks-modal">
                  <label>Task Summary:</label>
                  <div className="task-summary-grid">
                    <div className="task-stat">
                      <span className="task-number">
                        {selectedProject.tasks.total}
                      </span>
                      <span className="task-label">Total Tasks</span>
                    </div>
                    <div className="task-stat completed">
                      <span className="task-number">
                        {selectedProject.tasks.completed}
                      </span>
                      <span className="task-label">Completed</span>
                    </div>
                    <div className="task-stat in-progress">
                      <span className="task-number">
                        {selectedProject.tasks.inProgress}
                      </span>
                      <span className="task-label">In Progress</span>
                    </div>
                    <div className="task-stat pending">
                      <span className="task-number">
                        {selectedProject.tasks.pending}
                      </span>
                      <span className="task-label">Pending</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminProjectView;
