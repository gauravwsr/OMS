import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';

const InboxSection = ({ emails }) => {
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
    if (email.attachments && email.attachments.length > 0) {
      return '📎';
    }
    if (email.isRead === false) return '📩';
    if (email.isImportant) return '⭐';
    return '📧';
  };

  const truncateContent = (content, maxLength = 60) => {
    if (!content) return '';
    return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
  };
  
  return (
    <div className="email-list">
      <div className="email-header-row">
        <div className="column-name">From</div>
        <div className="column-content">Subject & Preview</div>
        <div className="column-time">Time</div>
      </div>
      
      {emails.length > 0 ? (
        emails.map((email, index) => (
          <div 
            key={email._id || email.id || `inbox-email-${index}`} 
            className={`email-row ${email.isRead === false ? 'unread-email' : ''}`} 
            onClick={() => handleEmailClick(email)}
          >
            <div className="email-name">
              <div className="email-sender-info">
                <span className="email-icon">{getEmailIcon(email)}</span>
                <label className="email-label" title={email.sender || email.from}>
                  {email.sender || email.from || 'Unknown Sender'}
                </label>
                {email.isRead === false && <span className="unread-indicator">●</span>}
              </div>
            </div>
            <div className="email-content">
              <div className="email-subject-preview">
                <div className="email-subject" title={email.subject}>
                  {email.subject || '(No Subject)'}
                </div>
                {email.body && (
                  <div className="email-preview">
                    {truncateContent(email.body)}
                  </div>
                )}
              </div>
              {email.attachments && email.attachments.length > 0 && (
                <div className="attachment-info">
                  <span className="attachment-icon">📎</span>
                  <span className="attachment-text">
                    {email.attachments.length} attachment{email.attachments.length > 1 ? 's' : ''}
                  </span>
                  {email.attachments.length <= 3 && (
                    <span className="attachment-preview">
                      ({email.attachments.map(att => att.filename || att.originalname || 'file').join(', ')})
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="email-time">
              {formatDate(email.date)}
            </div>
          </div>
        ))
      ) : (
        <div className="no-emails-message">
          <div>📬 No emails in your inbox</div>
          <small>New emails will appear here when they arrive</small>
        </div>
      )}
    </div>
  );
};

export default InboxSection;