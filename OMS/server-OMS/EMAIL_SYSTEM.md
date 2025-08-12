# Email System Documentation

## Overview
This email system provides a complete email management solution for the OMS (Office Management System). It supports sending, receiving, and managing emails through user-configured SMTP/IMAP credentials.

## Project Structure

```
server-OMS/
├── config/
│   └── emailConfig.js          # Email service configuration (Hostinger)
├── controllers/
│   └── emailController.js      # Email business logic
├── middlewares/
│   └── emailMiddleware.js      # Email validation & file upload
├── models/
│   └── emailModel.js          # Database schemas for emails
├── routes/
│   └── emailRoutes.js         # API endpoints
└── services/
    ├── emailService.js        # General email service
    └── emailCredentialService.js # User credential management
```

## Features

### 1. Email Configuration
- User-specific SMTP/IMAP credentials
- Support for Hostinger email service
- Credential validation and testing
- Secure password storage

### 2. Email Operations
- Send emails with attachments
- Fetch inbox emails via IMAP
- Manage drafts
- Email history tracking
- Rate limiting for email sending

### 3. File Attachments
- Support for multiple file types (images, documents, archives)
- 25MB file size limit per attachment
- Up to 10 attachments per email
- Memory-based storage for better performance

## API Endpoints

### Email Configuration
```
POST   /api/emails/configure     # Configure user email credentials
GET    /api/emails/config        # Get user email configuration
DELETE /api/emails/config        # Remove user email credentials
GET    /api/emails/suggestions   # Get email suggestions for user
```

### Email Operations
```
POST   /api/emails/send          # Send email with attachments
POST   /api/emails/fetch         # Fetch emails from IMAP
GET    /api/emails/content/:uid  # Get specific email content
```

### Draft Management
```
POST   /api/emails/drafts        # Save draft
PUT    /api/emails/drafts/:id    # Update draft
GET    /api/emails/drafts        # Get user drafts
DELETE /api/emails/drafts/:id    # Delete draft
```

### Email History
```
GET    /api/emails/sent          # Get sent emails
GET    /api/emails/received      # Get received emails
```

### Testing
```
GET    /api/emails/test          # Test email service
```

## Database Models

### Email Model
```javascript
{
  userId: ObjectId,
  messageId: String,
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  subject: String,
  textContent: String,
  htmlContent: String,
  attachments: [{
    filename: String,
    size: Number,
    contentType: String,
    path: String
  }],
  sentAt: Date,
  receivedAt: Date,
  folder: String,
  flags: [String],
  status: String, // 'sent', 'received', 'draft', 'failed'
  read: Boolean
}
```

### Draft Email Model
```javascript
{
  userId: ObjectId,
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  subject: String,
  textContent: String,
  htmlContent: String,
  attachments: [{
    filename: String,
    size: Number,
    contentType: String,
    content: Buffer
  }],
  lastModified: Date
}
```

### Email Configuration Model
```javascript
{
  userId: ObjectId,
  smtpEmail: String,
  smtpPassword: String,
  smtpHost: String,
  smtpPort: Number,
  imapHost: String,
  imapPort: Number,
  lastSync: Date,
  isActive: Boolean
}
```

## Environment Variables

```env
# Default SMTP settings (fallback)
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password

# Default IMAP settings (fallback)
IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
IMAP_USER=your-email@yourdomain.com
IMAP_PASS=your-password
```

## Security Features

1. **Rate Limiting**: 10 emails per hour per user
2. **File Type Validation**: Only allowed file types
3. **File Size Limits**: 25MB per attachment
4. **Email Validation**: Proper email format validation
5. **Credential Encryption**: Encrypted storage of user passwords
6. **Authentication Required**: All endpoints require valid JWT

## Usage Examples

### Configure User Email
```javascript
POST /api/emails/configure
{
  "smtpEmail": "user@company.com",
  "smtpPassword": "password123",
  "testOnly": false
}
```

### Send Email with Attachments
```javascript
POST /api/emails/send
Content-Type: multipart/form-data

{
  "to": ["recipient@example.com"],
  "cc": ["cc@example.com"],
  "subject": "Test Email",
  "text": "Plain text content",
  "html": "<h1>HTML content</h1>",
  "attachments": [file1, file2]
}
```

### Fetch Inbox Emails
```javascript
POST /api/emails/fetch
{
  "folder": "INBOX",
  "limit": 20,
  "sortBy": "date",
  "sortOrder": "desc"
}
```

## Error Handling

The system includes comprehensive error handling for:
- Invalid credentials
- Connection timeouts
- Network errors
- File upload errors
- Rate limiting violations
- Database errors

## Cleanup and Optimization

The system includes automatic cleanup for:
- Finished calendar events (every 30 minutes)
- Old rate limiting data
- Temporary file storage

## Best Practices

1. Always test credentials before saving
2. Use appropriate file size limits
3. Implement proper error handling
4. Log important operations
5. Validate all user inputs
6. Use secure connection settings
7. Monitor rate limits

## Troubleshooting

### Common Issues

1. **SMTP Connection Failed**
   - Check credentials
   - Verify SMTP settings
   - Check firewall/network

2. **IMAP Timeout**
   - Increase timeout values
   - Check IMAP server status
   - Verify credentials

3. **File Upload Errors**
   - Check file size limits
   - Verify file types
   - Check storage space

4. **Rate Limit Exceeded**
   - Wait for time window to reset
   - Check user sending patterns
   - Adjust rate limits if needed
