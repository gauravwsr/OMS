import React, { useState, useEffect } from "react";
import axios from "axios";
import "./HRLeaveApplication.css";
import { useAuth } from "../AuthProvider/AuthContext";

const HRLeaveApplication = () => {
  const { user, usersId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [userLeaves, setUserLeaves] = useState([]);
  const [loadingLeaves, setLoadingLeaves] = useState(false);

  // Debug: Add some sample data to test UI
  const [showSampleData, setShowSampleData] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    leaveReason: "",
    leaveDates: {
      start: "",
      end: "",
    },
    leaveType: "",
    customLeaveType: "",
  });

  useEffect(() => {
    console.log("HRLeaveApplication Component Mounted");
    console.log("User object in HRLeaveApplication:", user);
    console.log("UsersId from context:", usersId);

    if (user && (user.email || user._id)) {
      console.log("User found, fetching leaves...");
      fetchUserLeaves();
    } else {
      console.log("User not available yet or missing required fields");
      console.log("User state:", user);
    }
  }, [user]);

  const fetchUserLeaves = async () => {
    try {
      setLoadingLeaves(true);
      console.log("Fetching user leaves for user:", user);

      // Use both user ID and email for better reliability
      let response;
      if (user && user._id) {
        console.log('Using user ID:', user._id);
        response = await axios.get(`http://localhost:5001/api/leave/user/${user._id}`);
      } else if (user && user.email) {
        console.log('Using user email:', user.email);
        response = await axios.get(`http://localhost:5001/api/leave/user-by-email/${user.email}`);
      } else {
        console.log("No user ID or email available");
        throw new Error("User information not available");
      }

      console.log("API Response:", response.data);

      if (response.data.success) {
        console.log("Setting user leaves:", response.data.data);
        setUserLeaves(response.data.data);
      } else {
        console.log("API returned success: false");
        setMessage({
          type: "error",
          text: "No leave applications found",
        });
      }
    } catch (error) {
      console.error("Error fetching user leaves:", error);
      console.error("Error response:", error.response?.data);
      setMessage({
        type: "error",
        text: `Failed to fetch your leave applications: ${error.message}`,
      });
    } finally {
      setLoadingLeaves(false);
    }
  };

  const leaveTypes = [
    "Sick Leave",
    "Vacation",
    "Personal Leave",
    "Emergency Leave",
    "Other",
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name.includes("leaveDates.")) {
      const dateKey = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        leaveDates: {
          ...prev.leaveDates,
          [dateKey]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear messages when user starts typing
    if (message.text) {
      setMessage({ type: "", text: "" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    // Validation
    if (!formData.leaveReason.trim()) {
      setMessage({ type: "error", text: "Leave reason is required" });
      setLoading(false);
      return;
    }

    if (!formData.leaveDates.start || !formData.leaveDates.end) {
      setMessage({
        type: "error",
        text: "Both start and end dates are required",
      });
      setLoading(false);
      return;
    }

    if (
      new Date(formData.leaveDates.end) < new Date(formData.leaveDates.start)
    ) {
      setMessage({ type: "error", text: "End date must be after start date" });
      setLoading(false);
      return;
    }

    if (!formData.leaveType) {
      setMessage({ type: "error", text: "Please select a leave type" });
      setLoading(false);
      return;
    }

    if (formData.leaveType === "Other" && !formData.customLeaveType.trim()) {
      setMessage({
        type: "error",
        text: "Please specify the custom leave type",
      });
      setLoading(false);
      return;
    }

    // Check if user info exists
    if (!user || (!user.email && !user._id)) {
      setMessage({
        type: "error",
        text: "User information not available. Please login again.",
      });
      setLoading(false);
      return;
    }

    console.log("Form submission started with user:", user);
    console.log("Form data:", formData);

    try {
      // Prepare the payload using both user ID and email for better identification
      const payload = {
        userEmail: user.email,
        leaveReason: formData.leaveReason.trim(),
        leaveDates: {
          start: formData.leaveDates.start,
          end: formData.leaveDates.end,
        },
        leaveType: formData.leaveType,
        customLeaveType:
          formData.leaveType === "Other" ? formData.customLeaveType.trim() : "",
      };

      // Add userId if available
      if (user._id) {
        payload.userId = user._id;
      }

      // Debug log to check all values
      console.log("Submitting leave application with data:", payload);
      console.log("User object:", user);

      const response = await axios.post('http://localhost:5001/api/leave/apply', payload);

      console.log("Leave application response:", response.data);

      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Leave application submitted successfully! Waiting for Super Admin approval.",
        });

        // Reset form
        setFormData({
          leaveReason: "",
          leaveDates: {
            start: "",
            end: "",
          },
          leaveType: "",
          customLeaveType: "",
        });

        // Refresh user leaves
        setTimeout(() => {
          fetchUserLeaves();
        }, 1000); // Add delay to allow backend to process
      } else {
        console.log("Leave application failed:", response.data);
        setMessage({
          type: "error",
          text: response.data.message || "Failed to submit leave application",
        });
      }
    } catch (error) {
      console.error("Error submitting leave application:", error);
      console.error("Error response data:", error.response?.data);

      let errorMessage = "Failed to submit leave application";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Fix the calculateDays function
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return 0;
    }

    // Calculate difference in time
    const timeDiff = end.getTime() - start.getTime();

    // Convert to days and add 1 to include both start and end dates
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    return daysDiff > 0 ? daysDiff : 0;
  };

  // Fix date formatting in the display section
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid Date";

      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return "Invalid Date";
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Approved":
        return "status-approved";
      case "Rejected":
        return "status-rejected";
      case "Pending":
        return "status-pending";
      default:
        return "status-pending";
    }
  };

  return (
    <div className="hr-leave-application">
      <div className="leave-header">
        <h1>Apply for Leave</h1>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="leave-content">
        <div className="apply-leave-section">
          <div className="form-card">
            <h2>Leave Application Form</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="leaveReason">
                  Leave Reason <span className="required">*</span>
                </label>
                <textarea
                  id="leaveReason"
                  name="leaveReason"
                  value={formData.leaveReason}
                  onChange={handleInputChange}
                  placeholder="Please provide a detailed reason for your leave"
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">
                    Start Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="leaveDates.start"
                    value={formData.leaveDates.start}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endDate">
                    End Date <span className="required">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="leaveDates.end"
                    value={formData.leaveDates.end}
                    onChange={handleInputChange}
                    min={
                      formData.leaveDates.start ||
                      new Date().toISOString().split("T")[0]
                    }
                    required
                  />
                </div>
              </div>

              {formData.leaveDates.start && formData.leaveDates.end && (
                <div className="days-calculation">
                  <strong>
                    Total Days:{" "}
                    {calculateDays(
                      formData.leaveDates.start,
                      formData.leaveDates.end
                    )}
                  </strong>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="leaveType">
                  Leave Type <span className="required">*</span>
                </label>
                <select
                  id="leaveType"
                  name="leaveType"
                  value={formData.leaveType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {formData.leaveType === "Other" && (
                <div className="form-group">
                  <label htmlFor="customLeaveType">
                    Specify Leave Type <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="customLeaveType"
                    name="customLeaveType"
                    value={formData.customLeaveType}
                    onChange={handleInputChange}
                    placeholder="Please specify the type of leave"
                    required
                  />
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Submitting..." : "Submit Application"}
              </button>
            </form>
          </div>
        </div>

        {/* Leave Status Section */}
        <div className="leave-status-section">
          <div className="status-card">
            <h2>My Leave Applications</h2>
            <p style={{ fontSize: "12px", color: "#666" }}>
              Total applications: {userLeaves.length}
              {showSampleData && " (Sample Data)"}
            </p>

            {loadingLeaves ? (
              <p className="loading">Loading your leave applications...</p>
            ) : userLeaves.length === 0 ? (
              <div className="no-applications">
                <p>No leave applications found</p>
              </div>
            ) : (
              <div className="leave-applications-list">
                {userLeaves.map((leave) => (
                  <div key={leave._id} className="leave-item">
                    <div className="leave-details">
                      <div className="leave-info">
                        <h3>{leave.leaveReason}</h3>
                        <p>
                          <strong>Type:</strong> {leave.leaveType}
                        </p>
                        <p>
                          <strong>Duration:</strong>{" "}
                          {leave.leaveDates?.start && leave.leaveDates?.end
                            ? `${new Date(
                                leave.leaveDates.start
                              ).toLocaleDateString()} to ${new Date(
                                leave.leaveDates.end
                              ).toLocaleDateString()}`
                            : "Invalid Date"}
                        </p>
                        <p>
                          <strong>Days:</strong>{" "}
                          {leave.totalDays || leave.numberOfDays || "N/A"}{" "}
                          day(s)
                        </p>
                        <p>
                          <strong>Applied on:</strong>{" "}
                          {leave.appliedDate
                            ? new Date(leave.appliedDate).toLocaleDateString()
                            : new Date(leave.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="leave-status">
                        <span
                          className={`status-badge status-${leave.status.toLowerCase()}`}
                        >
                          {leave.status}
                        </span>
                        {leave.comments && (
                          <p className="leave-comments">
                            <strong>Comments:</strong> {leave.comments}
                          </p>
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
  );
};

export default HRLeaveApplication;
