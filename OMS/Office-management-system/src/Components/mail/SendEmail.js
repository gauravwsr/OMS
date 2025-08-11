import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "./SendEmail.css";

const SendEmail = () => {
  const [email, setEmail] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);

  // Function to handle going back to the previous page
  const handleBack = () => {
    window.history.back(); // Goes back to the previous page
  };

  const saveDraft = async () => {
    if (!email && !cc && !bcc && !subject && !body) {
      alert('Draft is empty. Please add some content before saving.');
      return;
    }

    setIsSaving(true);

    try {
      console.log('Saving draft with data:', { to: email, cc, bcc, subject, body });
      
      const response = await fetch('http://146.190.165.62:5001/api/emails/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: email,
          cc: cc,
          bcc: bcc,
          subject: subject,
          body: body
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        console.log('Draft saved successfully:', data.draft);
      } else {
        alert(`❌ Failed to save draft: ${data.message}`);
        console.error('Draft save failed:', data);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("❌ An error occurred while saving the draft. Please check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    if (!email && !cc && !bcc) {
      alert('📧 Please provide at least one recipient (To, Cc, or Bcc).');
      return;
    }

    if (!subject || !body) {
      alert('📝 Please fill in both subject and message body.');
      return;
    }

    setIsSending(true);

    try {
      console.log('Sending email with data:', { to: email, cc, bcc, subject, body: body.substring(0, 100) + '...' });
      
      const response = await fetch('http://146.190.165.62:5001/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: email,
          cc: cc,
          bcc: bcc,
          subject: subject,
          body: body
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        console.log('Email sent successfully:', data.messageId);
        
        // Clear form after successful send
        setEmail('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setAttachment(null);
        setShowCc(false);
        setShowBcc(false);
      } else {
        alert(`❌ Failed to send email: ${data.message}`);
        console.error('Email send failed:', data);
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("❌ An error occurred while sending the email. Please check your connection and email configuration.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="compose-container">
      <button className="back-button" onClick={handleBack}>
        <ArrowLeft size={16} />
        Back
      </button>

      <form className="compose-form" onSubmit={sendEmail}>
        <h2 className="compose-header">Compose Email</h2>

        <div className="form-group">
          <input
            type="email"
            id="to"
            className="input-field"
            placeholder="Recipient"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="cc-bcc-toggle">
            {!showCc && (
              <button
                type="button"
                className="toggle-button"
                onClick={() => setShowCc(true)}
              >
                + Cc
              </button>
            )}
            {!showBcc && (
              <button
                type="button"
                className="toggle-button"
                onClick={() => setShowBcc(true)}
              >
                + Bcc
              </button>
            )}
          </div>
        </div>

        {showCc && (
          <div className="form-group">
            <input
              type="email"
              id="cc"
              className="input-field"
              placeholder="Cc (Carbon Copy)"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
            <button
              type="button"
              className="remove-field-button"
              onClick={() => {
                setCc('');
                setShowCc(false);
              }}
            >
              ×
            </button>
          </div>
        )}

        {showBcc && (
          <div className="form-group">
            <input
              type="email"
              id="bcc"
              className="input-field"
              placeholder="Bcc (Blind Carbon Copy)"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
            <button
              type="button"
              className="remove-field-button"
              onClick={() => {
                setBcc('');
                setShowBcc(false);
              }}
            >
              ×
            </button>
          </div>
        )}

        <div className="form-group">
          <input
            type="text"
            id="subject"
            className="input-field"
            placeholder="Subject"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="form-group">
          <textarea
            id="body"
            className="textarea-field"
            rows="10"
            placeholder="Compose your email"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="attachment-label" htmlFor="attachment">
            Attach File
          </label>
          <input
            type="file"
            id="attachment"
            className="file-input"
            onChange={(e) => setAttachment(e.target.files[0])}
          />
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="draft-button"
            onClick={saveDraft}
            disabled={isSaving || isSending}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="submit"
            className="send-button"
            disabled={isSaving || isSending}
          >
            {isSending ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendEmail;
