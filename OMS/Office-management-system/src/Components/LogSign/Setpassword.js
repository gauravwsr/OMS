import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Setpassword.css"; // Import CSS

const loginImage = "/Images/Rectangle22.jpg"; // Image in `public/images/`

const SetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === confirmPassword) {
      console.log("Password Set Successfully");
      navigate("/login"); // Redirect to Login Page
    } else {
      alert("Passwords do not match!");
    }
  };

  return (
    <div className="set-password-container">
      <div className="set-password-box">
        <div className="set-password-form">
          <h1 className="set-password-title">Set a password</h1>
          <p className="set-password-text">
            Your previous password has been reset. Please set a new password.
          </p>

          <form onSubmit={handleSubmit} className="set-password-form-group">
            <div className="input-container">
              <label htmlFor="password">Create Password <span className="required">*</span></label>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowPassword(!showPassword)}
              >
                👁
              </button>
            </div>

            <div className="input-container">
              <label htmlFor="confirmPassword">Re-enter Password <span className="required">*</span></label>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                className="toggle-visibility"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                👁
              </button>
            </div>

            <button type="submit" className="set-password-button">Set password</button>
          </form>
        </div>

        <div className="set-password-image">
          <img src={loginImage} alt="Set Password Illustration" />
        </div>
      </div>
    </div>
  );
};

export default SetPassword;
