import React, { useEffect, useState } from "react";
import "./Inbox.css";

const DraftSection = ({ drafts: propDrafts }) => {
  const [drafts, setDrafts] = useState(propDrafts || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setDrafts(propDrafts || []);
  }, [propDrafts]);

  const sendMail = async (draft) => {
    if (!draft.to || !draft.subject || !draft.body) {
      alert("Incomplete draft. Cannot send.");
      return;
    }

    const formData = new FormData();
    formData.append("email", draft.to);
    formData.append("subject", draft.subject);
    formData.append("body", draft.body);

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/emails/send", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: draft.to,
          subject: draft.subject,
          body: draft.body
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Email sent successfully!");
        // Remove the draft from the list
        setDrafts(drafts.filter((d) => d.id !== draft.id));
        // Delete the draft after successful send
        try {
          await fetch(`http://localhost:5001/api/emails/delete-draft/${draft._id}`, {
            method: "DELETE",
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          });
          // Remove the draft from the list
          setDrafts(drafts.filter(d => d._id !== draft._id));
        } catch (deleteError) {
          console.error("Error deleting draft:", deleteError);
          // Still remove from UI even if delete fails
          setDrafts(drafts.filter(d => d._id !== draft._id));
        }
      } else {
        alert(`Failed to send email: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while sending the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="email-list">
      <div className="email-header-row">
        <div className="column-name">To</div>
        <div className="column-content">Subject</div>
        <div className="column-time">Date</div>
      </div>

      {loading ? (
        <p className="loading-message">Loading drafts...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : drafts.length > 0 ? (
        drafts.map((draft, index) => (
          <div key={draft._id || index} className="email-row draft-row">
            <div className="email-name">
              <input
                type="checkbox"
                id={`draft-${draft._id || index}`}
                className="email-checkbox"
              />
            
              <label htmlFor={`draft-${draft._id || index}`} className="email-label draft-label">

                {draft.to || "No recipient"}
              </label>
            </div>
            <div className="email-content">{draft.subject || "No subject"}</div>
            <div className="email-time-actions">
              <span className="email-time">
                {draft.date && !isNaN(new Date(draft.date))
                  ? new Date(draft.date).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "No date"}
              </span>
              <button className="send-button" onClick={() => sendMail(draft)}>
                Send
              </button>
            </div>
          </div>
        ))
      ) : (
        <div className="no-emails-message">No drafts available.</div>
      )}
    </div>
  );
};

export default DraftSection;
