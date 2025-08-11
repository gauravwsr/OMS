import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  X,
  CheckCircle,
  Plus,
  List,
  Calendar,
  Search,
  User,
} from "lucide-react";
import Navbar from "../Navbar";
import SearchBar from "../Search-bar/SearchBar";
import { useAuth } from "../AuthProvider/AuthContext";
import "./Todo.css";

const Todo = () => {
  const { user } = useAuth(); // Get current user context
  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://146.190.165.62:5001";
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [assignedEmail, setAssignedEmail] = useState("");
  const [availableEmails, setAvailableEmails] = useState([]);
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Auto-populate email with current user's email
  useEffect(() => {
    if (user?.email) {
      setAssignedEmail(user.email);
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return; // Don't fetch if no user email

    setIsLoading(true);
    axios
      .get(
        `${API_BASE_URL}/api/notes?userEmail=${encodeURIComponent(user.email)}`
      )
      .then((res) => {
        if (res.data) {
          // Filter out any malformed tasks without a title
          const validTasks = res.data.filter((task) => task && task.title);
          setTasks(validTasks);
        }
      })
      .catch((err) =>
        setErrorMessage(
          "Error fetching tasks: " +
            (err.response?.data?.message || err.message)
        )
      )
      .finally(() => setIsLoading(false));
  }, [user?.email]);

  // Fetch available emails for assignment
  useEffect(() => {
    const fetchEmails = async () => {
      try {
        // Fetch from candidates (employees) first
        const candidatesResponse = await axios.get(
          `${API_BASE_URL}/api/candidates`
        );
        const candidateEmails =
          candidatesResponse.data.data?.map(
            (candidate) => candidate.email || candidate.personalMail
          ) || [];

        // Fetch from users as backup
        const usersResponse = await axios.get(`${API_BASE_URL}/api/users`);
        const userEmails = usersResponse.data?.map((user) => user.email) || [];

        // Combine and remove duplicates
        const allEmails = [...new Set([...candidateEmails, ...userEmails])];
        setAvailableEmails(allEmails.filter((email) => email)); // Remove any null/undefined emails
      } catch (error) {
        console.error("Error fetching emails:", error);
        // If fetching fails, user can still type email manually
      }
    };

    fetchEmails();
  }, []);

  const addTask = () => {
    if (!newTask.trim()) return;
    if (!assignedEmail.trim()) {
      setErrorMessage("Please enter an email address to assign the task");
      return;
    }
    if (!user?.email) {
      setErrorMessage("You must be logged in to create tasks");
      return;
    }

    const task = {
      title: newTask,
      assignedTo: assignedEmail,
      assignedBy: user.email,
      completed: false,
      date: new Date().toLocaleString(),
    };

    axios
      .post(`${API_BASE_URL}/api/notes`, task)
      .then((res) => {
        if (res.data && res.data.title) {
          // Only add to local state if the task is assigned to current user
          if (res.data.assignedTo === user.email) {
            setTasks([...tasks, res.data]);
          }
          setNewTask("");
          setAssignedEmail(user.email); // Reset to current user's email
          setErrorMessage("");

          // Show success message
          alert(`Task assigned to ${assignedEmail} successfully!`);
        } else {
          setErrorMessage("Error: Created task has no title");
        }
      })
      .catch((err) =>
        setErrorMessage(
          "Error adding task: " + (err.response?.data?.message || err.message)
        )
      );
  };

  const toggleTask = (id) => {
    const task = tasks.find((t) => t._id === id);
    if (!task) return;

    axios
      .put(`${API_BASE_URL}/api/notes/${id}`, {
        completed: !task.completed,
      })
      .then(() => {
        setTasks(
          tasks.map((t) =>
            t._id === id ? { ...t, completed: !t.completed } : t
          )
        );
      })
      .catch((err) =>
        setErrorMessage(
          "Error updating task: " + (err.response?.data?.message || err.message)
        )
      );
  };

  const deleteTask = (id) => {
    axios
      .delete(`${API_BASE_URL}/api/notes/${id}`)
      .then(() => {
        setTasks(tasks.filter((t) => t._id !== id));
      })
      .catch((err) =>
        setErrorMessage(
          "Error deleting task: " + (err.response?.data?.message || err.message)
        )
      );
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      addTask();
    }
  };

  // Filter tasks based on search query - added null check for title
  const filteredTasks = tasks.filter(
    (task) =>
      task &&
      task.title &&
      task.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="todo-main-container">
      {/* <Navbar /> */}
      <div className="todo-container">
        {/* <SearchBar /> */}
        {errorMessage && (
          <div className="todo-error-alert">
            <p>{errorMessage}</p>
            <button onClick={() => setErrorMessage("")}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="todo-card">
          <div className="todo-card-header">
            <List size={20} />
            <h2>Task Manager</h2>
          </div>

          <div className="todo-input-container">
            <div className="todo-input-wrapper">
              <input
                type="text"
                className="todo-input"
                placeholder="What needs to be done?"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <div className="todo-email-input-wrapper">
                <User size={16} className="todo-email-icon" />
                <input
                  type="email"
                  className="todo-email-input"
                  placeholder={
                    user?.email ? "Assigned to yourself" : "Assign to email..."
                  }
                  value={assignedEmail}
                  onChange={(e) => {
                    setAssignedEmail(e.target.value);
                    setShowEmailDropdown(
                      e.target.value.length > 0 &&
                        e.target.value !== user?.email
                    );
                  }}
                  onKeyPress={handleKeyPress}
                  onFocus={() =>
                    setShowEmailDropdown(
                      assignedEmail.length > 0 && assignedEmail !== user?.email
                    )
                  }
                  onBlur={() =>
                    setTimeout(() => setShowEmailDropdown(false), 200)
                  }
                  readOnly
                />
                {assignedEmail === user?.email && (
                  <div className="todo-self-indicator">Me</div>
                )}
                {showEmailDropdown && availableEmails.length > 0 && (
                  <div className="todo-email-dropdown">
                    {availableEmails
                      .filter((email) =>
                        email
                          .toLowerCase()
                          .includes(assignedEmail.toLowerCase())
                      )
                      .slice(0, 5) // Show max 5 suggestions
                      .map((email, index) => (
                        <div
                          key={index}
                          className="todo-email-option"
                          onClick={() => {
                            setAssignedEmail(email);
                            setShowEmailDropdown(false);
                          }}
                        >
                          {email}
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <button className="todo-add-button" onClick={addTask}>
                <Plus size={18} />
                <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="todo-search-container">
            <div className="todo-search-wrapper">
              <Search size={18} className="todo-search-icon" />
              <input
                type="text"
                className="todo-search-input"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="todo-search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="todo-list-container">
            {isLoading ? (
              <div className="todo-empty-state">
                <p>Loading tasks...</p>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="todo-empty-state">
                {searchQuery ? (
                  <>
                    <Search size={40} />
                    <p>No matching tasks found. Try a different search.</p>
                  </>
                ) : (
                  <>
                    <Calendar size={40} />
                    <p>No tasks yet. Add your first task above!</p>
                  </>
                )}
              </div>
            ) : (
              <ul className="todo-list">
                {filteredTasks.map((task) => (
                  <li
                    key={task._id}
                    className={`todo-item ${
                      task.completed ? "todo-item-completed" : ""
                    }`}
                  >
                    <div className="todo-item-content">
                      <button
                        className={`todo-complete-button ${
                          task.completed ? "todo-complete-button-active" : ""
                        }`}
                        onClick={() => toggleTask(task._id)}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <div className="todo-text">
                        <span
                          className={
                            task.completed ? "todo-text-completed" : ""
                          }
                        >
                          {task.title}
                        </span>
                        <small className="todo-date">{task.date}</small>
                        {task.assignedBy && (
                          <small className="todo-assigned-by">
                            Assigned by: {task.assignedBy}
                          </small>
                        )}
                      </div>
                    </div>
                    <button
                      className="todo-delete-button"
                      onClick={() => deleteTask(task._id)}
                    >
                      <X size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Todo;
