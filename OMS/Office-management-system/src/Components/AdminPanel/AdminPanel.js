import React from "react";
import { useAuth } from "../AuthProvider/AuthContext";
import { useNavigate } from "react-router-dom";
import { navigationMenus } from "../../navigationMenus";
import "../../App.css";
import MainContent from "../../MainContent";

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) return <div>Loading...</div>; // Handle loading state

  // Get navigation menu based on user role and subrole
  const getNavigationKey = () => {
    if (user.role && user.subRole) {
      const roleSubroleKey = `${user.role}_${user.subRole}`;
      if (navigationMenus[roleSubroleKey]) {
        return roleSubroleKey;
      }
    }
    return user.role;
  };

  const nav = navigationMenus[getNavigationKey()] || [];
  const name = user.name || [];

  return (
    <>
      <style>
        {`
          .admin-container {
            width: 100%;
            height: 100vh;
            overflow: hidden;
          }
          
          .admin-layout {
            height: 100%;
            width: 100%;
            display: flex;
            flex-direction: column;
          }
          
          /* We've removed sidebar related styles since MainContent handles this */
          
          .main-content {
            min-height: 100%;
            width: 100%;
            overflow: auto;
            flex: 1;
          }
        `}
      </style>
      <div className="admin-container">
        <div className="admin-layout">
          <div className="main-content">
            <MainContent nav={nav} />
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminPanel;
