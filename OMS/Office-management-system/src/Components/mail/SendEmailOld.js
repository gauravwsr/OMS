import React, { useState, useEffect } from 'react';
import { X, Send, Paperclip, Save, Users, User } from 'lucide-react';
import './SendEmail.css';

const SendEmail = ({ onClose, onEmailSent, draftData = null }) => {
  const [to, setTo] = useState(draftData?.to?.join(', ') || '');
  const [cc, setCc] = useState(draftData?.cc?.join(', ') || '');
  const [bcc, setBcc] = useState(draftData?.bcc?.join(', ') || '');
  const [subject, setSubject] = useState(draftData?.subject || '');
  const [text, setText] = useState(draftData?.textContent || '');
  const [html, setHtml] = useState(draftData?.htmlContent || '');
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [composerMode, setComposerMode] = useState('text'); // 'text' or 'html'

  useEffect(() => {
    if (draftData?.cc?.length > 0 || draftData?.bcc?.length > 0) {
      setShowCcBcc(true);
    }
  }, [draftData]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Get password for email operation
    const password = prompt('Enter your email password to send:');
    if (!password) {
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();

      // Convert comma-separated emails to arrays
      const toEmails = to.split(',').map(email => email.trim()).filter(Boolean);
      const ccEmails = cc.split(',').map(email => email.trim()).filter(Boolean);
      const bccEmails = bcc.split(',').map(email => email.trim()).filter(Boolean);

      // Append email data
      formData.append('to', JSON.stringify(toEmails));
      if (ccEmails.length > 0) formData.append('cc', JSON.stringify(ccEmails));
      if (bccEmails.length > 0) formData.append('bcc', JSON.stringify(bccEmails));
      formData.append('subject', subject);
      formData.append('text', text);
      if (html) formData.append('html', html);
      formData.append('passwordCheck', password);

      // Append attachments
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      const response = await fetch('http://localhost:5001/api/emails/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email');
      }

      alert('Email sent successfully!');
      onEmailSent();
    } catch (error) {
      console.error('Error sending email:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const toEmails = to.split(',').map(email => email.trim()).filter(Boolean);
      const ccEmails = cc.split(',').map(email => email.trim()).filter(Boolean);
      const bccEmails = bcc.split(',').map(email => email.trim()).filter(Boolean);

      const draftPayload = {
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject,
        text,
        html,
      };

      const url = draftData?.id 
        ? `http://localhost:5001/api/emails/drafts/${draftData.id}`
        : 'http://localhost:5001/api/emails/drafts';

      const response = await fetch(url, {
        method: draftData?.id ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(draftPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save draft');
      }

      alert('Draft saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="compose-overlay">
      <div className="compose-modal">
        <div className="compose-header">
          <h3>Compose Email</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSendEmail} className="compose-form">
          <div className="compose-recipients">
            <div className="recipient-field">
              <label>To:</label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="recipient@example.com, another@example.com"
                required
              />
              <button
                type="button"
                className="cc-bcc-toggle"
                onClick={() => setShowCcBcc(!showCcBcc)}
              >
                <Users size={14} />
                {showCcBcc ? 'Hide' : 'Cc/Bcc'}
              </button>
            </div>

            {showCcBcc && (
              <>
                <div className="recipient-field">
                  <label>Cc:</label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                  />
                </div>
                <div className="recipient-field">
                  <label>Bcc:</label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                  />
                </div>
              </>
            )}

            <div className="recipient-field">
              <label>Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
                required
              />
            </div>
          </div>

          <div className="compose-toolbar">
            <div className="composer-mode-switch">
              <button
                type="button"
                className={`mode-btn ${composerMode === 'text' ? 'active' : ''}`}
                onClick={() => setComposerMode('text')}
              >
                Text
              </button>
              <button
                type="button"
                className={`mode-btn ${composerMode === 'html' ? 'active' : ''}`}
                onClick={() => setComposerMode('html')}
              >
                HTML
              </button>
            </div>

            <div className="attachment-section">
              <input
                type="file"
                id="attachment-input"
                multiple
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                className="attachment-btn"
                onClick={() => document.getElementById('attachment-input').click()}
              >
                <Paperclip size={16} />
                Attach Files
              </button>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="attachments-list">
              <h4>Attachments:</h4>
              {attachments.map((file, index) => (
                <div key={index} className="attachment-item">
                  <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(index)}
                    className="remove-attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="compose-content">
            {composerMode === 'text' ? (
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write your email message here..."
                rows="12"
                required
              />
            ) : (
              <div className="html-editor">
                <textarea
                  value={html}
                  onChange={(e) => setHtml(e.target.value)}
                  placeholder="<p>Write your HTML email content here...</p>"
                  rows="12"
                />
                <small>You can use HTML tags for formatting</small>
              </div>
            )}
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="compose-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleSaveDraft}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !to || !subject}
            >
              <Send size={16} />
              {loading ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SendEmail;
//         <div style={styles.formGroup}>
//           <input
//             type="text"
//             id="subject"
//             name="subject"
//             placeholder="Subject"
//             required
//             value={subject}
//             onChange={(e) => setSubject(e.target.value)}
//             style={styles.input}
//           />
//         </div>
//         <div style={styles.formGroup}>
//           <textarea
//             id="body"
//             name="body"
//             rows="10"
//             placeholder="Compose your email"
//             required
//             value={body}
//             onChange={(e) => setBody(e.target.value)}
//             style={styles.textarea}
//           />
//         </div>
//         <div style={styles.formGroup}>
//           <label style={styles.attachmentLabel} htmlFor="attachment">
//             Attach File
//           </label>
//           <input
//             type="file"
//             id="attachment"
//             name="attachment"
//             onChange={(e) => setAttachment(e.target.files[0])}
//             style={styles.fileInput}
//           />
//         </div>
//         <div style={styles.formActions}>
//           <button type="button" onClick={sendEmail} style={styles.sendButton}>
//             Send
//           </button>
//         </div>
//       </form>
//     </div>
//   );
// };

// const styles = {
//   container: {
//     fontFamily: 'Arial, sans-serif',
//     margin: 0,
//     marginLeft: '17%',
//     padding: 0,
//     backgroundColor: '#f1f3f4',
//     display: 'flex',
//     justifyContent: 'center',
//     alignItems: 'center',
//     height: '100vh',
//     flexDirection: 'column', // Added column layout for back button
//   },
//   backButton: {
//     position: 'absolute',
//     marginLeft: '16%',
//     top: '20px',
//     left: '20px',
//     background: 'none',
//     border: 'none',
//     fontSize: '20px',
//     cursor: 'pointer',
//     color: '#1a73e8',
//   },
//   form: {
//     backgroundColor: '#fff',
//     padding: '20px',
//     borderRadius: '8px',
//     boxShadow: '0 4px 10px rgba(0, 0, 0, 0.2)',
//     width: '100%',
//     maxWidth: '600px',
//     marginTop: '60px', // Adjusted for space after the back button
//   },
//   header: {
//     marginBottom: '20px',
//     color: '#202124',
//     fontSize: '20px',
//     borderBottom: '1px solid #ddd',
//     paddingBottom: '10px',
//   },
//   formGroup: {
//     marginBottom: '15px',
//   },
//   input: {
//     width: '100%',
//     padding: '12px',
//     border: '1px solid #dadce0',
//     borderRadius: '4px',
//     fontSize: '16px',
//     outline: 'none',
//     transition: 'border 0.2s',
//   },
//   textarea: {
//     width: '100%',
//     padding: '12px',
//     border: '1px solid #dadce0',
//     borderRadius: '4px',
//     fontSize: '16px',
//     resize: 'none',
//     outline: 'none',
//     transition: 'border 0.2s',
//   },
//   attachmentLabel: {
//     fontSize: '14px',
//     marginBottom: '5px',
//     display: 'block',
//     color: '#5f6368',
//   },
//   fileInput: {
//     display: 'block',
//   },
//   formActions: {
//     display: 'flex',
//     justifyContent: 'flex-end',
//   },
//   sendButton: {
//     padding: '12px 24px',
//     border: 'none',
//     borderRadius: '4px',
//     fontSize: '14px',
//     cursor: 'pointer',
//     backgroundColor: '#1a73e8',
//     color: '#fff',
//     transition: 'background-color 0.2s',
//   },
// };

// export default SendEmail;


import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import './SendEmail.css';

const SendEmail = () => {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Function to handle going back to the previous page
  const handleBack = () => {
    window.history.back(); // Goes back to the previous page
  };

  const saveDraft = async () => {
    if (!email && !subject && !body) {
      alert('Draft is empty. Nothing to save.');
      return;
    }

    setIsSaving(true);

    const draftData = {
      to: email,
      subject: subject,
      body: body,
      date: new Date().toISOString()
    };

    try {
      const response = await fetch('http://localhost:5001/api/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftData),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Draft saved successfully!');
      } else {
        alert(`Failed to save draft: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while saving the draft.');
    } finally {
      setIsSaving(false);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    if (!email || !subject || !body) {
      alert('Please fill in all required fields.');
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('subject', subject);
    formData.append('body', body);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const response = await fetch('http://localhost:5001/api/send-email', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        alert('Email sent successfully!');
        // Clear form after successful send
        setEmail('');
        setSubject('');
        setBody('');
        setAttachment(null);
      } else {
        alert(`Failed to send email: ${data.message}`);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while sending the email.');
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
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

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
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            type="submit"
            className="send-button"
            disabled={isSaving || isSending}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SendEmail;