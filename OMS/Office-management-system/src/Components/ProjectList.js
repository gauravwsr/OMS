import "./ProjectListNew.css";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../Firebase";
// import Navbar from "./Navbar";
import {
  FiBell,
  FiMenu,
  FiChevronDown,
  FiChevronUp,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiEye,
  FiEdit,
  FiEdit2,
  FiMoreVertical,
  FiUser,
  FiCalendar,
  FiDollarSign,
  FiClock,
  FiBarChart2,
  FiCheckCircle,
  FiPlay,
  FiPause,
  FiAlertCircle,
  FiGrid,
  FiList,
  FiTrendingUp,
  FiFolder,
  FiX,
} from "react-icons/fi";
import SearchBar from "./Search-bar/SearchBar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "sonner";

export default function ProjectList() {
  const [showKanban, setShowKanban] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCards, setExpandedCards] = useState({});
  const [currentMonth, setCurrentMonth] = useState("Aug 2024");
  const [date, setDate] = useState(new Date());
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [viewMode, setViewMode] = useState("grid");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

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
    await fetchProjects();
    setRefreshing(false);
  };

  // Function to fetch projects from API
  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get JWT token for authentication
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found. Please login again.");
      }

      // Fetch projects from local database
      const response = await fetch("http://localhost:5001/api/client-projects", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Project List - API Response:", result);

      const projectsData = Array.isArray(result)
        ? result
        : result.data || result.projects || [];

      // Fetch real-time task counts for each project
      const projectsWithDetails = await Promise.all(
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

            let taskCounts = {
              total: 0,
              completed: 0,
              inProgress: 0,
              pending: 0,
            };
            let progress = 0;

            if (taskCountsResponse.ok) {
              const taskResult = await taskCountsResponse.json();
              if (taskResult.success && taskResult.data) {
                const tasks = taskResult.data;
                taskCounts = {
                  total: tasks.length,
                  completed: tasks.filter((task) => task.status === "Completed")
                    .length,
                  inProgress: tasks.filter(
                    (task) => task.status === "In Progress"
                  ).length,
                  pending: tasks.filter((task) => task.status === "Pending")
                    .length,
                };

                progress =
                  taskCounts.total > 0
                    ? Math.round(
                        (taskCounts.completed / taskCounts.total) * 100
                      )
                    : 0;
              }
            }

            return {
              id: project._id,
              name:
                project.projectName || project.clientName || "Untitled Project",
              title:
                project.projectName || project.clientName || "Untitled Project",
              client: project.clientName || project.client || "Unknown Client",
              clientName:
                project.clientName || project.client || "Unknown Client",
              description:
                project.description ||
                `Project: ${project.projectName || "Untitled"} | Client: ${
                  project.clientName || "Unknown"
                }`,
              status: project.status || "planning",
              priority: project.priority || "medium",
              progress: progress,
              budget: project.budget || 0,
              spent: project.spent || 0,
              startDate: project.startDate || project.createdAt,
              endDate: project.endDate || project.deadline,
              dueDate: project.endDate || project.deadline,
              teamMembers:
                project.teamSize || project.assignedEmployees?.length || 0,
              projectManager:
                project.projectManager ||
                project.assignedTeamLead ||
                "Not assigned",
              technologies: project.technologies || project.techStack || [],
              completedTasks: taskCounts.completed,
              pendingTasks: taskCounts.pending + taskCounts.inProgress,
              overdueTasks: 0, // Calculate based on due dates if needed
              projectId: project.projectId || project._id,
              projectPassword: project.projectPassword || "N/A",
              amount: project.finalAmount || project.budget || 0,
              createdAt: project.createdAt || new Date().toISOString(),
              updatedAt:
                project.updatedAt ||
                project.createdAt ||
                new Date().toISOString(),
              assignedEmployees: project.assignedEmployees || [],
              _id: project._id,
            };
          } catch (taskError) {
            console.warn(
              `Failed to fetch tasks for project ${project._id}:`,
              taskError
            );
            return {
              id: project._id,
              name:
                project.projectName || project.clientName || "Untitled Project",
              title:
                project.projectName || project.clientName || "Untitled Project",
              client: project.clientName || project.client || "Unknown Client",
              clientName:
                project.clientName || project.client || "Unknown Client",
              description:
                project.description ||
                `Project: ${project.projectName || "Untitled"} | Client: ${
                  project.clientName || "Unknown"
                }`,
              status: project.status || "planning",
              priority: project.priority || "medium",
              progress: 0,
              budget: project.budget || 0,
              spent: project.spent || 0,
              startDate: project.startDate || project.createdAt,
              endDate: project.endDate || project.deadline,
              dueDate: project.endDate || project.deadline,
              teamMembers:
                project.teamSize || project.assignedEmployees?.length || 0,
              projectManager:
                project.projectManager ||
                project.assignedTeamLead ||
                "Not assigned",
              technologies: project.technologies || project.techStack || [],
              completedTasks: 0,
              pendingTasks: 0,
              overdueTasks: 0,
              projectId: project.projectId || project._id,
              projectPassword: project.projectPassword || "N/A",
              amount: project.finalAmount || project.budget || 0,
              createdAt: project.createdAt || new Date().toISOString(),
              updatedAt:
                project.updatedAt ||
                project.createdAt ||
                new Date().toISOString(),
              assignedEmployees: project.assignedEmployees || [],
              _id: project._id,
            };
          }
        })
      );

      console.log("Project List - Projects with details:", projectsWithDetails);
      setProjects(projectsWithDetails);
      setFilteredProjects(projectsWithDetails);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setError(err.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    let filtered = projects;

    // Apply search filter
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((project) => {
        return (
          (project.title &&
            project.title.toLowerCase().includes(searchLower)) ||
          (project.description &&
            project.description.toLowerCase().includes(searchLower)) ||
          (project.projectId &&
            project.projectId.toLowerCase().includes(searchLower)) ||
          (project.status &&
            project.status.toLowerCase().includes(searchLower)) ||
          (project.clientName &&
            project.clientName.toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (project) =>
          project.status &&
          project.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (project) =>
          project.priority &&
          project.priority.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    setFilteredProjects(filtered);
  }, [searchTerm, projects, statusFilter, priorityFilter]);

  const toggleCardExpanded = (index) => {
    setExpandedCards((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleViewDetails = () => setShowKanban(true);
  const handleCloseKanban = () => setShowKanban(false);

  const initialTasks = {
    todo: [
      {
        id: 1,
        title: "Home Page Development",
        description: "Create responsive home page with all sections",
        dueDate: "12 - Oct - 2025",
        assignedTo: "UI Team",
        assigneeId: "UI001",
        subtasks: [
          { id: "home-1", text: "Design hero section", checked: false },
          { id: "home-2", text: "Implement navigation", checked: false },
          { id: "home-3", text: "Add footer", checked: false },
        ],
      },
    ],
    pending: [],
    inProgress: [],
    completed: [],
  };

  const [tasks, setTasks] = useState(initialTasks);

  const prevMonth = () => setCurrentMonth("Jul 2024");
  const nextMonth = () => setCurrentMonth("Sep 2024");

  const KanbanBoard = () => {
    const [kanbanTasks, setKanbanTasks] = useState(initialTasks);
    const [draggedTask, setDraggedTask] = useState(null);
    const [draggedColumn, setDraggedColumn] = useState(null);
    const [selectedTasks, setSelectedTasks] = useState([]);
    const [subtaskCheckedState, setSubtaskCheckedState] = useState({});

    useEffect(() => {
      const initialState = {};
      Object.keys(initialTasks).forEach((column) => {
        initialTasks[column].forEach((task) => {
          if (task.subtasks) {
            task.subtasks.forEach((subtask) => {
              initialState[`${task.id}_${subtask.id}`] =
                subtask.checked || false;
            });
          }
        });
      });
      setSubtaskCheckedState(initialState);
    }, []);

    const handleTaskSelect = (taskId, column) => {
      setSelectedTasks((prev) => {
        const taskKey = `${column}_${taskId}`;
        if (prev.includes(taskKey)) {
          return prev.filter((id) => id !== taskKey);
        } else {
          return [...prev, taskKey];
        }
      });
    };

    const handleSelectAll = (column) => {
      const columnTasks = kanbanTasks[column] || [];
      const allTaskKeys = columnTasks.map((task) => `${column}_${task.id}`);

      setSelectedTasks((prev) => {
        if (allTaskKeys.every((key) => prev.includes(key))) {
          return prev.filter((key) => !key.startsWith(`${column}_`));
        }
        return [...new Set([...prev, ...allTaskKeys])];
      });
    };

    const handleDragStart = (e, task, column) => {
      setDraggedTask(task);
      setDraggedColumn(column);
      e.dataTransfer.effectAllowed = "move";
      const ghostElement = document.createElement("div");
      ghostElement.classList.add("drag-ghost");
      ghostElement.textContent = task.title;
      document.body.appendChild(ghostElement);
      e.dataTransfer.setDragImage(ghostElement, 0, 0);
      setTimeout(() => {
        ghostElement.remove();
      }, 0);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e, targetColumn) => {
      e.preventDefault();

      if (!draggedTask || !draggedColumn) return;
      if (draggedColumn === targetColumn) return;

      const updatedTasks = { ...kanbanTasks };
      updatedTasks[draggedColumn] = updatedTasks[draggedColumn].filter(
        (task) => task.id !== draggedTask.id
      );
      updatedTasks[targetColumn] = [
        ...updatedTasks[targetColumn],
        { ...draggedTask, status: targetColumn },
      ];
      setKanbanTasks(updatedTasks);
      setDraggedTask(null);
      setDraggedColumn(null);
    };

    const columnTitles = {
      todo: "To Do",
      pending: "Pending",
      inProgress: "In Progress",
      completed: "Completed",
    };

    const handleDeleteSelected = () => {
      if (selectedTasks.length === 0) return;

      const updatedTasks = { ...kanbanTasks };

      selectedTasks.forEach((taskKey) => {
        const [column, taskId] = taskKey.split("_");
        if (updatedTasks[column]) {
          updatedTasks[column] = updatedTasks[column].filter(
            (task) => task.id && String(task.id) !== String(taskId)
          );
        }
      });

      setKanbanTasks(updatedTasks);
      setSelectedTasks([]);
      toast.success("Tasks deleted successfully");
    };

    const handleToggleSubtask = (taskId, subtaskId) => {
      const key = `${taskId}_${subtaskId}`;
      setSubtaskCheckedState((prev) => ({
        ...prev,
        [key]: !prev[key],
      }));
    };

    const handleSubmitSelectedTasks = () => {
      if (selectedTasks.length === 0) {
        toast.info("No tasks selected");
        return;
      }

      const todoTaskKeys = selectedTasks.filter((taskKey) =>
        taskKey.startsWith("todo_")
      );

      if (todoTaskKeys.length === 0) {
        toast.info("No 'todo' tasks selected");
        return;
      }

      const updatedTasks = { ...kanbanTasks };
      const newPendingTasks = [];

      todoTaskKeys.forEach((taskKey) => {
        const taskId = taskKey.split("_")[1];

        if (!updatedTasks.todo) {
          updatedTasks.todo = [];
          return;
        }

        const taskIndex = updatedTasks.todo.findIndex(
          (task) => task && task.id && String(task.id) === String(taskId)
        );

        if (taskIndex !== -1) {
          const task = updatedTasks.todo[taskIndex];

          if (task.subtasks && task.subtasks.length > 0) {
            const checkedSubtasks = task.subtasks.filter(
              (subtask) => subtaskCheckedState[`${task.id}_${subtask.id}`]
            );

            if (checkedSubtasks.length > 0) {
              const newTask = {
                ...task,
                id: `pending_${Date.now()}_${Math.random()
                  .toString(36)
                  .substring(2, 9)}`,
                subtasks: checkedSubtasks.map((subtask) => ({
                  ...subtask,
                  checked: true,
                })),
              };
              newPendingTasks.push(newTask);
            } else {
              toast.warning(`Task "${task.title}" has no checked subtasks`);
            }
          } else {
            const newTask = {
              ...task,
              id: `pending_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 9)}`,
            };
            newPendingTasks.push(newTask);
          }
        }
      });

      if (newPendingTasks.length === 0) {
        toast.info("No tasks were moved to pending");
        return;
      }

      if (!updatedTasks.pending) {
        updatedTasks.pending = [];
      }

      updatedTasks.pending = [...updatedTasks.pending, ...newPendingTasks];
      setKanbanTasks(updatedTasks);
      toast.success(`${newPendingTasks.length} task(s) moved to pending`);
      setSelectedTasks([]);
    };

    return (
      <div className="kanban-modal">
        <div className="kanban-container">
          <div className="kanban-header">
            <h2>Task Management</h2>
            <button className="close-kanban-btn" onClick={handleCloseKanban}>
              ×
            </button>
          </div>
          <div className="app-header">
            <div className="title-section">
              <h2>TO DO List</h2>
            </div>
            <TaskScheduler setTasks={setKanbanTasks} />
          </div>
          <div className="month-selector">
            <button className="month-nav" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </button>
            <div className="current-month">
              <Calendar size={16} />
              <span>{currentMonth}</span>
            </div>
            <button className="month-nav" onClick={nextMonth}>
              <ChevronRight size={16} />
            </button>
          </div>

          {selectedTasks.length > 0 && (
            <div className="bulk-actions">
              <span>{selectedTasks.length} task(s) selected</span>
              <button
                className="submit-selected-btn"
                onClick={handleSubmitSelectedTasks}
                style={{
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  marginRight: "10px",
                }}
              >
                Submit Selected to Pending
              </button>
              <button
                className="delete-selected-btn"
                onClick={handleDeleteSelected}
              >
                <Trash2 size={16} />
                Delete Selected
              </button>
            </div>
          )}

          <div className="kanban-board">
            {Object.keys(columnTitles).map((column) => {
              const columnTasks = kanbanTasks[column] || [];
              const allSelected =
                columnTasks.length > 0 &&
                columnTasks.every((task) =>
                  selectedTasks.includes(`${column}_${task.id}`)
                );

              return (
                <div
                  key={column}
                  className="kanban-column"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column)}
                >
                  <div className="column-header">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={() => handleSelectAll(column)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span>{columnTitles[column]}</span>
                    <span className="task-count">{columnTasks.length}</span>
                  </div>

                  <div className="column-content">
                    {columnTasks.map((task) => {
                      const taskKey = `${column}_${task.id}`;
                      const isSelected = selectedTasks.includes(taskKey);

                      return (
                        <div
                          key={task.id}
                          className={`task-card ${
                            isSelected ? "selected" : ""
                          }`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, column)}
                        >
                          <div className="task-header">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTaskSelect(task.id, column)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="task-title">TASK: {task.title}</div>
                          </div>
                          <div className="task-content">{task.description}</div>
                          {task.subtasks && task.subtasks.length > 0 && (
                            <div className="subtasks-list">
                              {task.subtasks.map((subtask) => (
                                <div key={subtask.id} className="subtask-item">
                                  <input
                                    type="checkbox"
                                    className="subtask-checkbox"
                                    checked={
                                      subtaskCheckedState[
                                        `${task.id}_${subtask.id}`
                                      ] || false
                                    }
                                    onChange={() =>
                                      handleToggleSubtask(task.id, subtask.id)
                                    }
                                  />
                                  <span className="subtask-bullet">•</span>
                                  <span>{subtask.text}</span>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="task-meta">
                            <div className="meta-item">
                              <span className="meta-label">Due Date:</span>
                              <span className="meta-value">{task.dueDate}</span>
                            </div>
                            <div className="meta-item">
                              <span className="meta-label">Assigned To:</span>
                              <div className="assignee">
                                <span className="bullet">•</span>
                                <span>{task.assignedTo}</span>
                                <span className="bullet">•</span>
                                <span>{task.assigneeId}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const TaskScheduler = ({ setTasks }) => {
    const [showPopup, setShowPopup] = useState(false);
    const [newTask, setNewTask] = useState({
      title: "",
      description: "",
      dueDate: new Date(),
      time: "12:00",
    });

    const [subtasks, setSubtasks] = useState([]);
    const [newSubtaskText, setNewSubtaskText] = useState("");

    const handleTaskChange = (e) => {
      const { name, value } = e.target;
      setNewTask((prev) => ({
        ...prev,
        [name]: value,
      }));
    };

    const handleDateChange = (date) => {
      setNewTask((prev) => ({
        ...prev,
        dueDate: date,
      }));
    };

    const handleAddSubtask = () => {
      if (newSubtaskText.trim() !== "") {
        const newSubtask = {
          id: Date.now(),
          text: newSubtaskText,
          checked: false,
        };
        setSubtasks([...subtasks, newSubtask]);
        setNewSubtaskText("");
      }
    };

    const handleTaskSubmit = () => {
      if (!newTask.title) {
        alert("Please enter a task title");
        return;
      }

      const formattedDate = newTask.dueDate
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
        .replace(/\s/g, " ");

      const newTaskWithSubtasks = {
        id: Date.now() + Math.random(),
        title: newTask.title,
        description: newTask.description,
        dueDate: formattedDate,
        time: newTask.time,
        assignedTo: "Unassigned",
        assigneeId: "ID" + Math.floor(Math.random() * 1000000),
        subtasks: subtasks,
      };

      setTasks((prev) => ({
        ...prev,
        todo: [...prev.todo, newTaskWithSubtasks],
      }));

      setNewTask({
        title: "",
        description: "",
        dueDate: new Date(),
        time: "12:00",
      });
      setSubtasks([]);
      setNewSubtaskText("");
      setShowPopup(false);
    };

    return (
      <>
        <div className="add-task-btn">
          <button onClick={() => setShowPopup(true)}>
            <Plus size={18} />
            <span>Add New Task</span>
          </button>
        </div>

        {showPopup && (
          <div className="popup-overlay">
            <div className="schedule-task-container">
              <div className="popup-header">
                <h2>Add New Task</h2>
                <button
                  className="close-popup-btn"
                  onClick={() => setShowPopup(false)}
                >
                  ×
                </button>
              </div>

              <div className="form-group">
                <label>Task Title :</label>
                <input
                  type="text"
                  name="title"
                  value={newTask.title}
                  onChange={handleTaskChange}
                  placeholder="Enter main task title"
                />
              </div>

              <div className="form-group">
                <label>Description:</label>
                <textarea
                  name="description"
                  value={newTask.description}
                  onChange={handleTaskChange}
                  placeholder="Enter task description"
                  rows={3}
                  className="task-textarea"
                />
              </div>

              <div className="subtasks-container">
                <h3>Subtasks</h3>

                <div className="add-subtask-container">
                  <input
                    type="text"
                    value={newSubtaskText}
                    onChange={(e) => setNewSubtaskText(e.target.value)}
                    placeholder="Enter subtask"
                    className="subtask-input"
                  />
                  <button
                    className="add-subtask-btn"
                    onClick={handleAddSubtask}
                  >
                    Add Subtask
                  </button>
                </div>

                {subtasks.map((task) => (
                  <div key={task.id} className="subtask-item">
                    <div className="subtask-title">
                      <input
                        type="checkbox"
                        className="subtask-checkbox"
                        checked={task.checked}
                        onChange={() => {
                          setSubtasks(
                            subtasks.map((t) =>
                              t.id === task.id
                                ? { ...t, checked: !t.checked }
                                : t
                            )
                          );
                        }}
                      />
                      <span>{task.text}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label>Due Date:</label>
                <div className="date-input-container">
                  <DatePicker
                    selected={newTask.dueDate}
                    onChange={handleDateChange}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select Due Date"
                  />
                  <span className="calendar-icon">📅</span>
                </div>
              </div>

              <div className="buttons">
                <button
                  className="cancel-button"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
                <button className="save-button" onClick={handleTaskSubmit}>
                  Save Task
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  const MobileView = () => {
    if (loading) {
      return (
        <div className="project-list-container mobile">
          <div className="loading-container">
            <FiRefreshCw className="loading-spinner" />
            <p>Loading projects...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="project-list-container mobile">
          <div className="error-container">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              <FiRefreshCw /> Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="project-list-container mobile">
        {/* Mobile Header */}
        <div className="mobile-header">
          <h1 className="page-title">
            <FiFolder className="title-icon" />
            Projects
          </h1>
          <div className="mobile-actions">
            <button
              onClick={fetchProjects}
              className="action-btn refresh-btn"
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? "spinning" : ""} />
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="mobile-search">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Mobile Filters */}
        <div className="mobile-filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Mobile Stats */}
        <div className="mobile-stats">
          <div className="stat-item">
            <span className="stat-number">{filteredProjects.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {
                filteredProjects.filter(
                  (p) => p.status?.toLowerCase() === "active"
                ).length
              }
            </span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {
                filteredProjects.filter(
                  (p) => p.status?.toLowerCase() === "completed"
                ).length
              }
            </span>
            <span className="stat-label">Done</span>
          </div>
        </div>

        {/* Mobile Projects List */}
        <div className="mobile-projects">
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <FiFolder className="empty-icon" />
              <h3>No projects found</h3>
              <p>Try adjusting your search</p>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <div key={project._id || index} className="mobile-project-card">
                <div className="mobile-card-header">
                  <div className="project-title-section">
                    <h3 className="project-title">
                      {project.title || "Untitled"}
                    </h3>
                    <span className="project-id">
                      #{project.projectId || "N/A"}
                    </span>
                  </div>
                  <span
                    className={`status-badge ${
                      project.status?.toLowerCase() || "unknown"
                    }`}
                  >
                    {project.status || "Unknown"}
                  </span>
                </div>

                <div className="mobile-card-body">
                  <p className="project-description">
                    {project.description || "No description"}
                  </p>

                  <div className="mobile-details">
                    <div className="detail-row">
                      <FiUser className="detail-icon" />
                      <span>{project.clientName || "No client"}</span>
                    </div>
                    <div className="detail-row">
                      <FiCalendar className="detail-icon" />
                      <span>
                        {project.dueDate
                          ? new Date(project.dueDate).toLocaleDateString()
                          : "No due date"}
                      </span>
                    </div>
                  </div>

                  <div className="mobile-progress">
                    <div className="progress-header">
                      <span>Progress</span>
                      <span>{project.progress || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="mobile-card-footer">
                  <div className="task-summary">
                    <span className="task-count completed">
                      <FiCheckCircle /> {project.completedTasks || 0}
                    </span>
                    <span className="task-count pending">
                      <FiClock /> {project.pendingTasks || 0}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="view-btn"
                  >
                    <FiEye />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Mobile Project Details Modal - Same as desktop */}
        {selectedProject && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedProject(null)}
          >
            <div
              className="modal-content mobile"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{selectedProject.title}</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="close-btn"
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="project-overview">
                  <div className="overview-section">
                    <h3>Project Information</h3>
                    <div className="info-list">
                      <div className="info-item">
                        <label>Project ID:</label>
                        <span>{selectedProject.projectId || "N/A"}</span>
                      </div>
                      <div className="info-item">
                        <label>Client:</label>
                        <span>{selectedProject.clientName || "N/A"}</span>
                      </div>
                      <div className="info-item">
                        <label>Status:</label>
                        <span
                          className={`status-badge ${selectedProject.status?.toLowerCase()}`}
                        >
                          {selectedProject.status || "Unknown"}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Budget:</label>
                        <span>${selectedProject.budget || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="overview-section">
                    <h3>Description</h3>
                    <p>
                      {selectedProject.description ||
                        "No description available"}
                    </p>
                  </div>

                  <div className="overview-section">
                    <h3>Tasks</h3>
                    <div className="mobile-task-summary">
                      <div className="summary-item">
                        <FiCheckCircle className="completed" />
                        <span>
                          {selectedProject.completedTasks || 0} Completed
                        </span>
                      </div>
                      <div className="summary-item">
                        <FiClock className="pending" />
                        <span>{selectedProject.pendingTasks || 0} Pending</span>
                      </div>
                      <div className="summary-item">
                        <FiAlertCircle className="overdue" />
                        <span>{selectedProject.overdueTasks || 0} Overdue</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedProject(null)}
                >
                  Close
                </button>
                <button className="btn btn-primary">
                  <FiEdit2 /> Edit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );

    if (error) {
      return (
        <div className="mobile-container">
          <div className="error-message">Error: {error}</div>
        </div>
      );
    }

    return (
      <div className="mobile-container">
        <div className="mobile-header">
          {/* <button className="mobile-menu-btn">
            <FiMenu size={24} />
          </button> */}
          <div className="mobile-header-right">
            <button className="mobile-notification-btn">
              <FiBell size={20} />
            </button>
            <div className="mobile-avatar">
              <span>HM</span>
            </div>
          </div>
        </div>
        <div className="mobile-project-header">
          <h1 className="mobile-project-heading">Project</h1>
        </div>
        <div className="mobile-project-content">
          <div className="mobile-list-header">
            <h2 className="mobile-list-title">Project List</h2>
            <div className="mobile-date-display">
              <Calendar size={14} className="mobile-calendar-icon" />
              <span>07 Aug, 2024</span>
            </div>
          </div>
          <div className="mobile-cards-container">
            {filteredProjects.length > 0 ? (
              filteredProjects.map((project, index) => (
                <div key={project.id} className="mobile-project-card">
                  <div className="mobile-card-header">
                    <input type="checkbox" className="mobile-task-checkbox" />
                    <p className="mobile-card-text">{project.title}</p>
                  </div>
                  <div
                    className="mobile-card-footer"
                    onClick={() => toggleCardExpanded(index)}
                  >
                    <span className="mobile-card-date">{project.dueDate}</span>
                    {expandedCards[index] ? (
                      <FiChevronUp size={18} />
                    ) : (
                      <FiChevronDown size={18} />
                    )}
                  </div>
                  {expandedCards[index] && (
                    <div className="mobile-card-expanded">
                      <div className="meeting-details-grid">
                        <div className="meeting-detail-item">
                          <span className="detail-label">Description</span>
                          <span className="detail-value">
                            {project.description}
                          </span>
                        </div>
                        <div className="meeting-detail-item">
                          <span className="detail-label">Project ID</span>
                          <span className="detail-value">
                            {project.projectId}
                          </span>
                        </div>
                        <div className="meeting-detail-item">
                          <span className="detail-label">Password</span>
                          <span className="detail-value">
                            {project.projectPassword}
                          </span>
                        </div>
                        <div className="meeting-detail-item">
                          <span className="detail-label">Status</span>
                          <span className="detail-value">{project.status}</span>
                        </div>
                        <div className="meeting-detail-item">
                          <span className="detail-label">Amount</span>
                          <span className="detail-value">
                            ₹{project.amount}
                          </span>
                        </div>
                        <div className="meeting-detail-item">
                          <span className="detail-label">Created At</span>
                          <span className="detail-value">
                            {new Date(project.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        className="view-details-btn"
                        onClick={handleViewDetails}
                      >
                        View Details
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="no-projects-message">
                {searchTerm
                  ? "No projects match your search"
                  : "No projects found"}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const DesktopView = () => {
    if (loading) {
      return (
        <div className="project-list-container">
          <div className="loading-container">
            <FiRefreshCw className="loading-spinner" />
            <p>Loading projects...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="project-list-container">
          <div className="error-container">
            <p>Error: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-btn"
            >
              <FiRefreshCw /> Retry
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="project-list-container">
        {/* Header Section */}
        <div className="project-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                <FiFolder className="title-icon" />
                Project Dashboard
              </h1>
              <p className="page-subtitle">
                Manage and monitor your projects in real-time
              </p>
            </div>
            <div className="header-actions">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`action-btn ${autoRefresh ? "active" : ""}`}
                title={
                  autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"
                }
              >
                <FiRefreshCw className={refreshing ? "spinning" : ""} />
                {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
              </button>
              <button
                onClick={fetchProjects}
                className="action-btn refresh-btn"
                disabled={refreshing}
                title="Refresh projects"
              >
                <FiRefreshCw className={refreshing ? "spinning" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-section">
          <div className="search-container">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search projects by name, ID, client..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-container">
            <div className="filter-group">
              <FiFilter className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="view-toggle">
              <button
                onClick={() => setViewMode("grid")}
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                title="Grid view"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                title="List view"
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-icon total">
              <FiFolder />
            </div>
            <div className="stat-content">
              <div className="stat-number">{filteredProjects.length}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon active">
              <FiPlay />
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {
                  filteredProjects.filter(
                    (p) => p.status?.toLowerCase() === "active"
                  ).length
                }
              </div>
              <div className="stat-label">Active</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon completed">
              <FiCheckCircle />
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {
                  filteredProjects.filter(
                    (p) => p.status?.toLowerCase() === "completed"
                  ).length
                }
              </div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon progress">
              <FiClock />
            </div>
            <div className="stat-content">
              <div className="stat-number">
                {Math.round(
                  filteredProjects.reduce(
                    (acc, p) => acc + (p.progress || 0),
                    0
                  ) / filteredProjects.length
                ) || 0}
                %
              </div>
              <div className="stat-label">Avg Progress</div>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        <div className={`projects-container ${viewMode}`}>
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <FiFolder className="empty-icon" />
              <h3>No projects found</h3>
              <p>Try adjusting your search criteria or filters</p>
            </div>
          ) : (
            filteredProjects.map((project, index) => (
              <div key={project._id || index} className="project-card">
                <div className="project-card-header">
                  <div className="project-title-section">
                    <h3 className="project-title">
                      {project.title || "Untitled Project"}
                    </h3>
                    <span className="project-id">
                      #{project.projectId || "N/A"}
                    </span>
                  </div>
                  <div className="project-status-section">
                    <span
                      className={`status-badge ${
                        project.status?.toLowerCase() || "unknown"
                      }`}
                    >
                      {project.status || "Unknown"}
                    </span>
                    {project.priority && (
                      <span
                        className={`priority-badge ${project.priority.toLowerCase()}`}
                      >
                        {project.priority}
                      </span>
                    )}
                  </div>
                </div>

                <div className="project-card-body">
                  <p className="project-description">
                    {project.description || "No description available"}
                  </p>

                  <div className="project-details">
                    <div className="detail-item">
                      <FiUser className="detail-icon" />
                      <span>Client: {project.clientName || "N/A"}</span>
                    </div>
                    <div className="detail-item">
                      <FiCalendar className="detail-icon" />
                      <span>
                        Due:{" "}
                        {project.dueDate
                          ? new Date(project.dueDate).toLocaleDateString()
                          : "No due date"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <FiDollarSign className="detail-icon" />
                      <span>Budget: ${project.budget || 0}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-section">
                    <div className="progress-header">
                      <span className="progress-label">Progress</span>
                      <span className="progress-percentage">
                        {project.progress || 0}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Task Statistics */}
                  <div className="task-stats">
                    <div className="task-stat">
                      <FiCheckCircle className="task-icon completed" />
                      <span>{project.completedTasks || 0} Completed</span>
                    </div>
                    <div className="task-stat">
                      <FiClock className="task-icon pending" />
                      <span>{project.pendingTasks || 0} Pending</span>
                    </div>
                    <div className="task-stat">
                      <FiAlertCircle className="task-icon overdue" />
                      <span>{project.overdueTasks || 0} Overdue</span>
                    </div>
                  </div>
                </div>

                <div className="project-card-footer">
                  <div className="project-meta">
                    <span className="last-updated">
                      Updated{" "}
                      {project.updatedAt
                        ? new Date(project.updatedAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                  <div className="project-actions">
                    <button
                      onClick={() => setSelectedProject(project)}
                      className="action-btn view-btn"
                      title="View Details"
                    >
                      <FiEye />
                    </button>
                    <button
                      className="action-btn edit-btn"
                      title="Edit Project"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className="action-btn more-btn"
                      title="More Actions"
                    >
                      <FiMoreVertical />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Project Details Modal */}
        {selectedProject && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedProject(null)}
          >
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{selectedProject.title}</h2>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="close-btn"
                >
                  <FiX />
                </button>
              </div>
              <div className="modal-body">
                <div className="project-overview">
                  <div className="overview-section">
                    <h3>Project Information</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Project ID:</label>
                        <span>{selectedProject.projectId || "N/A"}</span>
                      </div>
                      <div className="info-item">
                        <label>Client:</label>
                        <span>{selectedProject.clientName || "N/A"}</span>
                      </div>
                      <div className="info-item">
                        <label>Status:</label>
                        <span
                          className={`status-badge ${selectedProject.status?.toLowerCase()}`}
                        >
                          {selectedProject.status || "Unknown"}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Priority:</label>
                        <span
                          className={`priority-badge ${selectedProject.priority?.toLowerCase()}`}
                        >
                          {selectedProject.priority || "N/A"}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Start Date:</label>
                        <span>
                          {selectedProject.startDate
                            ? new Date(
                                selectedProject.startDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Due Date:</label>
                        <span>
                          {selectedProject.dueDate
                            ? new Date(
                                selectedProject.dueDate
                              ).toLocaleDateString()
                            : "N/A"}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Budget:</label>
                        <span>${selectedProject.budget || 0}</span>
                      </div>
                      <div className="info-item">
                        <label>Progress:</label>
                        <span>{selectedProject.progress || 0}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="overview-section">
                    <h3>Description</h3>
                    <p>
                      {selectedProject.description ||
                        "No description available"}
                    </p>
                  </div>

                  <div className="overview-section">
                    <h3>Task Summary</h3>
                    <div className="task-summary-grid">
                      <div className="summary-item completed">
                        <FiCheckCircle />
                        <div>
                          <span className="summary-number">
                            {selectedProject.completedTasks || 0}
                          </span>
                          <span className="summary-label">Completed</span>
                        </div>
                      </div>
                      <div className="summary-item pending">
                        <FiClock />
                        <div>
                          <span className="summary-number">
                            {selectedProject.pendingTasks || 0}
                          </span>
                          <span className="summary-label">Pending</span>
                        </div>
                      </div>
                      <div className="summary-item overdue">
                        <FiAlertCircle />
                        <div>
                          <span className="summary-number">
                            {selectedProject.overdueTasks || 0}
                          </span>
                          <span className="summary-label">Overdue</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedProject(null)}
                >
                  Close
                </button>
                <button className="btn btn-primary">
                  <FiEdit2 /> Edit Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {isMobile ? <MobileView /> : <DesktopView />}
      {showKanban && <KanbanBoard />}
    </>
  );
}

// import "./ProjectList.css";
// import { Calendar } from "lucide-react";
// import React, { useState, useEffect } from "react";
// import Navbar from "./Navbar";
// import { FiSearch, FiBell, FiUser, FiLogOut, FiMenu, FiChevronDown, FiChevronUp } from "react-icons/fi";
// import SearchBar from "./Search-bar/SearchBar";

// export default function ProjectList() {
//     const [showModal, setShowModal] = useState(false);
//     const [isMobile, setIsMobile] = useState(false);
//     const [expandedCards, setExpandedCards] = useState({});

//     // Check screen size on component mount and when window resizes
//     useEffect(() => {
//         const checkScreenSize = () => {
//             const newIsMobile = window.innerWidth <= 768;
//             console.log("Window width:", window.innerWidth, "isMobile:", newIsMobile);
//             setIsMobile(newIsMobile);
//         };

//         // Initial check
//         checkScreenSize();

//         // Add listener for window resize
//         window.addEventListener('resize', checkScreenSize);

//         // Cleanup
//         return () => window.removeEventListener('resize', checkScreenSize);
//     }, []);

//     // Toggle card expanded state
//     const toggleCardExpanded = (index) => {
//         setExpandedCards(prev => ({
//             ...prev,
//             [index]: !prev[index]
//         }));
//     };

//     // State to handle form data
//     const [formData, setFormData] = useState({
//         title: "",
//         description: "",
//         startDate: "",
//         dueDate: "",
//         productProcedure: null,
//         ppt: null,
//         coveringLetter: null,
//     });

//     // Handle input change
//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prevData) => ({
//             ...prevData,
//             [name]: value,
//         }));
//     };

//     // Handle file input change
//     const handleFileChange = (e) => {
//         const { name, files } = e.target;
//         setFormData((prevData) => ({
//             ...prevData,
//             [name]: files[0],
//         }));
//     };

//     // Show modal when Add Project button is clicked
//     const handleAddProject = () => {
//         setShowModal(true);
//     };

//     // Close modal
//     const closeModal = () => {
//         setShowModal(false);
//     };

//     // Submit form data
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         console.log(formData); // You can replace this with your form submission logic
//         closeModal();
//     };

//     // Sample meeting data for demonstration
//     const meetings = [
//         {
//             title: "Dhanesh Bhai Project Discussion",
//             location: "Office",
//             participants: "Team A & B",
//             date: "12 - Aug - 2024",
//             time: "12:00 AM"
//         },
//         {
//             title: "Product Development Review",
//             location: "Conference Room",
//             participants: "Team C & D",
//             date: "14 - Aug - 2024",
//             time: "2:30 PM"
//         }
//     ];

//     // Mobile view component
//     const MobileView = () => (
//         <div className="mobile-container">
//             {/* Mobile Header */}
//             <div className="mobile-header">
//                 <button className="mobile-menu-btn">
//                     <FiMenu size={24} />
//                 </button>
//                 <div className="mobile-header-right">
//                     <button className="mobile-notification-btn">
//                         <FiBell size={20} />
//                     </button>
//                     <div className="mobile-avatar">
//                         <span>HM</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Mobile Project Header */}
//             <div className="mobile-project-header">
//                 <h1 className="mobile-project-heading">Project</h1>
//                 <button className="mobile-add-btn" onClick={handleAddProject}>
//                     + Add Projects
//                 </button>
//             </div>

//             {/* Mobile Project List */}
//             <div className="mobile-project-content">
//                 <div className="mobile-list-header">
//                     <h2 className="mobile-list-title">Project List</h2>
//                     <div className="mobile-date-display">
//                         <Calendar size={14} className="mobile-calendar-icon" />
//                         <span>07 Aug, 2024</span>
//                     </div>
//                 </div>

//                 {/* Project Cards */}
//                 <div className="mobile-cards-container">
//                     {meetings.map((meeting, index) => (
//                         <div key={index} className="mobile-project-card">
//                             <p className="mobile-card-text">
//                                 {meeting.title}
//                             </p>
//                             <div
//                                 className="mobile-card-footer"
//                                 onClick={() => toggleCardExpanded(index)}
//                             >
//                                 <span className="mobile-card-date">{meeting.date}</span>
//                                 {expandedCards[index] ?
//                                     <FiChevronUp size={18} /> :
//                                     <FiChevronDown size={18} />
//                                 }
//                             </div>

//                             {/* Expanded details section */}
//                             {expandedCards[index] && (
//                                 <div className="mobile-card-expanded">
//                                     <div className="meeting-details-grid">
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Location</span>
//                                             <span className="detail-value">{meeting.location}</span>
//                                         </div>
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Participants</span>
//                                             <span className="detail-value">{meeting.participants}</span>
//                                         </div>
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Meeting Date</span>
//                                             <span className="detail-value">{meeting.date}</span>
//                                         </div>
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Meeting Time</span>
//                                             <span className="detail-value">{meeting.time}</span>
//                                         </div>
//                                     </div>
//                                     <button className="view-details-btn">View Details</button>
//                                 </div>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );

//     // Desktop/Laptop view
//     const DesktopView = () => (
//         <div className="main-cont">
//             <Navbar />
//             <div className="project-container" style={{width:"80%"}}>
//                 <SearchBar/>

//                 {/* Outer container with border radius */}
//                 <div className="border-radius-container">
//                     {/* New container with Projects heading and Add Project button */}
//                     <div className="top-container" style={{ backgroundColor: "#ffffff" }}>
//                         <h1 className="projects-heading">Projects</h1>
//                         <button className="btn btn-outline add-project-btn" onClick={handleAddProject}>
//                             + Add Project
//                         </button>
//                     </div>
//                 </div>

//                 <div className="sub-modal">
//                     <div className="project-header">
//                         <h1 className="project-title">Project List</h1>
//                         <button className="project-date-button">
//                             <Calendar size={18} className="calendar-icon" />
//                             07 Aug, 2024
//                         </button>
//                     </div>

//                     <div className="table-container">
//                         <table className="project-table">
//                             <thead className="table-header">
//                                 <tr>
//                                     <th>Title</th>
//                                     <th>Description</th>
//                                     <th>Due Date</th>
//                                     <th>Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="table-body">
//                                 {[...Array(4)].map((_, index) => (
//                                     <tr key={index}>
//                                         <td>
//                                             <div className="table-title">
//                                                 Lorem Ipsum is simply dummy text of the printing and typesetting industry.
//                                             </div>
//                                         </td>
//                                         <td>
//                                             <div className="table-description">
//                                                 Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
//                                             </div>
//                                         </td>
//                                         <td>
//                                             <div className="table-title">Abhi Hana</div>
//                                         </td>
//                                         <td>
//                                             <button className="btn btn-outline view-details-btn">
//                                                 View Details
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     <div className="pagination-container">
//                         <div className="pagination-text">
//                             Page 1 of 100
//                         </div>
//                         <div className="pagination-controls">
//                             <button className="btn btn-outline pagination-btn" disabled>
//                                 {"<"}
//                             </button>
//                             <button className="btn btn-outline pagination-btn active">
//                                 1
//                             </button>
//                             <button className="btn btn-outline pagination-btn">
//                                 2
//                             </button>
//                             <button className="btn btn-outline pagination-btn">
//                                 {">"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );

//     return (
//         <>
//             {/* Conditionally render mobile or desktop view based on screen size */}
//             {isMobile ? <MobileView /> : <DesktopView />}

//             {/* Modal for Add Project Form - Shared between both views */}
//             {showModal && (
//                 <div className="modal-list">
//                     <div className="modal-box">
//                         <h2>Add Project</h2>
//                         <form onSubmit={handleSubmit}>
//                             <label>Project Title</label>
//                             <input
//                                 type="text"
//                                 name="title"
//                                 value={formData.title}
//                                 onChange={handleChange}
//                                 required
//                             />

//                             <label>Project Description</label>
//                             <textarea
//                                 name="description"
//                                 value={formData.description}
//                                 onChange={handleChange}
//                                 required
//                             />

//                             <label>Start Date</label>
//                             <input
//                                 type="date"
//                                 name="startDate"
//                                 value={formData.startDate}
//                                 onChange={handleChange}
//                                 required
//                             />

//                             <label>Due Date</label>
//                             <input
//                                 type="date"
//                                 name="dueDate"
//                                 value={formData.dueDate}
//                                 onChange={handleChange}
//                                 required
//                             />

//                             <label>Documentation Product Procedure (PDF)</label>
//                             <input
//                                 type="file"
//                                 name="productProcedure"
//                                 onChange={handleFileChange}
//                                 accept=".pdf"
//                                 required
//                             />

//                             <label>PPT Available</label>
//                             <input
//                                 type="file"
//                                 name="pdt"
//                                 onChange={handleFileChange}
//                                 accept=".pdf"
//                                 required
//                             />

//                             <label>Covering Letter (PDF)</label>
//                             <input
//                                 type="file"
//                                 name="coveringLetter"
//                                 onChange={handleFileChange}
//                                 accept=".pdf"
//                                 required
//                             />

//                             <div className="modal-buttons">
//                                 <button type="submit">Submit</button>
//                                 <button type="button" onClick={closeModal}>
//                                     Close
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}
//         </>
//     );
// }

// import "./ProjectList.css";
// import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react";
// import React, { useState, useEffect } from "react";
// import Navbar from "./Navbar";
// import { FiSearch, FiBell, FiUser, FiLogOut, FiMenu, FiChevronDown, FiChevronUp } from "react-icons/fi";
// import SearchBar from "./Search-bar/SearchBar";
// import AddProjectForm from "./AddProjectForm";

// export default function ProjectList() {
//     const [showModal, setShowModal] = useState(false);
//     const [showKanban, setShowKanban] = useState(false);
//     const [isMobile, setIsMobile] = useState(false);
//     const [expandedCards, setExpandedCards] = useState({});
//     const [currentMonth, setCurrentMonth] = useState('Aug 2024');

//     // Check screen size on component mount and when window resizes
//     useEffect(() => {
//         const checkScreenSize = () => {
//             const newIsMobile = window.innerWidth <= 768;
//             console.log("Window width:", window.innerWidth, "isMobile:", newIsMobile);
//             setIsMobile(newIsMobile);
//         };

//         // Initial check
//         checkScreenSize();

//         // Add listener for window resize
//         window.addEventListener('resize', checkScreenSize);

//         // Cleanup
//         return () => window.removeEventListener('resize', checkScreenSize);
//     }, []);

//     // Toggle card expanded state
//     const toggleCardExpanded = (index) => {
//         setExpandedCards(prev => ({
//             ...prev,
//             [index]: !prev[index]
//         }));
//     };

//     // State to handle form data
//     const [formData, setFormData] = useState({
//         title: "",
//         description: "",
//         startDate: "",
//         dueDate: "",
//         productProcedure: null,
//         ppt: null,
//         coveringLetter: null,
//     });

//     // Handle input change
//     const handleChange = (e) => {
//         const { name, value } = e.target;
//         setFormData((prevData) => ({
//             ...prevData,
//             [name]: value,
//         }));
//     };

//     // Handle file input change
//     const handleFileChange = (e) => {
//         const { name, files } = e.target;
//         setFormData((prevData) => ({
//             ...prevData,
//             [name]: files[0],
//         }));
//     };

//     // Show modal when Add Project button is clicked
//     const handleAddProject = () => {
//         setShowModal(true);
//     };

//     // Close modal
//     const closeModal = () => {
//         setShowModal(false);
//     };

//     // Submit form data
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         console.log(formData); // You can replace this with your form submission logic
//         closeModal();
//     };

//     // Open Kanban board
//     const handleViewDetails = () => {
//         setShowKanban(true);
//     };

//     // Close Kanban board
//     const handleCloseKanban = () => {
//         setShowKanban(false);
//     };

//     // Sample meeting data for demonstration
//     const meetings = [
//         {
//             title: "Dhanesh Bhai Project Discussion",
//             location: "Office",
//             participants: "Team A & B",
//             date: "12 - Aug - 2024",
//             time: "12:00 AM"
//         },
//         {
//             title: "Product Development Review",
//             location: "Conference Room",
//             participants: "Team C & D",
//             date: "14 - Aug - 2024",
//             time: "2:30 PM"
//         }
//     ];

//     // Kanban board tasks data
//     const initialTasks = {
//         todo: [
//             {
//                 id: 1,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             },
//             {
//                 id: 2,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             }
//         ],
//         pending: [
//             {
//                 id: 3,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             }
//         ],
//         inProgress: [
//             {
//                 id: 4,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             },
//             {
//                 id: 5,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             },
//             {
//                 id: 6,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             }
//         ],
//         completed: [
//             {
//                 id: 7,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             },
//             {
//                 id: 8,
//                 title: 'Lorem ipsum is simply dummy text of the printing and typesetting industry.',
//                 dueDate: '12 - Oct - 2025',
//                 assignedTo: '699522',
//                 assigneeId: '548442'
//             }
//         ]
//     };

//     const [tasks, setTasks] = useState(initialTasks);

//     const prevMonth = () => {
//         // In a real app, you would update the month and load tasks for that month
//         setCurrentMonth('Jul 2024');
//     };

//     const nextMonth = () => {
//         // In a real app, you would update the month and load tasks for that month
//         setCurrentMonth('Sep 2024');
//     };

//     const TaskCard = ({ task }) => {
//         return (
//             <div className="task-card">
//                 <div className="task-title">TASK</div>
//                 <div className="task-content">{task.title}</div>

//                 <div className="task-meta">
//                     <div className="meta-item">
//                         <span className="meta-label">Due Date:</span>
//                         <span className="meta-value">{task.dueDate}</span>
//                     </div>

//                     <div className="meta-item">
//                         <span className="meta-label">Assigned To:</span>
//                         <div className="assignee">
//                             <span className="bullet">•</span>
//                             <span>{task.assignedTo}</span>
//                             <span className="bullet">•</span>
//                             <span>{task.assigneeId}</span>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );
//     };

//     // Kanban Board Component
//     const KanbanBoard = () => (
//         <div className="kanban-modal">
//             <div className="kanban-container">
//                 <div className="kanban-header">
//                     <h2>Task Management</h2>
//                     <button className="close-kanban-btn" onClick={handleCloseKanban}>×</button>
//                 </div>

//                 <div className="app-header">
//                     <div className="title-section">
//                         <h2>TO DO List</h2>
//                     </div>
//                     <div className="add-task-btn">
//                         <button>
//                             <Plus size={18} />
//                             <span>Add New Task</span>
//                         </button>
//                     </div>
//                 </div>

//                 <div className="month-selector">
//                     <button className="month-nav" onClick={prevMonth}>
//                         <ChevronLeft size={16} />
//                     </button>
//                     <div className="current-month">
//                         <Calendar size={16} />
//                         <span>{currentMonth}</span>
//                     </div>
//                     <button className="month-nav" onClick={nextMonth}>
//                         <ChevronRight size={16} />
//                     </button>
//                 </div>

//                 <div className="kanban-board">
//                     <div className="kanban-column todo-column">
//                         <div className="column-header">TO DO List</div>
//                         <div className="column-content">
//                             {tasks.todo.map(task => (
//                                 <TaskCard key={task.id} task={task} />
//                             ))}
//                         </div>
//                     </div>

//                     <div className="kanban-column pending-column">
//                         <div className="column-header">Pending</div>
//                         <div className="column-content">
//                             {tasks.pending.map(task => (
//                                 <TaskCard key={task.id} task={task} />
//                             ))}
//                         </div>
//                     </div>

//                     <div className="kanban-column progress-column">
//                         <div className="column-header">In-Progress</div>
//                         <div className="column-content">
//                             {tasks.inProgress.map(task => (
//                                 <TaskCard key={task.id} task={task} />
//                             ))}
//                         </div>
//                     </div>

//                     <div className="kanban-column completed-column">
//                         <div className="column-header">Completed</div>
//                         <div className="column-content">
//                             {tasks.completed.map(task => (
//                                 <TaskCard key={task.id} task={task} />
//                             ))}
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );

//     // Mobile view component
//     const MobileView = () => (
//         <div className="mobile-container">
//             {/* Mobile Header */}
//             <div className="mobile-header">
//                 <button className="mobile-menu-btn">
//                     <FiMenu size={24} />
//                 </button>
//                 <div className="mobile-header-right">
//                     <button className="mobile-notification-btn">
//                         <FiBell size={20} />
//                     </button>
//                     <div className="mobile-avatar">
//                         <span>HM</span>
//                     </div>
//                 </div>
//             </div>

//             {/* Mobile Project Header */}
//             <div className="mobile-project-header">
//                 <h1 className="mobile-project-heading">Project</h1>
//                 <button className="mobile-add-btn" onClick={handleAddProject}>
//                     + Add Projects
//                 </button>
//             </div>

//             {/* Mobile Project List */}
//             <div className="mobile-project-content">
//                 <div className="mobile-list-header">
//                     <h2 className="mobile-list-title">Project List</h2>
//                     <div className="mobile-date-display">
//                         <Calendar size={14} className="mobile-calendar-icon" />
//                         <span>07 Aug, 2024</span>
//                     </div>
//                 </div>

//                 {/* Project Cards */}
//                 <div className="mobile-cards-container">
//                     {meetings.map((meeting, index) => (
//                         <div key={index} className="mobile-project-card">
//                             <p className="mobile-card-text">
//                                 {meeting.title}
//                             </p>
//                             <div
//                                 className="mobile-card-footer"
//                                 onClick={() => toggleCardExpanded(index)}
//                             >
//                                 <span className="mobile-card-date">{meeting.date}</span>
//                                 {expandedCards[index] ?
//                                     <FiChevronUp size={18} /> :
//                                     <FiChevronDown size={18} />
//                                 }
//                             </div>

//                             {/* Expanded details section */}
//                             {expandedCards[index] && (
//                                 <div className="mobile-card-expanded">
//                                     <div className="meeting-details-grid">
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Location</span>
//                                             <span className="detail-value">{meeting.location}</span>
//                                         </div>
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Participants</span>
//                                             <span className="detail-value">{meeting.participants}</span>
//                                         </div>
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Meeting Date</span>
//                                             <span className="detail-value">{meeting.date}</span>
//                                         </div>
//                                         <div className="meeting-detail-item">
//                                             <span className="detail-label">Meeting Time</span>
//                                             <span className="detail-value">{meeting.time}</span>
//                                         </div>
//                                     </div>
//                                     <button className="view-details-btn" onClick={handleViewDetails}>View Details</button>
//                                 </div>
//                             )}
//                         </div>
//                     ))}
//                 </div>
//             </div>
//         </div>
//     );

//     // Desktop/Laptop view
//     const DesktopView = () => (
//         <div className="main-cont">
//             <Navbar />
//             <div className="project-container" style={{width:"80%"}}>
//                 <SearchBar/>

//                 {/* Outer container with border radius */}
//                 <div className="border-radius-container">
//                     {/* New container with Projects heading and Add Project button */}
//                     <div className="top-container" style={{ backgroundColor: "#ffffff" }}>
//                         <h1 className="projects-heading">Projects</h1>
//                         <button className="btn btn-outline add-project-btn" onClick={handleAddProject}>
//                             + Add Project
//                         </button>
//                     </div>
//                 </div>

//                 <div className="sub-modal">
//                     <div className="project-header">
//                         <h1 className="project-title">Project List</h1>
//                         <button className="project-date-button">
//                             <Calendar size={18} className="calendar-icon" />
//                             07 Aug, 2024
//                         </button>
//                     </div>

//                     <div className="table-container">
//                         <table className="project-table">
//                             <thead className="table-header">
//                                 <tr>
//                                     <th>Title</th>
//                                     <th>Description</th>
//                                     <th>Due Date</th>
//                                     <th>Action</th>
//                                 </tr>
//                             </thead>
//                             <tbody className="table-body">
//                                 {[...Array(4)].map((_, index) => (
//                                     <tr key={index}>
//                                         <td>
//                                             <div className="table-title">
//                                                 Lorem Ipsum is simply dummy text of the printing and typesetting industry.
//                                             </div>
//                                         </td>
//                                         <td>
//                                             <div className="table-description">
//                                                 Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
//                                             </div>
//                                         </td>
//                                         <td>
//                                             <div className="table-title">Abhi Hana</div>
//                                         </td>
//                                         <td>
//                                             <button className="btn btn-outline view-details-btn" onClick={handleViewDetails}>
//                                                 View Details
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))}
//                             </tbody>
//                         </table>
//                     </div>

//                     <div className="pagination-container">
//                         <div className="pagination-text">
//                             Page 1 of 100
//                         </div>
//                         <div className="pagination-controls">
//                             <button className="btn btn-outline pagination-btn" disabled>
//                                 {"<"}
//                             </button>
//                             <button className="btn btn-outline pagination-btn active">
//                                 1
//                             </button>
//                             <button className="btn btn-outline pagination-btn">
//                                 2
//                             </button>
//                             <button className="btn btn-outline pagination-btn">
//                                 {">"}
//                             </button>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );

//     return (
//         <>
//             {/* Conditionally render mobile or desktop view based on screen size */}
//             {isMobile ? <MobileView /> : <DesktopView />}

//             {/* Modal for Add Project Form - Shared between both views */}
//             {showModal && (
//                 // <div className="modal-list">
//                 //     <div className="modal-box">
//                 //         <h2>Add Project</h2>
//                 //         <form onSubmit={handleSubmit}>
//                 //             <label>Project Title</label>
//                 //             <input
//                 //                 type="text"
//                 //                 name="title"
//                 //                 value={formData.title}
//                 //                 onChange={handleChange}
//                 //                 required
//                 //             />

//                 //             <label>Project Description</label>
//                 //             <textarea
//                 //                 name="description"
//                 //                 value={formData.description}
//                 //                 onChange={handleChange}
//                 //                 required
//                 //             />

//                 //             <label>Start Date</label>
//                 //             <input
//                 //                 type="date"
//                 //                 name="startDate"
//                 //                 value={formData.startDate}
//                 //                 onChange={handleChange}
//                 //                 required
//                 //             />

//                 //             <label>Due Date</label>
//                 //             <input
//                 //                 type="date"
//                 //                 name="dueDate"
//                 //                 value={formData.dueDate}
//                 //                 onChange={handleChange}
//                 //                 required
//                 //             />

//                 //             <label>Documentation Product Procedure (PDF)</label>
//                 //             <input
//                 //                 type="file"
//                 //                 name="productProcedure"
//                 //                 onChange={handleFileChange}
//                 //                 accept=".pdf"
//                 //                 required
//                 //             />

//                 //             <label>PPT Available</label>
//                 //             <input
//                 //                 type="file"
//                 //                 name="pdt"
//                 //                 onChange={handleFileChange}
//                 //                 accept=".pdf"
//                 //                 required
//                 //             />

//                 //             <label>Covering Letter (PDF)</label>
//                 //             <input
//                 //                 type="file"
//                 //                 name="coveringLetter"
//                 //                 onChange={handleFileChange}
//                 //                 accept=".pdf"
//                 //                 required
//                 //             />

//                 //             <div className="modal-buttons">
//                 //                 <button type="submit">Submit</button>
//                 //                 <button type="button" onClick={closeModal}>
//                 //                     Close
//                 //                 </button>
//                 //             </div>
//                 //         </form>
//                 //     </div>
//                 // </div>

//                 <AddProjectForm onClose={closeModal}/>
//             )}

//             {/* Kanban Board Modal */}
//             {showKanban && <KanbanBoard />}
//         </>
//     );
// }

// import "./ProjectList.css"
// import { Calendar, ChevronLeft, ChevronRight, Plus } from "lucide-react"
// import { useState, useEffect } from "react"
// import Navbar from "./Navbar"
// import { FiBell, FiMenu, FiChevronDown, FiChevronUp } from "react-icons/fi"
// import SearchBar from "./Search-bar/SearchBar"
// import DatePicker from "react-datepicker"
// import "react-datepicker/dist/react-datepicker.css"

// export default function ProjectList() {
//   const [showModal, setShowModal] = useState(false)
//   const [showKanban, setShowKanban] = useState(false)
//   const [isMobile, setIsMobile] = useState(false)
//   const [expandedCards, setExpandedCards] = useState({})
//   const [currentMonth, setCurrentMonth] = useState("Aug 2024")
//   const [date, setDate] = useState(new Date())
//   const [dropdownOpen, setDropdownOpen] = useState(false)
//   const [selectedEmployees, setSelectedEmployees] = useState([]) // Initially empty
//   const [formData, setFormData] = useState({
//     title: "",
//     description: "",
//     startDate: null,
//     dueDate: null,
//     productProcedure: null,
//     ppt: null,
//     coveringLetter: null,
//   })

//   // List of all available employees
//   const allEmployees = [
//     { id: 1, name: "Gaurav", role: "Web Developer" },
//     { id: 2, name: "Neha", role: "UI/UX Designer" },
//     { id: 3, name: "Yogesh", role: "Full Stack Developer" },
//   ]

//   const [projects, setProjects] = useState([])

//   useEffect(() => {
//     const checkScreenSize = () => {
//       const newIsMobile = window.innerWidth <= 768
//       setIsMobile(newIsMobile)
//     }

//     checkScreenSize()
//     window.addEventListener("resize", checkScreenSize)
//     return () => window.removeEventListener("resize", checkScreenSize)
//   }, [])

//   const toggleCardExpanded = (index) => {
//     setExpandedCards((prev) => ({
//       ...prev,
//       [index]: !prev[index],
//     }))
//   }

//   const handleChange = (e) => {
//     const { name, value } = e.target
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: value,
//     }))
//   }

//   const handleFileChange = (e) => {
//     const { name, files } = e.target
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: files[0],
//     }))
//   }

//   const handleAddProject = () => setShowModal(true)
//   const closeModal = () => setShowModal(false)

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     // Basic form validation
//     if (!formData.title || !formData.description || !formData.startDate || !formData.dueDate) {
//       alert("Please fill out all required fields.");
//       return;
//     }

//     // Format dates for display
//     const startDateFormatted = formData.startDate
//       ? new Date(formData.startDate).toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })
//       : "Not set";

//     const dueDateFormatted = formData.dueDate
//       ? new Date(formData.dueDate).toLocaleDateString("en-GB", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//         })
//       : "Not set";

//     // Create a new project object
//     const newProject = {
//       id: Date.now(), // Generate a unique ID
//       title: formData.title,
//       description: formData.description,
//       startDate: formData.startDate,
//       startDateFormatted,
//       dueDate: formData.dueDate,
//       dueDateFormatted,
//       assignedEmployees: selectedEmployees,
//       productProcedure: formData.productProcedure,
//       ppt: formData.ppt,
//       coveringLetter: formData.coveringLetter,
//     };

//     try {
//       // Send the project data to the API
//       const response = await fetch("http://localhost:5001/api/projects", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(newProject),
//       });

//       if (response.ok) {
//         // Add the new project to the projects array
//         setProjects([...projects, newProject]);

//         // Reset form data
//         setFormData({
//           title: "",
//           description: "",
//           startDate: null,
//           dueDate: null,
//           productProcedure: null,
//           ppt: null,
//           coveringLetter: null,
//         });

//         // Reset selected employees
//         setSelectedEmployees([]);

//         // Close the modal
//         closeModal();

//         console.log("Project added:", newProject);
//         alert("Project added successfully!");
//       } else {
//         const errorData = await response.json();
//         alert(`Failed to add project: ${errorData.message || "Unknown error"}`);
//         console.error("Failed to add project:", errorData);
//       }
//     } catch (error) {

//       // alert("Error adding project. Please try again.");

//       // If API call fails, still update local state for demo purposes
//       setProjects([...projects, newProject]);

//       // Reset form data
//       setFormData({
//         title: "",
//         description: "",
//         startDate: null,
//         dueDate: null,

//       });

//       // Reset selected employees
//       setSelectedEmployees([]);

//       // Close the modal
//       closeModal();
//     }
//   };

//   const handleViewDetails = () => setShowKanban(true)
//   const handleCloseKanban = () => setShowKanban(false)

//   const removeEmployee = (id) => {
//     setSelectedEmployees(selectedEmployees.filter((emp) => emp.id !== id))
//   }

//   const toggleDropdown = () => setDropdownOpen(!dropdownOpen)

//   const selectEmployee = (employee) => {
//     if (!selectedEmployees.some((e) => e.id === employee.id)) {
//       setSelectedEmployees([...selectedEmployees, employee])
//     }
//     setDropdownOpen(false)
//   }

//   const meetings = [
//     {
//       title: "Dhanesh Bhai Project Discussion",
//       location: "Office",
//       participants: "Team A & B",
//       date: "12 - Aug - 2024",
//       time: "12:00 AM",
//     },
//     {
//       title: "Product Development Review",
//       location: "Conference Room",
//       participants: "Team C & D",
//       date: "14 - Aug - 2024",
//       time: "2:30 PM",
//     },
//   ]

//   const initialTasks = {
//     todo: [
//       {
//         id: 1,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//       {
//         id: 2,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//     ],
//     pending: [
//       {
//         id: 3,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//     ],
//     inProgress: [
//       {
//         id: 4,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//       {
//         id: 5,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//       {
//         id: 6,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//     ],
//     completed: [
//       {
//         id: 7,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//       {
//         id: 8,
//         title: "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
//         dueDate: "12 - Oct - 2025",
//         assignedTo: "699522",
//         assigneeId: "548442",
//       },
//     ],
//   }

//   const [tasks, setTasks] = useState(initialTasks)

//   const prevMonth = () => setCurrentMonth("Jul 2024")
//   const nextMonth = () => setCurrentMonth("Sep 2024")

//   const TaskCard = ({ task }) => (
//     <div className="task-card">
//       <div className="task-title">TASK</div>
//       <div className="task-content">{task.title}</div>
//       <div className="task-meta">
//         <div className="meta-item">
//           <span className="meta-label">Due Date:</span>
//           <span className="meta-value">{task.dueDate}</span>
//         </div>
//         <div className="meta-item">
//           <span className="meta-label">Assigned To:</span>
//           <div className="assignee">
//             <span className="bullet">•</span>
//             <span>{task.assignedTo}</span>
//             <span className="bullet">•</span>
//             <span>{task.assigneeId}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )

//   const KanbanBoard = () => (
//     <div className="kanban-modal">
//       <div className="kanban-container">
//         <div className="kanban-header">
//           <h2>Task Management</h2>
//           <button className="close-kanban-btn" onClick={handleCloseKanban}>
//             ×
//           </button>
//         </div>
//         <div className="app-header">
//           <div className="title-section">
//             <h2>TO DO List</h2>
//           </div>
//           <div className="add-task-btn">
//             <button>
//               <Plus size={18} />
//               <span>Add New Task</span>
//             </button>
//           </div>
//         </div>
//         <div className="month-selector">
//           <button className="month-nav" onClick={prevMonth}>
//             <ChevronLeft size={16} />
//           </button>
//           <div className="current-month">
//             <Calendar size={16} />
//             <span>{currentMonth}</span>
//           </div>
//           <button className="month-nav" onClick={nextMonth}>
//             <ChevronRight size={16} />
//           </button>
//         </div>localhost:5001
//         <div className="kanban-board">
//           <div className="kanban-column todo-column">
//             <div className="column-header">TO DO List</div>
//             <div className="column-content">
//               {tasks.todo.map((task) => (
//                 <TaskCard key={task.id} task={task} />
//               ))}
//             </div>
//           </div>
//           <div className="kanban-column pending-column">
//             <div className="column-header">Pending</div>
//             <div className="column-content">
//               {tasks.pending.map((task) => (
//                 <TaskCard key={task.id} task={task} />
//               ))}
//             </div>
//           </div>
//           <div className="kanban-column progress-column">
//             <div className="column-header">In-Progress</div>
//             <div className="column-content">
//               {tasks.inProgress.map((task) => (
//                 <TaskCard key={task.id} task={task} />
//               ))}
//             </div>
//           </div>
//           <div className="kanban-column completed-column">
//             <div className="column-header">Completed</div>
//             <div className="column-content">
//               {tasks.completed.map((task) => (
//                 <TaskCard key={task.id} task={task} />
//               ))}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )

//   const MobileView = () => (
//     <div className="main-cont">
//     {/* <Navbar /> */}
//     <div className="project-container" style={{ width: "80%" }}>
//       <SearchBar />
//     <div className="mobile-container">
//       <div className="mobile-header">
//         <button className="mobile-menu-btn">
//           <FiMenu size={24} />
//         </button>
//         <div className="mobile-header-right">
//           <button className="mobile-notification-btn">
//             <FiBell size={20} />
//           </button>
//           <div className="mobile-avatar">
//             <span>HM</span>
//           </div>
//         </div>
//       </div>
//       <div className="mobile-project-header">
//         <h1 className="mobile-project-heading">Project</h1>
//         {/* <button className="mobile-add-btn" onClick={handleAddProject}>
//           + Add Projects
//         </button> */}
//       </div>
//       <div className="mobile-project-content">
//         <div className="mobile-list-header">
//           <h2 className="mobile-list-title">Project List</h2>
//           <div className="mobile-date-display">
//             <Calendar size={14} className="mobile-calendar-icon" />
//             <span>07 Aug, 2024</span>
//           </div>
//         </div>
//         <div className="mobile-cards-container">
//           {projects.length > 0
//             ? projects.map((project, index) => (
//                 <div key={project.id} className="mobile-project-card">
//                   <p className="mobile-card-text">{project.title}</p>
//                   <div className="mobile-card-footer" onClick={() => toggleCardExpanded(index)}>
//                     <span className="mobile-card-date">{project.dueDateFormatted || project.dueDate}</span>
//                     {expandedCards[index] ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
//                   </div>
//                   {expandedCards[index] && (
//                     <div className="mobile-card-expanded">
//                       <div className="meeting-details-grid">
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Description</span>
//                           <span className="detail-value">{project.description}</span>
//                         </div>
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Start Date</span>
//                           <span className="detail-value">
//                             {project.startDate
//                               ? new Date(project.startDate)
//                                   .toLocaleDateString("en-GB", {
//                                     day: "2-digit",
//                                     month: "short",
//                                     year: "numeric",
//                                   })
//                                   .replace(/\s/g, " ")
//                               : "Not set"}
//                           </span>
//                         </div>
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Due Date</span>
//                           <span className="detail-value">{project.dueDateFormatted || project.dueDate}</span>
//                         </div>
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Assigned To</span>
//                           <span className="detail-value">
//                             {project.assignedEmployees.map((emp) => emp.name).join(", ")}
//                           </span>
//                         </div>
//                       </div>
//                       <button className="view-details-btn" onClick={handleViewDetails}>
//                         View Details
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               ))
//             : meetings.map((meeting, index) => (
//                 <div key={index} className="mobile-project-card">
//                   <p className="mobile-card-text">{meeting.title}</p>
//                   <div className="mobile-card-footer" onClick={() => toggleCardExpanded(index)}>
//                     <span className="mobile-card-date">{meeting.date}</span>
//                     {expandedCards[index] ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
//                   </div>
//                   {expandedCards[index] && (
//                     <div className="mobile-card-expanded">
//                       <div className="meeting-details-grid">
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Location</span>
//                           <span className="detail-value">{meeting.location}</span>
//                         </div>
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Participants</span>
//                           <span className="detail-value">{meeting.participants}</span>
//                         </div>
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Meeting Date</span>
//                           <span className="detail-value">{meeting.date}</span>
//                         </div>
//                         <div className="meeting-detail-item">
//                           <span className="detail-label">Meeting Time</span>
//                           <span className="detail-value">{meeting.time}</span>
//                         </div>
//                       </div>
//                       <button className="view-details-btn" onClick={handleViewDetails}>
//                         View Details
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               ))}
//         </div>
//       </div>

//     </div>
//     </div>
//     </div>
//   )

//   const DesktopView = () => (
//     <div className="main-cont">
//       {/* <Navbar /> */}
//       <div className="project-container" style={{ width: "80%" }}>
//         <SearchBar />
//         <div className="border-radius-container">
//           <div className="top-container" style={{ backgroundColor: "#ffffff" }}>
//             <h1 className="projects-heading">Projects</h1>
//             {/* <button className="btn btn-outline add-project-btn" onClick={handleAddProject}>
//               + Add Project
//             </button> */}
//           </div>
//         </div>
//         <div className="sub-modal">
//           <div className="project-header">
//             <h1 className="project-title">Project List</h1>
//             {/* <button className="project-date-button">
//               <Calendar size={18} className="calendar-icon" />
//               07 Aug, 2024
//             </button> */}
//           </div>
//           <div className="table-container">
//             <table className="project-table">
//               <thead className="table-header">
//                 <tr>
//                   <th>Title</th>
//                   <th>Description</th>
//                   <th>Due Date</th>
//                   <th>Action</th>
//                 </tr>
//               </thead>
//               <tbody className="table-body">
//                 {projects.length > 0
//                   ? projects.map((project) => (
//                       <tr key={project.id}>
//                         <td>
//                           <div className="table-title">{project.title}</div>
//                         </td>
//                         <td>
//                           <div className="table-description">{project.description}</div>
//                         </td>
//                         <td>
//                           <div className="table-title">{project.dueDateFormatted || project.dueDate}</div>
//                         </td>
//                         <td>
//                           <button className="btn btn-outline view-details-btn" onClick={handleViewDetails}>
//                             View Details
//                           </button>
//                         </td>
//                       </tr>
//                     ))
//                   : // Display dummy data or a message when no projects exist
//                     [...Array(4)].map((_, index) => (
//                       <tr key={index}>
//                         <td>
//                           <div className="table-title">
//                             Lorem Ipsum is simply dummy text of the printing and typesetting industry.
//                           </div>
//                         </td>
//                         <td>
//                           <div className="table-description">
//                             Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
//                             been the industry's standard dummy text ever since the 1500s, when an unknown printer took a
//                             galley of type and scrambled it to make a type specimen book.
//                           </div>
//                         </td>
//                         <td>
//                           <div className="table-title">Abhi Hana</div>
//                         </td>
//                         <td>
//                           <button className="btn btn-outline view-details-btn" onClick={handleViewDetails}>
//                             View Details
//                           </button>
//                         </td>
//                       </tr>
//                     ))}
//               </tbody>
//             </table>
//           </div>
//           <div className="pagination-container">
//             <div className="pagination-text">Page 1 of 100</div>
//             <div className="pagination-controls">
//               <button className="btn btn-outline pagination-btn" disabled>
//                 {"<"}
//               </button>
//               <button className="btn btn-outline pagination-btn active">1</button>
//               <button className="btn btn-outline pagination-btn">2</button>
//               <button className="btn btn-outline pagination-btn">{">"}</button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   )

//   return (
//     <>
//       {isMobile ? <MobileView /> : <DesktopView />}
//       {showModal && (
//         <div className="add-project-modal">
//           <div className="modal-content">
//             <div className="modal-header">
//               <h2>Add Projects</h2>
//               <button className="close-button" onClick={closeModal}>
//                 ×
//               </button>
//             </div>
//             <form onSubmit={handleSubmit}>
//               <div className="date-wrapper">
//                 <div className="date-container">
//                   <label>Date :</label>
//                   <div className="date-input-wrapper">
//                     <DatePicker
//                       selected={date}
//                       onChange={(date) => setDate(date)}
//                       dateFormat="dd/MM/yyyy"
//                       placeholderText="Select Date"
//                     />
//                     <span className="calendar-icon">📅</span>
//                   </div>
//                 </div>
//               </div>
//               <div className="form-group">
//                 <label>Project Title :</label>
//                 <input
//                   type="text"
//                   name="title"
//                   value={formData.title}
//                   onChange={handleChange}
//                   placeholder="Write Here . . ."
//                 />
//               </div>
//               <div className="form-group">
//                 <label>Project Description :</label>
//                 <textarea
//                   name="description"
//                   value={formData.description}
//                   onChange={handleChange}
//                   placeholder="Write Here . . ."
//                 ></textarea>
//               </div>
//               <div className="date-row">
//                 <div className="date-field">
//                   <label>Start Date :</label>
//                   <div className="date-input-container">
//                     <DatePicker
//                       selected={formData.startDate}
//                       onChange={(date) => setFormData({ ...formData, startDate: date })}
//                       dateFormat="dd/MM/yyyy"
//                       placeholderText="Select Start Date"
//                     />
//                     <span className="calendar-icon">📅</span>
//                   </div>
//                 </div>
//                 <div className="date-field">
//                   <label>Due Date :</label>
//                   <div className="date-input-container">
//                     <DatePicker
//                       selected={formData.dueDate}
//                       onChange={(date) => setFormData({ ...formData, dueDate: date })}
//                       dateFormat="dd/MM/yyyy"
//                       placeholderText="Select Due Date"
//                     />
//                     <span className="calendar-icon">📅</span>
//                   </div>
//                 </div>
//               </div>
//               <div className="assign-employee-section">
//                 <label>Assign Employee :</label>
//                 <div className="select-dropdown" onClick={toggleDropdown}>
//                   <div className="select-field">
//                     <span>Select Employee...</span>
//                     <span className="dropdown-arrow">▼</span>
//                   </div>
//                 </div>
//                 {dropdownOpen && (
//                   <ul className="dropdown-menu">
//                     {allEmployees.map((employee) => (
//                       <li key={employee.id} className="dropdown-item" onClick={() => selectEmployee(employee)}>
//                         {employee.name} - {employee.role}
//                       </li>
//                     ))}
//                   </ul>
//                 )}
//                 <div className="employee-tags-container">
//                   {selectedEmployees.map((employee) => (
//                     <div key={employee.id} className="employee-tag">
//                       <div className="employee-info">
//                         <div className="employee-name">{employee.name}</div>
//                         <div className="employee-role">{employee.role}</div>
//                       </div>
//                       <button type="button" className="remove-employee" onClick={() => removeEmployee(employee.id)}>
//                         ×
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//               <div className="form-actions">
//                 <button type="submit" className="add-button">
//                   ADD
//                 </button>
//                 <button type="button" className="cancel-button" onClick={closeModal}>
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//       {showKanban && <KanbanBoard />}
//     </>
//   )
// }
