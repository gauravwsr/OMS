const mongoose = require('mongoose');

const sentEmailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  cc: {
    type: String,
    default: ''
  },
  bcc: {
    type: String,
    default: ''
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    originalname: String,
    size: Number,
    mimetype: String,
    path: String,
    // Cloudinary specific fields
    cloudinary: {
      public_id: String,
      secure_url: String,
      url: String,
      format: String,
      bytes: Number,
      created_at: String,
      resource_type: String
    }
  }],
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  isReply: {
    type: Boolean,
    default: false
  },
  isForward: {
    type: Boolean,
    default: false
  },
  originalMessageId: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['sent', 'failed'],
    default: 'sent'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ['local', 'imap'],
    default: 'local'
  }
}, {
  timestamps: true
});

// Add indexes for better query performance
sentEmailSchema.index({ userId: 1, sentAt: -1 });
sentEmailSchema.index({ messageId: 1 });
sentEmailSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('SentEmail', sentEmailSchema);
