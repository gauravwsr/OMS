import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthProvider/AuthContext";
import "./Register.css"; // Ensure this file exists
import registerImage from "./Rectangle 21.jpg";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [subRole, setSubRole] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [availableSubRoles, setAvailableSubRoles] = useState([]);
  const [occupiedSubRoles, setOccupiedSubRoles] = useState([]);
  const [allPositionsFilled, setAllPositionsFilled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Additional personal and professional fields (like HR Registration)
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [salary, setSalary] = useState("");

  // Position management functionality
  const [newPosition, setNewPosition] = useState("");
  const [positionCategory, setPositionCategory] = useState("HR");
  const [currentHrRoles, setCurrentHrRoles] = useState({});
  const [newSuperAdminRole, setNewSuperAdminRole] = useState("");

  const {
    signup,
    getAvailableSuperAdminSubRoles,
    getSuperAdminSubRoles,
    addSuperAdminSubRole,
    deleteSuperAdminSubRole,
  } = useAuth();

  // HR Roles structure (same as HR Registration)
  const hrRoles = {
    HR: {
      "HR Intern": [],
      "HR Coordinator": [],
      "HR Executive": [],
      "HR Manager": [],
    },
    IT: {
      "IT Intern": [],
      "IT Executive": ["Hardware Support", "Software Support"],
      "Network Admin": [],
      "IT Manager": [],
    },
    Employee: {
      Developer: ["Intern", "Junior Developer", "Senior Developer"],
      "QA/Tester": ["Junior Tester", "Senior Tester"],
      Designer: ["UI/UX Designer", "Graphic Designer"],
    },
    Project: {
      "Team Lead": [],
      "Project Manager": [],
      "Delivery Manager": [],
    },
  };

  // Super Admin roles state
  const [superAdminRoles, setSuperAdminRoles] = useState({
    allRoles: [],
    coreRoles: [],
    customRoles: [],
    availableSubRoles: [],
    occupiedSubRoles: [],
  });

  // Generate employee ID function
  const generateEmployeeId = () => {
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const generatedId = `SA${currentYear}${randomNum}`;
    setEmployeeId(generatedId);
  };

  // Fetch Super Admin roles
  const fetchSuperAdminRoles = async () => {
    try {
      const result = await getSuperAdminSubRoles();
      setSuperAdminRoles(result);
    } catch (error) {
      console.error("Error fetching Super Admin roles:", error);
    }
  };

  // Add new position
  const handleAddPosition = async (e) => {
    e.preventDefault();
    if (!newPosition.trim() || !positionCategory) {
      alert("Please enter position name and select category!");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/users/add-position", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          position: newPosition.trim(),
          category: positionCategory,
        }),
      });

      if (response.ok) {
        setCurrentHrRoles((prev) => ({
          ...prev,
          [positionCategory]: {
            ...prev[positionCategory],
            [newPosition.trim()]: [],
          },
        }));
        setNewPosition("");
        alert("Position added successfully!");
      } else {
        const error = await response.json();
        alert(error.message || "Failed to add position");
      }
    } catch (error) {
      console.error("Error adding position:", error);
      alert("Error adding position. Please try again.");
    }
  };

  // Add Super Admin role
  const handleAddSuperAdminRole = async (e) => {
    e.preventDefault();
    if (!newSuperAdminRole.trim()) {
      alert("Please enter a Super Admin role name!");
      return;
    }

    try {
      await addSuperAdminSubRole(newSuperAdminRole.trim());
      setNewSuperAdminRole("");
      await fetchSuperAdminRoles();
      alert("Super Admin role added successfully!");
    } catch (error) {
      console.error("Error adding Super Admin role:", error);
      alert(
        error.response?.data?.message ||
          "Error adding Super Admin role. Please try again."
      );
    }
  };

  // Delete Super Admin role
  const handleDeleteSuperAdminRole = async (subRole) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the "${subRole}" Super Admin role?`
      )
    ) {
      return;
    }

    try {
      await deleteSuperAdminSubRole(subRole);
      await fetchSuperAdminRoles();
      alert("Super Admin role deleted successfully!");
    } catch (error) {
      console.error("Error deleting Super Admin role:", error);
      alert(
        error.response?.data?.message ||
          "Error deleting Super Admin role. Please try again."
      );
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    setCurrentHrRoles(hrRoles);
    fetchSuperAdminRoles();
    generateEmployeeId();
  }, []);

  // Update available positions when department changes
  useEffect(() => {
    if (department && currentHrRoles[department]) {
      setAvailablePositions(Object.keys(currentHrRoles[department]));
      setPosition("");
      setSpecialization("");
    }
  }, [department, currentHrRoles]);

  // Update specializations when position changes
  useEffect(() => {
    if (department && position && currentHrRoles[department][position]) {
      setAvailableSpecializations(currentHrRoles[department][position]);
    } else {
      setAvailableSpecializations([]);
    }
  }, [department, position, currentHrRoles]);

  useEffect(() => {
    const checkAvailablePositions = async () => {
      try {
        const result = await getAvailableSuperAdminSubRoles();
        setAvailableSubRoles(result.availableSubRoles);
        setOccupiedSubRoles(result.occupiedSubRoles);
        setAllPositionsFilled(result.allFilled);
      } catch (error) {
        console.error("Error checking available positions:", error);
      } finally {
        setLoading(false);
      }
    };

    checkAvailablePositions();
  }, [getAvailableSuperAdminSubRoles]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    // Prepare comprehensive user data
    const userData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      emergencyContact,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      zipCode,
      employeeId,
      department,
      position,
      specialization,
      qualification,
      experience,
      joiningDate,
      salary,
      role,
      subRole,
      password,
    };

    try {
      const response = await fetch("http://localhost:5000/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Super Admin registered successfully!");
        // Reset form
        setFirstName("");
        setLastName("");
        setEmail("");
        setPhoneNumber("");
        setEmergencyContact("");
        setDateOfBirth("");
        setGender("");
        setAddress("");
        setCity("");
        setState("");
        setZipCode("");
        setEmployeeId("");
        setDepartment("");
        setPosition("");
        setSpecialization("");
        setQualification("");
        setExperience("");
        setJoiningDate("");
        setSalary("");
        setRole("");
        setSubRole("");
        setPassword("");
        setConfirmPassword("");
        setAgreeTerms(false);

        // Refresh Super Admin roles
        await fetchSuperAdminRoles();
      } else {
        alert(data.message || "Registration failed!");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Registration failed! Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="register-form-container">
            <h1 className="register-title">Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  if (allPositionsFilled) {
    return (
      <div className="register-container">
        <div className="register-card">
          <div className="register-form-container">
            <h1 className="register-title">Registration Not Available</h1>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p
                style={{
                  fontSize: "18px",
                  color: "#666",
                  marginBottom: "20px",
                }}
              >
                All Super Admin positions are filled. The following positions
                are occupied:
              </p>
              <ul
                style={{
                  fontSize: "16px",
                  color: "#888",
                  marginBottom: "20px",
                  listStyle: "none",
                  padding: 0,
                }}
              >
                {occupiedSubRoles.map((role, index) => (
                  <li key={index} style={{ marginBottom: "5px" }}>
                    ✓ {role}
                  </li>
                ))}
              </ul>
              <p className="login-text">
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </div>
          </div>
          <div className="register-image-container">
            <img
              src={registerImage}
              alt="Signup Illustration"
              className="register-image"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-form-container">
          <h1 className="register-title">Create Super Admin Account</h1>
          <form onSubmit={handleSubmit} className="register-form">
            {/* Personal Information Section */}
            <h3 className="section-title">Personal Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Enter last name"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter email address"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number *</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="emergencyContact">Emergency Contact</label>
                <input
                  type="tel"
                  id="emergencyContact"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="Emergency contact number"
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">Date of Birth</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="employeeId">Employee ID *</label>
                <div className="employee-id-container">
                  <input
                    type="text"
                    id="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    placeholder="Employee ID"
                  />
                  <button
                    type="button"
                    onClick={generateEmployeeId}
                    className="generate-btn"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter full address"
                rows="3"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                />
              </div>

              <div className="form-group">
                <label htmlFor="state">State</label>
                <input
                  type="text"
                  id="state"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter state"
                />
              </div>

              <div className="form-group">
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  placeholder="Enter zip code"
                />
              </div>
            </div>

            {/* Professional Information Section */}
            <h3 className="section-title">Professional Information</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department">Department *</label>
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select Department</option>
                  {Object.keys(currentHrRoles).map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="position">Position *</label>
                <select
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  required
                  disabled={!department}
                >
                  <option value="">Select Position</option>
                  {availablePositions.map((pos) => (
                    <option key={pos} value={pos}>
                      {pos}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {availableSpecializations.length > 0 && (
              <div className="form-group">
                <label htmlFor="specialization">Specialization</label>
                <select
                  id="specialization"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                >
                  <option value="">Select Specialization (Optional)</option>
                  {availableSpecializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="qualification">Qualification</label>
                <input
                  type="text"
                  id="qualification"
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  placeholder="e.g., B.Tech, MBA, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience">Experience (Years)</label>
                <input
                  type="number"
                  id="experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  min="0"
                  step="0.5"
                  placeholder="Years of experience"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="joiningDate">Joining Date</label>
                <input
                  type="date"
                  id="joiningDate"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="salary">Salary</label>
                <input
                  type="number"
                  id="salary"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                  min="0"
                  placeholder="Monthly salary"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="role">Role *</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                >
                  <option value="">Select Role</option>
                  <option value="Employee">Employee</option>
                  <option value="Admin">Admin</option>
                  <option value="Super_Admin">Super Admin</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="subRole">Executive Position</label>
                <select
                  id="subRole"
                  value={subRole}
                  onChange={(e) => setSubRole(e.target.value)}
                >
                  <option value="">Select Available Position</option>
                  {availableSubRoles.map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
                {occupiedSubRoles.length > 0 && (
                  <div
                    style={{
                      marginTop: "10px",
                      fontSize: "14px",
                      color: "#666",
                    }}
                  >
                    <p style={{ margin: "5px 0" }}>Occupied positions:</p>
                    {occupiedSubRoles.map((role, index) => (
                      <span
                        key={index}
                        style={{
                          display: "inline-block",
                          margin: "2px 5px",
                          padding: "2px 8px",
                          backgroundColor: "#f0f0f0",
                          borderRadius: "12px",
                          fontSize: "12px",
                        }}
                      >
                        {role} ✓
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Security Section */}
            <h3 className="section-title">Account Security</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password *</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Create strong password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password *</label>
                <input
                  type="password"
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <div className="terms-container">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <label htmlFor="agree-terms">
                I agree to the <a href="#">Terms and Conditions</a>
              </label>
            </div>

            <button type="submit" className="register-btn">
              Sign Up
            </button>
          </form>

          {/* Department/Position Management Section */}
          <div className="management-section">
            <h3 className="section-title">Department & Position Management</h3>

            {/* Add New Position */}
            <div className="management-card">
              <h4>Add New Position</h4>
              <form onSubmit={handleAddPosition} className="add-position-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="positionCategory">Select Department</label>
                    <select
                      id="positionCategory"
                      value={positionCategory}
                      onChange={(e) => setPositionCategory(e.target.value)}
                      required
                    >
                      <option value="">Select Department</option>
                      {Object.keys(currentHrRoles).map((dept) => (
                        <option key={dept} value={dept}>
                          {dept}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPosition">New Position Name</label>
                    <input
                      type="text"
                      id="newPosition"
                      value={newPosition}
                      onChange={(e) => setNewPosition(e.target.value)}
                      placeholder="Enter position name"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="add-btn">
                  Add Position
                </button>
              </form>
            </div>

            {/* Add Super Admin Role */}
            <div className="management-card">
              <h4>Super Admin Role Management</h4>
              <form
                onSubmit={handleAddSuperAdminRole}
                className="add-role-form"
              >
                <div className="form-group">
                  <label htmlFor="newSuperAdminRole">
                    New Super Admin Role
                  </label>
                  <input
                    type="text"
                    id="newSuperAdminRole"
                    value={newSuperAdminRole}
                    onChange={(e) => setNewSuperAdminRole(e.target.value)}
                    placeholder="Enter Super Admin role name"
                    required
                  />
                </div>

                <button type="submit" className="add-btn">
                  Add Super Admin Role
                </button>
              </form>

              {/* Current Super Admin Roles */}
              {superAdminRoles.allRoles.length > 0 && (
                <div className="roles-list">
                  <h5>Current Super Admin Roles:</h5>
                  <div className="roles-grid">
                    {superAdminRoles.allRoles.map((role, index) => (
                      <div key={index} className="role-item">
                        <span>{role}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteSuperAdminRole(role)}
                          className="delete-btn"
                          title="Delete role"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Current Department Structure */}
            <div className="management-card">
              <h4>Current Department Structure</h4>
              <div className="departments-overview">
                {Object.entries(currentHrRoles).map(([dept, positions]) => (
                  <div key={dept} className="department-card">
                    <h5>{dept} Department</h5>
                    <div className="positions-list">
                      {Object.keys(positions).map((position) => (
                        <div key={position} className="position-item">
                          <strong>{position}</strong>
                          {positions[position].length > 0 && (
                            <div className="specializations">
                              {positions[position].map((spec, idx) => (
                                <span key={idx} className="spec-tag">
                                  {spec}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="login-text">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </div>

        <div className="register-image-container">
          <img
            src={registerImage}
            alt="Signup Illustration"
            className="register-image"
          />
        </div>
      </div>
    </div>
  );
};

export default Register;
