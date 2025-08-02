import React from "react";
import "./EmployeeDashboard.css";

const EmployeeDashboard = ({ nav }) => {
  return (
    <div className="employee-dashboard">
      <div className="dashboard-header">
        <h1>Employee Dashboard</h1>
        <p>Welcome to your employee dashboard</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="card">
            <h3>My Tasks</h3>
            <p>View and manage your assigned tasks</p>
          </div>

          <div className="card">
            <h3>Attendance</h3>
            <p>Mark attendance and view history</p>
          </div>

          <div className="card">
            <h3>Projects</h3>
            <p>View your assigned projects</p>
          </div>

          <div className="card">
            <h3>Leave Requests</h3>
            <p>Apply for leave and check status</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
