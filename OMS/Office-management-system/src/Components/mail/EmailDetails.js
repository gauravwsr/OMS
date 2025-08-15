import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Reply, Forward, ArrowLeft, Send, Paperclip, X, ChevronDown, ChevronUp } from 'lucide-react';
import './EmailDetails.css';

const EmailDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email } = location.state || {};
  
  // State for reply functionality
  const [isReplying, setIsReplying] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [forwardTo, setForwardTo] = useState('');
  const [forwardCc, setForwardCc] = useState('');
  const [forwardText, setForwardText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [showOriginal, setShowOriginal] = useState(true);
  const [showPreviousMessage, setShowPreviousMessage] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState(new Set([0])); // First message expanded by default
  
  const replyTextareaRef = useRef(null);
  const forwardTextareaRef = useRef(null);

  // Auto-focus reply textarea when opened
  useEffect(() => {
    if (isReplying && replyTextareaRef.current) {
      replyTextareaRef.current.focus();
    }
  }, [isReplying]);

  useEffect(() => {
    if (isForwarding && forwardTextareaRef.current) {
      forwardTextareaRef.current.focus();
    }
  }, [isForwarding]);

  if (!email) {
    return <p className="text-center mt-5">No email details available.</p>;
  }

  // Function to download file from Cloudinary or local server
  const downloadAttachment = async (attachment, attachmentIndex) => {
    try {
      console.log('📥 Downloading attachment:', attachment);
      
      let downloadUrl;
      let filename = attachment.originalname || attachment.filename || attachment.name || 'attachment';
      
      // Determine the download URL based on attachment type
      if (attachment.cloudinary?.secure_url || attachment.secure_url) {
        // For Cloudinary files, use server proxy to fetch the actual file
        const fileUrl = attachment.cloudinary?.secure_url || attachment.secure_url;
        downloadUrl = `http://localhost:5001/api/emails/download-attachment?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`;
        console.log('☁️ Fetching Cloudinary file via proxy:', fileUrl);
        
        // Use fetch to get the file as a blob for proper download
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        // Get the file as a blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Cloudinary file downloaded successfully:', filename);
        return;
        
      } else if (attachment.hasContent && email.seqno) {
        // IMAP attachments - use new endpoint
        console.log('📧 Downloading IMAP attachment from email server');
        
        const folder = email.folder || 'INBOX';
        
        downloadUrl = `http://localhost:5001/api/emails/download-imap-attachment?` +
          `folder=${encodeURIComponent(folder)}&` +
          `seqno=${email.seqno}&` +
          `attachmentIndex=${attachmentIndex}&` +
          `filename=${encodeURIComponent(filename)}`;
          
        console.log('📧 IMAP download URL:', downloadUrl);
        
        // For IMAP downloads, we need to use fetch with auth headers
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`IMAP download failed: ${response.status} - ${errorText}`);
        }
        
        // Create blob from response
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
        
        console.log('✅ IMAP attachment downloaded successfully:', filename);
        return;
        
      } else if (attachment.path) {
        // For local files stored on server
        const localFileUrl = attachment.path.startsWith('/') ? 
          `http://localhost:5001${attachment.path}` : 
          `http://localhost:5001/uploads/${attachment.path}`;
        downloadUrl = `http://localhost:5001/api/emails/download-attachment?url=${encodeURIComponent(localFileUrl)}&filename=${encodeURIComponent(filename)}`;
        console.log('📁 Fetching local file via proxy:', localFileUrl);
        
        // Use fetch to get the file as a blob
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Local file downloaded successfully:', filename);
        return;
        
      } else if (attachment.url) {
        // For files with direct URL
        downloadUrl = `http://localhost:5001/api/emails/download-attachment?url=${encodeURIComponent(attachment.url)}&filename=${encodeURIComponent(filename)}`;
        console.log('🔗 Fetching direct URL file via proxy:', attachment.url);
        
        const response = await fetch(downloadUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log('✅ Direct URL file downloaded successfully:', filename);
        return;
        
      } else {
        console.warn('⚠️ Unknown attachment type:', attachment);
        alert('Unable to determine download method for this attachment');
        return;
      }
      
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download attachment: ' + error.message);
    }
  };

  // Handle reply action
  const handleReplyClick = () => {
    setIsForwarding(false);
    setIsReplying(!isReplying);
    setReplyText('');
  };

  // Handle forward action
  const handleForwardClick = () => {
    setIsReplying(false);
    setIsForwarding(!isForwarding);
    setForwardTo('');
    setForwardCc('');
    setForwardText('');
  };

  // Send reply
  const handleSendReply = async () => {
    if (!replyText.trim()) {
      alert('Please enter a reply message.');
      return;
    }

    setIsSending(true);

    try {
      const replyBody = `${replyText}\n\n--- Original Message ---\nFrom: ${email.from || email.sender}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject || 'No Subject'}\n\n${email.body || ''}`;
      
      const response = await fetch('http://localhost:5001/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: email.from || email.sender,
          subject: email.subject?.startsWith('Re: ') ? email.subject : `Re: ${email.subject || 'No Subject'}`,
          body: replyBody,
          isReply: true,
          originalMessageId: email.messageId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        setReplyText('');
        setIsReplying(false);
      } else {
        alert(`❌ Failed to send reply: ${data.message}`);
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('❌ An error occurred while sending the reply.');
    } finally {
      setIsSending(false);
    }
  };

  // Send forward
  const handleSendForward = async () => {
    if (!forwardTo.trim() || !forwardText.trim()) {
      alert('Please enter recipient and message.');
      return;
    }

    setIsSending(true);

    try {
      const forwardBody = `${forwardText}\n\n--- Forwarded Message ---\nFrom: ${email.from || email.sender}\nDate: ${new Date(email.date).toLocaleString()}\nTo: ${email.to || ''}\nSubject: ${email.subject || 'No Subject'}\n\n${email.body || ''}`;
      
      const response = await fetch('http://localhost:5001/api/emails/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          to: forwardTo,
          cc: forwardCc || '',
          subject: email.subject?.startsWith('Fwd: ') ? email.subject : `Fwd: ${email.subject || 'No Subject'}`,
          body: forwardBody,
          isForward: true,
          originalMessageId: email.messageId
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        alert(`✅ ${data.message}`);
        setForwardTo('');
        setForwardCc('');
        setForwardText('');
        setIsForwarding(false);
      } else {
        alert(`❌ Failed to forward email: ${data.message}`);
      }
    } catch (error) {
      console.error('Error forwarding email:', error);
      alert('❌ An error occurred while forwarding the email.');
    } finally {
      setIsSending(false);
    }
  };

  // Function to strip HTML tags for better display
  const stripHtmlTags = (html) => {
    if (!html) return '';
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  };

  // Function to parse reply/forward content and extract original message
  const parseEmailContent = (body, depth = 0, maxDepth = 3) => {
    if (!body || depth > maxDepth) return { currentMessage: '', originalMessage: null, allMessages: [] };

    // More comprehensive markers for different email clients
    const originalMessageMarkers = [
      '--- Original Message ---',
      '--- Forwarded Message ---',
      '---------- Original Message ----------',
      '---------- Forwarded message ----------',
      'From:',  // Simple from header
      'On ', // Gmail style "On Mon, Aug 11, 2025 at..."
      '________________________________', // Outlook separator
      '> ', // Quote marker
      'Begin forwarded message:',
      'Original Message',
      'Forwarded Message'
    ];

    // Find the best split point by checking multiple patterns
    let bestSplitPoint = -1;
    let messageType = 'original';
    let usedMarker = '';

    for (const marker of originalMessageMarkers) {
      const index = body.indexOf(marker);
      if (index !== -1 && (bestSplitPoint === -1 || index < bestSplitPoint)) {
        bestSplitPoint = index;
        usedMarker = marker;
        
        if (marker.includes('Forwarded') || marker.includes('forwarded')) {
          messageType = 'forwarded';
        } else {
          messageType = 'reply';
        }
      }
    }

    // Also check for quoted content (lines starting with >)
    const lines = body.split('\n');
    let quotedStartIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('>')) {
        quotedStartIndex = i;
        break;
      }
    }

    if (quotedStartIndex !== -1) {
      const quotedPosition = lines.slice(0, quotedStartIndex).join('\n').length;
      if (bestSplitPoint === -1 || quotedPosition < bestSplitPoint) {
        bestSplitPoint = quotedPosition;
        messageType = 'reply';
        usedMarker = 'quoted';
      }
    }

    // If no markers found, treat as single message
    if (bestSplitPoint === -1) {
      return { 
        currentMessage: body, 
        originalMessage: null, 
        allMessages: [{
          type: 'current',
          from: email.from || email.sender,
          to: email.to || 'me',
          date: email.date,
          subject: email.subject,
          content: body,
          isExpanded: true,
          id: depth
        }]
      };
    }

    // Split the content
    const currentMessage = body.substring(0, bestSplitPoint).trim();
    const originalContent = body.substring(bestSplitPoint).trim();

    // Prevent infinite loops by checking if we're parsing the same content
    if (currentMessage.length === 0 && originalContent.length < 50) {
      return {
        currentMessage: body,
        originalMessage: null,
        allMessages: [{
          type: 'current',
          from: email.from || email.sender,
          to: email.to || 'me',
          date: email.date,
          subject: email.subject,
          content: body,
          isExpanded: true,
          id: depth
        }]
      };
    }

    // Extract original message details with more flexible patterns
    let fromMatch, dateMatch, toMatch, subjectMatch;
    
    if (usedMarker === 'quoted') {
      // Handle quoted content (remove > from each line)
      const cleanContent = originalContent
        .split('\n')
        .map(line => line.replace(/^>\s*/, ''))
        .join('\n');
      
      return {
        currentMessage,
        originalMessage: {
          type: messageType,
          from: null,
          to: null,
          date: null,
          subject: null,
          content: cleanContent
        },
        allMessages: [
          {
            type: 'current',
            from: email.from || email.sender,
            to: email.to || 'me',
            date: email.date,
            subject: email.subject,
            content: currentMessage,
            isExpanded: true,
            id: depth
          },
          {
            type: messageType,
            from: 'Previous sender',
            to: email.from || email.sender,
            date: null,
            subject: email.subject ? email.subject.replace(/^(Re:|Fwd:)\s*/, '') : null,
            content: cleanContent,
            isExpanded: false,
            id: depth + 1
          }
        ]
      };
    }

    // More flexible regex patterns
    fromMatch = originalContent.match(/From:\s*(.+?)(?:\n|\r|$)/i) ||
               originalContent.match(/from:\s*(.+?)(?:\n|\r|$)/i);
    
    dateMatch = originalContent.match(/Date:\s*(.+?)(?:\n|\r|$)/i) ||
               originalContent.match(/date:\s*(.+?)(?:\n|\r|$)/i) ||
               originalContent.match(/Sent:\s*(.+?)(?:\n|\r|$)/i) ||
               originalContent.match(/On\s+(.+?)\s+at\s+(.+?)(?:\n|\r|,)/i);
    
    toMatch = originalContent.match(/To:\s*(.+?)(?:\n|\r|$)/i) ||
             originalContent.match(/to:\s*(.+?)(?:\n|\r|$)/i);
    
    subjectMatch = originalContent.match(/Subject:\s*(.+?)(?:\n|\r|$)/i) ||
                  originalContent.match(/subject:\s*(.+?)(?:\n|\r|$)/i);

    // Find the actual message content with more flexible approach
    let messageContent = originalContent;
    
    // Try to find content after headers
    const headerEndPatterns = [
      /\n\s*\n/,  // Double newline
      /\r\n\s*\r\n/,  // Windows double newline
      /Subject:.*?(\n|\r\n)/i  // After subject line
    ];
    
    for (const pattern of headerEndPatterns) {
      const match = originalContent.search(pattern);
      if (match !== -1) {
        const afterMatch = originalContent.substring(match).replace(/^\s*/, '');
        if (afterMatch.length > 0) {
          messageContent = afterMatch;
          break;
        }
      }
    }

    // If still no good content, try to extract from first non-header line
    if (messageContent === originalContent) {
      const lines = originalContent.split(/\n|\r\n/);
      let contentStartIndex = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && 
            !line.match(/^(From|To|Date|Subject|Sent|CC|BCC):/i) &&
            !line.match(/^-+/) &&
            !line.length < 3) {
          contentStartIndex = i;
          break;
        }
      }
      
      if (contentStartIndex > 0) {
        messageContent = lines.slice(contentStartIndex).join('\n').trim();
      }
    }

    // Clean up date format if it's a Gmail-style "On ... at ..." format
    let cleanDate = null;
    if (dateMatch) {
      if (dateMatch[0].includes('On ') && dateMatch[0].includes(' at ')) {
        // Handle "On Mon, Aug 11, 2025 at 3:28 PM" format
        cleanDate = dateMatch[0].replace(/^On\s+/, '').replace(/\s+wrote:?.*$/i, '');
      } else {
        cleanDate = dateMatch[1] ? dateMatch[1].trim() : dateMatch[0].trim();
      }
    }

    const allMessages = [
      {
        type: 'current',
        from: email.from || email.sender,
        to: email.to || 'me',
        date: email.date,
        subject: email.subject,
        content: currentMessage,
        isExpanded: true,
        id: depth
      },
      {
        type: messageType,
        from: fromMatch ? fromMatch[1].trim() : 'Previous sender',
        to: toMatch ? toMatch[1].trim() : (email.from || email.sender),
        date: cleanDate,
        subject: subjectMatch ? subjectMatch[1].trim() : (email.subject ? email.subject.replace(/^(Re:|Fwd:)\s*/, '') : null),
        content: messageContent,
        isExpanded: false,
        id: depth + 1
      }
    ];

    // Try to parse nested messages recursively if there's enough content and we haven't hit max depth
    if (messageContent && messageContent.length > 100 && depth < maxDepth) {
      try {
        // Only recurse if the content is significantly different from what we already have
        if (messageContent !== currentMessage && messageContent !== originalContent) {
          const nestedParse = parseEmailContent(messageContent, depth + 1, maxDepth);
          if (nestedParse.allMessages.length > 1) {
            // Add nested messages with updated IDs
            allMessages.push(...nestedParse.allMessages.slice(1).map((msg, index) => ({
              ...msg,
              id: depth + 2 + index
            })));
          }
        }
      } catch (error) {
        console.log('Error parsing nested content:', error);
      }
    }

    return {
      currentMessage,
      originalMessage: {
        type: messageType,
        from: fromMatch ? fromMatch[1].trim() : null,
        to: toMatch ? toMatch[1].trim() : null,
        date: cleanDate,
        subject: subjectMatch ? subjectMatch[1].trim() : null,
        content: messageContent
      },
      allMessages
    };
  };

  const toggleMessageExpansion = (messageId) => {
    const newExpanded = new Set(expandedMessages);
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId);
    } else {
      newExpanded.add(messageId);
    }
    setExpandedMessages(newExpanded);
  };

  const { currentMessage, originalMessage, allMessages } = parseEmailContent(email.body);
  
  // Debug log - only run once when component mounts or email changes
  if (email.body && allMessages.length > 1) {
    console.log(`Email parsed into ${allMessages.length} messages`);
  }
  
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return {
        date: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        }),
        time: date.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
      };
    } catch (error) {
      return { date: dateStr, time: '' };
    }
  };

  const emailDate = formatDate(email.date);

  return (
    <div className="email-details-container">
      <div className="email-details-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={16} />
          Back
        </button>
        <h2>{email.subject || 'No Subject'}</h2>
      </div>

      <div className="email-details-card">
        {/* Gmail-style Email Header */}
        <div className="gmail-header">
          <div className="email-subject">
            <h3>{email.subject || 'No Subject'}</h3>
            {(email.subject?.startsWith('Re:') || email.subject?.startsWith('Fwd:')) && (
              <span className="thread-indicator">
                {email.subject?.startsWith('Re:') ? '↩️ Reply' : '➡️ Forward'}
              </span>
            )}
          </div>

          <div className="sender-info-section">
            <div className="sender-main">
              <div className="sender-avatar">
                {(email.from || email.sender)?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="sender-details">
                <div className="sender-name">
                  <strong>{email.from || email.sender}</strong>
                </div>
                <div className="email-metadata">
                  <span className="to-info">
                    to {email.to || 'me'}
                  </span>
                  {email.cc && (
                    <span className="cc-info">
                      , cc: {email.cc}
                    </span>
                  )}
                </div>
              </div>
              <div className="timestamp">
                <div className="date">{emailDate.date}</div>
                <div className="time">{emailDate.time}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Email Body */}
        <div className="email-content-section">
          {/* Thread View - All Messages */}
          {allMessages.length > 1 ? (
            <div className="email-thread">
              {allMessages.map((message, index) => {
                const messageDate = formatDate(message.date);
                const isExpanded = expandedMessages.has(index);
                const isLatest = index === 0;
                
                return (
                  <div key={index} className={`thread-message ${isLatest ? 'latest-message' : 'previous-message'} ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    <div className="message-header" onClick={() => !isLatest && toggleMessageExpansion(index)}>
                      <div className="message-sender-info">
                        <div className="message-avatar">
                          {message.from?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="message-meta">
                          <div className="sender-name">
                            <strong>{message.from || 'Unknown'}</strong>
                          </div>
                          <div className="message-details">
                            <span className="message-to">to {message.to || 'me'}</span>
                            <span className="message-date">{messageDate.date} {messageDate.time}</span>
                          </div>
                        </div>
                      </div>
                      {!isLatest && (
                        <div className="expand-toggle">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      )}
                      {!isLatest && !isExpanded && (
                        <div className="message-preview">
                          {message.content && (
                            stripHtmlTags(message.content).substring(0, 80) + (stripHtmlTags(message.content).length > 80 ? '...' : '')
                          )}
                        </div>
                      )}
                    </div>
                    
                    {(isLatest || isExpanded) && (
                      <div className="message-body">
                        <div className="message-content">
                          {message.content ? (
                            // Check if content contains HTML
                            message.content.includes('<') && message.content.includes('>') ? (
                              <div dangerouslySetInnerHTML={{ __html: message.content }} />
                            ) : (
                              // Handle plain text with proper formatting
                              <div className="plain-text-content">
                                {message.content.split('\n').map((line, lineIndex) => (
                                  <div key={lineIndex} className="text-line">
                                    {line || '\u00A0'} {/* Non-breaking space for empty lines */}
                                  </div>
                                ))}
                              </div>
                            )
                          ) : (
                            <div className="no-content">No content available.</div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {index < allMessages.length - 1 && <div className="message-separator"></div>}
                  </div>
                );
                })}
              </div>

          ) : (
            /* Single Message View */
            <div className="single-message">
              <div className="message-content">
                {email.body && email.body.includes('<') ? (
                  <div dangerouslySetInnerHTML={{ __html: email.body }} />
                ) : (
                  <pre className="plain-text-body">{email.body || 'No content available.'}</pre>
                )}
              </div>
            </div>
          )   }
        </div>

        {/* Attachments Section */}
        {email.attachments && email.attachments.length > 0 && (
          <div className="email-attachments-section">
            <h4 className="attachments-title">
              📎 Attachments ({email.attachments.length})
            </h4>
            <div className="attachments-list">
              {email.attachments.map((attachment, index) => {
                // Determine attachment type and source
                const isCloudinaryFile = attachment.cloudinary || attachment.secure_url;
                const isLocalFile = attachment.path;
                const isDirectUrl = attachment.url;
                const isImapFile = attachment.hasContent;
                
                let attachmentIcon = '📄'; // Default
                let attachmentSource = 'Unknown';
                let canDownload = false;
                
                if (isCloudinaryFile) {
                  attachmentIcon = '☁️';
                  attachmentSource = 'Cloudinary Cloud Storage';
                  canDownload = true;
                } else if (isLocalFile) {
                  attachmentIcon = '📁';
                  attachmentSource = 'Local Server';
                  canDownload = true;
                } else if (isDirectUrl) {
                  attachmentIcon = '🔗';
                  attachmentSource = 'Direct URL';
                  canDownload = true;
                  if (isImapFile) {
                    attachmentIcon = '📧';
                    attachmentSource = 'Email Server (IMAP)';
                    canDownload = true; // Now supported!
                  }
                }
                
                return (
                  <div key={index} className="attachment-item">
                    <div className="attachment-icon">
                      {attachmentIcon}
                    </div>
                    <div className="attachment-info">
                      <div className="attachment-name">
                        {attachment.originalname || attachment.filename || attachment.name || `Attachment ${index + 1}`}
                      </div>
                      <div className="attachment-details">
                        {attachment.size && (
                          <span className="file-size">
                            {attachment.size > 1024 * 1024 ? 
                              `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 
                              `${(attachment.size / 1024).toFixed(1)} KB`}
                          </span>
                        )}
                        {attachment.cloudinary?.format && (
                          <span className="file-format">
                            • {attachment.cloudinary.format.toUpperCase()}
                          </span>
                        )}
                        {attachment.contentType && (
                          <span className="file-format">
                            • {attachment.contentType.split('/')[1]?.toUpperCase() || 'FILE'}
                          </span>
                        )}
                        <span className="attachment-source" style={{color: '#666', fontSize: '11px'}}>
                          • Source: {attachmentSource}
                        </span>
                        {/* Show Cloudinary URL for debugging */}
                        {isCloudinaryFile && (
                          <div style={{fontSize: '10px', color: '#888', marginTop: '2px'}}>
                            🔗 {(attachment.cloudinary?.secure_url || attachment.secure_url)?.substring(0, 50)}...
                          </div>
                        )}
                        {/* Show download availability */}
                        <span className={`download-status ${canDownload ? 'available' : 'unavailable'}`} style={{fontSize: '10px', display: 'block'}}>
                          {canDownload ? '✅ Can download' : '❌ Download not available'}
                        </span>
                      </div>
                    </div>
                    <div className="attachment-actions">
                      {/* Cloudinary files - View and Download */}
                      {isCloudinaryFile && (attachment.cloudinary?.secure_url || attachment.secure_url) && (
                        <>
                          <a
                            href={attachment.cloudinary?.secure_url || attachment.secure_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-button view-button"
                            title="View in new tab"
                          >
                            👁️ View
                          </a>
                          <button
                            onClick={() => downloadAttachment(attachment, index)}
                            className="attachment-button download-button"
                            title="Download file from Cloudinary"
                          >
                            📥 Download
                          </button>
                        </>
                      )}
                      {/* Local, Direct URL, and IMAP files */}
                      {(isLocalFile || isDirectUrl || isImapFile) && !isCloudinaryFile && (
                        <button
                          onClick={() => downloadAttachment(attachment, index)}
                          className="attachment-button download-button"
                          title={`Download ${attachmentSource} file`}
                        >
                          📥 Download
                        </button>
                      )}
                      {/* Unknown files */}
                      {!canDownload && (
                        <span className="attachment-button disabled-button" title="No download method available">
                          ❓ Unknown Source
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="email-actions">
          <button 
            className={`action-button reply-button ${isReplying ? 'active' : ''}`} 
            onClick={handleReplyClick}
          >
            <Reply size={16} />
            Reply
          </button>
          <button 
            className={`action-button forward-button ${isForwarding ? 'active' : ''}`} 
            onClick={handleForwardClick}
          >
            <Forward size={16} />
            Forward
          </button>
        </div>

        {/* Reply Box */}
        {isReplying && (
          <div className="reply-forward-box">
            <div className="reply-header">
              <div className="reply-title">
                <Reply size={16} />
                <span>Reply to {email.from || email.sender}</span>
              </div>
              <button className="close-reply" onClick={() => setIsReplying(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="reply-form">
              <div className="reply-to-info">
                <strong>To:</strong> {email.from || email.sender}
              </div>
              
              <textarea
                ref={replyTextareaRef}
                className="reply-textarea"
                placeholder="Type your reply here..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={6}
              />
              
              <div className="reply-actions">
                <button
                  className="send-reply-btn"
                  onClick={handleSendReply}
                  disabled={isSending || !replyText.trim()}
                >
                  {isSending ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      Send Reply
                    </>
                  )}
                </button>
                <button className="cancel-reply" onClick={() => setIsReplying(false)}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Original Message Toggle */}
            <div className="original-message-toggle">
              <button onClick={() => setShowOriginal(!showOriginal)}>
                {showOriginal ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                {showOriginal ? 'Hide' : 'Show'} original message
              </button>
            </div>

            {showOriginal && (
              <div className="original-message-preview">
                <div className="original-header">--- Original Message ---</div>
                <div className="original-info">
                  <div><strong>From:</strong> {email.from || email.sender}</div>
                  <div><strong>Date:</strong> {new Date(email.date).toLocaleString()}</div>
                  <div><strong>Subject:</strong> {email.subject || 'No Subject'}</div>
                </div>
                <div className="original-body">
                  {email.body ? (
                    email.body.length > 200 ? 
                      `${stripHtmlTags(email.body).substring(0, 200)}...` : 
                      stripHtmlTags(email.body)
                  ) : 'No content'}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forward Box */}
        {isForwarding && (
          <div className="reply-forward-box">
            <div className="reply-header">
              <div className="reply-title">
                <Forward size={16} />
                <span>Forward email</span>
              </div>
              <button className="close-reply" onClick={() => setIsForwarding(false)}>
                <X size={16} />
              </button>
            </div>
            
            <div className="reply-form">
              <div className="forward-recipients">
                <input
                  type="email"
                  className="forward-input"
                  placeholder="To: Enter recipient email"
                  value={forwardTo}
                  onChange={(e) => setForwardTo(e.target.value)}
                />
                
                {!showCc && (
                  <button
                    type="button"
                    className="add-cc-button"
                    onClick={() => setShowCc(true)}
                  >
                    + Cc
                  </button>
                )}

                {showCc && (
                  <div className="cc-input-container">
                    <input
                      type="email"
                      className="forward-input"
                      placeholder="Cc: Carbon copy"
                      value={forwardCc}
                      onChange={(e) => setForwardCc(e.target.value)}
                    />
                    <button
                      type="button"
                      className="remove-cc-button"
                      onClick={() => {
                        setShowCc(false);
                        setForwardCc('');
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
              
              <textarea
                ref={forwardTextareaRef}
                className="reply-textarea"
                placeholder="Add your message here..."
                value={forwardText}
                onChange={(e) => setForwardText(e.target.value)}
                rows={4}
              />
              
              <div className="reply-actions">
                <button
                  className="send-reply-btn"
                  onClick={handleSendForward}
                  disabled={isSending || !forwardTo.trim() || !forwardText.trim()}
                >
                  {isSending ? (
                    <span>Sending...</span>
                  ) : (
                    <>
                      <Send size={14} />
                      Forward Email
                    </>
                  )}
                </button>
                <button className="cancel-reply" onClick={() => setIsForwarding(false)}>
                  Cancel
                </button>
              </div>
            </div>

            {/* Original Message Preview for Forward */}
            <div className="original-message-preview">
              <div className="original-header">--- Forwarded Message ---</div>
              <div className="original-info">
                <div><strong>From:</strong> {email.from || email.sender}</div>
                <div><strong>Date:</strong> {new Date(email.date).toLocaleString()}</div>
                <div><strong>To:</strong> {email.to || ''}</div>
                <div><strong>Subject:</strong> {email.subject || 'No Subject'}</div>
              </div>
              <div className="original-body">
                {email.body ? (
                  email.body.length > 200 ? 
                    `${stripHtmlTags(email.body).substring(0, 200)}...` : 
                    stripHtmlTags(email.body)
                ) : 'No content'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailDetails;
