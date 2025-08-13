import React, { useState, useEffect } from 'react';
import { Cloud, Upload, Settings, CheckCircle, XCircle, Loader } from 'lucide-react';
import './CloudinaryConfig.css';

const CloudinaryConfig = ({ onConfigured }) => {
  const [credentials, setCredentials] = useState({
    cloudName: '',
    apiKey: '',
    apiSecret: ''
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    checkCloudinaryStatus();
  }, []);

  const checkCloudinaryStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/cloudinary/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setIsConfigured(data.configured);
      setIsConnected(data.connected);

      if (data.configured && data.cloudName) {
        setCredentials(prev => ({ ...prev, cloudName: data.cloudName }));
      }
    } catch (error) {
      console.error('Error checking Cloudinary status:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const handleConfigure = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await fetch('http://localhost:5001/api/cloudinary/configure', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Cloudinary configured successfully!');
        setIsConfigured(true);
        setIsConnected(true);
        if (onConfigured) onConfigured();
        
        // Get stats after configuration
        getStats();
      } else {
        setError(data.message || 'Failed to configure Cloudinary');
      }
    } catch (error) {
      setError(error.message || 'Error configuring Cloudinary');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/cloudinary/test', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSuccess('Connection test successful!');
        setIsConnected(true);
      } else {
        setError(data.message || 'Connection test failed');
        setIsConnected(false);
      }
    } catch (error) {
      setError('Error testing connection');
      setIsConnected(false);
    } finally {
      setTesting(false);
    }
  };

  const getStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/cloudinary/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error getting stats:', error);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="cloudinary-config">
      <div className="config-header">
        <Cloud className="icon" />
        <div>
          <h2>Cloudinary Configuration</h2>
          <p>Configure Cloudinary for storing email attachments and files</p>
        </div>
        <div className="status-indicators">
          <div className={`status-badge ${isConfigured ? 'success' : 'error'}`}>
            {isConfigured ? <CheckCircle size={16} /> : <XCircle size={16} />}
            {isConfigured ? 'Configured' : 'Not Configured'}
          </div>
          {isConfigured && (
            <div className={`status-badge ${isConnected ? 'success' : 'error'}`}>
              {isConnected ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="alert error">
          <XCircle className="alert-icon" />
          {error}
        </div>
      )}

      {success && (
        <div className="alert success">
          <CheckCircle className="alert-icon" />
          {success}
        </div>
      )}

      <form onSubmit={handleConfigure} className="config-form">
        <div className="form-group">
          <label htmlFor="cloudName">Cloud Name</label>
          <input
            type="text"
            id="cloudName"
            name="cloudName"
            value={credentials.cloudName}
            onChange={handleInputChange}
            placeholder="your-cloud-name"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <input
            type="text"
            id="apiKey"
            name="apiKey"
            value={credentials.apiKey}
            onChange={handleInputChange}
            placeholder="123456789012345"
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="apiSecret">API Secret</label>
          <input
            type="password"
            id="apiSecret"
            name="apiSecret"
            value={credentials.apiSecret}
            onChange={handleInputChange}
            placeholder="your-api-secret"
            required
            disabled={loading}
          />
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn primary"
            disabled={loading || !credentials.cloudName || !credentials.apiKey || !credentials.apiSecret}
          >
            {loading ? (
              <>
                <Loader className="spinning" />
                Configuring...
              </>
            ) : (
              <>
                <Settings className="icon" />
                Configure Cloudinary
              </>
            )}
          </button>

          {isConfigured && (
            <button
              type="button"
              onClick={handleTest}
              className="btn secondary"
              disabled={testing}
            >
              {testing ? (
                <>
                  <Loader className="spinning" />
                  Testing...
                </>
              ) : (
                <>
                  <Upload className="icon" />
                  Test Connection
                </>
              )}
            </button>
          )}
        </div>
      </form>

      {stats && isConfigured && (
        <div className="stats-section">
          <h3>Storage Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Plan</span>
              <span className="stat-value">{stats.plan || 'Free'}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Storage Used</span>
              <span className="stat-value">{formatBytes(stats.bytes_used || 0)}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Objects</span>
              <span className="stat-value">{stats.objects_used || 0}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Bandwidth</span>
              <span className="stat-value">{formatBytes(stats.bandwidth_used || 0)}</span>
            </div>
          </div>
        </div>
      )}

      <div className="info-section">
        <h3>How to get Cloudinary credentials:</h3>
        <ol>
          <li>Go to <a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer">cloudinary.com</a> and create an account</li>
          <li>Navigate to your Dashboard</li>
          <li>Find your Cloud Name, API Key, and API Secret in the "Account Details" section</li>
          <li>Copy and paste them into the form above</li>
        </ol>
        
        <div className="feature-list">
          <h4>Features enabled with Cloudinary:</h4>
          <ul>
            <li>✅ Automatic file optimization and compression</li>
            <li>✅ Global CDN delivery for fast file access</li>
            <li>✅ Support for all file types (images, documents, videos)</li>
            <li>✅ Secure file storage with backup</li>
            <li>✅ Easy file management and organization</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CloudinaryConfig;
