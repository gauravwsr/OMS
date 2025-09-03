import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import "./Inbox.css";

const DraftSection = ({ drafts: propDrafts }) => {
  const [drafts, setDrafts] = useState(propDrafts || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (propDrafts && propDrafts.length > 0) {
      setDrafts(propDrafts);
    } else {
      // If no props drafts, fetch from API
      fetchDrafts();
    }
  }, [propDrafts]);

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString))) {
      return "No date";
    }
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const getDraftStatus = (draft) => {
    if (!draft.to) return 'incomplete';
    if (!draft.subject) return 'missing-subject';
    if (!draft.body) return 'missing-content';
    return 'ready';
  };

  const getDraftStatusIcon = (status) => {
    switch (status) {
      case 'incomplete': return '⚠️';
      case 'missing-subject': return '📝';
      case 'missing-content': return '✏️';
      case 'ready': return '✅';
      default: return '📄';
    }
  };

  const getDraftStatusText = (status) => {
    switch (status) {
      case 'incomplete': return 'Incomplete';
      case 'missing-subject': return 'No Subject';
      case 'missing-content': return 'No Content';
      case 'ready': return 'Ready to Send';
      default: return 'Draft';
    }
  };

  const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handleDraftClick = (draft) => {
    // Navigate to email details page with draft data
    navigate('email-details', { state: { email: draft, isDraft: true } });
  };

  const handleEditDraft = (draft) => {
    // Navigate to compose page with draft data for editing
    navigate('send-email', { state: { draftData: draft } });
  };

  const fetchDrafts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching drafts...');
      
      // Check if user has a token, if not use test endpoint
      const token = localStorage.getItem('token');
      const endpoint = token ? '/api/emails/drafts' : '/api/emails/test-drafts';
      const headers = token ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      } : {
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'GET',
        headers: headers
      });

      const data = await response.json();
      
      if (response.ok) {
        const fetchedDrafts = data.emails || data || [];
        console.log(`📝 Found ${fetchedDrafts.length} drafts:`, fetchedDrafts);
        setDrafts(fetchedDrafts);
        setError(null);
      } else {
        console.error('Failed to fetch drafts:', data.message);
        setError(data.message || 'Failed to fetch drafts');
        setDrafts([]);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      setError('Failed to load drafts. Please check your connection.');
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMail = async (draft) => {
    if (!draft.to || !draft.subject || !draft.body) {
      alert("Incomplete draft. Cannot send.");
      return;
    }

    setLoading(true);

    try {
      console.log('📤 Sending draft email:', { to: draft.to, subject: draft.subject });
      
      // Check if user has a token, if not use test endpoint
      const token = localStorage.getItem('token');
      const endpoint = token ? '/api/emails/send' : '/api/emails/test-send';
      const headers = token ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      } : {
        'Content-Type': 'application/json'
      };

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          to: draft.to,
          cc: draft.cc || '',
          bcc: draft.bcc || '',
          subject: draft.subject,
          body: draft.body,
        }),
      });

      const data = await response.json();
      if (response.ok && data.success) {
        alert("✅ Email sent successfully!");
        console.log('Email sent, now deleting draft...');
        
        // Delete the draft after successful send
        await deleteDraft(draft._id);
        
      } else {
        alert(`❌ Failed to send email: ${data.message}`);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("❌ An error occurred while sending the email.");
    } finally {
      setLoading(false);
    }
  };

  const deleteDraft = async (draftId) => {
    try {
      console.log('🗑️ Deleting draft:', draftId);
      
      // Check if user has a token, if not use test endpoint
      const token = localStorage.getItem('token');
      const endpoint = token ? `/api/emails/delete-draft/${draftId}` : `/api/emails/test-delete-draft/${draftId}`;
      const headers = token ? {
        'Authorization': `Bearer ${token}`
      } : {};

      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: "DELETE",
        headers: headers,
      });

      if (response.ok) {
        console.log('✅ Draft deleted successfully');
        // Remove the draft from the list
        setDrafts(prev => prev.filter((d) => d._id !== draftId));
      } else {
        console.warn('⚠️ Failed to delete draft from server, removing from UI');
        // Still remove from UI even if delete fails
        setDrafts(prev => prev.filter((d) => d._id !== draftId));
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
      // Still remove from UI even if delete fails
      setDrafts(prev => prev.filter((d) => d._id !== draftId));
    }
  };

  return (
    <div className="email-list">
      <div className="email-header-row">
        <div className="column-name">To</div>
        <div className="column-content">Subject</div>
        <div className="column-time">
          Date
          <button 
            className="refresh-button" 
            onClick={fetchDrafts}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-message">🔄 Loading drafts...</p>
      ) : error ? (
        <div className="error-message">
          <p>❌ {error}</p>
          <button onClick={fetchDrafts} className="retry-button">
            🔄 Retry
          </button>
        </div>
      ) : drafts.length > 0 ? (
        drafts.map((draft, index) => {
          const status = getDraftStatus(draft);
          return (
            <div 
              key={draft._id || draft.id || `draft-${index}`} 
              className={`email-row draft-row draft-status-${status}`} 
              onClick={() => handleDraftClick(draft)} 
              style={{cursor: 'pointer'}}
            >
              <div className="email-name">
                <div className="draft-info">
                  <span className="draft-status-icon">{getDraftStatusIcon(status)}</span>
                  <label className="email-label draft-label">
                    {draft.to || "No recipient"}
                    {draft.cc && <span className="cc-info"> (CC: {truncateText(draft.cc, 20)})</span>}
                  </label>
                  <span className="draft-status-badge">{getDraftStatusText(status)}</span>
                </div>
              </div>
              <div className="email-content">
                <div className="draft-subject-line">
                  <span className="draft-subject">{draft.subject || "(No subject)"}</span>
                  {draft.body && (
                    <div className="draft-preview">
                      {truncateText(draft.body, 60)}
                    </div>
                  )}
                </div>
                {draft.attachments && draft.attachments.length > 0 && (
                  <div className="draft-attachments">
                    <span className="attachment-icon">📎</span>
                    <span className="attachment-count">
                      {draft.attachments.length} file{draft.attachments.length > 1 ? 's' : ''}
                    </span>
                    {draft.attachments.length <= 3 && (
                      <span className="attachment-list">
                        ({draft.attachments.map(att => att.originalname || att.filename).join(', ')})
                      </span>
                    )}
                  </div>
                )}
              </div>
              <div className="email-time-actions">
                <span className="email-time">
                  {formatDate(draft.date)}
                </span>
                <div className="draft-actions">
                  <button 
                    className="edit-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditDraft(draft);
                    }}
                    disabled={loading}
                    title="Edit Draft"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className={`send-button ${status !== 'ready' ? 'disabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (status === 'ready') {
                        sendMail(draft);
                      } else {
                        alert(`Cannot send: ${getDraftStatusText(status)}`);
                      }
                    }}
                    disabled={loading || status !== 'ready'}
                    title={status === 'ready' ? "Send Email" : `Cannot send: ${getDraftStatusText(status)}`}
                  >
                    📤 Send
                  </button>
                  <button 
                    className="delete-button" 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this draft?')) {
                        deleteDraft(draft._id);
                      }
                    }}
                    disabled={loading}
                    title="Delete Draft"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="no-emails-message">
          <div>📝 No drafts available</div> 
          <small>Your draft emails will appear here</small>
          <button onClick={fetchDrafts} className="refresh-button" style={{marginTop: '12px'}}>
            🔄 Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftSection;
