import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';

const SentSection = ({ emails }) => {
  const navigate = useNavigate();
  
  const handleEmailClick = (email) => {
    navigate('email-details', { state: { email } });
  };

  // Function to download Cloudinary files
  const downloadCloudinaryFile = async (attachment, event) => {
    event.stopPropagation(); // Prevent email row click
    
    try {
      const filename = attachment.originalname || attachment.filename || attachment.name || 'download';
      
      if (attachment.cloudinary?.secure_url || attachment.secure_url) {
        const cloudinaryUrl = attachment.cloudinary?.secure_url || attachment.secure_url;
        console.log('☁️ Downloading Cloudinary file:', filename);
        
        // Create download link
        const link = document.createElement('a');
        link.href = cloudinaryUrl;
        link.download = filename;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
      } else {
        console.error('No Cloudinary URL found for attachment');
        alert('❌ Cannot download: No Cloudinary URL found');
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert(`❌ Download failed: ${error.message}`);
    }
  };

  // Helper function to format file size
  const getFileSizeDisplay = (bytes) => {
    if (!bytes) return '';
    
    if (bytes > 1024 * 1024) {
      return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    } else if (bytes > 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${bytes} B`;
    }
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
      // Check if any attachment is from Cloudinary
      const hasCloudinaryAttachment = email.attachments.some(att => 
        att.cloudinary || att.secure_url || att.public_id
      );
      return hasCloudinaryAttachment ? '☁️📎' : '📎';
    }
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
              {/* <input
                type="checkbox"
                id={`email-${email._id || email.id || index}`}
                className="email-checkbox"
                onClick={(e) => e.stopPropagation()}
              /> */}
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
                  <span className="attachment-count" title={`${email.attachments.length} attachment${email.attachments.length > 1 ? 's' : ''}`}>
                    ({email.attachments.length}
                    {email.attachments.some(att => att.cloudinary || att.secure_url || att.public_id) && (
                      <span className="cloud-indicator" title="Stored in Cloudinary">☁️</span>
                    )}
                    )
                  </span>
                )}
              </div>
              
              {/* Cloudinary Files Preview */}
              {email.attachments && email.attachments.some(att => att.cloudinary || att.secure_url) && (
                <div className="cloudinary-files-preview" onClick={(e) => e.stopPropagation()}>
                  <div className="cloudinary-files-label">☁️ Cloudinary Files:</div>
                  <div className="cloudinary-files-list">
                    {email.attachments
                      .filter(att => att.cloudinary || att.secure_url)
                      .slice(0, 2) // Show only first 2 files to save space
                      .map((attachment, attIndex) => (
                        <div key={attIndex} className="cloudinary-file-item">
                          <span className="file-info">
                            📄 {attachment.originalname || attachment.filename || `file_${attIndex + 1}`}
                            {(attachment.cloudinary?.format || attachment.format) && (
                              <span className="file-format"> .{attachment.cloudinary?.format || attachment.format}</span>
                            )}
                            {(attachment.size || attachment.cloudinary?.bytes) && (
                              <span className="file-size"> ({getFileSizeDisplay(attachment.size || attachment.cloudinary?.bytes)})</span>
                            )}
                          </span>
                          <div className="file-actions">
                            <button
                              className="file-action-btn download-btn"
                              onClick={(e) => downloadCloudinaryFile(attachment, e)}
                              title="Download from Cloudinary"
                            >
                              ⬇️
                            </button>
                            <a
                              href={attachment.cloudinary?.secure_url || attachment.secure_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="file-action-btn view-btn"
                              title="View in new tab"
                              onClick={(e) => e.stopPropagation()}
                            >
                              👁️
                            </a>
                          </div>
                        </div>
                      ))}
                    
                    {/* Show count for additional files */}
                    {email.attachments.filter(att => att.cloudinary || att.secure_url).length > 2 && (
                      <div className="more-files-indicator">
                        +{email.attachments.filter(att => att.cloudinary || att.secure_url).length - 2} more files
                      </div>
                    )}
                  </div>
                </div>
              )}
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