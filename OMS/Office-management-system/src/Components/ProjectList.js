import "./ProjectList.css";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
// import Navbar from "./Navbar";
import { FiBell, FiMenu, FiChevronDown, FiChevronUp } from "react-icons/fi";
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

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch(
          "https://crm-brown-gamma.vercel.app/api/client-projects"
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        const formattedProjects = data.map((project) => ({
          id:
            project._id ||
            project.id ||
            Math.random().toString(36).substr(2, 9),
          title: project.clientName || project.leadName || "Untitled Project",
          description: `Lead: ${project.leadName || "N/A"} | Status: ${
            project.projectStatus || "N/A"
          }`,
          dueDate: project.createdAt
            ? new Date(project.createdAt)
                .toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
                .replace(/\s/g, " - ")
            : "No deadline set",
          projectId: project.projectId || "N/A",
          projectPassword: project.projectPassword || "N/A",
          status: project.projectStatus || "N/A",
          amount: project.finalAmount || 0,
          createdAt: project.createdAt || new Date().toISOString(),
          assignedEmployees: [],
        }));

        setProjects(formattedProjects);
        setFilteredProjects(formattedProjects);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError(error.message);
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (project.title &&
            project.title.toLowerCase().includes(searchLower)) ||
          (project.description &&
            project.description.toLowerCase().includes(searchLower)) ||
          (project.projectId &&
            project.projectId.toLowerCase().includes(searchLower)) ||
          (project.status && project.status.toLowerCase().includes(searchLower))
        );
      });
      setFilteredProjects(filtered);
    }
  }, [searchTerm, projects]);

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
        <div className="mobile-container">
          <div className="loading-spinner">Loading projects...</div>
        </div>
      );
    }

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
        <div className="main-cont">
          {/* <Navbar /> */}
          <div className="project-container" style={{ width: "100%" }}>
            <div className="loading-spinner">Loading projects...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="main-cont">
          {/* <Navbar /> */}
          <div className="project-container" style={{ width: "100%" }}>
            <div className="error-message">Error: {error}</div>
          </div>
        </div>
      );
    }

    return (
      <div className="">
        {/* <Navbar /> */}
        <div className="project-container" style={{ width: "100%" }}>
          <SearchBar onSearch={(term) => setSearchTerm(term)} />
          <div className="border-radius-container">
            <div
              className="top-container"
              style={{ backgroundColor: "#ffffff" }}
            >
              <h1 className="projects-heading">Projects</h1>
            </div>
          </div>
          <div className="sub-modal">
            <div className="project-header">
              <h1 className="project-title">Project List</h1>
              <button className="project-date-button">
                <Calendar size={18} className="calendar-icon" />
                07 Aug, 2024
              </button>
            </div>
            <div className="table-container">
              <table className="project-table">
                <thead className="table-header">
                  <tr>
                    <th></th>
                    <th>Title</th>
                    <th>Description</th>
                    <th>Project ID</th>
                    <th>Status</th>
                    <th>Amount</th>
                    <th>Created At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody className="table-body">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => (
                      <tr key={project.id}>
                        <td>
                          <input type="checkbox" className="table-checkbox" />
                        </td>
                        <td>
                          <div className="table-title">{project.title}</div>
                        </td>
                        <td>
                          <div className="table-description">
                            {project.description}
                          </div>
                        </td>
                        <td>
                          <div className="table-project-id">
                            {project.projectId}
                          </div>
                        </td>
                        <td>
                          <div
                            className={`status-badge ${project.status.toLowerCase()}`}
                          >
                            {project.status}
                          </div>
                        </td>
                        <td>
                          <div className="table-amount">₹{project.amount}</div>
                        </td>
                        <td>
                          <div className="table-created-at">
                            {new Date(project.createdAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              }
                            )}
                          </div>
                        </td>
                        <td>
                          <button
                            className="btn btn-outline view-details-btn"
                            onClick={handleViewDetails}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="no-results">
                        {searchTerm
                          ? "No projects match your search"
                          : "No projects found"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="pagination-container">
              <div className="pagination-text">Page 1 of 1</div>
              <div className="pagination-controls">
                <button className="btn btn-outline pagination-btn" disabled>
                  {"<"}
                </button>
                <button className="btn btn-outline pagination-btn active">
                  1
                </button>
                <button className="btn btn-outline pagination-btn" disabled>
                  {">"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
//         </div>
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
