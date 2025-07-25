import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider/AuthContext";

const ProtectedRoute = ({ allowedRoles, allowedSubRoles, element }) => {
  const { isAuthenticated, user } = useAuth();

  // If user is not authenticated, redirect to login page
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If user does not have the required role, redirect to a different page
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />; // Or to a specific page like '/unauthorized'
  }

  // If allowedSubRoles is specified, check if user has the required subrole
  if (allowedSubRoles && allowedSubRoles.length > 0) {
    if (!user.subRole || !allowedSubRoles.includes(user.subRole)) {
      return <Navigate to="/" />; // Or to a specific page like '/unauthorized'
    }
  }

  // If user is authenticated and has the correct role/subrole, render the element
  return <>{element}</>;
};

export default ProtectedRoute;
