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
        drafts.map((draft, index) => (
          <div key={draft._id || draft.id || `draft-${index}`} className="email-row draft-row" onClick={() => handleDraftClick(draft)} style={{cursor: 'pointer'}}>
            <div className="email-name">
              <label className="email-label draft-label">
                📝 {draft.to || "No recipient"}
                {draft.cc && <span style={{fontSize: '11px', color: '#666'}}> (CC: {draft.cc})</span>}
              </label>
            </div>
            <div className="email-content">
              {draft.subject || "(No subject)"}
              {draft.body && (
                <div style={{fontSize: '11px', color: '#666', marginTop: '2px'}}>
                  {draft.body.length > 50 ? `${draft.body.substring(0, 50)}...` : draft.body}
                </div>
              )}
              {draft.attachments && draft.attachments.length > 0 && (
                <div style={{fontSize: '11px', color: '#007bff', marginTop: '2px'}}>
                  📎 {draft.attachments.length} attachment{draft.attachments.length > 1 ? 's' : ''}
                  {draft.attachments.length <= 3 && (
                    <span style={{color: '#666', marginLeft: '5px'}}>
                      ({draft.attachments.map(att => att.originalname || att.filename).join(', ')})
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="email-time-actions">
              <span className="email-time">
                {draft.date && !isNaN(new Date(draft.date))
                  ? new Date(draft.date).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "No date"}
              </span>
              <div className="draft-actions">
                <button 
                  className="edit-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditDraft(draft);
                  }}
                  disabled={loading}
                >
                  ✏️ Edit
                </button>
                <button 
                  className="send-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    sendMail(draft);
                  }}
                  disabled={loading}
                >
                  📤 Send
                </button>
                <button 
                  className="delete-button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteDraft(draft._id);
                  }}
                  disabled={loading}
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="no-emails-message">
          📝 No drafts available. 
          <button onClick={fetchDrafts} className="refresh-button">
            🔄 Refresh
          </button>
        </div>
      )}
    </div>
  );
};

export default DraftSection;
