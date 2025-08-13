import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import "./SendEmail.css";

const SendEmail = () => {
  const location = useLocation();
  const { emailData, action, draftData } = location.state || {};

  const [email, setEmail] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [cloudinaryFiles, setCloudinaryFiles] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftId, setDraftId] = useState(null);

  // Pre-fill form when coming from reply, forward, or editing draft
  useEffect(() => {
    // Handle draft editing
    if (draftData) {
      console.log('📝 Editing draft:', draftData);
      setEmail(draftData.to || '');
      setCc(draftData.cc || '');
      setBcc(draftData.bcc || '');
      setSubject(draftData.subject || '');
      setBody(draftData.body || '');
      setIsEditingDraft(true);
      setDraftId(draftData._id);
      
      // Show CC/BCC fields if they have values
      if (draftData.cc) setShowCc(true);
      if (draftData.bcc) setShowBcc(true);
      
      // Handle attachments if they exist
      if (draftData.attachments && draftData.attachments.length > 0) {
        setAttachments(draftData.attachments);
      }
    }
    // Handle reply/forward
    else if (emailData) {
      if (emailData.to) setEmail(emailData.to);
      if (emailData.cc) setCc(emailData.cc);
      if (emailData.bcc) setBcc(emailData.bcc);
      if (emailData.subject) setSubject(emailData.subject);
      if (emailData.body) setBody(emailData.body);
      
      // Show CC/BCC fields if they have values
      if (emailData.cc) setShowCc(true);
      if (emailData.bcc) setShowBcc(true);
    }
  }, [emailData, draftData]);

  // Function to handle going back to the previous page
  const handleBack = () => {
    window.history.back(); // Goes back to the previous page
  };

  // File attachment handling functions
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (attachments.length + files.length > 10) {
      alert('⚠️ Maximum 10 files allowed. Please remove some files first.');
      return;
    }
    
    // Validate each file
    for (const file of files) {
      // File size validation (25MB)
      if (file.size > 25 * 1024 * 1024) {
        alert(`⚠️ File "${file.name}" is too large. Maximum size is 25MB.`);
        return;
      }
      
      // File type validation
      const allowedTypes = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar|csv|xlsx|xls|ppt|pptx)$/i;
      if (!allowedTypes.test(file.name)) {
        alert(`⚠️ File type not allowed: "${file.name}". Only images, documents, and archives are allowed.`);
        return;
      }
    }
    
    // Add files to attachments
    setAttachments(prev => [...prev, ...files]);
    console.log('📎 Files added:', files.map(f => ({ name: f.name, size: f.size })));
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };
  
  const removeAttachment = (index) => {
    const removedFile = attachments[index];
    setAttachments(prev => prev.filter((_, i) => i !== index));
    
    // Also remove corresponding Cloudinary file if it exists
    setCloudinaryFiles(prev => prev.filter(cf => cf.originalname !== removedFile.name));
    
    console.log('🗑️ File removed at index:', index, '- File:', removedFile.name);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const saveDraft = async () => {
    if (!email && !cc && !bcc && !subject && !body) {
      alert('Draft is empty. Please add some content before saving.');
      return;
    }

    setIsSaving(true);

    try {
      console.log('Saving draft with data:', { to: email, cc, bcc, subject, body });
      
      // Check if user has a token, if not use test endpoint
      const token = localStorage.getItem('token');
      
      // Determine if we're updating an existing draft or creating a new one
      let endpoint, method;
      if (isEditingDraft && draftId) {
        console.log('📝 Updating existing draft:', draftId);
        endpoint = token ? `/api/emails/update-draft/${draftId}` : `/api/emails/test-update-draft/${draftId}`;
        method = 'PUT';
      } else {
        console.log('📝 Creating new draft');
        endpoint = token ? '/api/emails/save-draft' : '/api/emails/test-save-draft';
        method = 'POST';
      }
      
      const headers = token ? {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      } : {
        'Content-Type': 'application/json'
      };
      
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: method,
        headers: headers,
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
        
        // If we were creating a new draft, now we're editing it
        if (!isEditingDraft && data.draft && data.draft._id) {
          setIsEditingDraft(true);
          setDraftId(data.draft._id);
          console.log('📝 Now editing draft:', data.draft._id);
        }
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
      console.log('Sending email with data:', { 
        to: email, 
        cc, 
        bcc, 
        subject, 
        body: body.substring(0, 100) + '...',
        attachments: attachments.map(f => ({ name: f.name, size: f.size }))
      });
      
      // Create FormData for file uploads
      const formData = new FormData();
      formData.append('to', email);
      formData.append('cc', cc);
      formData.append('bcc', bcc);
      formData.append('subject', subject);
      formData.append('body', body);
      formData.append('isReply', action === 'reply');
      formData.append('isForward', action === 'forward');
      if (emailData?.messageId) {
        formData.append('originalMessageId', emailData.messageId);
      }
      
      // Add attachments
      attachments.forEach((file) => {
        formData.append('attachments', file);
      });
      
      // Debug: Log form data contents
      console.log('📤 FormData contents:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}:`, { name: value.name, size: value.size, type: value.type });
        } else {
          console.log(`${key}:`, value);
        }
      }
      
      // Check if user has a token, if not use test endpoint
      const token = localStorage.getItem('token');
      const endpoint = token ? '/api/emails/send' : '/api/emails/test-send';
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
      
      const response = await fetch(`http://localhost:5001${endpoint}`, {
        method: 'POST',
        headers: headers,
        // Don't set Content-Type for FormData, let browser set it
        body: formData
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        // Handle Cloudinary attachment information
        if (data.cloudinaryFiles && data.cloudinaryFiles.length > 0) {
          console.log('☁️ Cloudinary Files:', data.cloudinaryFiles);
          setCloudinaryFiles(data.cloudinaryFiles);
          
          // Show detailed success message with Cloudinary info
          const attachmentInfo = data.cloudinaryFiles.map(file => 
            `📁 ${file.originalname} (${(file.cloudinary.bytes / 1024 / 1024).toFixed(2)} MB)`
          ).join('\n');
          
          alert(`✅ ${data.message}\n\n📎 Attachments uploaded to cloud:\n${attachmentInfo}\n\n🔗 Files are now accessible via secure URLs`);
        } else {
          alert(`✅ ${data.message}${data.attachmentCount > 0 ? ` (${data.attachmentCount} attachment${data.attachmentCount > 1 ? 's' : ''})` : ''}`);
        }
        
        console.log('Email sent successfully:', data.messageId);
        
        // If we were editing a draft, delete it after successful send
        if (isEditingDraft && draftId) {
          try {
            console.log('🗑️ Deleting draft after send:', draftId);
            const token = localStorage.getItem('token');
            const deleteEndpoint = token ? `/api/emails/delete-draft/${draftId}` : `/api/emails/test-delete-draft/${draftId}`;
            const deleteHeaders = token ? { 'Authorization': `Bearer ${token}` } : {};
            
            await fetch(`http://localhost:5001${deleteEndpoint}`, {
              method: 'DELETE',
              headers: deleteHeaders
            });
            console.log('✅ Draft deleted after send');
          } catch (deleteError) {
            console.warn('⚠️ Failed to delete draft after send:', deleteError);
          }
        }
        
        // Clear form after successful send
        setEmail('');
        setCc('');
        setBcc('');
        setSubject('');
        setBody('');
        setAttachments([]);
        setCloudinaryFiles([]);
        setUploadProgress([]);
        setShowCc(false);
        setShowBcc(false);
        setIsEditingDraft(false);
        setDraftId(null);
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
      {/* Fixed Header Section */}
      <div className="compose-header-section">
        <div className="header-left">
          <button className="back-button" onClick={handleBack}>
            <ArrowLeft size={16} />
            Back
          </button>
          <h1 className="compose-title">
            {action === 'reply' ? 'Reply to Email' : 
             action === 'forward' ? 'Forward Email' : 
             'Compose Email'}
            {isEditingDraft && (
              <span className="draft-indicator">Editing Draft</span>
            )}
          </h1>
        </div>
      </div>

      <form className="compose-form" onSubmit={sendEmail}>

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
            📎 Attach Files (Max 10 files, 25MB each)
          </label>
          <input
            type="file"
            id="attachment"
            className="file-input"
            multiple
            accept=".jpeg,.jpg,.png,.gif,.pdf,.doc,.docx,.txt,.zip,.rar,.csv,.xlsx,.xls,.ppt,.pptx"
            onChange={handleFileChange}
          />
        </div>

        {/* Display attached files */}
        {attachments.length > 0 && (
          <div className="attachments-preview">
            <h4>📎 Attached Files ({attachments.length}/10):</h4>
            <div className="attachments-list">
              {attachments.map((file, index) => {
                const cloudFile = cloudinaryFiles.find(cf => cf.originalname === file.name);
                return (
                  <div key={index} className="attachment-item">
                    <span className="file-icon">
                      {cloudFile ? '☁️' : '📄'}
                    </span>
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({formatFileSize(file.size)})</span>
                      {cloudFile && (
                        <div className="cloudinary-info">
                          <small style={{color: '#10b981'}}>
                            ✅ Uploaded to cloud ({cloudFile.cloudinary.format.toUpperCase()})
                          </small>
                          <br />
                          <small style={{color: '#6b7280'}}>
                            🔗 <a 
                              href={cloudFile.cloudinary.secure_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              style={{color: '#3b82f6'}}
                            >
                              View in Cloud
                            </a>
                          </small>
                        </div>
                      )}
                      {isSending && !cloudFile && (
                        <div className="upload-status">
                          <small style={{color: '#f59e0b'}}>⏳ Uploading to cloud...</small>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="remove-attachment-btn"
                      onClick={() => removeAttachment(index)}
                      title="Remove file"
                      disabled={isSending}
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
            {cloudinaryFiles.length > 0 && (
              <div className="cloudinary-summary">
                <small style={{color: '#10b981', display: 'block', marginTop: '10px'}}>
                  ☁️ {cloudinaryFiles.length} file{cloudinaryFiles.length > 1 ? 's' : ''} successfully uploaded to Cloudinary
                </small>
              </div>
            )}
          </div>
        )}

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
