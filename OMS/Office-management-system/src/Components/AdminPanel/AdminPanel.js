import React, { useState, useEffect } from "react";
import { useAuth } from "../AuthProvider/AuthContext";
import { useNavigate } from "react-router-dom";
import { navigationMenus } from "../../navigationMenus";
import "../../App.css";
import MainContent from "../../MainContent";
import WelcomeAnimation from "../WelcomeAnimation/WelcomeAnimation";

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showWelcome, setShowWelcome] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  useEffect(() => {
    // Check if welcome animation has been shown in this session
    const welcomeShown = sessionStorage.getItem('welcomeAnimationShown');
    if (welcomeShown) {
      setShowWelcome(false);
      setHasShownWelcome(true);
    }
  }, []);

  const handleAnimationComplete = () => {
    setShowWelcome(false);
    setHasShownWelcome(true);
    // Mark that welcome animation has been shown in this session
    sessionStorage.setItem('welcomeAnimationShown', 'true');
  };

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
      {showWelcome && !hasShownWelcome && (
        <WelcomeAnimation onAnimationComplete={handleAnimationComplete} />
      )}
      
      <div style={{ 
        opacity: showWelcome ? 0 : 1, 
        transition: 'opacity 0.5s ease-in-out',
        visibility: showWelcome ? 'hidden' : 'visible'
      }}>
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
      </div>
    </>
  );
};

export default AdminPanel;
