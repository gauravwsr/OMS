import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Inbox.css';

const InboxSection = ({ emails }) => {
  const navigate = useNavigate();
  
  const handleEmailClick = (email) => {
    navigate('email-details', { state: { email } });
  };
  
  return (
    <div className="email-list">
      <div className="email-header-row">
        <div className="column-name">Name</div>
        <div className="column-content">Mail</div>
        <div className="column-time">Time</div>
      </div>
      
      {emails.length > 0 ? (
        emails.map((email) => (
          <div key={email._id || email.id} className="email-row" onClick={() => handleEmailClick(email)}>
            <div className="email-name">
              {/* <input
                type="checkbox"
                id={`email-${email._id || email.id}`}
                className="email-checkbox"
              /> */}
              <label htmlFor={`email-${email._id || email.id}`} className="email-label">
                {email.sender || email.from}
              </label>
            </div>
            <div className="email-content">
              {email.subject}
            </div>
            <div className="email-time">
              {new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
            </div>
          </div>
        ))
      ) : (
        <div className="no-emails-message">No emails to show</div>
      )}
    </div>
  );
};

export default InboxSection;