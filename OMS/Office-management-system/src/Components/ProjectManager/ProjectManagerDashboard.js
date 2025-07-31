import React, { useState, useEffect } from "react";
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
  FaMapMarkerAlt,
  FaLock,
} from "react-icons/fa";
import "./ProjectManagerDashboard.css";

const ProjectManagerDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [teamLeads, setTeamLeads] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTeamLead, setSelectedTeamLead] = useState("");
  const [selectedSubRole, setSelectedSubRole] = useState("");
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
  });
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        // First, import/sync remote projects to local database
        const token = localStorage.getItem("token");
        try {
          await fetch(
            "http://localhost:5000/api/client-projects/import-remote",
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

        // Now fetch from local database
        const response = await fetch(
          "http://localhost:5000/api/client-projects",
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

        const data = await response.json();
        console.log("Fetched projects from local DB:", data);

        // Process the data - assuming the API returns an object with data array
        const projectsData = Array.isArray(data)
          ? data
          : data.data || data.projects || [];

        setProjects(projectsData);
        setFilteredProjects(projectsData);

        // Calculate dashboard statistics
        const stats = calculateDashboardStats(projectsData);
        setDashboardStats(stats);
      } catch (error) {
        console.error("Error fetching projects:", error);
        // Show a user-friendly error message
        alert("Failed to fetch projects from server. Showing mock data.");
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
        const token = localStorage.getItem("token"); // or sessionStorage.getItem('token')
        const response = await fetch(
          "http://localhost:5000/api/client-projects/team-leads",
          {
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        const teamLeadsData = Array.isArray(data.data) ? data.data : [];
        setTeamLeads(teamLeadsData);
      } catch (error) {
        console.error("Error fetching team leads:", error);
        setTeamLeads([]);
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
        name: "E-commerce Platform Development",
        client: "TechCorp Solutions",
        status: "active",
        priority: "high",
        startDate: "2024-01-15",
        endDate: "2024-06-15",
        progress: 65,
        budget: 150000,
        spent: 97500,
        teamMembers: 8,
        description:
          "Complete e-commerce platform with payment gateway integration",
        technologies: ["React", "Node.js", "MongoDB", "Stripe"],
        projectManager: "John Smith",
        assignedTeamLead: "Sarah Wilson",
        teamLeadId: 2,
        clientContact: {
          name: "Michael Johnson",
          email: "michael@techcorp.com",
          phone: "+1-555-0123",
        },
        milestones: [
          { name: "UI/UX Design", status: "completed", dueDate: "2024-02-15" },
          {
            name: "Backend Development",
            status: "in-progress",
            dueDate: "2024-04-01",
          },
          {
            name: "Payment Integration",
            status: "pending",
            dueDate: "2024-05-15",
          },
          {
            name: "Testing & Deployment",
            status: "pending",
            dueDate: "2024-06-10",
          },
        ],
        risks: [
          {
            level: "medium",
            description: "Third-party API integration delays",
          },
          {
            level: "low",
            description: "Resource availability during holidays",
          },
        ],
        tasks: {
          total: 45,
          completed: 29,
          inProgress: 12,
          pending: 4,
        },
      },
      {
        id: 2,
        name: "Mobile Banking App",
        client: "SecureBank Ltd",
        status: "active",
        priority: "high",
        startDate: "2024-02-01",
        endDate: "2024-07-30",
        progress: 40,
        budget: 200000,
        spent: 80000,
        teamMembers: 10,
        description:
          "Secure mobile banking application with biometric authentication",
        technologies: ["React Native", "Node.js", "PostgreSQL", "AWS"],
        projectManager: "Sarah Johnson",
        assignedTeamLead: null,
        teamLeadId: null,
        clientContact: {
          name: "David Chen",
          email: "david@securebank.com",
          phone: "+1-555-0456",
        },
        milestones: [
          {
            name: "Security Architecture",
            status: "completed",
            dueDate: "2024-02-20",
          },
          {
            name: "Core Features Development",
            status: "in-progress",
            dueDate: "2024-05-01",
          },
          {
            name: "Biometric Integration",
            status: "pending",
            dueDate: "2024-06-15",
          },
          {
            name: "Security Testing",
            status: "pending",
            dueDate: "2024-07-20",
          },
        ],
        risks: [
          { level: "high", description: "Regulatory compliance requirements" },
          { level: "medium", description: "Complex security implementations" },
        ],
        tasks: {
          total: 60,
          completed: 24,
          inProgress: 18,
          pending: 18,
        },
      },
      {
        id: 3,
        name: "Inventory Management System",
        client: "LogiCorp Industries",
        status: "completed",
        priority: "medium",
        startDate: "2024-01-01",
        endDate: "2024-04-30",
        progress: 100,
        budget: 80000,
        spent: 75000,
        teamMembers: 5,
        description: "Comprehensive inventory tracking and management system",
        technologies: ["Vue.js", "Laravel", "MySQL", "Docker"],
        projectManager: "Mike Chen",
        assignedTeamLead: "Alex Rodriguez",
        teamLeadId: 1,
        clientContact: {
          name: "Lisa Davis",
          email: "lisa@logicorp.com",
          phone: "+1-555-0789",
        },
        milestones: [
          { name: "System Design", status: "completed", dueDate: "2024-01-15" },
          {
            name: "Development Phase",
            status: "completed",
            dueDate: "2024-03-15",
          },
          { name: "Testing & QA", status: "completed", dueDate: "2024-04-15" },
          { name: "Deployment", status: "completed", dueDate: "2024-04-30" },
        ],
        risks: [],
        tasks: {
          total: 35,
          completed: 35,
          inProgress: 0,
          pending: 0,
        },
      },
      {
        id: 4,
        name: "CRM Dashboard",
        client: "SalesForce Pro",
        status: "on-hold",
        priority: "low",
        startDate: "2024-03-01",
        endDate: "2024-08-15",
        progress: 25,
        budget: 120000,
        spent: 30000,
        teamMembers: 6,
        description:
          "Customer relationship management dashboard with analytics",
        technologies: ["Angular", "Express.js", "MongoDB", "Chart.js"],
        projectManager: "Lisa Davis",
        assignedTeamLead: "Emily Johnson",
        teamLeadId: 3,
        clientContact: {
          name: "Robert Smith",
          email: "robert@salesforcepro.com",
          phone: "+1-555-0321",
        },
        milestones: [
          {
            name: "Requirements Analysis",
            status: "completed",
            dueDate: "2024-03-15",
          },
          { name: "UI Design", status: "in-progress", dueDate: "2024-05-01" },
          { name: "Development", status: "pending", dueDate: "2024-07-01" },
          { name: "Integration", status: "pending", dueDate: "2024-08-10" },
        ],
        risks: [
          { level: "high", description: "Client budget constraints" },
          { level: "medium", description: "Changing requirements" },
        ],
        tasks: {
          total: 40,
          completed: 10,
          inProgress: 5,
          pending: 25,
        },
      },
      {
        id: 5,
        name: "Healthcare Portal",
        client: "MediCare Systems",
        status: "overdue",
        priority: "high",
        startDate: "2023-12-01",
        endDate: "2024-05-31",
        progress: 80,
        budget: 180000,
        spent: 160000,
        teamMembers: 12,
        description: "Patient management and telemedicine platform",
        technologies: ["React", "Python", "PostgreSQL", "WebRTC"],
        projectManager: "David Brown",
        assignedTeamLead: "Maria Garcia",
        teamLeadId: 4,
        clientContact: {
          name: "Dr. Jennifer Wilson",
          email: "jennifer@medicare.com",
          phone: "+1-555-0654",
        },
        milestones: [
          { name: "Core Platform", status: "completed", dueDate: "2024-02-01" },
          {
            name: "Patient Portal",
            status: "completed",
            dueDate: "2024-04-01",
          },
          {
            name: "Telemedicine Features",
            status: "in-progress",
            dueDate: "2024-05-15",
          },
          {
            name: "Security Compliance",
            status: "pending",
            dueDate: "2024-06-15",
          },
        ],
        risks: [
          { level: "high", description: "HIPAA compliance requirements" },
          { level: "high", description: "Project timeline overrun" },
        ],
        tasks: {
          total: 55,
          completed: 44,
          inProgress: 8,
          pending: 3,
        },
      },
    ];
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
    const overdueProjects = projectsData.filter(
      (p) => p.projectStatus === "Overdue"
    ).length;
    const totalAmount = projectsData.reduce(
      (sum, p) => sum + (p.finalAmount || 0),
      0
    );

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      totalAmount,
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
          (project.leadName || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (project.projectId || "")
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
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === "budget" || sortBy === "spent" || sortBy === "progress") {
        aValue = parseFloat(aValue);
        bValue = parseFloat(bValue);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProjects(filtered);
  }, [projects, searchTerm, filterStatus, sortBy, sortOrder]);

  const getStatusColor = (status) => {
    const colors = {
      active: "#10b981",
      completed: "#3b82f6",
      "on-hold": "#f59e0b",
      overdue: "#ef4444",
      planning: "#8b5cf6",
    };
    return colors[status] || "#6b7280";
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981",
    };
    return colors[priority] || "#6b7280";
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

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

  const isOverdue = (endDate, status) => {
    if (!endDate || !status) return false;
    return status !== "completed" && new Date(endDate) < new Date();
  };

  // Handle team lead assignment
  const handleAssignTeam = (project) => {
    setSelectedProject(project);
    setSelectedTeamLead(project.teamLeadId || "");

    // Initialize with existing assigned employees from the project
    const existingEmployees = project.assignedEmployees || [];
    console.log(
      "Loading assigned employees for project:",
      project.projectId,
      existingEmployees
    );
    setAssignedEmployees(existingEmployees);

    setShowAssignModal(true);
  };

  //   const handleSaveAssignment = async () => {
  //   if (!selectedTeamLead || !selectedProject) return;

  //   console.log('Assigning team lead to project:', selectedProject);

  //   try {
  //     // Find the selected team lead details
  //     const assignedLead = teamLeads.find(
  //       lead => lead._id === selectedTeamLead || lead.id === selectedTeamLead || lead.id === parseInt(selectedTeamLead)
  //     );

  //     // Get JWT token from localStorage (or sessionStorage)
  //     const token = localStorage.getItem('token'); // or sessionStorage.getItem('token')

  //     // Make API call to assign the team lead using the correct endpoint
  //     const response = await fetch(`http://localhost:5000/api/client-projects/${selectedProject._id}/assign-team-lead`, {
  //       method: 'PUT',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({
  //         teamLeadId: assignedLead?._id || assignedLead?.id || selectedTeamLead,
  //         teamLeadName: assignedLead?.name || ''
  //       })
  //     });

  //     if (response.ok) {
  //       // Update local state with the assignment
  //       const updatedProjects = projects.map(project => {
  //         if (project._id === selectedProject._id) {
  //           return {
  //             ...project,
  //             teamLeadId: assignedLead?._id || assignedLead?.id || selectedTeamLead,
  //             assignedTeamLead: assignedLead?.name || '',
  //             leadName: assignedLead?.name || ''
  //           };
  //         }
  //         return project;
  //       });

  //       setProjects(updatedProjects);
  //       setFilteredProjects(updatedProjects);
  //       setShowAssignModal(false);
  //       setSelectedProject(null);
  //       setSelectedTeamLead('');
  //       alert(`Successfully assigned ${assignedLead?.name} as team lead for project ${selectedProject.projectId}`);
  //     } else {
  //       throw new Error('Failed to save assignment');
  //     }
  //   } catch (error) {
  //     console.error('Error saving team lead assignment:', error);
  //     alert('Failed to assign team lead. Please try again.');
  //   }
  // };

  const handleSaveAssignment = async () => {
    if (!selectedTeamLead || !selectedProject) return;

    try {
      const assignedLead = teamLeads.find(
        (lead) =>
          lead._id === selectedTeamLead ||
          lead.id === selectedTeamLead ||
          lead.id === parseInt(selectedTeamLead)
      );
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/client-projects/${selectedProject._id}/assign-team-lead`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            teamLeadId:
              assignedLead?._id || assignedLead?.id || selectedTeamLead,
            teamLeadName: assignedLead?.name || "",
          }),
        }
      );

      if (response.ok) {
        // Fetch updated projects from backend to ensure persistence
        const updatedProjectsRes = await fetch(
          "http://localhost:5000/api/client-projects",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const updatedData = await updatedProjectsRes.json();
        const projectsData = Array.isArray(updatedData)
          ? updatedData
          : updatedData.data || updatedData.projects || [];
        setProjects(projectsData);
        setFilteredProjects(projectsData);

        setShowAssignModal(false);
        setSelectedProject(null);
        setSelectedTeamLead("");
        alert(
          `Successfully assigned ${assignedLead?.name} as team lead for project ${selectedProject.projectId}`
        );
      } else {
        throw new Error("Failed to save assignment");
      }
    } catch (error) {
      console.error("Error saving team lead assignment:", error);
      alert("Failed to assign team lead. Please try again.");
    }
  };
  const handleCloseModal = () => {
    setShowAssignModal(false);
    setSelectedProject(null);
    setSelectedTeamLead("");
  };

  // Handle project details view
  const handleViewDetails = (project) => {
    console.log("Project data for details view:", project);
    console.log("Team Lead History:", project.teamLeadHistory);
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
      completed: "#10b981",
      "in-progress": "#3b82f6",
      pending: "#6b7280",
    };
    return colors[status] || "#6b7280";
  };

  // Get risk level color
  const getRiskLevelColor = (level) => {
    const colors = {
      high: "#ef4444",
      medium: "#f59e0b",
      low: "#10b981",
    };
    return colors[level] || "#6b7280";
  };

  // Fetch employees by sub-role
  const fetchEmployeesBySubRole = async (subRole) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/client-projects/employees/sub-role/${subRole}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      setEmployees([]);
    }
  };

  const handleAssignEmployee = async () => {
    if (!selectedEmployee || !selectedProject) return;
    const token = localStorage.getItem("token");
    await fetch(
      `http://localhost:5000/api/client-projects/${selectedProject._id}/assign-employee`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          employeeId: selectedEmployee,
        }),
      }
    );
    // Refresh projects after assignment
  };

  // const handleAddEmployee = () => {
  //   if (!selectedEmployee) return;
  //   const emp = employees.find(e => e._id === selectedEmployee);
  //   if (!emp) return;
  //   setAssignedEmployees(prev => [
  //     ...prev,
  //     {
  //       employeeId: emp._id,
  //       name: emp.name,
  //       role: emp.role,
  //       subRole: emp.subRole
  //     }
  //   ]);
  //   setSelectedEmployee('');
  // };

  const handleAddEmployee = () => {
    if (!selectedEmployee) return;
    const emp = employees.find((e) => e._id === selectedEmployee);
    if (!emp) return;
    // Prevent duplicates
    if (assignedEmployees.some((e) => e.employeeId === emp._id)) {
      alert("Employee is already assigned to this project");
      return;
    }
    setAssignedEmployees((prev) => [
      ...prev,
      {
        employeeId: emp._id,
        name: emp.name,
        email: emp.email,
        role: emp.role,
        subRole: emp.subRole,
      },
    ]);
    setSelectedEmployee(""); // This clears the select, but the name stays in the assigned list
  };

  const handleRemoveEmployee = (employeeId) => {
    setAssignedEmployees((prev) =>
      prev.filter((e) => e.employeeId !== employeeId)
    );
  };

  const handleSaveEmployees = async () => {
    if (!selectedProject) return;
    const token = localStorage.getItem("token");
    await fetch(
      `http://localhost:5000/api/client-projects/${selectedProject._id}/assign-employees`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employees: assignedEmployees }),
      }
    );
    // Optionally refresh projects here
  };

  const handleSaveTeam = async () => {
    if (!selectedTeamLead || !selectedProject) return;
    const assignedLead = teamLeads.find(
      (lead) =>
        lead._id === selectedTeamLead ||
        lead.id === selectedTeamLead ||
        lead.id === parseInt(selectedTeamLead)
    );
    const token = localStorage.getItem("token");

    // Save team lead
    await fetch(
      `http://localhost:5000/api/client-projects/${selectedProject._id}/assign-team-lead`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teamLeadId: assignedLead?._id || assignedLead?.id || selectedTeamLead,
          teamLeadName: assignedLead?.name || "",
        }),
      }
    );

    // Save employees
    await fetch(
      `http://localhost:5000/api/client-projects/${selectedProject._id}/assign-employees`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ employees: assignedEmployees }),
      }
    );

    // Refresh projects
    const updatedProjectsRes = await fetch(
      "http://localhost:5000/api/client-projects",
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const updatedData = await updatedProjectsRes.json();
    const projectsData = Array.isArray(updatedData)
      ? updatedData
      : updatedData.data || updatedData.projects || [];
    setProjects(projectsData);
    setFilteredProjects(projectsData);

    setShowAssignModal(false);
    setSelectedProject(null);
    setSelectedTeamLead("");
    setAssignedEmployees([]);
    alert(
      `Successfully assigned team for project ${selectedProject.projectId}`
    );
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
              <h3>Loading Project Manager Dashboard</h3>
              <p>Please wait while we prepare your project management workspace...</p>
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

  return (
    <div className="project-manager-dashboard">
      <div className="dashboard-header">
        <h1>Project Manager Dashboard</h1>
        <p>Comprehensive project management and tracking system</p>
      </div>

      {/* Dashboard Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
          >
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
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
          >
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
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #7c3aed)" }}
          >
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
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
          >
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

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
          >
            <FaChartLine size={32} />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              ₹
              {dashboardStats.totalAmount
                ? dashboardStats.totalAmount.toLocaleString()
                : "0"}
            </div>
            <div className="stat-title">Total Amount</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Project value
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
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            className="sort-button"
          >
            {sortOrder === "asc" ? <FaArrowUp /> : <FaArrowDown />}
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="projects-section">
        <div className="section-header">
          <h2>
            <FaProjectDiagram /> Projects Overview ({filteredProjects.length})
          </h2>
        </div>

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
                    <span className="amount-badge">
                      ₹
                      {project.finalAmount
                        ? project.finalAmount.toLocaleString()
                        : "0"}
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
                  <button
                    className="action-btn"
                    onClick={() => handleAssignTeam(project)}
                    title="Assign Team"
                  >
                    <FaUserTie />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleAssignTeam(project)}
                    title="Edit Team Members"
                  >
                    <FaEdit />
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
                    <strong>Project ID:</strong> {project.projectId || "N/A"}
                  </div>
                  <div className="info-item">
                    <strong>Lead Name:</strong>{" "}
                    {project.leadName || "Not Assigned"}
                  </div>
                  <div className="info-item">
                    <strong>Final Amount:</strong> ₹
                    {project.finalAmount
                      ? project.finalAmount.toLocaleString()
                      : "0"}
                  </div>
                </div>

                <div className="assignment-info">
                  <div className="assignment-item">
                    <strong>Project Status:</strong>
                    <span
                      className={`status-indicator ${
                        project.projectStatus
                          ? project.projectStatus.toLowerCase()
                          : "unknown"
                      }`}
                    >
                      {project.projectStatus || "Unknown"}
                    </span>
                  </div>
                  <div className="assignment-item">
                    <strong>Original Lead:</strong>
                    <span className="original-lead">
                      {project.leadName || "Not Specified"}
                    </span>
                  </div>
                  <div className="assignment-item">
                    <strong>Assigned Team:</strong>
                    <span
                      className={`team-lead-status ${
                        project.assignedTeamLead ? "assigned" : "unassigned"
                      }`}
                    >
                      {project.assignedTeamLead || "Not Assigned"}
                    </span>
                    {!project.assignedTeam && (
                      <button
                        className="assign-quick-btn"
                        onClick={() => handleAssignTeam(project)}
                      >
                        Assign Team
                      </button>
                    )}
                    {project.assignedTeam && (
                      <button
                        className="edit-assign-btn"
                        onClick={() => handleAssignTeam(project)}
                      >
                        Edit
                      </button>
                    )}
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
                  <div className="meta-item">
                    <FaLock />
                    <span>
                      Password: {project.projectPassword || "Not Set"}
                    </span>
                  </div>
                </div>

                <div className="project-status-info">
                  <div className="status-header">
                    <span>Project Status</span>
                    <span
                      className={`status-indicator ${
                        project.projectStatus
                          ? project.projectStatus.toLowerCase()
                          : "unknown"
                      }`}
                    >
                      {project.projectStatus || "Unknown"}
                    </span>
                  </div>
                  <div className="amount-display">
                    <strong>
                      Final Amount: ₹
                      {project.finalAmount
                        ? project.finalAmount.toLocaleString()
                        : "0"}
                    </strong>
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
                    <span
                      className={
                        (project.budget || 0) - (project.spent || 0) <
                        (project.budget || 0) * 0.1
                          ? "warning"
                          : ""
                      }
                    >
                      {formatCurrency(
                        (project.budget || 0) - (project.spent || 0)
                      )}
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
                        <span key={index} className="tech-tag">
                          {tech}
                        </span>
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
            <p>
              Try adjusting your search criteria or check if projects are
              available in the system.
            </p>
          </div>
        )}
      </div>

      {/* Team Lead Assignment Modal */}
      {showAssignModal && selectedProject && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ backgroundColor: "white" }}>
            <div className="modal-header">
              <h3>
                {selectedProject.assignedTeamLead
                  ? "Edit Team Assignment"
                  : "Assign Team"}
              </h3>
              <button className="modal-close" onClick={handleCloseModal}>
                <FaTimes />
              </button>
            </div>
            <div className="modal-body">
              <div className="project-info">
                <h4>{selectedProject.projectId}</h4>
                <p>Client: {selectedProject.clientName}</p>
                <p>Lead: {selectedProject.leadName}</p>
                <p>
                  Amount: ₹
                  {selectedProject.finalAmount
                    ? selectedProject.finalAmount.toLocaleString()
                    : "0"}
                </p>
                <p>Status: {selectedProject.projectStatus}</p>
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
                  {teamLeads.map((lead) => (
                    <option
                      key={lead._id || lead.id}
                      value={lead._id || lead.id}
                    >
                      {lead.name} - {lead.specialization} ({lead.availability})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="subRole">Select Sub-Role:</label>
                <select
                  id="subRole"
                  value={selectedSubRole}
                  onChange={(e) => {
                    setSelectedSubRole(e.target.value);
                    fetchEmployeesBySubRole(e.target.value);
                    setSelectedEmployee("");
                  }}
                  className="sub-role-select"
                >
                  <option value="">Select sub-role...</option>
                  <option value="Developer">Developer</option>
                  <option value="Designer">Designer</option>
                  <option value="QA">QA</option>
                  {/* Add more sub-roles as needed */}
                </select>
              </div>
              {selectedSubRole && (
                <div className="form-group">
                  <label htmlFor="employee">Select Employee:</label>
                  <select
                    id="employee"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="employee-select"
                  >
                    <option value="">Select employee...</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name} - {emp.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddEmployee}
                    style={{ marginLeft: 8 }}
                  >
                    Add Employee
                  </button>
                </div>
              )}

              {/* Show currently assigned employees */}
              {assignedEmployees.length > 0 && (
                <div className="form-group">
                  <label>Currently Assigned Employees:</label>
                  <div className="assigned-employees-list">
                    {assignedEmployees.map((emp) => (
                      <div
                        key={emp.employeeId}
                        className="assigned-employee-item"
                      >
                        <span>
                          {emp.name} ({emp.role} - {emp.subRole})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmployee(emp.employeeId)}
                          style={{
                            marginLeft: 8,
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            cursor: "pointer",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Show currently assigned employees */}
            {assignedEmployees.length > 0 && (
              <div className="form-group">
                <label>Currently Assigned Employees:</label>
                <div className="assigned-employees-list">
                  {assignedEmployees.map((emp) => (
                    <div
                      key={emp.employeeId}
                      className="assigned-employee-item"
                    >
                      <span>
                        {emp.name} ({emp.role} - {emp.subRole})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(emp.employeeId)}
                        style={{
                          marginLeft: 8,
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          cursor: "pointer",
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCloseModal}>
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveTeam}
                disabled={!selectedTeamLead}
              >
                <FaSave />{" "}
                {selectedProject?.assignedTeamLead
                  ? "Update Team"
                  : "Assign Team"}
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
                  <h4>{selectedProject.projectId || "Untitled Project"}</h4>
                  <div className="project-badges">
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(
                          selectedProject.projectStatus || "unknown"
                        ),
                      }}
                    >
                      {selectedProject.projectStatus
                        ? selectedProject.projectStatus.replace("-", " ")
                        : "Unknown"}
                    </span>
                    <span className="amount-badge">
                      ₹
                      {selectedProject.finalAmount
                        ? selectedProject.finalAmount.toLocaleString()
                        : "0"}
                    </span>
                  </div>
                </div>
                <p className="project-description">
                  Client: {selectedProject.clientName || "Unknown Client"}
                </p>
              </div>

              <div className="details-grid">
                <div className="detail-section">
                  <h5>
                    <FaInfoCircle /> Basic Information
                  </h5>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span>Project ID:</span>
                      <span>{selectedProject.projectId || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <span>Client Name:</span>
                      <span>
                        {selectedProject.clientName || "Unknown Client"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span>Original Lead:</span>
                      <span>{selectedProject.leadName || "Not Specified"}</span>
                    </div>
                    <div className="detail-item">
                      <span>Assigned Team Lead:</span>
                      <span>
                        {selectedProject.assignedTeamLead || "Not Assigned"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span>Final Amount:</span>
                      <span>
                        ₹
                        {selectedProject.finalAmount
                          ? selectedProject.finalAmount.toLocaleString()
                          : "0"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span>Project Status:</span>
                      <span>{selectedProject.projectStatus || "Unknown"}</span>
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
                      <span>
                        {selectedProject.projectPassword || "Not Set"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>
                    <FaEnvelope /> Project Information
                  </h5>
                  <div className="detail-items">
                    <div className="detail-item">
                      <span>Client Name:</span>
                      <span>
                        {selectedProject.clientName || "Unknown Client"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span>Lead Name:</span>
                      <span>
                        {selectedProject.clientName || "Not Assigned"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span>Project ID:</span>
                      <span>{selectedProject.projectId || "N/A"}</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>
                    <FaChartLine /> Budget & Progress
                  </h5>
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
                      <span>
                        {formatCurrency(
                          (selectedProject.budget || 0) -
                            (selectedProject.spent || 0)
                        )}
                      </span>
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
                          backgroundColor: getStatusColor(
                            selectedProject.status || "unknown"
                          ),
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {selectedProject.milestones && (
                  <div className="detail-section">
                    <h5>
                      <FaMapMarkerAlt /> Milestones
                    </h5>
                    <div className="milestones-list">
                      {selectedProject.milestones.map((milestone, index) => (
                        <div key={index} className="milestone-item">
                          <div className="milestone-header">
                            <span className="milestone-name">
                              {milestone.name}
                            </span>
                            <span
                              className="milestone-status"
                              style={{
                                color: getMilestoneStatusColor(
                                  milestone.status || "pending"
                                ),
                              }}
                            >
                              {milestone.status
                                ? milestone.status.replace("-", " ")
                                : "pending"}
                            </span>
                          </div>
                          <div className="milestone-date">
                            Due: {formatDate(milestone.dueDate)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedProject.risks && selectedProject.risks.length > 0 && (
                  <div className="detail-section">
                    <h5>
                      <FaExclamationTriangle /> Risk Assessment
                    </h5>
                    <div className="risks-list">
                      {selectedProject.risks.map((risk, index) => (
                        <div key={index} className="risk-item">
                          <span
                            className="risk-level"
                            style={{ color: getRiskLevelColor(risk.level) }}
                          >
                            <FaFlag /> {risk.level.toUpperCase()}
                          </span>
                          <span className="risk-description">
                            {risk.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-section">
                  <h5>
                    <FaTasks /> Task Summary
                  </h5>
                  <div className="tasks-overview">
                    <div className="task-stat completed">
                      <span className="task-count">
                        {selectedProject.tasks.completed}
                      </span>
                      <span className="task-label">Completed</span>
                    </div>
                    <div className="task-stat in-progress">
                      <span className="task-count">
                        {selectedProject.tasks.inProgress}
                      </span>
                      <span className="task-label">In Progress</span>
                    </div>
                    <div className="task-stat pending">
                      <span className="task-count">
                        {selectedProject.tasks.pending}
                      </span>
                      <span className="task-label">Pending</span>
                    </div>
                  </div>
                </div>

                <div className="detail-section">
                  <h5>Technologies</h5>
                  <div className="tech-tags">
                    {selectedProject.technologies &&
                      selectedProject.technologies.map((tech, index) => (
                        <span key={index} className="tech-tag">
                          {tech}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Debug section - remove in production */}
                <div
                  className="detail-section"
                  style={{
                    background: "#fff3cd",
                    padding: "10px",
                    border: "1px solid #ffeaa7",
                  }}
                >
                  <h5>Debug Info</h5>
                  <pre
                    style={{
                      fontSize: "12px",
                      overflow: "auto",
                      maxHeight: "200px",
                    }}
                  >
                    {JSON.stringify(
                      {
                        projectId: selectedProject.projectId,
                        assignedTeamLead: selectedProject.assignedTeamLead,
                        teamLeadHistory: selectedProject.teamLeadHistory,
                        teamLeadHistoryLength:
                          selectedProject.teamLeadHistory?.length,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>

                {/* Always show Team Lead History section, even if empty */}
                <div className="detail-section">
                  <h5>Team Lead History</h5>
                  {selectedProject.teamLeadHistory &&
                  selectedProject.teamLeadHistory.length > 0 ? (
                    <table className="team-lead-history-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Assigned Date</th>
                          <th>Unassigned Date</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedProject.teamLeadHistory.map((history, idx) => (
                          <tr key={idx}>
                            <td>{history.teamLeadName || "Unknown"}</td>
                            <td>{history.assignedDate || "N/A"}</td>
                            <td>
                              {history.unassignedDate || "Currently Assigned"}
                            </td>
                            <td>
                              <span
                                className={`status-indicator ${
                                  history.unassignedDate
                                    ? "unassigned"
                                    : "active"
                                }`}
                              >
                                {history.unassignedDate
                                  ? "Unassigned"
                                  : "Active"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="no-history">
                      <p>
                        No team lead assignment history available for this
                        project.
                      </p>
                      {selectedProject.assignedTeamLead && (
                        <p>
                          Current team lead:{" "}
                          <strong>{selectedProject.assignedTeamLead}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {selectedProject.assignedEmployees &&
                  selectedProject.assignedEmployees.length > 0 && (
                    <div className="detail-section">
                      <h5>Assigned Employees</h5>
                      <ul>
                        {selectedProject.assignedEmployees.map((emp) => (
                          <li key={emp.employeeId}>
                            {emp.name} ({emp.role} - {emp.subRole})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagerDashboard;
