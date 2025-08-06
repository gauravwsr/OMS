import React, { useState, useEffect } from 'react';
import { Mail, Settings, User, AlertCircle, CheckCircle } from 'lucide-react';
import EmailSetup from './EmailSetup';
import Inbox from './Inbox';
import SendEmail from './SendEmail';
import './EmailManager.css';

const EmailManager = () => {
  const [emailConfig, setEmailConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [error, setError] = useState('');

  useEffect(() => {
    checkEmailConfiguration();
  }, []);

  const checkEmailConfiguration = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please login to access email features');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:5001/api/emails/config', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEmailConfig(data);
        if (!data.configured) {
          // Only show setup if email is not configured
          setShowSetup(true);
        } else {
          // Email is already configured, go directly to inbox
          setActiveTab('inbox');
        }
      } else {
        setError(data.message || 'Failed to check email configuration');
      }
    } catch (error) {
      console.error('Error checking email config:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetupComplete = (config) => {
    setEmailConfig(config);
    setShowSetup(false);
    if (config.configured) {
      setActiveTab('inbox');
    }
  };

  const handleShowSetup = () => {
    setShowSetup(true);
  };

  const handleCompose = () => {
    if (!emailConfig?.configured) {
      setShowSetup(true);
      return;
    }
    setShowCompose(true);
  };

  const handleEmailSent = () => {
    setShowCompose(false);
    setActiveTab('inbox');
    // Optionally refresh inbox
  };

  if (loading) {
    return (
      <div className="email-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading email configuration...</p>
        </div>
      </div>
    );
  }

  if (error && !emailConfig) {
    return (
      <div className="email-manager">
        <div className="error-container">
          <AlertCircle size={48} />
          <h3>Email Service Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={checkEmailConfiguration}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="email-manager">
      {/* Email Header */}
      <div className="email-header">
        <div className="header-left">
          <Mail size={24} />
          <h1>Email Manager</h1>
          
          {emailConfig?.configured && (
            <div className="email-status">
              <CheckCircle size={16} />
              <span>{emailConfig.smtpEmail}</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          {emailConfig?.configured && (
            <button 
              className="btn btn-primary"
              onClick={handleCompose}
            >
              <Mail size={16} />
              Compose
            </button>
          )}
          
          <button 
            className="btn btn-secondary"
            onClick={handleShowSetup}
          >
            <Settings size={16} />
            {emailConfig?.configured ? 'Email Settings' : 'Setup Email'}
          </button>
        </div>
      </div>

      {/* Email Configuration Warning */}
      {!emailConfig?.configured && (
        <div className="config-warning">
          <AlertCircle size={20} />
          <div className="warning-content">
            <h3>Email Not Configured</h3>
            <p>
              Please configure your Hostinger email account to send and receive emails.
              You'll need your @tars.co.in email credentials.
            </p>
            <button className="btn btn-primary" onClick={handleShowSetup}>
              <Settings size={16} />
              Setup Email Now
            </button>
          </div>
        </div>
      )}

      {/* Email Navigation */}
      {emailConfig?.configured && (
        <div className="email-nav">
          <button 
            className={`nav-tab ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => setActiveTab('inbox')}
          >
            <Mail size={16} />
            Inbox
          </button>
          <button 
            className={`nav-tab ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            <User size={16} />
            Sent
          </button>
        </div>
      )}

      {/* Email Content */}
      <div className="email-content">
        {emailConfig?.configured && activeTab === 'inbox' && (
          <Inbox 
            onCompose={handleCompose}
            selectedFolder="INBOX"
          />
        )}

        {emailConfig?.configured && activeTab === 'sent' && (
          <Inbox 
            onCompose={handleCompose}
            selectedFolder="SENT"
          />
        )}

        {!emailConfig?.configured && (
          <div className="empty-state">
            <Mail size={64} />
            <h3>Welcome to Email Manager</h3>
            <p>Configure your email account to get started</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showSetup && (
        <EmailSetup 
          onSetupComplete={handleSetupComplete}
          onCancel={() => setShowSetup(false)}
          currentConfig={emailConfig}
        />
      )}

      {showCompose && (
        <SendEmail 
          onClose={() => setShowCompose(false)}
          onEmailSent={handleEmailSent}
        />
      )}
    </div>
  );
};

export default EmailManager;
