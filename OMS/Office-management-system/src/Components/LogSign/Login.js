import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthProvider/AuthContext';
import loginImage from './Rectangle 20.jpg';
import './Login.css';



const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-container">
          <h1 className="login-title">Welcome Back!</h1>
          <form onSubmit={handleSubmit} className="login-form">

            {/* Email Input */}
            <div>
              <label htmlFor="email">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email address"
              />
            </div>


            {/* Password Input */}
            <div>
              <label htmlFor="password">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options">
              <div className="remember-me">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember-me">Remember me</label>
              </div>
              {/* ✅ Forgot Password Link */}
              <Link to="/forgot-password" className="forgot-password">
                Forgot your password?
              </Link>
            </div>

            <div>

              {/* Login Button */}
              <button type="submit" className="login-btn">Login</button>
            </div>
          </form>

          <p className="register-text">
            Don't have an account?{' '}
            <div className="font-medium text-indigo-600 hover:text-indigo-500">
              <Link to="/sign_up">Register here</Link>
            </div>
          </p>
        </div>

        {/* Right Side - Image with Proper Spacing */}
        <div className="login-image-container">
          <img
            src={loginImage}
            alt="Login Illustration"
            className="login-image"
          />
        </div>

      </div>
    </div>
  );
};

export default Login;