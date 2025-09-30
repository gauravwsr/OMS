import React, { useState, useEffect } from "react";
import "./Db.css";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const EmployeeList = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [selectedType, setSelectedType] = useState("Employee Types");
  const navigate = useNavigate();

  // Original employee type options as specified
  const employeeTypes = [
    "Employee Types",
    "HR Executive",
    "HR Manager",
    "Team Leader",
    "Project Manager",
    "Developer",
    "App Developer",
    "UI/UX Designer",
    "Digital Marketing",
  ];

  // Fetch candidates from the backend
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://localhost:5001/api/candidates",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("API Response:", response.data.data);
        setEmployees(
          Array.isArray(response.data.data) ? response.data.data : []
        );
      } catch (error) {
        console.error("Error fetching employees:", error);
        setEmployees([]);
      }
    };

    fetchEmployees();
  }, []);

  const employeesPerPage = 10;

  // Modified filter function that filters by employee types (subRole) instead of role
  const filteredEmployees = employees.filter((employee) => {
    // Check if employee matches search term
    const matchesSearch =
      employee.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.subRole?.toLowerCase().includes(searchTerm.toLowerCase());

    // Check if employee matches selected type - using subRole (employee type) field
    const matchesType =
      selectedType === "Employee Types" ||
      employee.subRole?.toLowerCase() === selectedType.toLowerCase();

    // Debug logs
    console.log(
      `Employee ${employee.fullName}: subRole=${employee.subRole}, selectedType=${selectedType}, matches=${matchesType}`
    );

    return matchesSearch && matchesType;
  });

  // Calculate total pages
  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  // Get the current page's employees
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * employeesPerPage,
    currentPage * employeesPerPage
  );

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisiblePages) {
      // Show all page numbers if total pages are less than max visible pages
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);

      // Calculate start and end of visible page range
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      // Adjust if we're near the beginning
      if (currentPage <= 3) {
        startPage = 2;
        endPage = Math.min(totalPages - 1, maxVisiblePages - 1);
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - 2) {
        endPage = totalPages - 1;
        startPage = Math.max(2, totalPages - maxVisiblePages + 2);
      }

      // Add ellipsis after page 1 if needed
      if (startPage > 2) {
        pageNumbers.push("...");
      }

      // Add visible page numbers
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pageNumbers.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }

    return pageNumbers;
  };

  // Handle Page Changes
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleAddEmployee = () => {
    navigate("employee");
  };

  const handleViewDetails = (id) => {
    navigate(`viewDetails/${id}`);
  };

  const handleEditEmployee = (id) => {
    navigate(`edit/${id}`);
  };

  const handleDeleteEmployee = async (id) => {
    if (
      window.confirm(
        "Are you sure you want to delete this employee? This will also delete their face recognition data and uploaded files."
      )
    ) {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.delete(
          `http://localhost:5001/api/candidates/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          alert(`Employee deleted successfully! 
          
Details:
- Employee data removed from database
- Face recognition images: ${
            response.data.deletedData.faceImagesDeleted
              ? "Deleted"
              : "None found"
          }
- Uploaded files: ${
            response.data.deletedData.filesDeleted ? "Deleted" : "None found"
          }`);

          // Refresh the employee list
          const refreshResponse = await axios.get(
            "http://localhost:5001/api/candidates",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setEmployees(
            Array.isArray(refreshResponse.data.data)
              ? refreshResponse.data.data
              : []
          );
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Failed to delete employee. Please try again.");
      }
    }
  };

  const handleMobileEmployeeClick = (id) => {
    navigate(`viewDetails/${id}`);
  };

  // Handle employee type filter change
  const handleTypeChange = (e) => {
    console.log("Selected type:", e.target.value);
    setSelectedType(e.target.value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Export CSV functionality
  const exportToCSV = () => {
    // Headers for CSV
    const headers = ["Full Name", "Role", "Employee Type", "Attendance"];

    // Convert employees data to CSV format
    const employeeData = filteredEmployees.map((employee) => [
      employee.fullName,
      employee.role,
      employee.subRole || "N/A",
      employee.attendanceMark || "N/A",
    ]);

    // Combine headers and data
    const csvContent = [
      headers.join(","),
      ...employeeData.map((row) => row.join(",")),
    ].join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "employee_list.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      {/* Laptop View */}
      <div className="employee-container laptop-view">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search to find..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
        </div>
        <div className="employee-header">
          
          <button className="add-employee-btn" onClick={handleAddEmployee}>
            <span></span>
            Add Employee
          </button>
        </div>
        <div className="employee-management">
          <div className="headerr">
            <h2>Employee List</h2>
            <div className="header-actions">
              <select
                className="department-filter"
                value={selectedType}
                onChange={handleTypeChange}
              >
                {employeeTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {/* <div className="date-filter">07 Aug, 2024</div> */}
              <button className="export-btn" onClick={exportToCSV}>
                Export CSV
              </button>
            </div>
          </div>
          <table className="employee-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Role</th>
                <th>Employee Type</th>
                <th>Attendance Mark</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td className="employee-info">
                      <img
                        src={
                          employee.photoPath
                            ? `http://localhost:5001/uploads/photos/${employee.photoPath}`
                            : `https://api.dicebear.com/8.x/avataaars/svg?seed=${employee.fullName}`
                        }
                        alt={employee.fullName}
                        className="employee-avatar"
                      />
                      {employee.fullName}
                    </td>
                    <td>{employee.role || "N/A"}</td>
                    <td>{employee.subRole || "N/A"}</td>
                    <td>
                      <span
                        className={`attendance-mark ${
                          employee.attendanceMark
                            ?.toLowerCase()
                            .replace(" ", "-") || "not-marked"
                        }`}
                      >
                        {employee.attendanceMark || "N/A"}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="ViewDetails-btn"
                          onClick={() =>
                            handleViewDetails(employee.candidateId)
                          }
                        >
                          <span></span>
                          View Details
                        </button>
                        <button
                          className="edit-btn"
                          onClick={() =>
                            handleEditEmployee(employee.candidateId)
                          }
                        >
                          <span></span>
                          Edit
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDeleteEmployee(employee.candidateId)
                          }
                        >
                          <span></span>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="no-employees">
                    {selectedType !== "Employee Types"
                      ? `No employees found for ${selectedType} employment type`
                      : "No employees found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Numbered Pagination Controls */}
          {totalPages > 0 && (
            <div className="pagination">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="pagination-arrow"
              >
                &lt;
              </button>

              {getPageNumbers().map((pageNum, index) =>
                pageNum === "..." ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="pagination-ellipsis"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`page-${pageNum}`}
                    onClick={() => goToPage(pageNum)}
                    className={`pagination-number ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="pagination-arrow"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile View */}
      <div className="employee-container mobile-view">
        <div className="mobile-header">
          {/* <div className="menu-icon">☰</div> */}
          <h2>Employee</h2>
          <div className="mobile-header-icons">
            <div className="notification-bell">🔔</div>
            <div className="user-profile">👤</div>
          </div>
        </div>

        <div className="mobile-search-add-section">
          <button className="add-employee-btn" onClick={handleAddEmployee}>
            + Add Employee
          </button>
          <div className="search-filter-section">
            <input
              type="text"
              placeholder="Search to find..."
              className="mobile-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="mobile-employee-list">
          <div className="list-header">
            <h3>Employee List</h3>
            <div className="list-header-actions">
              <select
                className="department-filter"
                value={selectedType}
                onChange={handleTypeChange}
              >
                {employeeTypes.map((type, index) => (
                  <option key={index} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              <div className="mobile-actions-row">
                {/* <span className="date-filter">07 Aug, 2024</span> */}
                <button className="mobile-export-btn" onClick={exportToCSV}>
                  Export
                </button>
              </div>
            </div>
          </div>

          {paginatedEmployees.length > 0 ? (
            paginatedEmployees.map((employee) => (
              <div
                key={employee._id}
                className="mobile-employee-card"
                onClick={() => handleMobileEmployeeClick(employee.candidateId)}
              >
                <div className="mobile-employee-header">
                  <img
                    src={
                      employee.photoPath
                        ? `http://localhost:5001/uploads/photos/${employee.photoPath}`
                        : ` https://api.dicebear.com/8.x/avataaars/svg?seed=${employee.fullName}`
                    }
                    alt={employee.fullName}
                    className="mobile-employee-avatar"
                  />
                  <div className="mobile-employee-info">
                    <h4>{employee.fullName}</h4>
                    <span>
                      {employee.role || "N/A"}{" "}
                      {employee.subRole ? `${employee.subRole}` : ""}
                    </span>
                    {employee.attendanceMark && (
                      <span
                        className={`mobile-attendance-mark ${
                          employee.attendanceMark
                            ?.toLowerCase()
                            .replace(" ", "-") || "not-marked"
                        }`}
                      >
                        {employee.attendanceMark}
                      </span>
                    )}
                  </div>
                  <div className="mobile-card-dropdown">▼</div>
                </div>
              </div>
            ))
          ) : (
            <div className="no-employees-mobile">
              {selectedType !== "Employee Types"
                ? `No employees found for ${selectedType} employment type`
                : "No employees found"}
            </div>
          )}

          {/* Mobile Numbered Pagination */}
          {totalPages > 0 && (
            <div className="mobile-pagination">
              <button
                onClick={prevPage}
                disabled={currentPage === 1}
                className="mobile-pagination-arrow"
              >
                &lt;
              </button>

              {getPageNumbers().map((pageNum, index) =>
                pageNum === "..." ? (
                  <span
                    key={`mobile-ellipsis-${index}`}
                    className="mobile-pagination-ellipsis"
                  >
                    ...
                  </span>
                ) : (
                  <button
                    key={`mobile-page-${pageNum}`}
                    onClick={() => goToPage(pageNum)}
                    className={`mobile-pagination-number ${
                      currentPage === pageNum ? "active" : ""
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              )}

              <button
                onClick={nextPage}
                disabled={currentPage === totalPages}
                className="mobile-pagination-arrow"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EmployeeList;
