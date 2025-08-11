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
  FaTimes,
  FaClock,
  FaUser,
  FaPlus,
} from "react-icons/fa";
import { useAuth } from "../AuthProvider/AuthContext";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import "./TeamLeadDashboard.css";
import "./TeamLeadTaskTracking.css";

const TeamLeadDashboard = () => {
  const { user } = useAuth(); // Get current authenticated user
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("projectId");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showProjectDetails, setShowProjectDetails] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
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
  const [dashboardStats, setDashboardStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    totalAmount: 0,
  });
  const [editTask, setEditTask] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAssignment, setEditAssignment] = useState([]);
  const [showTaskHistory, setShowTaskHistory] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState(null);

  // Project Assignment States
  const [showProjectAssignmentModal, setShowProjectAssignmentModal] =
    useState(false);
  const [selectedProjectForAssignment, setSelectedProjectForAssignment] =
    useState(null);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [selectedEmployeesForProject, setSelectedEmployeesForProject] =
    useState([]);
  const [assigningEmployees, setAssigningEmployees] = useState(false);

  // Employee Task Viewing States
  const [showEmployeeTasksModal, setShowEmployeeTasksModal] = useState(false);
  const [selectedEmployeeForTasks, setSelectedEmployeeForTasks] =
    useState(null);
  const [employeeTasks, setEmployeeTasks] = useState({
    Pending: [],
    "In Progress": [],
    Completed: [],
  });
  const [loadingEmployeeTasks, setLoadingEmployeeTasks] = useState(false);

  // Task History Dashboard States
  const [showTaskHistoryDashboard, setShowTaskHistoryDashboard] =
    useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const [loadingTaskHistory, setLoadingTaskHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all"); // all, today, week, month
  const [historySearchTerm, setHistorySearchTerm] = useState("");
  const [filteredTaskHistory, setFilteredTaskHistory] = useState([]);

  // Get current user (Team Lead) info from auth context
  const currentUser = user || {
    name: "Team Lead",
    id: "team-lead-id",
  };

  // Fetch projects assigned to this team lead
  const fetchAssignedProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token"); // <-- Add this line
      const identifier =
        currentUser.id || currentUser.name || currentUser.email;
      const response = await fetch(
        `http://localhost:5001/api/client-projects/team-lead/${identifier}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      const assignedProjects = Array.isArray(result.data) ? result.data : [];

      // Fetch task summaries for each project
      const projectsWithTasks = await Promise.all(
        assignedProjects.map(async (project) => {
          try {
            const taskResponse = await fetch(
              `http://localhost:5001/api/team-lead/projects/${project._id}/tasks`,
              {
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
              }
            );
            const taskResult = await taskResponse.json();

            if (taskResult.success) {
              const projectTasks = {
                Pending: taskResult.data.filter(
                  (task) => task.status === "Pending"
                ),
                "In Progress": taskResult.data.filter(
                  (task) => task.status === "In Progress"
                ),
                Completed: taskResult.data.filter(
                  (task) => task.status === "Completed"
                ),
              };

              return {
                ...project,
                taskSummary: projectTasks,
              };
            }
            return project;
          } catch (error) {
            console.error(
              `Error fetching tasks for project ${project._id}:`,
              error
            );
            return project;
          }
        })
      );

      setProjects(projectsWithTasks);
      setDashboardStats(calculateDashboardStats(projectsWithTasks));
    } catch (error) {
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
    fetchProjectTasks(project._id); // Fetch tasks when project is selected
  };

  const handleCloseDetails = () => {
    setShowProjectDetails(false);
    setSelectedProject(null);
  };

  // Handler for viewing task details inline
  const handleViewTaskDetails = (task) => {
    setSelectedTask(task);
  };

  // Fetch tasks for selected project
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

  // Create new task
  const createTask = async () => {
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

  // Update task status
  const updateTaskStatus = async (taskId, status) => {
    try {
      // Add confirmation when marking task as completed
      if (status === "Completed") {
        const confirmComplete = window.confirm(
          "Are you sure you want to mark this task as completed? This will update the project progress."
        );
        if (!confirmComplete) {
          return; // Cancel the operation if user clicks "No"
        }
      }

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

  // Delete task (only for managers and team leads)
  const deleteTask = async (taskId) => {
    // Check if user has permission to delete tasks
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

  // Mark task point as completed
  const updateTaskPoint = async (taskId, pointId, isCompleted, completedBy) => {
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

  // Add task point to new task
  const addTaskPoint = () => {
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

  // Remove task point from new task
  const removeTaskPoint = (index) => {
    setNewTask((prev) => ({
      ...prev,
      taskPoints: prev.taskPoints.filter((_, i) => i !== index),
    }));
  };

  const handleCloseTaskDetails = () => {
    setShowTaskDetails(false);
    setSelectedTask(null);
  };

  // Open assignment modal
  const openAssignmentModal = async (task) => {
    setSelectedTask(task);
    setEditAssignment(task.assignedTo || []);

    // Fetch available employees for assignment
    await fetchAvailableEmployees();

    setShowEditModal(true);
  };

  // Save assignment changes
  const saveAssignmentChanges = async () => {
    if (!selectedTask) return;

    // Check if user has permission to save changes
    if (
      !user ||
      (user.role !== "Manager" &&
        user.subRole !== "Team Lead" &&
        user.role !== "Admin")
    ) {
      alert("You don't have permission to modify task assignments.");
      return;
    }

    try {
      await updateTaskAssignment(selectedTask._id, editAssignment);
      setShowEditModal(false);
      setSelectedTask(null);
      setEditAssignment([]);
      alert("Assignment updated successfully!");
    } catch (error) {
      console.error("Error updating assignment:", error);
      alert("Failed to update assignment");
    }
  };

  // Add employee to task assignment
  const addEmployeeToTask = (employee) => {
    // Check if user has permission
    if (
      !user ||
      (user.role !== "Manager" &&
        user.subRole !== "Team Lead" &&
        user.role !== "Admin")
    ) {
      alert("You don't have permission to modify task assignments.");
      return;
    }

    // Check if employee is already assigned
    const isAlreadyAssigned = editAssignment.some(
      (assigned) => assigned.employeeId === employee.id
    );

    if (!isAlreadyAssigned) {
      setEditAssignment((prev) => [
        ...prev,
        {
          employeeId: employee.id,
          name: employee.name,
          email: employee.email,
          role: employee.role,
        },
      ]);
    }
  };

  // Remove employee from task assignment
  const removeEmployeeFromTask = (employeeId) => {
    // Check if user has permission
    if (
      !user ||
      (user.role !== "Manager" &&
        user.subRole !== "Team Lead" &&
        user.role !== "Admin")
    ) {
      alert("You don't have permission to modify task assignments.");
      return;
    }

    setEditAssignment((prev) =>
      prev.filter((assigned) => assigned.employeeId !== employeeId)
    );
  };

  // Toggle employee assignment
  const toggleEmployeeAssignment = (employee, isChecked) => {
    if (isChecked) {
      addEmployeeToTask(employee);
    } else {
      removeEmployeeFromTask(employee.id);
    }
  };

  // Calculate project completion percentage
  const calculateProjectProgress = (taskList) => {
    const totalTasks =
      taskList.Pending.length +
      taskList["In Progress"].length +
      taskList.Completed.length;
    if (totalTasks === 0) return 0;

    const completedTasks = taskList.Completed.length;
    const inProgressTasks = taskList["In Progress"].length;

    // Give 100% for completed tasks and 50% for in-progress tasks
    const progressScore = completedTasks * 100 + inProgressTasks * 50;
    const maxScore = totalTasks * 100;

    return Math.round((progressScore / maxScore) * 100);
  };

  // View task assignment history
  const viewTaskHistory = (task) => {
    setSelectedTaskForHistory(task);
    setShowTaskHistory(true);
  };

  // Project Assignment Functions
  const fetchAvailableEmployees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        "http://localhost:5001/api/team-lead/employees",
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      if (result.success) {
        setAvailableEmployees(result.data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
      // Fallback to candidates endpoint
      try {
        const token = localStorage.getItem("token");
        const fallbackResponse = await fetch(
          "http://localhost:5001/api/candidates/employees",
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const fallbackResult = await fallbackResponse.json();
        if (fallbackResult.success) {
          setAvailableEmployees(fallbackResult.data);
        }
      } catch (fallbackError) {
        console.error("Error fetching employees from fallback:", fallbackError);
      }
    }
  };

  // const openProjectAssignmentModal = (project) => {
  //   setSelectedProjectForAssignment(project);
  //   setSelectedEmployeesForProject(project.assignedEmployees || []);
  //   fetchAvailableEmployees();
  //   setShowProjectAssignmentModal(true);
  // };

  const handleEmployeeToggleForProject = (employee, isChecked) => {
    if (isChecked) {
      setSelectedEmployeesForProject((prev) => [
        ...prev,
        {
          employeeId: employee._id,
          name: employee.name,
          role: employee.role,
          subRole: employee.subRole,
          email: employee.email,
        },
      ]);
    } else {
      setSelectedEmployeesForProject((prev) =>
        prev.filter((emp) => emp.employeeId !== employee._id)
      );
    }
  };

  const assignEmployeesToProject = async () => {
    if (!selectedProjectForAssignment) return;

    setAssigningEmployees(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5001/api/client-projects/${selectedProjectForAssignment._id}/assign-employees`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employees: selectedEmployeesForProject.map((emp) => ({
              employeeId: emp.employeeId,
            })),
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        alert("Employees assigned to project successfully!");
        setShowProjectAssignmentModal(false);
        fetchAssignedProjects(); // Refresh projects
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Error assigning employees:", error);
      alert("Failed to assign employees: " + error.message);
    } finally {
      setAssigningEmployees(false);
    }
  };

  // Update project progress when tasks change
  const updateProjectProgress = async (projectId, taskSummary) => {
    const newProgress = calculateProjectProgress(taskSummary);

    try {
      const token = localStorage.getItem("token");
      await fetch(
        `http://localhost:5001/api/client-projects/${projectId}/progress`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ progress: newProgress }),
        }
      );

      // Update local project state
      setProjects((prev) =>
        prev.map((p) =>
          p._id === projectId ? { ...p, progress: newProgress } : p
        )
      );
    } catch (error) {
      console.error("Error updating project progress:", error);
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

  // Employee Task Management Functions

  // Function to fetch tasks for a specific employee
  const fetchEmployeeTasks = async (employee, projectId = null) => {
    try {
      setLoadingEmployeeTasks(true);
      const token = localStorage.getItem("token");

      // Extract employee ID - handle different object structures
      const extractEmployeeId = (empData) => {
        if (typeof empData === "string") return empData;
        if (typeof empData === "object" && empData !== null) {
          const id = empData._id || empData.id || empData.employeeId;
          if (typeof id === "string") return id;
          if (typeof id === "object" && id !== null) {
            return id._id || id.id || id.employeeId || "";
          }
        }
        return "";
      };

      const employeeId = extractEmployeeId(employee);

      if (!employeeId) {
        console.error("Employee ID not found. Employee object:", employee);
        throw new Error("Employee ID not found");
      }

      let url = `http://localhost:5001/api/team-lead/employees/${employeeId}/tasks`;
      if (projectId) {
        url += `?projectId=${projectId}`;
      }

      console.log("Fetching employee tasks from URL:", url);

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setEmployeeTasks(result.data.groupedTasks);
        return result.data;
      } else {
        throw new Error(result.message || "Failed to fetch employee tasks");
      }
    } catch (error) {
      console.error("Error fetching employee tasks:", error);
      alert("Failed to fetch employee tasks. Please try again.");
      return null;
    } finally {
      setLoadingEmployeeTasks(false);
    }
  }; // Function to view tasks for a specific employee
  const handleViewEmployeeTasks = async (employee, projectId = null) => {
    try {
      // Ensure we have a valid employee object
      if (!employee) {
        console.error("No employee provided");
        return;
      }

      // Create a clean employee object for state storage
      const extractId = (idField) => {
        if (typeof idField === "string") return idField;
        if (typeof idField === "object" && idField !== null) {
          return idField._id || idField.id || idField.employeeId || "";
        }
        return "";
      };

      const cleanEmployee = {
        _id:
          extractId(employee._id) ||
          extractId(employee.id) ||
          extractId(employee.employeeId),
        id:
          extractId(employee._id) ||
          extractId(employee.id) ||
          extractId(employee.employeeId),
        name: employee.name || "Unknown",
        email: employee.email || "",
        role: employee.role || "",
        subRole: employee.subRole || "",
      };

      console.log("Viewing tasks for employee:", cleanEmployee);

      setSelectedEmployeeForTasks(cleanEmployee);
      setShowEmployeeTasksModal(true);

      const taskData = await fetchEmployeeTasks(cleanEmployee, projectId);
      if (taskData) {
        console.log(
          `Loaded ${taskData.total} tasks for employee: ${cleanEmployee.name}`
        );
      }
    } catch (error) {
      console.error("Error viewing employee tasks:", error);
      alert("Failed to load employee tasks. Please try again.");
    }
  };

  // Function to close employee tasks modal
  const handleCloseEmployeeTasksModal = () => {
    setShowEmployeeTasksModal(false);
    setSelectedEmployeeForTasks(null);
    setEmployeeTasks({
      Pending: [],
      "In Progress": [],
      Completed: [],
    });
  };

  // Function to fetch task history for team lead
  const fetchTaskHistory = async () => {
    try {
      setLoadingTaskHistory(true);
      const token = localStorage.getItem("token");

      const response = await fetch("/api/team-lead/tasks/history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Task history response:", data);

      if (data.success) {
        setTaskHistory(data.data.history || []);
        setFilteredTaskHistory(data.data.history || []);
      } else {
        console.error("Failed to fetch task history:", data.message);
        setTaskHistory([]);
        setFilteredTaskHistory([]);
      }
    } catch (error) {
      console.error("Error fetching task history:", error);
      setTaskHistory([]);
      setFilteredTaskHistory([]);
    } finally {
      setLoadingTaskHistory(false);
    }
  };

  // Function to filter task history
  const filterTaskHistory = () => {
    let filtered = [...taskHistory];

    // Apply search filter
    if (historySearchTerm.trim()) {
      const searchLower = historySearchTerm.toLowerCase();
      filtered = filtered.filter(
        (entry) =>
          entry.taskTitle?.toLowerCase().includes(searchLower) ||
          entry.projectTitle?.toLowerCase().includes(searchLower) ||
          entry.changedBy?.name?.toLowerCase().includes(searchLower) ||
          entry.newStatus?.toLowerCase().includes(searchLower) ||
          entry.previousStatus?.toLowerCase().includes(searchLower)
      );
    }

    // Apply time filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (historyFilter) {
      case "today":
        filtered = filtered.filter(
          (entry) => new Date(entry.timestamp) >= today
        );
        break;
      case "week":
        filtered = filtered.filter(
          (entry) => new Date(entry.timestamp) >= weekAgo
        );
        break;
      case "month":
        filtered = filtered.filter(
          (entry) => new Date(entry.timestamp) >= monthAgo
        );
        break;
      default:
        // "all" - no additional filtering
        break;
    }

    setFilteredTaskHistory(filtered);
  };

  // Effect to filter task history when filters change
  useEffect(() => {
    filterTaskHistory();
  }, [historySearchTerm, historyFilter, taskHistory]);

  // Function to open task history dashboard
  const handleOpenTaskHistoryDashboard = () => {
    setShowTaskHistoryDashboard(true);
    fetchTaskHistory();
  };

  // Function to close task history dashboard
  const handleCloseTaskHistoryDashboard = () => {
    setShowTaskHistoryDashboard(false);
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
              <h3>Loading Team Lead Dashboard</h3>
              <p>
                Please wait while we fetch your assigned projects and tasks...
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
    <div className="team-lead-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>
          <FaProjectDiagram /> Team Lead Dashboard
        </h1>
        <p>
          Welcome back,{" "}
          {currentUser.name || currentUser.username || "Team Lead"}! Here are
          your assigned projects.
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
            <div className="stat-title">Total Projects</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Assigned to you
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
            <div className="stat-title">Active</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              In progress
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
          >
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
            <div className="stat-title">Total Value</div>
            <div className="stat-trend">
              <FaArrowUp size={12} />
              Project value
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <div className="quick-actions-header">
          <h2>Quick Actions</h2>
          <p>Access important features and reports</p>
        </div>
        <div className="quick-actions-grid">
          <button
            className="action-button task-history-btn"
            onClick={handleOpenTaskHistoryDashboard}
          >
            <div className="action-icon">
              <FaClock size={20} />
            </div>
            <div className="action-content">
              <div className="action-title">Task History</div>
              <div className="action-description">
                View all task status changes
              </div>
            </div>
          </button>
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
          <h2>
            <FaProjectDiagram /> My Assigned Projects ({filteredProjects.length}
            )
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
                  {/* <button
                    className="action-btn"
                    onClick={() => openProjectAssignmentModal(project)}
                    title="Assign Employees to Project"
                    style={{ marginLeft: 8 }}
                  >
                    <FaUser />
                  </button> */}
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
                    <strong>Original Lead:</strong>{" "}
                    {project.leadName || "Not Specified"}
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
                    <strong>Assigned Team Lead:</strong>
                    <span className="team-lead-assigned">
                      {project.assignedTeamLead || "Not Assigned"}
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
                      Project Value: ₹
                      {project.finalAmount
                        ? project.finalAmount.toLocaleString()
                        : "0"}
                    </strong>
                  </div>
                </div>

                {/* Enhanced Project Summary Cards */}
                <div className="project-summary-card">
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr",
                      gap: 12,
                    }}
                  >
                    {/* Assigned Team Members */}
                    <div>
                      <h6 className="summary-section-header">
                        👥 TEAM MEMBERS (
                        {(project.assignedEmployees || []).length})
                      </h6>
                      {project.assignedEmployees &&
                      project.assignedEmployees.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 8,
                          }}
                        >
                          <div className="team-members-container">
                            {project.assignedEmployees
                              .slice(0, 3)
                              .map((emp, idx) => (
                                <span
                                  key={idx}
                                  className="team-member-badge"
                                  onClick={() => {
                                    const extractId = (idField) => {
                                      if (typeof idField === "string")
                                        return idField;
                                      if (
                                        typeof idField === "object" &&
                                        idField !== null
                                      ) {
                                        return (
                                          idField._id ||
                                          idField.id ||
                                          idField.employeeId ||
                                          ""
                                        );
                                      }
                                      return "";
                                    };

                                    const employeeData = {
                                      _id:
                                        extractId(emp.employeeId) ||
                                        extractId(emp._id) ||
                                        idx,
                                      id:
                                        extractId(emp.employeeId) ||
                                        extractId(emp._id) ||
                                        idx,
                                      name: emp.name || "Unknown",
                                      role: emp.role || "",
                                      subRole: emp.subRole || "",
                                      email: emp.email || "",
                                    };
                                    console.log(
                                      "Clicking employee:",
                                      employeeData
                                    );
                                    handleViewEmployeeTasks(
                                      employeeData,
                                      project._id
                                    );
                                  }}
                                  style={{
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    border: "1px solid transparent",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = "#3b82f6";
                                    e.target.style.color = "white";
                                    e.target.style.borderColor = "#2563eb";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = "";
                                    e.target.style.color = "";
                                    e.target.style.borderColor = "transparent";
                                  }}
                                  title={`Click to view ${
                                    emp?.name || "Unknown"
                                  }'s tasks`}
                                >
                                  {emp?.name || "Unknown"}
                                </span>
                              ))}
                            {project.assignedEmployees.length > 3 && (
                              <span className="team-member-more">
                                +{project.assignedEmployees.length - 3} more
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              fontStyle: "italic",
                            }}
                          >
                            💡 Click on team member names to view their tasks
                          </div>
                        </div>
                      ) : (
                        <span className="no-team-assigned">
                          No team assigned yet
                        </span>
                      )}
                    </div>

                    {/* Task Summary - Show when project has tasks */}
                    {project.taskSummary &&
                      (project.taskSummary.Pending.length > 0 ||
                        project.taskSummary["In Progress"].length > 0 ||
                        project.taskSummary.Completed.length > 0) && (
                        <div>
                          <h6 className="summary-section-header">
                            📋 TASK PROGRESS
                          </h6>
                          <div className="task-progress-indicator">
                            <span className="task-count-pending">
                              📋 {project.taskSummary.Pending.length} Pending
                            </span>
                            <span className="task-count-active">
                              🔄 {project.taskSummary["In Progress"].length}{" "}
                              Active
                            </span>
                            <span className="task-count-completed">
                              ✅ {project.taskSummary.Completed.length} Done
                            </span>
                          </div>

                          {/* Progress Bar */}
                          <div className="progress-bar-container">
                            <div className="progress-bar">
                              <div
                                className="progress-bar-fill"
                                style={{ width: `${project.progress || 0}%` }}
                              ></div>
                            </div>
                            <div className="progress-percentage">
                              {project.progress || 0}% Complete
                            </div>
                          </div>
                        </div>
                      )}

                    {/* Project Health Indicator */}
                    <div>
                      <h6 className="summary-section-header">
                        🎯 PROJECT HEALTH
                      </h6>
                      <div className="project-health-indicator">
                        <div
                          className="health-status-dot"
                          style={{
                            background: getStatusColor(project.projectStatus),
                          }}
                        ></div>
                        <span style={{ fontSize: 10, fontWeight: 500 }}>
                          {project.projectStatus === "Active"
                            ? "On Track"
                            : project.projectStatus === "Completed"
                            ? "Completed"
                            : project.projectStatus === "Overdue"
                            ? "Needs Attention"
                            : "Status Unknown"}
                        </span>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h6 className="summary-section-header">
                        ⚡ QUICK ACTIONS
                      </h6>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => handleViewDetails(project)}
                          className="quick-action-button"
                        >
                          📋 Manage Tasks
                        </button>
                        {project.taskSummary &&
                          project.taskSummary.Pending.length > 0 && (
                            <button
                              onClick={() => handleViewDetails(project)}
                              className="quick-action-button warning"
                            >
                              ⚠️ {project.taskSummary.Pending.length} Pending
                            </button>
                          )}
                      </div>
                    </div>
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
            <p>
              No projects are currently assigned to you matching the selected
              criteria.
            </p>
          </div>
        )}
      </div>

      {/* Project Details Modal with Task Tracking */}
      {showProjectDetails && selectedProject && (
        <div className="modal-overlay" onClick={handleCloseDetails}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw",
              width: "95vw",
              minHeight: 700,
              borderRadius: 12,
              boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
              backgroundColor: "white",
              color: "black",
            }}
          >
            <div
              className="modal-header"
              style={{
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
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
                  {selectedProject.projectId || "Untitled Project"} - Task
                  Management
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#6b7280",
                    fontSize: 14,
                  }}
                >
                  Client: {selectedProject.clientName} | Progress:{" "}
                  {calculateProjectProgress(tasks)}% | Total Tasks:{" "}
                  {tasks.Pending.length +
                    tasks["In Progress"].length +
                    tasks.Completed.length}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <button
                  onClick={() => setShowTaskModal(true)}
                  style={{
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "8px 16px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  <FaPlus style={{ marginRight: 4 }} /> Create Task
                </button>
                <button className="modal-close" onClick={handleCloseDetails}>
                  <FaTimes />
                </button>
              </div>
            </div>

            <div className="modal-body" style={{ padding: 24 }}>
              {/* Task Management Dashboard */}
              <div className="task-dashboard">
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
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#f59e0b",
                      }}
                    >
                      {tasks.Pending.length}
                    </div>
                    <div
                      style={{
                        color: "#92400e",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
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
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#3b82f6",
                      }}
                    >
                      {tasks["In Progress"].length}
                    </div>
                    <div
                      style={{
                        color: "#1e40af",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
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
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#10b981",
                      }}
                    >
                      {tasks.Completed.length}
                    </div>
                    <div
                      style={{
                        color: "#047857",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      Completed
                    </div>
                  </div>
                  <div
                    className="task-stat-card"
                    style={{
                      flex: 1,
                      background: "#f3f4f6",
                      padding: 16,
                      borderRadius: 8,
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: "#374151",
                      }}
                    >
                      {calculateProjectProgress(tasks)}%
                    </div>
                    <div
                      style={{
                        color: "#6b7280",
                        fontSize: 14,
                        fontWeight: 500,
                      }}
                    >
                      Total Progress
                    </div>
                  </div>
                </div>

                {/* Task Tracking Board - Three Columns */}
                <DragDropContext
                  onDragEnd={async (result) => {
                    const { source, destination, draggableId } = result;
                    if (!destination) return;
                    if (source.droppableId === destination.droppableId) return;

                    // Find the task being moved
                    const sourceSection = tasks[source.droppableId];
                    const taskToMove = sourceSection.find(
                      (task) => task._id === draggableId
                    );

                    if (taskToMove) {
                      // Update task status
                      await updateTaskStatus(
                        taskToMove._id,
                        destination.droppableId
                      );
                    }
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: 20,
                      minHeight: 500,
                    }}
                  >
                    {/* Pending Section */}
                    <Droppable droppableId="Pending">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            background: snapshot.isDraggingOver
                              ? "#fef3c7"
                              : "#fffbeb",
                            borderRadius: 12,
                            padding: 16,
                            border: "2px dashed #f59e0b",
                          }}
                        >
                          <h4
                            style={{
                              color: "#f59e0b",
                              fontWeight: 700,
                              marginBottom: 16,
                              textAlign: "center",
                            }}
                          >
                            📋 PENDING ({tasks.Pending.length})
                          </h4>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#92400e",
                              marginBottom: 12,
                              textAlign: "center",
                            }}
                          >
                            Tasks created but not yet assigned or started
                          </div>

                          {tasks.Pending.map((task, index) => (
                            <Draggable
                              key={task._id || `pending-${index}`}
                              draggableId={task._id || `pending-${index}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding: 12,
                                    marginBottom: 12,
                                    boxShadow: snapshot.isDragging
                                      ? "0 8px 16px rgba(0,0,0,0.15)"
                                      : "0 2px 4px rgba(0,0,0,0.1)",
                                    border: "1px solid #fed7aa",
                                    cursor: "grab",
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#1f2937",
                                      marginBottom: 4,
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

                                  {/* Assignment Section */}
                                  <div style={{ marginBottom: 8 }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#92400e",
                                        fontWeight: 600,
                                        marginBottom: 4,
                                      }}
                                    >
                                      ASSIGNED TO:
                                    </div>
                                    {task.assignedTo &&
                                    task.assignedTo.length > 0 ? (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: 4,
                                        }}
                                      >
                                        {task.assignedTo &&
                                        task.assignedTo.length > 0 ? (
                                          task.assignedTo.map((emp, idx) => (
                                            <span
                                              key={`${task._id}-pending-${
                                                emp?.employeeId ||
                                                emp?._id ||
                                                emp?.name ||
                                                idx
                                              }-${idx}`}
                                              style={{
                                                background: "#fecaca",
                                                color: "#991b1b",
                                                padding: "2px 6px",
                                                borderRadius: 4,
                                                fontSize: 10,
                                              }}
                                            >
                                              {String(emp?.name || "Unknown")}
                                            </span>
                                          ))
                                        ) : (
                                          <span
                                            style={{
                                              fontSize: 10,
                                              color: "#6b7280",
                                              fontStyle: "italic",
                                            }}
                                          >
                                            No assignments
                                          </span>
                                        )}
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          color: "#dc2626",
                                          fontSize: 11,
                                          fontStyle: "italic",
                                        }}
                                      >
                                        ⚠️ Not assigned yet
                                      </div>
                                    )}
                                  </div>

                                  {/* Quick Actions */}
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 4,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    <button
                                      onClick={() => openAssignmentModal(task)}
                                      style={{
                                        background: "#3b82f6",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      {task.assignedTo &&
                                      task.assignedTo.length > 0
                                        ? "Edit Assignment"
                                        : "Assign"}
                                    </button>

                                    <button
                                      onClick={() => viewTaskHistory(task)}
                                      style={{
                                        background: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      📊 History
                                    </button>

                                    <button
                                      onClick={() => deleteTask(task._id)}
                                      style={{
                                        background: "#ef4444",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                        marginLeft: 4,
                                        display:
                                          user &&
                                          (user.role === "Manager" ||
                                            user.subRole === "Team Lead" ||
                                            user.role === "Admin")
                                            ? "block"
                                            : "none",
                                      }}
                                      title="Delete Task"
                                    >
                                      🗑️ Delete
                                    </button>

                                    {task.assignedTo &&
                                      task.assignedTo.length > 0 && (
                                        <button
                                          onClick={() =>
                                            updateTaskStatus(
                                              task._id,
                                              "In Progress"
                                            )
                                          }
                                          style={{
                                            background: "#10b981",
                                            color: "white",
                                            border: "none",
                                            borderRadius: 4,
                                            padding: "4px 8px",
                                            fontSize: 10,
                                            cursor: "pointer",
                                          }}
                                        >
                                          Start Task
                                        </button>
                                      )}
                                  </div>

                                  <div
                                    style={{
                                      fontSize: 10,
                                      color: "#6b7280",
                                      marginTop: 8,
                                    }}
                                  >
                                    Due: {formatDate(task.dueDate)} | Priority:{" "}
                                    {task.priority}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* In Progress Section */}
                    <Droppable droppableId="In Progress">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            background: snapshot.isDraggingOver
                              ? "#dbeafe"
                              : "#eff6ff",
                            borderRadius: 12,
                            padding: 16,
                            border: "2px dashed #3b82f6",
                          }}
                        >
                          <h4
                            style={{
                              color: "#3b82f6",
                              fontWeight: 700,
                              marginBottom: 16,
                              textAlign: "center",
                            }}
                          >
                            🔄 IN PROGRESS ({tasks["In Progress"].length})
                          </h4>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#1e40af",
                              marginBottom: 12,
                              textAlign: "center",
                            }}
                          >
                            Tasks currently being worked on
                          </div>

                          {tasks["In Progress"].map((task, index) => (
                            <Draggable
                              key={task._id || `inprogress-${index}`}
                              draggableId={task._id || `inprogress-${index}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding: 12,
                                    marginBottom: 12,
                                    boxShadow: snapshot.isDragging
                                      ? "0 8px 16px rgba(0,0,0,0.15)"
                                      : "0 2px 4px rgba(0,0,0,0.1)",
                                    border: "1px solid #93c5fd",
                                    cursor: "grab",
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#1f2937",
                                      marginBottom: 4,
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

                                  {/* Progress Bar */}
                                  <div style={{ marginBottom: 8 }}>
                                    <div
                                      style={{
                                        background: "#e5e7eb",
                                        borderRadius: 4,
                                        height: 6,
                                        overflow: "hidden",
                                      }}
                                    >
                                      <div
                                        style={{
                                          background: "#3b82f6",
                                          height: "100%",
                                          width: `${
                                            task.progressPercentage || 0
                                          }%`,
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

                                  {/* Task Points */}
                                  {task.taskPoints &&
                                    task.taskPoints.length > 0 && (
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
                                            key={`${task._id}-point-${idx}`}
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
                                                textDecoration:
                                                  point.isCompleted
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

                                  {/* Assigned Team */}
                                  <div style={{ marginBottom: 8 }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#1e40af",
                                        fontWeight: 600,
                                        marginBottom: 4,
                                      }}
                                    >
                                      WORKING:
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 4,
                                      }}
                                    >
                                      {task.assignedTo &&
                                      task.assignedTo.length > 0 ? (
                                        task.assignedTo.map((emp, idx) => (
                                          <span
                                            key={`${task._id}-inprogress-${
                                              emp?.employeeId ||
                                              emp?._id ||
                                              emp?.name ||
                                              idx
                                            }-${idx}`}
                                            style={{
                                              background: "#bfdbfe",
                                              color: "#1e40af",
                                              padding: "2px 6px",
                                              borderRadius: 4,
                                              fontSize: 10,
                                            }}
                                          >
                                            {emp?.name || "Unknown"}
                                          </span>
                                        ))
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6b7280",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          No assignments
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action Buttons */}
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 4,
                                      flexWrap: "wrap",
                                      marginBottom: 8,
                                    }}
                                  >
                                    <button
                                      onClick={() => openAssignmentModal(task)}
                                      style={{
                                        background: "#f59e0b",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      Edit Assignment
                                    </button>

                                    <button
                                      onClick={() => viewTaskHistory(task)}
                                      style={{
                                        background: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      📊 History
                                    </button>

                                    <button
                                      onClick={() => deleteTask(task._id)}
                                      style={{
                                        background: "#ef4444",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                        marginLeft: 4,
                                        display:
                                          user &&
                                          (user.role === "Manager" ||
                                            user.subRole === "Team Lead" ||
                                            user.role === "Admin")
                                            ? "block"
                                            : "none",
                                      }}
                                      title="Delete Task"
                                    >
                                      🗑️ Delete
                                    </button>
                                  </div>

                                  <div
                                    style={{ fontSize: 10, color: "#6b7280" }}
                                  >
                                    Due: {formatDate(task.dueDate)} | Priority:{" "}
                                    {task.priority}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>

                    {/* Completed Section */}
                    <Droppable droppableId="Completed">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            background: snapshot.isDraggingOver
                              ? "#d1fae5"
                              : "#ecfdf5",
                            borderRadius: 12,
                            padding: 16,
                            border: "2px dashed #10b981",
                          }}
                        >
                          <h4
                            style={{
                              color: "#10b981",
                              fontWeight: 700,
                              marginBottom: 16,
                              textAlign: "center",
                            }}
                          >
                            ✅ COMPLETED ({tasks.Completed.length})
                          </h4>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#047857",
                              marginBottom: 12,
                              textAlign: "center",
                            }}
                          >
                            Successfully finished tasks
                          </div>

                          {tasks.Completed.map((task, index) => (
                            <Draggable
                              key={task._id || `completed-${index}`}
                              draggableId={task._id || `completed-${index}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  style={{
                                    background: "#fff",
                                    borderRadius: 8,
                                    padding: 12,
                                    marginBottom: 12,
                                    boxShadow: snapshot.isDragging
                                      ? "0 8px 16px rgba(0,0,0,0.15)"
                                      : "0 2px 4px rgba(0,0,0,0.1)",
                                    border: "1px solid #86efac",
                                    cursor: "grab",
                                    opacity: 0.9,
                                    ...provided.draggableProps.style,
                                  }}
                                >
                                  <div
                                    style={{
                                      fontWeight: 600,
                                      color: "#1f2937",
                                      marginBottom: 4,
                                    }}
                                  >
                                    ✅ {task.title}
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

                                  {/* Completion Info */}
                                  <div
                                    style={{
                                      background: "#d1fae5",
                                      padding: 8,
                                      borderRadius: 4,
                                      marginBottom: 8,
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#047857",
                                        fontWeight: 600,
                                      }}
                                    >
                                      🎉 100% COMPLETE
                                    </div>
                                    <div
                                      style={{ fontSize: 10, color: "#059669" }}
                                    >
                                      Completed: {formatDate(task.completedAt)}
                                    </div>
                                  </div>

                                  {/* Completed By */}
                                  <div style={{ marginBottom: 8 }}>
                                    <div
                                      style={{
                                        fontSize: 11,
                                        color: "#047857",
                                        fontWeight: 600,
                                        marginBottom: 4,
                                      }}
                                    >
                                      COMPLETED BY:
                                    </div>
                                    <div
                                      style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 4,
                                      }}
                                    >
                                      {task.assignedTo &&
                                      task.assignedTo.length > 0 ? (
                                        task.assignedTo.map((emp, idx) => (
                                          <span
                                            key={`${task._id}-completed-${
                                              emp?.employeeId ||
                                              emp?._id ||
                                              emp?.name ||
                                              idx
                                            }-${idx}`}
                                            style={{
                                              background: "#86efac",
                                              color: "#047857",
                                              padding: "2px 6px",
                                              borderRadius: 4,
                                              fontSize: 10,
                                            }}
                                          >
                                            {emp?.name || "Unknown"}
                                          </span>
                                        ))
                                      ) : (
                                        <span
                                          style={{
                                            fontSize: 10,
                                            color: "#6b7280",
                                            fontStyle: "italic",
                                          }}
                                        >
                                          No assignments
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Task History Button */}
                                  <div style={{ marginBottom: 8 }}>
                                    <button
                                      onClick={() => viewTaskHistory(task)}
                                      style={{
                                        background: "#6b7280",
                                        color: "white",
                                        border: "none",
                                        borderRadius: 4,
                                        padding: "4px 8px",
                                        fontSize: 10,
                                        cursor: "pointer",
                                      }}
                                    >
                                      📊 View History
                                    </button>
                                  </div>

                                  <div
                                    style={{ fontSize: 10, color: "#6b7280" }}
                                  >
                                    Original Due: {formatDate(task.dueDate)} |
                                    Priority: {task.priority}
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                </DragDropContext>
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: 10,
                textAlign: "right",
              }}
            >
              <button
                onClick={handleCloseDetails}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  cursor: "pointer",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600, background: "#fff" }}
          >
            <div
              className="modal-header"
              style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}
            >
              <h3
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#10b981",
                }}
              >
                <FaTasks style={{ marginRight: 8 }} />
                Create New Task
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowTaskModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createTask();
              }}
              style={{
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 15,
              }}
            >
              <input
                type="text"
                placeholder="Task Title *"
                value={newTask.title}
                onChange={(e) =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
                style={{
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                }}
              />

              <textarea
                placeholder="Task Description"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                rows={3}
                style={{
                  padding: 10,
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  resize: "vertical",
                }}
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value })
                  }
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                </select>

                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    border: "1px solid #d1d5db",
                    fontSize: 14,
                  }}
                />
              </div>

              {/* Task Points Section */}
              <div
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  padding: 15,
                }}
              >
                <h6
                  style={{
                    margin: "0 0 10px 0",
                    color: "#374151",
                    fontWeight: 600,
                  }}
                >
                  Task Points (Optional)
                </h6>

                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
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
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                    }}
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
                    style={{
                      flex: 1,
                      padding: 8,
                      borderRadius: 4,
                      border: "1px solid #d1d5db",
                      fontSize: 13,
                    }}
                  />
                  <button
                    type="button"
                    onClick={addTaskPoint}
                    disabled={!newTaskPoint.pointTitle}
                    style={{
                      background: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: 4,
                      padding: "8px 12px",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    Add
                  </button>
                </div>

                {newTask.taskPoints.length > 0 && (
                  <div style={{ maxHeight: 120, overflowY: "auto" }}>
                    {newTask.taskPoints.map((point, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          background: "#f9fafb",
                          padding: 8,
                          borderRadius: 4,
                          marginBottom: 4,
                        }}
                      >
                        <div style={{ fontSize: 13 }}>
                          <strong>{point.pointTitle}</strong>
                          {point.description && (
                            <span style={{ color: "#6b7280" }}>
                              {" "}
                              - {point.description}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTaskPoint(idx)}
                          style={{
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: 3,
                            padding: "2px 6px",
                            cursor: "pointer",
                            fontSize: 11,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Assignment Section */}
              {selectedProject.assignedEmployees &&
                selectedProject.assignedEmployees.length > 0 && (
                  <div
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: 15,
                    }}
                  >
                    <h6
                      style={{
                        margin: "0 0 10px 0",
                        color: "#374151",
                        fontWeight: 600,
                      }}
                    >
                      Assign to Team Members (Optional - can assign later)
                    </h6>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: 8,
                      }}
                    >
                      {selectedProject.assignedEmployees.map((emp) => (
                        <label
                          key={emp.employeeId}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            cursor: "pointer",
                            fontSize: 13,
                          }}
                        >
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
                          <span>
                            {emp.name} ({emp.role})
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              <button
                type="submit"
                disabled={addingTask}
                style={{
                  background: "#10b981",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 24px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontSize: 16,
                }}
              >
                {addingTask ? "Creating Task..." : "Create Task"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Edit Modal */}
      {showEditModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 500, background: "#fff" }}
          >
            <div
              className="modal-header"
              style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}
            >
              <h3
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#3b82f6",
                }}
              >
                <FaUser style={{ marginRight: 8 }} />
                Edit Task Assignment - {selectedTask.title}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              <div style={{ marginBottom: 15 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <h6
                    style={{
                      margin: 0,
                      color: "#374151",
                      fontWeight: 600,
                    }}
                  >
                    Assign to Team Members
                  </h6>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      fontStyle: "italic",
                    }}
                  >
                    {user &&
                    (user.role === "Manager" ||
                      user.subRole === "Team Lead" ||
                      user.role === "Admin")
                      ? "✓ You can add/remove assignments"
                      : "⚠️ View only - Contact Manager/Team Lead to modify"}
                  </span>
                </div>

                {/* Quick Action Buttons */}
                {user &&
                  (user.role === "Manager" ||
                    user.subRole === "Team Lead" ||
                    user.role === "Admin") &&
                  availableEmployees.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                      <button
                        onClick={() => {
                          const newAssignments = availableEmployees.map(
                            (emp) => ({
                              employeeId: emp.id,
                              name: emp.name,
                              email: emp.email,
                              role: emp.role,
                            })
                          );
                          setEditAssignment(newAssignments);
                        }}
                        style={{
                          background: "#3b82f6",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          padding: "4px 8px",
                          fontSize: 10,
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        ✓ Assign All
                      </button>
                      <button
                        onClick={() => setEditAssignment([])}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          borderRadius: 4,
                          padding: "4px 8px",
                          fontSize: 10,
                          cursor: "pointer",
                          fontWeight: 500,
                        }}
                      >
                        ✕ Remove All
                      </button>
                    </div>
                  )}

                {availableEmployees && availableEmployees.length > 0 ? (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: 8,
                    }}
                  >
                    {availableEmployees.map((emp) => (
                      <label
                        key={emp._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          padding: 8,
                          border: "1px solid #e5e7eb",
                          borderRadius: 6,
                          backgroundColor: editAssignment.some(
                            (assigned) => assigned.employeeId === emp.id
                          )
                            ? "#dbeafe"
                            : "#ffffff",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editAssignment.some(
                            (assigned) => assigned.employeeId === emp.id
                          )}
                          onChange={(e) =>
                            toggleEmployeeAssignment(emp, e.target.checked)
                          }
                          disabled={
                            !(
                              user &&
                              (user.role === "Manager" ||
                                user.subRole === "Team Lead" ||
                                user.role === "Admin")
                            )
                          }
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{emp.name}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            {emp.role}
                            {emp.subRole ? ` - ${emp.subRole}` : ""}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      color: "#6b7280",
                      fontStyle: "italic",
                      fontSize: 14,
                    }}
                  >
                    No team members available for assignment. Please ask the
                    Project Manager to assign team members to this project
                    first.
                  </p>
                )}
              </div>

              {/* Current Assignment Summary */}
              <div
                style={{
                  marginBottom: 20,
                  padding: 12,
                  background: "#f8fafc",
                  borderRadius: 6,
                }}
              >
                <h6
                  style={{
                    margin: "0 0 8px 0",
                    color: "#374151",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  Selected Assignments ({editAssignment.length})
                </h6>
                {editAssignment.length > 0 ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 8 }}
                  >
                    {editAssignment.map((emp, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#f0f9ff",
                          border: "1px solid #0ea5e9",
                          borderRadius: 6,
                          padding: "8px 12px",
                          fontSize: 13,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, color: "#0369a1" }}>
                            {emp.name}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            {emp.email} • {emp.role}
                          </div>
                        </div>
                        {user &&
                          (user.role === "Manager" ||
                            user.subRole === "Team Lead" ||
                            user.role === "Admin") && (
                            <button
                              onClick={() =>
                                removeEmployeeFromTask(emp.employeeId)
                              }
                              style={{
                                background: "#ef4444",
                                color: "white",
                                border: "none",
                                borderRadius: 4,
                                padding: "4px 8px",
                                fontSize: 10,
                                cursor: "pointer",
                                fontWeight: 500,
                              }}
                              title="Remove from assignment"
                            >
                              ✕ Remove
                            </button>
                          )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      fontStyle: "italic",
                    }}
                  >
                    No team members selected
                  </span>
                )}
              </div>

              <div
                style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}
              >
                <button
                  onClick={() => setShowEditModal(false)}
                  style={{
                    background: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontSize: 14,
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveAssignmentChanges}
                  disabled={
                    !(
                      user &&
                      (user.role === "Manager" ||
                        user.subRole === "Team Lead" ||
                        user.role === "Admin")
                    )
                  }
                  style={{
                    background:
                      user &&
                      (user.role === "Manager" ||
                        user.subRole === "Team Lead" ||
                        user.role === "Admin")
                        ? "#10b981"
                        : "#9ca3af",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    padding: "10px 20px",
                    fontWeight: 600,
                    cursor:
                      user &&
                      (user.role === "Manager" ||
                        user.subRole === "Team Lead" ||
                        user.role === "Admin")
                        ? "pointer"
                        : "not-allowed",
                    fontSize: 14,
                  }}
                  title={
                    !(
                      user &&
                      (user.role === "Manager" ||
                        user.subRole === "Team Lead" ||
                        user.role === "Admin")
                    )
                      ? "You don't have permission to modify assignments"
                      : "Save assignment changes"
                  }
                >
                  {user &&
                  (user.role === "Manager" ||
                    user.subRole === "Team Lead" ||
                    user.role === "Admin")
                    ? "Save Assignment"
                    : "View Only"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task History Modal */}
      {showTaskHistory && selectedTaskForHistory && (
        <div
          className="modal-overlay"
          onClick={() => setShowTaskHistory(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 700, background: "#fff" }}
          >
            <div
              className="modal-header"
              style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 10 }}
            >
              <h3
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 18,
                  color: "#3b82f6",
                }}
              >
                📊 Task Assignment History - {selectedTaskForHistory.title}
              </h3>
              <button
                className="modal-close"
                onClick={() => setShowTaskHistory(false)}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ padding: 20 }}>
              {/* Current Task Info */}
              <div
                style={{
                  marginBottom: 20,
                  padding: 16,
                  background: "#f8fafc",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px 0",
                    color: "#374151",
                    fontSize: 16,
                  }}
                >
                  Current Task Details
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div>
                    <strong style={{ fontSize: 12, color: "#6b7280" }}>
                      STATUS:
                    </strong>
                    <div
                      style={{
                        display: "inline-block",
                        marginLeft: 8,
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                        background:
                          selectedTaskForHistory.status === "Completed"
                            ? "#d1fae5"
                            : selectedTaskForHistory.status === "In Progress"
                            ? "#dbeafe"
                            : "#fef3c7",
                        color:
                          selectedTaskForHistory.status === "Completed"
                            ? "#065f46"
                            : selectedTaskForHistory.status === "In Progress"
                            ? "#1e40af"
                            : "#92400e",
                      }}
                    >
                      {selectedTaskForHistory.status}
                    </div>
                  </div>
                  <div>
                    <strong style={{ fontSize: 12, color: "#6b7280" }}>
                      PRIORITY:
                    </strong>
                    <span style={{ marginLeft: 8, fontSize: 12 }}>
                      {selectedTaskForHistory.priority}
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: 12, color: "#6b7280" }}>
                      DUE DATE:
                    </strong>
                    <span style={{ marginLeft: 8, fontSize: 12 }}>
                      {formatDate(selectedTaskForHistory.dueDate)}
                    </span>
                  </div>
                  <div>
                    <strong style={{ fontSize: 12, color: "#6b7280" }}>
                      PROGRESS:
                    </strong>
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: "#059669",
                        fontWeight: 600,
                      }}
                    >
                      {selectedTaskForHistory.progressPercentage || 0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Current Assignment */}
              <div style={{ marginBottom: 20 }}>
                <h5
                  style={{
                    margin: "0 0 12px 0",
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  👥 Currently Assigned To
                </h5>
                {selectedTaskForHistory.assignedTo &&
                selectedTaskForHistory.assignedTo.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedTaskForHistory.assignedTo.map((emp, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "#dbeafe",
                          border: "1px solid #bfdbfe",
                          borderRadius: 6,
                          padding: "8px 12px",
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#1e40af",
                          }}
                        >
                          {emp?.name || "Unknown"}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          {emp?.role || "Unknown"} • {emp?.email || "No email"}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      color: "#6b7280",
                      fontStyle: "italic",
                      fontSize: 14,
                    }}
                  >
                    No team members currently assigned
                  </p>
                )}
              </div>

              {/* Task Points Progress */}
              {selectedTaskForHistory.taskPoints &&
                selectedTaskForHistory.taskPoints.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <h5
                      style={{
                        margin: "0 0 12px 0",
                        color: "#374151",
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      ✅ Task Points Progress
                    </h5>
                    <div
                      style={{
                        background: "#f9fafb",
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: 12,
                      }}
                    >
                      {selectedTaskForHistory.taskPoints.map((point, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                            padding: 8,
                            background: point.isCompleted ? "#d1fae5" : "#fff",
                            borderRadius: 4,
                            border:
                              "1px solid " +
                              (point.isCompleted ? "#86efac" : "#e5e7eb"),
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              borderRadius: "50%",
                              background: point.isCompleted
                                ? "#10b981"
                                : "#e5e7eb",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {point.isCompleted && (
                              <span style={{ color: "white", fontSize: 10 }}>
                                ✓
                              </span>
                            )}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 500,
                                fontSize: 13,
                                textDecoration: point.isCompleted
                                  ? "line-through"
                                  : "none",
                                color: point.isCompleted
                                  ? "#6b7280"
                                  : "#374151",
                              }}
                            >
                              {point.pointTitle}
                            </div>
                            {point.description && (
                              <div style={{ fontSize: 11, color: "#6b7280" }}>
                                {point.description}
                              </div>
                            )}
                            {point.isCompleted && point.completedBy && (
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#059669",
                                  marginTop: 2,
                                }}
                              >
                                Completed by: {point.completedBy} on{" "}
                                {formatDate(point.completedAt)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Assignment History Timeline */}
              <div>
                <h5
                  style={{
                    margin: "0 0 12px 0",
                    color: "#374151",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  📈 Assignment History Timeline
                </h5>

                {/* Simulated assignment history - in real implementation, this would come from the backend */}
                <div
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: 6,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginBottom: 12,
                      paddingBottom: 12,
                      borderBottom: "1px solid #e5e7eb",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "#10b981",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      ✓
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#374151",
                        }}
                      >
                        Task Created
                      </div>
                      <div style={{ fontSize: 11, color: "#6b7280" }}>
                        Created by{" "}
                        {selectedTaskForHistory.assignedBy?.name || "Team Lead"}{" "}
                        on {formatDate(selectedTaskForHistory.createdAt)}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}
                      >
                        Initial status: Pending
                      </div>
                    </div>
                  </div>

                  {selectedTaskForHistory.assignedTo &&
                    selectedTaskForHistory.assignedTo.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          marginBottom: 12,
                          paddingBottom: 12,
                          borderBottom:
                            selectedTaskForHistory.status !== "Pending"
                              ? "1px solid #e5e7eb"
                              : "none",
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "#3b82f6",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "white",
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          👥
                        </div>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontWeight: 600,
                              fontSize: 13,
                              color: "#374151",
                            }}
                          >
                            Team Members Assigned
                          </div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            Assigned to:{" "}
                            {selectedTaskForHistory.assignedTo
                              .map((emp) => emp.name)
                              .join(", ")}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "#6b7280",
                              marginTop: 2,
                            }}
                          >
                            Status updated to:{" "}
                            {selectedTaskForHistory.assignedTo.length > 0
                              ? "In Progress"
                              : "Pending"}
                          </div>
                        </div>
                      </div>
                    )}

                  {selectedTaskForHistory.status === "Completed" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        🎉
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 13,
                            color: "#374151",
                          }}
                        >
                          Task Completed
                        </div>
                        <div style={{ fontSize: 11, color: "#6b7280" }}>
                          Completed on{" "}
                          {formatDate(selectedTaskForHistory.completedAt)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6b7280",
                            marginTop: 2,
                          }}
                        >
                          Final status: Completed • Progress: 100%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid #e5e7eb",
                paddingTop: 12,
                textAlign: "right",
              }}
            >
              <button
                onClick={() => setShowTaskHistory(false)}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Assignment Modal */}
      {showProjectAssignmentModal && selectedProjectForAssignment && (
        <div
          className="modal-overlay"
          onClick={() => setShowProjectAssignmentModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 600, background: "#fff" }}
          >
            <div
              className="modal-header"
              style={{ borderBottom: "1px solid #e5e7eb", paddingBottom: 15 }}
            >
              <h3
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 20,
                  color: "#1f2937",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <FaUser style={{ color: "#3b82f6" }} />
                Assign Employees to Project
              </h3>
              <p
                style={{
                  margin: "8px 0 0 0",
                  color: "#6b7280",
                  fontSize: 14,
                }}
              >
                Project: {selectedProjectForAssignment.projectId} -{" "}
                {selectedProjectForAssignment.clientName}
              </p>
              <button
                onClick={() => setShowProjectAssignmentModal(false)}
                style={{
                  position: "absolute",
                  top: 15,
                  right: 15,
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  cursor: "pointer",
                  color: "#6b7280",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 20 }}>
              {/* Currently Assigned Employees */}
              {selectedEmployeesForProject.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <h4
                    style={{ color: "#374151", fontSize: 16, marginBottom: 10 }}
                  >
                    Currently Assigned ({selectedEmployeesForProject.length})
                  </h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {selectedEmployeesForProject.map((emp, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#dbeafe",
                          color: "#1e40af",
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {emp.name} ({emp.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Employees */}
              <div>
                <h4
                  style={{ color: "#374151", fontSize: 16, marginBottom: 15 }}
                >
                  Select Employees to Assign
                </h4>

                {availableEmployees.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      color: "#6b7280",
                      padding: 20,
                      background: "#f9fafb",
                      borderRadius: 6,
                    }}
                  >
                    <FaUser size={24} style={{ marginBottom: 8 }} />
                    <p>No employees available</p>
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: 300,
                      overflowY: "auto",
                      border: "1px solid #e5e7eb",
                      borderRadius: 6,
                      padding: 10,
                    }}
                  >
                    {availableEmployees.map((employee) => (
                      <label
                        key={employee._id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 4,
                          cursor: "pointer",
                          marginBottom: 5,
                          background: selectedEmployeesForProject.some(
                            (emp) => emp.employeeId === employee._id
                          )
                            ? "#f0f9ff"
                            : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (
                            !selectedEmployeesForProject.some(
                              (emp) => emp.employeeId === employee._id
                            )
                          ) {
                            e.target.style.background = "#f9fafb";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (
                            !selectedEmployeesForProject.some(
                              (emp) => emp.employeeId === employee._id
                            )
                          ) {
                            e.target.style.background = "transparent";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployeesForProject.some(
                            (emp) => emp.employeeId === employee._id
                          )}
                          onChange={(e) =>
                            handleEmployeeToggleForProject(
                              employee,
                              e.target.checked
                            )
                          }
                          style={{ cursor: "pointer" }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: "#1f2937" }}>
                            {employee.name}
                          </div>
                          <div style={{ fontSize: 12, color: "#6b7280" }}>
                            {employee.role}
                            {employee.subRole ? ` - ${employee.subRole}` : ""}
                          </div>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            {employee.email}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div
              className="modal-footer"
              style={{
                padding: "15px 20px",
                borderTop: "1px solid #e5e7eb",
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
              }}
            >
              <button
                onClick={() => setShowProjectAssignmentModal(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #d1d5db",
                  background: "#f9fafb",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                onClick={assignEmployeesToProject}
                disabled={assigningEmployees}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "none",
                  background: assigningEmployees ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  cursor: assigningEmployees ? "not-allowed" : "pointer",
                  fontWeight: 500,
                }}
              >
                {assigningEmployees ? "Assigning..." : "Assign Employees"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Employee Tasks View Modal */}
      {showEmployeeTasksModal && selectedEmployeeForTasks && (
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
                  <FaUser style={{ marginRight: 8 }} />
                  Tasks Assigned to{" "}
                  {String(selectedEmployeeForTasks?.name || "Unknown Employee")}
                </h3>
                <p
                  style={{
                    margin: "4px 0 0 0",
                    color: "#6b7280",
                    fontSize: 14,
                  }}
                >
                  Employee ID:{" "}
                  {(() => {
                    const empId =
                      selectedEmployeeForTasks?.id ||
                      selectedEmployeeForTasks?._id;
                    if (typeof empId === "object" && empId !== null) {
                      return String(
                        empId._id || empId.id || empId.employeeId || "Unknown"
                      );
                    }
                    return String(empId || "Unknown");
                  })()}{" "}
                  | Role: {String(selectedEmployeeForTasks?.role || "Unknown")}
                </p>
              </div>
              <button
                className="modal-close"
                onClick={handleCloseEmployeeTasksModal}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body" style={{ padding: 24 }}>
              {loadingEmployeeTasks ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div className="modern-spinner">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                  </div>
                  <p style={{ marginTop: 16, color: "#6b7280" }}>
                    Loading employee tasks...
                  </p>
                </div>
              ) : (
                <>
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
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#f59e0b",
                        }}
                      >
                        {employeeTasks.Pending.length}
                      </div>
                      <div
                        style={{
                          color: "#92400e",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
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
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#3b82f6",
                        }}
                      >
                        {employeeTasks["In Progress"].length}
                      </div>
                      <div
                        style={{
                          color: "#1e40af",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
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
                        style={{
                          fontSize: 24,
                          fontWeight: 700,
                          color: "#10b981",
                        }}
                      >
                        {employeeTasks.Completed.length}
                      </div>
                      <div
                        style={{
                          color: "#047857",
                          fontSize: 14,
                          fontWeight: 500,
                        }}
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
                        <FaClock /> Pending ({employeeTasks.Pending.length})
                      </h4>
                      <div
                        className="task-list"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {employeeTasks.Pending.map((task) => (
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
                              Project: {task.projectId?.projectId || "Unknown"}{" "}
                              | Due: {formatDate(task.dueDate)}
                            </div>
                            {task.taskPoints && task.taskPoints.length > 0 && (
                              <div style={{ fontSize: 11, color: "#92400e" }}>
                                {
                                  task.taskPoints.filter((p) => p.isCompleted)
                                    .length
                                }
                                /{task.taskPoints.length} points completed
                              </div>
                            )}
                          </div>
                        ))}
                        {employeeTasks.Pending.length === 0 && (
                          <div
                            style={{
                              textAlign: "center",
                              color: "#6b7280",
                              fontSize: 14,
                              padding: 20,
                            }}
                          >
                            No pending tasks
                          </div>
                        )}
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
                        <FaPlay /> In Progress (
                        {employeeTasks["In Progress"].length})
                      </h4>
                      <div
                        className="task-list"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {employeeTasks["In Progress"].map((task) => (
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
                              Project: {task.projectId?.projectId || "Unknown"}{" "}
                              | Due: {formatDate(task.dueDate)}
                            </div>
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
                            {task.taskPoints && task.taskPoints.length > 0 && (
                              <div style={{ fontSize: 11, color: "#1e40af" }}>
                                {
                                  task.taskPoints.filter((p) => p.isCompleted)
                                    .length
                                }
                                /{task.taskPoints.length} points completed
                              </div>
                            )}
                          </div>
                        ))}
                        {employeeTasks["In Progress"].length === 0 && (
                          <div
                            style={{
                              textAlign: "center",
                              color: "#6b7280",
                              fontSize: 14,
                              padding: 20,
                            }}
                          >
                            No tasks in progress
                          </div>
                        )}
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
                        <FaCheckCircle /> Completed (
                        {employeeTasks.Completed.length})
                      </h4>
                      <div
                        className="task-list"
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        {employeeTasks.Completed.map((task) => (
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
                              Project: {task.projectId?.projectId || "Unknown"}{" "}
                              | Completed: {formatDate(task.completedAt)}
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
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
                          </div>
                        ))}
                        {employeeTasks.Completed.length === 0 && (
                          <div
                            style={{
                              textAlign: "center",
                              color: "#6b7280",
                              fontSize: 14,
                              padding: 20,
                            }}
                          >
                            No completed tasks
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Task History Dashboard Modal */}
      {showTaskHistoryDashboard && (
        <div className="modal-overlay">
          <div className="modal-content task-history-modal">
            <div className="modal-header">
              <h2>
                <FaClock className="modal-icon" />
                Task History Dashboard
              </h2>
              <button
                className="modal-close"
                onClick={handleCloseTaskHistoryDashboard}
              >
                <FaTimes />
              </button>
            </div>

            <div className="task-history-dashboard">
              {/* Filters Section */}
              <div className="history-filters">
                <div className="filter-row">
                  <div className="filter-group">
                    <label>Search:</label>
                    <input
                      type="text"
                      placeholder="Search tasks, projects, or users..."
                      value={historySearchTerm}
                      onChange={(e) => setHistorySearchTerm(e.target.value)}
                      className="filter-input"
                    />
                  </div>
                  <div className="filter-group">
                    <label>Time Period:</label>
                    <select
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      className="filter-select"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                    </select>
                  </div>
                </div>
                <div className="history-stats">
                  <span className="stat-item">
                    Total Entries: {filteredTaskHistory.length}
                  </span>
                </div>
              </div>

              {/* History Content */}
              <div className="history-content">
                {loadingTaskHistory ? (
                  <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading task history...</p>
                  </div>
                ) : filteredTaskHistory.length === 0 ? (
                  <div className="empty-state">
                    <FaInfoCircle size={48} color="#6b7280" />
                    <h3>No task history found</h3>
                    <p>No task status changes match your current filters.</p>
                  </div>
                ) : (
                  <div className="history-timeline">
                    {filteredTaskHistory.map((entry, index) => (
                      <div key={index} className="history-entry">
                        <div className="history-marker">
                          <div
                            className={`status-dot ${(
                              entry?.newStatus || "unknown"
                            )
                              .toLowerCase()
                              .replace(" ", "-")}`}
                          ></div>
                        </div>
                        <div className="history-content-card">
                          <div className="history-header">
                            <div className="history-title">
                              <strong>
                                {entry?.taskTitle || "Unknown Task"}
                              </strong>
                              <span className="project-badge">
                                {entry?.projectTitle || "Unknown Project"}
                              </span>
                            </div>
                            <div className="history-timestamp">
                              {entry?.timestamp
                                ? new Date(entry.timestamp).toLocaleString()
                                : "Unknown time"}
                            </div>
                          </div>
                          <div className="history-body">
                            <div className="status-change">
                              <span
                                className={`status-badge ${(
                                  entry?.previousStatus || "unknown"
                                )
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {entry?.previousStatus || "Unknown"}
                              </span>
                              <FaArrowDown className="arrow-icon" />
                              <span
                                className={`status-badge ${(
                                  entry?.newStatus || "unknown"
                                )
                                  .toLowerCase()
                                  .replace(" ", "-")}`}
                              >
                                {entry?.newStatus || "Unknown"}
                              </span>
                            </div>
                            <div className="changed-by">
                              <FaUser size={12} />
                              <span>
                                {entry?.changedBy?.name || "Unknown"} (
                                {entry?.changedBy?.role || "Unknown"})
                              </span>
                            </div>
                            {entry?.reason && (
                              <div className="history-reason">
                                <strong>Reason:</strong> {entry.reason}
                              </div>
                            )}
                            {entry?.assignedEmployees &&
                              entry.assignedEmployees.length > 0 && (
                                <div className="assigned-employees">
                                  <strong>Assigned to:</strong>
                                  {entry.assignedEmployees.map(
                                    (emp, empIndex) => (
                                      <span
                                        key={empIndex}
                                        className="employee-tag"
                                      >
                                        {emp?.name || "Unknown"}
                                      </span>
                                    )
                                  )}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
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

export default TeamLeadDashboard;
