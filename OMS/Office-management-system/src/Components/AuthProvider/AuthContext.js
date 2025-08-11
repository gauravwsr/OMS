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
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  // const isAdmin = user?.role === 'admin';

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        setUser({
          _id: decodedToken.id,
          userId: decodedToken.userId,
          name: decodedToken.name,
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
      const response = await axios.post(
        "http://146.190.165.62:5001/users/login",
        {
          email,
          password,
        }
      );

      if (response.data && response.data.token) {
        message.success("Login successful!");
        const { token, userId } = response.data;

        setUsersId(userId);
        localStorage.setItem("token", token);

        const decodedToken = jwtDecode(token);
        setUser({
          _id: decodedToken.id,
          userId: decodedToken.userId,
          name: decodedToken.name,
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
      const response = await axios.post(
        "http://146.190.165.62:5001/users/signup",
        {
          name,
          email,
          password,
          role,
          subRole,
          ...additionalData, // Spread additional form data
        }
      );

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
    sessionStorage.removeItem("welcomeAnimationShown"); // Clear welcome animation flag
    message.success("Logout successful!");
  };

  const updateRole = async (newRole) => {
    if (!user || user.role === newRole) return;

    try {
      const response = await axios.put(
        "http://146.190.165.62:5001/users/updateRole",
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
        "http://146.190.165.62:5001/users/check-super-admin"
        // "http://146.190.165.62:5001/users/check-super-admin"
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
        "http://146.190.165.62:5001/users/available-super-admin-subroles"
        // "http://146.190.165.62:5001/users/available-super-admin-subroles"
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
        "http://146.190.165.62:5001/users/superadmin-subroles"
        // "http://146.190.165.62:5001/users/superadmin-subroles"
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
        "http://146.190.165.62:5001/users/add-superadmin-subrole",
        
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
        `http://146.190.165.62:5001/users/delete-superadmin-subrole/${subRole}`,
        `http://146.190.165.62:5001/users/delete-superadmin-subrole/${subRole}`,
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

  // Notification functions
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return { notifications: [], unreadCount: 0 };
      }

      const response = await axios.get(
        "http://146.190.165.62:5001/api/notifications",
        
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const notificationsData = response.data.notifications || [];
      const unreadCount = response.data.unreadCount || 0;

      setNotifications(notificationsData);
      setUnreadNotifications(unreadCount);

      return response.data;
    } catch (error) {
      console.error(
        "Error fetching notifications:",
        error.response?.status,
        error.response?.data?.message
      );
      return { notifications: [], unreadCount: 0 };
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await axios.patch(
        `http://146.190.165.62:5001/api/notifications/${notificationId}/read`,
        `http://146.190.165.62:5001/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      // Update local state
      setNotifications((prev) =>
        prev.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const createNotification = async (notificationData) => {
    try {
      const response = await axios.post(
        "http://146.190.165.62:5001/api/notifications",
        
        notificationData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  };

  const clearAllNotifications = async () => {
    try {
      await axios.delete("http://146.190.165.62:5001/api/notifications/clear", {
      // await axios.delete("http://146.190.165.62:5001/api/notifications/clear", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setNotifications([]);
      setUnreadNotifications(0);
    } catch (error) {
      console.error("Error clearing notifications:", error);
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
        notifications,
        unreadNotifications,
        checkSuperAdminExists,
        getAvailableSuperAdminSubRoles,
        getSuperAdminSubRoles,
        addSuperAdminSubRole,
        deleteSuperAdminSubRole,
        fetchNotifications,
        markNotificationAsRead,
        createNotification,
        clearAllNotifications,
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
