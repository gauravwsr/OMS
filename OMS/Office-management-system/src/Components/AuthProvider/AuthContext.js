import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import { jwtDecode } from "jwt-decode";

// Create Auth Context
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [usersId, setUsersId] = useState("");
  const navigate = useNavigate();

  // const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser({
          email: decodedToken.email,
          role: decodedToken.role,
          subRole: decodedToken.subRole,
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Error decoding token", error);
        logout();
      }
    }
  }, []);
  async function refreshToken() {
    const refreshToken = localStorage.getItem("refreshToken");

    const res = await fetch("/refreshToken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem("token", data.token);
    }
  }

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:5000/users/login", {
        email,
        password,
      });

      if (response.data && response.data.token) {
        message.success("Login successful!");
        const { token, userId } = response.data;

        setUsersId(userId);
        localStorage.setItem("token", token);

        const decodedToken = jwtDecode(token);
        setUser({
          email: decodedToken.email,
          role: decodedToken.role,
          subRole: decodedToken.subRole,
        });
        setIsAuthenticated(true);
      } else {
        message.error(
          "Login failed. Please check your credentials and try again."
        );
      }
    } catch (error) {
      console.error("Login error:", error);
      message.error("Login Failed! Please try again later.");
    }
  };

  const signup = async (
    name,
    email,
    password,
    role,
    subRole,
    additionalData = {}
  ) => {
    try {
      const response = await axios.post("http://localhost:5000/users/signup", {
        name,
        email,
        password,
        role,
        subRole,
        ...additionalData, // Spread additional form data
      });

      if (response.status === 201) {
        message.success("Signup successful! Redirecting to login page...");
        // Redirect to login page after successful signup
        navigate("/login");
      } else {
        throw new Error("Signup failed");
      }
    } catch (error) {
      console.error("Signup error:", error);

      // Handle specific error for Super Admin already exists
      if (error.response?.data?.error === "SUPER_ADMIN_SUBROLE_EXISTS") {
        message.error(error.response.data.msg);
      } else if (error.response?.data?.error === "SUPER_ADMIN_EXISTS") {
        message.error(
          "Super Admin already exists. Only one Super Admin account is allowed."
        );
      } else if (error.response?.data?.msg) {
        message.error(error.response.data.msg);
      } else {
        message.error("Signup failed. Please try again later.");
      }
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("token");
    message.success("Logout successful!");
  };

  const updateRole = async (newRole) => {
    if (!user || user.role === newRole) return;

    try {
      const response = await axios.put(
        "http://localhost:5000/users/updateRole",
        {
          userId: user.email,
          newRole,
        }
      );

      if (response.status === 200) {
        setUser((prevUser) => ({ ...prevUser, role: newRole }));
        message.success("Role updated successfully!");
      }
    } catch (error) {
      console.error("Role update error:", error);
      message.error("Failed to update role!");
    }
  };

  const checkSuperAdminExists = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/users/check-super-admin"
      );
      return response.data.exists;
    } catch (error) {
      console.error("Error checking Super Admin:", error);
      return false;
    }
  };

  const getAvailableSuperAdminSubRoles = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/users/available-super-admin-subroles"
      );
      return response.data;
    } catch (error) {
      console.error("Error getting available subroles:", error);
      return { availableSubRoles: [], occupiedSubRoles: [], allFilled: true };
    }
  };

  const getSuperAdminSubRoles = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/users/superadmin-subroles"
      );
      return response.data;
    } catch (error) {
      console.error("Error getting Super Admin subroles:", error);
      return {
        allRoles: [],
        coreRoles: [],
        customRoles: [],
        availableSubRoles: [],
        occupiedSubRoles: [],
        allFilled: true,
      };
    }
  };

  const addSuperAdminSubRole = async (subRole) => {
    try {
      const response = await axios.post(
        "http://localhost:5000/users/add-superadmin-subrole",
        {
          subRole,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding Super Admin subrole:", error);
      throw error;
    }
  };

  const deleteSuperAdminSubRole = async (subRole) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/users/delete-superadmin-subrole/${subRole}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting Super Admin subrole:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        updateRole,
        isAuthenticated,
        login,
        usersId,
        signup,
        logout,
        checkSuperAdminExists,
        getAvailableSuperAdminSubRoles,
        getSuperAdminSubRoles,
        addSuperAdminSubRole,
        deleteSuperAdminSubRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
