import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, CheckCircle, Plus, List, Calendar, Search } from "lucide-react";
import Navbar from "../Navbar";
import SearchBar from "../Search-bar/SearchBar";
import "./Todo.css";

const Todo = () => {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios.get("http://localhost:5000/tasks")
      .then((res) => {
        if (res.data) {
          // Filter out any malformed tasks without a title
          const validTasks = res.data.filter(task => task && task.title);
          setTasks(validTasks);
        }
      })
      .catch((err) => setErrorMessage("Error fetching tasks: " + (err.response?.data?.message || err.message)))
      .finally(() => setIsLoading(false));
  }, []);

  const addTask = () => {
    if (!newTask.trim()) return;

    const task = { title: newTask, completed: false, date: new Date().toLocaleString() };
    axios.post("http://localhost:5000/tasks", task)
      .then((res) => {
        if (res.data && res.data.title) {
          setTasks([...tasks, res.data]);
          setNewTask("");
        } else {
          setErrorMessage("Error: Created task has no title");
        }
      })
      .catch((err) => setErrorMessage("Error adding task: " + (err.response?.data?.message || err.message)));
  };

  const toggleTask = (id) => {
    const task = tasks.find(t => t._id === id);
    if (!task) return;

    axios.put(`http://localhost:5000/tasks/${id}`, { completed: !task.completed })
      .then(() => {
        setTasks(tasks.map(t => t._id === id ? { ...t, completed: !t.completed } : t));
      })
      .catch((err) => setErrorMessage("Error updating task: " + (err.response?.data?.message || err.message)));
  };

  const deleteTask = (id) => {
    axios.delete(`http://localhost:5000/tasks/${id}`)
      .then(() => {
        setTasks(tasks.filter(t => t._id !== id));
      })
      .catch((err) => setErrorMessage("Error deleting task: " + (err.response?.data?.message || err.message)));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // Filter tasks based on search query - added null check for title
  const filteredTasks = tasks.filter(task =>
    task && task.title && task.title.toLowerCase().includes(searchQuery.toLowerCase())
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
                    className={`todo-item ${task.completed ? "todo-item-completed" : ""}`}
                  >
                    <div className="todo-item-content">
                      <button
                        className={`todo-complete-button ${task.completed ? "todo-complete-button-active" : ""}`}
                        onClick={() => toggleTask(task._id)}
                      >
                        <CheckCircle size={18} />
                      </button>
                      <div className="todo-text">
                        <span className={task.completed ? "todo-text-completed" : ""}>
                          {task.title}
                        </span>
                        <small className="todo-date">
                          {task.date}
                        </small>
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