import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthProvider/AuthContext';
import { Settings, Mail, Lock, Server, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import './EmailConfig.css';

const EmailConfig = ({ onConfigured, isModal = false }) => {
  const { user } = useAuth();
  const [emailConfig, setEmailConfig] = useState({
    email: '',
    password: '',
    imapHost: 'mail.hostinger.com',
    imapPort: '993',
    smtpHost: 'smtp.hostinger.com',
    smtpPort: '465'
  });
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);

  // Email provider presets
  const emailPresets = {
    gmail: {
      imapHost: 'imap.gmail.com',
      imapPort: '993',
      smtpHost: 'smtp.gmail.com',
      smtpPort: '587'
    },
    outlook: {
      imapHost: 'outlook.office365.com',
      imapPort: '993',
      smtpHost: 'smtp-mail.outlook.com',
      smtpPort: '587'
    },
    yahoo: {
      imapHost: 'imap.mail.yahoo.com',
      imapPort: '993',
      smtpHost: 'smtp.mail.yahoo.com',
      smtpPort: '587'
    },
    hostinger: {
      imapHost: 'mail.hostinger.com',
      imapPort: '993',
      smtpHost: 'smtp.hostinger.com',
      smtpPort: '465'
    }
  };

  useEffect(() => {
    checkEmailConfiguration();
  }, []);

  const checkEmailConfiguration = async () => {
    setCheckingConfig(true);
    try {
      const token = localStorage.getItem('token');
      console.log('Checking email config with token:', token ? 'Present' : 'Missing');
      
      const response = await fetch('http://146.190.165.62:5001/api/emails/check-config', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (response.ok && data.configured) {
        setIsConfigured(true);
        setEmailConfig(prev => ({ ...prev, email: data.email }));
        if (onConfigured && !isModal) {
          onConfigured();
        }
      }
    } catch (error) {
      console.error('Error checking email configuration:', error);
      setTestStatus({ type: 'error', message: 'Failed to check email configuration' });
    } finally {
      setCheckingConfig(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEmailConfig(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear any previous status messages
    if (testStatus) {
      setTestStatus(null);
    }
  };

  const handleEmailProviderChange = (e) => {
    const provider = e.target.value;
    if (provider && emailPresets[provider]) {
      setEmailConfig(prev => ({
        ...prev,
        ...emailPresets[provider]
      }));
      setTestStatus({ type: 'info', message: `Settings updated for ${provider}` });
    }
  };

  const testEmailConnection = async () => {
    setLoading(true);
    setTestStatus({ type: 'info', message: 'Testing connection...' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://146.190.165.62:5001/api/emails/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...emailConfig,
          testOnly: true
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestStatus({ type: 'success', message: 'Connection test successful!' });
      } else {
        setTestStatus({ type: 'error', message: data.message || 'Connection test failed' });
      }
    } catch (error) {
      console.error('Test connection error:', error);
      setTestStatus({ type: 'error', message: 'Network error occurred during test' });
    } finally {
      setLoading(false);
    }
  };

  const saveEmailConfiguration = async () => {
    setLoading(true);
    setTestStatus({ type: 'info', message: 'Saving configuration...' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://146.190.165.62:5001/api/emails/configure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emailConfig)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestStatus({ type: 'success', message: 'Email configured successfully!' });
        setIsConfigured(true);
        setTimeout(() => {
          if (onConfigured) {
            onConfigured();
          }
        }, 1500);
      } else {
        setTestStatus({ type: 'error', message: data.message || 'Configuration failed' });
      }
    } catch (error) {
      console.error('Save configuration error:', error);
      setTestStatus({ type: 'error', message: 'Network error occurred while saving' });
    } finally {
      setLoading(false);
    }
  };

  const removeEmailConfiguration = async () => {
    if (!window.confirm('Are you sure you want to remove your email configuration? This will delete all your saved email credentials.')) {
      return;
    }

    setLoading(true);
    setTestStatus({ type: 'info', message: 'Removing configuration...' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://146.190.165.62:5001/api/emails/remove-config', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setTestStatus({ type: 'success', message: 'Email configuration removed successfully!' });
        setIsConfigured(false);
        setEmailConfig({
          email: '',
          password: '',
          imapHost: 'mail.hostinger.com',
          imapPort: '993',
          smtpHost: 'smtp.hostinger.com',
          smtpPort: '465'
        });
        
        setTimeout(() => {
          if (onConfigured) {
            onConfigured();
          }
        }, 1000);
      } else {
        setTestStatus({ type: 'error', message: data.message || 'Failed to remove configuration' });
      }
    } catch (error) {
      console.error('Remove configuration error:', error);
      setTestStatus({ type: 'error', message: 'Network error occurred while removing configuration' });
    } finally {
      setLoading(false);
    }
  };

  if (checkingConfig) {
    return (
      <div className="email-config-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking email configuration...</p>
        </div>
      </div>
    );
  }

  if (isConfigured && !isModal) {
    return (
      <div className="email-config-success">
        <CheckCircle className="success-icon" />
        <h3>Email Configured Successfully!</h3>
        <p>Your email ({emailConfig.email}) is ready to use.</p>
        <div className="config-actions">
          <button 
            className="reconfigure-button"
            onClick={() => setIsConfigured(false)}
          >
            <Settings size={16} />
            Edit Configuration
          </button>
          <button 
            className="remove-config-button"
            onClick={removeEmailConfiguration}
            disabled={loading}
          >
            {loading ? 'Removing...' : 'Remove Configuration'}
          </button>
        </div>
        {testStatus && (
          <div className={`status-message ${testStatus.type}`}>
            {testStatus.type === 'success' ? 
              <CheckCircle size={16} /> : 
              <AlertCircle size={16} />
            }
            <span>{testStatus.message}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="email-config-container">
      <div className="email-config-header">
        <Mail className="header-icon" />
        <h2>Configure Your Email</h2>
        <p>Enter your email credentials to fetch your personal emails</p>
      </div>

      <form className="email-config-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="emailProvider">
            <Server size={16} />
            Email Provider (Optional)
          </label>
          <select
            id="emailProvider"
            name="emailProvider"
            onChange={handleEmailProviderChange}
            className="provider-select"
          >
            <option value="">Select a provider to auto-fill settings</option>
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook/Hotmail</option>
            <option value="yahoo">Yahoo Mail</option>
            <option value="hostinger">Hostinger</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="email">
            <Mail size={16} />
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={emailConfig.email}
            onChange={handleInputChange}
            placeholder="your-email@domain.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">
            <Lock size={16} />
            Password / App Password
          </label>
          <div className="password-input-container">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              name="password"
              value={emailConfig.password}
              onChange={handleInputChange}
              placeholder="Your email password or app password"
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
            For Gmail, use an App Password instead of your regular password.
          </small>
        </div>

        <div className="server-settings">
          <h4>
            <Server size={16} />
            Server Settings
          </h4>
          
          <div className="server-group">
            <div className="form-group">
              <label htmlFor="imapHost">IMAP Host</label>
              <input
                type="text"
                id="imapHost"
                name="imapHost"
                value={emailConfig.imapHost}
                onChange={handleInputChange}
                placeholder="mail.hostinger.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="imapPort">IMAP Port</label>
              <input
                type="number"
                id="imapPort"
                name="imapPort"
                value={emailConfig.imapPort}
                onChange={handleInputChange}
                placeholder="993"
              />
            </div>
          </div>

          <div className="server-group">
            <div className="form-group">
              <label htmlFor="smtpHost">SMTP Host</label>
              <input
                type="text"
                id="smtpHost"
                name="smtpHost"
                value={emailConfig.smtpHost}
                onChange={handleInputChange}
                placeholder="smtp.hostinger.com"
              />
            </div>
            <div className="form-group">
              <label htmlFor="smtpPort">SMTP Port</label>
              <input
                type="number"
                id="smtpPort"
                name="smtpPort"
                value={emailConfig.smtpPort}
                onChange={handleInputChange}
                placeholder="465"
              />
            </div>
          </div>
        </div>

        {testStatus && (
          <div className={`status-message ${testStatus.type}`}>
            {testStatus.type === 'success' ? 
              <CheckCircle size={16} /> : 
              testStatus.type === 'error' ? 
              <AlertCircle size={16} /> :
              <Settings size={16} />
            }
            <span>{testStatus.message}</span>
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            className="test-button"
            onClick={testEmailConnection}
            disabled={loading || !emailConfig.email || !emailConfig.password}
          >
            {loading ? 'Testing...' : 'Test Connection'}
          </button>
          
          <button
            type="button"
            className="save-button"
            onClick={saveEmailConfiguration}
            disabled={loading || !emailConfig.email || !emailConfig.password}
          >
            {loading ? 'Saving...' : 'Save & Configure'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailConfig;
