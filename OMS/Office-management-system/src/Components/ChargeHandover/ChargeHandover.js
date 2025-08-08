import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../AuthProvider/AuthContext";
import "./ChargeHandover.css";

const ChargeHandover = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    fromEmployeeId: "",
    toEmployeeId: "",
    handoverDate: "",
    department: "",
    responsibilities: "",
    assets: "",
    documents: "",
    notes: "",
  });

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

  useEffect(() => {
    if (user?.role === "Admin" && user?.subRole === "HR Manager") {
      fetchEmployees();
      fetchHandovers();
    }
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/candidates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmployees(response.data.data || response.data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHandovers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/api/charge-handovers`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setHandovers(response.data || []);
    } catch (error) {
      console.error("Error fetching handovers:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const submitData = {
        ...formData,
        createdBy: user.userId,
        status: "Pending",
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/charge-handovers`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        alert("Charge handover created successfully!");
        setShowCreateModal(false);
        setFormData({
          fromEmployeeId: "",
          toEmployeeId: "",
          handoverDate: "",
          department: "",
          responsibilities: "",
          assets: "",
          documents: "",
          notes: "",
        });
        fetchHandovers();
      }
    } catch (error) {
      console.error("Error creating charge handover:", error);
      alert("Failed to create charge handover. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeName = (employeeId) => {
    const employee = employees.find(
      (emp) => emp._id === employeeId || emp.candidateId === employeeId
    );
    return employee ? employee.fullName : "Unknown Employee";
  };

  // Check if user has permission
  if (user?.role !== "Admin" || user?.subRole !== "HR Manager") {
    return (
      <div className="charge-handover-container">
        <div className="access-denied">
          <h2>Access Denied</h2>
          <p>
            You don't have permission to access this page. Only HR Managers can
            manage charge handovers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="charge-handover-container">
      <div className="page-header">
        <h1>Charge Handover Management</h1>
        <p>Manage employee charge handovers and transfers</p>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Create New Handover
        </button>
      </div>

      {loading && (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      <div className="handovers-section">
        <h2>Charge Handovers</h2>
        {handovers.length === 0 ? (
          <div className="no-data">
            <p>
              No charge handovers found. Create your first handover to get
              started.
            </p>
          </div>
        ) : (
          <div className="handovers-grid">
            {handovers.map((handover) => (
              <div key={handover._id} className="handover-card">
                <div className="handover-header">
                  <h3>Handover #{handover._id?.slice(-6)}</h3>
                  <span
                    className={`status-badge ${handover.status?.toLowerCase()}`}
                  >
                    {handover.status}
                  </span>
                </div>
                <div className="handover-details">
                  <div className="detail-row">
                    <strong>From:</strong>{" "}
                    {getEmployeeName(handover.fromEmployeeId)}
                  </div>
                  <div className="detail-row">
                    <strong>To:</strong>{" "}
                    {getEmployeeName(handover.toEmployeeId)}
                  </div>
                  <div className="detail-row">
                    <strong>Department:</strong> {handover.department}
                  </div>
                  <div className="detail-row">
                    <strong>Handover Date:</strong>{" "}
                    {new Date(handover.handoverDate).toLocaleDateString()}
                  </div>
                  {handover.responsibilities && (
                    <div className="detail-row">
                      <strong>Responsibilities:</strong>{" "}
                      {handover.responsibilities}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Handover Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Create Charge Handover</h2>
              <button
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="handover-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="fromEmployeeId">From Employee *</label>
                  <select
                    id="fromEmployeeId"
                    name="fromEmployeeId"
                    value={formData.fromEmployeeId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((employee) => (
                      <option
                        key={employee._id || employee.candidateId}
                        value={employee._id || employee.candidateId}
                      >
                        {employee.fullName} - {employee.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="toEmployeeId">To Employee *</label>
                  <select
                    id="toEmployeeId"
                    name="toEmployeeId"
                    value={formData.toEmployeeId}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees
                      .filter(
                        (emp) =>
                          (emp._id || emp.candidateId) !==
                          formData.fromEmployeeId
                      )
                      .map((employee) => (
                        <option
                          key={employee._id || employee.candidateId}
                          value={employee._id || employee.candidateId}
                        >
                          {employee.fullName} - {employee.role}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="handoverDate">Handover Date *</label>
                  <input
                    type="date"
                    id="handoverDate"
                    name="handoverDate"
                    value={formData.handoverDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="department">Department *</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Enter department"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="responsibilities">Responsibilities</label>
                <textarea
                  id="responsibilities"
                  name="responsibilities"
                  value={formData.responsibilities}
                  onChange={handleInputChange}
                  placeholder="Describe the responsibilities being handed over..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="assets">Assets</label>
                <textarea
                  id="assets"
                  name="assets"
                  value={formData.assets}
                  onChange={handleInputChange}
                  placeholder="List assets being transferred..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="documents">Documents</label>
                <textarea
                  id="documents"
                  name="documents"
                  value={formData.documents}
                  onChange={handleInputChange}
                  placeholder="List important documents to be transferred..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="notes">Additional Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional notes or instructions..."
                  rows="3"
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Handover"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargeHandover;
