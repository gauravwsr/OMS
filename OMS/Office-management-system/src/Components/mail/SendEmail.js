<<<<<<< HEAD
// import React, { useState } from 'react';

// const SendEmail = () => {
//   const [email, setEmail] = useState('');
//   const [subject, setSubject] = useState('');
//   const [body, setBody] = useState('');
//   const [attachment, setAttachment] = useState(null);

//   // Function to handle going back to the previous page
//   const handleBack = () => {
//     window.history.back(); // Goes back to the previous page
//   };

//   const sendEmail = async () => {
//     const formData = new FormData();
//     formData.append('email', email);
//     formData.append('subject', subject);
//     formData.append('body', body);
//     if (attachment) {
//       formData.append('attachment', attachment);
//     }

//     try {
//       const response = await fetch('http://localhost:5001/api/send-email', {
//       const response = await fetch('http://localhost:5001/api/send-email', {
//         method: 'POST',
//         body: formData,
//       });

//       const data = await response.json();
//       if (response.ok) {
//         alert('Email sent successfully!');

//       } else {
//         alert(`Failed to send email: ${data.message}`);
//       }
//     } catch (error) {
//       console.error('Error:', error);
//       alert('An error occurred while sending the email.');
//     }
//   };

//   return (
//     <div style={styles.container}>
//       <button onClick={handleBack} style={styles.backButton}>
//         ← Back
//       </button>
//       <form style={styles.form} onSubmit={(e) => e.preventDefault()}>
//         <h2 style={styles.header}>Compose Email</h2>
//         <div style={styles.formGroup}>
//           <input
//             type="email"
//             id="to"
//             name="to"
//             placeholder="Recipient"
//             required
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             style={styles.input}
//           />
//         </div>
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

import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import "./SendEmail.css";
=======
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import './SendEmail.css';
>>>>>>> f352f76c519260eac44ee5a784da470c43b78238

const SendEmail = () => {
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Function to handle going back to the previous page
  const handleBack = () => {
    window.history.back(); // Goes back to the previous page
  };

  const saveDraft = async () => {
    if (!email && !subject && !body) {
      alert("Draft is empty. Nothing to save.");
      return;
    }

    setIsSaving(true);

    const draftData = {
      to: email,
      subject: subject,
      body: body,
      date: new Date().toISOString(),
    };

    try {
<<<<<<< HEAD
      const response = await fetch("http://localhost:5001/api/save-draft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
=======
      const response = await fetch('http://localhost:5001/api/emails/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
>>>>>>> f352f76c519260eac44ee5a784da470c43b78238
        },
        body: JSON.stringify({
          to: email,
          subject: subject,
          body: body
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert("Draft saved successfully!");
      } else {
        alert(`Failed to save draft: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while saving the draft.");
    } finally {
      setIsSaving(false);
    }
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    if (!email || !subject || !body) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsSending(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("subject", subject);
    formData.append("body", body);
    if (attachment) {
      formData.append("attachment", attachment);
    }

    try {
<<<<<<< HEAD
      const response = await fetch("http://localhost:5001/api/send-email", {
        method: "POST",
        body: formData,
=======
      const response = await fetch('http://localhost:5001/api/emails/send', {
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
>>>>>>> f352f76c519260eac44ee5a784da470c43b78238
      });

      const data = await response.json();
      if (response.ok) {
        alert("Email sent successfully!");
        // Clear form after successful send
        setEmail("");
        setSubject("");
        setBody("");
        setAttachment(null);
      } else {
        alert(`Failed to send email: ${data.message}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred while sending the email.");
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
