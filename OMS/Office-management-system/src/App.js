import React from "react";
import "./App.css";
import AuthPage from "./Components/AuthPage";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./Components/LogSign/Login";
import Register from "./Components/LogSign/Register";
import { useAuth } from "./Components/AuthProvider/AuthContext";
import ProtectedRoute from "./Components/ProtectedRoute";
import AdminPanel from "./Components/AdminPanel/AdminPanel";

const App = () => {
  const { isAuthenticated, user } = useAuth();

  // Define role-based redirection with subrole support
  const roleRedirects = {
    Super_Admin: "/super_admin",
    Admin: "/admin",
    Employee: "/employee",
    Intern: "/intern",
  };

  // Define subrole-based redirection
  const subroleRedirects = {
    Admin_HR: "/admin/hr",
    Admin_Project_Manager: "/admin/project-manager",
    // Add more subrole redirects as needed
    // Admin_Finance: "/admin/finance",
    // Admin_IT: "/admin/it",
  };

  // Get the redirect path based on the user's role and subrole
  const getRedirectPath = () => {
    if (!isAuthenticated || !user?.role) return "/login";

    // Check for subrole-specific redirect first
    if (user.subRole) {
      const subroleKey = `${user.role}_${user.subRole}`;
      if (subroleRedirects[subroleKey]) {
        return subroleRedirects[subroleKey];
      }
    }

    // Fall back to role-based redirect
    return roleRedirects[user.role] || "/login";
  };

  const redirectTo = getRedirectPath();

  return (
    <>
      <Routes>
        {/* Login and Register routes */}
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to={redirectTo} />}
        />
        <Route
          path="/sign_up"
          element={
            !isAuthenticated ? <Register /> : <Navigate to={redirectTo} />
          }
        />
        {/* <Route path="/forgot-password" element={<Forgot />} />
             
                {/* Protected Routes for different roles */}
        <Route
          path="/super_admin/*"
          element={
            <ProtectedRoute
              allowedRoles={["Super_Admin"]}
              element={<AdminPanel />}
            />
          }
        />

        {/* Subrole-specific routes - must come before general role routes */}
        <Route
          path="/admin/hr/*"
          element={
            <ProtectedRoute
              allowedRoles={["Admin"]}
              allowedSubRoles={["HR"]}
              element={<AdminPanel />}
            />
          }
        />

        <Route
          path="/admin/project-manager/*"
          element={
            <ProtectedRoute
              allowedRoles={["Admin"]}
              allowedSubRoles={["Project_Manager"]}
              element={<AdminPanel />}
            />
          }
        />

        {/* General role routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["Admin"]} element={<AdminPanel />} />
          }
        />
        <Route
          path="/employee/*"
          element={
            <ProtectedRoute
              allowedRoles={["Employee"]}
              element={<AdminPanel />}
            />
          }
        />
        <Route
          path="/intern/*"
          element={
            <ProtectedRoute
              allowedRoles={["Intern"]}
              element={<AdminPanel />}
            />
          }
        />

        {/* Redirect to the correct page if authenticated */}
        <Route
          path="/*"
          element={
            isAuthenticated ? (
              <Navigate to={redirectTo} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </>
  );
};

export default App;
