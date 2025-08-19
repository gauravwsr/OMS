import React, { useState, useEffect } from 'react';
import './TestEmail.css'; // Create this CSS file if needed

const TestEmail = () => {
  const [localDrafts, setLocalDrafts] = useState([]);
  const [sentEmails, setSentEmails] = useState([]);
  const [allDrafts, setAllDrafts] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = 'http://localhost:5001/api/emails';

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // Fetch local drafts (from MongoDB)
  const fetchLocalDrafts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/drafts`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setLocalDrafts(data.emails || []);
        setError(null);
      } else {
        setError(`Failed to fetch drafts: ${data.message}`);
      }
    } catch (err) {
      setError(`Error fetching drafts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sent emails
  const fetchSentEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/sent`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setSentEmails(data.emails || []);
        setError(null);
        console.log('Sent emails fetched:', data);
      } else {
        setError(`Failed to fetch sent emails: ${data.message}`);
      }
    } catch (err) {
      setError(`Error fetching sent emails: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all drafts (local + IMAP)
  const fetchAllDrafts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/all-drafts`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setAllDrafts(data.emails || []);
        setError(null);
        console.log('All drafts fetched:', data);
      } else {
        setError(`Failed to fetch all drafts: ${data.message}`);
      }
    } catch (err) {
      setError(`Error fetching all drafts: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Get connection status
  const getConnectionStatus = async () => {
    try {
      const response = await fetch(`${BASE_URL}/connection-status`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setConnectionStatus(data);
      }
    } catch (err) {
      console.error('Error getting connection status:', err);
    }
  };

  // Delete a draft
  const deleteDraft = async (draftId) => {
    try {
      const response = await fetch(`${BASE_URL}/drafts/${draftId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        alert('Draft deleted successfully!');
        fetchLocalDrafts(); // Refresh the list
      } else {
        alert(`Failed to delete draft: ${data.message}`);
      }
    } catch (err) {
      alert(`Error deleting draft: ${err.message}`);
    }
  };

  // Clean up connections
  const cleanupConnections = async () => {
    try {
      const response = await fetch(`${BASE_URL}/cleanup-connections`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({})
      });
      const data = await response.json();
      if (response.ok) {
        alert(`Connections cleaned up: ${data.message}`);
        getConnectionStatus(); // Refresh status
      }
    } catch (err) {
      alert(`Error cleaning connections: ${err.message}`);
    }
  };

  useEffect(() => {
    // Load initial data
    fetchLocalDrafts();
    getConnectionStatus();
  }, []);

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Email System Test Dashboard</h1>
      
      {error && (
        <div style={{ color: 'red', padding: '10px', background: '#ffe6e6', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading && <div style={{ padding: '10px', color: '#666' }}>Loading...</div>}

      {/* Action Buttons */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button onClick={fetchLocalDrafts} disabled={loading}>Fetch Local Drafts</button>
        <button onClick={fetchSentEmails} disabled={loading}>Fetch Sent Emails</button>
        <button onClick={fetchAllDrafts} disabled={loading}>Fetch All Drafts</button>
        <button onClick={getConnectionStatus}>Check Connection Status</button>
        <button onClick={cleanupConnections}>Cleanup Connections</button>
      </div>

      {/* Connection Status */}
      {connectionStatus && (
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>Connection Status</h3>
          <p>Active Connections: {connectionStatus.activeConnections}</p>
          {connectionStatus.connections?.length > 0 && (
            <div>
              <h4>Active IMAP Connections:</h4>
              {connectionStatus.connections.map((conn, index) => (
                <div key={index} style={{ fontSize: '0.9em', marginLeft: '10px' }}>
                  • {conn.user} - {conn.server} - Last used: {formatDate(conn.lastUsed)}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Local Drafts */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Local Drafts ({localDrafts.length})</h2>
        {localDrafts.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No local drafts found</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {localDrafts.map((draft, index) => (
              <div key={draft.draftId || index} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                borderRadius: '4px',
                background: '#f9f9f9'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <strong>Subject:</strong> {draft.subject || 'No Subject'}<br />
                    <strong>To:</strong> {draft.to || 'No recipient'}<br />
                    {draft.cc && <><strong>Cc:</strong> {draft.cc}<br /></>}
                    {draft.bcc && <><strong>Bcc:</strong> {draft.bcc}<br /></>}
                    <strong>Date:</strong> {formatDate(draft.date)}<br />
                    <strong>Body:</strong> <div style={{ maxHeight: '100px', overflow: 'auto', marginTop: '5px', padding: '5px', background: 'white', border: '1px solid #eee' }} dangerouslySetInnerHTML={{ __html: draft.body }} />
                  </div>
                  {draft.draftId && (
                    <button 
                      onClick={() => deleteDraft(draft.draftId)}
                      style={{ 
                        background: 'red', 
                        color: 'white', 
                        border: 'none', 
                        padding: '5px 10px', 
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sent Emails */}
      <div style={{ marginBottom: '30px' }}>
        <h2>Sent Emails ({sentEmails.length})</h2>
        {sentEmails.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>No sent emails found</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {sentEmails.map((email, index) => (
              <div key={email.messageId || index} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                borderRadius: '4px',
                background: '#f0f8ff'
              }}>
                <strong>Subject:</strong> {email.subject}<br />
                <strong>To:</strong> {email.to}<br />
                <strong>From:</strong> {email.from}<br />
                <strong>Date:</strong> {formatDate(email.date)}<br />
                <strong>Body Preview:</strong> 
                <div style={{ 
                  maxHeight: '100px', 
                  overflow: 'auto', 
                  marginTop: '5px', 
                  padding: '5px', 
                  background: 'white', 
                  border: '1px solid #eee',
                  fontSize: '0.9em'
                }} dangerouslySetInnerHTML={{ __html: email.body?.substring(0, 300) + '...' }} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Drafts */}
      {allDrafts.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h2>All Drafts (Local + IMAP) ({allDrafts.length})</h2>
          <div style={{ display: 'grid', gap: '10px' }}>
            {allDrafts.map((draft, index) => (
              <div key={draft.messageId || index} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                borderRadius: '4px',
                background: draft.isLocal ? '#f9f9f9' : '#fff5ee'
              }}>
                <div style={{ fontSize: '0.8em', color: '#666', marginBottom: '5px' }}>
                  {draft.isLocal ? '📱 Local Draft' : '📧 IMAP Draft'}
                </div>
                <strong>Subject:</strong> {draft.subject}<br />
                <strong>To:</strong> {draft.to}<br />
                {draft.cc && <><strong>Cc:</strong> {draft.cc}<br /></>}
                {draft.bcc && <><strong>Bcc:</strong> {draft.bcc}<br /></>}
                <strong>Date:</strong> {formatDate(draft.date)}<br />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestEmail;
