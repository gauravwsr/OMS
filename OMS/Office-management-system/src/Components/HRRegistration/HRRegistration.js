import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider/AuthContext";
import "./HRRegistration.css";

const HRRegistration = () => {
  const [activeTab, setActiveTab] = useState("register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [hrRole, setHrRole] = useState("");
  const [hrSubRole, setHrSubRole] = useState("");
  const [hrSubSubRole, setHrSubSubRole] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  // Additional personal fields
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [qualification, setQualification] = useState("");
  const [experience, setExperience] = useState("");
  const [salary, setSalary] = useState("");

  // For CEO - Add new position functionality
  const [newPosition, setNewPosition] = useState("");
  const [positionCategory, setPositionCategory] = useState("HR");
  const [availablePositions, setAvailablePositions] = useState([]);

  // For CEO - Super Admin role management
  const [superAdminRoles, setSuperAdminRoles] = useState({
    allRoles: [],
    coreRoles: [],
    customRoles: [],
    availableSubRoles: [],
    occupiedSubRoles: [],
  });
  const [newSuperAdminRole, setNewSuperAdminRole] = useState("");

  const {
    user,
    signup,
    getSuperAdminSubRoles,
    addSuperAdminSubRole,
    deleteSuperAdminSubRole,
  } = useAuth();

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

  // Restricted roles for Super Admin - only HR Manager
  const superAdminRestrictedRoles = {
    HR: {
      "HR Manager": [],
    },
  };

  // Determine which roles to show based on user role
  const getAvailableRoles = () => {
    if (user?.role === "Super_Admin") {
      return superAdminRestrictedRoles;
    }
    return hrRoles;
  };

  const [currentHrRoles, setCurrentHrRoles] = useState(getAvailableRoles());

  useEffect(() => {
    // Update available roles when component mounts or user changes
    setCurrentHrRoles(getAvailableRoles());
    // Load available positions when component mounts
    fetchAvailablePositions();
    if (isCEO) {
      fetchSuperAdminRoles();
    }
    // Auto-generate employee ID
    generateEmployeeId();
  }, [user]);

  const generateEmployeeId = () => {
    // Generate employee ID in format: EMP + current year + random 4 digits
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
    const generatedId = `EMP${currentYear}${randomNum}`;
    setEmployeeId(generatedId);
  };

  const fetchAvailablePositions = async () => {
    try {
      // This would be an API call to get available positions
      setAvailablePositions(Object.values(hrRoles).flat());
    } catch (error) {
      console.error("Error fetching positions:", error);
    }
  };

  const fetchSuperAdminRoles = async () => {
    try {
      const result = await getSuperAdminSubRoles();
      setSuperAdminRoles(result);
    } catch (error) {
      console.error("Error fetching Super Admin roles:", error);
    }
  };

  const handleHRRegistration = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (!hrRole) {
      alert("Please select a role!");
      return;
    }

    if (!hrSubRole) {
      alert("Please select a sub role!");
      return;
    }

    setLoading(true);
    try {
      // Determine the final role and subrole based on selection
      let finalRole, finalSubRole;

      // Super Admin can only create HR Managers
      if (user?.role === "Super_Admin") {
        if (hrRole === "HR" && hrSubRole === "HR Manager") {
          finalRole = "Admin";
          finalSubRole = "HR Manager";
        } else {
          alert("Super Admin can only register HR Managers!");
          setLoading(false);
          return;
        }
      } else {
        // Map department roles to system roles for other users (HR Managers)
        if (hrRole === "HR") {
          finalRole = "Admin";
          finalSubRole = hrSubRole;
        } else if (hrRole === "IT") {
          finalRole = "Admin";
          finalSubRole = hrSubRole;
        } else if (hrRole === "Employee") {
          finalRole = "Employee";
          finalSubRole = hrSubRole;
        } else if (hrRole === "Project") {
          finalRole = "Employee";
          finalSubRole = hrSubRole;
        }
      }

      await signup(name, email, password, finalRole, finalSubRole, {
        // Personal Information
        phoneNumber,
        emergencyContact,
        dateOfBirth,
        gender,
        address,
        city,
        state,
        zipCode,

        // Professional Information
        employeeId,
        joiningDate,
        qualification,
        experience,
        salary,

        // Role Information
        organizationalDepartment: hrRole, // Department
        organizationalPosition: hrSubRole, // Position
        organizationalSpecialization: hrSubSubRole, // Specialization
      });
      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setHrRole("");
      setHrSubRole("");
      setHrSubSubRole("");
      setAgreeTerms(false);
      setPhoneNumber("");
      setEmergencyContact("");
      setDateOfBirth("");
      setGender("");
      setAddress("");
      setCity("");
      setState("");
      setZipCode("");
      setJoiningDate("");
      setEmployeeId("");
      setQualification("");
      setExperience("");
      setSalary("");
      // Generate new employee ID for next registration
      generateEmployeeId();
    } catch (error) {
      console.error("HR Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuperAdminRole = async (e) => {
    e.preventDefault();

    if (!newSuperAdminRole.trim()) {
      alert("Please enter a Super Admin role name!");
      return;
    }

    try {
      await addSuperAdminSubRole(newSuperAdminRole.trim());
      setNewSuperAdminRole("");
      await fetchSuperAdminRoles(); // Refresh the list
      alert("Super Admin role added successfully!");
    } catch (error) {
      console.error("Error adding Super Admin role:", error);
      alert(
        error.response?.data?.message ||
          "Error adding Super Admin role. Please try again."
      );
    }
  };

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
      await fetchSuperAdminRoles(); // Refresh the list
      alert("Super Admin role deleted successfully!");
    } catch (error) {
      console.error("Error deleting Super Admin role:", error);
      alert(
        error.response?.data?.message ||
          "Error deleting Super Admin role. Please try again."
      );
    }
  };

  const handleAddPosition = async (e) => {
    e.preventDefault();

    if (!newPosition.trim()) {
      alert("Please enter a position name!");
      return;
    }

    if (!positionCategory) {
      alert("Please select a category!");
      return;
    }

    try {
      // API call to add new position to the database
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
        // Update local state - add to the selected department
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

  const isCEO = user?.subRole === "CEO";

  return (
    <div className="hr-registration-container">
      <div className="hr-registration-header">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
          >
            Register Staff
          </button>
          {isCEO && user?.role !== "Super_Admin" && (
            <button
              className={`tab-btn ${activeTab === "positions" ? "active" : ""}`}
              onClick={() => setActiveTab("positions")}
            >
              Manage Positions
            </button>
          )}
          {isCEO && user?.role !== "Super_Admin" && (
            <button
              className={`tab-btn ${
                activeTab === "superadmin-roles" ? "active" : ""
              }`}
              onClick={() => setActiveTab("superadmin-roles")}
            >
              Super Admin Roles
            </button>
          )}
        </div>
      </div>

      <div className="hr-registration-content">
        {activeTab === "register" && (
          <div className="registration-section">
            <div className="form-container">
              <h2>Register New Staff</h2>
              {user?.role === "Super_Admin" && (
                <div className="info-message">
                  <p>
                    <strong>Note:</strong> As a Super Admin, you can only
                    register HR Managers. HR Managers will have access to
                    register all other staff members.
                  </p>
                </div>
              )}
              <form onSubmit={handleHRRegistration} className="hr-form">
                {/* Personal Information Section */}
                <h3 className="section-title">Personal Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Enter full name"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="employeeId">
                      Employee ID * (Auto-generated)
                    </label>
                    <div className="employee-id-container">
                      <input
                        type="text"
                        id="employeeId"
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        required
                        placeholder="Auto-generated employee ID"
                        style={{ marginRight: "10px", flex: 1 }}
                      />
                      <button
                        type="button"
                        onClick={generateEmployeeId}
                        className="regenerate-btn"
                        title="Generate new Employee ID"
                      >
                        🔄
                      </button>
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dateOfBirth">Date of Birth *</label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="gender">Gender *</label>
                    <select
                      id="gender"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information Section */}
                <h3 className="section-title">Contact Information</h3>

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

                <div className="form-group">
                  <label htmlFor="emergencyContact">Emergency Contact *</label>
                  <input
                    type="tel"
                    id="emergencyContact"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    required
                    placeholder="Enter emergency contact number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="address">Address *</label>
                  <textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    required
                    placeholder="Enter complete address"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City *</label>
                    <input
                      type="text"
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                      placeholder="Enter city"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <input
                      type="text"
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      placeholder="Enter state"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="zipCode">ZIP Code *</label>
                    <input
                      type="text"
                      id="zipCode"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      required
                      placeholder="Enter ZIP code"
                    />
                  </div>
                </div>

                {/* Professional Information Section */}
                <h3 className="section-title">Professional Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hrRole">Department *</label>
                    <select
                      id="hrRole"
                      value={hrRole}
                      onChange={(e) => {
                        setHrRole(e.target.value);
                        setHrSubRole("");
                        setHrSubSubRole("");
                      }}
                      required
                    >
                      <option value="">Select Department</option>
                      {Object.keys(currentHrRoles).map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="hrSubRole">Position *</label>
                    <select
                      id="hrSubRole"
                      value={hrSubRole}
                      onChange={(e) => {
                        setHrSubRole(e.target.value);
                        setHrSubSubRole("");
                      }}
                      required
                      disabled={!hrRole}
                    >
                      <option value="">Select Position</option>
                      {hrRole &&
                        Object.keys(currentHrRoles[hrRole] || {}).map(
                          (position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          )
                        )}
                    </select>
                  </div>
                </div>

                {hrSubRole &&
                  currentHrRoles[hrRole]?.[hrSubRole]?.length > 0 && (
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="hrSubSubRole">Specialization</label>
                        <select
                          id="hrSubSubRole"
                          value={hrSubSubRole}
                          onChange={(e) => setHrSubSubRole(e.target.value)}
                        >
                          <option value="">
                            Select Specialization (Optional)
                          </option>
                          {currentHrRoles[hrRole][hrSubRole].map(
                            (specialization) => (
                              <option
                                key={specialization}
                                value={specialization}
                              >
                                {specialization}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>
                  )}

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="joiningDate">Joining Date *</label>
                    <input
                      type="date"
                      id="joiningDate"
                      value={joiningDate}
                      onChange={(e) => setJoiningDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="salary">Salary (₹) *</label>
                    <input
                      type="number"
                      id="salary"
                      value={salary}
                      onChange={(e) => setSalary(e.target.value)}
                      required
                      placeholder="Enter salary amount"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="qualification">
                      Education Qualification *
                    </label>
                    <select
                      id="qualification"
                      value={qualification}
                      onChange={(e) => setQualification(e.target.value)}
                      required
                    >
                      <option value="">Select Qualification</option>
                      <option value="High School">High School</option>
                      <option value="Bachelor's Degree">
                        Bachelor's Degree
                      </option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="PhD">PhD</option>
                      <option value="Diploma">Diploma</option>
                      <option value="Professional Certification">
                        Professional Certification
                      </option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="experience">Years of Experience *</label>
                    <select
                      id="experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      required
                    >
                      <option value="">Select Experience</option>
                      <option value="0-1 years">0-1 years</option>
                      <option value="1-3 years">1-3 years</option>
                      <option value="3-5 years">3-5 years</option>
                      <option value="5-10 years">5-10 years</option>
                      <option value="10+ years">10+ years</option>
                    </select>
                  </div>
                </div>

                {/* Account Information Section */}
                <h3 className="section-title">Account Information</h3>

                <div className="form-group">
                  <label htmlFor="password">Password *</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Create password"
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

                <div className="terms-container">
                  <input
                    id="agree-terms"
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    required
                  />
                  <label htmlFor="agree-terms">
                    I agree to the terms and conditions
                  </label>
                </div>

                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Registering..." : "Register Staff"}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === "positions" && isCEO && user?.role !== "Super_Admin" && (
          <div className="positions-section">
            <div className="form-container">
              <h2>Add New Position</h2>
              <form onSubmit={handleAddPosition} className="position-form">
                <div className="form-group">
                  <label htmlFor="position-category">Category *</label>
                  <select
                    id="position-category"
                    value={positionCategory}
                    onChange={(e) => setPositionCategory(e.target.value)}
                    required
                  >
                    <option value="HR">HR</option>
                    <option value="IT">IT</option>
                    <option value="Employee">Employee</option>
                    <option value="Project">Project</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="new-position">Position Name *</label>
                  <input
                    type="text"
                    id="new-position"
                    value={newPosition}
                    onChange={(e) => setNewPosition(e.target.value)}
                    required
                    placeholder="Enter new position name"
                  />
                </div>

                <button type="submit" className="submit-btn">
                  Add Position
                </button>
              </form>

              <div className="current-positions">
                <h3>Current Positions</h3>
                {Object.entries(currentHrRoles).map(
                  ([department, positions]) => (
                    <div key={department} className="position-category">
                      <h4>{department}</h4>
                      <div className="positions-list">
                        {Object.entries(positions).map(
                          ([position, subPositions]) => (
                            <div key={position} className="position-item">
                              <span className="position-tag main-position">
                                {position}
                              </span>
                              {subPositions.length > 0 && (
                                <div className="sub-positions">
                                  {subPositions.map((subPos, index) => (
                                    <span
                                      key={index}
                                      className="position-tag sub-position"
                                    >
                                      {subPos}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "superadmin-roles" &&
          isCEO &&
          user?.role !== "Super_Admin" && (
            <div className="positions-section">
              <div className="form-container">
                <h2>Manage Super Admin Roles</h2>
                <form
                  onSubmit={handleAddSuperAdminRole}
                  className="position-form"
                >
                  <div className="form-group">
                    <label htmlFor="new-superadmin-role">
                      New Super Admin Role *
                    </label>
                    <input
                      type="text"
                      id="new-superadmin-role"
                      value={newSuperAdminRole}
                      onChange={(e) => setNewSuperAdminRole(e.target.value)}
                      required
                      placeholder="Enter new Super Admin role name"
                    />
                  </div>

                  <button type="submit" className="submit-btn">
                    Add Super Admin Role
                  </button>
                </form>

                <div className="current-positions">
                  <h3>Current Super Admin Roles</h3>

                  <div className="position-category">
                    <h4>Core Roles (Cannot be deleted)</h4>
                    <div className="positions-list">
                      {superAdminRoles.coreRoles.map((role, index) => (
                        <span key={index} className="position-tag core-role">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>

                  {superAdminRoles.customRoles.length > 0 && (
                    <div className="position-category">
                      <h4>Custom Roles</h4>
                      <div className="positions-list">
                        {superAdminRoles.customRoles.map((role, index) => (
                          <div key={index} className="custom-role-item">
                            <span className="position-tag custom-role">
                              {role}
                            </span>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteSuperAdminRole(role)}
                              title={`Delete ${role} role`}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="position-category">
                    <h4>Occupied Positions</h4>
                    <div className="positions-list">
                      {superAdminRoles.occupiedSubRoles.map((role, index) => (
                        <span
                          key={index}
                          className="position-tag occupied-role"
                        >
                          {role} ✓
                        </span>
                      ))}
                    </div>
                    {superAdminRoles.occupiedSubRoles.length === 0 && (
                      <p style={{ color: "#666", fontStyle: "italic" }}>
                        No positions currently occupied
                      </p>
                    )}
                  </div>

                  <div className="position-category">
                    <h4>Available Positions</h4>
                    <div className="positions-list">
                      {superAdminRoles.availableSubRoles.map((role, index) => (
                        <span
                          key={index}
                          className="position-tag available-role"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                    {superAdminRoles.availableSubRoles.length === 0 && (
                      <p style={{ color: "#666", fontStyle: "italic" }}>
                        All positions are currently occupied
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default HRRegistration;
