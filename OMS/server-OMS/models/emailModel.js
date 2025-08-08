const mongoose = require('mongoose');

// Email Schema for sent/received emails
const emailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  messageId: String,
  from: {
    type: String,
    required: true
  },
  to: [{
    type: String,
    required: true
  }],
  cc: [String],
  bcc: [String],
  subject: {
    type: String,
    default: ''
  },
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
  folder: {
    type: String,
    default: 'INBOX'
  },
  flags: [String],
  status: {
    type: String,
    enum: ['sent', 'received', 'draft', 'failed'],
    default: 'sent'
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Draft Email Schema
const draftEmailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  from: String,
  to: [String],
  cc: [String],
  bcc: [String],
  subject: {
    type: String,
    default: ''
  },
  textContent: String,
  htmlContent: String,
  attachments: [{
    filename: String,
    size: Number,
    contentType: String,
    content: Buffer
  }],
  lastModified: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Email Configuration Schema for user-specific email settings
const emailConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  smtpEmail: {
    type: String,
    required: true
  },
  smtpPassword: {
    type: String,
    required: true
  },
  smtpHost: String,
  smtpPort: Number,
  imapHost: String,
  imapPort: Number,
  lastSync: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create indexes for better performance
emailSchema.index({ userId: 1, status: 1, sentAt: -1 });
emailSchema.index({ userId: 1, folder: 1, receivedAt: -1 });
draftEmailSchema.index({ userId: 1, lastModified: -1 });
emailConfigSchema.index({ userId: 1 });

const Email = mongoose.model('Email', emailSchema);
const DraftEmail = mongoose.model('DraftEmail', draftEmailSchema);
const EmailConfig = mongoose.model('EmailConfig', emailConfigSchema);

module.exports = {
  Email,
  DraftEmail,
  EmailConfig
};
