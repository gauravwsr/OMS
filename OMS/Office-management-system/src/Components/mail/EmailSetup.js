import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Settings, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  AlertCircle, 
  User, 
  Lock,
  Trash2,
  RefreshCw
} from 'lucide-react';
import './EmailSetup.css';

const EmailSetup = ({ onSetupComplete, onCancel, currentConfig = null }) => {
  const [smtpEmail, setSmtpEmail] = useState(currentConfig?.smtpEmail || '');
  const [smtpPassword, setSmtpPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchEmailSuggestions();
    checkAutoConfiguration();
  }, []);

  const fetchEmailSuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/emails/suggestions', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const checkAutoConfiguration = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/emails/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok && data.configured) {
        setSmtpEmail(data.smtpEmail);
        setSuccess('✅ Email configuration found! Your email is already set up.');
        
        // Auto-complete setup if credentials are already configured
        setTimeout(() => {
          onSetupComplete({
            smtpEmail: data.smtpEmail,
            configured: true
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking auto configuration:', error);
    }
  };

  const handleTestCredentials = async () => {
    if (!smtpEmail || !smtpPassword) {
      setError('Please enter both email and password');
      return;
    }

    setTesting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/emails/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          smtpEmail,
          smtpPassword,
          testOnly: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ Email credentials verified successfully!');
        setError('');
      } else {
        setError(data.message || 'Failed to verify email credentials');
        setSuccess('');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
      setSuccess('');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveCredentials = async () => {
    if (!smtpEmail || !smtpPassword) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/emails/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          smtpEmail,
          smtpPassword
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ Email configuration saved successfully!');
        setError('');
        
        // Call callback after short delay to show success message
        setTimeout(() => {
          onSetupComplete({
            smtpEmail,
            configured: true
          });
        }, 1500);
      } else {
        setError(data.message || 'Failed to save email configuration');
        setSuccess('');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCredentials = async () => {
    if (!window.confirm('Are you sure you want to remove your email configuration?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/emails/config', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('✅ Email configuration removed successfully!');
        setSmtpEmail('');
        setSmtpPassword('');
        
        setTimeout(() => {
          onSetupComplete({
            configured: false
          });
        }, 1500);
      } else {
        setError(data.message || 'Failed to remove email configuration');
      }
    } catch (error) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setSmtpEmail(suggestion);
    setShowSuggestions(false);
  };

  return (
    <div className="email-setup-overlay">
      <div className="email-setup-modal">
        <div className="email-setup-header">
          <div className="header-content">
            <Mail size={24} />
            <h2>Email Configuration</h2>
          </div>
          <button className="close-btn" onClick={onCancel}>
            <X size={20} />
          </button>
        </div>

        <div className="email-setup-content">
          <div className="setup-intro">
            <AlertCircle size={20} />
            <p>
              Configure your Hostinger email account to send and receive emails. 
              Use your <strong>@tars.co.in</strong> email credentials.
            </p>
          </div>

          <form className="email-setup-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label htmlFor="smtpEmail">
                <User size={16} />
                Email Address
              </label>
              <div className="input-with-suggestions">
                <input
                  type="email"
                  id="smtpEmail"
                  value={smtpEmail}
                  onChange={(e) => setSmtpEmail(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="your.name@tars.co.in"
                  required
                />
                
                {showSuggestions && suggestions.length > 0 && (
                  <div className="email-suggestions">
                    <div className="suggestions-header">
                      <span>Suggested emails:</span>
                      <button 
                        type="button"
                        onClick={() => setShowSuggestions(false)}
                        className="close-suggestions"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="suggestion-item"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="smtpPassword">
                <Lock size={16} />
                Email Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="smtpPassword"
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder="Your email password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <small className="form-hint">
                Use your Hostinger email account password
              </small>
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message">
                <Check size={16} />
                <span>{success}</span>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTestCredentials}
                disabled={testing || loading || !smtpEmail || !smtpPassword}
              >
                {testing ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Settings size={16} />
                    Test Connection
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveCredentials}
                disabled={loading || testing || !smtpEmail || !smtpPassword}
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Save Configuration
                  </>
                )}
              </button>

              {currentConfig?.configured && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleRemoveCredentials}
                  disabled={loading || testing}
                >
                  <Trash2 size={16} />
                  Remove Configuration
                </button>
              )}
            </div>
          </form>

          <div className="setup-help">
            <h4>Need Help?</h4>
            <ul>
              <li>Use your complete Hostinger email address (e.g., name@tars.co.in)</li>
              <li>Enter the same password you use to login to your email</li>
              <li>Make sure your email account is active and accessible</li>
              <li>Contact IT support if you need help with your email account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSetup;
