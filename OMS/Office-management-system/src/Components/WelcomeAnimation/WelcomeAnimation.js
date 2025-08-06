import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider/AuthContext';
import './WelcomeAnimation.css';

const WelcomeAnimation = ({ onAnimationComplete }) => {
  const { user } = useAuth();
  const [animationPhase, setAnimationPhase] = useState('enter');
  const [currentText, setCurrentText] = useState('');
  const [showBrand, setShowBrand] = useState(false);

  const productName = "Office Management System";
  const brandName = "The product by TARS Technologies";

  useEffect(() => {
    // Start typing animation after 500ms
    const startTyping = setTimeout(() => {
      setAnimationPhase('show');
      typeText(productName, 0);
    }, 500);

    return () => clearTimeout(startTyping);
  }, [onAnimationComplete]);

  const typeText = (text, index) => {
    if (index < text.length) {
      setCurrentText(text.substring(0, index + 1));
      setTimeout(() => typeText(text, index + 1), 100); // 100ms per character
    } else {
      // Show brand name after product name is complete
      setTimeout(() => {
        setShowBrand(true);
        // Start exit animation
        setTimeout(() => {
          setAnimationPhase('exit');
          setTimeout(() => {
            if (onAnimationComplete) {
              onAnimationComplete();
            }
          }, 500);
        }, 2000); // Show brand for 2 seconds
      }, 1000); // Wait 1 second after typing completes
    }
  };

  const getRoleDisplayName = (role, subRole) => {
    if (subRole) {
      const subRoleMap = {
        'HR': 'HR Manager',
        'Project_Manager': 'Project Manager',
        'Finance': 'Finance Manager',
        'IT': 'IT Manager'
      };
      return subRoleMap[subRole] || subRole;
    }
    
    const roleMap = {
      'Super_Admin': 'Super Administrator',
      'Admin': 'Administrator', 
      'Employee': 'Employee',
      'Intern': 'Intern'
    };
    return roleMap[role] || role;
  };

  return (
    <div className={`welcome-animation ${animationPhase}`}>
      <div className="welcome-content">
        <div className="typing-container">
          <h1 className="product-name">
            {currentText}
            <span className="cursor">|</span>
          </h1>
          
          {showBrand && (
            <p className="brand-name">{brandName}</p>
          )}
        </div>
      </div>

      <div className="background-animation">
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeAnimation;