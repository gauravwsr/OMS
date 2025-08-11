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
      const response = await fetch('http://146.190.165.62:5001/api/emails/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          body: body
        })
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
      const response = await fetch('http://146.190.165.62:5001/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          body: body
        })
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