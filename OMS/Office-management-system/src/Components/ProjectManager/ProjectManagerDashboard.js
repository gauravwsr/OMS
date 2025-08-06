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

  // Task Management States
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [tasks, setTasks] = useState({
    Pending: [],
    "In Progress": [],
    Completed: [],
  });
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    assignedTo: [],
    dueDate: "",
    priority: "Medium",
    taskPoints: [],
  });
  const [newTaskPoint, setNewTaskPoint] = useState({
    pointTitle: "",
    description: "",
  });
  const [addingTask, setAddingTask] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState([]);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);

  // Fetch projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);

        // First, import/sync remote projects to local database
        const token = localStorage.getItem("token");
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

        // Now fetch from local database
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
          "http://localhost:5001/api/client-projects/team-leads",
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
    console.log("handleAssignTeam called with project:", project);

    if (!project) {
      console.error("No project provided to handleAssignTeam");
      alert("Error: No project selected. Please try again.");
      return;
    }

    // Validate project has required properties
    if (!project._id && !project.id) {
      console.error("Project missing ID:", project);
      alert("Error: Invalid project data. Please refresh and try again.");
      return;
    }

    setSelectedProject(project);
    // Use assignedTeamLead instead of teamLeadId, and provide fallback
    setSelectedTeamLead(project.assignedTeamLead || project.teamLeadId || "");

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
  //     const response = await fetch(`http://localhost:5001/api/client-projects/${selectedProject._id}/assign-team-lead`, {
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
        `http://localhost:5001/api/client-projects/${selectedProject._id}/assign-team-lead`,
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
          "http://localhost:5001/api/client-projects",
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
        `http://localhost:5001/api/client-projects/employees/sub-role/${subRole}`,
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
      `http://localhost:5001/api/client-projects/${selectedProject._id}/assign-employee`,
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
      `http://localhost:5001/api/client-projects/${selectedProject._id}/assign-employees`,
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
      `http://localhost:5001/api/client-projects/${selectedProject._id}/assign-team-lead`,
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
      `http://localhost:5001/api/client-projects/${selectedProject._id}/assign-employees`,
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
      "http://localhost:5001/api/client-projects",
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

  // Task Management Functions

  // Enhanced Fetch tasks for selected project
  const fetchProjectTasks = async (projectId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/team-lead/projects/${projectId}/tasks`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();

      if (result.success) {
        // Group tasks by status
        const groupedTasks = {
          Pending: result.data.filter((task) => task.status === "Pending"),
          "In Progress": result.data.filter(
            (task) => task.status === "In Progress"
          ),
          Completed: result.data.filter((task) => task.status === "Completed"),
        };
        setTasks(groupedTasks);

        // Update project progress based on task completion
        await updateProjectProgress(projectId, groupedTasks);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  // Enhanced Create new task
  const createTaskEnhanced = async () => {
    console.log("Creating task...");
    if (!selectedProject || !newTask.title) {
      console.log("Missing selectedProject or task title");
      return;
    }

    console.log("Selected project:", selectedProject);
    console.log("New task data:", newTask);

    setAddingTask(true);
    try {
      const token = localStorage.getItem("token");

      // Prepare task data with proper assignment structure
      const taskData = {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority || "Medium",
        dueDate: newTask.dueDate,
        taskPoints: newTask.taskPoints || [],
        assignedTo: Array.isArray(newTask.assignedTo) ? newTask.assignedTo : [],
      };

      console.log("Sending task data:", taskData);

      const response = await fetch(
        `http://localhost:5001/api/team-lead/projects/${selectedProject._id}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(taskData),
        }
      );

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("Response data:", result);

      if (result.success) {
        // Reset form
        setNewTask({
          title: "",
          description: "",
          assignedTo: [],
          dueDate: "",
          priority: "Medium",
          taskPoints: [],
        });
        setShowTaskModal(false);
        // Refresh tasks and recalculate progress
        await fetchProjectTasks(selectedProject._id);
        // Refresh projects to update overall dashboard
        await fetchAssignedProjects();
        alert("Task created successfully!");
      } else {
        console.error("Task creation failed:", result.error);
        alert(`Failed to create task: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Failed to create task");
    } finally {
      setAddingTask(false);
    }
  };

  // Update task assignment
  const updateTaskAssignment = async (taskId, assignedTo) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/team-lead/tasks/${taskId}/assignment`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ assignedTo }),
        }
      );

      const result = await response.json();
      if (result.success) {
        fetchProjectTasks(selectedProject._id);
        fetchAssignedProjects();
      }
    } catch (error) {
      console.error("Error updating task assignment:", error);
    }
  };

  // Enhanced Update task status
  const updateTaskStatusEnhanced = async (taskId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/team-lead/tasks/${taskId}/status`,
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

  // Enhanced Delete task (only for managers and team leads)
  const deleteTaskEnhanced = async (taskId) => {
    // Check if user has permission to delete tasks
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (
      !user ||
      (user.role !== "Manager" &&
        user.subRole !== "Team Lead" &&
        user.role !== "Admin")
    ) {
      alert("You don't have permission to delete tasks.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this task? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/team-lead/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Task deleted successfully!");
        // Refresh tasks and projects
        await fetchProjectTasks(selectedProject._id);
        await fetchAssignedProjects();
      } else {
        alert("Failed to delete task: " + (result.message || result.error));
      }
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Failed to delete task");
    }
  };

  // Enhanced Mark task point as completed
  const updateTaskPointEnhanced = async (
    taskId,
    pointId,
    isCompleted,
    completedBy
  ) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/team-lead/tasks/${taskId}/points/${pointId}`,
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

  // Enhanced Add task point to new task
  const addTaskPointEnhanced = () => {
    if (!newTaskPoint.pointTitle) return;

    setNewTask((prev) => ({
      ...prev,
      taskPoints: [
        ...prev.taskPoints,
        { ...newTaskPoint, order: prev.taskPoints.length },
      ],
    }));

    setNewTaskPoint({ pointTitle: "", description: "" });
  };

  // Enhanced Remove task point from new task
  const removeTaskPointEnhanced = (index) => {
    setNewTask((prev) => ({
      ...prev,
      taskPoints: prev.taskPoints.filter((_, i) => i !== index),
    }));
  };

  // Update project progress based on task completion
  const updateProjectProgress = async (projectId, groupedTasks) => {
    try {
      const totalTasks = Object.values(groupedTasks).flat().length;
      const completedTasks = groupedTasks.Completed.length;
      const progress =
        totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:5001/api/client-projects/${projectId}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ progress }),
        }
      );
    } catch (error) {
      console.error("Error updating project progress:", error);
    }
  };

  // Fetch assigned projects
  const fetchAssignedProjects = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/client-projects",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      const projectsData = Array.isArray(result)
        ? result
        : result.data || result.projects || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Handle project details with tasks
  const handleViewDetailsWithTasks = async (project) => {
    if (!project) {
      console.error("No project provided to handleViewDetailsWithTasks");
      alert("Error: No project selected. Please try again.");
      return;
    }

    if (!project._id && !project.id) {
      console.error("Project missing ID:", project);
      alert("Error: Invalid project data. Please refresh and try again.");
      return;
    }

    setSelectedProject(project);
    setShowProjectDetails(true);
    await fetchProjectTasks(project._id || project.id);
  };

  // Handle viewing task board
  const handleViewTaskBoard = async (project) => {
    if (!project) {
      console.error("No project provided to handleViewTaskBoard");
      alert("Error: No project selected. Please try again.");
      return;
    }

    if (!project._id && !project.id) {
      console.error("Project missing ID:", project);
      alert("Error: Invalid project data. Please refresh and try again.");
      return;
    }

    setSelectedProject(project);
    await fetchProjectTasks(project._id || project.id);
    setShowTaskBoard(true);
  };

  // Add missing state for task board
  const [showTaskBoard, setShowTaskBoard] = useState(false);

  // Helper function to open task creation modal
  const handleOpenTaskCreationModal = (project = null) => {
    console.log("Opening task creation modal for project:", project);

    // Reset the task form
    setNewTask({
      title: "",
      description: "",
      assignedTo: [],
      dueDate: "",
      priority: "Medium",
      taskPoints: [],
      project: project?._id || selectedProject?._id || "",
    });

    // Reset task point form
    setNewTaskPoint({
      pointTitle: "",
      description: "",
    });

    // Clear any edit state
    setEditTask(null);

    // Set the selected project if provided
    if (project) {
      setSelectedProject(project);
    }

    console.log("Task modal should open now");
    // Open the modal
    setShowTaskModal(true);
  };

  // Update Task function
  const updateTask = async () => {
    if (!editTask || !newTask.title) {
      alert("Task title is required!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/tasks/${editTask._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newTask),
        }
      );

      const result = await response.json();
      if (result.success) {
        setShowTaskModal(false);
        setEditTask(null);
        setNewTask({
          title: "",
          description: "",
          assignedTo: [],
          dueDate: "",
          priority: "Medium",
          taskPoints: [],
        });
        // Refresh tasks
        if (selectedProject) {
          await fetchProjectTasks(selectedProject._id);
        }
        alert("Task updated successfully!");
      } else {
        alert(result.message || "Failed to update task");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      alert("Error updating task. Please try again.");
    }
  };

  // Open Assignment Modal
  const openAssignmentModal = (task) => {
    setEditTask(task);
    setEditAssignment(task.assignedTo || []);

    // Set available employees (those not currently assigned to this task)
    const assignedIds = task.assignedTo?.map((emp) => emp.employeeId) || [];
    const available =
      selectedProject?.assignedEmployees?.filter(
        (emp) => !assignedIds.includes(emp.employeeId)
      ) || [];
    setAvailableEmployees(available);

    setShowEditModal(true);
  };

  // Add Employee to Task
  const addEmployeeToTask = (employee) => {
    if (!editAssignment.find((emp) => emp.employeeId === employee.employeeId)) {
      setEditAssignment((prev) => [
        ...prev,
        {
          employeeId: employee.employeeId,
          name: employee.name,
          role: employee.role,
          _id: employee.employeeId,
        },
      ]);

      // Remove from available employees
      setAvailableEmployees((prev) =>
        prev.filter((emp) => emp.employeeId !== employee.employeeId)
      );
    }
  };

  // Remove Employee from Task
  const removeEmployeeFromTask = (employeeId) => {
    const removedEmployee = editAssignment.find(
      (emp) => emp.employeeId === employeeId
    );

    setEditAssignment((prev) =>
      prev.filter((emp) => emp.employeeId !== employeeId)
    );

    // Add back to available employees
    if (removedEmployee) {
      const originalEmployee = selectedProject?.assignedEmployees?.find(
        (emp) => emp.employeeId === employeeId
      );
      if (originalEmployee) {
        setAvailableEmployees((prev) => [...prev, originalEmployee]);
      }
    }
  };

  // Save Assignment Changes
  const saveAssignmentChanges = async () => {
    if (!editTask) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/tasks/${editTask._id}/assign`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            assignedTo: editAssignment,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        setShowEditModal(false);
        setEditTask(null);
        setEditAssignment([]);
        setAvailableEmployees([]);

        // Refresh tasks
        if (selectedProject) {
          await fetchProjectTasks(selectedProject._id);
        }
        alert("Task assignment updated successfully!");
      } else {
        alert(result.message || "Failed to update task assignment");
      }
    } catch (error) {
      console.error("Error updating task assignment:", error);
      alert("Error updating task assignment. Please try again.");
    }
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
              <p>
                Please wait while we prepare your project management
                workspace...
              </p>
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
                    onClick={() => handleViewDetailsWithTasks(project)}
                    title="View Details"
                  >
                    <FaEye />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleViewTaskBoard(project)}
                    title="View Task Board"
                  >
                    <FaTasks />
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleOpenTaskCreationModal(project)}
                    title="Create Task"
                  >
                    <FaPlus />
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
              <div className="modal-header-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    if (selectedProject) {
                      handleViewTaskBoard(selectedProject);
                    } else {
                      alert("Please select a project first");
                    }
                  }}
                  title="View Task Board"
                >
                  <FaTasks /> View Tasks
                </button>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => handleOpenTaskCreationModal(selectedProject)}
                  title="Create New Task"
                >
                  <FaPlus /> Create Task
                </button>
                <button className="modal-close" onClick={handleCloseDetails}>
                  <FaTimes />
                </button>
              </div>
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
                        {tasks.Completed?.length || 0}
                      </span>
                      <span className="task-label">Completed</span>
                    </div>
                    <div className="task-stat in-progress">
                      <span className="task-count">
                        {tasks["In Progress"]?.length || 0}
                      </span>
                      <span className="task-label">In Progress</span>
                    </div>
                    <div className="task-stat pending">
                      <span className="task-count">
                        {tasks.Pending?.length || 0}
                      </span>
                      <span className="task-label">Pending</span>
                    </div>
                  </div>

                  {/* Quick Task Actions */}
                  <div className="task-quick-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => {
                        if (selectedProject) {
                          handleViewTaskBoard(selectedProject);
                        } else {
                          alert("Please select a project first");
                        }
                      }}
                    >
                      <FaTasks /> View All Tasks
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() =>
                        handleOpenTaskCreationModal(selectedProject)
                      }
                    >
                      <FaPlus /> Add New Task
                    </button>
                  </div>

                  {/* Recent Tasks List */}
                  {Object.values(tasks).flat().length > 0 && (
                    <div className="recent-tasks">
                      <h6>Recent Tasks</h6>
                      <div className="recent-tasks-list">
                        {Object.entries(tasks)
                          .map(([status, taskList]) =>
                            taskList
                              .slice(0, 2)
                              .map((task) => ({ ...task, status }))
                          )
                          .flat()
                          .slice(0, 5)
                          .map((task) => (
                            <div key={task._id} className="recent-task-item">
                              <div className="task-info">
                                <span className="task-title">{task.title}</span>
                                <span
                                  className={`task-status ${task.status
                                    .toLowerCase()
                                    .replace(" ", "-")}`}
                                >
                                  {task.status}
                                </span>
                              </div>
                              <div className="task-progress">
                                {task.taskPoints?.length > 0 && (
                                  <span className="task-points-progress">
                                    {
                                      task.taskPoints.filter(
                                        (p) => p.isCompleted
                                      ).length
                                    }
                                    /{task.taskPoints.length} points
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
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

      {/* Task Creation Modal */}

      {/* Task Board Modal */}
      {showTaskBoard && selectedProject && (
        <div className="modal-overlay task-board-overlay">
          <div className="modal-content task-board-modal">
            <div className="modal-header">
              <h3>
                <FaTasks /> Task Board -{" "}
                {selectedProject.projectId ||
                  selectedProject.name ||
                  "Untitled Project"}
              </h3>
              <div className="task-board-actions">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenTaskCreationModal(selectedProject)}
                >
                  <FaPlus /> Add Task
                </button>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowTaskBoard(false);
                    setSelectedProject(null);
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            <div className="modal-body task-board-container">
              {/* Task Statistics */}
              <div className="task-stats-section">
                <div className="task-stat-card">
                  <div className="stat-icon pending">
                    <FaClock />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">
                      {tasks.Pending?.length || 0}
                    </span>
                    <span className="stat-label">Pending</span>
                  </div>
                </div>
                <div className="task-stat-card">
                  <div className="stat-icon in-progress">
                    <FaPlay />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">
                      {tasks["In Progress"]?.length || 0}
                    </span>
                    <span className="stat-label">In Progress</span>
                  </div>
                </div>
                <div className="task-stat-card">
                  <div className="stat-icon completed">
                    <FaCheckCircle />
                  </div>
                  <div className="stat-info">
                    <span className="stat-number">
                      {tasks.Completed?.length || 0}
                    </span>
                    <span className="stat-label">Completed</span>
                  </div>
                </div>
              </div>

              {/* Task Board Columns */}
              <div className="task-board-columns">
                {Object.entries(tasks).map(([status, taskList]) => (
                  <div
                    key={status}
                    className={`task-column ${status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    <div className="column-header">
                      <h4>{status}</h4>
                      <span className="task-count">{taskList.length}</span>
                    </div>

                    <div className="task-list">
                      {taskList.map((task) => (
                        <div key={task._id} className="task-card">
                          <div className="task-header">
                            <h5 className="task-title">{task.title}</h5>
                            <div className="task-actions">
                              <button
                                className="action-btn"
                                onClick={() => openAssignmentModal(task)}
                                title="Edit Assignment"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="action-btn delete"
                                onClick={() => deleteTaskEnhanced(task._id)}
                                title="Delete Task"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          </div>

                          <div className="task-content">
                            <p className="task-description">
                              {task.description}
                            </p>

                            <div className="task-meta">
                              <div className="task-priority">
                                <span
                                  className={`priority-badge ${task.priority?.toLowerCase()}`}
                                >
                                  {task.priority}
                                </span>
                              </div>

                              {task.dueDate && (
                                <div className="task-due-date">
                                  <FaCalendarAlt />
                                  <span>
                                    {new Date(
                                      task.dueDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Task Points */}
                            {task.taskPoints && task.taskPoints.length > 0 && (
                              <div className="task-points">
                                <div className="task-points-header">
                                  <strong>Task Points:</strong>
                                  <span className="points-progress">
                                    {
                                      task.taskPoints.filter(
                                        (p) => p.isCompleted
                                      ).length
                                    }
                                    /{task.taskPoints.length}
                                  </span>
                                </div>
                                <div className="task-points-list">
                                  {task.taskPoints.map((point, idx) => (
                                    <div key={idx} className="task-point">
                                      <label className="task-point-checkbox">
                                        <input
                                          type="checkbox"
                                          checked={point.isCompleted}
                                          onChange={(e) =>
                                            updateTaskPointEnhanced(
                                              task._id,
                                              point._id,
                                              e.target.checked,
                                              JSON.parse(
                                                localStorage.getItem("user") ||
                                                  "{}"
                                              )._id
                                            )
                                          }
                                        />
                                        <span
                                          className={
                                            point.isCompleted ? "completed" : ""
                                          }
                                        >
                                          {point.pointTitle}
                                        </span>
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Assigned Employees */}
                            {task.assignedTo && task.assignedTo.length > 0 && (
                              <div className="task-assignees">
                                <div className="assignees-header">
                                  <strong>Assigned to:</strong>
                                </div>
                                <div className="assignees-list">
                                  {task.assignedTo.map((assignee, idx) => (
                                    <div key={idx} className="assignee-item">
                                      <span className="assignee-name">
                                        {assignee.name}
                                      </span>
                                      <small className="assignee-role">
                                        ({assignee.role})
                                      </small>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Status Change Buttons */}
                            <div className="task-status-actions">
                              {status === "Pending" && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() =>
                                    updateTaskStatusEnhanced(
                                      task._id,
                                      "In Progress"
                                    )
                                  }
                                >
                                  Start Task
                                </button>
                              )}
                              {status === "In Progress" && (
                                <>
                                  <button
                                    className="btn btn-warning btn-sm"
                                    onClick={() =>
                                      updateTaskStatusEnhanced(
                                        task._id,
                                        "Pending"
                                      )
                                    }
                                  >
                                    Move to Pending
                                  </button>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() =>
                                      updateTaskStatusEnhanced(
                                        task._id,
                                        "Completed"
                                      )
                                    }
                                  >
                                    Complete
                                  </button>
                                </>
                              )}
                              {status === "Completed" && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() =>
                                    updateTaskStatusEnhanced(
                                      task._id,
                                      "In Progress"
                                    )
                                  }
                                >
                                  Reopen
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {taskList.length === 0 && (
                        <div className="empty-column">
                          <p>No {status.toLowerCase()} tasks</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Task Section */}
              <div className="add-task-section">
                <button
                  onClick={() => handleOpenTaskCreationModal(selectedProject)}
                  className="btn btn-primary add-task-btn"
                >
                  <FaPlus /> Create New Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Creation/Edit Modal */}
      {showTaskModal && (
        <div className="modal-overlay">
          <div className="modal-content task-modal">
            <div className="modal-header">
              <h3>{editTask ? "Edit Task" : "Create New Task"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditTask(null);
                  setNewTask({
                    title: "",
                    description: "",
                    priority: "Medium",
                    dueDate: "",
                    assignedTo: [],
                    project: "",
                    taskPoints: [],
                  });
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {/* Project Info Section */}
              {selectedProject && (
                <div
                  className="project-info-section"
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "12px",
                    borderRadius: "6px",
                    marginBottom: "20px",
                    border: "1px solid #e9ecef",
                  }}
                >
                  <h5 style={{ margin: "0 0 8px 0", color: "#495057" }}>
                    Creating task for:{" "}
                    <strong>
                      {selectedProject.projectId ||
                        selectedProject.name ||
                        "Untitled Project"}
                    </strong>
                  </h5>
                  <p
                    style={{ margin: "0", fontSize: "14px", color: "#6c757d" }}
                  >
                    Client: {selectedProject.clientName || "Unknown Client"}
                  </p>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="Enter task title"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  placeholder="Enter task description"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                />
              </div>

              {/* Task Points Section */}
              <div className="form-group">
                <label>Task Points (Optional)</label>
                <div className="task-points-container">
                  <div className="add-task-point">
                    <input
                      type="text"
                      placeholder="Point title"
                      value={newTaskPoint.pointTitle}
                      onChange={(e) =>
                        setNewTaskPoint({
                          ...newTaskPoint,
                          pointTitle: e.target.value,
                        })
                      }
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={newTaskPoint.description}
                      onChange={(e) =>
                        setNewTaskPoint({
                          ...newTaskPoint,
                          description: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={addTaskPointEnhanced}
                      disabled={!newTaskPoint.pointTitle}
                      className="btn btn-secondary"
                    >
                      Add Point
                    </button>
                  </div>

                  {newTask.taskPoints.length > 0 && (
                    <div className="task-points-list">
                      {newTask.taskPoints.map((point, idx) => (
                        <div key={idx} className="task-point-item">
                          <div className="task-point-content">
                            <strong>{point.pointTitle}</strong>
                            {point.description && (
                              <div className="task-point-desc">
                                {point.description}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeTaskPointEnhanced(idx)}
                            className="btn btn-danger btn-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Assignment Section */}
              <div className="form-group">
                <label>Assign to Employees</label>
                {selectedProject &&
                selectedProject.assignedEmployees &&
                selectedProject.assignedEmployees.length > 0 ? (
                  <div className="employee-assignment-grid">
                    {selectedProject.assignedEmployees.map((emp) => (
                      <label key={emp.employeeId} className="employee-checkbox">
                        <input
                          type="checkbox"
                          checked={
                            Array.isArray(newTask.assignedTo) &&
                            newTask.assignedTo.some(
                              (assigned) =>
                                assigned.employeeId === emp.employeeId
                            )
                          }
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewTask((prev) => ({
                                ...prev,
                                assignedTo: [
                                  ...prev.assignedTo,
                                  {
                                    employeeId: emp.employeeId,
                                    name: emp.name,
                                    email: emp.email,
                                    role: emp.role,
                                  },
                                ],
                              }));
                            } else {
                              setNewTask((prev) => ({
                                ...prev,
                                assignedTo: prev.assignedTo.filter(
                                  (assigned) =>
                                    assigned.employeeId !== emp.employeeId
                                ),
                              }));
                            }
                          }}
                        />
                        <span className="employee-info">
                          <strong>{emp.name}</strong>
                          <small>({emp.role})</small>
                        </span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="no-employees-message">
                    <p>No employees assigned to this project yet.</p>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        if (selectedProject) {
                          handleAssignTeam(selectedProject);
                        } else {
                          alert("Please select a project first");
                        }
                      }}
                    >
                      Assign Team Members
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowTaskModal(false);
                  setEditTask(null);
                  setNewTask({
                    title: "",
                    description: "",
                    priority: "Medium",
                    dueDate: "",
                    assignedTo: [],
                    project: "",
                    taskPoints: [],
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={editTask ? updateTask : createTaskEnhanced}
                disabled={!newTask.title || !selectedProject}
              >
                {editTask ? "Update Task" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Assignment Edit Modal */}
      {showEditModal && editTask && (
        <div className="modal-overlay">
          <div className="modal-content assignment-modal">
            <div className="modal-header">
              <h3>Edit Task Assignment</h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="task-info">
                <h4>{editTask.title}</h4>
                <p>{editTask.description}</p>
              </div>

              <div className="assignment-section">
                <h5>Available Employees</h5>
                <div className="available-employees">
                  {availableEmployees.map((employee) => (
                    <div key={employee._id} className="employee-item">
                      <span>
                        {employee.name} ({employee.role})
                      </span>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => addEmployeeToTask(employee)}
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="assigned-section">
                <h5>Currently Assigned</h5>
                <div className="assigned-employees">
                  {editAssignment.map((employee) => (
                    <div key={employee._id} className="assigned-employee">
                      <span>
                        {employee.name} ({employee.role})
                      </span>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => removeEmployeeFromTask(employee._id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={saveAssignmentChanges}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagerDashboard;
