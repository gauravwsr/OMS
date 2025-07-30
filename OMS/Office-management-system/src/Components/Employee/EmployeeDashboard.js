import React, { useState, useEffect } from "react";
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
  FaUser,
  FaUserTie,
  FaClipboardList,
} from "react-icons/fa";
import { useAuth } from "../AuthProvider/AuthContext";
import "./EmployeeDashboard.css";

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("projectId");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState({
    Pending: [],
    "In Progress": [],
    Completed: [],
  });
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [selectedTask, setSelectedTask] = useState(null);

  // Get current user (Employee) info from auth context
  const currentUser = user || {
    name: "Employee",
    id: "employee-id",
    email: "employee@company.com",
  };

  // Fetch projects assigned to this employee
  const fetchAssignedProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const identifier =
        currentUser.id || currentUser.email || currentUser.name;

      const response = await fetch(
        `http://localhost:5000/api/client-projects/employee/${identifier}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      const assignedProjects = Array.isArray(result.data) ? result.data : [];

      // Fetch task summaries for each project where employee is assigned
      const projectsWithTasks = await Promise.all(
        assignedProjects.map(async (project) => {
          try {
            const taskResponse = await fetch(
              `http://localhost:5000/api/employee/projects/${project._id}/tasks`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const taskResult = await taskResponse.json();

            if (taskResult.success) {
              // Filter tasks assigned to current employee
              const employeeTasks = taskResult.data.filter(
                (task) =>
                  task.assignedTo &&
                  task.assignedTo.some(
                    (assignee) =>
                      assignee.employeeId === currentUser.id ||
                      assignee.email === currentUser.email ||
                      assignee.name === currentUser.name
                  )
              );

              const projectTasks = {
                Pending: employeeTasks.filter(
                  (task) => task.status === "Pending"
                ),
                "In Progress": employeeTasks.filter(
                  (task) => task.status === "In Progress"
                ),
                Completed: employeeTasks.filter(
                  (task) => task.status === "Completed"
                ),
              };

              return {
                ...project,
                taskSummary: projectTasks,
                totalTasks: employeeTasks.length,
                completedTasks: projectTasks.Completed.length,
              };
            }
            return {
              ...project,
              taskSummary: { Pending: [], "In Progress": [], Completed: [] },
              totalTasks: 0,
              completedTasks: 0,
            };
          } catch (error) {
            console.error(
              `Error fetching tasks for project ${project._id}:`,
              error
            );
            return {
              ...project,
              taskSummary: { Pending: [], "In Progress": [], Completed: [] },
              totalTasks: 0,
              completedTasks: 0,
            };
          }
        })
      );

      setProjects(projectsWithTasks);
      setDashboardStats(calculateDashboardStats(projectsWithTasks));
    } catch (error) {
      console.error("Error fetching assigned projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate dashboard statistics
  const calculateDashboardStats = (projectsData) => {
    const totalProjects = projectsData.length;
    const activeProjects = projectsData.filter(
      (p) => p.projectStatus === "Active"
    ).length;
    const completedProjects = projectsData.filter(
      (p) => p.projectStatus === "Completed"
    ).length;

    let totalTasks = 0;
    let completedTasks = 0;
    let pendingTasks = 0;

    projectsData.forEach((project) => {
      totalTasks += project.totalTasks || 0;
      completedTasks += project.completedTasks || 0;
      if (project.taskSummary) {
        pendingTasks +=
          project.taskSummary.Pending.length +
          project.taskSummary["In Progress"].length;
      }
    });

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      completedTasks,
      pendingTasks,
    };
  };

  // Filter and search functionality
  useEffect(() => {
    let filtered = [...projects];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (project) =>
          (project.clientName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (project.projectId || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (project.leadName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (project) => (project.projectStatus || "unknown") === filterStatus
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal = a[sortBy] || "";
      let bVal = b[sortBy] || "";

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (sortOrder === "asc") {
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
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "#10b981",
      completed: "#3b82f6",
      overdue: "#ef4444",
      pending: "#f59e0b",
      unknown: "#6b7280",
    };
    return colors[status?.toLowerCase()] || colors.unknown;
  };

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetails(true);
    fetchProjectTasks(project._id);
  };

  const handleCloseDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
    setTasks({ Pending: [], "In Progress": [], Completed: [] });
  };

  // Fetch tasks for selected project (employee's tasks only)
  const fetchProjectTasks = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/employee/projects/${projectId}/tasks`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();

      if (result.success) {
        // Filter tasks assigned to current employee
        const employeeTasks = result.data.filter(
          (task) =>
            task.assignedTo &&
            task.assignedTo.some(
              (assignee) =>
                assignee.employeeId === currentUser.id ||
                assignee.email === currentUser.email ||
                assignee.name === currentUser.name
            )
        );

        // Group tasks by status
        const groupedTasks = {
          Pending: employeeTasks.filter((task) => task.status === "Pending"),
          "In Progress": employeeTasks.filter(
            (task) => task.status === "In Progress"
          ),
          Completed: employeeTasks.filter(
            (task) => task.status === "Completed"
          ),
        };

        setTasks(groupedTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Update task status (only for own assigned tasks)
  const updateTaskStatus = async (taskId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/employee/tasks/${taskId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchProjectTasks(selectedProject._id);
        fetchAssignedProjects();
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  // Update task point completion
  const updateTaskPoint = async (taskId, pointId, isCompleted, completedBy) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/employee/tasks/${taskId}/points/${pointId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ isCompleted, completedBy }),
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchProjectTasks(selectedProject._id);
        fetchAssignedProjects();
      }
    } catch (error) {
      console.error("Error updating task point:", error);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  if (loading) {
    return (
      <div className="employee-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading your assigned projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <p>
          Welcome back, {currentUser.name || currentUser.username || "Employee"}
          ! Here are your assigned projects and tasks.
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #667eea, #764ba2)" }}
          >
            <FaProjectDiagram size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.totalProjects}</div>
            <div className="stat-title">Assigned Projects</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Projects you're part of
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
            <FaCheckCircle size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.activeProjects}</div>
            <div className="stat-title">Active Projects</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Currently working
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
          >
            <FaTasks size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.totalTasks}</div>
            <div className="stat-title">Total Tasks</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Assigned to you
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            <FaClipboardList size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">{dashboardStats.completedTasks}</div>
            <div className="stat-title">Completed Tasks</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Finished work
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-bar">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search projects by ID, client, or team lead..."
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

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="projectId">Sort by Project ID</option>
            <option value="clientName">Sort by Client</option>
            <option value="leadName">Sort by Team Lead</option>
            <option value="projectStatus">Sort by Status</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="sort-order-btn"
          >
            {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-section">
        <div className="section-header">
          <h2>
            <FaProjectDiagram /> Your Assigned Projects (
            {filteredProjects.length})
          </h2>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="no-projects">
            <FaInfoCircle size={48} />
            <h3>No Projects Found</h3>
            <p>
              You haven't been assigned to any projects yet, or no projects
              match your search criteria.
            </p>
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map((project) => (
              <div key={project._id} className="project-card">
                <div className="project-header">
                  <div className="project-title">
                    <h3>{project.projectId || "Untitled Project"}</h3>
                    <div className="project-badges">
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(
                            project.projectStatus || "unknown"
                          ),
                        }}
                      >
                        {project.projectStatus
                          ? project.projectStatus.replace("-", " ")
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                  <div className="project-actions">
                    <button
                      className="action-btn"
                      onClick={() => handleViewDetails(project)}
                      title="View Project Details & Tasks"
                    >
                      <FaEye />
                    </button>
                  </div>
                </div>

                <div className="project-details">
                  <div className="client-info">
                    <strong>Client:</strong>{" "}
                    {project.clientName || "Unknown Client"}
                  </div>

                  <div className="project-info">
                    <div className="info-item">
                      <strong>Team Lead:</strong>{" "}
                      {project.leadName || "Not Assigned"}
                    </div>
                    <div className="info-item">
                      <strong>Start Date:</strong>{" "}
                      {formatDate(project.startDate)}
                    </div>
                    <div className="info-item">
                      <strong>Due Date:</strong> {formatDate(project.dueDate)}
                    </div>
                  </div>

                  {/* Task Progress Summary */}
                  {project.taskSummary && (
                    <div className="task-summary">
                      <h6>Your Task Progress:</h6>
                      <div className="task-counts">
                        <span className="task-count pending">
                          {project.taskSummary.Pending.length} Pending
                        </span>
                        <span className="task-count in-progress">
                          {project.taskSummary["In Progress"].length} In
                          Progress
                        </span>
                        <span className="task-count completed">
                          {project.taskSummary.Completed.length} Completed
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Team Information */}
                  {project.assignedEmployees &&
                    project.assignedEmployees.length > 0 && (
                      <div className="team-info">
                        <strong>Team Size:</strong>{" "}
                        {project.assignedEmployees.length} members
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Details Modal */}
      {showProjectDetails && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content large-modal">
            <div className="modal-header">
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    fontSize: 22,
                    color: "#3b82f6",
                  }}
                >
                  <FaProjectDiagram style={{ marginRight: 8 }} />
                  {selectedProject.projectId || "Untitled Project"} - Your Tasks
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#6b7280",
                    fontSize: 14,
                  }}
                >
                  Client: {selectedProject.clientName} | Team Lead:{" "}
                  {selectedProject.leadName}
                </p>
                <div
                  className="employee-notice"
                  style={{
                    marginTop: 8,
                    padding: "8px 12px",
                    background: "#fef3c7",
                    borderRadius: 6,
                    fontSize: 12,
                    color: "#92400e",
                    border: "1px solid #fbbf24",
                  }}
                >
                  📝 <strong>Note:</strong> Only team leads can create new
                  tasks. You can view and update your assigned tasks here.
                </div>
              </div>
              <button className="modal-close" onClick={handleCloseDetails}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24 }}>
              {/* Task Statistics */}
              <div
                className="task-stats"
                style={{ display: "flex", gap: 16, marginBottom: 24 }}
              >
                <div
                  className="task-stat-card"
                  style={{
                    flex: 1,
                    background: "#fef3c7",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 24, fontWeight: 700, color: "#f59e0b" }}
                  >
                    {tasks.Pending.length}
                  </div>
                  <div
                    style={{ color: "#92400e", fontSize: 14, fontWeight: 500 }}
                  >
                    Pending Tasks
                  </div>
                </div>
                <div
                  className="task-stat-card"
                  style={{
                    flex: 1,
                    background: "#dbeafe",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 24, fontWeight: 700, color: "#3b82f6" }}
                  >
                    {tasks["In Progress"].length}
                  </div>
                  <div
                    style={{ color: "#1e40af", fontSize: 14, fontWeight: 500 }}
                  >
                    In Progress
                  </div>
                </div>
                <div
                  className="task-stat-card"
                  style={{
                    flex: 1,
                    background: "#d1fae5",
                    padding: 16,
                    borderRadius: 8,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{ fontSize: 24, fontWeight: 700, color: "#10b981" }}
                  >
                    {tasks.Completed.length}
                  </div>
                  <div
                    style={{ color: "#047857", fontSize: 14, fontWeight: 500 }}
                  >
                    Completed
                  </div>
                </div>
              </div>

              {/* Task Board */}
              <div
                className="task-board"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 20,
                }}
              >
                {/* Pending Tasks */}
                <div className="task-column">
                  <h4
                    style={{
                      color: "#f59e0b",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaClock /> Pending ({tasks.Pending.length})
                  </h4>
                  <div
                    className="task-list"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {tasks.Pending.map((task) => (
                      <div
                        key={task._id}
                        className="task-card"
                        style={{
                          background: "#fffbf0",
                          border: "1px solid #fed7aa",
                          borderRadius: 8,
                          padding: 12,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#92400e",
                            marginBottom: 8,
                          }}
                        >
                          {task.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginBottom: 8,
                          }}
                        >
                          {task.description}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#d97706",
                            marginBottom: 8,
                          }}
                        >
                          Due: {formatDate(task.dueDate)} | Priority:{" "}
                          {task.priority}
                        </div>

                        {/* Task Points */}
                        {task.taskPoints && task.taskPoints.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#92400e",
                                fontWeight: 600,
                                marginBottom: 4,
                              }}
                            >
                              TASK POINTS:
                            </div>
                            {task.taskPoints.map((point, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginBottom: 2,
                                  fontSize: 10,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={point.isCompleted}
                                  onChange={(e) =>
                                    updateTaskPoint(
                                      task._id,
                                      point._id,
                                      e.target.checked,
                                      currentUser.name
                                    )
                                  }
                                  style={{ cursor: "pointer" }}
                                />
                                <span
                                  style={{
                                    textDecoration: point.isCompleted
                                      ? "line-through"
                                      : "none",
                                    color: point.isCompleted
                                      ? "#6b7280"
                                      : "#1f2937",
                                  }}
                                >
                                  {point.pointTitle}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() =>
                            updateTaskStatus(task._id, "In Progress")
                          }
                          style={{
                            background: "#3b82f6",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: 10,
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          Start Working
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* In Progress Tasks */}
                <div className="task-column">
                  <h4
                    style={{
                      color: "#3b82f6",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaPlay /> In Progress ({tasks["In Progress"].length})
                  </h4>
                  <div
                    className="task-list"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {tasks["In Progress"].map((task) => (
                      <div
                        key={task._id}
                        className="task-card"
                        style={{
                          background: "#f0f7ff",
                          border: "1px solid #bfdbfe",
                          borderRadius: 8,
                          padding: 12,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#1e40af",
                            marginBottom: 8,
                          }}
                        >
                          {task.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginBottom: 8,
                          }}
                        >
                          {task.description}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#2563eb",
                            marginBottom: 8,
                          }}
                        >
                          Due: {formatDate(task.dueDate)} | Priority:{" "}
                          {task.priority}
                        </div>

                        {/* Progress Bar */}
                        {task.progressPercentage !== undefined && (
                          <div style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                width: "100%",
                                height: 6,
                                background: "#e5e7eb",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  background: "#3b82f6",
                                  width: `${task.progressPercentage || 0}%`,
                                  transition: "width 0.3s ease",
                                }}
                              ></div>
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#3b82f6",
                                fontWeight: 600,
                                marginTop: 2,
                              }}
                            >
                              {task.progressPercentage || 0}% Complete
                            </div>
                          </div>
                        )}

                        {/* Task Points */}
                        {task.taskPoints && task.taskPoints.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#1e40af",
                                fontWeight: 600,
                                marginBottom: 4,
                              }}
                            >
                              TASK POINTS:
                            </div>
                            {task.taskPoints.map((point, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginBottom: 2,
                                  fontSize: 10,
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={point.isCompleted}
                                  onChange={(e) =>
                                    updateTaskPoint(
                                      task._id,
                                      point._id,
                                      e.target.checked,
                                      currentUser.name
                                    )
                                  }
                                  style={{ cursor: "pointer" }}
                                />
                                <span
                                  style={{
                                    textDecoration: point.isCompleted
                                      ? "line-through"
                                      : "none",
                                    color: point.isCompleted
                                      ? "#6b7280"
                                      : "#1f2937",
                                  }}
                                >
                                  {point.pointTitle}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        <button
                          onClick={() =>
                            updateTaskStatus(task._id, "Completed")
                          }
                          style={{
                            background: "#10b981",
                            color: "white",
                            border: "none",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: 10,
                            cursor: "pointer",
                            width: "100%",
                          }}
                        >
                          Mark Complete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Completed Tasks */}
                <div className="task-column">
                  <h4
                    style={{
                      color: "#10b981",
                      marginBottom: 16,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FaCheckCircle /> Completed ({tasks.Completed.length})
                  </h4>
                  <div
                    className="task-list"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {tasks.Completed.map((task) => (
                      <div
                        key={task._id}
                        className="task-card"
                        style={{
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                          borderRadius: 8,
                          padding: 12,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 14,
                            color: "#047857",
                            marginBottom: 8,
                          }}
                        >
                          {task.title}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: "#6b7280",
                            marginBottom: 8,
                          }}
                        >
                          {task.description}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#059669",
                            marginBottom: 8,
                          }}
                        >
                          Completed: {formatDate(task.completedAt)}
                        </div>

                        {/* Completion Status */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            marginBottom: 8,
                            padding: "4px 8px",
                            background: "#dcfce7",
                            borderRadius: 4,
                          }}
                        >
                          <FaCheckCircle
                            style={{ color: "#16a34a", fontSize: 12 }}
                          />
                          <span
                            style={{
                              fontSize: 11,
                              color: "#047857",
                              fontWeight: 600,
                            }}
                          >
                            Task Completed Successfully
                          </span>
                        </div>

                        {/* Task Points Status */}
                        {task.taskPoints && task.taskPoints.length > 0 && (
                          <div style={{ marginBottom: 8 }}>
                            <div
                              style={{
                                fontSize: 11,
                                color: "#047857",
                                fontWeight: 600,
                                marginBottom: 4,
                              }}
                            >
                              COMPLETED POINTS:
                            </div>
                            {task.taskPoints.map((point, idx) => (
                              <div
                                key={idx}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  marginBottom: 2,
                                  fontSize: 10,
                                }}
                              >
                                <FaCheckCircle
                                  style={{ color: "#16a34a", fontSize: 8 }}
                                />
                                <span style={{ color: "#047857" }}>
                                  {point.pointTitle}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
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

export default EmployeeDashboard;
