import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../AuthProvider/AuthContext";
import "./Register.css"; // Ensure this file exists
import registerImage from "./Rectangle 21.jpg";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("Super_Admin"); // Default to Super Admin
  const [subRole, setSubRole] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [availableSubRoles, setAvailableSubRoles] = useState([]);
  const [occupiedSubRoles, setOccupiedSubRoles] = useState([]);
  const [allPositionsFilled, setAllPositionsFilled] = useState(false);
  const [loading, setLoading] = useState(true);

  // Super Admin role management
  const [newSuperAdminRole, setNewSuperAdminRole] = useState("");

  const {
    signup,
    getAvailableSuperAdminSubRoles,
    getSuperAdminSubRoles,
    addSuperAdminSubRole,
    deleteSuperAdminSubRole,
  } = useAuth();

  // Super Admin roles state
  const [superAdminRoles, setSuperAdminRoles] = useState({
    allRoles: [],
    coreRoles: [],
    customRoles: [],
    availableSubRoles: [],
    occupiedSubRoles: [],
  });

  // Fetch Super Admin roles
  const fetchSuperAdminRoles = async () => {
    try {
      const result = await getSuperAdminSubRoles();
      setSuperAdminRoles(result);
    } catch (error) {
      console.error("Error fetching Super Admin roles:", error);
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
    fetchSuperAdminRoles();
  }, []);

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

    // Prepare simplified user data
    const userData = {
      fullName,
      email,
      role,
      subRole,
      password,
    };

    try {
      const response = await fetch("http://142.93.213.81:5001/auth/signup", {
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
        setFullName("");
        setEmail("");
        setRole("Super_Admin");
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
            {/* Simplified Registration Form */}
            <div className="form-group">
              <label htmlFor="fullName">Full Name *</label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>

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
              <label htmlFor="role">Role *</label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="Super_Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Employee">Employee</option>
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
