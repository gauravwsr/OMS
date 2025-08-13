import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';

const SentSection = ({ emails }) => {
  const navigate = useNavigate();
  
  const handleEmailClick = (email) => {
    navigate('email-details', { state: { email } });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getEmailIcon = (email) => {
    if (email.attachments && email.attachments.length > 0) return '📎';
    if (email.isReply) return '↩️';
    if (email.isForward) return '↪️';
    return '📧';
  };

  const getSourceBadge = (email) => {
    if (email.source === 'local') return '💾';
    if (email.source === 'imap') return '☁️';
    return '';
  };
  
  return (
    <div className="email-list">
      <div className="email-header-row">
        <div className="column-name">To</div>
        <div className="column-content">Subject</div>
        <div className="column-time">Time</div>
      </div>
      
      {emails.length > 0 ? (
        emails.map((email, index) => (
          <div key={email._id || email.id || `sent-email-${index}`} className="email-row" onClick={() => handleEmailClick(email)}>
            <div className="email-name">
              <input
                type="checkbox"
                id={`email-${email._id || email.id || index}`}
                className="email-checkbox"
                onClick={(e) => e.stopPropagation()}
              />
              <label htmlFor={`email-${email._id || email.id || index}`} className="email-label">
                {email.to || email.recipient || 'Unknown'}
                {email.cc && <span className="cc-indicator"> (+CC)</span>}
              </label>
            </div>
            <div className="email-content">
              <div className="email-subject-line">
                <span className="email-icon">{getEmailIcon(email)}</span>
                <span className="source-badge" title={email.source === 'local' ? 'Stored locally' : 'From email server'}>{getSourceBadge(email)}</span>
                <span className="email-subject">{email.subject || 'No Subject'}</span>
                {email.attachments && email.attachments.length > 0 && (
                  <span className="attachment-count">({email.attachments.length})</span>
                )}
              </div>
            </div>
            <div className="email-time">
              {formatDate(email.date || email.sentAt)}
            </div>
          </div>
        ))
      ) : (
        <div className="no-emails-message">
          <div>📬 No sent emails to show</div>
          <small>Emails you send will appear here</small>
        </div>
      )}
    </div>
  );
};

export default SentSection;